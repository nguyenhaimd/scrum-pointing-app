
import { useEffect, useState, useCallback, useRef } from 'react';
import { AppState, Action, User, Story, UserRole, TimerState, Reaction } from '../types';
import { db } from '../firebaseConfig';
import { STALE_USER_TIMEOUT } from '../constants';
// We import firebase to access types if needed, although 'db' is typed from config usually.
// In v8, we operate directly on the 'db' object references.
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';

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

    const sessionRef = db.ref(`sessions/${roomId}`);

    const handleValue = (snapshot: firebase.database.DataSnapshot) => {
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
    };

    sessionRef.on('value', handleValue);

    return () => {
        sessionRef.off('value', handleValue);
    };
  }, [roomId, currentUser]);

  // 2. MANAGE PRESENCE (Self) & CONNECTION & CLEANUP
  useEffect(() => {
    if (!currentUser || !db) return;

    const userRef = db.ref(`sessions/${roomId}/users/${currentUser.id}`);
    const rootRef = db.ref(`sessions/${roomId}`);
    const connectedRef = db.ref('.info/connected');

    const handleConnected = (snap: firebase.database.DataSnapshot) => {
      const connected = snap.val();
      setIsConnected(!!connected);

      if (connected === true) {
        userRef.onDisconnect().update({ isOnline: false }).then(() => {
            // When user joins/reconnects, we explicitly set sessionStatus to 'active'
            rootRef.update({ 
                [`users/${currentUser.id}`]: { 
                    ...currentUser,
                    isOnline: true, 
                    lastHeartbeat: Date.now() 
                },
                sessionStatus: 'active'
            });
        });
      }
    };

    connectedRef.on('value', handleConnected);

    // Increase heartbeat frequency to 15s (from 60s) to allow more accurate disconnect timers
    const interval = setInterval(() => {
        if (!db) return;
        const now = Date.now();
        userRef.update({ lastHeartbeat: now }).catch(() => {});

        if (currentUser.role === UserRole.SCRUM_MASTER) {
            // Cleanup old reactions (older than 1 minute)
            const reactionsRef = db.ref(`sessions/${roomId}/reactions`);
            reactionsRef.once('value').then(snap => {
                if(snap.exists()) {
                    snap.forEach(child => {
                        if (now - child.val().timestamp > 60000) {
                            child.ref.remove();
                        }
                    });
                }
            });
        }
    }, 15000);

    return () => {
        connectedRef.off('value', handleConnected);
        clearInterval(interval);
        if (db) {
             userRef.update({ isOnline: false }).catch(() => {});
        }
    };
  }, [currentUser, roomId]);

  // 3. DISPATCHER
  const dispatch = useCallback(async (action: Action) => {
    if (!roomId || !db) return;
    
    const rootPath = `sessions/${roomId}`;

    switch (action.type) {
      case 'ADD_STORY':
        await db.ref(`${rootPath}/stories/${action.payload.id}`).set(action.payload);
        break;

      case 'DELETE_STORY':
        await db.ref(`${rootPath}/stories/${action.payload}`).remove();
        if (state.currentStoryId === action.payload) {
             await db.ref(rootPath).update({ currentStoryId: null, areVotesRevealed: false });
        }
        break;

      case 'SET_CURRENT_STORY':
        await db.ref(rootPath).update({ 
            currentStoryId: action.payload,
            areVotesRevealed: false
        });
        if (action.payload) {
            await db.ref(`${rootPath}/stories/${action.payload}`).update({ status: 'active' });
            await db.ref(`${rootPath}/timer`).set({
                status: 'paused',
                startTime: null,
                accumulated: 0
            });
        }
        break;

      case 'VOTE':
        if (!state.currentStoryId) return;
        await db.ref(`${rootPath}/stories/${state.currentStoryId}/votes`).update({
            [action.payload.userId]: action.payload.value
        });
        break;

      case 'REVEAL_VOTES':
        await db.ref(rootPath).update({ areVotesRevealed: true });
        break;

      case 'RESET_VOTES':
        if (!state.currentStoryId) return;
        await db.ref(`${rootPath}/stories/${state.currentStoryId}/votes`).remove();
        await db.ref(rootPath).update({ areVotesRevealed: false });
        break;

      case 'FINISH_STORY':
        await db.ref(`${rootPath}/stories/${action.payload.storyId}`).update({
            status: 'completed',
            finalPoints: action.payload.points
        });
        
        if (state.timer.status === 'running') {
            const now = Date.now();
            const elapsed = state.timer.startTime ? now - state.timer.startTime : 0;
            await db.ref(`${rootPath}/timer`).update({
                status: 'paused',
                startTime: null,
                accumulated: state.timer.accumulated + elapsed
            });
        }
        break;

      case 'SEND_MESSAGE':
        const msgRef = db.ref(`${rootPath}/chatMessages`).push();
        await msgRef.set(action.payload);
        break;

      case 'UPDATE_STORY':
        if(action.payload.id) {
            await db.ref(`${rootPath}/stories/${action.payload.id}`).update(action.payload);
        }
        break;

      case 'CLEAR_QUEUE':
        await db.ref(`${rootPath}/stories`).set({});
        await db.ref(`${rootPath}/chatMessages`).remove();
        await db.ref(rootPath).update({ currentStoryId: null, areVotesRevealed: false });
        await db.ref(`${rootPath}/timer`).set({ status: 'paused', startTime: null, accumulated: 0 });
        break;

      case 'END_SESSION':
        await db.ref(rootPath).set({
            sessionStatus: 'ended'
        });
        break;
        
      case 'REMOVE_USER':
         await db.ref(`${rootPath}/users/${action.payload}`).remove();
         break;

      case 'START_TIMER':
         if (state.timer.status === 'running') return;
         await db.ref(`${rootPath}/timer`).update({
             status: 'running',
             startTime: Date.now(),
             accumulated: state.timer.accumulated
         });
         break;

      case 'PAUSE_TIMER':
         if (state.timer.status === 'paused') return;
         const now = Date.now();
         const elapsed = state.timer.startTime ? now - state.timer.startTime : 0;
         await db.ref(`${rootPath}/timer`).update({
             status: 'paused',
             startTime: null,
             accumulated: state.timer.accumulated + elapsed
         });
         break;

      case 'RESET_TIMER':
         await db.ref(`${rootPath}/timer`).set({
             status: 'paused',
             startTime: null,
             accumulated: 0
         });
         break;

      case 'SEND_REACTION':
          const rRef = db.ref(`${rootPath}/reactions`).push();
          const reaction: Reaction = {
              id: rRef.key!,
              userId: action.payload.userId,
              emoji: action.payload.emoji,
              timestamp: Date.now()
          };
          await rRef.set(reaction);
          break;

      case 'JOIN_SESSION':
        break;
        
      default:
        console.warn('Unhandled action:', action);
    }
  }, [roomId, state]);

  return { state, dispatch, isConnected };
};
