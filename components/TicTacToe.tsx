import React, { useState, useEffect } from 'react';
import Button from './Button';

interface TicTacToeProps {
  onClose: () => void;
  onBack?: () => void;
}

const TicTacToe: React.FC<TicTacToeProps> = ({ onClose, onBack }) => {
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true); // Human is X and always goes first
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'draw'>('playing');
  const [winner, setWinner] = useState<string | null>(null);

  const calculateWinner = (squares: (string | null)[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
      [0, 4, 8], [2, 4, 6]             // diagonals
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return null;
  };

  // AI Move Logic
  useEffect(() => {
    if (!xIsNext && gameStatus === 'playing') {
        const timer = setTimeout(() => {
            makeComputerMove();
        }, 600); // Slight delay for realism
        return () => clearTimeout(timer);
    }
  }, [xIsNext, gameStatus, board]);

  const makeComputerMove = () => {
      // 1. Check if AI can win
      const winMove = findBestMove('O');
      if (winMove !== -1) {
          handleMove(winMove, 'O');
          return;
      }

      // 2. Check if Player can win (Block them)
      const blockMove = findBestMove('X');
      if (blockMove !== -1) {
          handleMove(blockMove, 'O');
          return;
      }

      // 3. Pick Center
      if (!board[4]) {
          handleMove(4, 'O');
          return;
      }

      // 4. Pick Random Available
      const available = board.map((val, idx) => val === null ? idx : null).filter(val => val !== null) as number[];
      if (available.length > 0) {
          const random = available[Math.floor(Math.random() * available.length)];
          handleMove(random, 'O');
      }
  };

  const findBestMove = (player: string): number => {
      const lines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
      ];

      for (let i = 0; i < lines.length; i++) {
          const [a, b, c] = lines[i];
          const vals = [board[a], board[b], board[c]];
          const count = vals.filter(v => v === player).length;
          const empty = vals.filter(v => v === null).length;
          
          if (count === 2 && empty === 1) {
              if (!board[a]) return a;
              if (!board[b]) return b;
              if (!board[c]) return c;
          }
      }
      return -1;
  };

  const handleMove = (i: number, player: string) => {
      if (board[i] || gameStatus !== 'playing') return;

      const nextBoard = [...board];
      nextBoard[i] = player;
      setBoard(nextBoard);

      const w = calculateWinner(nextBoard);
      if (w) {
          setWinner(w);
          setGameStatus('won');
      } else if (nextBoard.every(Boolean)) {
          setGameStatus('draw');
      } else {
          setXIsNext(player === 'O'); // If O played, next is X
      }
  };

  const handleClick = (i: number) => {
    if (gameStatus !== 'playing' || !xIsNext) return; // Only allow click if playing and it's X's turn
    handleMove(i, 'X');
  };

  const resetGame = () => {
      setBoard(Array(9).fill(null));
      setXIsNext(true);
      setGameStatus('playing');
      setWinner(null);
  }

  return (
    <div className="flex flex-col items-center animate-fade-in w-full">
        <div className="flex justify-between items-center w-full mb-6">
            <div className="flex items-center gap-2">
                {onBack && (
                    <button onClick={onBack} className="p-1 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                    </button>
                )}
                <h3 className="text-xl font-bold text-indigo-400">Tic-Tac-Toe</h3>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6 bg-slate-700/30 p-3 rounded-xl border border-slate-700">
            {board.map((cell, i) => (
                <button
                    key={i}
                    onClick={() => handleClick(i)}
                    disabled={!!cell || !xIsNext || gameStatus !== 'playing'}
                    className={`
                        w-20 h-20 rounded-lg text-4xl font-bold flex items-center justify-center transition-all shadow-sm
                        ${cell === 'X' ? 'text-indigo-400 bg-slate-800 ring-2 ring-indigo-500/50' : cell === 'O' ? 'text-emerald-400 bg-slate-800 ring-2 ring-emerald-500/50' : 'bg-slate-800/80 hover:bg-slate-700'}
                        ${!cell && xIsNext && gameStatus === 'playing' ? 'cursor-pointer hover:scale-105' : 'cursor-default'}
                    `}
                >
                    {cell}
                </button>
            ))}
        </div>

        <div className="text-lg font-bold mb-6 text-white h-8 text-center">
            {gameStatus === 'won' ? (
                <span className={`animate-bounce inline-block ${winner === 'X' ? 'text-indigo-400' : 'text-emerald-400'}`}>
                    {winner === 'X' ? 'You Won! 🎉' : 'AI Won 🤖'}
                </span>
            ) : gameStatus === 'draw' ? (
                <span className="text-slate-400">It's a Draw!</span>
            ) : (
                <span className="text-slate-400 text-sm animate-pulse flex items-center gap-2">
                    {xIsNext ? (
                        <><span>Your Turn</span> <span className="font-bold text-indigo-400">(X)</span></>
                    ) : (
                        <><span>AI Thinking...</span> <span className="font-bold text-emerald-400">(O)</span></>
                    )}
                </span>
            )}
        </div>

        <Button onClick={resetGame} variant="secondary" size="sm" className="w-full">
            Restart Game
        </Button>
    </div>
  );
};

export default TicTacToe;