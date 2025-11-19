import { UserRole } from './types';

export const POINTING_SCALE = [1, 2, 3, 5, 8, 13];

export const ROLES = [
  { label: 'Developer', value: UserRole.DEVELOPER, description: 'Votes on stories' },
  { label: 'Scrum Master', value: UserRole.SCRUM_MASTER, description: 'Manages the flow and stories' },
  { label: 'Product Owner', value: UserRole.PRODUCT_OWNER, description: 'Clarifies requirements' },
  { label: 'Observer', value: UserRole.OBSERVER, description: 'Watch only' },
];

export const AVATARS = [
  '👨‍💻', '👩‍💻', '🤖', '🦄', '🦁', '🦊', '🐨', '🐙', '🦉', '🐸', '🤠', '👽', '🧙‍♂️', '🦸‍♀️', '🕵️‍♂️', '👷'
];

export const STORAGE_KEY = 'gemini-scrum-poker-state';
export const USER_STORAGE_KEY = 'gemini-scrum-poker-user';
export const CHANNEL_NAME = 'gemini-scrum-poker-channel';