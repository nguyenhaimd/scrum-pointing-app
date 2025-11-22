
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
    
  if (!currentStory) {
    return (
      <div className="text-center space-y-4 animate-fade-in">
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
    const maxVotes = Math.max(...Object.values(voteCounts), 0);
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
      <div className="text-center w-full max-w-md space-y-6 animate-fade-in flex flex-col items-center">
        
        {/* Consensus Display */}
        <div className="bg-slate-800/80 p-6 rounded-2xl border-2 border-indigo-500/50 shadow-[0_0_40px_rgba(99,102,241,0.25)] backdrop-blur-md w-full transform transition-all hover:scale-[1.02]">
            <div className="text-indigo-300 text-xs uppercase font-bold tracking-widest mb-3">Team Consensus</div>
            
            <div className="flex justify-center items-center gap-3 flex-wrap min-h-[5rem]">
                {consensusValues.length > 0 ? (
                    consensusValues.map((val, idx) => (
                        <div key={val} className="flex items-center">
                            <span className="text-7xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-300 drop-shadow-sm">
                                {val}
                            </span>
                            {idx < consensusValues.length - 1 && (
                                <span className="text-4xl text-indigo-500/50 mx-2 font-light">&</span>
                            )}
                        </div>
                    ))
                ) : (
                    <span className="text-2xl text-slate-500 font-medium">No Votes Cast</span>
                )}
            </div>
            
            <div className="mt-4 flex justify-center">
                <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border bg-slate-900/50 ${stats.agreement >= 80 ? 'border-emerald-500/30 text-emerald-400' : 'border-yellow-500/30 text-yellow-400'}`}>
                    <span className="text-xs font-bold uppercase tracking-wide opacity-80">Agreement</span>
                    <span className="text-sm font-bold">{stats.agreement}%</span>
                </div>
            </div>
        </div>

        {/* Vote Distribution Bar */}
        <div className="w-full space-y-2 px-2">
           <div className="flex justify-between text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              <span>Distribution</span>
              <span>{Object.values(currentStory.votes).length} Total</span>
           </div>
           <div className="flex h-8 w-full rounded-lg overflow-hidden bg-slate-900 shadow-inner border border-slate-700/50">
              {sortedDistribution.map(([val, count]) => {
                  const colors = ['bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-rose-500', 'bg-orange-500', 'bg-amber-500'];
                  // Deterministic color based on value string
                  const colorIdx = (val.charCodeAt(0) + (val.length > 1 ? val.charCodeAt(1) : 0)) % colors.length;
                  const color = colors[colorIdx];
                  
                  const total = Object.values(currentStory.votes).length;
                  const width = (count / total) * 100;
                  
                  return (
                    <div 
                        key={val} 
                        className={`${color} h-full flex items-center justify-center text-xs font-bold text-white transition-all duration-500 border-r border-slate-900/20 last:border-0`} 
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
          <div className="pt-4 border-t border-slate-700/50 w-full space-y-4">
            <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Finalize Points</p>
            <div className="flex flex-wrap justify-center gap-2">
              {POINTING_SCALE.map(pts => (
                <button
                  key={pts}
                  onClick={() => onFinalize(pts)}
                  className={`
                    px-3 py-2 rounded-lg text-sm font-bold transition-all border border-slate-600
                    ${consensusValues.includes(String(pts)) 
                        ? 'bg-indigo-600 border-indigo-400 text-white shadow-[0_0_10px_rgba(99,102,241,0.4)] transform scale-110 mx-1' 
                        : 'bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white hover:border-slate-400'}
                  `}
                >
                  {pts}
                </button>
              ))}
            </div>
            <div className="flex justify-center mt-2">
              <Button size="sm" variant="outline" onClick={onReset} className="text-slate-400 hover:text-white border-slate-700 hover:border-slate-500">
                Start Revote
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Voting In Progress
  return (
    <div className="text-center space-y-4 md:space-y-6 w-full">
      <div>
        <h3 className="text-lg md:text-xl text-slate-300 font-medium mb-1 md:mb-2">Current Story</h3>
        <p className="text-xl md:text-3xl font-bold text-white max-w-lg mx-auto leading-tight line-clamp-3">
          {currentStory.title}
        </p>
      </div>

      <div className="flex flex-col items-center">
        <div className="text-3xl md:text-4xl font-bold text-indigo-400 bg-slate-900/50 w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center border-2 border-slate-700 shadow-inner">
          {Object.keys(currentStory.votes).length}
        </div>
        <div className="text-[10px] md:text-xs text-slate-500 uppercase tracking-wider mt-2">Votes Cast</div>
      </div>

      {isScrumMaster ? (
        <Button
          size="lg"
          onClick={onReveal}
          disabled={Object.keys(currentStory.votes).length === 0}
          className="shadow-[0_0_20px_rgba(79,70,229,0.4)] w-full md:w-auto font-bold tracking-wide"
        >
          REVEAL CARDS
        </Button>
      ) : (
        <p className="text-sm md:text-base text-slate-500 animate-pulse">
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
                   md:top-4 md:right-4 md:w-10 md:h-10
                   bottom-20 right-4 w-12 h-12 md:hidden" // Adjusted mobile position to avoid overlap
        title="Arcade Mode"
      >
        <span className="text-xl">🎮</span>
      </button>


      {/* =================================================================================
          MOBILE LAYOUT (< md)
          Vertical scrollable layout: Controls -> Table Card -> User Grid
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
          
          <div className="flex flex-wrap justify-end gap-1 max-w-[50%]">
             {REACTION_EMOJIS.slice(0, 5).map(emoji => (
                 <button key={emoji} onClick={() => handleReaction(emoji)} className="w-8 h-8 bg-slate-800/80 rounded-full flex items-center justify-center shadow-sm border border-slate-700 active:scale-90 transition-transform">{emoji}</button>
             ))}
             <button onClick={() => handleReaction(WOW_EMOJI)} className="w-8 h-8 bg-slate-800/80 rounded-full flex items-center justify-center shadow-sm border border-slate-700 active:scale-90 transition-transform">{WOW_EMOJI}</button>
          </div>
        </div>

        {/* 2. The "Table" Card (Story Info) */}
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 shadow-lg backdrop-blur-sm mb-6 flex flex-col items-center justify-center min-h-[200px]">
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

        {/* 3. User Grid (3 Columns) */}
        <div className="grid grid-cols-3 gap-3">
           {users.map(user => {
              const hasVoted = currentStory?.votes?.[user.id] !== undefined;
              const voteValue = currentStory?.votes?.[user.id];
              
              return (
                <div key={user.id} className="flex flex-col items-center gap-2 p-2 rounded-lg bg-slate-800/30 border border-slate-700/50">
                   <div className="relative">
                      {/* The Card (or placeholder slot) */}
                      <div className={`transition-all duration-300 transform ${hasVoted ? 'translate-y-0' : 'translate-y-1 opacity-50 grayscale'}`}>
                          {hasVoted ? (
                            <Card 
                              value={voteValue || ''} 
                              faceDown={!areVotesRevealed}
                              revealed={areVotesRevealed}
                              size="sm" // Small for mobile grid
                              theme={user.cardTheme}
                            />
                          ) : (
                            // Placeholder for empty slot
                            <div className="w-8 h-12 rounded-md border-2 border-dashed border-slate-600 bg-slate-800/50"></div>
                          )}
                      </div>
                      {/* Avatar Badge */}
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-slate-700 border border-slate-500 flex items-center justify-center text-sm shadow-md z-10">
                         {user.avatar}
                      </div>
                   </div>
                   <div className="text-[10px] text-slate-300 font-medium truncate w-full text-center px-1">
                      {user.name}
                   </div>
                </div>
              );
           })}
        </div>
      </div>


      {/* =================================================================================
          DESKTOP LAYOUT (>= md)
          Absolute positioning with circular table metaphor
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
                <div className="flex gap-1 bg-slate-800/60 backdrop-blur-sm p-1.5 rounded-full border border-slate-700/50 shadow-lg transition-all hover:scale-105">
                    {REACTION_EMOJIS.map(emoji => (
                        <button key={emoji} onClick={() => handleReaction(emoji)} className="w-8 h-8 flex items-center justify-center text-lg hover:bg-white/10 rounded-full transition-colors active:scale-90">{emoji}</button>
                    ))}
                </div>
            </div>
          </div>

          {/* Main Table Area */}
          <div className="relative w-full max-w-5xl aspect-video max-h-[80vh] flex items-center justify-center">
              
              {/* Table Surface */}
              <div className="absolute inset-16 bg-slate-800/50 rounded-[3rem] border-4 border-slate-700/50 shadow-[0_0_50px_rgba(0,0,0,0.3)] backdrop-blur-sm flex flex-col items-center justify-center p-8">
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

              {/* Seats (Users) */}
              {users.map((user, index) => {
                  const totalUsers = users.length;
                  const angleStep = (2 * Math.PI) / totalUsers;
                  const angle = angleStep * index + Math.PI / 2; 
                  const radiusX = 42; 
                  const radiusY = 42; 
                  const left = 50 + radiusX * Math.cos(angle);
                  const top = 50 + radiusY * Math.sin(angle);
                  const hasVoted = currentStory?.votes?.[user.id] !== undefined;
                  const voteValue = currentStory?.votes?.[user.id];

                  return (
                      <div 
                          key={user.id}
                          className="absolute w-24 h-24 flex flex-col items-center justify-center transition-all duration-500"
                          style={{ left: `${left}%`, top: `${top}%`, transform: 'translate(-50%, -50%)' }}
                      >
                          {/* Card */}
                          <div className={`absolute -top-10 transition-all duration-500 z-10 ${hasVoted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                              <Card 
                                  value={voteValue || ''} 
                                  faceDown={!areVotesRevealed}
                                  revealed={areVotesRevealed}
                                  size="sm"
                                  theme={user.cardTheme} 
                              />
                          </div>
                          {/* Avatar */}
                          <div className={`relative w-14 h-14 rounded-full border-2 flex items-center justify-center text-2xl bg-slate-800 shadow-lg z-20 transition-colors ${hasVoted ? 'border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'border-slate-600'} ${!user.isOnline ? 'grayscale opacity-50' : ''}`}>
                              {user.avatar}
                              {user.role === UserRole.SCRUM_MASTER && (
                                  <div className="absolute -top-2 -right-2 bg-amber-500 text-white text-[10px] p-1 rounded-full shadow-sm border border-slate-900">👑</div>
                              )}
                          </div>
                          {/* Name Tag */}
                          <div className="mt-1 px-2 py-0.5 bg-slate-900/80 rounded text-xs font-medium text-slate-300 whitespace-nowrap truncate max-w-[100px] border border-slate-700">
                              {user.name}
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
