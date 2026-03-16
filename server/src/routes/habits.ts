import type { FastifyInstance } from 'fastify';
import { eq, and, sql, gte, lte, count } from 'drizzle-orm';
import { habits, habitLogs } from '@advancely/db';
import type { Database } from '@advancely/db';
import { createHabitSchema, updateHabitSchema, POINT_VALUES } from '@advancely/shared';
import { authMiddleware } from '../middleware/auth';
import { createTierGuard } from '../middleware/tier-guard';
import { awardPoints, calculateHabitStreak } from '../services/gamification';

async function countUserHabits(db: Database, userId: string): Promise<number> {
  const result = await db
    .select({ count: count() })
    .from(habits)
    .where(
      and(
        eq(habits.userId, userId),
        eq(habits.isActive, true),
        sql`${habits.deletedAt} IS NULL`,
      ),
    );
  return result[0]?.count ?? 0;
}

export async function habitRoutes(app: FastifyInstance): Promise<void> {
  const db = (app as unknown as { db: Database }).db;

  // GET /habits — Get all active habits
  app.get('/', { preHandler: [authMiddleware] }, async (request) => {
    const result = await db
      .select()
      .from(habits)
      .where(
        and(
          eq(habits.userId, request.user.id),
          eq(habits.isActive, true),
          sql`${habits.deletedAt} IS NULL`,
        ),
      );

    return { data: result };
  });

  // POST /habits — Create habit (enforce tier limit)
  app.post(
    '/',
    {
      preHandler: [
        authMiddleware,
        createTierGuard({ resource: 'habits', countFn: countUserHabits }),
      ],
    },
    async (request, reply) => {
      const parsed = createHabitSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'Validation error',
          details: parsed.error.flatten(),
        });
      }

      const created = await db
        .insert(habits)
        .values({
          userId: request.user.id,
          goalId: parsed.data.goalId ?? null,
          name: parsed.data.name,
          category: parsed.data.category,
          sortOrder: parsed.data.sortOrder,
        })
        .returning();

      return reply.status(201).send({ data: created[0] });
    },
  );

  // PATCH /habits/:id — Update habit
  app.patch(
    '/:id',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const parsed = updateHabitSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'Validation error',
          details: parsed.error.flatten(),
        });
      }

      const updated = await db
        .update(habits)
        .set(parsed.data)
        .where(
          and(
            eq(habits.id, id),
            eq(habits.userId, request.user.id),
            sql`${habits.deletedAt} IS NULL`,
          ),
        )
        .returning();

      if (!updated[0]) {
        return reply.status(404).send({ error: 'Habit not found' });
      }

      return { data: updated[0] };
    },
  );

  // DELETE /habits/:id — Soft delete
  app.delete(
    '/:id',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      const updated = await db
        .update(habits)
        .set({ deletedAt: new Date() })
        .where(
          and(
            eq(habits.id, id),
            eq(habits.userId, request.user.id),
            sql`${habits.deletedAt} IS NULL`,
          ),
        )
        .returning();

      if (!updated[0]) {
        return reply.status(404).send({ error: 'Habit not found' });
      }

      return { data: { deleted: true } };
    },
  );

  // POST /habits/:id/log — Log habit completion for today (upsert)
  app.post(
    '/:id/log',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const today = new Date().toISOString().split('T')[0]!;

      // Verify the habit belongs to the user
      const habit = await db
        .select()
        .from(habits)
        .where(
          and(
            eq(habits.id, id),
            eq(habits.userId, request.user.id),
            sql`${habits.deletedAt} IS NULL`,
          ),
        );

      if (!habit[0]) {
        return reply.status(404).send({ error: 'Habit not found' });
      }

      // Upsert — ON CONFLICT DO NOTHING for idempotency
      const inserted = await db
        .insert(habitLogs)
        .values({
          habitId: id,
          userId: request.user.id,
          logDate: today,
          isCompleted: true,
        })
        .onConflictDoNothing({ target: [habitLogs.habitId, habitLogs.logDate] })
        .returning();

      // Only award points if we actually inserted (not a duplicate)
      let pointsAwarded = 0;
      if (inserted.length > 0) {
        await awardPoints(
          db,
          request.user.id,
          'habit_complete',
          POINT_VALUES.habitComplete,
          id,
          'habit_log',
        );
        pointsAwarded = POINT_VALUES.habitComplete;
      }

      // Calculate streak
      const streak = await calculateHabitStreak(db, id, request.user.id);

      return {
        data: inserted[0] ?? { habitId: id, logDate: today, isCompleted: true },
        pointsAwarded,
        streak,
      };
    },
  );

  // GET /habits/weekly?date=YYYY-MM-DD — Get habit logs for the week
  app.get('/weekly', { preHandler: [authMiddleware] }, async (request) => {
    const { date } = request.query as { date?: string };
    const targetDate = date ? new Date(date) : new Date();

    // Get Monday of the week
    const day = targetDate.getDay();
    const diff = targetDate.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(targetDate.setDate(diff));
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);

    const mondayStr = monday.toISOString().split('T')[0]!;
    const sundayStr = sunday.toISOString().split('T')[0]!;

    // Get active habits
    const activeHabits = await db
      .select()
      .from(habits)
      .where(
        and(
          eq(habits.userId, request.user.id),
          eq(habits.isActive, true),
          sql`${habits.deletedAt} IS NULL`,
        ),
      );

    // Get logs for this week
    const logs = await db
      .select()
      .from(habitLogs)
      .where(
        and(
          eq(habitLogs.userId, request.user.id),
          gte(habitLogs.logDate, mondayStr),
          lte(habitLogs.logDate, sundayStr),
        ),
      );

    return {
      data: {
        habits: activeHabits,
        logs,
        weekStart: mondayStr,
        weekEnd: sundayStr,
      },
    };
  });
}
