
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
    sm: 'w-9 h-14 text-base rounded-md',
    md: 'w-16 h-24 text-2xl rounded-xl',
    lg: 'w-28 h-40 text-4xl rounded-2xl',
  };

  // Standard Face-Up Styles (White card, dark text for readability)
  const frontBaseClasses = `absolute inset-0 w-full h-full border-2 flex items-center justify-center font-bold shadow-md transition-all duration-200 ${sizeClasses[size]}`;
  
  const frontSelectedClasses = `bg-indigo-100 border-indigo-500 text-indigo-900 -translate-y-3 shadow-indigo-500/40 z-10 ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-900`;
  
  // Default unselected style
  const frontUnselectedClasses = `bg-white border-slate-300 text-slate-800 hover:-translate-y-1 hover:shadow-lg`;

  const cardContent = (
    <div className={`
      ${frontBaseClasses}
      ${isSelected ? frontSelectedClasses : frontUnselectedClasses}
      ${faceDown && !revealed ? 'hidden' : 'block'}
    `}>
      {value}
    </div>
  );

  // Styles for the back of the card (Face Down)
  const cardBack = (
    <div className={`
      absolute inset-0 w-full h-full border-4 border-white/10 bg-indigo-600
      flex items-center justify-center overflow-hidden ${sizeClasses[size]} rounded-xl shadow-sm
    `}>
       {/* Simple Pattern */}
       <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/20 to-transparent" style={{ backgroundSize: '10px 10px', backgroundImage: 'radial-gradient(white 1px, transparent 0)' }}></div>
      
      {/* Center Logo */}
      <div className="relative w-8 h-8 rounded-full border-2 border-white/30 flex items-center justify-center">
         <span className="text-[10px] font-bold text-white/80">SP</span>
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
                  {/* Back (Actual Value) - Rotated 180 initially */}
                  <div className={`absolute inset-0 w-full h-full backface-hidden rotate-y-180 overflow-hidden border-2 flex items-center justify-center font-bold shadow-lg ${sizeClasses[size]} bg-white border-slate-200 text-slate-900`}>
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
