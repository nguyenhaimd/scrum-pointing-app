
import { useEffect, useState, useCallback, useRef } from 'react';
import { AppState, Action, User, Story, UserRole, TimerState, Reaction } from '../types';
import { db } from '../firebaseConfig';
import { ref, onValue, set, update, remove, onDisconnect, push, query, limitToLast, get } from 'firebase/database';
import { STALE_USER_TIMEOUT } from '../constants';

// Initial empty state
const initialState: AppState = {
  users: {},
  stories: [],
  currentStoryId: null,
  areVotesRevealed: false,
  chatMessages: [],
  timer: {
    status: 'paused',
    startTime: null,
    accumulated: 0
  },
  lastReaction: null,
  sessionStatus: 'active'
};

export const useAppStore = (currentUser: User | null) => {
  const [state, setState] = useState<AppState>(initialState);
  const [isConnected, setIsConnected] = useState(!!db);
  
  const usersRef = useRef<Record<string, User>>({});
  const roomId = currentUser?.room ? currentUser.room.replace(/[^a-zA-Z0-9]/g, '_') : 'default';

  // 1. LISTEN to Firebase Data
  useEffect(() => {
    if (!currentUser || !db) return;

    const sessionRef = ref(db, `sessions/${roomId}`);

    const unsubscribe = onValue(sessionRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const rawStories = data.stories ? Object.values(data.stories) : [];
        
        const storiesArray = rawStories.map((s: any) => ({
            ...s,
            acceptanceCriteria: Array.isArray(s.acceptanceCriteria) ? s.acceptanceCriteria : [],
            votes: s.votes || {}
        }));

        const chatArray = data.chatMessages ? Object.values(data.chatMessages) : [];
        chatArray.sort((a: any, b: any) => a.timestamp - b.timestamp);

        const rawUsers = data.users || {};
        const cleanUsers: Record<string, User> = {};

        Object.entries(rawUsers).forEach(([key, value]: [string, any]) => {
            if (value && typeof value === 'object') {
                cleanUsers[key] = {
                    ...value,
                    id: key,
                    name: typeof value.name === 'string' ? value.name : 'Unknown User',
                    role: value.role || UserRole.OBSERVER,
                    isOnline: !!value.isOnline,
                    avatar: value.avatar || '👤',
                    deviceType: value.deviceType || 'desktop'
                } as User;
            }
        });

        usersRef.current = cleanUsers;

        const timerData: TimerState = data.timer ? {
            status: data.timer.status || 'paused',
            startTime: data.timer.startTime || null,
            accumulated: data.timer.accumulated || 0
        } : initialState.timer;

        // Parse Reactions
        // We only want to trigger state update if there is a NEW reaction.
        // Logic: find the reaction with largest timestamp.
        let newLastReaction: Reaction | null = null;
        if (data.reactions) {
            const allReactions = Object.values(data.reactions) as Reaction[];
            if (allReactions.length > 0) {
                // Sort descending
                allReactions.sort((a, b) => b.timestamp - a.timestamp);
                const latest = allReactions[0];
                // Only consider it 'new' if it happened in the last 2 seconds to avoid replaying history on reload
                if (latest.timestamp > Date.now() - 3000) {
                    newLastReaction = latest;
                }
            }
        }

        setState(prev => ({
          users: cleanUsers,
          stories: storiesArray as Story[],
          currentStoryId: data.currentStoryId || null,
          areVotesRevealed: data.areVotesRevealed || false,
          chatMessages: chatArray as any[],
          timer: timerData,
          lastReaction: newLastReaction !== null && newLastReaction.id !== prev.lastReaction?.id ? newLastReaction : prev.lastReaction,
          sessionStatus: data.sessionStatus || 'active'
        }));
      } else {
        setState(initialState);
        usersRef.current = {};
      }
    });

    return () => unsubscribe();
  }, [roomId, currentUser]);

  // 2. MANAGE PRESENCE (Self) & CONNECTION & CLEANUP
  useEffect(() => {
    if (!currentUser || !db) return;

    const userRef = ref(db, `sessions/${roomId}/users/${currentUser.id}`);
    const rootRef = ref(db, `sessions/${roomId}`);
    const connectedRef = ref(db, '.info/connected');

    const unsubscribeConnected = onValue(connectedRef, (snap) => {
      const connected = snap.val();
      setIsConnected(!!connected);

      if (connected === true) {
        onDisconnect(userRef).update({ isOnline: false }).then(() => {
            // When user joins/reconnects, we explicitly set sessionStatus to 'active'
            // This ensures that if they are logging back in after an END_SESSION, the room is reset for them.
            update(rootRef, { 
                [`users/${currentUser.id}`]: { 
                    ...currentUser,
                    isOnline: true, 
                    lastHeartbeat: Date.now() 
                },
                sessionStatus: 'active'
            });
        });
      }
    });

    const interval = setInterval(() => {
        if (!db) return;
        const now = Date.now();
        update(userRef, { lastHeartbeat: now }).catch(() => {});

        if (currentUser.role === UserRole.SCRUM_MASTER) {
            const currentUsers = usersRef.current;
            Object.values(currentUsers).forEach((user) => {
                if (now - user.lastHeartbeat > STALE_USER_TIMEOUT) {
                    remove(ref(db, `sessions/${roomId}/users/${user.id}`));
                }
            });
            
            // Cleanup old reactions (older than 1 minute)
            const reactionsRef = ref(db, `sessions/${roomId}/reactions`);
            get(query(reactionsRef)).then(snap => {
                if(snap.exists()) {
                    snap.forEach(child => {
                        if (now - child.val().timestamp > 60000) {
                            remove(child.ref);
                        }
                    });
                }
            });
        }
    }, 60000);

    return () => {
        unsubscribeConnected();
        clearInterval(interval);
        if (db) {
             update(userRef, { isOnline: false }).catch(() => {});
        }
    };
  }, [currentUser, roomId]);

  // 3. DISPATCHER
  const dispatch = useCallback(async (action: Action) => {
    if (!roomId || !db) return;
    
    const rootPath = `sessions/${roomId}`;

    switch (action.type) {
      case 'ADD_STORY':
        await set(ref(db, `${rootPath}/stories/${action.payload.id}`), action.payload);
        break;

      case 'DELETE_STORY':
        await remove(ref(db, `${rootPath}/stories/${action.payload}`));
        if (state.currentStoryId === action.payload) {
             await update(ref(db, rootPath), { currentStoryId: null, areVotesRevealed: false });
        }
        break;

      case 'SET_CURRENT_STORY':
        await update(ref(db, rootPath), { 
            currentStoryId: action.payload,
            areVotesRevealed: false
        });
        if (action.payload) {
            await update(ref(db, `${rootPath}/stories/${action.payload}`), { status: 'active' });
            await set(ref(db, `${rootPath}/timer`), {
                status: 'paused',
                startTime: null,
                accumulated: 0
            });
        }
        break;

      case 'VOTE':
        if (!state.currentStoryId) return;
        await update(ref(db, `${rootPath}/stories/${state.currentStoryId}/votes`), {
            [action.payload.userId]: action.payload.value
        });
        break;

      case 'REVEAL_VOTES':
        await update(ref(db, rootPath), { areVotesRevealed: true });
        break;

      case 'RESET_VOTES':
        if (!state.currentStoryId) return;
        await remove(ref(db, `${rootPath}/stories/${state.currentStoryId}/votes`));
        await update(ref(db, rootPath), { areVotesRevealed: false });
        break;

      case 'FINISH_STORY':
        await update(ref(db, `${rootPath}/stories/${action.payload.storyId}`), {
            status: 'completed',
            finalPoints: action.payload.points
        });
        // NOTE: We do NOT clear currentStoryId here anymore. 
        // We keep the finished story on the table to show the result.
        // The Scrum Master must explicitly move to the next story.
        
        if (state.timer.status === 'running') {
            const now = Date.now();
            const elapsed = state.timer.startTime ? now - state.timer.startTime : 0;
            await update(ref(db, `${rootPath}/timer`), {
                status: 'paused',
                startTime: null,
                accumulated: state.timer.accumulated + elapsed
            });
        }
        break;

      case 'SEND_MESSAGE':
        const msgRef = push(ref(db, `${rootPath}/chatMessages`));
        await set(msgRef, action.payload);
        break;

      case 'UPDATE_STORY':
        if(action.payload.id) {
            await update(ref(db, `${rootPath}/stories/${action.payload.id}`), action.payload);
        }
        break;

      case 'CLEAR_QUEUE':
        await set(ref(db, `${rootPath}/stories`), {});
        await remove(ref(db, `${rootPath}/chatMessages`));
        await update(ref(db, rootPath), { currentStoryId: null, areVotesRevealed: false });
        await set(ref(db, `${rootPath}/timer`), { status: 'paused', startTime: null, accumulated: 0 });
        break;

      case 'END_SESSION':
        // Wipes everything and sets status to 'ended'
        // This triggers clients to log out
        await set(ref(db, rootPath), {
            sessionStatus: 'ended'
        });
        break;
        
      case 'REMOVE_USER':
         await remove(ref(db, `${rootPath}/users/${action.payload}`));
         break;

      case 'START_TIMER':
         if (state.timer.status === 'running') return;
         await update(ref(db, `${rootPath}/timer`), {
             status: 'running',
             startTime: Date.now(),
             accumulated: state.timer.accumulated
         });
         break;

      case 'PAUSE_TIMER':
         if (state.timer.status === 'paused') return;
         const now = Date.now();
         const elapsed = state.timer.startTime ? now - state.timer.startTime : 0;
         await update(ref(db, `${rootPath}/timer`), {
             status: 'paused',
             startTime: null,
             accumulated: state.timer.accumulated + elapsed
         });
         break;

      case 'RESET_TIMER':
         await set(ref(db, `${rootPath}/timer`), {
             status: 'paused',
             startTime: null,
             accumulated: 0
         });
         break;

      case 'SEND_REACTION':
          const rRef = push(ref(db, `${rootPath}/reactions`));
          const reaction: Reaction = {
              id: rRef.key!,
              userId: action.payload.userId,
              emoji: action.payload.emoji,
              timestamp: Date.now()
          };
          await set(rRef, reaction);
          break;

      case 'JOIN_SESSION':
        break;
        
      default:
        console.warn('Unhandled action:', action);
    }
  }, [roomId, state]);

  return { state, dispatch, isConnected };
};