/**
 * Gamification Service
 *
 * Points awarding, level calculation, streak logic.
 * Points are always awarded atomically via the database function.
 */

import { sql, eq, and, gte, lte, desc, count } from 'drizzle-orm';
import type { Database } from '@advancely/db';
import {
  pointEvents,
  streakSnapshots,
  habitLogs,
  dailyTasks,
  users,
} from '@advancely/db';
import { POINT_VALUES, LEVEL_THRESHOLDS, LEVEL_NAMES } from '@advancely/shared';

/**
 * Award points atomically via the database function.
 * This inserts a point_event record and updates users.total_points + current_level.
 */
export async function awardPoints(
  db: Database,
  userId: string,
  eventType: string,
  points: number,
  sourceId?: string,
  sourceType?: string,
): Promise<void> {
  await db.execute(
    sql`SELECT award_points(${userId}, ${eventType}, ${points}, ${sourceId ?? null}, ${sourceType ?? null})`,
  );
}

/**
 * Check if all tasks for a given date are completed.
 * If so, award the daily bonus.
 */
export async function checkDailyBonus(
  db: Database,
  userId: string,
  taskDate: string,
): Promise<boolean> {
  const tasks = await db
    .select()
    .from(dailyTasks)
    .where(
      and(
        eq(dailyTasks.userId, userId),
        eq(dailyTasks.taskDate, taskDate),
      ),
    );

  if (tasks.length === 0) return false;

  const allComplete = tasks.every((t) => t.isCompleted);

  if (allComplete) {
    // Check we haven't already awarded daily bonus for this date
    const existing = await db
      .select()
      .from(pointEvents)
      .where(
        and(
          eq(pointEvents.userId, userId),
          eq(pointEvents.eventType, 'daily_bonus'),
          gte(pointEvents.createdAt, new Date(`${taskDate}T00:00:00Z`)),
          lte(pointEvents.createdAt, new Date(`${taskDate}T23:59:59Z`)),
        ),
      );

    if (existing.length === 0) {
      await awardPoints(db, userId, 'daily_bonus', POINT_VALUES.dailyBonus);
      return true;
    }
  }

  return false;
}

/**
 * Calculate the current streak for a habit by counting consecutive days
 * backward from today that have a completed log.
 */
export async function calculateHabitStreak(
  db: Database,
  habitId: string,
  userId: string,
): Promise<{ currentStreak: number; bestStreak: number }> {
  // Get all completed logs for this habit, ordered by date desc
  const logs = await db
    .select({ logDate: habitLogs.logDate })
    .from(habitLogs)
    .where(
      and(
        eq(habitLogs.habitId, habitId),
        eq(habitLogs.userId, userId),
        eq(habitLogs.isCompleted, true),
      ),
    )
    .orderBy(desc(habitLogs.logDate));

  if (logs.length === 0) {
    return { currentStreak: 0, bestStreak: 0 };
  }

  // Calculate current streak (consecutive days from today/yesterday)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const logDates = new Set(logs.map((l) => l.logDate));

  let currentStreak = 0;
  const checkDate = new Date(today);

  // Check if today or yesterday is logged (streak is still "active")
  const todayStr = formatDate(checkDate);
  const yesterdayDate = new Date(checkDate);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = formatDate(yesterdayDate);

  if (!logDates.has(todayStr) && !logDates.has(yesterdayStr)) {
    // Streak is broken — no log today or yesterday
    currentStreak = 0;
  } else {
    // Start counting from the most recent logged day
    const startDate = logDates.has(todayStr) ? new Date(today) : new Date(yesterdayDate);
    const d = new Date(startDate);

    while (logDates.has(formatDate(d))) {
      currentStreak++;
      d.setDate(d.getDate() - 1);
    }
  }

  // Calculate best streak from all logs
  let bestStreak = 0;
  let tempStreak = 0;
  const sortedDates = Array.from(logDates).sort();

  for (let i = 0; i < sortedDates.length; i++) {
    if (i === 0) {
      tempStreak = 1;
    } else {
      const prev = new Date(sortedDates[i - 1]!);
      const curr = new Date(sortedDates[i]!);
      const diffMs = curr.getTime() - prev.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      if (diffDays === 1) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
    }
    bestStreak = Math.max(bestStreak, tempStreak);
  }

  // Best streak should include the current streak if it's the largest
  bestStreak = Math.max(bestStreak, currentStreak);

  // Check for streak bonuses
  const streakBonuses = [
    { days: 30, points: POINT_VALUES.streakBonus30 },
    { days: 21, points: POINT_VALUES.streakBonus21 },
    { days: 7, points: POINT_VALUES.streakBonus7 },
  ];

  for (const bonus of streakBonuses) {
    if (currentStreak === bonus.days) {
      // Check if already awarded this streak bonus
      const existingBonus = await db
        .select()
        .from(pointEvents)
        .where(
          and(
            eq(pointEvents.userId, userId),
            eq(pointEvents.eventType, 'streak_bonus'),
            eq(pointEvents.points, bonus.points),
            eq(pointEvents.sourceId, habitId),
          ),
        );

      // Only award once per habit per milestone
      if (existingBonus.length === 0) {
        await awardPoints(
          db,
          userId,
          'streak_bonus',
          bonus.points,
          habitId,
          'habit_log',
        );
      }
      break; // Only award the highest applicable bonus
    }
  }

  return { currentStreak, bestStreak };
}

/**
 * Get the user's points summary.
 */
export async function getPointsSummary(
  db: Database,
  userId: string,
): Promise<{
  totalPoints: number;
  currentLevel: number;
  levelName: string;
  pointsToNextLevel: number;
  recentEvents: Array<{
    eventType: string;
    points: number;
    createdAt: Date | null;
  }>;
}> {
  const user = await db
    .select({
      totalPoints: users.totalPoints,
      currentLevel: users.currentLevel,
    })
    .from(users)
    .where(eq(users.id, userId));

  if (!user[0]) {
    throw new Error('User not found');
  }

  const { totalPoints, currentLevel } = user[0];

  // Calculate points to next level
  const nextLevelIndex = currentLevel; // currentLevel is 1-indexed, thresholds are 0-indexed
  const nextThreshold =
    nextLevelIndex < LEVEL_THRESHOLDS.length
      ? LEVEL_THRESHOLDS[nextLevelIndex]!
      : Infinity;
  const pointsToNextLevel =
    nextThreshold === Infinity ? 0 : nextThreshold - totalPoints;

  // Get recent events
  const recentEvents = await db
    .select({
      eventType: pointEvents.eventType,
      points: pointEvents.points,
      createdAt: pointEvents.createdAt,
    })
    .from(pointEvents)
    .where(eq(pointEvents.userId, userId))
    .orderBy(desc(pointEvents.createdAt))
    .limit(20);

  return {
    totalPoints,
    currentLevel,
    levelName: LEVEL_NAMES[currentLevel - 1] ?? 'Unknown',
    pointsToNextLevel: Math.max(0, pointsToNextLevel),
    recentEvents,
  };
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0]!;
}
