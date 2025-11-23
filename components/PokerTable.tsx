
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
import GameHub from './TicTacToe';

interface PokerTableProps {
  users: User[];
  currentUser: User; 
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
  onAddMinutes: (minutes: number) => void;
  lastReaction: Reaction | null;
  onReaction: (emoji: string) => void;
}

// --- Sub-components ---

// Collapsible Reaction Bar
const ReactionBar: React.FC<{ onReaction: (emoji: string) => void }> = ({ onReaction }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="flex items-center bg-slate-800/90 backdrop-blur-md rounded-full border border-slate-600 shadow-2xl transition-all duration-300 z-[60] hover:border-slate-500 pointer-events-auto">
       <button 
         onClick={() => setIsOpen(!isOpen)}
         className={`w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200 hover:scale-110 active:scale-95 ${isOpen ? 'bg-slate-700 text-slate-300 rotate-90' : 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-lg'}`}
         title={isOpen ? "Close Reactions" : "React"}
       >
         {isOpen ? (
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
         ) : (
             <span className="text-lg">😀</span>
         )}
       </button>
       
       <div className={`flex overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-w-[400px] opacity-100 px-2 gap-1' : 'max-w-0 opacity-0'}`}>
          {REACTION_EMOJIS.map(emoji => (
             <button 
                key={emoji} 
                onClick={() => { onReaction(emoji); }} 
                className="w-9 h-9 flex items-center justify-center text-xl hover:bg-white/10 rounded-full transition-transform hover:scale-125 active:scale-90"
             >
                {emoji}
             </button>
          ))}
       </div>
    </div>
  );
};

