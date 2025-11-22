
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

export interface CardThemeDef {
  id: string;
  label: string;
  bg: string;
  border: string;
  text: string;
  backGradient: string;
  patternOpacity: string;
}

export const CARD_THEMES: CardThemeDef[] = [
  { 
    id: 'classic', 
    label: 'Classic Slate', 
    bg: 'bg-slate-800', 
    border: 'border-slate-600', 
    text: 'text-slate-200',
    backGradient: 'from-slate-800 to-slate-900',
    patternOpacity: 'opacity-20'
  },
  { 
    id: 'cyber', 
    label: 'Cyberpunk', 
    bg: 'bg-slate-900', 
    border: 'border-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.5)]', 
    text: 'text-pink-400',
    backGradient: 'from-indigo-900 to-purple-900',
    patternOpacity: 'opacity-40'
  },
  { 
    id: 'forest', 
    label: 'Elven Forest', 
    bg: 'bg-emerald-900', 
    border: 'border-emerald-400', 
    text: 'text-emerald-100',
    backGradient: 'from-emerald-900 to-green-950',
    patternOpacity: 'opacity-30'
  },
  { 
    id: 'crimson', 
    label: 'Royal Crimson', 
    bg: 'bg-red-950', 
    border: 'border-red-600', 
    text: 'text-red-200',
    backGradient: 'from-red-900 to-rose-950',
    patternOpacity: 'opacity-25'
  },
  { 
    id: 'gold', 
    label: 'Midas Gold', 
    bg: 'bg-amber-950', 
    border: 'border-amber-500', 
    text: 'text-amber-200',
    backGradient: 'from-amber-800 to-yellow-900',
    patternOpacity: 'opacity-30'
  },
  { 
    id: 'ocean', 
    label: 'Deep Ocean', 
    bg: 'bg-cyan-950', 
    border: 'border-cyan-400', 
    text: 'text-cyan-200',
    backGradient: 'from-cyan-900 to-blue-950',
    patternOpacity: 'opacity-30'
  },
];

export const WOW_EMOJI = '👱';
export const REACTION_EMOJIS = ['👍', '👎', '🔥', '🚀', '😂', '🤔', '☕', '🎉', WOW_EMOJI];

export const STORAGE_KEY = 'gemini-scrum-poker-state';
export const USER_STORAGE_KEY = 'gemini-scrum-poker-user';
export const SOUND_PREF_KEY = 'gemini-scrum-poker-muted';
export const CHANNEL_NAME = 'gemini-scrum-poker-channel';
export const STALE_USER_TIMEOUT = 10 * 60 * 1000; // 10 minutes