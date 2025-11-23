import React, { useRef, useState, useEffect } from 'react';
import { User } from '../types';

interface WhiteboardProps {
  currentUser: User;
  onClose: () => void;
}

const Whiteboard: React.FC<WhiteboardProps> = ({ currentUser, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#6366f1'); // Indigo-500
  const [lineWidth, setLineWidth] = useState(3);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const parent = canvas.parentElement;
    if (parent) {
      // Set actual canvas size to match display size for sharp rendering
      const rect = parent.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    }

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
    }

    const handleResize = () => {
        if (parent && canvas && ctx) {
            // Save current content
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx?.drawImage(canvas, 0, 0);

            // Resize
            const rect = parent.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;
            
            // Restore content
            ctx.drawImage(tempCanvas, 0, 0);
            
            // Restore context props
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = color;
            ctx.lineWidth = lineWidth;
        }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update context styles when state changes
  useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (ctx) {
          ctx.strokeStyle = color;
          ctx.lineWidth = lineWidth;
      }
  }, [color, lineWidth]);

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    
    if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = (e as React.MouseEvent).clientX;
        clientY = (e as React.MouseEvent).clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Prevent scrolling on touch
    // e.preventDefault(); // Note: React synthetic events might not support this directly in all cases, handled by CSS touch-action: none

    setIsDrawing(true);
    const { x, y } = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getPos(e, canvas);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
        setIsDrawing(false);
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        ctx?.closePath();
    }
  };

  const clearBoard = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/95 backdrop-blur-sm p-4 animate-fade-in">
      <div className="flex flex-col w-full max-w-5xl h-[85vh] bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden relative">
        
        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 bg-slate-900 border-b border-slate-700 z-10 shrink-0">
           <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide">
               <div className="flex items-center gap-2 text-white font-bold shrink-0">
                   <span className="text-2xl">✏️</span>
                   <span className="hidden sm:inline">Whiteboard</span>
               </div>
               
               <div className="h-8 w-px bg-slate-700 mx-2 shrink-0"></div>

               <div className="flex items-center gap-3 shrink-0">
                   <input 
                     type="color" 
                     value={color} 
                     onChange={(e) => setColor(e.target.value)}
                     className="w-8 h-8 rounded cursor-pointer bg-transparent border border-slate-600 p-0.5"
                     title="Brush Color"
                   />
                   
                   <div className="flex items-center gap-2 bg-slate-800 rounded-lg border border-slate-700 px-3 py-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                      <input 
                        type="range" 
                        min="1" 
                        max="20" 
                        value={lineWidth} 
                        onChange={(e) => setLineWidth(parseInt(e.target.value))}
                        className="w-24 h-1 accent-indigo-500 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                        title="Brush Size"
                      />
                      <div className="w-4 h-4 rounded-full bg-slate-400"></div>
                   </div>
               </div>

               <button 
                  onClick={clearBoard} 
                  className="shrink-0 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-red-900/30 border border-slate-700 hover:border-red-500/50 px-3 py-2 rounded transition-colors ml-2"
               >
                   Clear
               </button>
           </div>

           <button 
             onClick={onClose}
             className="text-slate-400 hover:text-white hover:bg-slate-700 p-2 rounded-full transition-colors shrink-0 ml-2"
           >
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
           </button>
        </div>

        {/* Drawing Area */}
        <div className="flex-1 relative bg-[#1e293b] cursor-crosshair touch-none w-full h-full overflow-hidden">
             {/* Grid Background Pattern */}
             <div className="absolute inset-0 pointer-events-none opacity-10" 
                  style={{ 
                      backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)', 
                      backgroundSize: '20px 20px' 
                  }}
             ></div>
             
             <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="absolute inset-0 block w-full h-full outline-none"
             />
             
             <div className="absolute bottom-4 right-4 text-[10px] text-slate-600 pointer-events-none select-none bg-slate-900/50 px-2 py-1 rounded">
                 Local Scratchpad
             </div>
        </div>
      </div>
    </div>
  );
};

export default Whiteboard;