// Central Info Content (replaces the table)
const CenterStage: React.FC<{
  currentStory: Story | null;
  areVotesRevealed: boolean;
  stats: { average: string | number; agreement: number; counts: Record<string, number> };
  isScrumMaster: boolean;
  onReveal: () => void;
  onReset: () => void;
  onFinalize: (val: string | number) => void;
}> = ({ currentStory, areVotesRevealed, stats, isScrumMaster, onReveal, onReset, onFinalize }) => {
    
  const [showManualEntry, setShowManualEntry] = useState(false);

  useEffect(() => {
    setShowManualEntry(false);
  }, [currentStory?.id, areVotesRevealed]);

  if (!currentStory) {
    return (
      <div className="flex flex-col items-center justify-center p-6 rounded-3xl animate-fade-in max-w-sm text-center">
        <div className="text-6xl mb-4 opacity-20 grayscale filter drop-shadow-lg">🃏</div>
        <h2 className="text-xl font-medium text-slate-400">Waiting for Story</h2>
        {isScrumMaster && <p className="text-sm text-indigo-400 mt-2">Select a story to begin</p>}
      </div>
    );
  }

  if (areVotesRevealed) {
    const voteCounts = stats.counts;
    const maxVotes = Math.max(...(Object.values(voteCounts) as number[]), 0);
    const consensusValues = Object.entries(voteCounts)
        .filter(([_, count]) => count === maxVotes)
        .map(([val]) => val)
        .sort((a, b) => {
             const na = Number(a);
             const nb = Number(b);
             if (!isNaN(na) && !isNaN(nb)) return na - nb;
             return a.localeCompare(b);
        });

    return (
      <div className="flex flex-col items-center justify-center animate-fade-in z-50 relative pointer-events-auto">
        {/* Consensus Bubble */}
        <div className="bg-slate-900/90 p-8 rounded-[2rem] border border-indigo-500/50 shadow-2xl backdrop-blur-xl min-w-[240px] text-center transform hover:scale-105 transition-transform duration-300">
            <div className="text-indigo-400 text-xs uppercase font-bold tracking-[0.2em] mb-4">Consensus</div>
            
            <div className="flex justify-center items-center gap-3 flex-wrap mb-4">
                {consensusValues.length > 0 ? (
                    consensusValues.map((val, idx) => (
                        <div key={val} className="flex items-center">
                            <span className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 drop-shadow-sm">
                                {val}
                            </span>
                            {idx < consensusValues.length - 1 && (
                                <span className="text-3xl text-slate-600 mx-3">&</span>
                            )}
                        </div>
                    ))
                ) : (
                    <span className="text-xl text-slate-500 font-medium">No Votes</span>
                )}
            </div>
            
            <div className="flex justify-center">
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-slate-950/50 ${stats.agreement >= 80 ? 'border-emerald-500/30 text-emerald-400' : 'border-yellow-500/30 text-yellow-400'}`}>
                    <span className="text-[10px] font-bold uppercase tracking-wide opacity-80">Agreement</span>
                    <span className="text-sm font-bold">{stats.agreement}%</span>
                </div>
            </div>
        </div>

        {isScrumMaster && (
          <div className="mt-8 flex flex-col items-center gap-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-700/50 backdrop-blur-sm">
            <div className="flex flex-wrap justify-center gap-2">
                {consensusValues.map(val => (
                     <Button 
                        key={val} 
                        onClick={() => onFinalize(val)}
                        size="md"
                        className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20 font-bold"
                     >
                        Accept {val}
                     </Button>
                ))}
                
                <Button variant="secondary" onClick={onReset} size="md">
                    Revote
                </Button>
            </div>

            <div className="relative">
                <button 
                    onClick={() => setShowManualEntry(!showManualEntry)}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors py-1"
                >
                    {showManualEntry ? 'Hide options' : 'More options'}
                </button>

                {showManualEntry && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 flex flex-wrap justify-center gap-1 p-3 bg-slate-800 rounded-xl border border-slate-600 shadow-xl w-64 z-50">
                        {POINTING_SCALE.map(pts => (
                            <button
                                key={pts}
                                onClick={() => onFinalize(pts)}
                                className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold text-sm transition-colors"
                            >
                                {pts}
                            </button>
                        ))}
                    </div>
                )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center text-center z-10 pointer-events-auto">
      <div className="mb-8 max-w-sm">
        <h3 className="text-[10px] text-indigo-400 font-bold mb-2 uppercase tracking-widest opacity-80">Pointing Story</h3>
        <p className="text-xl md:text-2xl font-semibold text-white leading-snug drop-shadow-md">
          {currentStory.title}
        </p>
      </div>

      <div className="flex flex-col items-center">
         <div className="relative">
            {/* Pulse Effect */}
            <div className="absolute inset-0 bg-indigo-500 rounded-full blur-2xl opacity-20 animate-pulse"></div>
            <div className="relative text-4xl font-black text-white bg-slate-800/80 backdrop-blur w-20 h-20 rounded-full flex items-center justify-center shadow-2xl border-4 border-indigo-500/30">
              {Object.keys(currentStory.votes).length}
            </div>
         </div>
         <div className="text-[10px] text-slate-400 uppercase tracking-[0.2em] mt-3 font-bold">Votes Cast</div>
      </div>

      {isScrumMaster ? (
        <Button
          size="lg"
          onClick={onReveal}
          disabled={Object.keys(currentStory.votes).length === 0}
          className="mt-8 shadow-xl shadow-indigo-500/20 font-bold tracking-wide px-10 py-4 text-lg transform hover:scale-105 transition-all"
        >
          REVEAL CARDS
        </Button>
      ) : (
        <div className="mt-8 px-5 py-2 rounded-full bg-slate-800/30 border border-slate-700/50 text-xs text-slate-400 animate-pulse backdrop-blur-sm">
          {Object.keys(currentStory.votes).length > 0 ? "Waiting for Reveal..." : "Cast your vote below"}
        </div>
      )}
    </div>
  );
};


const PokerTable: React.FC<PokerTableProps> = ({
  users,
  currentUser,
  currentStory,
  areVotesRevealed,
  onReveal,
  onNext,
  onNextStory,
  onReset,
  currentUserRole,
  timer,
  onStartTimer,
  onPauseTimer,
  onResetTimer,
  onAddMinutes,
  lastReaction,
  onReaction
}) => {
  const [showGameHub, setShowGameHub] = useState(false);
  const prevRevealed = useRef(areVotesRevealed);
  const isScrumMaster = currentUserRole === UserRole.SCRUM_MASTER;
  
  // Layout dimensions state
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    
    window.addEventListener('resize', updateDimensions);
    updateDimensions();
    
    // Small delay to ensure container is rendered
    setTimeout(updateDimensions, 100);
    
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // --- Effects ---
  useEffect(() => {
    if (areVotesRevealed && !prevRevealed.current) {
      playSound.reveal();
      
      let isConsensus = false;
      if (currentStory && currentStory.votes) {
        const votes = Object.values(currentStory.votes).filter(v => v !== null);
        const uniqueVotes = new Set(votes.map(v => String(v)));
        if (votes.length > 0 && uniqueVotes.size === 1) {
          isConsensus = true;
        }
      }

      if (isConsensus) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#6366f1', '#8b5cf6', '#ec4899']
        });
      }
    }
    prevRevealed.current = areVotesRevealed;
  }, [areVotesRevealed, currentStory]);

  // --- Memoized Stats ---
  const stats = useMemo(() => {
    if (!currentStory?.votes) return { average: 0, agreement: 0, counts: {} };
    
    const votes = Object.values(currentStory.votes).filter(v => v !== null && v !== '?' && v !== '☕');
    const numericVotes = votes.map(v => Number(v)).filter(n => !isNaN(n));
    
    const counts: Record<string, number> = {};
    Object.values(currentStory.votes).forEach(v => {
      if (v !== null) {
        const s = String(v);
        counts[s] = (counts[s] || 0) + 1;
      }
    });

    if (numericVotes.length === 0) return { average: 0, agreement: 0, counts };

    const sum = numericVotes.reduce((a, b) => a + b, 0);
    const avg = sum / numericVotes.length;
    
    const maxCount = Math.max(...Object.values(counts));
    const totalVotes = Object.values(currentStory.votes).filter(v => v !== null).length;
    const agreement = totalVotes ? Math.round((maxCount / totalVotes) * 100) : 0;

    return { average: avg.toFixed(1), agreement, counts };
  }, [currentStory?.votes]);

  const handleFinalize = (val: string | number) => {
    onNext(val);
  };

  const handleReaction = (emoji: string) => {
    if (emoji === WOW_EMOJI) playSound.wow();
    else playSound.reaction();
    onReaction(emoji);
  };

  return (
    <div ref={containerRef} className="flex-1 relative bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-slate-950 flex flex-col overflow-hidden">
      
      {/* Global Overlays */}
      <ReactionOverlay lastReaction={lastReaction} />
      {showGameHub && <GameHub onClose={() => setShowGameHub(false)} />}
      
      {/* Game Hub Toggle (Bottom Right) */}
      <div className="absolute z-40 bottom-4 right-4 flex flex-col gap-3">
          <button 
            onClick={() => setShowGameHub(true)}
            className="bg-slate-800/80 hover:bg-indigo-600 text-white p-3 rounded-full flex items-center justify-center shadow-lg border border-slate-700 transition-all hover:scale-110"
            title="Arcade Mode"
          >
            <span className="text-xl">🎮</span>
          </button>
      </div>

      {/* Top Controls (Timer & Reactions) - Centered Top */}
      <div className="absolute top-4 left-0 right-0 z-[60] flex justify-center pointer-events-none">
          <div className="flex items-center gap-4 pointer-events-auto">
             <Timer 
                timer={timer} 
                onStart={onStartTimer} 
                onPause={onPauseTimer} 
                onReset={onResetTimer}
                onAddMinutes={onAddMinutes}
                canControl={isScrumMaster} 
            />
            <ReactionBar onReaction={handleReaction} />
          </div>
      </div>


      {/* =================================================================================
          MOBILE LAYOUT (< md)
         ================================================================================= */}
      <div className="md:hidden flex flex-col h-full w-full overflow-y-auto p-4 pb-32 scrollbar-hide">
        <div className="mt-14 mb-6 flex flex-col items-center justify-center min-h-[200px]">
           <CenterStage 
              currentStory={currentStory}
              areVotesRevealed={areVotesRevealed}
              stats={stats}
              isScrumMaster={isScrumMaster}
              onReveal={onReveal}
              onReset={onReset}
              onFinalize={handleFinalize}
           />
        </div>

        <div className="grid grid-cols-3 gap-x-3 gap-y-6 p-2">
           {users.map(user => {
              const hasVoted = currentStory?.votes?.[user.id] !== undefined;
              const voteValue = currentStory?.votes?.[user.id];
              return (
                <div key={user.id} className="flex flex-col items-center gap-2 p-2 rounded-xl relative group">
                   <div className={`relative z-10 transition-all duration-300 h-16 flex items-center justify-center ${hasVoted ? 'opacity-100 transform scale-100' : 'opacity-40 grayscale transform scale-95'}`}>
                      {hasVoted ? (
                        <Card 
                          value={voteValue || ''} 
                          faceDown={!areVotesRevealed}
                          revealed={areVotesRevealed}
                          size="sm" 
                        />
                      ) : (
                        <div className="w-10 h-16 rounded-lg border-2 border-dashed border-slate-700 bg-slate-800/30"></div>
                      )}
                   </div>
                   <div className="flex items-center gap-1.5 w-full justify-center z-10">
                      <div className="relative w-6 h-6 rounded-full bg-slate-700 border border-slate-500 flex items-center justify-center text-xs shadow-md shrink-0">
                         {user.avatar}
                         {user.role === UserRole.SCRUM_MASTER && (
                             <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-slate-800 rounded-full flex items-center justify-center text-[10px] border border-slate-600 z-20" title="Scrum Master">👨‍🍳</div>
                         )}
                         {user.role === UserRole.PRODUCT_OWNER && (
                             <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-slate-800 rounded-full flex items-center justify-center text-[10px] border border-slate-600 z-20" title="Product Owner">👑</div>
                         )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium truncate max-w-[4rem]">
                         {user.name}
                      </div>
                   </div>
                </div>
              );
           })}
        </div>
      </div>


      {/* =================================================================================
          DESKTOP/TABLET LAYOUT (>= md)
          Responsive Circular Layout
         ================================================================================= */}
      <div className="hidden md:flex w-full h-full items-center justify-center relative overflow-hidden select-none">
          
          {/* Center Stage Content (Floating) */}
          <div className="absolute z-10 flex items-center justify-center pointer-events-none">
              <CenterStage 
                currentStory={currentStory}
                areVotesRevealed={areVotesRevealed}
                stats={stats}
                isScrumMaster={isScrumMaster}
                onReveal={onReveal}
                onReset={onReset}
                onFinalize={handleFinalize}
              />
          </div>

          {/* Orbits */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {users.map((user, index) => {
                  const totalUsers = users.length;
                  const angleStep = (2 * Math.PI) / totalUsers;
                  // -PI/2 is Top. 
                  const angle = angleStep * index - Math.PI / 2; 
                  
                  // Responsive Radii Calculation for iPad/Desktop
                  const minDim = Math.min(dimensions.width, dimensions.height);
                  
                  // Scale radii based on screen size.
                  // iPad (approx 768px width) needs tighter packing.
                  // Desktop (approx 1024px+) can be wider.
                  const isTablet = minDim < 800;
                  
                  // Inner radius (Cards): ~22-25% of screen min dimension
                  const innerRadius = Math.min(minDim * (isTablet ? 0.22 : 0.25), 280); 
                  
                  // Outer radius (Users): ~34-38% of screen min dimension
                  const outerRadius = Math.min(minDim * (isTablet ? 0.34 : 0.38), 420);

                  // Adjust aspect ratio slightly for standard widescreen monitors to spread
                  const aspectRatio = dimensions.width / dimensions.height;
                  const spreadX = aspectRatio > 1.5 ? 1.3 : 1.1; 

                  // Calculate positions from center (0,0)
                  const seatX = outerRadius * Math.cos(angle) * spreadX;
                  const seatY = outerRadius * Math.sin(angle);

                  const cardX = innerRadius * Math.cos(angle) * spreadX;
                  const cardY = innerRadius * Math.sin(angle);

                  const hasVoted = currentStory?.votes?.[user.id] !== undefined;
                  const voteValue = currentStory?.votes?.[user.id];

                  return (
                      <React.Fragment key={user.id}>
                          {/* 1. The Card (Inner Orbit) */}
                          <div 
                              className={`absolute z-20 transition-all duration-500 flex justify-center items-center pointer-events-auto ${hasVoted ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}
                              style={{ 
                                  transform: `translate(calc(-50% + ${cardX}px), calc(-50% + ${cardY}px))` 
                              }}
                          >
                              <Card 
                                  value={voteValue || ''} 
                                  faceDown={!areVotesRevealed}
                                  revealed={areVotesRevealed}
                                  size={isTablet ? 'sm' : 'md'}
                              />
                          </div>

                          {/* 2. The User Seat (Outer Orbit) */}
                          <div 
                              className="absolute w-32 flex flex-col items-center justify-center z-30 transition-all duration-500 pointer-events-auto"
                              style={{ 
                                  transform: `translate(calc(-50% + ${seatX}px), calc(-50% + ${seatY}px))` 
                              }}
                          >
                              <div className={`relative w-16 h-16 rounded-full border-2 flex items-center justify-center text-3xl bg-slate-800 shadow-2xl transition-all ${hasVoted ? 'border-emerald-500 shadow-emerald-500/20 scale-110' : 'border-slate-600 opacity-80'} ${!user.isOnline ? 'grayscale opacity-40' : ''}`}>
                                  {user.avatar}
                                  {user.role === UserRole.SCRUM_MASTER && (
                                      <div className="absolute -top-2 -right-2 w-8 h-8 flex items-center justify-center bg-slate-800 rounded-full border border-slate-600 text-lg shadow-lg z-20" title="Scrum Master">👨‍🍳</div>
                                  )}
                                  {user.role === UserRole.PRODUCT_OWNER && (
                                      <div className="absolute -top-2 -right-2 w-8 h-8 flex items-center justify-center bg-slate-800 rounded-full border border-slate-600 text-lg shadow-lg z-20" title="Product Owner">👑</div>
                                  )}
                              </div>
                              <div className="mt-2 px-3 py-1 bg-slate-900/80 backdrop-blur-sm rounded-full text-xs font-bold text-slate-300 whitespace-nowrap truncate max-w-[140px] border border-slate-700 shadow-lg">
                                  {user.name}
                              </div>
                          </div>
                      </React.Fragment>
                  );
              })}
          </div>
      </div>

    </div>
  );
};

export default PokerTable;
