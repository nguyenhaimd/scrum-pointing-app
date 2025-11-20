
import React, { useEffect, useState } from 'react';
import Login from './components/Login';
import PokerTable from './components/PokerTable';
import VotingControls from './components/VotingControls';
import StoryPanel from './components/StoryPanel';
import ChatPanel from './components/ChatPanel';
import { useAppStore } from './services/store';
import { User } from './types';
import { USER_STORAGE_KEY } from './constants';

type MobileView = 'stories' | 'table' | 'chat';

const App: React.FC = () => {
  // Local User State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [mobileView, setMobileView] = useState<MobileView>('table');

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
  }, []);

  // Sync with Simulated Backend
  const { state, dispatch, isConnected } = useAppStore(currentUser);
  
  // Derived State
  const currentStory = state.stories.find(s => s.id === state.currentStoryId) || null;
  const onlineUsers = (Object.values(state.users) as User[]).filter(u => u.isOnline);
  const allUsers = Object.values(state.users) as User[];

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
    <div className="flex flex-col h-screen bg-slate-900 text-white overflow-hidden">
      
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
                <p className="text-xs text-slate-400">Room: {currentUser.room}</p>
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
                <div className="text-right">
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

      {/* Mobile Tabs Navigation */}
      <div className="md:hidden flex border-b border-slate-700 bg-slate-800 shrink-0 text-sm font-medium">
          <button 
            onClick={() => setMobileView('stories')}
            className={`flex-1 py-3 text-center border-b-2 ${mobileView === 'stories' ? 'border-indigo-500 text-indigo-400 bg-slate-700/30' : 'border-transparent text-slate-400'}`}
          >
            Stories
          </button>
          <button 
            onClick={() => setMobileView('table')}
            className={`flex-1 py-3 text-center border-b-2 ${mobileView === 'table' ? 'border-indigo-500 text-indigo-400 bg-slate-700/30' : 'border-transparent text-slate-400'}`}
          >
            Table
          </button>
          <button 
            onClick={() => setMobileView('chat')}
            className={`flex-1 py-3 text-center border-b-2 ${mobileView === 'chat' ? 'border-indigo-500 text-indigo-400 bg-slate-700/30' : 'border-transparent text-slate-400'}`}
          >
            Chat
          </button>
      </div>

      {/* Main Content Grid */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Left Sidebar: Stories (Hidden on mobile unless selected) */}
        <div className={`
            absolute inset-0 z-20 bg-slate-900 md:static md:w-80 md:flex md:flex-col md:border-r md:border-slate-700
            ${mobileView === 'stories' ? 'flex flex-col' : 'hidden'}
        `}>
            <StoryPanel 
                stories={state.stories}
                currentStoryId={state.currentStoryId}
                userRole={currentUser.role}
                onAddStory={(story) => dispatch({ type: 'ADD_STORY', payload: story })}
                onDeleteStory={(id) => dispatch({ type: 'DELETE_STORY', payload: id })}
                onClearQueue={() => dispatch({ type: 'END_SESSION' })}
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
                users={onlineUsers}
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

            {/* Current Story Detail Overlay (when active) */}
            {currentStory && (
                <div className="absolute top-4 left-4 right-4 md:left-10 md:right-10 bg-slate-800/90 backdrop-blur rounded-xl p-3 md:p-4 border border-slate-700 shadow-lg z-20 max-h-32 overflow-y-auto mt-12 md:mt-0">
                    <h3 className="font-bold text-base md:text-lg text-white sticky top-0">{currentStory.title}</h3>
                    <p className="text-slate-300 text-xs md:text-sm mt-1">{currentStory.description || 'No description provided.'}</p>
                    {currentStory.acceptanceCriteria?.length > 0 && (
                        <ul className="mt-2 list-disc list-inside text-[10px] md:text-xs text-slate-400">
                            {currentStory.acceptanceCriteria.map((ac, i) => <li key={i}>{ac}</li>)}
                        </ul>
                    )}
                </div>
            )}
            
            {/* Voting Hand (Disabled if story is completed) */}
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
                users={allUsers}
                currentStory={currentStory}
                onSendMessage={(msg) => dispatch({ type: 'SEND_MESSAGE', payload: msg })}
                onRemoveUser={(userId) => dispatch({ type: 'REMOVE_USER', payload: userId })}
            />
        </div>

      </div>
    </div>
  );
};

export default App;