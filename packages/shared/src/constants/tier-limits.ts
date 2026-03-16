export const TIER_LIMITS = {
  free: {
    maxGoals: 3,
    maxDailyTasks: 5,
    maxHabits: 3,
    maxJournalPerWeek: 3,
    maxAiConversationsPerDay: 3,
    features: {
      weeklySummary: false,
      patternDetection: false,
      dataExport: false,
      visionRefine: false,
    },
  },
  pro: {
    maxGoals: Infinity,
    maxDailyTasks: 15,
    maxHabits: 20,
    maxJournalPerWeek: 7,
    maxAiConversationsPerDay: Infinity,
    features: {
      weeklySummary: true,
      patternDetection: true,
      dataExport: true,
      visionRefine: true,
    },
  },
} as const;

export const POINT_VALUES = {
  taskComplete: 10,
  habitComplete: 15,
  journalEntry: 25,
  dailyBonus: 50,
  streakBonus7: 100,
  streakBonus21: 250,
  streakBonus30: 500,
} as const;

export const LEVEL_THRESHOLDS = [
  0,     // Level 1: Starter
  250,   // Level 2: Explorer
  750,   // Level 3: Achiever
  1500,  // Level 4: Builder
  2500,  // Level 5: Performer
  5000,  // Level 6: Strategist
  7000,  // Level 7: Leader
  10000, // Level 8: Visionary
  15000, // Level 9: Master
  25000, // Level 10: Legend
] as const;

export const LEVEL_NAMES = [
  'Starter',
  'Explorer',
  'Achiever',
  'Builder',
  'Performer',
  'Strategist',
  'Leader',
  'Visionary',
  'Master',
  'Legend',
] as const;

export type Tier = keyof typeof TIER_LIMITS;
export type TierConfig = (typeof TIER_LIMITS)[Tier];
