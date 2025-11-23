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

// --- Sub-components for Layout Management ---

// Collapsible Reaction Bar
const ReactionBar: React.FC<{ onReaction: (emoji: string) => void }> = ({ onReaction }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className={`flex items-center bg-slate-800/80 backdrop-blur-md rounded-full border border-slate-700 shadow-xl transition-all duration-300 z-50 ${isOpen ? 'px-2 py-1.5 gap-2' : 'p-2'}`}>
       <button 
         onClick={() => setIsOpen(!isOpen)}
         className={`w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200 hover:scale-110 active:scale-95 ${isOpen ? 'bg-slate-700 text-slate-300 rotate-90' : 'bg-indigo-600 text-white hover:bg-indigo-500'}`}
         title={isOpen ? "Close Reactions" : "React"}
       >
         {isOpen ? (
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
         ) : (
             <span className="text-lg">😀</span>
         )}
       </button>
       
       <div className={`flex gap-1 overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-w-[400px] opacity-100' : 'max-w-0 opacity-0'}`}>
          {REACTION_EMOJIS.map(emoji => (
             <button 
                key={emoji} 
                onClick={() => { onReaction(emoji); }} 
                className="w-8 h-8 flex items-center justify-center text-lg hover:bg-white/10 rounded-full transition-transform hover:scale-125 active:scale-90"
             >
                {emoji}
             </button>
          ))}
       </div>
    </div>
  );
};

