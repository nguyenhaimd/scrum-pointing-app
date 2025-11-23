import React, { useEffect, useState } from 'react';
import { TimerState } from '../types';

interface TimerProps {
  timer: TimerState;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  canControl: boolean;
}

const Timer: React.FC<TimerProps> = ({ timer, onStart, onPause, onReset, canControl }) => {
  const [displayTime, setDisplayTime] = useState(0);

  useEffect(() => {
    let interval: number;

    const updateTime = () => {
      const now = Date.now();
      const elapsed = timer.status === 'running' && timer.startTime 
        ? now - timer.startTime 
        : 0;
      setDisplayTime(timer.accumulated + elapsed);
    };

    // Initial update
    updateTime();

    if (timer.status === 'running') {
      // Update every 100ms for smoother feel, though we display seconds
      interval = window.setInterval(updateTime, 100);
    }

    return () => clearInterval(interval);
  }, [timer]);

  // Format milliseconds to MM:SS
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const timeString = formatTime(displayTime);
  const isRunning = timer.status === 'running';

  return (
    <div className="flex flex-col items-center gap-1 bg-slate-900/60 backdrop-blur px-4 py-2 rounded-xl border border-slate-700 shadow-lg">
      <div className={`font-mono text-2xl md:text-3xl font-bold tracking-widest ${isRunning ? 'text-emerald-400' : 'text-slate-400'}`}>
        {timeString}
      </div>
      
      {canControl && (
        <div className="flex items-center gap-2">
           {/* Play/Pause Toggle */}
           {!isRunning ? (
             <button 
               onClick={onStart}
               className="p-1 text-emerald-400 hover:bg-emerald-900/30 rounded transition-colors"
               title="Start Timer"
             >
               <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
             </button>
           ) : (
             <button 
               onClick={onPause}
               className="p-1 text-yellow-400 hover:bg-yellow-900/30 rounded transition-colors"
               title="Pause Timer"
             >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
             </button>
           )}

           {/* Reset */}
           <button 
             onClick={onReset}
             className="p-1 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
             title="Reset Timer"
           >
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
           </button>
        </div>
      )}
    </div>
  );
};

export default Timer;