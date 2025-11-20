
import React, { useState } from 'react';
import { Story, UserRole } from '../types';
import Button from './Button';

interface StoryPanelProps {
  stories: Story[];
  currentStoryId: string | null;
  userRole: UserRole;
  onAddStory: (story: Story) => void;
  onSelectStory: (id: string) => void;
  onDeleteStory?: (id: string) => void;
  onClearQueue?: () => void; // Now serves as "End Session" trigger
}

// Helper component for status icons
const StatusIcon = ({ status }: { status: Story['status'] }) => {
  if (status === 'active') {
    return (
      <div className="relative flex items-center justify-center w-5 h-5 shrink-0" title="Active">
        <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-indigo-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.6)]"></span>
      </div>
    );
  }
  if (status === 'completed') {
    return (
       <div className="w-5 h-5 shrink-0 flex items-center justify-center text-emerald-400" title="Completed">
          <svg className="w-5 h-5 drop-shadow-sm" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
       </div>
    );
  }
  // Pending
  return (
      <div className="w-5 h-5 shrink-0 flex items-center justify-center text-slate-500" title="Pending">
         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
         </svg>
      </div>
  );
};

const StoryPanel: React.FC<StoryPanelProps> = ({
  stories,
  currentStoryId,
  userRole,
  onAddStory,
  onSelectStory,
  onDeleteStory,
  onClearQueue
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [showEndSessionModal, setShowEndSessionModal] = useState(false);

  // Strict permission: Only Scrum Master can edit/manage. PO is read-only.
  const canManageStories = userRole === UserRole.SCRUM_MASTER;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    
    const story: Story = {
      id: crypto.randomUUID(),
      title: newTitle,
      description: newDescription,
      acceptanceCriteria: [],
      status: 'pending',
      votes: {}
    };

    onAddStory(story);
    setNewTitle('');
    setNewDescription('');
  };

  const handleEndSessionClick = () => {
    setShowEndSessionModal(true);
  };

  const confirmEndSession = () => {
    setShowEndSessionModal(false);
    onClearQueue?.();
  };

  return (
    <div className="bg-slate-800 border-b border-slate-700 md:border-b-0 md:border-r md:w-80 flex flex-col h-full transition-all relative">
      <div className="p-4 border-b border-slate-700 flex justify-between items-center shrink-0">
        <h2 className="font-semibold text-slate-200">Stories</h2>
        <div className="flex items-center gap-2">
             <span className="text-xs bg-slate-700 px-2 py-1 rounded text-slate-400">{stories.length} Total</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
        {stories.length === 0 && (
          <div className="text-center text-slate-500 mt-10 text-sm">
            No stories yet.<br/>
            {canManageStories ? "Add one to start pointing." : "Waiting for Scrum Master."}
          </div>
        )}
        {stories.map(story => {
          const isCurrent = story.id === currentStoryId;
          return (
            <div 
              key={story.id}
              className={`
                group relative p-3 rounded-xl border transition-all duration-200
                ${isCurrent 
                    ? 'bg-indigo-900/40 border-indigo-500 ring-1 ring-indigo-500 shadow-[0_4px_15px_rgba(99,102,241,0.15)] scale-[1.02] z-10' 
                    : 'bg-slate-700/50 border-slate-600 hover:border-slate-500 hover:bg-slate-700 z-0'
                }
                ${story.status === 'completed' && !isCurrent ? 'opacity-60 grayscale-[0.3]' : 'opacity-100'}
              `}
            >
              {/* Delete Button (Only for SM, shows on hover) */}
              {canManageStories && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteStory?.(story.id); }}
                  className="absolute top-2 right-2 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 z-20"
                  title="Delete Story"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
              )}

              <div 
                className={`${canManageStories ? 'cursor-pointer' : ''} flex gap-3 items-start`}
                onClick={() => canManageStories && onSelectStory(story.id)}
              >
                {/* Status Icon */}
                <div className="pt-0.5">
                    <StatusIcon status={story.status} />
                </div>

                {/* Story Details */}
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                        <h3 className={`text-sm font-medium leading-snug transition-colors ${isCurrent ? 'text-white font-semibold' : 'text-slate-200'}`}>
                            {story.title}
                        </h3>
                        {story.finalPoints && (
                            <span className="ml-auto shrink-0 bg-emerald-900/80 text-emerald-400 text-xs font-bold px-1.5 py-0.5 rounded border border-emerald-700/50 whitespace-nowrap">
                                {story.finalPoints}
                            </span>
                        )}
                    </div>
                    
                    {story.description && (
                        <p className={`text-xs mt-1 line-clamp-2 transition-colors ${isCurrent ? 'text-indigo-200/80' : 'text-slate-400'}`}>
                            {story.description}
                        </p>
                    )}
                </div>
              </div>
              
              {/* Visible 'Start Voting' Button for Scrum Masters */}
              {canManageStories && !isCurrent && story.status !== 'completed' && (
                <div className="mt-3 pt-2 border-t border-slate-600/30 flex justify-end">
                   <button 
                     onClick={(e) => { e.stopPropagation(); onSelectStory(story.id); }}
                     className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 px-2 py-1 hover:bg-indigo-900/30 rounded transition-colors"
                   >
                     Start Voting
                     <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                   </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Story Section - STRICTLY SM ONLY */}
      {canManageStories && (
        <div className="p-4 bg-slate-800 border-t border-slate-700 shadow-lg shrink-0 z-20">
          <label className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-3 block">Add New Story</label>
          <div className="flex flex-col gap-3">
            <div>
                <input
                className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none placeholder-slate-500"
                placeholder="Story title..."
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleAdd(e)}
                />
            </div>
            <div>
                <textarea
                className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none resize-none placeholder-slate-500"
                placeholder="Description..."
                rows={2}
                value={newDescription}
                onChange={e => setNewDescription(e.target.value)}
                />
            </div>
            <Button 
                size="sm" 
                variant="primary" 
                className="w-full"
                onClick={handleAdd}
                disabled={!newTitle}
            >
                Add Story
            </Button>

            <div className="border-t border-slate-700 my-1"></div>
            <Button 
                size="sm" 
                variant="danger" 
                className="w-full border-red-900 bg-red-900/20 hover:bg-red-900/50 text-red-200"
                onClick={handleEndSessionClick}
            >
                End Session & Logout Users
            </Button>
          </div>
        </div>
      )}

      {/* End Session Confirmation Modal */}
      {showEndSessionModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-800 border border-red-500/30 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all scale-100">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-900/20 flex items-center justify-center text-red-500 shrink-0 border border-red-500/20">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">End Session?</h3>
                  <p className="text-sm text-slate-400">This action cannot be undone.</p>
                </div>
              </div>
              
              <div className="text-slate-300 text-sm mb-6 leading-relaxed bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                <p className="mb-2 font-medium">You are about to end the current poker session. This will:</p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-red-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                      Delete all stories and votes
                  </li>
                  <li className="flex items-center gap-2 text-red-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                      Clear chat history
                  </li>
                  <li className="flex items-center gap-2 text-red-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                      Disconnect all users (force logout)
                  </li>
                </ul>
              </div>

              <div className="flex gap-3 justify-end">
                <Button variant="ghost" onClick={() => setShowEndSessionModal(false)}>
                  Cancel
                </Button>
                <Button variant="danger" onClick={confirmEndSession}>
                  Yes, End Session
                </Button>
              </div>
            </div>
            <div className="h-1.5 w-full bg-gradient-to-r from-red-500 to-orange-600"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryPanel;
