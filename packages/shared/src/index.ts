// Types
export type {
  User,
  Vision,
  Goal,
  Milestone,
  GoalStatus,
  DailyTask,
  TaskSource,
  Habit,
  HabitLog,
  StreakSnapshot,
  JournalEntry,
  AiConversation,
  AiMessage,
  ConversationType,
  PointEvent,
  PointEventType,
  PointSourceType,
  Subscription,
  SubscriptionPlan,
  SubscriptionStatus,
} from './types';

// Constants
export {
  TIER_LIMITS,
  POINT_VALUES,
  LEVEL_THRESHOLDS,
  LEVEL_NAMES,
  GOAL_CATEGORIES,
  CATEGORY_COLORS,
  CATEGORY_ICONS,
} from './constants';
export type { Tier, TierConfig, GoalCategory } from './constants';

// Validators
export {
  goalCategorySchema,
  updateProfileSchema,
  createVisionSchema,
  updateVisionSchema,
  milestoneSchema,
  createGoalSchema,
  updateGoalSchema,
  updateProgressSchema,
  createTaskSchema,
  updateTaskSchema,
  createHabitSchema,
  updateHabitSchema,
  createJournalSchema,
  updateJournalSchema,
  aiChatMessageSchema,
} from './validators';
