
import React, { useMemo, useState, useEffect, useRef } from 'react';
// @ts-ignore
import confetti from 'canvas-confetti';
import { User, Story, UserRole, TimerState, Reaction } from '../types';
import Card from './Card';
import Button from './Button';
import Timer from './Timer';
import ReactionOverlay from './ReactionOverlay';
import { POINTING_SCALE, REACTION_EMOJIS, WOW_EMOJI } from '../constants';
import { playSound } from '../services/soundService';

interface PokerTableProps {
  users: User[];
  currentStory: Story | null;
  areVotesRevealed: boolean;
  onReveal: () => void;
  onNext: (finalPoints: string | number) => void;
  onNextStory: () => void;
  onReset: () => void;
  currentUserRole: UserRole;
  timer: TimerState;
  onStartTimer: () => void;
  onPauseTimer: () => void;
  onResetTimer: () => void;
  lastReaction: Reaction | null;
  onReaction: (emoji: string) => void;
}

const PokerTable: React.FC<PokerTableProps> = ({
  users,
  currentStory,
  areVotesRevealed,
  onReveal,
  onNext,
  onNextStory,
  onReset,
  currentUserRole: currentUserRole,
  timer,
  onStartTimer,
  onPauseTimer,
  onResetTimer,
  lastReaction,
  onReaction
}) => {
  const [manualFinalScore, setManualFinalScore] = useState<string | number | null>(null);
  const prevRevealed = useRef(areVotesRevealed);
  
  // Trigger confetti and sound when votes revealed
  useEffect(() => {
    if (areVotesRevealed && !prevRevealed.current) {
        playSound.reveal();
        // Check for consensus (even if just 1 person voted, if everyone agrees, it's consensus)
        if (currentStory && currentStory.votes) {
            const votes = Object.values(currentStory.votes).filter(v => v !== null);
            // Normalize to string to ensure loose equality (e.g. 5 vs "5")
            const uniqueVotes = new Set(votes.map(v => String(v)));
            if (votes.length > 0 && uniqueVotes.size === 1) {
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#6366f1', '#8b5cf6', '#ec4899']
                });
            }
        }
    }
    prevRevealed.current = areVotesRevealed;
  }, [areVotesRevealed, currentStory]);

  // Listen for remote reactions to play sound for everyone
  useEffect(() => {
    if (lastReaction) {
        const isRecent = Date.now() - lastReaction.timestamp < 2000;
        // We perform the sound effect logic here if needed, currently handled by click for sender
    }
  }, [lastReaction]);

  // Stats Calculation
  const stats = useMemo(() => {
      if (!currentStory?.votes) return null;
      const votes = Object.values(currentStory.votes).filter(v => v !== null);
      if (votes.length === 0) return null;

      // Mode (Can be '☕' or '?')
      const counts: Record<string, number> = {};
      votes.forEach(v => counts[String(v)] = (counts[String(v)] || 0) + 1);
      
      const sortedCounts = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      
      // Determine consensus mode(s) - handle ties
      let mode = '-';
      if (sortedCounts.length > 0) {
          const maxVotes = sortedCounts[0][1];
          const winners = sortedCounts.filter(([_, count]) => count === maxVotes).map(([val]) => val);
          mode = winners.join(' & ');
      }

      return { mode, distribution: sortedCounts, totalVotes: votes.length };
  }, [currentStory?.votes]);

  const handleFinish = () => {
      // If manual score is set, use it. Otherwise try to parse the mode.
      const defaultScore = stats?.mode && !stats.mode.includes('&') ? stats.mode : '0';
      const final = manualFinalScore || defaultScore;
      onNext(final);
      setManualFinalScore(null);
  };
  
  const isScrumMaster = currentUserRole === UserRole.SCRUM_MASTER;
  const isCoffeeTime = areVotesRevealed && stats?.mode === '☕';

  return (
    <div className="flex flex-col h-full bg-slate-900 relative overflow-y-auto overflow-x-hidden">
       <ReactionOverlay lastReaction={lastReaction} />
       
       {/* Top Bar: Timer & Controls */}
       <div className="flex flex-col sm:flex-row justify-between items-center p-2 sm:p-4 z-10 gap-3 sm:gap-0 shrink-0">
          <div className="flex gap-2 scale-90 sm:scale-100 origin-left">
             <Timer 
                timer={timer} 
                onStart={onStartTimer} 
                onPause={onPauseTimer} 
                onReset={onResetTimer}
                canControl={isScrumMaster}
             />
          </div>
          
          {/* Reaction Bar */}
          <div className="flex gap-1 bg-slate-800/50 p-1 rounded-full border border-slate-700 backdrop-blur scale-90 sm:scale-100 origin-right overflow-x-auto max-w-full scrollbar-hide">
             {REACTION_EMOJIS.map(emoji => (
                 <button
                   key={emoji}
                   onClick={() => {
                       onReaction(emoji);
                       if (emoji === WOW_EMOJI) {
                           playSound.wow();
                       } else {
                           playSound.reaction();
                       }
                   }}
                   className="w-8 h-8 flex items-center justify-center text-lg hover:bg-slate-700 rounded-full transition-transform hover:scale-110 active:scale-90"
                 >
                   {emoji}
                 </button>
             ))}
          </div>
       </div>

       {/* Main Table Area */}
       <div className="flex-1 flex flex-col items-center justify-start pt-2 sm:pt-4 pb-24 sm:pb-20 px-2 sm:px-4 gap-4 sm:gap-6">
           
           {/* Active Story Details (Integrated into flow) */}
           {currentStory && !isCoffeeTime && (
               <div className="w-full max-w-2xl bg-slate-800/40 border border-slate-700/50 rounded-xl p-3 sm:p-4 text-center animate-fade-in">
                   <h3 className="text-lg sm:text-xl font-bold text-white leading-tight">{currentStory.title}</h3>
                   {currentStory.description && (
                       <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-prose mx-auto line-clamp-3">
                           {currentStory.description}
                       </p>
                   )}
               </div>
           )}

           {/* Center Status / Results */}
           <div className="w-full max-w-2xl min-h-[100px] sm:min-h-[120px] flex flex-col items-center justify-center shrink-0">
               {!currentStory ? (
                   <div className="text-slate-500 text-lg sm:text-xl animate-pulse">Waiting for story...</div>
               ) : areVotesRevealed && stats ? (
                   isCoffeeTime ? (
                        /* Special Coffee Break View */
                        <div className="w-full bg-amber-900/30 backdrop-blur-md border border-amber-500/50 rounded-2xl p-6 shadow-2xl animate-fade-in flex flex-col items-center justify-center text-center">
                             <div className="text-6xl mb-4 animate-bounce">☕</div>
                             <h2 className="text-2xl font-bold text-amber-200 mb-2">Coffee Break!</h2>
                             <p className="text-amber-100/80 mb-4">The team has decided to take a break.</p>
                             {isScrumMaster && (
                                 <Button onClick={onReset} className="bg-amber-600 hover:bg-amber-500 text-white border-amber-400">
                                     Back to Work
                                 </Button>
                             )}
                        </div>
                   ) : (
                       /* Standard Stats View */
                       <div className="w-full bg-slate-800/80 backdrop-blur-md border border-indigo-500/30 rounded-2xl p-4 sm:p-6 shadow-2xl animate-fade-in">
                           <div className="flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
                               {/* Consensus Only */}
                               <div className="flex justify-center w-full md:w-auto">
                                   <div className="text-center">
                                       <div className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-wider mb-1">Consensus</div>
                                       <div className="text-3xl sm:text-4xl font-bold text-white drop-shadow-lg">{stats.mode}</div>
                                   </div>
                               </div>

                               {/* Distribution Bar */}
                               <div className="flex-1 w-full">
                                   <div className="text-[10px] sm:text-xs text-slate-400 mb-2">Vote Distribution</div>
                                   <div className="flex h-3 sm:h-4 rounded-full overflow-hidden bg-slate-700">
                                       {stats.distribution.map(([val, count], i) => (
                                           <div 
                                             key={val}
                                             style={{ width: `${(count / stats.totalVotes) * 100}%` }}
                                             className={`h-full ${['bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-blue-500'][i % 4]} border-r border-slate-900 last:border-0`}
                                             title={`${count} votes for ${val}`}
                                           />
                                       ))}
                                   </div>
                                   <div className="flex justify-between mt-1">
                                        {stats.distribution.map(([val, count]) => (
                                            <div key={val} className="text-[10px] text-slate-500 text-center">
                                                <span className="font-bold text-slate-300">{val}</span> <span className="opacity-50">({count})</span>
                                            </div>
                                        ))}
                                   </div>
                               </div>
                           </div>

                           {/* SM Controls for Finishing */}
                           {isScrumMaster && (
                               <div className="mt-4 sm:mt-6 pt-4 border-t border-slate-700 flex flex-col sm:flex-row items-center justify-end gap-4">
                                   <div className="flex items-center gap-2">
                                       <span className="text-sm text-slate-300">Final:</span>
                                       <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700 overflow-x-auto max-w-[200px] sm:max-w-none scrollbar-hide">
                                           {POINTING_SCALE.filter(p => typeof p === 'number' || p === '0' || p === '?').map(p => (
                                               <button
                                                 key={p}
                                                 onClick={() => setManualFinalScore(p)}
                                                 className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm font-bold transition-colors ${
                                                     (manualFinalScore || (stats.mode === String(p) ? p : null)) == p 
                                                     ? 'bg-indigo-600 text-white' 
                                                     : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                                 }`}
                                               >
                                                   {p}
                                               </button>
                                           ))}
                                       </div>
                                   </div>
                                   <div className="flex gap-2 w-full sm:w-auto">
                                       <Button size="sm" variant="secondary" onClick={onReset} className="flex-1 sm:flex-none">Re-Vote</Button>
                                       <Button size="sm" onClick={handleFinish} className="flex-1 sm:flex-none">Complete</Button>
                                   </div>
                               </div>
                           )}
                       </div>
                   )
               ) : (
                   /* Voting In Progress State */
                   <div className="text-center">
                       {/* Status Icon */}
                       <div className="w-20 h-20 sm:w-24 sm:h-24 bg-slate-800 rounded-full flex items-center justify-center border-4 border-slate-700 mb-4 mx-auto shadow-[0_0_30px_rgba(99,102,241,0.1)]">
                           <span className="text-2xl sm:text-3xl">🃏</span>
                       </div>
                       <h2 className="text-lg sm:text-xl font-semibold text-slate-200">
                           {currentStory ? 'Voting in progress...' : 'Select a story'}
                       </h2>
                       {currentStory && (
                           <p className="text-slate-400 text-xs sm:text-sm mt-1">
                               {Object.keys(currentStory.votes || {}).length} votes cast
                           </p>
                       )}
                       {isScrumMaster && currentStory && (
                           <div className="mt-4">
                               <Button onClick={onReveal} disabled={!currentStory.votes || Object.keys(currentStory.votes).length === 0}>
                                   Reveal Cards
                               </Button>
                           </div>
                       )}
                   </div>
               )}
           </div>

           {/* Players Grid - Using Grid on mobile for stability, Flex on desktop */}
           <div className="grid grid-cols-2 sm:flex sm:flex-wrap justify-center justify-items-center gap-x-4 gap-y-6 sm:gap-6 w-full max-w-5xl">
               {users.map(user => {
                   const vote = currentStory?.votes?.[user.id];
                   const hasVoted = vote !== undefined && vote !== null;
                   
                   // Only Developers should have a "Thinking" placeholder. 
                   // Others just show their presence unless they explicitly voted.
                   const isVoter = user.role === UserRole.DEVELOPER;
                   const showCardSlot = isVoter || hasVoted;

                   return (
                       <div key={user.id} className="relative group flex flex-col items-center w-full sm:w-auto">
                           
                           {/* The Card / Placeholder */}
                           <div className={`
                               relative transition-all duration-300 min-h-[80px] sm:min-h-[96px] flex items-center justify-center
                               ${hasVoted && !areVotesRevealed ? '-translate-y-2' : ''}
                           `}>
                               {showCardSlot ? (
                                    hasVoted ? (
                                        <div className="relative">
                                            <Card 
                                                value={areVotesRevealed ? vote : ''} 
                                                faceDown={!areVotesRevealed} 
                                                revealed={areVotesRevealed}
                                                size="md"
                                            />
                                            {/* VOTED CHECKMARK BADGE */}
                                            {!areVotesRevealed && (
                                                <div className="absolute -top-2 -right-2 bg-emerald-500 text-slate-900 rounded-full p-0.5 border-2 border-slate-900 shadow-lg animate-bounce z-10">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        // Empty Slot for Developers
                                        <div className="w-14 h-20 md:w-16 md:h-24 rounded-xl border-2 border-dashed border-slate-700 bg-slate-800/30 flex items-center justify-center">
                                            <span className="text-xs text-slate-500 animate-pulse">Thinking</span>
                                        </div>
                                    )
                               ) : (
                                   // Non-voter visual (Just an icon/placeholder)
                                   <div className="w-14 h-20 md:w-16 md:h-24 flex items-center justify-center opacity-40 text-4xl sm:text-5xl" title={user.role}>
                                       {user.role === UserRole.SCRUM_MASTER ? '👨‍🍳' : 
                                        user.role === UserRole.PRODUCT_OWNER ? '👑' : '👁️'}
                                   </div>
                               )}
                           </div>

                           {/* User Info */}
                           <div className="mt-2 sm:mt-3 flex flex-col items-center max-w-full w-full px-1">
                               <div className={`
                                   flex items-center justify-center gap-1.5 bg-slate-800/80 backdrop-blur px-2 py-1 rounded-full border shadow-sm w-full max-w-[110px] transition-colors duration-300
                                   ${hasVoted ? 'border-emerald-500/50 bg-emerald-900/20' : 'border-slate-700'}
                               `}>
                                   <span className="text-xs sm:text-sm shrink-0">{user.avatar}</span>
                                   <span className={`text-[10px] sm:text-xs font-medium truncate ${hasVoted ? 'text-emerald-300' : 'text-slate-400'}`}>
                                       {user.name}
                                   </span>
                               </div>
                               {/* Role Badge */}
                               <span className="text-[9px] sm:text-[10px] text-slate-500 mt-0.5 truncate max-w-full px-1">{user.role}</span>
                           </div>
                       </div>
                   );
               })}
           </div>
       </div>
    </div>
  );
};

export default PokerTable;
