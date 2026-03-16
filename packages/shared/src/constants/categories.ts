export const GOAL_CATEGORIES = ['skills', 'wealth', 'health', 'impact'] as const;

export type GoalCategory = (typeof GOAL_CATEGORIES)[number];

export const CATEGORY_COLORS: Record<
  GoalCategory,
  { text: string; bg: string }
> = {
  skills: { text: '#5B9CF6', bg: 'rgba(91, 156, 246, 0.15)' },
  wealth: { text: '#F5A623', bg: 'rgba(245, 166, 35, 0.15)' },
  health: { text: '#34D399', bg: 'rgba(52, 211, 153, 0.15)' },
  impact: { text: '#F472B6', bg: 'rgba(244, 114, 182, 0.15)' },
};

export const CATEGORY_ICONS: Record<GoalCategory, string> = {
  skills: 'book-open',
  wealth: 'dollar-sign',
  health: 'heart',
  impact: 'globe',
};
