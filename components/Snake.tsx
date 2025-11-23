import React, { useState, useEffect, useRef, useCallback } from 'react';
import Button from './Button';

interface SnakeProps {
  onClose: () => void;
  onBack?: () => void;
}

const GRID_SIZE = 20;
const TILE_SIZE = 15;
const BOARD_WIDTH = 20;
const BOARD_HEIGHT = 20;
const INITIAL_SPEED = 150;

type Point = { x: number; y: number };

const Snake: React.FC<SnakeProps> = ({ onClose, onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [snake, setSnake] = useState<Point[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Point>({ x: 15, y: 15 });
  const [direction, setDirection] = useState<Point>({ x: 0, y: 0 }); // Start static
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  
  const directionRef = useRef(direction); // Ref to avoid closure staleness in interval
  
  useEffect(() => {
      const saved = localStorage.getItem('snake-highscore');
      if (saved) setHighScore(parseInt(saved));
  }, []);

  useEffect(() => {
      directionRef.current = direction;
  }, [direction]);

  const generateFood = useCallback((): Point => {
      return {
          x: Math.floor(Math.random() * BOARD_WIDTH),
          y: Math.floor(Math.random() * BOARD_HEIGHT)
      };
  }, []);

  const resetGame = () => {
      setSnake([{ x: 10, y: 10 }]);
      setFood(generateFood());
      setDirection({ x: 0, y: 0 });
      setGameOver(false);
      setScore(0);
  };

  // Game Loop
  useEffect(() => {
      if (gameOver) return;

      const context = canvasRef.current?.getContext('2d');
      if (!context) return;

      const interval = setInterval(() => {
          const currentDir = directionRef.current;
          
          if (currentDir.x === 0 && currentDir.y === 0) return;

          setSnake(prevSnake => {
              const head = { ...prevSnake[0] };
              head.x += currentDir.x;
              head.y += currentDir.y;

              // Check collision with walls
              if (head.x < 0 || head.x >= BOARD_WIDTH || head.y < 0 || head.y >= BOARD_HEIGHT) {
                  handleGameOver();
                  return prevSnake;
              }

              // Check collision with self
              for (const segment of prevSnake) {
                  if (head.x === segment.x && head.y === segment.y) {
                      handleGameOver();
                      return prevSnake;
                  }
              }

              const newSnake = [head, ...prevSnake];

              // Check Food
              if (head.x === food.x && head.y === food.y) {
                  setScore(s => s + 1);
                  setFood(generateFood());
              } else {
                  newSnake.pop(); // Remove tail if not eating
              }

              return newSnake;
          });
      }, Math.max(50, INITIAL_SPEED - (score * 2)));

      return () => clearInterval(interval);
  }, [food, gameOver, score, generateFood]);

  const handleGameOver = () => {
      setGameOver(true);
      setHighScore(prev => {
          const newHigh = Math.max(prev, score);
          localStorage.setItem('snake-highscore', newHigh.toString());
          return newHigh;
      });
  };

  // Controls
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
              e.preventDefault();
          }

          const current = directionRef.current;
          
          switch(e.key) {
              case 'ArrowUp':
                  if (current.y !== 1) setDirection({ x: 0, y: -1 });
                  break;
              case 'ArrowDown':
                  if (current.y !== -1) setDirection({ x: 0, y: 1 });
                  break;
              case 'ArrowLeft':
                  if (current.x !== 1) setDirection({ x: -1, y: 0 });
                  break;
              case 'ArrowRight':
                  if (current.x !== -1) setDirection({ x: 1, y: 0 });
                  break;
          }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Render Canvas
  useEffect(() => {
      const context = canvasRef.current?.getContext('2d');
      if (!context) return;

      // Clear
      context.fillStyle = '#1e293b'; // slate-800
      context.fillRect(0, 0, BOARD_WIDTH * TILE_SIZE, BOARD_HEIGHT * TILE_SIZE);

      // Draw Snake
      context.fillStyle = '#6366f1'; // indigo-500
      snake.forEach((segment, index) => {
          // Head is lighter
          if (index === 0) context.fillStyle = '#818cf8'; 
          else context.fillStyle = '#6366f1';
          
          context.fillRect(segment.x * TILE_SIZE, segment.y * TILE_SIZE, TILE_SIZE - 1, TILE_SIZE - 1);
      });

      // Draw Food
      context.fillStyle = '#ef4444'; // red-500
      context.beginPath();
      context.arc(
        food.x * TILE_SIZE + TILE_SIZE / 2, 
        food.y * TILE_SIZE + TILE_SIZE / 2, 
        TILE_SIZE / 2 - 1, 
        0, 
        2 * Math.PI
      );
      context.fill();

  }, [snake, food]);

  return (
    <div className="flex flex-col items-center animate-fade-in w-full">
        {/* Header */}
        <div className="flex justify-between items-center w-full mb-4">
            <div className="flex items-center gap-2">
                {onBack && (
                    <button onClick={onBack} className="p-1 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                    </button>
                )}
                <h3 className="text-xl font-bold text-indigo-400">Snake</h3>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
        </div>

        {/* Score Board */}
        <div className="flex justify-between w-full bg-slate-800 p-2 rounded-lg border border-slate-700 mb-4 text-sm font-mono">
            <div className="text-emerald-400">SCORE: {score}</div>
            <div className="text-yellow-500">HI: {highScore}</div>
        </div>

        {/* Game Canvas */}
        <div className="relative border-4 border-slate-700 rounded-lg overflow-hidden bg-slate-800 shadow-2xl">
            <canvas 
                ref={canvasRef} 
                width={BOARD_WIDTH * TILE_SIZE} 
                height={BOARD_HEIGHT * TILE_SIZE}
                className="block"
            />
            
            {/* Overlay */}
            {(gameOver || (direction.x === 0 && direction.y === 0)) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/70 backdrop-blur-sm">
                    {gameOver ? (
                        <>
                            <div className="text-red-500 font-bold text-2xl mb-2">GAME OVER</div>
                            <Button onClick={resetGame} size="sm">Try Again</Button>
                        </>
                    ) : (
                        <div className="text-slate-300 text-sm animate-pulse">Press Arrow Keys to Start</div>
                    )}
                </div>
            )}
        </div>

        <div className="mt-4 text-xs text-slate-500">
            Use arrow keys to move
        </div>
    </div>
  );
};

export default Snake;