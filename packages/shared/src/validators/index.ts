import { z } from 'zod';

// Goal categories
export const goalCategorySchema = z.enum([
  'skills',
  'wealth',
  'health',
  'impact',
]);

// Auth
export const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  avatarUrl: z.string().url().optional(),
  timezone: z.string().min(1).max(50).optional(),
});

// Visions
export const createVisionSchema = z.object({
  statement: z.string().min(10).max(2000),
});

export const updateVisionSchema = z.object({
  statement: z.string().min(10).max(2000),
});

// Goals
export const milestoneSchema = z.object({
  year: z.number().int().min(1).max(10),
  target: z.string().min(1).max(500),
  completed: z.boolean(),
});

export const createGoalSchema = z.object({
  visionId: z.string().uuid(),
  title: z.string().min(1).max(200),
  category: goalCategorySchema,
  description: z.string().max(1000).nullable().optional(),
  targetDate: z.string().optional(),
  milestones: z.array(milestoneSchema).default([]),
});

export const updateGoalSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).nullable().optional(),
  targetDate: z.string().nullable().optional(),
  status: z.enum(['active', 'completed', 'paused']).optional(),
  milestones: z.array(milestoneSchema).optional(),
});

export const updateProgressSchema = z.object({
  progress: z.number().int().min(0).max(100),
});

// Tasks
export const createTaskSchema = z.object({
  title: z.string().min(1).max(300),
  taskDate: z.string(),
  goalId: z.string().uuid().nullable().optional(),
  source: z.enum(['ai', 'manual']).default('manual'),
  sortOrder: z.number().int().min(0).default(0),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  sortOrder: z.number().int().min(0).optional(),
});

// Habits
export const createHabitSchema = z.object({
  name: z.string().min(1).max(150),
  category: goalCategorySchema,
  goalId: z.string().uuid().nullable().optional(),
  sortOrder: z.number().int().min(0).default(0),
});

export const updateHabitSchema = z.object({
  name: z.string().min(1).max(150).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

// Journal
export const createJournalSchema = z.object({
  entryDate: z.string(),
  wins: z.array(z.string().max(500)).default([]),
  challenges: z.string().max(2000).nullable().optional(),
  gratitude: z.array(z.string().max(500)).max(3).default([]),
  tomorrowFocus: z.string().max(500).nullable().optional(),
  mood: z.number().int().min(1).max(5).nullable().optional(),
});

export const updateJournalSchema = z.object({
  wins: z.array(z.string().max(500)).optional(),
  challenges: z.string().max(2000).nullable().optional(),
  gratitude: z.array(z.string().max(500)).max(3).optional(),
  tomorrowFocus: z.string().max(500).nullable().optional(),
  mood: z.number().int().min(1).max(5).nullable().optional(),
});

// AI
export const aiChatMessageSchema = z.object({
  message: z.string().min(1).max(5000),
  conversationId: z.string().uuid().optional(),
});
