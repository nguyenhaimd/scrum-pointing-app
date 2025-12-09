
import React from 'react';
import { POINTING_SCALE } from '../constants';
import Card from './Card';
import { Story, UserRole, User } from '../types';

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

  return (
    <div className="fixed bottom-0 left-0 w-full md:absolute md:inset-x-0 p-4 pb-6 md:pb-4 bg-slate-900/95 border-t border-slate-700/80 backdrop-blur-xl z-50 overflow-x-auto shadow-[0_-4px_20px_rgba(0,0,0,0.5)] animate-fade-in transition-all duration-300">
      <div className="md:hidden text-center text-xs font-bold text-indigo-300 uppercase tracking-widest mb-3 animate-pulse">Select Estimate</div>
      <div className="flex justify-center gap-2 md:gap-4 min-w-max px-4 mx-auto">
        {POINTING_SCALE.map((value) => (
          <Card
            key={value}
            value={value}
            isSelected={selectedVote === value}
            onClick={() => onVote(value)}
            size="md"
            title={`Vote ${value}`}
          />
        ))}
      </div>
    </div>
  );
};

export default VotingControls;