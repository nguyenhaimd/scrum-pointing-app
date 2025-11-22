
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
  
  // Trigger confetti and sound when votes revealed
  useEffect(() => {
    if (areVotesRevealed && !prevRevealed.current) {
        playSound.reveal();
        
        let isConsensus = false;
        // Check for consensus (even if just 1 person voted, if everyone agrees, it's consensus)
        if (currentStory && currentStory.votes) {
            const votes = Object.values(currentStory.votes).filter(v => v !== null);
            // Normalize to string to ensure loose equality (e.g. 5 vs "5")
            const uniqueVotes = new Set(votes.map(v => String(v)));
            if (votes.length > 0 && uniqueVotes.size === 1) {
                isConsensus = true;
            }
        }

        if (isConsensus) {
            // Big Celebration
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

  // Calculate average/consensus
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

    // Calculate agreement % (max count / total votes)
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
      if (emoji === WOW_EMOJI) {
          playSound.wow();
      } else {
          playSound.reaction();
      }
      onReaction(emoji);
  };

  const isScrumMaster = currentUserRole === UserRole.SCRUM_MASTER;

  return (
    <div className="flex-1 relative bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-slate-950 flex flex-col items-center justify-center overflow-hidden p-4">
      {/* Reaction Overlay */}
      <ReactionOverlay lastReaction={lastReaction} />

      {/* Game Hub Overlay */}
      {showGameHub && <GameHub onClose={() => setShowGameHub(false)} />}

      {/* Top Bar: Timer & Reaction Bar */}
      <div className="absolute top-4 left-0 right-0 flex justify-center items-start px-4 pointer-events-none z-30">
          <div className="flex flex-col items-center gap-4 pointer-events-auto">
            <Timer 
                timer={timer} 
                onStart={onStartTimer} 
                onPause={onPauseTimer} 
                onReset={onResetTimer}
                onAddMinutes={onAddMinutes}
                canControl={isScrumMaster} 
            />
            
            {/* Reaction Bar */}
            <div className="flex gap-1 bg-slate-800/60 backdrop-blur-sm p-1.5 rounded-full border border-slate-700/50 shadow-lg transition-all hover:scale-105">
                {REACTION_EMOJIS.map(emoji => (
                    <button
                        key={emoji}
                        onClick={() => handleReaction(emoji)}
                        className="w-8 h-8 flex items-center justify-center text-lg hover:bg-white/10 rounded-full transition-colors active:scale-90"
                    >
                        {emoji}
                    </button>
                ))}
            </div>
          </div>
      </div>

      {/* Floating Action Button for Games */}
      <button 
        onClick={() => setShowGameHub(true)}
        className="absolute top-4 right-4 z-30 w-10 h-10 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:rotate-12 hover:scale-110"
        title="Arcade Mode"
      >
        <span className="text-xl">🎮</span>
      </button>

      {/* Center Table Area */}
      <div className="relative w-full max-w-5xl aspect-video max-h-[80vh] flex items-center justify-center">
        
        {/* Table Surface */}
        <div className="absolute inset-8 md:inset-16 bg-slate-800/50 rounded-[3rem] border-4 border-slate-700/50 shadow-[0_0_50px_rgba(0,0,0,0.3)] backdrop-blur-sm flex flex-col items-center justify-center p-8">
             
             {/* Center Content */}
             {!currentStory ? (
                 <div className="text-center space-y-4 animate-fade-in">
                     <div className="text-6xl mb-2">🃏</div>
                     <h2 className="text-2xl font-bold text-slate-300">Waiting for Story...</h2>
                     {isScrumMaster && (
                         <p className="text-slate-500">Select a story from the sidebar to begin.</p>
                     )}
                 </div>
             ) : (
                 <div className="w-full h-full flex flex-col items-center justify-center gap-6 animate-fade-in">
                     
                     {/* Results View */}
                     {areVotesRevealed ? (
                         <div className="text-center w-full max-w-md space-y-6">
                             <div className="grid grid-cols-2 gap-4">
                                 <div className="bg-slate-900/80 p-4 rounded-xl border border-indigo-500/30">
                                     <div className="text-slate-400 text-xs uppercase font-bold">Average</div>
                                     <div className="text-3xl font-bold text-indigo-400">{stats.average}</div>
                                 </div>
                                 <div className="bg-slate-900/80 p-4 rounded-xl border border-indigo-500/30">
                                     <div className="text-slate-400 text-xs uppercase font-bold">Agreement</div>
                                     <div className={`text-3xl font-bold ${stats.agreement >= 80 ? 'text-emerald-400' : 'text-yellow-400'}`}>
                                         {stats.agreement}%
                                     </div>
                                 </div>
                             </div>

                             {/* Vote Distribution Bar */}
                             <div className="flex h-4 w-full rounded-full overflow-hidden bg-slate-700">
                                 {Object.entries(stats.counts).map(([val, count], idx) => {
                                     // Generate consistent color based on value
                                     const colors = ['bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-rose-500', 'bg-orange-500', 'bg-amber-500'];
                                     const color = colors[parseInt(val) % colors.length] || 'bg-blue-500';
                                     const width = (count / Object.keys(currentStory.votes).length) * 100;
                                     return (
                                         <div key={val} className={`${color} h-full`} style={{ width: `${width}%` }} title={`${val}: ${count} votes`} />
                                     );
                                 })}
                             </div>

                             {isScrumMaster && (
                                 <div className="pt-4 border-t border-slate-700/50 space-y-3">
                                     <p className="text-sm text-slate-400 mb-2">Finalize Points:</p>
                                     <div className="flex flex-wrap justify-center gap-2">
                                         {POINTING_SCALE.map(pts => (
                                             <button
                                                 key={pts}
                                                 onClick={() => handleFinalize(pts)}
                                                 className="px-3 py-1 rounded bg-slate-700 hover:bg-indigo-600 text-slate-200 hover:text-white text-sm transition-colors"
                                             >
                                                 {pts}
                                             </button>
                                         ))}
                                     </div>
                                     <div className="flex justify-center gap-2 mt-4">
                                        <Button size="sm" variant="secondary" onClick={onReset}>Revote</Button>
                                     </div>
                                 </div>
                             )}
                         </div>
                     ) : (
                         /* Voting In Progress View */
                         <div className="text-center space-y-6">
                             <div>
                                <h3 className="text-xl text-slate-300 font-medium mb-2">Current Story</h3>
                                <p className="text-2xl md:text-3xl font-bold text-white max-w-lg mx-auto leading-tight">
                                    {currentStory.title}
                                </p>
                             </div>
                             
                             <div className="flex items-center justify-center gap-8">
                                 <div className="flex flex-col items-center">
                                     <div className="text-4xl font-bold text-indigo-400">
                                         {Object.keys(currentStory.votes).length}
                                     </div>
                                     <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">Votes Cast</div>
                                 </div>
                             </div>

                             {isScrumMaster && (
                                 <Button 
                                    size="lg" 
                                    onClick={onReveal}
                                    disabled={Object.keys(currentStory.votes).length === 0}
                                    className="shadow-[0_0_20px_rgba(79,70,229,0.4)] animate-pulse hover:animate-none"
                                 >
                                     Reveal Votes
                                 </Button>
                             )}
                             
                             {!isScrumMaster && (
                                 <p className="text-slate-500 animate-pulse">
                                     {Object.keys(currentStory.votes).length > 0 ? "Waiting for reveal..." : "Cast your vote below..."}
                                 </p>
                             )}
                         </div>
                     )}
                 </div>
             )}
        </div>

        {/* Seats (Users) */}
        {users.map((user, index) => {
            // Calculate position around the circle
            const totalUsers = users.length;
            // Offset angle so the first user is at the bottom center (closer to screen)
            const angleStep = (2 * Math.PI) / totalUsers;
            const angle = angleStep * index + Math.PI / 2; 
            
            // Radius percentages
            const radiusX = 42; // % of container width
            const radiusY = 42; // % of container height

            const left = 50 + radiusX * Math.cos(angle);
            const top = 50 + radiusY * Math.sin(angle);

            const hasVoted = currentStory?.votes?.[user.id] !== undefined;
            const voteValue = currentStory?.votes?.[user.id];

            return (
                <div 
                    key={user.id}
                    className="absolute w-20 h-20 md:w-24 md:h-24 flex flex-col items-center justify-center transition-all duration-500"
                    style={{ 
                        left: `${left}%`, 
                        top: `${top}%`,
                        transform: 'translate(-50%, -50%)' 
                    }}
                >
                    {/* The Card (If Voted) */}
                    <div className={`
                        absolute -top-10 transition-all duration-500 z-10
                        ${hasVoted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}
                    `}>
                        <Card 
                            value={voteValue || ''} 
                            faceDown={!areVotesRevealed}
                            revealed={areVotesRevealed}
                            size="sm"
                            theme={user.cardTheme} // Apply user's custom theme
                        />
                    </div>

                    {/* Avatar */}
                    <div className={`
                        relative w-12 h-12 md:w-14 md:h-14 rounded-full border-2 flex items-center justify-center text-2xl bg-slate-800 shadow-lg z-20 transition-colors
                        ${hasVoted ? 'border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'border-slate-600'}
                        ${!user.isOnline ? 'grayscale opacity-50' : ''}
                    `}>
                        {user.avatar}
                        
                        {/* Role Badge */}
                        {user.role === UserRole.SCRUM_MASTER && (
                            <div className="absolute -top-2 -right-2 bg-amber-500 text-white text-[10px] p-1 rounded-full shadow-sm border border-slate-900" title="Scrum Master">
                                👑
                            </div>
                        )}
                    </div>

                    {/* Name Tag */}
                    <div className="mt-1 px-2 py-0.5 bg-slate-900/80 rounded text-[10px] md:text-xs font-medium text-slate-300 whitespace-nowrap truncate max-w-[100px] border border-slate-700">
                        {user.name}
                    </div>
                </div>
            );
        })}

      </div>
    </div>
  );
};

export default PokerTable;
