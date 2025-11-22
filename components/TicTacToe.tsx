import React, { useState, useEffect, useCallback } from 'react';
import Button from './Button';

// ==============================
// TIC TAC TOE GAME
// ==============================
const TicTacToeGame = ({ onBack }: { onBack: () => void }) => {
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true); // Human is X
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'draw'>('playing');
  const [winner, setWinner] = useState<string | null>(null);

  const calculateWinner = (squares: (string | null)[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return null;
  };

  useEffect(() => {
    if (!xIsNext && gameStatus === 'playing') {
        const timer = setTimeout(() => {
            makeComputerMove();
        }, 600);
        return () => clearTimeout(timer);
    }
  }, [xIsNext, gameStatus, board]);

  const makeComputerMove = () => {
      const winMove = findBestMove('O');
      if (winMove !== -1) {
          handleMove(winMove, 'O');
          return;
      }
      const blockMove = findBestMove('X');
      if (blockMove !== -1) {
          handleMove(blockMove, 'O');
          return;
      }
      if (!board[4]) {
          handleMove(4, 'O');
          return;
      }
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
          setXIsNext(player === 'O');
      }
  };

  const handleClick = (i: number) => {
    if (gameStatus !== 'playing' || !xIsNext) return;
    handleMove(i, 'X');
  };

  const resetGame = () => {
      setBoard(Array(9).fill(null));
      setXIsNext(true);
      setGameStatus('playing');
      setWinner(null);
  }

  return (
    <div className="flex flex-col items-center w-full">
        <div className="flex justify-between items-center w-full mb-4">
            <h3 className="text-xl font-bold text-indigo-400">Man vs Machine</h3>
            <button onClick={onBack} className="text-sm text-slate-400 hover:text-white underline">Back</button>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-6 bg-slate-800 p-2 rounded-xl">
            {board.map((cell, i) => (
                <button
                    key={i}
                    onClick={() => handleClick(i)}
                    disabled={!!cell || !xIsNext || gameStatus !== 'playing'}
                    className={`
                        w-20 h-20 rounded-lg text-4xl font-bold flex items-center justify-center transition-all
                        ${cell === 'X' ? 'text-indigo-400 bg-slate-700' : cell === 'O' ? 'text-emerald-400 bg-slate-700' : 'bg-slate-700 hover:bg-slate-600'}
                        ${!cell && xIsNext && gameStatus === 'playing' ? 'cursor-pointer hover:ring-2 hover:ring-indigo-500/50' : 'cursor-default'}
                    `}
                >
                    {cell}
                </button>
            ))}
        </div>
        <div className="text-lg font-bold mb-4 text-white h-8">
            {gameStatus === 'won' ? (
                <span className={winner === 'X' ? 'text-indigo-400' : 'text-emerald-400'}>
                    {winner === 'X' ? 'You Won! 🎉' : 'AI Won 🤖'}
                </span>
            ) : gameStatus === 'draw' ? (
                <span className="text-slate-400">It's a Draw!</span>
            ) : (
                <span className="text-slate-400 text-sm animate-pulse">
                    {xIsNext ? 'Your Turn (X)' : 'AI Thinking...'}
                </span>
            )}
        </div>
        <Button onClick={resetGame} variant="secondary" size="sm">Restart Game</Button>
    </div>
  );
};

