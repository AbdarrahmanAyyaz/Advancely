/**
 * TanStack Query hooks for Profile & Points
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useAuthStore } from '@/stores/auth-store';

// ── Types ──────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  timezone: string;
  tier: string;
  isOnboarded: boolean;
  totalPoints: number;
  createdAt: string;
}

export interface PointEvent {
  id: string;
  userId: string;
  eventType: string;
  pointsAwarded: number;
  sourceId: string | null;
  sourceType: string | null;
  createdAt: string;
}

export interface StreakSnapshot {
  habitId: string;
  currentStreak: number;
  bestStreak: number;
  snapshotDate: string;
  habitName: string;
  habitCategory: string;
}

// ── Query Keys ─────────────────────────────────────────────────────────

export const profileKeys = {
  me: ['profile', 'me'] as const,
  pointsHistory: ['points', 'history'] as const,
  streaks: ['points', 'streaks'] as const,
};

// ── Queries ────────────────────────────────────────────────────────────

export function useProfile() {
  const session = useAuthStore((s) => s.session);
  return useQuery({
    queryKey: profileKeys.me,
    queryFn: async () => {
      const res = await api<UserProfile>('/auth/me');
      return res.data;
    },
    enabled: !!session,
  });
}

export function usePointsHistory(limit = 20) {
  const session = useAuthStore((s) => s.session);
  return useQuery({
    queryKey: profileKeys.pointsHistory,
    queryFn: async () => {
      const res = await api<PointEvent[]>('/points/history', {
        params: { limit: String(limit) },
      });
      return res.data;
    },
    enabled: !!session,
  });
}

export function useStreaks() {
  const session = useAuthStore((s) => s.session);
  return useQuery({
    queryKey: profileKeys.streaks,
    queryFn: async () => {
      const res = await api<StreakSnapshot[]>('/points/streaks');
      return res.data;
    },
    enabled: !!session,
  });
}

// ── Mutations ──────────────────────────────────────────────────────────

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      displayName?: string;
      timezone?: string;
    }) => {
      const res = await api<UserProfile>('/auth/me', {
        method: 'PATCH',
        body: data,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.me });
    },
  });
}
