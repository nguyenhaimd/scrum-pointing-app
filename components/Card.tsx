
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
    sm: 'w-10 h-16 text-lg rounded-lg',
    md: 'w-20 h-32 text-4xl rounded-xl',
    lg: 'w-28 h-44 text-6xl rounded-2xl',
  };

  // Card Container Styles
  const containerStyles = `relative ${sizeClasses[size]} cursor-pointer select-none perspective-1000 transition-all duration-300 transform-gpu`;
  
  // Inner Content wrapper
  const innerStyles = `relative w-full h-full transition-all duration-500 transform-style-3d shadow-2xl ${
    faceDown && !revealed ? 'rotate-y-180' : 'rotate-y-0'
  } ${isSelected ? '-translate-y-6 shadow-indigo-500/40' : 'hover:-translate-y-2 hover:shadow-black/50'}`;

  // Front Face (The Value)
  const frontFace = `
    absolute inset-0 w-full h-full backface-hidden 
    bg-gradient-to-br from-white via-slate-50 to-slate-200
    border-[1px] flex items-center justify-center font-black text-slate-800
    ${isSelected ? 'border-indigo-500 ring-4 ring-indigo-500/30' : 'border-white/40'}
    ${sizeClasses[size]}
    overflow-hidden shadow-inner
  `;

  // Back Face (The Pattern)
  const backFace = `
    absolute inset-0 w-full h-full backface-hidden rotate-y-180
    bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 
    border-[2px] border-indigo-400/30
    flex items-center justify-center ${sizeClasses[size]}
    shadow-inner
  `;

  return (
    <div className={containerStyles} onClick={onClick}>
      <div className={innerStyles}>
        
        {/* Front of Card (Value) */}
        <div className={frontFace}>
            {/* Subtle noise texture */}
            <div className="absolute inset-0 opacity-[0.03]" 
                 style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
            ></div>
            
            {/* Corner Numbers */}
            {(size === 'md' || size === 'lg') && (
              <>
                <span className="absolute top-1 left-1.5 text-[0.3em] font-bold opacity-40">{value}</span>
                <span className="absolute bottom-1 right-1.5 text-[0.3em] font-bold opacity-40 rotate-180">{value}</span>
              </>
            )}
            
            <span className="relative z-10 drop-shadow-md transform scale-110 tracking-tighter">{value}</span>
        </div>

        {/* Back of Card (Pattern) */}
        <div className={backFace}>
           {/* Geometric Pattern */}
           <div className="absolute inset-0 opacity-20" 
                style={{ 
                    backgroundImage: 'radial-gradient(circle at center, transparent 0%, #000 100%), repeating-linear-gradient(45deg, rgba(255,255,255,0.1) 0px, rgba(255,255,255,0.1) 2px, transparent 2px, transparent 10px)'
                }}
           ></div>
           
           {/* Center Logo/Icon */}
           <div className="relative w-1/2 h-1/2 rounded-full border border-white/20 flex items-center justify-center bg-white/5 backdrop-blur-md shadow-lg">
              <span className="text-xl opacity-80">♠️</span>
           </div>
        </div>

      </div>
    </div>
  );
};

export default Card;
