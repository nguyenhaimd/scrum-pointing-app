
import React, { useState, useEffect, useRef } from 'react';
// @ts-ignore
import confetti from 'canvas-confetti';
import { ChatMessage, User, Story, UserRole } from '../types';
import { getChuckNorrisJoke } from '../services/geminiService';

interface ChatPanelProps {
  messages: ChatMessage[];
  currentUser: User;
  users: User[];
  currentStory: Story | null;
  onSendMessage: (msg: ChatMessage) => void;
  onRemoveUser?: (userId: string) => void;
  chuckBotEnabled: boolean;
  onToggleChuckBot: () => void;
}

const DeviceIcon: React.FC<{ type: 'mobile' | 'tablet' | 'desktop' }> = ({ type }) => {
    if (type === 'mobile') {
        return (
            <svg className="w-3 h-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <title>Mobile</title>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
            </svg>
        );
    }
    if (type === 'tablet') {
        return (
            <svg className="w-3 h-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <title>Tablet</title>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
            </svg>
        );
    }
    return (
        <svg className="w-3 h-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <title>Desktop</title>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
        </svg>
    );
};

const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  currentUser,
  users,
  currentStory,
  onSendMessage,
  onRemoveUser,
  chuckBotEnabled,
  onToggleChuckBot
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'people'>('chat');
  const [input, setInput] = useState('');
  const [isGettingJoke, setIsGettingJoke] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTab === 'chat' && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, activeTab]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const text = input.trim();
    setInput('');

    // Easter egg: Haifetti
    if (text.toLowerCase() === 'haifetti') {
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#6366f1', '#8b5cf6', '#ec4899']
        });
    }

    // 1. Send User Message
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      userId: currentUser.id,
      userName: currentUser.name,
      text,
      timestamp: Date.now()
    };
    onSendMessage(userMsg);
  };

  const handleDeleteUser = (userId: string, userName: string) => {
      if (window.confirm(`Are you sure you want to remove ${userName} from the session?`)) {
          onRemoveUser?.(userId);
      }
  };
  
  const handleManualChuck = async () => {
      if (isGettingJoke) return;
      setIsGettingJoke(true);
      try {
          const joke = await getChuckNorrisJoke();
          const botMsg: ChatMessage = {
              id: crypto.randomUUID(),
              userId: 'chuck-norris-bot',
              userName: 'Chuck Norris Fact 🤠',
              text: joke,
              timestamp: Date.now(),
              isAi: true,
              isSystem: false
          };
          onSendMessage(botMsg);
      } catch (e) {
          console.error(e);
      } finally {
          setIsGettingJoke(false);
      }
  };

  // Sort users: Online first, then by name.
  const sortedUsers = [...users].sort((a, b) => {
    const nameA = String(a.name || 'Unknown');
    const nameB = String(b.name || 'Unknown');

    if (a.isOnline === b.isOnline) return nameA.localeCompare(nameB);
    return a.isOnline ? -1 : 1;
  });

  const isScrumMaster = currentUser.role === UserRole.SCRUM_MASTER;
  const onlineCount = users.filter(u => u.isOnline).length;

  return (
    <div className="flex flex-col h-[40vh] md:h-full bg-slate-800 border-t border-slate-700 md:border-t-0 md:border-l md:w-80">
      {/* Tabs Header */}
      <div className="flex border-b border-slate-700 bg-slate-900/50">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'chat' 
              ? 'text-indigo-400 border-b-2 border-indigo-500 bg-slate-700/30' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
          }`}
        >
          Team Chat
        </button>
        <button
          onClick={() => setActiveTab('people')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'people' 
              ? 'text-indigo-400 border-b-2 border-indigo-500 bg-slate-700/30' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
          }`}
        >
          People ({onlineCount})
        </button>
        {isScrumMaster && (
             <button 
                onClick={onToggleChuckBot}
                className={`px-3 py-1 flex items-center justify-center border-l border-slate-700 ${chuckBotEnabled ? 'text-amber-400 bg-amber-900/10' : 'text-slate-600'}`}
                title={chuckBotEnabled ? "Disable Chuck Bot" : "Enable Chuck Bot"}
             >
                 <span className="text-lg">🤠</span>
                 <span className={`ml-1 w-2 h-2 rounded-full ${chuckBotEnabled ? 'bg-amber-400 animate-pulse' : 'bg-slate-600'}`}></span>
             </button>
        )}
      </div>

      {/* Chat Tab Content */}
      {activeTab === 'chat' && (
        <>
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide"
          >
            {messages.map(msg => {
              if (msg.isSystem) {
                  return (
                    <div key={msg.id} className="flex justify-center my-2 opacity-75 animate-fade-in">
                      <span className="text-[10px] uppercase tracking-wide text-slate-400 font-bold bg-slate-700/30 px-3 py-0.5 rounded-full border border-slate-700/50 shadow-sm">
                        {msg.text}
                      </span>
                    </div>
                  );
              }

              const isMe = msg.userId === currentUser.id;
              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className={`text-xs font-bold ${msg.isAi ? 'text-indigo-400' : 'text-slate-400'}`}>
                        {msg.userName}
                    </span>
                    <span className="text-[10px] text-slate-600">
                        {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  <div className={`
                    px-3 py-2 rounded-lg text-sm max-w-[90%] break-words
                    ${isMe ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-700 text-slate-200 rounded-tl-none'}
                    ${msg.isAi ? 'border border-indigo-500/50 bg-slate-900 shadow-lg' : ''}
                  `}>
                    {msg.text}
                  </div>
                </div>
              );
            })}
          </div>

          <form onSubmit={handleSend} className="p-3 bg-slate-800 border-t border-slate-700 flex gap-2">
            <button
                type="button"
                onClick={handleManualChuck}
                disabled={isGettingJoke}
                className="w-8 h-8 rounded-full bg-amber-900/30 text-amber-500 border border-amber-800 flex items-center justify-center hover:bg-amber-800/50 transition-colors disabled:opacity-50"
                title="Summon Chuck Norris"
            >
                {isGettingJoke ? (
                    <span className="animate-spin text-xs">↻</span>
                ) : (
                    <span className="text-lg">👊</span>
                )}
            </button>
            <input
              className="flex-1 bg-slate-900 border border-slate-600 rounded-full px-4 py-2 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none"
              placeholder="Type a message..."
              value={input}
              onChange={e => setInput(e.target.value)}
            />
            <button 
              type="submit"
              disabled={!input}
              className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-500 disabled:opacity-50 transition-colors"
            >
              <svg className="w-4 h-4 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
            </button>
          </form>
        </>
      )}

      {/* People Tab Content */}
      {activeTab === 'people' && (
        <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
          <div className="space-y-1">
            {sortedUsers.map(user => (
              <div key={user.id} className={`flex items-center gap-3 p-2 rounded transition-colors group ${user.isOnline ? 'hover:bg-slate-700/50' : 'opacity-60 bg-slate-800/30'}`}>
                <div className="relative">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-lg border
                    ${user.isOnline ? 'bg-slate-700 border-indigo-400' : 'bg-slate-800 border-slate-600 grayscale'}
                  `}>
                    {user.avatar || '👤'}
                  </div>
                  <div className={`
                    absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-slate-800 rounded-full
                    ${user.isOnline ? 'bg-emerald-500' : 'bg-red-500 border-slate-900'}
                  `}></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <p className={`text-sm font-medium truncate ${user.isOnline ? 'text-slate-200' : 'text-slate-500 italic'}`}>
                      {user.name || 'Unknown User'} {user.id === currentUser.id && '(You)'}
                    </p>
                    <DeviceIcon type={user.deviceType || 'desktop'} />
                  </div>
                  <p className={`text-xs ${user.isOnline ? 'text-slate-500' : 'text-red-400'}`}>{user.isOnline ? user.role : 'Disconnected'}</p>
                </div>

                {/* Scrum Master Remove Button */}
                {isScrumMaster && user.id !== currentUser.id && (
                    <button 
                        onClick={() => handleDeleteUser(user.id, user.name || 'User')}
                        className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-500 p-1 transition-all"
                        title="Remove User"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                    </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPanel;
