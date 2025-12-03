
import React, { useEffect, useState, useRef, useMemo } from 'react';
import Login from './components/Login';
import PokerTable from './components/PokerTable';
import VotingControls from './components/VotingControls';
import StoryPanel from './components/StoryPanel';
import ChatPanel from './components/ChatPanel';
import { useAppStore } from './services/store';
import { User } from './types';
import { USER_STORAGE_KEY, SOUND_PREF_KEY, STALE_USER_TIMEOUT, DISCONNECT_GRACE_PERIOD } from './constants';
import { setMuted, playSound } from './services/soundService';

type MobileView = 'stories' | 'table' | 'chat';

interface Toast {
    id: string;
    message: string;
    type?: 'info' | 'error' | 'success';
    persistent?: boolean;
}

const App: React.FC = () => {
  // Local User State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [mobileView, setMobileView] = useState<MobileView>('table');
  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [now, setNow] = useState(Date.now());

  // Try to restore session on mount from localStorage (persists across close/reopen)
  useEffect(() => {
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
      } catch (e) {
        localStorage.removeItem(USER_STORAGE_KEY);
      }
    }

    const storedMute = localStorage.getItem(SOUND_PREF_KEY);
    if (storedMute) {
        const muted = storedMute === 'true';
        setIsSoundMuted(muted);
        setMuted(muted);
    }

    // Update 'now' every 5 seconds to update disconnected states more frequently
    const interval = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(interval);
  }, []);

  const toggleMute = () => {
      const newState = !isSoundMuted;
      setIsSoundMuted(newState);
      setMuted(newState);
      localStorage.setItem(SOUND_PREF_KEY, String(newState));
  };

  // Sync with Simulated Backend
  const { state, dispatch, isConnected } = useAppStore(currentUser);
  
  // Derived State
  const currentStory = state.stories.find(s => s.id === state.currentStoryId) || null;
  
  // Filter users: 
  // 1. Must not be stale (older than STALE_USER_TIMEOUT)
  // 2. Either IS online OR (IS offline BUT within DISCONNECT_GRACE_PERIOD)
  const visibleUsers = useMemo(() => {
    return (Object.values(state.users) as User[])
      .filter(u => {
          const isStale = (now - u.lastHeartbeat) > STALE_USER_TIMEOUT;
          if (isStale) return false;

          // Always show online users
          if (u.isOnline) return true;
          
          // Show disconnected users if they are within the grace period
          return (now - u.lastHeartbeat) < DISCONNECT_GRACE_PERIOD;
      })
      .sort((a, b) => {
          // Sort online users first, then offline users, then by name
          if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
          return a.name.localeCompare(b.name);
      });
  }, [state.users, now]);

  // Actual online count logic
  const totalVisible = visibleUsers.length;
  const onlineCount = visibleUsers.filter(u => u.isOnline).length;
  const disconnectedCount = totalVisible - onlineCount;

  const prevVisibleUsersRef = useRef<User[]>([]);

  // Notification logic for joins/leaves
  useEffect(() => {
      const curr = visibleUsers;
      const prev = prevVisibleUsersRef.current;

      // If this is the first time we see users (and we found some), just update ref and skip notifications
      if (prev.length === 0 && curr.length > 0) {
          prevVisibleUsersRef.current = curr;
          return;
      }

      const prevMap = new Map(prev.map(u => [u.id, u]));

      // 1. Detect New Joins & Reconnects
      curr.forEach(u => {
           if (!prevMap.has(u.id)) {
              if (u.id !== currentUser?.id) {
                 addToast(`${u.name} joined`, 'info');
                 playSound.join();
              }
           } else {
               // Reconnected?
               const oldU = prevMap.get(u.id);
               if (oldU && !oldU.isOnline && u.isOnline) {
                   addToast(`${u.name} reconnected`, 'info');
               }
           }
      });
      
      // 2. Detect Leaves - REMOVED annoying toast and sound as requested.
      // The visual state in the PokerTable (greyed out) and the Header (Team Health) is enough.

      prevVisibleUsersRef.current = curr;
  }, [visibleUsers, currentUser]);

  const addToast = (message: string, type: Toast['type'] = 'info', persistent = false) => {
      const id = crypto.randomUUID();
      setToasts(prev => [...prev, { id, message, type, persistent }]);
      
      if (!persistent) {
          setTimeout(() => {
              removeToast(id);
          }, 4000);
      }
  };

  const removeToast = (id: string) => {
      setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Actions
  const handleJoin = (user: User) => {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    setCurrentUser(user);
  };

  const handleLogout = () => {
      localStorage.removeItem(USER_STORAGE_KEY);
      setCurrentUser(null);
      window.location.reload();
  };
  
  // Force logout if session ends
  useEffect(() => {
      if (state.sessionStatus === 'ended') {
          handleLogout();
      }
  }, [state.sessionStatus]);

  // View
  if (!currentUser) {
    return <Login onJoin={handleJoin} />;
  }

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-white overflow-hidden relative">
      
      {/* Toast Container */}
      <div className="fixed top-20 right-4 z-[80] flex flex-col gap-2 pointer-events-auto">
          {toasts.map(t => (
              <div 
                key={t.id} 
                className={`
                    px-4 py-3 rounded-lg shadow-xl backdrop-blur-md animate-fade-in flex items-center gap-3 border
                    ${t.type === 'error' 
                        ? 'bg-red-900/90 border-red-500/50 text-white' 
                        : 'bg-slate-800/90 border-indigo-500/50 text-white'
                    }
                `}
              >
                  <span className={`w-2 h-2 rounded-full shrink-0 ${t.type === 'error' ? 'bg-red-500' : 'bg-indigo-500'}`}></span>
                  <span className="text-sm font-medium">{t.message}</span>
                  
                  {t.persistent && (
                      <button 
                        onClick={() => removeToast(t.id)}
                        className="ml-2 p-1 hover:bg-white/10 rounded text-white/70 hover:text-white transition-colors"
                      >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                          </svg>
                      </button>
                  )}
              </div>
          ))}
      </div>

      {/* Disconnected Banner */}
      { !isConnected && (
        <div className="bg-red-600 text-white text-center py-1 z-[60] text-sm font-bold animate-pulse flex justify-center items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            <span>Connection lost. Reconnecting...</span>
            <button onClick={() => window.location.reload()} className="underline hover:text-red-100 ml-2 text-xs border border-white/30 px-2 py-0.5 rounded">
                Reload
            </button>
        </div>
      )}

      {/* Header */}
      <header className="h-16 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-4 md:px-6 shrink-0 z-50">
        <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-1.5 rounded-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            </div>
            <div className="hidden sm:block">
                <h1 className="font-bold text-lg leading-none">HighWind's Scrum Poker</h1>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                   <span>Room: {currentUser.room}</span>
                   <span className="text-slate-600">•</span>
                   {disconnectedCount > 0 ? (
                       <span className="flex items-center gap-1.5 text-amber-400 font-medium bg-amber-900/20 px-2 py-0.5 rounded-full border border-amber-900/50 animate-pulse">
                           <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                           Waiting for {disconnectedCount}...
                       </span>
                   ) : (
                       <span className="flex items-center gap-1.5 text-emerald-400 font-medium bg-emerald-900/20 px-2 py-0.5 rounded-full border border-emerald-900/50">
                           <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                           All Connected
                       </span>
                   )}
                </div>
            </div>
        </div>
        
        <div className="flex items-center gap-4">
             {currentStory && (
                 <div className="hidden md:flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-full border border-slate-700">
                     <span className="text-xs text-slate-400 uppercase font-bold">Current:</span>
                     <span className="text-sm font-medium truncate max-w-[150px]">{currentStory.title}</span>
                 </div>
             )}
            
            <div className="flex items-center gap-3 pl-4 border-l border-slate-700">
                <button 
                    onClick={toggleMute}
                    className={`p-1.5 rounded-lg transition-colors ${isSoundMuted ? 'text-slate-500 hover:text-slate-300' : 'text-indigo-400 hover:text-indigo-300 bg-indigo-900/20'}`}
                    title={isSoundMuted ? "Unmute Sounds" : "Mute Sounds"}
                >
                    {isSoundMuted ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"></path></svg>
                    ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path></svg>
                    )}
                </button>

                <div className="text-right hidden sm:block">
                    <div className="text-sm font-bold text-white max-w-[100px] truncate">{currentUser.name}</div>
                    <div className="text-xs text-indigo-400">{currentUser.role}</div>
                </div>
                <div className="w-8 h-8 flex items-center justify-center bg-slate-700 rounded-full text-lg">
                    {currentUser.avatar || '👤'}
                </div>
                <button onClick={handleLogout} className="text-slate-400 hover:text-white ml-2" title="Logout">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                </button>
            </div>
        </div>
      </header>

      {/* Main Content Grid */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Left Sidebar: Stories (Hidden on mobile unless selected) */}
        <div className={`
            absolute inset-0 z-20 bg-slate-900 md:static md:w-80 md:flex md:flex-col md:border-r md:border-slate-700
            ${mobileView === 'stories' ? 'flex flex-col' : 'hidden'}
        `}>
            <StoryPanel 
                stories={state.stories}
                users={visibleUsers}
                currentStoryId={state.currentStoryId}
                userRole={currentUser.role}
                onAddStory={(story) => dispatch({ type: 'ADD_STORY', payload: story })}
                onDeleteStory={(id) => dispatch({ type: 'DELETE_STORY', payload: id })}
                onClearQueue={() => dispatch({ type: 'END_SESSION' })}
                onRemoveUser={(id) => dispatch({ type: 'REMOVE_USER', payload: id })}
                onSelectStory={(id) => {
                    dispatch({ type: 'SET_CURRENT_STORY', payload: id });
                    setMobileView('table'); // Switch to table on mobile after selection
                }}
            />
        </div>

        {/* Center: Poker Table (Hidden on mobile unless selected) */}
        <div className={`
            flex-1 relative flex-col bg-slate-900
            ${mobileView === 'table' ? 'flex' : 'hidden md:flex'}
        `}>
            {/* Main Visual Area */}
            <PokerTable 
                users={visibleUsers}
                currentStory={currentStory}
                areVotesRevealed={state.areVotesRevealed}
                currentUserRole={currentUser.role}
                timer={state.timer}
                onStartTimer={() => dispatch({ type: 'START_TIMER' })}
                onPauseTimer={() => dispatch({ type: 'PAUSE_TIMER' })}
                onResetTimer={() => dispatch({ type: 'RESET_TIMER' })}
                onReveal={() => dispatch({ type: 'REVEAL_VOTES' })}
                onReset={() => dispatch({ type: 'RESET_VOTES' })}
                lastReaction={state.lastReaction}
                onReaction={(emoji) => dispatch({ type: 'SEND_REACTION', payload: { emoji, userId: currentUser.id } })}
                onNext={(finalPoints) => {
                    if(!currentStory) return;
                    dispatch({ type: 'FINISH_STORY', payload: { storyId: currentStory.id, points: finalPoints } });
                    // Also clear the current story so the consensus screen disappears and we go back to waiting state
                    dispatch({ type: 'SET_CURRENT_STORY', payload: null });
                }}
                onNextStory={() => {
                    const nextStory = state.stories.find(s => s.status === 'pending' && s.id !== currentStory?.id);
                    if (nextStory) {
                        dispatch({ type: 'SET_CURRENT_STORY', payload: nextStory.id });
                    } else {
                        dispatch({ type: 'SET_CURRENT_STORY', payload: null });
                    }
                }}
            />

            {/* Voting Hand (Disabled if story is completed) will this work ?*/}
            {currentStory?.status !== 'completed' && (
                <VotingControls 
                    currentStory={currentStory}
                    currentUser={currentUser}
                    selectedVote={currentStory?.votes?.[currentUser.id]}
                    disabled={state.areVotesRevealed}
                    onVote={(val) => dispatch({ type: 'VOTE', payload: { userId: currentUser.id, value: val } })}
                />
            )}
        </div>

        {/* Right Sidebar: Chat (Hidden on mobile unless selected) */}
        <div className={`
            absolute inset-0 z-20 bg-slate-900 md:static md:w-80 md:flex md:flex-col md:border-l md:border-slate-700
            ${mobileView === 'chat' ? 'flex flex-col' : 'hidden'}
        `}>
            <ChatPanel 
                messages={state.chatMessages}
                currentUser={currentUser}
                users={visibleUsers}
                currentStory={currentStory}
                onSendMessage={(msg) => dispatch({ type: 'SEND_MESSAGE', payload: msg })}
                onRemoveUser={(userId) => dispatch({ type: 'REMOVE_USER', payload: userId })}
            />
        </div>

      </div>

      {/* Persistent Bottom Mobile Navigation */}
      <div className="md:hidden bg-slate-800 border-t border-slate-700 flex justify-around items-center shrink-0 z-50">
          <button 
            onClick={() => setMobileView('stories')}
            className={`flex flex-col items-center justify-center w-full py-2 pb-safe transition-colors active:bg-slate-700/50 ${mobileView === 'stories' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <svg className="w-6 h-6 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
            <span className="text-[10px] font-bold tracking-wide">Stories</span>
          </button>
          
          <button 
            onClick={() => setMobileView('table')}
            className={`flex flex-col items-center justify-center w-full py-2 pb-safe transition-colors active:bg-slate-700/50 ${mobileView === 'table' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <svg className="w-6 h-6 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
            <span className="text-[10px] font-bold tracking-wide">Table</span>
          </button>
          
          <button 
            onClick={() => setMobileView('chat')}
            className={`flex flex-col items-center justify-center w-full py-2 pb-safe transition-colors active:bg-slate-700/50 ${mobileView === 'chat' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <svg className="w-6 h-6 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
            <span className="text-[10px] font-bold tracking-wide">Chat</span>
          </button>
      </div>

    </div>
  );
};

export default App;
