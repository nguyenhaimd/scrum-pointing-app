export enum UserRole {
  DEVELOPER = 'Developer',
  SCRUM_MASTER = 'Scrum Master',
  PRODUCT_OWNER = 'Product Owner',
  OBSERVER = 'Observer',
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  isOnline: boolean;
  lastHeartbeat: number;
  room: string;
  avatar: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
}

export interface Vote {
  userId: string;
  value: string | number | null; // null means voted but hidden, string for '?' or 'coffee'
}

export interface Story {
  id: string;
  title: string;
  description: string;
  acceptanceCriteria: string[];
  status: 'pending' | 'active' | 'completed';
  finalPoints?: number | string;
  votes: Record<string, string | number>; // map userId to vote value
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
  isAi?: boolean;
}

export interface AppState {
  users: Record<string, User>;
  stories: Story[];
  currentStoryId: string | null;
  areVotesRevealed: boolean;
  chatMessages: ChatMessage[];
}

export type Action =
  | { type: 'JOIN_SESSION'; payload: User }
  | { type: 'HEARTBEAT'; payload: string } // userId
  | { type: 'ADD_STORY'; payload: Story }
  | { type: 'DELETE_STORY'; payload: string }
  | { type: 'SET_CURRENT_STORY'; payload: string }
  | { type: 'VOTE'; payload: { userId: string; value: string | number } }
  | { type: 'REVEAL_VOTES' }
  | { type: 'RESET_VOTES' }
  | { type: 'FINISH_STORY'; payload: { storyId: string; points: string | number } }
  | { type: 'SEND_MESSAGE'; payload: ChatMessage }
  | { type: 'SYNC_STATE'; payload: AppState }
  | { type: 'REQUEST_STATE' }
  | { type: 'UPDATE_STORY'; payload: Story } // For AI updates
  | { type: 'CLEAR_QUEUE' }
  | { type: 'REMOVE_USER'; payload: string }; // userId