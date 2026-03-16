export type ConversationType =
  | 'onboarding'
  | 'morning_brief'
  | 'reflection'
  | 'vision_refine'
  | 'chat';

export interface AiMessage {
  role: 'user' | 'assistant';
  content: string;
  ts: string;
}

export interface AiConversation {
  id: string;
  userId: string;
  conversationType: ConversationType;
  messages: AiMessage[];
  modelUsed: string;
  inputTokens: number;
  outputTokens: number;
  createdAt: string;
}

export type PointEventType =
  | 'task_complete'
  | 'habit_complete'
  | 'journal_entry'
  | 'daily_bonus'
  | 'streak_bonus';

export type PointSourceType = 'daily_task' | 'habit_log' | 'journal_entry';

export interface PointEvent {
  id: string;
  userId: string;
  eventType: PointEventType;
  points: number;
  sourceId: string | null;
  sourceType: PointSourceType | null;
  createdAt: string;
}
