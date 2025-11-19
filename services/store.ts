import { useEffect, useState, useCallback } from 'react';
import { AppState, Action, User, Story } from '../types';
import { db } from '../firebaseConfig';
import { ref, onValue, set, update, remove, onDisconnect, push, serverTimestamp } from 'firebase/database';

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
  const [isConnected, setIsConnected] = useState(true);
  const roomId = currentUser?.room ? currentUser.room.replace(/[^a-zA-Z0-9]/g, '_') : 'default'; // Sanitize room name for path

  // 1. LISTEN to Firebase Data
  useEffect(() => {
    if (!currentUser) return;

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

        setState({
          users: data.users || {},
          stories: storiesArray as Story[],
          currentStoryId: data.currentStoryId || null,
          areVotesRevealed: data.areVotesRevealed || false,
          chatMessages: chatArray as any[],
        });
      } else {
        setState(initialState);
      }
    });

    return () => unsubscribe();
  }, [roomId, currentUser]);

  // 2. MANAGE PRESENCE (Self) & CONNECTION
  useEffect(() => {
    if (!currentUser) return;

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
             // We use update to ensure we don't overwrite other fields if they changed,
             // but we do want to ensure our latest user details are synced.
            update(userRef, { 
                ...currentUser,
                isOnline: true, 
                lastHeartbeat: Date.now() 
            });
        });
      }
    });

    // Keep heartbeat alive just in case (optional in Firebase but good for "idle" logic)
    const interval = setInterval(() => {
        if (isConnected) {
            update(userRef, { lastHeartbeat: Date.now() });
        }
    }, 60000);

    return () => {
        unsubscribeConnected();
        clearInterval(interval);
        // We don't remove on unmount/logout immediately to prevent flickering, 
        // but let's mark offline
        update(userRef, { isOnline: false });
    };
  }, [currentUser, roomId]);

  // 3. DISPATCHER (Writes to Firebase)
  const dispatch = useCallback(async (action: Action) => {
    if (!roomId) return;
    
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

      case 'JOIN_SESSION':
        // Handled by the effect above
        break;
        
      default:
        console.warn('Unhandled action:', action);
    }
  }, [roomId, state.currentStoryId]);

  return { state, dispatch, isConnected };
};