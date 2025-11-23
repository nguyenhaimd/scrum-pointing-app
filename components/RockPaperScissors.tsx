import React, { useState } from 'react';
// @ts-ignore
import confetti from 'canvas-confetti';
import Button from './Button';

interface RPSProps {
  onClose: () => void;
  onBack?: () => void;
}

type Choice = 'rock' | 'paper' | 'scissors';
type Result = 'win' | 'lose' | 'draw' | null;

const RockPaperScissors: React.FC<RPSProps> = ({ onClose, onBack }) => {
  const [playerChoice, setPlayerChoice] = useState<Choice | null>(null);
  const [computerChoice, setComputerChoice] = useState<Choice | null>(null);
  const [result, setResult] = useState<Result>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState({ player: 0, computer: 0 });

  const choices: { id: Choice; emoji: string; beats: Choice }[] = [
    { id: 'rock', emoji: '✊', beats: 'scissors' },
    { id: 'paper', emoji: '✋', beats: 'rock' },
    { id: 'scissors', emoji: '✌️', beats: 'paper' },
  ];

  const playGame = (choice: Choice) => {
    setIsPlaying(true);
    setPlayerChoice(choice);
    setComputerChoice(null);
    setResult(null);

    // Simulate thinking delay
    setTimeout(() => {
      const randomChoice = choices[Math.floor(Math.random() * choices.length)];
      setComputerChoice(randomChoice.id);
      
      let gameResult: Result = 'draw';
      if (choice === randomChoice.id) {
        gameResult = 'draw';
      } else if (choices.find(c => c.id === choice)?.beats === randomChoice.id) {
        gameResult = 'win';
        setScore(prev => ({ ...prev, player: prev.player + 1 }));
        confetti({
             particleCount: 100,
             spread: 70,
             origin: { y: 0.6 },
             colors: ['#6366f1', '#8b5cf6'],
             zIndex: 10000
        });
      } else {
        gameResult = 'lose';
        setScore(prev => ({ ...prev, computer: prev.computer + 1 }));
      }
      
      setResult(gameResult);
      setIsPlaying(false);
    }, 1000);
  };

  return (
    <div className="flex flex-col items-center animate-fade-in w-full max-w-sm">
      {/* Header */}
      <div className="flex justify-between items-center w-full mb-6">
        <div className="flex items-center gap-2">
            {onBack && (
                <button onClick={onBack} className="p-1 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                </button>
            )}
            <h3 className="text-xl font-bold text-indigo-400">Rock Paper Scissors</h3>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>

      {/* Scoreboard */}
      <div className="flex gap-8 mb-8 text-sm font-bold bg-slate-800 p-3 rounded-full border border-slate-700">
        <div className="flex flex-col items-center w-16">
            <span className="text-slate-400 text-xs uppercase">You</span>
            <span className="text-indigo-400 text-xl">{score.player}</span>
        </div>
        <div className="h-full w-px bg-slate-700"></div>
        <div className="flex flex-col items-center w-16">
            <span className="text-slate-400 text-xs uppercase">CPU</span>
            <span className="text-red-400 text-xl">{score.computer}</span>
        </div>
      </div>

      {/* Game Area */}
      <div className="flex justify-between items-center w-full mb-10 px-4 h-32">
        <div className={`text-6xl transition-transform duration-500 ${isPlaying ? 'animate-bounce' : ''}`}>
            {playerChoice ? choices.find(c => c.id === playerChoice)?.emoji : '🤔'}
        </div>
        
        <div className="text-2xl font-bold text-slate-600">VS</div>
        
        <div className={`text-6xl transition-transform duration-500 ${isPlaying ? 'animate-bounce' : ''}`}>
             {computerChoice ? choices.find(c => c.id === computerChoice)?.emoji : (isPlaying ? '🤖' : '❔')}
        </div>
      </div>

      {/* Result Text */}
      <div className="h-8 mb-6">
        {result && (
            <div className={`text-xl font-bold animate-pulse ${
                result === 'win' ? 'text-emerald-400' : result === 'lose' ? 'text-red-400' : 'text-slate-300'
            }`}>
                {result === 'win' ? 'You Won!' : result === 'lose' ? 'CPU Won!' : 'Draw!'}
            </div>
        )}
      </div>

      {/* Controls */}
      <div className="grid grid-cols-3 gap-3 w-full">
        {choices.map((choice) => (
            <button
                key={choice.id}
                onClick={() => playGame(choice.id)}
                disabled={isPlaying}
                className="flex flex-col items-center justify-center bg-slate-700 hover:bg-slate-600 active:bg-slate-500 p-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-slate-600 hover:border-indigo-400 group"
            >
                <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">{choice.emoji}</span>
            </button>
        ))}
      </div>
    </div>
  );
};

export default RockPaperScissors;