import React, { useMemo, useState, useEffect } from 'react';
// @ts-ignore
import confetti from 'canvas-confetti';
import { User, Story, UserRole } from '../types';
import Card from './Card';
import Button from './Button';
import { POINTING_SCALE } from '../constants';

interface PokerTableProps {
  users: User[];
  currentStory: Story | null;
  areVotesRevealed: boolean;
  onReveal: () => void;
  onNext: (finalPoints: string | number) => void;
  onReset: () => void;
  currentUserRole: UserRole;
}

// Helper for Device Icons
const DeviceIcon: React.FC<{ type: 'mobile' | 'tablet' | 'desktop' }> = ({ type }) => {
    if (type === 'mobile') {
        return <svg className="w-3 h-3 md:w-4 md:h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>;
    }
    if (type === 'tablet') {
        return <svg className="w-3 h-3 md:w-4 md:h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>;
    }
    return <svg className="w-3 h-3 md:w-4 md:h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>;
};

const PokerTable: React.FC<PokerTableProps> = ({
  users,
  currentStory,
  areVotesRevealed,
  onReveal,
  onNext,
  onReset,
  currentUserRole
}) => {
  // State for manually selected final score
  const [manualFinalScore, setManualFinalScore] = useState<string | number | null>(null);
  
  // Responsive state
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Celebration Effect
  useEffect(() => {
    if (areVotesRevealed) {
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b']
      });
    }
  }, [areVotesRevealed]);

  // 1. Seating Arrangement
  const seatedUsers = useMemo(() => {
    const online = users.filter(u => u.isOnline);
    return online.sort((a, b) => {
      const getPriority = (r: UserRole) => {
        if (r === UserRole.SCRUM_MASTER || r === UserRole.PRODUCT_OWNER) return 0;
        if (r === UserRole.DEVELOPER) return 1;
        return 2;
      };
      return getPriority(a.role) - getPriority(b.role);
    });
  }, [users]);

  // 2. Calculate Statistics
  const votes = currentStory?.votes || {};
  const votingUsers = seatedUsers.filter(u => u.role === UserRole.DEVELOPER);
  const voteCount = Object.keys(votes).length;
  const devCount = votingUsers.length;

  // Calculate Mode/Consensus whenever votes/revealed changes
  const calculatedMode = useMemo(() => {
    if (!currentStory || !areVotesRevealed) return null;
    
    const validVotes = Object.values(currentStory.votes).filter(v => v !== '?' && v !== '☕');
    if (validVotes.length === 0) return null;

    const counts: Record<string, number> = {};
    let maxCount = 0;
    let mode: string | number = validVotes[0];
    
    validVotes.forEach(v => {
        const s = String(v);
        counts[s] = (counts[s] || 0) + 1;
        if (counts[s] > maxCount) {
            maxCount = counts[s];
            mode = v;
        }
    });
    return mode;
  }, [currentStory, areVotesRevealed]);

  // Initialize manual score with calculated mode when revealed
  useEffect(() => {
      if (areVotesRevealed && calculatedMode !== null) {
          setManualFinalScore(calculatedMode);
      }
  }, [areVotesRevealed, calculatedMode]);

  const voteDistribution = useMemo(() => {
    if (!areVotesRevealed) return [];
    
    const counts: Record<string, number> = {};
    Object.values(votes).forEach(v => {
      const val = String(v);
      counts[val] = (counts[val] || 0) + 1;
    });

    return Object.entries(counts).sort((a, b) => {
      const valA = Number(a[0]);
      const valB = Number(b[0]);
      if (!isNaN(valA) && !isNaN(valB)) return valA - valB;
      return a[0].localeCompare(b[0]);
    });
  }, [votes, areVotesRevealed]);

  const canControl = currentUserRole === UserRole.SCRUM_MASTER;

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 relative overflow-hidden min-h-[50vh]">
      
      {/* Table Surface */}
      {/* Reduced width to 75% (mobile) and 80% (desktop) to allow space for avatars sitting on the edge */}
      <div className="relative w-[75%] sm:w-[80%] md:w-[80%] max-w-4xl aspect-square md:aspect-[2/1] bg-slate-800/50 rounded-full border-8 border-slate-700 shadow-2xl flex items-center justify-center transition-all">
        
        {/* Center Content (Results) */}
        <div className="text-center z-10 px-4 w-full max-w-md">
          {!currentStory ? (
            <div className="text-slate-400">
              <p className="text-lg md:text-xl font-light">Waiting for story...</p>
              <p className="text-xs md:text-sm opacity-50 mt-2">Scrum Master must select a story</p>
            </div>
          ) : (
            <div className="animate-fade-in">
              {areVotesRevealed ? (
                <div className="space-y-4 md:space-y-6">
                  {/* Vote Breakdown */}
                  <div className="flex flex-wrap justify-center gap-4 md:gap-8 items-end">
                    {voteDistribution.map(([value, count]) => (
                      <div key={value} className="flex flex-col items-center animate-flip gap-2 md:gap-3">
                         <Card value={value} size="md" revealed={true} />
                         <span className="text-xs md:text-sm font-bold text-emerald-400 bg-slate-900 px-2 py-0.5 md:px-3 md:py-1 rounded-full border border-emerald-500/30 shadow-sm">
                            {count} {count === 1 ? 'vote' : 'votes'}
                         </span>
                      </div>
                    ))}
                  </div>

                  {/* Scrum Master Control Area for Final Decision */}
                  {canControl && (
                    <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700 mt-4">
                        <p className="text-xs text-slate-400 mb-2 uppercase font-bold">Select Final Points</p>
                        
                        {/* Mini Vote Picker for SM Override */}
                        <div className="flex flex-wrap justify-center gap-2 mb-3">
                            {POINTING_SCALE.map(val => (
                                <button
                                    key={val}
                                    onClick={() => setManualFinalScore(val)}
                                    className={`w-8 h-8 md:w-10 md:h-10 rounded font-bold text-sm transition-all ${
                                        manualFinalScore === val 
                                        ? 'bg-indigo-600 text-white ring-2 ring-offset-2 ring-offset-slate-900 ring-indigo-500' 
                                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                    }`}
                                >
                                    {val}
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-2 justify-center">
                            <Button size="sm" variant="secondary" onClick={onReset}>Re-vote</Button>
                            <Button 
                                size="sm" 
                                variant="primary" 
                                onClick={() => manualFinalScore && onNext(manualFinalScore)}
                                disabled={!manualFinalScore}
                            >
                                Finish Story ({manualFinalScore})
                            </Button>
                        </div>
                    </div>
                  )}
                  
                  {!canControl && (
                      <div className="text-slate-400 text-sm mt-4">
                          Waiting for Scrum Master to finalize...
                      </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="text-3xl md:text-4xl font-bold text-white mb-2 tabular-nums">
                    {voteCount} / {devCount}
                  </div>
                  <p className="text-indigo-300 text-xs md:text-sm uppercase tracking-widest mb-4 md:mb-6">Votes Cast</p>
                  
                  {canControl && (
                    <div className="flex flex-col gap-3">
                        <button 
                        onClick={onReveal}
                        disabled={voteCount === 0}
                        className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 md:px-8 md:py-3 rounded-full font-bold shadow-lg transition-all hover:scale-105 active:scale-95 text-sm md:text-base"
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

        {/* Seats */}
        {seatedUsers.map((user, index) => {
          const total = seatedUsers.length;
          const angleRad = (index / total) * 2 * Math.PI - (Math.PI / 2);
          
          // Adjusted radii to ensure avatars stay within the viewport since the table is now smaller
          const radiusX = isMobile ? 40 : 50; 
          const radiusY = isMobile ? 40 : 52; 
          
          const left = 50 + radiusX * Math.cos(angleRad);
          const top = 50 + radiusY * Math.sin(angleRad);
          const userVote = currentStory?.votes?.[user.id];
          const hasVoted = userVote !== undefined;
          const isManagement = user.role === UserRole.SCRUM_MASTER || user.role === UserRole.PRODUCT_OWNER;
          const isPO = user.role === UserRole.PRODUCT_OWNER;

          return (
            <div
              key={user.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 md:gap-2 transition-all duration-500 z-20"
              style={{ left: `${left}%`, top: `${top}%` }}
            >
              <div className="relative group">
                <div className={`
                    w-10 h-10 md:w-14 md:h-14 rounded-full border-2 flex items-center justify-center shadow-lg relative text-xl md:text-2xl transition-transform group-hover:scale-110
                    ${isManagement ? 'bg-indigo-900 border-indigo-400 ring-2 ring-indigo-500/30' : 'bg-slate-700 border-slate-500'}
                `}>
                  {user.avatar || '👤'}
                  
                  {isManagement && (
                      <span className={`absolute -top-2 -right-2 text-white text-[8px] md:text-[10px] font-bold px-1.5 py-0.5 rounded border border-slate-900 ${isPO ? 'bg-pink-600' : 'bg-indigo-600'}`}>
                          {isPO ? 'PO' : 'SM'}
                      </span>
                  )}
                </div>
                
                {currentStory && user.role === UserRole.DEVELOPER && (
                  <div className={`absolute -top-8 md:-top-10 left-1/2 transform -translate-x-1/2 transition-all duration-300 ${hasVoted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                     <Card 
                        value={userVote || ''} 
                        faceDown={true} 
                        revealed={areVotesRevealed}
                        size="sm"
                     />
                  </div>
                )}
              </div>
              
              <div className="flex flex-col items-center bg-slate-900/90 px-2 py-1 rounded-lg border border-slate-700 shadow-sm">
                <span className="text-[10px] md:text-xs text-slate-200 font-medium truncate max-w-[80px] md:max-w-[100px]">
                    {user.name}
                </span>
                <div className="mt-0.5">
                    <DeviceIcon type={user.deviceType || 'desktop'} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PokerTable;