// ==============================
// CONNECT 4 GAME
// ==============================
const ConnectFourGame = ({ onBack }: { onBack: () => void }) => {
    const ROWS = 6;
    const COLS = 7;
    const [board, setBoard] = useState<(string | null)[]>(Array(ROWS * COLS).fill(null));
    const [isPlayerTurn, setIsPlayerTurn] = useState(true); // True = Red (Player), False = Yellow (AI)
    const [winner, setWinner] = useState<string | null>(null);
    const [isDraw, setIsDraw] = useState(false);

    const checkWin = (squares: (string | null)[]) => {
        // Horizontal
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS - 3; c++) {
                const i = r * COLS + c;
                if (squares[i] && squares[i] === squares[i+1] && squares[i] === squares[i+2] && squares[i] === squares[i+3]) return squares[i];
            }
        }
        // Vertical
        for (let r = 0; r < ROWS - 3; r++) {
            for (let c = 0; c < COLS; c++) {
                const i = r * COLS + c;
                if (squares[i] && squares[i] === squares[i+COLS] && squares[i] === squares[i+COLS*2] && squares[i] === squares[i+COLS*3]) return squares[i];
            }
        }
        // Diagonal Down-Right
        for (let r = 0; r < ROWS - 3; r++) {
            for (let c = 0; c < COLS - 3; c++) {
                const i = r * COLS + c;
                if (squares[i] && squares[i] === squares[i+COLS+1] && squares[i] === squares[i+COLS*2+2] && squares[i] === squares[i+COLS*3+3]) return squares[i];
            }
        }
        // Diagonal Up-Right
        for (let r = 3; r < ROWS; r++) {
            for (let c = 0; c < COLS - 3; c++) {
                const i = r * COLS + c;
                if (squares[i] && squares[i] === squares[i-COLS+1] && squares[i] === squares[i-COLS*2+2] && squares[i] === squares[i-COLS*3+3]) return squares[i];
            }
        }
        return null;
    };

    const getLowestEmptyRow = (col: number, currentBoard: (string|null)[]) => {
        for (let r = ROWS - 1; r >= 0; r--) {
            if (!currentBoard[r * COLS + col]) return r;
        }
        return -1;
    };

    const handleColumnClick = (col: number) => {
        if (!isPlayerTurn || winner || isDraw) return;
        
        const row = getLowestEmptyRow(col, board);
        if (row === -1) return; // Column full

        const newBoard = [...board];
        newBoard[row * COLS + col] = 'R'; // Player is Red
        
        setBoard(newBoard);
        
        const w = checkWin(newBoard);
        if (w) {
            setWinner('Player');
        } else if (!newBoard.includes(null)) {
            setIsDraw(true);
        } else {
            setIsPlayerTurn(false);
        }
    };

    // AI Turn
    useEffect(() => {
        if (!isPlayerTurn && !winner && !isDraw) {
            const timer = setTimeout(() => {
                makeAIMove();
            }, 700);
            return () => clearTimeout(timer);
        }
    }, [isPlayerTurn, winner, isDraw]);

    const makeAIMove = () => {
        const validCols = [];
        for(let c=0; c<COLS; c++) {
            if(getLowestEmptyRow(c, board) !== -1) validCols.push(c);
        }

        if (validCols.length === 0) return;

        let chosenCol = -1;

        // 1. Check for win
        for (let c of validCols) {
            const tempBoard = [...board];
            const r = getLowestEmptyRow(c, tempBoard);
            tempBoard[r * COLS + c] = 'Y';
            if (checkWin(tempBoard) === 'Y') {
                chosenCol = c;
                break;
            }
        }

        // 2. Block opponent win
        if (chosenCol === -1) {
            for (let c of validCols) {
                const tempBoard = [...board];
                const r = getLowestEmptyRow(c, tempBoard);
                tempBoard[r * COLS + c] = 'R';
                if (checkWin(tempBoard) === 'R') {
                    chosenCol = c;
                    break;
                }
            }
        }

        // 3. Pick Center or Random
        if (chosenCol === -1) {
            if (validCols.includes(3)) chosenCol = 3; // Center preference
            else chosenCol = validCols[Math.floor(Math.random() * validCols.length)];
        }

        const row = getLowestEmptyRow(chosenCol, board);
        const newBoard = [...board];
        newBoard[row * COLS + chosenCol] = 'Y';
        setBoard(newBoard);

        const w = checkWin(newBoard);
        if (w) {
            setWinner('AI');
        } else if (!newBoard.includes(null)) {
            setIsDraw(true);
        } else {
            setIsPlayerTurn(true);
        }
    };

    const resetGame = () => {
        setBoard(Array(ROWS * COLS).fill(null));
        setWinner(null);
        setIsDraw(false);
        setIsPlayerTurn(true);
    };

    return (
        <div className="flex flex-col items-center w-full">
             <div className="flex justify-between items-center w-full mb-4">
                <h3 className="text-xl font-bold text-red-400">Connect 4</h3>
                <button onClick={onBack} className="text-sm text-slate-400 hover:text-white underline">Back</button>
            </div>

            <div className="bg-blue-700 p-3 rounded-lg shadow-xl border-4 border-blue-800">
                <div className="grid grid-cols-7 gap-1 sm:gap-2">
                    {board.map((cell, idx) => {
                        const col = idx % COLS;
                        return (
                            <div 
                                key={idx}
                                onClick={() => handleColumnClick(col)}
                                className={`
                                    w-8 h-8 sm:w-10 sm:h-10 rounded-full shadow-inner transition-colors flex items-center justify-center
                                    ${cell === 'R' ? 'bg-red-500' : cell === 'Y' ? 'bg-yellow-400' : 'bg-slate-900'}
                                    ${!cell && isPlayerTurn && !winner ? 'cursor-pointer hover:bg-slate-800' : ''}
                                `}
                            >
                                {cell && <div className="w-full h-full rounded-full opacity-20 bg-white transform scale-75 origin-top-left"></div>}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="mt-6 h-8 text-center">
                {winner ? (
                    <span className={`text-xl font-bold ${winner === 'Player' ? 'text-red-400' : 'text-yellow-400'}`}>
                        {winner === 'Player' ? 'You Won! 🎉' : 'AI Won 🤖'}
                    </span>
                ) : isDraw ? (
                    <span className="text-slate-300">It's a Draw!</span>
                ) : (
                    <span className={`text-sm font-medium ${isPlayerTurn ? 'text-red-300' : 'text-yellow-300'}`}>
                        {isPlayerTurn ? "Your Turn (Red)" : "AI Thinking..."}
                    </span>
                )}
            </div>
            
            <div className="mt-2">
                <Button onClick={resetGame} variant="secondary" size="sm">Restart Game</Button>
            </div>
        </div>
    );
};

// ==============================
// ROCK PAPER SCISSORS GAME
// ==============================
const RockPaperScissorsGame = ({ onBack }: { onBack: () => void }) => {
    const [score, setScore] = useState({ player: 0, computer: 0 });
    const [lastResult, setLastResult] = useState<'win'|'loss'|'draw'|null>(null);
    const [computerChoice, setComputerChoice] = useState<string|null>(null);
    const [playerChoice, setPlayerChoice] = useState<string|null>(null);
    const [isAnimating, setIsAnimating] = useState(false);

    const choices = [
        { id: 'R', label: 'Rock', icon: '🪨' },
        { id: 'P', label: 'Paper', icon: '📄' },
        { id: 'S', label: 'Scissors', icon: '✂️' },
    ];

    const handleChoice = (choiceId: string) => {
        setIsAnimating(true);
        setPlayerChoice(choiceId);
        setComputerChoice(null);
        setLastResult(null);

        setTimeout(() => {
            const random = choices[Math.floor(Math.random() * choices.length)];
            setComputerChoice(random.id);
            
            let result: 'win'|'loss'|'draw' = 'draw';
            if (choiceId !== random.id) {
                if (
                    (choiceId === 'R' && random.id === 'S') ||
                    (choiceId === 'P' && random.id === 'R') ||
                    (choiceId === 'S' && random.id === 'P')
                ) {
                    result = 'win';
                    setScore(s => ({ ...s, player: s.player + 1 }));
                } else {
                    result = 'loss';
                    setScore(s => ({ ...s, computer: s.computer + 1 }));
                }
            }
            setLastResult(result);
            setIsAnimating(false);
        }, 1000);
    };

    return (
        <div className="flex flex-col items-center w-full">
            <div className="flex justify-between items-center w-full mb-4">
                <h3 className="text-xl font-bold text-slate-300">Rock Paper Scissors</h3>
                <button onClick={onBack} className="text-sm text-slate-400 hover:text-white underline">Back</button>
            </div>

            {/* Scoreboard */}
            <div className="flex gap-8 mb-8 bg-slate-800 p-4 rounded-xl border border-slate-700">
                <div className="text-center">
                    <div className="text-xs text-slate-400 uppercase">You</div>
                    <div className="text-2xl font-bold text-indigo-400">{score.player}</div>
                </div>
                <div className="text-center">
                    <div className="text-xs text-slate-400 uppercase">AI</div>
                    <div className="text-2xl font-bold text-red-400">{score.computer}</div>
                </div>
            </div>

            {/* Game Area */}
            <div className="flex items-center justify-center gap-8 mb-8 h-24">
                 {isAnimating ? (
                     <div className="text-4xl animate-bounce">🤜🤛</div>
                 ) : lastResult ? (
                     <>
                        <div className="flex flex-col items-center">
                            <div className="text-4xl bg-slate-700 p-3 rounded-full border-2 border-indigo-500">
                                {choices.find(c => c.id === playerChoice)?.icon}
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-slate-500">VS</div>
                        <div className="flex flex-col items-center">
                             <div className="text-4xl bg-slate-700 p-3 rounded-full border-2 border-red-500">
                                {choices.find(c => c.id === computerChoice)?.icon}
                             </div>
                        </div>
                     </>
                 ) : (
                     <div className="text-slate-400 text-sm">Choose your weapon!</div>
                 )}
            </div>

            {/* Result Text */}
            <div className="h-8 mb-6">
                {lastResult && (
                    <span className={`text-xl font-bold ${
                        lastResult === 'win' ? 'text-emerald-400' : 
                        lastResult === 'loss' ? 'text-red-400' : 'text-yellow-400'
                    }`}>
                        {lastResult === 'win' ? 'You Won!' : lastResult === 'loss' ? 'You Lost!' : 'Draw!'}
                    </span>
                )}
            </div>

            {/* Controls */}
            <div className="flex gap-4">
                {choices.map(c => (
                    <button
                        key={c.id}
                        onClick={() => handleChoice(c.id)}
                        disabled={isAnimating}
                        className="flex flex-col items-center gap-2 group disabled:opacity-50"
                    >
                        <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center text-3xl border-2 border-slate-600 group-hover:border-indigo-400 group-hover:bg-slate-600 transition-all transform group-hover:scale-110 group-active:scale-95">
                            {c.icon}
                        </div>
                        <span className="text-xs text-slate-400 group-hover:text-white">{c.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

// ==============================
// MAIN GAME HUB
// ==============================
interface GameHubProps {
  onClose: () => void;
}

const GameHub: React.FC<GameHubProps> = ({ onClose }) => {
  const [activeGame, setActiveGame] = useState<'menu' | 'tictactoe' | 'connect4' | 'rps'>('menu');

  const renderContent = () => {
    switch (activeGame) {
        case 'tictactoe':
            return <TicTacToeGame onBack={() => setActiveGame('menu')} />;
        case 'connect4':
            return <ConnectFourGame onBack={() => setActiveGame('menu')} />;
        case 'rps':
            return <RockPaperScissorsGame onBack={() => setActiveGame('menu')} />;
        default:
            return (
                <div className="grid grid-cols-1 gap-4 w-full">
                    <button 
                        onClick={() => setActiveGame('tictactoe')}
                        className="p-4 bg-slate-700 hover:bg-slate-600 rounded-xl border border-slate-600 transition-all flex items-center gap-4 group"
                    >
                        <div className="text-3xl bg-slate-800 p-2 rounded-lg group-hover:scale-110 transition-transform">❌</div>
                        <div className="text-left">
                            <div className="font-bold text-lg text-white">Tic Tac Toe</div>
                            <div className="text-xs text-slate-400">Classic 3x3 Strategy</div>
                        </div>
                    </button>

                    <button 
                        onClick={() => setActiveGame('connect4')}
                        className="p-4 bg-slate-700 hover:bg-slate-600 rounded-xl border border-slate-600 transition-all flex items-center gap-4 group"
                    >
                        <div className="text-3xl bg-slate-800 p-2 rounded-lg group-hover:scale-110 transition-transform">🔴</div>
                        <div className="text-left">
                            <div className="font-bold text-lg text-white">Connect 4</div>
                            <div className="text-xs text-slate-400">Connect 4 in a row to win</div>
                        </div>
                    </button>

                    <button 
                        onClick={() => setActiveGame('rps')}
                        className="p-4 bg-slate-700 hover:bg-slate-600 rounded-xl border border-slate-600 transition-all flex items-center gap-4 group"
                    >
                        <div className="text-3xl bg-slate-800 p-2 rounded-lg group-hover:scale-110 transition-transform">✂️</div>
                        <div className="text-left">
                            <div className="font-bold text-lg text-white">Rock Paper Scissors</div>
                            <div className="text-xs text-slate-400">Quick luck & strategy</div>
                        </div>
                    </button>
                </div>
            );
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-6 max-w-md w-full flex flex-col items-center relative">
        
        {/* Header */}
        <div className="flex justify-between items-center w-full mb-6 pb-2 border-b border-slate-700">
            <div className="flex items-center gap-2">
                <span className="text-2xl">🎮</span>
                <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Arcade</h3>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
        </div>

        {/* Content */}
        <div className="w-full">
            {renderContent()}
        </div>

      </div>
    </div>
  );
};

export default GameHub;
