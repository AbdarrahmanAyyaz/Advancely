/**
 * TanStack Query hooks for Journal entries
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useAuthStore } from '@/stores/auth-store';
import { dashboardKeys } from './use-dashboard';

// ── Types ──────────────────────────────────────────────────────────────

export interface JournalEntry {
  id: string;
  userId: string;
  entryDate: string;
  wins: string[];
  challenges: string | null;
  gratitude: string[];
  tomorrowFocus: string | null;
  mood: number | null;
  aiInsights: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Query Keys ─────────────────────────────────────────────────────────

export const journalKeys = {
  entry: (date: string) => ['journal', date] as const,
  recent: ['journal', 'recent'] as const,
};

// ── Queries ────────────────────────────────────────────────────────────

export function useJournalEntry(date: string) {
  const session = useAuthStore((s) => s.session);
  return useQuery({
    queryKey: journalKeys.entry(date),
    queryFn: async () => {
      const res = await api<JournalEntry | null>('/journal', {
        params: { date },
      });
      return res.data;
    },
    enabled: !!session,
  });
}

export function useRecentEntries(limit = 7) {
  const session = useAuthStore((s) => s.session);
  return useQuery({
    queryKey: journalKeys.recent,
    queryFn: async () => {
      const res = await api<JournalEntry[]>('/journal/recent', {
        params: { limit: String(limit) },
      });
      return res.data;
    },
    enabled: !!session,
  });
}

// ── Mutations ──────────────────────────────────────────────────────────

export function useCreateJournalEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      entryDate: string;
      wins: string[];
      challenges: string | null;
      gratitude: string[];
      tomorrowFocus: string | null;
      mood: number | null;
    }) => {
      const res = await api<JournalEntry>('/journal', {
        method: 'POST',
        body: data,
      });
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: journalKeys.entry(variables.entryDate),
      });
      queryClient.invalidateQueries({
        queryKey: journalKeys.recent,
      });
      queryClient.invalidateQueries({
        queryKey: dashboardKeys.pointsSummary,
      });
    },
  });
}

export function useUpdateJournalEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      entryDate,
      ...data
    }: {
      id: string;
      entryDate: string;
      wins?: string[];
      challenges?: string | null;
      gratitude?: string[];
      tomorrowFocus?: string | null;
      mood?: number | null;
    }) => {
      const res = await api<JournalEntry>(`/journal/${id}`, {
        method: 'PATCH',
        body: data,
      });
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: journalKeys.entry(variables.entryDate),
      });
      queryClient.invalidateQueries({
        queryKey: journalKeys.recent,
      });
    },
  });
}
