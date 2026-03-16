import type { GoalCategory } from '../constants/categories';

export interface Habit {
  id: string;
  userId: string;
  goalId: string | null;
  name: string;
  category: GoalCategory;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  deletedAt: string | null;
}

export interface HabitLog {
  id: string;
  habitId: string;
  userId: string;
  logDate: string;
  isCompleted: boolean;
  createdAt: string;
}

export interface StreakSnapshot {
  id: string;
  userId: string;
  habitId: string;
  currentStreak: number;
  bestStreak: number;
  snapshotDate: string;
}
