
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
import Whiteboard from './Whiteboard';

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

// 1. The content displayed on the "Table Surface"
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

  useEffect(() => {
    setShowManualEntry(false);
  }, [currentStory?.id, areVotesRevealed]);

  if (!currentStory) {
    return (
      <div className="text-center space-y-4 animate-fade-in w-full h-full flex flex-col items-center justify-center p-4">
        <div className="text-5xl md:text-6xl mb-2 opacity-50 grayscale">🃏</div>
        <h2 className="text-xl font-bold text-slate-300">Waiting for Story...</h2>
        {isScrumMaster && (
          <p className="text-sm text-slate-500">Select a story from the sidebar.</p>
        )}
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

    const sortedDistribution = Object.entries(voteCounts).sort((a, b) => {
        const na = Number(a[0]);
        const nb = Number(b[0]);
        if (!isNaN(na) && !isNaN(nb)) return na - nb;
        return a[0].localeCompare(b[0]);
    });

    return (
      <div className="text-center w-full h-full flex flex-col items-center justify-center overflow-hidden animate-fade-in px-2">
        
        <div className="bg-slate-800/90 p-3 rounded-xl border border-indigo-500/30 shadow-lg backdrop-blur-md w-full max-w-xs transform transition-all mb-2 flex flex-col justify-center shrink-0">
            <div className="text-indigo-300 text-[10px] uppercase font-bold tracking-widest mb-1">Consensus</div>
            
            <div className="flex justify-center items-center gap-2 flex-wrap min-h-[2.5rem]">
                {consensusValues.length > 0 ? (
                    consensusValues.map((val, idx) => (
                        <div key={val} className="flex items-center">
                            <span className="text-4xl md:text-5xl font-black text-white drop-shadow-sm">
                                {val}
                            </span>
                            {idx < consensusValues.length - 1 && (
                                <span className="text-xl text-slate-500 mx-2">&</span>
                            )}
                        </div>
                    ))
                ) : (
                    <span className="text-lg text-slate-500 font-medium">No Votes</span>
                )}
            </div>
            
            <div className="mt-1 flex justify-center">
                <div className={`inline-flex items-center gap-2 px-2 py-0.5 rounded-full border bg-slate-900/50 ${stats.agreement >= 80 ? 'border-emerald-500/30 text-emerald-400' : 'border-yellow-500/30 text-yellow-400'}`}>
                    <span className="text-[9px] font-bold uppercase tracking-wide opacity-80">Agreement</span>
                    <span className="text-[10px] font-bold">{stats.agreement}%</span>
                </div>
            </div>
        </div>

        {/* Vote Distribution Bar */}
        <div className="w-full max-w-[180px] space-y-1 mb-2 shrink-0">
           <div className="flex h-3 w-full rounded-full overflow-hidden bg-slate-900 shadow-inner border border-slate-700/50">
              {sortedDistribution.map(([val, count]) => {
                  const colors = ['bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-rose-500', 'bg-orange-500', 'bg-amber-500'];
                  const sVal = String(val);
                  const colorIdx = (sVal.charCodeAt(0) + (sVal.length > 1 ? sVal.charCodeAt(1) : 0)) % colors.length;
                  const color = colors[colorIdx];
                  
                  const total = Object.values(currentStory.votes).length;
                  const width = (Number(count) / total) * 100;
                  
                  return (
                    <div 
                        key={val} 
                        className={`${color} h-full flex items-center justify-center text-[8px] font-bold text-white border-r border-slate-900/20 last:border-0`} 
                        style={{ width: `${width}%` }} 
                    />
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
                        className="bg-emerald-600 hover:bg-emerald-500 text-white border-0 shadow-lg px-3 py-1 text-xs font-bold"
                     >
                        Accept {val}
                     </Button>
                ))}
                
                <Button variant="secondary" onClick={onReset} size="sm" className="border-slate-600 py-1 text-xs">
                    ↻ Revote
                </Button>
            </div>

            <div className="flex flex-col items-center gap-1 w-full relative">
                <button 
                    onClick={() => setShowManualEntry(!showManualEntry)}
                    className="text-[9px] text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors"
                >
                    {showManualEntry ? 'Hide options' : 'More options'}
                    <svg className={`w-3 h-3 transition-transform ${showManualEntry ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>

                {showManualEntry && (
                    <div className="absolute bottom-full mb-2 z-50 flex flex-wrap justify-center gap-1 p-2 bg-slate-900 rounded-xl border border-slate-600 shadow-xl w-56">
                        {POINTING_SCALE.map(pts => (
                            <button
                                key={pts}
                                onClick={() => onFinalize(pts)}
                                className={`
                                    w-6 h-6 rounded text-[10px] font-bold transition-all border
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

  return (
    <div className="text-center w-full h-full flex flex-col items-center justify-center p-2">
      <div className="max-w-[200px] w-full">
        <h3 className="text-xs text-indigo-400 font-bold mb-1 uppercase tracking-wide">Current Story</h3>
        <p className="text-sm font-medium text-white leading-snug line-clamp-2">
          {currentStory.title}
        </p>
      </div>

      <div className="flex flex-col items-center mt-3">
        <div className="text-2xl font-bold text-white bg-indigo-600 w-10 h-10 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/30 border-2 border-indigo-400">
          {Object.keys(currentStory.votes).length}
        </div>
        <div className="text-[9px] text-slate-500 uppercase tracking-wider mt-1 font-bold">Votes Cast</div>
      </div>

      {isScrumMaster ? (
        <Button
          size="sm"
          onClick={onReveal}
          disabled={Object.keys(currentStory.votes).length === 0}
          className="shadow-lg shadow-indigo-500/20 font-bold tracking-wide mt-3 text-xs py-1.5"
        >
          REVEAL CARDS
        </Button>
      ) : (
        <p className="text-xs text-slate-500 animate-pulse mt-3">
          {Object.keys(currentStory.votes).length > 0 ? "Waiting..." : "Vote now"}
        </p>
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
  const [showWhiteboard, setShowWhiteboard] = useState(false);
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
      {showWhiteboard && <Whiteboard currentUser={currentUser} onClose={() => setShowWhiteboard(false)} />}
      
      {/* Game Hub & Whiteboard Toggles */}
      <div className="absolute z-40 top-4 right-4 flex flex-col md:flex-row gap-3 md:gap-4 items-center">
          <button 
            onClick={() => setShowWhiteboard(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 w-10 h-10 md:w-10 md:h-10"
            title="Whiteboard"
          >
            <span className="text-xl">✏️</span>
          </button>

          <button 
            onClick={() => setShowGameHub(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:rotate-12 hover:scale-110 w-10 h-10 md:w-10 md:h-10"
            title="Arcade Mode"
          >
            <span className="text-xl">🎮</span>
          </button>
      </div>


      {/* =================================================================================
          MOBILE LAYOUT (< md)
         ================================================================================= */}
      <div className="md:hidden flex flex-col h-full w-full overflow-y-auto p-4 pb-32 scrollbar-hide">
        <div className="flex justify-between items-start mb-4 gap-2">
          <Timer 
             timer={timer} 
             onStart={onStartTimer} 
             onPause={onPauseTimer} 
             onReset={onResetTimer} 
             onAddMinutes={onAddMinutes}
             canControl={isScrumMaster} 
          />
          <div className="flex flex-col items-end gap-1 relative z-50 mr-12">
             <ReactionBar onReaction={handleReaction} />
          </div>
        </div>

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

        <div className="grid grid-cols-3 gap-3 p-2">
           {users.map(user => {
              const hasVoted = currentStory?.votes?.[user.id] !== undefined;
              const voteValue = currentStory?.votes?.[user.id];
              return (
                <div key={user.id} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 shadow-sm relative overflow-hidden group">
                   {hasVoted && !areVotesRevealed && (
                       <div className="absolute inset-0 bg-indigo-500/5 animate-pulse pointer-events-none" />
                   )}
                   <div className={`relative z-10 transition-all duration-300 h-14 flex items-center justify-center ${hasVoted ? 'opacity-100 transform scale-100' : 'opacity-40 grayscale transform scale-95'}`}>
                      {hasVoted ? (
                        <Card 
                          value={voteValue || ''} 
                          faceDown={!areVotesRevealed}
                          revealed={areVotesRevealed}
                          size="sm" 
                        />
                      ) : (
                        <div className="w-8 h-12 rounded-md border-2 border-dashed border-slate-600 bg-slate-800/50"></div>
                      )}
                   </div>
                   <div className="flex items-center gap-1.5 w-full justify-center z-10">
                      <div className="relative w-6 h-6 rounded-full bg-slate-700 border border-slate-500 flex items-center justify-center text-xs shadow-md shrink-0">
                         {user.avatar}
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
          Expanded layout to prevent overlap
         ================================================================================= */}
      <div className="hidden md:flex w-full h-full items-center justify-center relative overflow-hidden select-none">
          
          {/* Controls */}
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

          {/* Table Container - Fixed height to prevent crushing on short screens */}
          <div className="relative w-full max-w-7xl h-[650px] flex items-center justify-center">
              
              {/* Table Surface - Small and central */}
              <div className="absolute w-[320px] h-[180px] bg-slate-800 rounded-3xl border-8 border-slate-700 shadow-2xl flex flex-col items-center justify-center z-0 overflow-hidden p-1">
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

              {/* Orbits */}
              {users.map((user, index) => {
                  const totalUsers = users.length;
                  const angleStep = (2 * Math.PI) / totalUsers;
                  // -PI/2 is Top. 
                  const angle = angleStep * index - Math.PI / 2; 
                  
                  // Ellipse Radii (Width, Height)
                  const outerRx = 500; 
                  const outerRy = 280; 

                  const innerRx = 320; 
                  const innerRy = 190; 

                  // Calculate positions from center (0,0)
                  const seatX = outerRx * Math.cos(angle);
                  const seatY = outerRy * Math.sin(angle);

                  const cardX = innerRx * Math.cos(angle);
                  const cardY = innerRy * Math.sin(angle);

                  const hasVoted = currentStory?.votes?.[user.id] !== undefined;
                  const voteValue = currentStory?.votes?.[user.id];

                  return (
                      <React.Fragment key={user.id}>
                          {/* 1. The Card (Inner Orbit) */}
                          <div 
                              className={`absolute z-20 transition-all duration-500 flex justify-center items-center ${hasVoted ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}
                              style={{ 
                                  left: `calc(50% + ${cardX}px)`, 
                                  top: `calc(50% + ${cardY}px)`, 
                                  transform: 'translate(-50%, -50%)' 
                              }}
                          >
                              <Card 
                                  value={voteValue || ''} 
                                  faceDown={!areVotesRevealed}
                                  revealed={areVotesRevealed}
                                  size="md"
                              />
                          </div>

                          {/* 2. The User Seat (Outer Orbit) */}
                          <div 
                              className="absolute w-28 flex flex-col items-center justify-center z-30 transition-all duration-500"
                              style={{ 
                                  left: `calc(50% + ${seatX}px)`, 
                                  top: `calc(50% + ${seatY}px)`, 
                                  transform: 'translate(-50%, -50%)' 
                              }}
                          >
                              <div className={`relative w-16 h-16 rounded-full border-4 flex items-center justify-center text-2xl bg-slate-800 shadow-xl transition-colors ${hasVoted ? 'border-emerald-500 shadow-emerald-500/20' : 'border-slate-600'} ${!user.isOnline ? 'grayscale opacity-50' : ''}`}>
                                  {user.avatar}
                                  {user.role === UserRole.SCRUM_MASTER && (
                                      <div className="absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center bg-indigo-600 rounded-full border-2 border-indigo-400 text-xs shadow-md z-20" title="Scrum Master">★</div>
                                  )}
                                  {user.role === UserRole.PRODUCT_OWNER && (
                                      <div className="absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center bg-amber-500 rounded-full border-2 border-amber-300 text-xs shadow-md z-20" title="Product Owner">👑</div>
                                  )}
                              </div>
                              <div className="mt-2 px-3 py-1 bg-slate-800/90 rounded-full text-xs font-bold text-slate-300 whitespace-nowrap truncate max-w-[140px] border border-slate-600 shadow-lg">
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
