/**
 * Context Builder
 *
 * Assembles user context payloads for AI prompts.
 * Queries the database for the user's current state.
 */

import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';
import type { Database } from '@advancely/db';
import {
  users,
  visions,
  goals,
  dailyTasks,
  habits,
  habitLogs,
  journalEntries,
  streakSnapshots,
} from '@advancely/db';

export interface UserContext {
  displayName: string;
  visionStatement: string;
  activeGoals: Array<{
    title: string;
    category: string;
    progress: number;
  }>;
  yesterdayTasksCompleted: number;
  yesterdayTasksTotal: number;
  todayTasksCompleted: number;
  todayTasksTotal: number;
  todayHabitsCompleted: string[];
  currentStreak: number;
  currentLevel: number;
  totalPoints: number;
  recentMood: number | null;
  strugglingAreas: string[];
}

/**
 * Build full user context for AI prompts.
 * Uses the user's timezone to determine "today" and "yesterday".
 */
export async function buildUserContext(
  db: Database,
  userId: string,
): Promise<UserContext> {
  // 1. Get user profile
  const userRows = await db
    .select({
      displayName: users.displayName,
      totalPoints: users.totalPoints,
      currentLevel: users.currentLevel,
      timezone: users.timezone,
    })
    .from(users)
    .where(eq(users.id, userId));

  const user = userRows[0];
  if (!user) {
    throw new Error('User not found');
  }

  // Calculate today/yesterday in user's timezone
  const now = new Date();
  const today = formatDateInTimezone(now, user.timezone);
  const yesterdayDate = new Date(now);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = formatDateInTimezone(yesterdayDate, user.timezone);

  // 2. Get active vision
  const visionRows = await db
    .select({ statement: visions.statement })
    .from(visions)
    .where(
      and(
        eq(visions.userId, userId),
        eq(visions.isActive, true),
      ),
    )
    .limit(1);

  // 3. Get active goals
  const goalRows = await db
    .select({
      title: goals.title,
      category: goals.category,
      progress: goals.progress,
    })
    .from(goals)
    .where(
      and(
        eq(goals.userId, userId),
        eq(goals.status, 'active'),
        sql`${goals.deletedAt} IS NULL`,
      ),
    );

  // 4. Get yesterday's tasks
  const yesterdayTasks = await db
    .select({
      isCompleted: dailyTasks.isCompleted,
    })
    .from(dailyTasks)
    .where(
      and(
        eq(dailyTasks.userId, userId),
        eq(dailyTasks.taskDate, yesterday),
      ),
    );

  // 5. Get today's tasks
  const todayTasks = await db
    .select({
      isCompleted: dailyTasks.isCompleted,
    })
    .from(dailyTasks)
    .where(
      and(
        eq(dailyTasks.userId, userId),
        eq(dailyTasks.taskDate, today),
      ),
    );

  // 6. Get today's completed habits
  const todayHabitLogs = await db
    .select({ habitName: habits.name })
    .from(habitLogs)
    .innerJoin(habits, eq(habitLogs.habitId, habits.id))
    .where(
      and(
        eq(habitLogs.userId, userId),
        eq(habitLogs.logDate, today),
        eq(habitLogs.isCompleted, true),
      ),
    );

  // 7. Get best current streak across all habits
  const streakRows = await db
    .select({ currentStreak: streakSnapshots.currentStreak })
    .from(streakSnapshots)
    .where(eq(streakSnapshots.userId, userId))
    .orderBy(desc(streakSnapshots.currentStreak))
    .limit(1);

  // 8. Get recent mood (last 3 journal entries)
  const recentJournals = await db
    .select({ mood: journalEntries.mood })
    .from(journalEntries)
    .where(eq(journalEntries.userId, userId))
    .orderBy(desc(journalEntries.entryDate))
    .limit(3);

  const moods = recentJournals
    .map((j) => j.mood)
    .filter((m): m is number => m !== null);
  const avgMood =
    moods.length > 0
      ? Math.round((moods.reduce((a, b) => a + b, 0) / moods.length) * 10) / 10
      : null;

  // 9. Identify struggling areas — goals with low progress
  const strugglingAreas = goalRows
    .filter((g) => g.progress < 20)
    .map((g) => `${g.title} (${g.category})`);

  return {
    displayName: user.displayName ?? 'there',
    visionStatement: visionRows[0]?.statement ?? '',
    activeGoals: goalRows.map((g) => ({
      title: g.title,
      category: g.category,
      progress: g.progress,
    })),
    yesterdayTasksCompleted: yesterdayTasks.filter((t) => t.isCompleted).length,
    yesterdayTasksTotal: yesterdayTasks.length,
    todayTasksCompleted: todayTasks.filter((t) => t.isCompleted).length,
    todayTasksTotal: todayTasks.length,
    todayHabitsCompleted: todayHabitLogs.map((h) => h.habitName),
    currentStreak: streakRows[0]?.currentStreak ?? 0,
    currentLevel: user.currentLevel,
    totalPoints: user.totalPoints,
    recentMood: avgMood,
    strugglingAreas,
  };
}

function formatDateInTimezone(date: Date, timezone: string): string {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
    return parts; // Returns YYYY-MM-DD format
  } catch {
    // Fallback to UTC
    return date.toISOString().split('T')[0]!;
  }
}
