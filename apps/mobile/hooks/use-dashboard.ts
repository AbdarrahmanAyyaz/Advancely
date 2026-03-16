/**
 * TanStack Query hooks for the Dashboard
 *
 * Provides data fetching and mutations for:
 * - Today's tasks (with optimistic completion)
 * - Active habits (with optimistic log)
 * - Morning brief
 * - Points summary
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useAuthStore } from '@/stores/auth-store';
import * as Haptics from 'expo-haptics';

// ── Types ──────────────────────────────────────────────────────────────

export interface Task {
  id: string;
  userId: string;
  goalId: string | null;
  title: string;
  isCompleted: boolean;
  taskDate: string;
  source: 'ai' | 'manual';
  sortOrder: number;
  completedAt: string | null;
  createdAt: string;
}

export interface Habit {
  id: string;
  userId: string;
  goalId: string | null;
  name: string;
  category: 'skills' | 'wealth' | 'health' | 'impact';
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  deletedAt: string | null;
}

export interface HabitLog {
  id: string;
  habitId: string;
  logDate: string;
  createdAt: string;
}

export interface PointsSummary {
  totalPoints: number;
  currentLevel: number;
  levelName: string;
  pointsToNextLevel: number;
  recentEvents: Array<{
    id: string;
    eventType: string;
    pointsAwarded: number;
    createdAt: string;
  }>;
}

// ── Helpers ────────────────────────────────────────────────────────────

function getToday(): string {
  return new Date().toISOString().split('T')[0] as string;
}

// ── Query Keys ─────────────────────────────────────────────────────────

export const dashboardKeys = {
  tasks: (date: string) => ['tasks', date] as const,
  habits: ['habits'] as const,
  habitsWeekly: (date: string) => ['habits', 'weekly', date] as const,
  morningBrief: ['morningBrief'] as const,
  pointsSummary: ['pointsSummary'] as const,
};

// ── Queries ────────────────────────────────────────────────────────────

export function useTasks(date?: string) {
  const session = useAuthStore((s) => s.session);
  const taskDate = date ?? getToday();
  return useQuery({
    queryKey: dashboardKeys.tasks(taskDate),
    queryFn: async () => {
      const res = await api<Task[]>('/tasks', {
        params: { date: taskDate },
      });
      return res.data;
    },
    enabled: !!session,
  });
}

export function useHabits() {
  const session = useAuthStore((s) => s.session);
  return useQuery({
    queryKey: dashboardKeys.habits,
    queryFn: async () => {
      const res = await api<Habit[]>('/habits');
      return res.data;
    },
    enabled: !!session,
  });
}

export function useHabitsWeekly(date?: string) {
  const session = useAuthStore((s) => s.session);
  const weekDate = date ?? getToday();
  return useQuery({
    queryKey: dashboardKeys.habitsWeekly(weekDate),
    queryFn: async () => {
      const res = await api<{
        habits: Habit[];
        logs: HabitLog[];
        weekStart: string;
        weekEnd: string;
      }>('/habits/weekly', {
        params: { date: weekDate },
      });
      return res.data;
    },
    enabled: !!session,
  });
}

export function useMorningBrief() {
  const session = useAuthStore((s) => s.session);
  return useQuery({
    queryKey: dashboardKeys.morningBrief,
    queryFn: async () => {
      const res = await api<{ brief: string }>('/ai/morning-brief');
      return res.data.brief;
    },
    staleTime: 1000 * 60 * 60, // 1 hour — brief doesn't change often
    retry: 1,
    enabled: !!session,
  });
}

export function usePointsSummary() {
  const session = useAuthStore((s) => s.session);
  return useQuery({
    queryKey: dashboardKeys.pointsSummary,
    queryFn: async () => {
      const res = await api<PointsSummary>('/points/summary');
      return res.data;
    },
    enabled: !!session,
  });
}

// ── Mutations ──────────────────────────────────────────────────────────

export function useCompleteTask() {
  const queryClient = useQueryClient();
  const today = getToday();

  return useMutation({
    mutationFn: async (taskId: string) => {
      const res = await api<{
        data: Task;
        pointsAwarded: number;
        dailyBonus: boolean;
      }>(`/tasks/${taskId}/complete`, { method: 'PATCH' });
      return res.data;
    },

    // Optimistic update
    onMutate: async (taskId: string) => {
      await queryClient.cancelQueries({
        queryKey: dashboardKeys.tasks(today),
      });

      const previousTasks = queryClient.getQueryData<Task[]>(
        dashboardKeys.tasks(today),
      );

      queryClient.setQueryData<Task[]>(
        dashboardKeys.tasks(today),
        (old) =>
          old?.map((t) =>
            t.id === taskId
              ? { ...t, isCompleted: true, completedAt: new Date().toISOString() }
              : t,
          ),
      );

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      return { previousTasks };
    },

    onError: (_err, _taskId, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(
          dashboardKeys.tasks(today),
          context.previousTasks,
        );
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: dashboardKeys.tasks(today) });
      queryClient.invalidateQueries({
        queryKey: dashboardKeys.pointsSummary,
      });
    },
  });
}

export function useLogHabit() {
  const queryClient = useQueryClient();
  const today = getToday();

  return useMutation({
    mutationFn: async (habitId: string) => {
      const res = await api<{
        data: HabitLog;
        pointsAwarded: number;
        streak: number;
      }>(`/habits/${habitId}/log`, { method: 'POST' });
      return res.data;
    },

    onMutate: async () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: dashboardKeys.habitsWeekly(today),
      });
      queryClient.invalidateQueries({
        queryKey: dashboardKeys.pointsSummary,
      });
    },
  });
}
