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
}

const StoryPanel: React.FC<StoryPanelProps> = ({
  stories,
  currentStoryId,
  userRole,
  onAddStory,
  onSelectStory,
  onDeleteStory
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const isScrumMaster = userRole === UserRole.SCRUM_MASTER || userRole === UserRole.PRODUCT_OWNER;

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

  return (
    <div className="bg-slate-800 border-b border-slate-700 md:border-b-0 md:border-r md:w-80 flex flex-col h-[40vh] md:h-full transition-all">
      <div className="p-4 border-b border-slate-700 flex justify-between items-center">
        <h2 className="font-semibold text-slate-200">Stories</h2>
        <div className="flex gap-2">
             <span className="text-xs bg-slate-700 px-2 py-1 rounded text-slate-400">{stories.length} Total</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
        {stories.length === 0 && (
          <div className="text-center text-slate-500 mt-10 text-sm">
            No stories yet.<br/>Add one to start pointing.
          </div>
        )}
        {stories.map(story => {
          const isCurrent = story.id === currentStoryId;
          return (
            <div 
              key={story.id}
              className={`
                group relative p-3 rounded-lg border transition-all
                ${isCurrent ? 'bg-indigo-900/30 border-indigo-500 ring-1 ring-indigo-500' : 'bg-slate-700/50 border-slate-600 hover:border-slate-500'}
                ${story.status === 'completed' ? 'opacity-60' : 'opacity-100'}
              `}
            >
              {/* Delete Button (Only for SM, shows on hover) */}
              {isScrumMaster && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteStory?.(story.id); }}
                  className="absolute top-2 right-2 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 z-10"
                  title="Delete Story"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
              )}

              <div 
                className="cursor-pointer pr-6"
                onClick={() => isScrumMaster && onSelectStory(story.id)}
              >
                <div className="flex justify-between items-start mb-1">
                    <h3 className="font-medium text-sm text-slate-200 line-clamp-2">{story.title}</h3>
                    {story.finalPoints && (
                        <span className="ml-2 bg-emerald-900 text-emerald-400 text-xs font-bold px-1.5 py-0.5 rounded whitespace-nowrap">
                            {story.finalPoints}
                        </span>
                    )}
                </div>
                {story.description && <p className="text-xs text-slate-400 line-clamp-2 mt-1">{story.description}</p>}
                <div className="flex justify-between mt-2 text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                    <span>{story.status}</span>
                    {story.status === 'active' && <span className="text-indigo-400">Current</span>}
                </div>
              </div>
              
              {/* Visible 'Vote' Button for Scrum Masters */}
              {isScrumMaster && !isCurrent && story.status !== 'completed' && (
                <div className="mt-3 pt-2 border-t border-slate-600/50 flex justify-end">
                   <button 
                     onClick={(e) => { e.stopPropagation(); onSelectStory(story.id); }}
                     className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3 py-1.5 rounded shadow-lg flex items-center gap-1"
                   >
                     <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                     Start Voting
                   </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {isScrumMaster && (
        <div className="p-4 bg-slate-800 border-t border-slate-700 shadow-lg">
          <label className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-3 block">Add New Story</label>
          <div className="flex flex-col gap-3">
            <div>
                <input
                className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                placeholder="Story title..."
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleAdd(e)}
                />
            </div>
            <div>
                <textarea
                className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
                placeholder="Description..."
                rows={3}
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
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryPanel;