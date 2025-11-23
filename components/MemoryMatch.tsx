import React, { useState, useEffect } from 'react';
// @ts-ignore
import confetti from 'canvas-confetti';
import Button from './Button';

interface MemoryProps {
  onClose: () => void;
  onBack?: () => void;
}

interface Card {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const EMOJIS = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼'];

const MemoryMatch: React.FC<MemoryProps> = ({ onClose, onBack }) => {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [gameWon, setGameWon] = useState(false);

  // Initialize Game
  useEffect(() => {
    resetGame();
  }, []);

  const resetGame = () => {
    const shuffled = [...EMOJIS, ...EMOJIS]
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({
        id: index,
        emoji,
        isFlipped: false,
        isMatched: false
      }));
    setCards(shuffled);
    setFlippedCards([]);
    setMoves(0);
    setGameWon(false);
    setIsProcessing(false);
  };

  const handleCardClick = (id: number) => {
    if (isProcessing || cards[id].isMatched || cards[id].isFlipped) return;

    const newCards = [...cards];
    newCards[id].isFlipped = true;
    setCards(newCards);

    const newFlipped = [...flippedCards, id];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(prev => prev + 1);
      setIsProcessing(true);
      checkForMatch(newFlipped, newCards);
    }
  };

  const checkForMatch = (currentFlipped: number[], currentCards: Card[]) => {
    const [first, second] = currentFlipped;
    
    if (currentCards[first].emoji === currentCards[second].emoji) {
      // Match Found
      const newCards = [...currentCards];
      newCards[first].isMatched = true;
      newCards[second].isMatched = true;
      setCards(newCards);
      setFlippedCards([]);
      setIsProcessing(false);

      if (newCards.every(c => c.isMatched)) {
          setGameWon(true);
          confetti({
             particleCount: 150,
             spread: 70,
             origin: { y: 0.6 },
             colors: ['#34d399', '#10b981'],
             zIndex: 10000
        });
      }
    } else {
      // No Match
      setTimeout(() => {
        const newCards = [...currentCards];
        newCards[first].isFlipped = false;
        newCards[second].isFlipped = false;
        setCards(newCards);
        setFlippedCards([]);
        setIsProcessing(false);
      }, 1000);
    }
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
            <h3 className="text-xl font-bold text-indigo-400">Memory Match</h3>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>

      <div className="mb-4 flex justify-between w-full px-2 text-sm text-slate-400 font-mono">
          <span>Moves: {moves}</span>
          <span>{cards.filter(c => c.isMatched).length / 2} / 8 Pairs</span>
      </div>

      <div className="grid grid-cols-4 gap-2 w-full mb-6">
        {cards.map((card) => (
            <div
                key={card.id}
                onClick={() => handleCardClick(card.id)}
                className={`
                    aspect-square rounded-lg flex items-center justify-center text-3xl cursor-pointer transition-all duration-300 transform perspective-1000
                    ${card.isFlipped || card.isMatched 
                        ? 'bg-indigo-600 rotate-y-180' 
                        : 'bg-slate-700 hover:bg-slate-600'
                    }
                    ${card.isMatched ? 'opacity-50 ring-2 ring-emerald-500' : ''}
                `}
            >
                <div className={`transition-opacity duration-300 ${card.isFlipped || card.isMatched ? 'opacity-100' : 'opacity-0'}`}>
                    {card.emoji}
                </div>
            </div>
        ))}
      </div>

      {gameWon ? (
          <div className="text-center animate-bounce mb-4">
              <h4 className="text-xl font-bold text-emerald-400">Excellent Memory! 🎉</h4>
              <p className="text-slate-400 text-sm">Solved in {moves} moves.</p>
          </div>
      ) : (
          <div className="h-14"></div> // Spacer
      )}

      <Button onClick={resetGame} variant="secondary" size="sm" className="w-full">
          Restart Game
      </Button>
    </div>
  );
};

export default MemoryMatch;