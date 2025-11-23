
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
    sm: 'w-8 h-12 text-sm rounded-md',
    md: 'w-14 h-20 text-lg md:w-16 md:h-24 md:text-xl rounded-xl',
    lg: 'w-24 h-36 text-3xl rounded-2xl',
  };

  // Standard styles
  const frontBaseClasses = `absolute inset-0 w-full h-full border-2 flex items-center justify-center font-bold shadow-md transition-all duration-200 ${sizeClasses[size]}`;
  
  const frontSelectedClasses = `bg-indigo-600 border-indigo-400 text-white -translate-y-4 shadow-indigo-500/50 z-10`;
  
  // Default unselected style
  const frontUnselectedClasses = `bg-slate-800 border-slate-600 text-slate-200 hover:brightness-110 hover:-translate-y-1`;

  const cardContent = (
    <div className={`
      ${frontBaseClasses}
      ${isSelected ? frontSelectedClasses : frontUnselectedClasses}
      ${faceDown && !revealed ? 'hidden' : 'block'}
    `}>
      {value}
    </div>
  );

  // Styles for the back of the card
  const cardBack = (
    <div className={`
      absolute inset-0 w-full h-full border-2 border-slate-600 bg-gradient-to-br from-slate-800 to-slate-900
      flex items-center justify-center overflow-hidden ${sizeClasses[size]} rounded-xl
    `}>
       {/* Pattern Overlay */}
      <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
      
      {/* Center Logo/Icon */}
      <div className="relative w-1/2 h-1/2 rounded-full bg-black/20 flex items-center justify-center backdrop-blur-sm border border-white/10">
        <span className="font-bold opacity-80 text-white text-opacity-80 text-xs">SP</span>
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
                  <div className={`absolute inset-0 w-full h-full backface-hidden rotate-y-180 overflow-hidden border-2 flex items-center justify-center font-bold shadow-lg ${sizeClasses[size]} bg-slate-800 border-slate-500 text-white`}>
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
