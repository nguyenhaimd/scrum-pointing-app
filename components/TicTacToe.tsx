import React, { useState } from 'react';
import Button from './Button';

interface TicTacToeProps {
  onClose: () => void;
}

const TicTacToe: React.FC<TicTacToeProps> = ({ onClose }) => {
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);

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

  const winner = calculateWinner(board);
  const isDraw = !winner && board.every(Boolean);

  const handleClick = (i: number) => {
    if (board[i] || winner) return;
    const nextBoard = [...board];
    nextBoard[i] = xIsNext ? 'X' : 'O';
    setBoard(nextBoard);
    setXIsNext(!xIsNext);
  };

  const resetGame = () => {
      setBoard(Array(9).fill(null));
      setXIsNext(true);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-6 max-w-sm w-full flex flex-col items-center">
        <div className="flex justify-between items-center w-full mb-4">
            <h3 className="text-xl font-bold text-indigo-400">Tic-Tac-Toe</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-6">
            {board.map((cell, i) => (
                <button
                    key={i}
                    onClick={() => handleClick(i)}
                    className={`
                        w-20 h-20 rounded-lg text-4xl font-bold flex items-center justify-center transition-all
                        ${cell === 'X' ? 'text-indigo-400 bg-slate-700/50' : cell === 'O' ? 'text-emerald-400 bg-slate-700/50' : 'bg-slate-700 hover:bg-slate-600'}
                        ${!cell && !winner ? 'cursor-pointer' : 'cursor-default'}
                    `}
                >
                    {cell}
                </button>
            ))}
        </div>

        <div className="text-lg font-bold mb-4 text-white">
            {winner ? `Winner: ${winner} 🎉` : isDraw ? "It's a Draw!" : `Next Player: ${xIsNext ? 'X' : 'O'}`}
        </div>

        <Button onClick={resetGame} variant="secondary" size="sm">
            Restart Game
        </Button>
      </div>
    </div>
  );
};

export default TicTacToe;