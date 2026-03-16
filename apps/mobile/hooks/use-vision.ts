/**
 * TanStack Query hooks for Vision & Goals
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';

// ── Types ──────────────────────────────────────────────────────────────

export interface Vision {
  id: string;
  userId: string;
  statement: string;
  version: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Milestone {
  year: number;
  target: string;
  completed: boolean;
}

export interface Goal {
  id: string;
  userId: string;
  visionId: string;
  title: string;
  category: 'skills' | 'wealth' | 'health' | 'impact';
  description: string | null;
  targetDate: string | null;
  progress: number;
  status: string;
  milestones: Milestone[];
  createdAt: string;
  deletedAt: string | null;
}

// ── Query Keys ─────────────────────────────────────────────────────────

export const visionKeys = {
  active: ['vision', 'active'] as const,
  history: ['vision', 'history'] as const,
  goals: ['goals'] as const,
};

// ── Queries ────────────────────────────────────────────────────────────

export function useActiveVision() {
  return useQuery({
    queryKey: visionKeys.active,
    queryFn: async () => {
      const res = await api<Vision | null>('/visions/active');
      return res.data;
    },
  });
}

export function useVisionHistory() {
  return useQuery({
    queryKey: visionKeys.history,
    queryFn: async () => {
      const res = await api<Vision[]>('/visions/history');
      return res.data;
    },
  });
}

export function useGoals() {
  return useQuery({
    queryKey: visionKeys.goals,
    queryFn: async () => {
      const res = await api<Goal[]>('/goals');
      return res.data;
    },
  });
}

// ── Mutations ──────────────────────────────────────────────────────────

export function useUpdateVision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      statement,
    }: {
      id: string;
      statement: string;
    }) => {
      const res = await api<Vision>(`/visions/${id}`, {
        method: 'PATCH',
        body: { statement },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: visionKeys.active });
      queryClient.invalidateQueries({ queryKey: visionKeys.history });
    },
  });
}

export function useCreateVision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (statement: string) => {
      const res = await api<Vision>('/visions', {
        method: 'POST',
        body: { statement },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: visionKeys.active });
      queryClient.invalidateQueries({ queryKey: visionKeys.history });
    },
  });
}

export function useUpdateGoalProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      goalId,
      progress,
    }: {
      goalId: string;
      progress: number;
    }) => {
      const res = await api<Goal>(`/goals/${goalId}/progress`, {
        method: 'PATCH',
        body: { progress },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: visionKeys.goals });
    },
  });
}
