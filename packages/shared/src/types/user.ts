import type { Tier } from '../constants/tier-limits';

export interface User {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  tier: Tier;
  totalPoints: number;
  currentLevel: number;
  onboardingCompletedAt: string | null;
  aiContextSummary: Record<string, unknown> | null;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}
