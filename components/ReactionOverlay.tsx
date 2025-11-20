
import React, { useEffect, useState, useRef } from 'react';
import { Reaction } from '../types';

interface ReactionOverlayProps {
  lastReaction: Reaction | null;
}

interface FloatingEmoji {
  id: string;
  emoji: string;
  left: number; // percentage
  animationDuration: number;
}

const ReactionOverlay: React.FC<ReactionOverlayProps> = ({ lastReaction }) => {
  const [emojis, setEmojis] = useState<FloatingEmoji[]>([]);
  const lastProcessedId = useRef<string | null>(null);

  useEffect(() => {
    if (lastReaction && lastReaction.id !== lastProcessedId.current) {
      lastProcessedId.current = lastReaction.id;

      const newEmoji: FloatingEmoji = {
        id: lastReaction.id,
        emoji: lastReaction.emoji,
        left: Math.random() * 80 + 10, // Random position between 10% and 90%
        animationDuration: Math.random() * 1.5 + 1.5 // Random duration between 1.5s and 3s
      };

      setEmojis(prev => [...prev, newEmoji]);

      // Cleanup after animation
      setTimeout(() => {
        setEmojis(prev => prev.filter(e => e.id !== newEmoji.id));
      }, newEmoji.animationDuration * 1000);
    }
  }, [lastReaction]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[100]">
      {emojis.map(emoji => (
        <div
          key={emoji.id}
          className="absolute bottom-0 text-4xl md:text-6xl animate-float opacity-0"
          style={{
            left: `${emoji.left}%`,
            animation: `floatUp ${emoji.animationDuration}s ease-out forwards`
          }}
        >
          {emoji.emoji}
        </div>
      ))}
      <style>{`
        @keyframes floatUp {
          0% { transform: translateY(0) scale(0.5); opacity: 0; }
          10% { opacity: 1; transform: translateY(-20px) scale(1.2); }
          100% { transform: translateY(-80vh) scale(1); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default ReactionOverlay;
