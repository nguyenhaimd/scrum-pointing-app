
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
    <div className="absolute bottom-0 left-0 right-0 p-4 bg-slate-900/90 border-t border-slate-700 backdrop-blur-lg z-40 overflow-x-auto">
      <div className="flex justify-center gap-2 md:gap-4 min-w-max px-4 mx-auto">
        {POINTING_SCALE.map((value) => (
          <Card
            key={value}
            value={value}
            isSelected={selectedVote === value}
            onClick={() => onVote(value)}
            size="md"
            theme={currentUser.cardTheme} // Pass the user's chosen theme
          />
        ))}
      </div>
    </div>
  );
};

export default VotingControls;
