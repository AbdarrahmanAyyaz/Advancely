import type { FastifyInstance } from 'fastify';
import { eq, and, count } from 'drizzle-orm';
import { dailyTasks } from '@advancely/db';
import type { Database } from '@advancely/db';
import { createTaskSchema, updateTaskSchema, POINT_VALUES } from '@advancely/shared';
import { authMiddleware } from '../middleware/auth';
import { createTierGuard } from '../middleware/tier-guard';
import { awardPoints, checkDailyBonus } from '../services/gamification';

export async function taskRoutes(app: FastifyInstance): Promise<void> {
  const db = (app as unknown as { db: Database }).db;

  async function countUserTasksForDate(
    db: Database,
    userId: string,
  ): Promise<number> {
    // Count tasks for today (default date for new tasks)
    const today = new Date().toISOString().split('T')[0]!;
    const result = await db
      .select({ count: count() })
      .from(dailyTasks)
      .where(
        and(
          eq(dailyTasks.userId, userId),
          eq(dailyTasks.taskDate, today),
        ),
      );
    return result[0]?.count ?? 0;
  }

  // GET /tasks?date=YYYY-MM-DD — Get tasks for a specific date
  app.get('/', { preHandler: [authMiddleware] }, async (request) => {
    const { date } = request.query as { date?: string };
    const taskDate = date ?? new Date().toISOString().split('T')[0]!;

    const tasks = await db
      .select()
      .from(dailyTasks)
      .where(
        and(
          eq(dailyTasks.userId, request.user.id),
          eq(dailyTasks.taskDate, taskDate),
        ),
      );

    return { data: tasks };
  });

  // POST /tasks — Create task (enforce tier limit per day)
  app.post(
    '/',
    {
      preHandler: [
        authMiddleware,
        createTierGuard({
          resource: 'dailyTasks',
          countFn: countUserTasksForDate,
        }),
      ],
    },
    async (request, reply) => {
      const parsed = createTaskSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'Validation error',
          details: parsed.error.flatten(),
        });
      }

      const created = await db
        .insert(dailyTasks)
        .values({
          userId: request.user.id,
          goalId: parsed.data.goalId ?? null,
          title: parsed.data.title,
          taskDate: parsed.data.taskDate,
          source: parsed.data.source,
          sortOrder: parsed.data.sortOrder,
        })
        .returning();

      return reply.status(201).send({ data: created[0] });
    },
  );

  // PATCH /tasks/:id — Update task (title, sort_order)
  app.patch(
    '/:id',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const parsed = updateTaskSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'Validation error',
          details: parsed.error.flatten(),
        });
      }

      const updated = await db
        .update(dailyTasks)
        .set(parsed.data)
        .where(
          and(
            eq(dailyTasks.id, id),
            eq(dailyTasks.userId, request.user.id),
          ),
        )
        .returning();

      if (!updated[0]) {
        return reply.status(404).send({ error: 'Task not found' });
      }

      return { data: updated[0] };
    },
  );

  // PATCH /tasks/:id/complete — Mark complete, award points
  app.patch(
    '/:id/complete',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      // Get the task first
      const existing = await db
        .select()
        .from(dailyTasks)
        .where(
          and(
            eq(dailyTasks.id, id),
            eq(dailyTasks.userId, request.user.id),
          ),
        );

      if (!existing[0]) {
        return reply.status(404).send({ error: 'Task not found' });
      }

      // Idempotent — if already completed, return as-is
      if (existing[0].isCompleted) {
        return { data: existing[0], pointsAwarded: 0, dailyBonus: false };
      }

      const updated = await db
        .update(dailyTasks)
        .set({
          isCompleted: true,
          completedAt: new Date(),
        })
        .where(
          and(
            eq(dailyTasks.id, id),
            eq(dailyTasks.userId, request.user.id),
          ),
        )
        .returning();

      // Award points
      await awardPoints(
        db,
        request.user.id,
        'task_complete',
        POINT_VALUES.taskComplete,
        id,
        'daily_task',
      );

      // Check daily bonus
      const dailyBonusAwarded = await checkDailyBonus(
        db,
        request.user.id,
        existing[0].taskDate,
      );

      return {
        data: updated[0],
        pointsAwarded: POINT_VALUES.taskComplete,
        dailyBonus: dailyBonusAwarded,
      };
    },
  );

  // DELETE /tasks/:id — Hard delete
  app.delete(
    '/:id',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      const deleted = await db
        .delete(dailyTasks)
        .where(
          and(
            eq(dailyTasks.id, id),
            eq(dailyTasks.userId, request.user.id),
          ),
        )
        .returning();

      if (!deleted[0]) {
        return reply.status(404).send({ error: 'Task not found' });
      }

      return { data: { deleted: true } };
    },
  );
}
