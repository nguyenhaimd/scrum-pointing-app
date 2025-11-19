import { useEffect, useState, useCallback, useRef } from 'react';
import { AppState, Action, User, Story, UserRole } from '../types';
import { db } from '../firebaseConfig';
import { ref, onValue, set, update, remove, onDisconnect, push } from 'firebase/database';
import { STALE_USER_TIMEOUT } from '../constants';

// Initial empty state
const initialState: AppState = {
  users: {},
  stories: [],
  currentStoryId: null,
  areVotesRevealed: false,
  chatMessages: [],
};

export const useAppStore = (currentUser: User | null) => {
  const [state, setState] = useState<AppState>(initialState);
  // Initialize connected state based on DB availability. 
  // If DB is missing, start as false so the UI can show an error banner if needed.
  const [isConnected, setIsConnected] = useState(!!db);
  
  // Use a ref to access the latest state inside intervals without triggering re-renders
  const usersRef = useRef<Record<string, User>>({});

  const roomId = currentUser?.room ? currentUser.room.replace(/[^a-zA-Z0-9]/g, '_') : 'default'; // Sanitize room name for path

  // 1. LISTEN to Firebase Data
  useEffect(() => {
    if (!currentUser || !db) return;

    const sessionRef = ref(db, `sessions/${roomId}`);

    const unsubscribe = onValue(sessionRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Firebase stores lists as Objects with IDs as keys. 
        // We convert stories back to Array for the UI to consume easily.
        const rawStories = data.stories ? Object.values(data.stories) : [];
        
        // Sanitize stories to ensure arrays exist (prevents 'length of undefined' errors)
        const storiesArray = rawStories.map((s: any) => ({
            ...s,
            acceptanceCriteria: Array.isArray(s.acceptanceCriteria) ? s.acceptanceCriteria : [],
            votes: s.votes || {}
        }));

        const chatArray = data.chatMessages ? Object.values(data.chatMessages) : [];
        
        // Sort chat by timestamp just in case
        chatArray.sort((a: any, b: any) => a.timestamp - b.timestamp);

        const users = data.users || {};
        usersRef.current = users;

        setState({
          users: users,
          stories: storiesArray as Story[],
          currentStoryId: data.currentStoryId || null,
          areVotesRevealed: data.areVotesRevealed || false,
          chatMessages: chatArray as any[],
        });
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
    const connectedRef = ref(db, '.info/connected');

    const unsubscribeConnected = onValue(connectedRef, (snap) => {
      const connected = snap.val();
      setIsConnected(!!connected);

      if (connected === true) {
        // We are connected (or reconnected).
        // 1. Establish the onDisconnect hook to mark us offline if we drop.
        onDisconnect(userRef).update({ isOnline: false }).then(() => {
             // 2. Set us as online.
            update(userRef, { 
                ...currentUser,
                isOnline: true, 
                lastHeartbeat: Date.now() 
            });
        });
      }
    });

    // Keep heartbeat alive and Clean up stale users
    const interval = setInterval(() => {
        if (!db) return;

        const now = Date.now();

        // 1. Update my heartbeat
        update(userRef, { lastHeartbeat: now }).catch(() => {});

        // 2. If I am the Scrum Master, perform cleanup duty
        if (currentUser.role === UserRole.SCRUM_MASTER) {
            const currentUsers = usersRef.current;
            Object.values(currentUsers).forEach((user) => {
                // If user hasn't sent a heartbeat in X minutes, remove them entirely
                if (now - user.lastHeartbeat > STALE_USER_TIMEOUT) {
                    console.log(`Removing stale user: ${user.name}`);
                    remove(ref(db, `sessions/${roomId}/users/${user.id}`));
                }
            });
        }

    }, 60000); // Run every minute

    return () => {
        unsubscribeConnected();
        clearInterval(interval);
        // We don't remove on unmount/logout immediately to prevent flickering, 
        // but let's mark offline
        if (db) {
             update(userRef, { isOnline: false }).catch(() => {});
        }
    };
  }, [currentUser, roomId]);

  // 3. DISPATCHER (Writes to Firebase)
  const dispatch = useCallback(async (action: Action) => {
    if (!roomId || !db) return;
    
    const rootPath = `sessions/${roomId}`;

    switch (action.type) {
      case 'ADD_STORY':
        // Use the story ID as the key
        await set(ref(db, `${rootPath}/stories/${action.payload.id}`), action.payload);
        break;

      case 'DELETE_STORY':
        await remove(ref(db, `${rootPath}/stories/${action.payload}`));
        // If deleting the active story, reset currentStoryId
        if (state.currentStoryId === action.payload) {
             await update(ref(db, rootPath), { currentStoryId: null, areVotesRevealed: false });
        }
        break;

      case 'SET_CURRENT_STORY':
        await update(ref(db, rootPath), { 
            currentStoryId: action.payload,
            areVotesRevealed: false
        });
        // Also update the story status to active
        await update(ref(db, `${rootPath}/stories/${action.payload}`), { status: 'active' });
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
        await update(ref(db, rootPath), { 
            currentStoryId: null, 
            areVotesRevealed: false 
        });
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
        // Remove all stories
        await set(ref(db, `${rootPath}/stories`), {});
        // Reset current story state
        await update(ref(db, rootPath), { currentStoryId: null, areVotesRevealed: false });
        break;
        
      case 'REMOVE_USER':
         await remove(ref(db, `${rootPath}/users/${action.payload}`));
         break;

      case 'JOIN_SESSION':
        // Handled by the effect above
        break;
        
      default:
        console.warn('Unhandled action:', action);
    }
  }, [roomId, state.currentStoryId]);

  return { state, dispatch, isConnected };
};