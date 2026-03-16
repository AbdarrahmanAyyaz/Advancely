import type { GoalCategory } from '../constants/categories';

export interface Milestone {
  year: number;
  target: string;
  completed: boolean;
}

export type GoalStatus = 'active' | 'completed' | 'paused';

export interface Goal {
  id: string;
  userId: string;
  visionId: string;
  title: string;
  category: GoalCategory;
  description: string | null;
  targetDate: string | null;
  progress: number;
  status: GoalStatus;
  milestones: Milestone[];
  createdAt: string;
  deletedAt: string | null;
}