// 1. The content displayed on the "Table Surface" (Story info or Results)
const TableSurfaceContent: React.FC<{
  currentStory: Story | null;
  areVotesRevealed: boolean;
  stats: { average: string | number; agreement: number; counts: Record<string, number> };
  isScrumMaster: boolean;
  onReveal: () => void;
  onReset: () => void;
  onFinalize: (val: string | number) => void;
}> = ({ currentStory, areVotesRevealed, stats, isScrumMaster, onReveal, onReset, onFinalize }) => {
    
  const [showManualEntry, setShowManualEntry] = useState(false);

  // Reset manual entry toggle when story changes or votes reset
  useEffect(() => {
    setShowManualEntry(false);
  }, [currentStory?.id, areVotesRevealed]);

  if (!currentStory) {
    return (
      <div className="text-center space-y-4 animate-fade-in w-full h-full flex flex-col items-center justify-center">
        <div className="text-5xl md:text-6xl mb-2">🃏</div>
        <h2 className="text-xl md:text-2xl font-bold text-slate-300">Waiting for Story...</h2>
        {isScrumMaster && (
          <p className="text-sm md:text-base text-slate-500">Select a story from the sidebar.</p>
        )}
      </div>
    );
  }

  if (areVotesRevealed) {
    // Calculate consensus (modes)
    const voteCounts = stats.counts;
    // Cast to number[] to fix TS error where Object.values returns unknown[]
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

    // Helper for distribution bar sorting
    const sortedDistribution = Object.entries(voteCounts).sort((a, b) => {
        const na = Number(a[0]);
        const nb = Number(b[0]);
        if (!isNaN(na) && !isNaN(nb)) return na - nb;
        return a[0].localeCompare(b[0]);
    });

    return (
      <div className="text-center w-full h-full flex flex-col items-center justify-center overflow-hidden animate-fade-in px-2">
        
        {/* Consensus Display */}
        <div className="bg-slate-800/80 p-4 rounded-xl border-2 border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.2)] backdrop-blur-md w-full max-w-sm transform transition-all mb-2 flex flex-col justify-center shrink-0">
            <div className="text-indigo-300 text-[10px] uppercase font-bold tracking-widest mb-1">Team Consensus</div>
            
            <div className="flex justify-center items-center gap-2 flex-wrap min-h-[4rem]">
                {consensusValues.length > 0 ? (
                    consensusValues.map((val, idx) => (
                        <div key={val} className="flex items-center">
                            <span className="text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-300 drop-shadow-sm">
                                {val}
                            </span>
                            {idx < consensusValues.length - 1 && (
                                <span className="text-3xl text-indigo-500/50 mx-2 font-light">&</span>
                            )}
                        </div>
                    ))
                ) : (
                    <span className="text-xl text-slate-500 font-medium">No Votes</span>
                )}
            </div>
            
            <div className="mt-2 flex justify-center">
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-slate-900/50 ${stats.agreement >= 80 ? 'border-emerald-500/30 text-emerald-400' : 'border-yellow-500/30 text-yellow-400'}`}>
                    <span className="text-[10px] font-bold uppercase tracking-wide opacity-80">Agreement</span>
                    <span className="text-xs font-bold">{stats.agreement}%</span>
                </div>
            </div>
        </div>

        {/* Vote Distribution Bar */}
        <div className="w-full max-w-xs space-y-1 mb-3 shrink-0">
           <div className="flex h-6 w-full rounded-md overflow-hidden bg-slate-900 shadow-inner border border-slate-700/50">
              {sortedDistribution.map(([val, count]) => {
                  const colors = ['bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-rose-500', 'bg-orange-500', 'bg-amber-500'];
                  // Ensure val is string to fix arithmetic operation TS error
                  const sVal = String(val);
                  const colorIdx = (sVal.charCodeAt(0) + (sVal.length > 1 ? sVal.charCodeAt(1) : 0)) % colors.length;
                  const color = colors[colorIdx];
                  
                  const total = Object.values(currentStory.votes).length;
                  const width = (Number(count) / total) * 100;
                  
                  return (
                    <div 
                        key={val} 
                        className={`${color} h-full flex items-center justify-center text-[10px] font-bold text-white border-r border-slate-900/20 last:border-0`} 
                        style={{ width: `${width}%` }} 
                        title={`${val}: ${count} votes`}
                    >
                        {width > 10 ? val : ''}
                    </div>
                  );
              })}
           </div>
        </div>

        {isScrumMaster && (
          <div className="w-full flex flex-col items-center gap-2 animate-fade-in shrink-0">
            <div className="flex flex-wrap justify-center gap-2 w-full">
                {consensusValues.length > 0 && consensusValues.map(val => (
                     <Button 
                        key={val} 
                        onClick={() => onFinalize(val)}
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-500 text-white border-0 shadow-lg px-4 py-2 text-sm font-bold"
                     >
                        Accept {val}
                     </Button>
                ))}
                
                <Button variant="secondary" onClick={onReset} size="sm" className="border-slate-600 py-2">
                    ↻ Revote
                </Button>
            </div>

            {/* Manual Override Toggle */}
            <div className="flex flex-col items-center gap-1 w-full relative">
                <button 
                    onClick={() => setShowManualEntry(!showManualEntry)}
                    className="text-[10px] text-slate-400 hover:text-indigo-400 flex items-center gap-1 transition-colors"
                >
                    {showManualEntry ? 'Hide options' : 'More options'}
                    <svg className={`w-3 h-3 transition-transform ${showManualEntry ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>

                {showManualEntry && (
                    <div className="absolute bottom-full mb-2 z-50 flex flex-wrap justify-center gap-1 p-2 bg-slate-900 rounded-xl border border-slate-600 shadow-xl w-64">
                        {POINTING_SCALE.map(pts => (
                            <button
                                key={pts}
                                onClick={() => onFinalize(pts)}
                                className={`
                                    w-8 h-8 rounded-md text-xs font-bold transition-all border
                                    ${consensusValues.includes(String(pts))
                                        ? 'bg-indigo-600 border-indigo-400 text-white'
                                        : 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700'}
                                `}
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

  // Voting In Progress
  return (
    <div className="text-center w-full h-full flex flex-col items-center justify-center space-y-3 md:space-y-4">
      <div className="max-w-md w-full">
        <h3 className="text-base md:text-lg text-slate-400 font-medium mb-1">Current Story</h3>
        <p className="text-lg md:text-2xl font-bold text-white leading-tight line-clamp-3 px-4">
          {currentStory.title}
        </p>
      </div>

      <div className="flex flex-col items-center">
        <div className="text-2xl md:text-3xl font-bold text-indigo-400 bg-slate-900/50 w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center border-2 border-slate-700 shadow-inner">
          {Object.keys(currentStory.votes).length}
        </div>
        <div className="text-[10px] md:text-xs text-slate-500 uppercase tracking-wider mt-1">Votes Cast</div>
      </div>

      {isScrumMaster ? (
        <Button
          size="md"
          onClick={onReveal}
          disabled={Object.keys(currentStory.votes).length === 0}
          className="shadow-[0_0_20px_rgba(79,70,229,0.4)] font-bold tracking-wide"
        >
          REVEAL CARDS
        </Button>
      ) : (
        <p className="text-xs md:text-sm text-slate-500 animate-pulse">
          {Object.keys(currentStory.votes).length > 0 ? "Waiting for reveal..." : "Cast your vote below..."}
        </p>
      )}
    </div>
  );
};


const PokerTable: React.FC<PokerTableProps> = ({
  users,
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
  const [manualFinalScore, setManualFinalScore] = useState<string | number | null>(null);
  const [showGameHub, setShowGameHub] = useState(false);
  const prevRevealed = useRef(areVotesRevealed);
  const isScrumMaster = currentUserRole === UserRole.SCRUM_MASTER;

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
    setManualFinalScore(null);
  };

  const handleReaction = (emoji: string) => {
    if (emoji === WOW_EMOJI) playSound.wow();
    else playSound.reaction();
    onReaction(emoji);
  };

  return (
    <div className="flex-1 relative bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-slate-950 flex flex-col overflow-hidden">
      
      {/* Global Overlays */}
      <ReactionOverlay lastReaction={lastReaction} />
      {showGameHub && <GameHub onClose={() => setShowGameHub(false)} />}
      
      {/* Game Hub Toggle (Desktop: Top Right, Mobile: Bottom Right floating) */}
      <button 
        onClick={() => setShowGameHub(true)}
        className="absolute z-40 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:rotate-12 hover:scale-110
                   bottom-20 right-4 w-12 h-12
                   md:top-4 md:right-4 md:bottom-auto md:w-10 md:h-10"
        title="Arcade Mode"
      >
        <span className="text-xl">🎮</span>
      </button>


      {/* =================================================================================
          MOBILE LAYOUT (< md)
          Vertical scrollable layout: Controls -> Table Card -> User Grid
          UPDATED: Grid items are now vertically stacked with no overlap to prevent blocking.
         ================================================================================= */}
      <div className="md:hidden flex flex-col h-full w-full overflow-y-auto p-4 pb-32 scrollbar-hide">
        
        {/* 1. Top Controls Row */}
        <div className="flex justify-between items-start mb-4 gap-2">
          <Timer 
             timer={timer} 
             onStart={onStartTimer} 
             onPause={onPauseTimer} 
             onReset={onResetTimer} 
             onAddMinutes={onAddMinutes}
             canControl={isScrumMaster} 
          />
          
          <div className="flex flex-col items-end gap-1 relative z-50">
             <ReactionBar onReaction={handleReaction} />
          </div>
        </div>

        {/* 2. The "Table" Card (Story Info) */}
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 shadow-lg backdrop-blur-sm mb-6 flex flex-col items-center justify-center min-h-[220px]">
           <TableSurfaceContent 
              currentStory={currentStory}
              areVotesRevealed={areVotesRevealed}
              stats={stats}
              isScrumMaster={isScrumMaster}
              onReveal={onReveal}
              onReset={onReset}
              onFinalize={handleFinalize}
           />
        </div>

        {/* 3. User Grid (3 Columns) - STACKED LAYOUT */}
        <div className="grid grid-cols-3 gap-3 p-2">
           {users.map(user => {
              const hasVoted = currentStory?.votes?.[user.id] !== undefined;
              const voteValue = currentStory?.votes?.[user.id];
              
              return (
                <div key={user.id} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 shadow-sm relative overflow-hidden group">
                   
                   {/* Voting Status Background Highlight */}
                   {hasVoted && !areVotesRevealed && (
                       <div className="absolute inset-0 bg-indigo-500/5 animate-pulse pointer-events-none" />
                   )}
                   
                   {/* Card Area - No Overlap */}
                   <div className={`relative z-10 transition-all duration-300 h-14 flex items-center justify-center ${hasVoted ? 'opacity-100 transform scale-100' : 'opacity-40 grayscale transform scale-95'}`}>
                      {hasVoted ? (
                        <Card 
                          value={voteValue || ''} 
                          faceDown={!areVotesRevealed}
                          revealed={areVotesRevealed}
                          size="sm" 
                          theme={user.cardTheme}
                        />
                      ) : (
                        <div className="w-8 h-12 rounded-md border-2 border-dashed border-slate-600 bg-slate-800/50"></div>
                      )}
                   </div>

                   {/* User Identity - Below Card */}
                   <div className="flex items-center gap-1.5 w-full justify-center z-10">
                      <div className="relative w-6 h-6 rounded-full bg-slate-700 border border-slate-500 flex items-center justify-center text-xs shadow-md shrink-0">
                         {user.avatar}
                         {user.role === UserRole.SCRUM_MASTER && (
                            <div className="absolute -top-1.5 -right-1.5 bg-slate-800 rounded-full p-0.5 border border-slate-600 text-[10px] z-20 shadow-sm" title="Scrum Master">👨‍🍳</div>
                         )}
                         {user.role === UserRole.PRODUCT_OWNER && (
                            <div className="absolute -top-1.5 -right-1.5 bg-slate-900 rounded-full p-0.5 border border-amber-500 text-[10px] z-20 shadow-sm" title="Product Owner">👑</div>
                         )}
                      </div>
                      <div className="text-[10px] text-slate-300 font-medium truncate max-w-[4rem]">
                         {user.name}
                      </div>
                   </div>
                </div>
              );
           })}
        </div>
      </div>


      {/* =================================================================================
          DESKTOP LAYOUT (>= md)
          Absolute positioning with circular table metaphor.
          UPDATED: Uses two concentric circles. Inner for cards, Outer for users.
         ================================================================================= */}
      <div className="hidden md:flex w-full h-full items-center justify-center relative">
          
          {/* Top Bar Controls */}
          <div className="absolute top-4 left-0 right-0 flex justify-center items-start pointer-events-none z-30">
            <div className="flex flex-col items-center gap-4 pointer-events-auto">
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

          {/* Main Table Area */}
          <div className="relative w-full max-w-5xl aspect-video max-h-[80vh] flex items-center justify-center">
              
              {/* Table Surface - Sized smaller to fit inside users */}
              <div className="absolute w-[50%] h-[55%] bg-slate-800/50 rounded-[3rem] border-4 border-slate-700/50 shadow-[0_0_50px_rgba(0,0,0,0.3)] backdrop-blur-sm flex flex-col items-center justify-center p-4 z-0 overflow-hidden">
                  <TableSurfaceContent 
                    currentStory={currentStory}
                    areVotesRevealed={areVotesRevealed}
                    stats={stats}
                    isScrumMaster={isScrumMaster}
                    onReveal={onReveal}
                    onReset={onReset}
                    onFinalize={handleFinalize}
                  />
              </div>

              {/* Seats (Outer Circle) & Cards (Inner Circle) */}
              {users.map((user, index) => {
                  const totalUsers = users.length;
                  const angleStep = (2 * Math.PI) / totalUsers;
                  const angle = angleStep * index + Math.PI / 2; 
                  
                  // Seat Position (Outer Circle - Users)
                  // Increased radius to 45% to push users away from center content
                  const seatRadiusX = 45; 
                  const seatRadiusY = 45; 
                  const seatLeft = 50 + seatRadiusX * Math.cos(angle);
                  const seatTop = 50 + seatRadiusY * Math.sin(angle);

                  // Card Position (Inner Circle - Cards)
                  const cardRadiusX = 32; 
                  const cardRadiusY = 32; 
                  const cardLeft = 50 + cardRadiusX * Math.cos(angle);
                  const cardTop = 50 + cardRadiusY * Math.sin(angle);

                  const hasVoted = currentStory?.votes?.[user.id] !== undefined;
                  const voteValue = currentStory?.votes?.[user.id];

                  return (
                      <React.Fragment key={user.id}>
                          {/* 1. The Card (Inner Circle) */}
                          <div 
                              className={`absolute z-20 transition-all duration-500 flex justify-center items-center ${hasVoted ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}
                              style={{ left: `${cardLeft}%`, top: `${cardTop}%`, transform: 'translate(-50%, -50%)' }}
                          >
                              <Card 
                                  value={voteValue || ''} 
                                  faceDown={!areVotesRevealed}
                                  revealed={areVotesRevealed}
                                  size="md"
                                  theme={user.cardTheme} 
                              />
                          </div>

                          {/* 2. The User Seat (Outer Circle) */}
                          <div 
                              className="absolute w-24 flex flex-col items-center justify-center z-30 transition-all duration-500"
                              style={{ left: `${seatLeft}%`, top: `${seatTop}%`, transform: 'translate(-50%, -50%)' }}
                          >
                              {/* Avatar */}
                              <div className={`relative w-14 h-14 rounded-full border-2 flex items-center justify-center text-2xl bg-slate-800 shadow-lg transition-colors ${hasVoted ? 'border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'border-slate-600'} ${!user.isOnline ? 'grayscale opacity-50' : ''}`}>
                                  {user.avatar}
                                  {user.role === UserRole.SCRUM_MASTER && (
                                      <div className="absolute -top-2 -right-2 w-7 h-7 flex items-center justify-center bg-slate-800 rounded-full border-2 border-slate-600 text-lg shadow-md z-20" title="Scrum Master">👨‍🍳</div>
                                  )}
                                  {user.role === UserRole.PRODUCT_OWNER && (
                                      <div className="absolute -top-2 -right-2 w-7 h-7 flex items-center justify-center bg-slate-900 rounded-full border-2 border-amber-500 text-lg shadow-md z-20" title="Product Owner">👑</div>
                                  )}
                              </div>
                              {/* Name Tag */}
                              <div className="mt-2 px-2 py-0.5 bg-slate-900/90 rounded text-xs font-medium text-slate-300 whitespace-nowrap truncate max-w-[120px] border border-slate-700 shadow-sm">
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