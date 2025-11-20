
import { UserRole } from './types';

export const POINTING_SCALE = [0, 1, 2, 3, 5, 8, 13, '?', '☕'];

export const ROLES = [
  { label: 'Developer', value: UserRole.DEVELOPER, description: 'Votes on stories' },
  { label: 'Scrum Master', value: UserRole.SCRUM_MASTER, description: 'Manages the flow and stories' },
  { label: 'Product Owner', value: UserRole.PRODUCT_OWNER, description: 'Clarifies requirements (No voting)' },
  { label: 'Observer', value: UserRole.OBSERVER, description: 'Watch only' },
];

export const AVATARS = [
  '👨‍💻', '👩‍💻', '👨‍🍳', '🐶', '🤖', '🦄', '🦁', '🦊', '🐨', '🐙', 
  '🦉', '🐸', '🤠', '👽', '🧙‍♂️', '🦸‍♀️', '🕵️‍♂️', '👷',
  '🤴', '👸', '🧟', '🧞', '🦖', '🐋', '🐬', '🐡',
  '🦋', '🐝', '🐞', '🐢', '🐍', '🦎', '🐕', '🐈',
  '🐅', '🐆', '🦓', '🦍', '🐘', '🦛', '🦏', '🐫',
  '🦒', '🦘', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏',
  '🐑', '🦙', '🐐', '🦌', '🐕‍🦺', '🦮', '🐩', '🐓',
  '🦃', '🦚', '🦜', '🦢', '🦩', '🕊️', '🐇', '🦝'
];

export const REACTION_EMOJIS = ['👍', '👎', '🔥', '🚀', '😂', '🤔', '☕', '🎉'];

export const STORAGE_KEY = 'gemini-scrum-poker-state';
export const USER_STORAGE_KEY = 'gemini-scrum-poker-user';
export const SOUND_PREF_KEY = 'gemini-scrum-poker-muted';
export const CHANNEL_NAME = 'gemini-scrum-poker-channel';
export const STALE_USER_TIMEOUT = 10 * 60 * 1000; // 10 minutes
