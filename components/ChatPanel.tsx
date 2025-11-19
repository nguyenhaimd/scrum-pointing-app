import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, User, Story } from '../types';

interface ChatPanelProps {
  messages: ChatMessage[];
  currentUser: User;
  users: User[];
  currentStory: Story | null;
  onSendMessage: (msg: ChatMessage) => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  currentUser,
  users,
  currentStory,
  onSendMessage
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'people'>('chat');
  const [input, setInput] = useState('');
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

  // Sort users: Online first, then by name
  const sortedUsers = [...users].sort((a, b) => {
    if (a.isOnline === b.isOnline) return a.name.localeCompare(b.name);
    return a.isOnline ? -1 : 1;
  });

  return (
    <div className="flex flex-col h-[40vh] md:h-full bg-slate-800 border-t border-slate-700 md:border-t-0 md:border-l md:w-80">
      {/* Tabs Header */}
      <div className="flex border-b border-slate-700">
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
          People ({users.filter(u => u.isOnline).length})
        </button>
      </div>

      {/* Chat Tab Content */}
      {activeTab === 'chat' && (
        <>
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide"
          >
            {messages.map(msg => {
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
                    ${msg.isAi ? 'border border-indigo-500/50 bg-slate-900' : ''}
                  `}>
                    {msg.text}
                  </div>
                </div>
              );
            })}
          </div>

          <form onSubmit={handleSend} className="p-3 bg-slate-800 border-t border-slate-700 flex gap-2">
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
              <div key={user.id} className="flex items-center gap-3 p-2 rounded hover:bg-slate-700/50 transition-colors">
                <div className="relative">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-lg border
                    ${user.isOnline ? 'bg-slate-700 border-indigo-400' : 'bg-slate-700 border-slate-500 grayscale opacity-50'}
                  `}>
                    {user.avatar || '👤'}
                  </div>
                  <div className={`
                    absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-slate-800 rounded-full
                    ${user.isOnline ? 'bg-emerald-500' : 'bg-slate-500'}
                  `}></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <p className={`text-sm font-medium truncate ${user.isOnline ? 'text-slate-200' : 'text-slate-500'}`}>
                      {user.name} {user.id === currentUser.id && '(You)'}
                    </p>
                  </div>
                  <p className="text-xs text-slate-500">{user.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPanel;