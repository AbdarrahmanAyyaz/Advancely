export type TaskSource = 'ai' | 'manual';

export interface DailyTask {
  id: string;
  userId: string;
  goalId: string | null;
  title: string;
  isCompleted: boolean;
  taskDate: string;
  source: TaskSource;
  sortOrder: number;
  completedAt: string | null;
  createdAt: string;
}
