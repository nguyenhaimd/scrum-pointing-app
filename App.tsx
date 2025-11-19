import React, { useEffect, useState } from 'react';
import Login from './components/Login';
import PokerTable from './components/PokerTable';
import VotingControls from './components/VotingControls';
import StoryPanel from './components/StoryPanel';
import ChatPanel from './components/ChatPanel';
import { useAppStore } from './services/store';
import { User } from './types';
import { USER_STORAGE_KEY } from './constants';

const App: React.FC = () => {
  // Local User State
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Try to restore session on mount
  useEffect(() => {
    const storedUser = sessionStorage.getItem(USER_STORAGE_KEY);
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
      } catch (e) {
        sessionStorage.removeItem(USER_STORAGE_KEY);
      }
    }
  }, []);

  // Sync with Simulated Backend
  const { state, dispatch } = useAppStore(currentUser);
  
  // Derived State
  const currentStory = state.stories.find(s => s.id === state.currentStoryId) || null;
  const onlineUsers = (Object.values(state.users) as User[]).filter(u => u.isOnline);
  const allUsers = Object.values(state.users) as User[];

  // Actions
  const handleJoin = (user: User) => {
    sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    setCurrentUser(user);
  };

  const handleLogout = () => {
      sessionStorage.removeItem(USER_STORAGE_KEY);
      setCurrentUser(null);
      window.location.reload();
  };

  // View
  if (!currentUser) {
    return <Login onJoin={handleJoin} />;
  }

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-white overflow-hidden">
      
      {/* Header */}
      <header className="h-16 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-4 md:px-6 shrink-0">
        <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-1.5 rounded-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            </div>
            <div className="hidden md:block">
                <h1 className="font-bold text-lg leading-none">Gemini Scrum Poker</h1>
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
                    <div className="text-sm font-bold text-white">{currentUser.name}</div>
                    <div className="text-xs text-indigo-400">{currentUser.role}</div>
                </div>
                <div className="w-8 h-8 flex items-center justify-center bg-slate-700 rounded-full text-lg">
                    {currentUser.avatar || '👤'}
                </div>
                <button onClick={handleLogout} className="text-slate-400 hover:text-white ml-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                </button>
            </div>
        </div>
      </header>

      {/* Main Content Grid */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* Left Sidebar: Stories */}
        <StoryPanel 
            stories={state.stories}
            currentStoryId={state.currentStoryId}
            userRole={currentUser.role}
            onAddStory={(story) => dispatch({ type: 'ADD_STORY', payload: story })}
            onDeleteStory={(id) => dispatch({ type: 'DELETE_STORY', payload: id })}
            onSelectStory={(id) => dispatch({ type: 'SET_CURRENT_STORY', payload: id })}
        />

        {/* Center: Poker Table */}
        <div className="flex-1 relative flex flex-col bg-slate-900">
            {/* Main Visual Area */}
            <PokerTable 
                users={onlineUsers}
                currentStory={currentStory}
                areVotesRevealed={state.areVotesRevealed}
                currentUserRole={currentUser.role}
                onReveal={() => dispatch({ type: 'REVEAL_VOTES' })}
                onReset={() => dispatch({ type: 'RESET_VOTES' })}
                onNext={() => {
                    if(!currentStory) return;
                    
                    // 1. Calculate result (Mode or Average, user requested just finishing)
                    // We'll just take the most common vote as the "suggested" final point
                    const validVotes = Object.values(currentStory.votes).filter(v => v !== '?' && v !== '☕');
                    
                    // Simple mode calculation
                    const counts: Record<string, number> = {};
                    let maxCount = 0;
                    let mode = validVotes[0] || 0;
                    
                    validVotes.forEach(v => {
                        const s = String(v);
                        counts[s] = (counts[s] || 0) + 1;
                        if (counts[s] > maxCount) {
                            maxCount = counts[s];
                            mode = v;
                        }
                    });

                    dispatch({ type: 'FINISH_STORY', payload: { storyId: currentStory.id, points: mode } });
                    
                    // 2. Automatically select next pending story
                    const nextStory = state.stories.find(s => s.status === 'pending' && s.id !== currentStory.id);
                    if (nextStory) {
                        dispatch({ type: 'SET_CURRENT_STORY', payload: nextStory.id });
                    }
                }}
            />

            {/* Current Story Detail Overlay (when active) */}
            {currentStory && (
                <div className="absolute top-4 left-4 right-4 md:left-10 md:right-10 bg-slate-800/90 backdrop-blur rounded-xl p-4 border border-slate-700 shadow-lg z-20 max-h-32 overflow-y-auto">
                    <h3 className="font-bold text-lg text-white sticky top-0">{currentStory.title}</h3>
                    <p className="text-slate-300 text-sm mt-1">{currentStory.description || 'No description provided.'}</p>
                    {currentStory.acceptanceCriteria?.length > 0 && (
                        <ul className="mt-2 list-disc list-inside text-xs text-slate-400">
                            {currentStory.acceptanceCriteria.map((ac, i) => <li key={i}>{ac}</li>)}
                        </ul>
                    )}
                </div>
            )}
            
            {/* Voting Hand */}
            <VotingControls 
                currentStory={currentStory}
                currentUser={currentUser}
                selectedVote={currentStory?.votes?.[currentUser.id]}
                disabled={state.areVotesRevealed}
                onVote={(val) => dispatch({ type: 'VOTE', payload: { userId: currentUser.id, value: val } })}
            />
        </div>

        {/* Right Sidebar: Chat */}
        <ChatPanel 
            messages={state.chatMessages}
            currentUser={currentUser}
            users={allUsers}
            currentStory={currentStory}
            onSendMessage={(msg) => dispatch({ type: 'SEND_MESSAGE', payload: msg })}
        />

      </div>
    </div>
  );
};

export default App;