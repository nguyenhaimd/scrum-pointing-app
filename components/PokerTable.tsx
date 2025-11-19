import React, { useMemo } from 'react';
import { User, Story, UserRole } from '../types';
import Card from './Card';
import Button from './Button';

interface PokerTableProps {
  users: User[];
  currentStory: Story | null;
  areVotesRevealed: boolean;
  onReveal: () => void;
  onNext: () => void;
  onReset: () => void;
  currentUserRole: UserRole;
}

const PokerTable: React.FC<PokerTableProps> = ({
  users,
  currentStory,
  areVotesRevealed,
  onReveal,
  onNext,
  onReset,
  currentUserRole
}) => {
  // 1. Seating Arrangement
  // We merge everyone but sort so SM/PO are at the "head" (start of array)
  const seatedUsers = useMemo(() => {
    const online = users.filter(u => u.isOnline);
    return online.sort((a, b) => {
      // Priority: SM/PO > Developers > Observers
      const getPriority = (r: UserRole) => {
        if (r === UserRole.SCRUM_MASTER || r === UserRole.PRODUCT_OWNER) return 0;
        if (r === UserRole.DEVELOPER) return 1;
        return 2;
      };
      return getPriority(a.role) - getPriority(b.role);
    });
  }, [users]);

  // 2. Calculate Statistics (Vote Counts)
  const votes = currentStory?.votes || {};
  const votingUsers = seatedUsers.filter(u => u.role === UserRole.DEVELOPER);
  const voteCount = Object.keys(votes).length;
  const devCount = votingUsers.length;

  const voteDistribution = useMemo(() => {
    if (!areVotesRevealed) return [];
    
    const counts: Record<string, number> = {};
    Object.values(votes).forEach(v => {
      const val = String(v);
      counts[val] = (counts[val] || 0) + 1;
    });

    // Return array sorted by vote value (numeric if possible)
    return Object.entries(counts).sort((a, b) => {
      const valA = Number(a[0]);
      const valB = Number(b[0]);
      if (!isNaN(valA) && !isNaN(valB)) return valA - valB;
      return a[0].localeCompare(b[0]);
    });
  }, [votes, areVotesRevealed]);

  const canControl = currentUserRole === UserRole.SCRUM_MASTER || currentUserRole === UserRole.PRODUCT_OWNER;

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-10 relative overflow-hidden">
      
      {/* Table Surface */}
      <div className="relative w-full max-w-4xl aspect-[16/9] md:aspect-[2/1] bg-slate-800/50 rounded-[100px] border-8 border-slate-700 shadow-2xl flex items-center justify-center mt-8">
        
        {/* Center Content (Results) */}
        <div className="text-center z-10 px-4 w-full max-w-md">
          {!currentStory ? (
            <div className="text-slate-400">
              <p className="text-xl font-light">Waiting for story...</p>
              <p className="text-sm opacity-50 mt-2">Scrum Master must select a story</p>
            </div>
          ) : (
            <div className="animate-fade-in">
              {areVotesRevealed ? (
                <div className="space-y-6">
                  {/* Vote Breakdown */}
                  <div className="flex flex-wrap justify-center gap-8 items-end">
                    {voteDistribution.map(([value, count]) => (
                      <div key={value} className="flex flex-col items-center animate-flip gap-3">
                         {/* Using 'md' size for better visibility and no 'isSelected' to prevent vertical shift that causes overlap issues */}
                         <Card value={value} size="md" revealed={true} />
                         <span className="text-sm font-bold text-emerald-400 bg-slate-900 px-3 py-1 rounded-full border border-emerald-500/30 shadow-sm">
                            {count} {count === 1 ? 'vote' : 'votes'}
                         </span>
                      </div>
                    ))}
                  </div>

                  {canControl && (
                    <div className="flex gap-2 justify-center mt-4">
                      <Button size="sm" variant="secondary" onClick={onReset}>Re-vote</Button>
                      <Button size="sm" variant="primary" onClick={onNext}>Finish Story</Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="text-4xl font-bold text-white mb-2 tabular-nums">
                    {voteCount} / {devCount}
                  </div>
                  <p className="text-indigo-300 text-sm uppercase tracking-widest mb-6">Votes Cast</p>
                  
                  {canControl && (
                    <div className="flex flex-col gap-3">
                        <button 
                        onClick={onReveal}
                        disabled={voteCount === 0}
                        className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-full font-bold shadow-lg transition-all hover:scale-105 active:scale-95"
                        >
                        Reveal Cards
                        </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Seats (Positioned absolutely around the oval) */}
        {seatedUsers.map((user, index) => {
          const total = seatedUsers.length;
          // Start from -90deg (top center)
          // Angle = (index / total) * 360deg - 90deg
          const angleRad = (index / total) * 2 * Math.PI - (Math.PI / 2);
          
          // Ellipse radii (percentages)
          const radiusX = 52; 
          const radiusY = 55; 
          
          const left = 50 + radiusX * Math.cos(angleRad);
          const top = 50 + radiusY * Math.sin(angleRad);

          const userVote = currentStory?.votes?.[user.id];
          const hasVoted = userVote !== undefined;
          const isManagement = user.role === UserRole.SCRUM_MASTER || user.role === UserRole.PRODUCT_OWNER;

          return (
            <div
              key={user.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2 transition-all duration-500 z-20"
              style={{ left: `${left}%`, top: `${top}%` }}
            >
              <div className="relative group">
                {/* Avatar */}
                <div className={`
                    w-10 h-10 md:w-14 md:h-14 rounded-full border-2 flex items-center justify-center shadow-lg relative text-2xl transition-transform group-hover:scale-110
                    ${isManagement ? 'bg-indigo-900 border-indigo-400 ring-2 ring-indigo-500/30' : 'bg-slate-700 border-slate-500'}
                `}>
                  {user.avatar || '👤'}
                  
                  {/* Role Badge for Management */}
                  {isManagement && (
                      <span className="absolute -top-2 -right-2 bg-indigo-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded border border-slate-900">
                          {user.role === UserRole.SCRUM_MASTER ? 'SM' : 'PO'}
                      </span>
                  )}
                </div>
                
                {/* Card Placeholder */}
                {currentStory && user.role === UserRole.DEVELOPER && (
                  <div className={`absolute -top-10 left-1/2 transform -translate-x-1/2 transition-all duration-300 ${hasVoted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                     <Card 
                        value={userVote || ''} 
                        faceDown={true} 
                        revealed={areVotesRevealed}
                        size="sm"
                     />
                  </div>
                )}
              </div>
              
              <div className="flex flex-col items-center">
                <span className="text-xs text-slate-200 font-medium bg-slate-900/90 px-2 py-0.5 rounded-full truncate max-w-[100px] border border-slate-700 shadow-sm">
                    {user.name}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PokerTable;