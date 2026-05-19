
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { POINTING_SCALE } from '../constants';
import Card from './Card';
import { Story, UserRole, User } from '../types';
import { playSound } from '../services/soundService';

interface VotingControlsProps {
  currentStory: Story | null;
  currentUser: User;
  selectedVote: string | number | null | undefined;
  onVote: (value: string | number) => void;
  disabled: boolean;
}

const VotingControls: React.FC<VotingControlsProps> = ({ currentStory, currentUser, selectedVote, onVote, disabled }) => {
  if (!currentStory) return null;
  if (disabled) return null;
  
  // Allow ONLY Developers to vote
  const canVote = currentUser.role === UserRole.DEVELOPER;
  if (!canVote) return null;

  const handleVote = (value: string | number) => {
    playSound.vote();
    onVote(value);
  };

  return (
    <div className="fixed bottom-0 left-0 w-full p-4 pb-8 bg-gradient-to-t from-slate-950 via-slate-900/95 to-transparent z-50 pointer-events-none">
      <div className="max-w-4xl mx-auto flex flex-col items-center pointer-events-auto">
        <AnimatePresence mode="wait">
          {selectedVote && (
            <motion.div
              key="selection-prompt"
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              className="mb-8 flex flex-col items-center gap-1"
            >
              <div className="px-4 py-1.5 rounded-full bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.4)] border border-indigo-400 flex items-center gap-2">
                <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Locked In</span>
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
              </div>
              <p className="text-[10px] text-indigo-400/60 font-medium uppercase tracking-[0.1em] mt-1">Tap a different card to change</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative h-32 md:h-44 w-full flex justify-center items-end">
          <div className="relative flex justify-center w-full max-w-xl group">
            {POINTING_SCALE.map((value, index) => {
              const total = POINTING_SCALE.length;
              const mid = (total - 1) / 2;
              const offset = index - mid;
              
              // Fan calculations
              const rotation = offset * 5; // degrees
              const translateY = Math.abs(offset) * 6; // pixels downwards for arc
              const translateX = offset * 40; // horizontal spread
              
              const isSelected = selectedVote === value;

              return (
                <motion.div
                  key={value}
                  initial={{ opacity: 0, y: 100, rotate: rotation }}
                  animate={{ 
                    opacity: 1, 
                    y: isSelected ? -45 : translateY, 
                    rotate: isSelected ? 0 : rotation,
                    x: translateX,
                    zIndex: isSelected ? 50 : index,
                    scale: isSelected ? 1.25 : 1
                  }}
                  whileHover={{ 
                    y: isSelected ? -55 : translateY - 15, 
                    scale: isSelected ? 1.3 : 1.15,
                    zIndex: 60,
                    transition: { duration: 0.2 }
                  }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 400, 
                    damping: 30,
                    delay: index * 0.03
                  }}
                  className="absolute bottom-0"
                >
                  <Card
                    value={value}
                    isSelected={isSelected}
                    onClick={() => handleVote(value)}
                    size="md"
                    title={`Vote ${value}`}
                  />
                  
                  {isSelected && (
                    <motion.div 
                      layoutId="selection-glow"
                      className="absolute -inset-2 bg-indigo-500 rounded-2xl blur-2xl opacity-30 -z-10"
                    />
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
        
        {!selectedVote && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 text-center"
          >
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em] animate-pulse">
              Select your card
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default VotingControls;
