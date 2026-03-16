import type { FastifyInstance } from 'fastify';
import { eq, desc } from 'drizzle-orm';
import { pointEvents, streakSnapshots, habits } from '@advancely/db';
import type { Database } from '@advancely/db';
import { authMiddleware } from '../middleware/auth';
import { getPointsSummary } from '../services/gamification';

export async function pointRoutes(app: FastifyInstance): Promise<void> {
  const db = (app as unknown as { db: Database }).db;

  // GET /points/summary — Get total points, level, recent events
  app.get('/summary', { preHandler: [authMiddleware] }, async (request) => {
    const summary = await getPointsSummary(db, request.user.id);
    return { data: summary };
  });

  // GET /points/history?limit=N — Get point event history
  app.get('/history', { preHandler: [authMiddleware] }, async (request) => {
    const { limit } = request.query as { limit?: string };
    const eventLimit = Math.min(Number(limit) || 20, 100);

    const events = await db
      .select()
      .from(pointEvents)
      .where(eq(pointEvents.userId, request.user.id))
      .orderBy(desc(pointEvents.createdAt))
      .limit(eventLimit);

    return { data: events };
  });

  // GET /streaks — Get current streaks for all habits
  app.get(
    '/streaks',
    { preHandler: [authMiddleware] },
    async (request) => {
      const snapshots = await db
        .select({
          habitId: streakSnapshots.habitId,
          currentStreak: streakSnapshots.currentStreak,
          bestStreak: streakSnapshots.bestStreak,
          snapshotDate: streakSnapshots.snapshotDate,
          habitName: habits.name,
          habitCategory: habits.category,
        })
        .from(streakSnapshots)
        .innerJoin(habits, eq(streakSnapshots.habitId, habits.id))
        .where(eq(streakSnapshots.userId, request.user.id))
        .orderBy(desc(streakSnapshots.snapshotDate));

      // Deduplicate — latest snapshot per habit
      const latestByHabit = new Map<
        string,
        (typeof snapshots)[number]
      >();
      for (const snap of snapshots) {
        if (!latestByHabit.has(snap.habitId)) {
          latestByHabit.set(snap.habitId, snap);
        }
      }

      return { data: Array.from(latestByHabit.values()) };
    },
  );
}
