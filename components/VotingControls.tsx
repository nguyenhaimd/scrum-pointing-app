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
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900/90 border-t border-slate-700 backdrop-blur-lg z-40 overflow-x-auto">
      <div className="max-w-5xl mx-auto flex justify-center gap-2 md:gap-4 min-w-max px-4">
        {POINTING_SCALE.map((value) => (
          <Card
            key={value}
            value={value}
            isSelected={selectedVote === value}
            onClick={() => onVote(value)}
            size="md"
          />
        ))}
      </div>
    </div>
  );
};

export default VotingControls;