import type { FastifyInstance } from 'fastify';
import { eq, and, sql, count } from 'drizzle-orm';
import { goals } from '@advancely/db';
import type { Database } from '@advancely/db';
import {
  createGoalSchema,
  updateGoalSchema,
  updateProgressSchema,
} from '@advancely/shared';
import { authMiddleware } from '../middleware/auth';
import { createTierGuard } from '../middleware/tier-guard';

async function countUserGoals(db: Database, userId: string): Promise<number> {
  const result = await db
    .select({ count: count() })
    .from(goals)
    .where(
      and(
        eq(goals.userId, userId),
        eq(goals.status, 'active'),
        sql`${goals.deletedAt} IS NULL`,
      ),
    );
  return result[0]?.count ?? 0;
}

export async function goalRoutes(app: FastifyInstance): Promise<void> {
  const db = (app as unknown as { db: Database }).db;

  // GET /goals — Get all active goals
  app.get('/', { preHandler: [authMiddleware] }, async (request) => {
    const result = await db
      .select()
      .from(goals)
      .where(
        and(
          eq(goals.userId, request.user.id),
          sql`${goals.deletedAt} IS NULL`,
        ),
      );

    return { data: result };
  });

  // POST /goals — Create goal (enforce tier limit)
  app.post(
    '/',
    {
      preHandler: [
        authMiddleware,
        createTierGuard({ resource: 'goals', countFn: countUserGoals }),
      ],
    },
    async (request, reply) => {
      const parsed = createGoalSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'Validation error',
          details: parsed.error.flatten(),
        });
      }

      const created = await db
        .insert(goals)
        .values({
          userId: request.user.id,
          visionId: parsed.data.visionId,
          title: parsed.data.title,
          category: parsed.data.category,
          description: parsed.data.description ?? null,
          targetDate: parsed.data.targetDate,
          milestones: parsed.data.milestones,
        })
        .returning();

      return reply.status(201).send({ data: created[0] });
    },
  );

  // PATCH /goals/:id — Update goal
  app.patch(
    '/:id',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const parsed = updateGoalSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'Validation error',
          details: parsed.error.flatten(),
        });
      }

      const updated = await db
        .update(goals)
        .set(parsed.data)
        .where(
          and(
            eq(goals.id, id),
            eq(goals.userId, request.user.id),
            sql`${goals.deletedAt} IS NULL`,
          ),
        )
        .returning();

      if (!updated[0]) {
        return reply.status(404).send({ error: 'Goal not found' });
      }

      return { data: updated[0] };
    },
  );

  // DELETE /goals/:id — Soft delete
  app.delete(
    '/:id',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      const updated = await db
        .update(goals)
        .set({ deletedAt: new Date() })
        .where(
          and(
            eq(goals.id, id),
            eq(goals.userId, request.user.id),
            sql`${goals.deletedAt} IS NULL`,
          ),
        )
        .returning();

      if (!updated[0]) {
        return reply.status(404).send({ error: 'Goal not found' });
      }

      return { data: { deleted: true } };
    },
  );

  // PATCH /goals/:id/progress — Update progress percentage
  app.patch(
    '/:id/progress',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const parsed = updateProgressSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'Validation error',
          details: parsed.error.flatten(),
        });
      }

      const updated = await db
        .update(goals)
        .set({ progress: parsed.data.progress })
        .where(
          and(
            eq(goals.id, id),
            eq(goals.userId, request.user.id),
            sql`${goals.deletedAt} IS NULL`,
          ),
        )
        .returning();

      if (!updated[0]) {
        return reply.status(404).send({ error: 'Goal not found' });
      }

      return { data: updated[0] };
    },
  );
}
