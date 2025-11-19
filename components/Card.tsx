import React from 'react';

interface CardProps {
  value: string | number;
  isSelected?: boolean;
  onClick?: () => void;
  faceDown?: boolean;
  revealed?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const Card: React.FC<CardProps> = ({ 
  value, 
  isSelected, 
  onClick, 
  faceDown = false, 
  revealed = false,
  size = 'md' 
}) => {
  
  const sizeClasses = {
    sm: 'w-8 h-12 text-sm',
    md: 'w-14 h-20 text-lg md:w-16 md:h-24 md:text-xl',
    lg: 'w-24 h-36 text-3xl',
  };

  // Handling the flip animation state
  // If faceDown is true, we show the back.
  // If revealed changes from false to true, the card should flip.
  
  const cardContent = (
    <div className={`
      absolute inset-0 w-full h-full rounded-xl border-2 flex items-center justify-center font-bold shadow-md
      transition-all duration-200
      ${isSelected ? 'bg-indigo-600 border-indigo-400 text-white -translate-y-4 shadow-indigo-500/50' : 'bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700 hover:border-slate-500'}
      ${faceDown && !revealed ? 'hidden' : 'block'}
    `}>
      {value}
    </div>
  );

  const cardBack = (
    <div className={`
      absolute inset-0 w-full h-full rounded-xl border-2 border-slate-700 bg-slate-900
      flex items-center justify-center
      bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]
    `}>
      <div className="w-8 h-8 rounded-full bg-indigo-900/50 flex items-center justify-center">
        <span className="text-indigo-500 font-bold">G</span>
      </div>
    </div>
  );

  if (faceDown) {
      return (
          <div className={`relative ${sizeClasses[size]} perspective-1000 transition-transform duration-500`} onClick={onClick}>
              <div className={`relative w-full h-full transition-all duration-700 transform-style-3d ${revealed ? 'rotate-y-180' : ''}`}>
                  {/* Front (Back of card pattern) */}
                  <div className="absolute inset-0 w-full h-full backface-hidden">
                      {cardBack}
                  </div>
                  {/* Back (Actual Value) - Rotated 180 initially so when parent rotates 180 it becomes visible */}
                  <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-xl overflow-hidden bg-slate-800 border-2 border-indigo-500 text-white flex items-center justify-center font-bold shadow-lg">
                      {value}
                  </div>
              </div>
          </div>
      )
  }

  return (
    <div 
      onClick={onClick}
      className={`
        relative ${sizeClasses[size]} cursor-pointer select-none transition-transform
      `}
    >
      {cardContent}
    </div>
  );
};

export default Card;