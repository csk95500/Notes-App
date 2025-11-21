export interface Note {
  id: string;
  folderId: string | null;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  isPinned: boolean;
  tags: string[];
}

export interface Folder {
  id: string;
  name: string;
  icon?: string;
}

export enum RepeatFrequency {
  NONE = 'None',
  DAILY = 'Daily',
  WEEKLY = 'Weekly',
  MONTHLY = 'Monthly'
}

export interface Reminder {
  id: string;
  noteId: string;
  triggerTime: number; // Timestamp
  frequency: RepeatFrequency;
  isActive: boolean;
  message: string;
}

export interface AIResponse {
  text: string;
  error?: string;
}

export enum AIAction {
  SUMMARIZE = 'Summarize',
  CONTINUE = 'Continue Writing',
  FIX_GRAMMAR = 'Fix Grammar',
  ACTION_ITEMS = 'Extract Action Items',
  GENERATE_IDEAS = 'Generate Ideas'
}