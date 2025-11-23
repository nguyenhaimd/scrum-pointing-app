import React, { useState } from 'react';
import TicTacToe from './TicTacToe';
import RockPaperScissors from './RockPaperScissors';
import Snake from './Snake';
import MemoryMatch from './MemoryMatch';

interface ArcadeProps {
  onClose: () => void;
}

type GameType = 'menu' | 'tictactoe' | 'rps' | 'snake' | 'memory';

const Arcade: React.FC<ArcadeProps> = ({ onClose }) => {
  const [activeGame, setActiveGame] = useState<GameType>('menu');

  const renderGame = () => {
    switch (activeGame) {
      case 'tictactoe':
        return <TicTacToe onClose={onClose} onBack={() => setActiveGame('menu')} />;
      case 'rps':
        return <RockPaperScissors onClose={onClose} onBack={() => setActiveGame('menu')} />;
      case 'snake':
        return <Snake onClose={onClose} onBack={() => setActiveGame('menu')} />;
      case 'memory':
        return <MemoryMatch onClose={onClose} onBack={() => setActiveGame('menu')} />;
      default:
        return (
          <div className="w-full flex flex-col animate-fade-in">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                    Arcade
                </h3>
                <button onClick={onClose} className="text-slate-400 hover:text-white">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <button 
                    onClick={() => setActiveGame('tictactoe')}
                    className="flex flex-col items-center justify-center p-6 bg-slate-800 border border-slate-700 hover:border-indigo-500 rounded-xl hover:bg-slate-700 transition-all group"
                >
                    <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">❌⭕</div>
                    <span className="font-bold text-slate-200">Tic-Tac-Toe</span>
                </button>
                
                <button 
                    onClick={() => setActiveGame('rps')}
                    className="flex flex-col items-center justify-center p-6 bg-slate-800 border border-slate-700 hover:border-indigo-500 rounded-xl hover:bg-slate-700 transition-all group"
                >
                    <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">✂️</div>
                    <span className="font-bold text-slate-200">R.P.S.</span>
                </button>

                <button 
                    onClick={() => setActiveGame('snake')}
                    className="flex flex-col items-center justify-center p-6 bg-slate-800 border border-slate-700 hover:border-indigo-500 rounded-xl hover:bg-slate-700 transition-all group"
                >
                    <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">🐍</div>
                    <span className="font-bold text-slate-200">Snake</span>
                </button>

                <button 
                    onClick={() => setActiveGame('memory')}
                    className="flex flex-col items-center justify-center p-6 bg-slate-800 border border-slate-700 hover:border-indigo-500 rounded-xl hover:bg-slate-700 transition-all group"
                >
                    <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">🧠</div>
                    <span className="font-bold text-slate-200">Memory</span>
                </button>
             </div>
             
             <div className="mt-6 text-center text-xs text-slate-500">
                Select a game to play while you wait.
             </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto flex flex-col items-center">
        {renderGame()}
      </div>
    </div>
  );
};

export default Arcade;