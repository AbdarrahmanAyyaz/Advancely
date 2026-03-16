import type { FastifyInstance } from 'fastify';
import { eq, and, desc } from 'drizzle-orm';
import { visions } from '@advancely/db';
import type { Database } from '@advancely/db';
import { createVisionSchema, updateVisionSchema } from '@advancely/shared';
import { authMiddleware } from '../middleware/auth';

export async function visionRoutes(app: FastifyInstance): Promise<void> {
  const db = (app as unknown as { db: Database }).db;

  // GET /visions/active — Get user's active vision
  app.get('/active', { preHandler: [authMiddleware] }, async (request) => {
    const vision = await db
      .select()
      .from(visions)
      .where(
        and(
          eq(visions.userId, request.user.id),
          eq(visions.isActive, true),
        ),
      )
      .limit(1);

    return { data: vision[0] ?? null };
  });

  // GET /visions/history — Get all vision versions
  app.get('/history', { preHandler: [authMiddleware] }, async (request) => {
    const history = await db
      .select()
      .from(visions)
      .where(eq(visions.userId, request.user.id))
      .orderBy(desc(visions.version));

    return { data: history };
  });

  // POST /visions — Create new vision (deactivates previous)
  app.post('/', { preHandler: [authMiddleware] }, async (request, reply) => {
    const parsed = createVisionSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'Validation error',
        details: parsed.error.flatten(),
      });
    }

    // Deactivate current active vision
    await db
      .update(visions)
      .set({ isActive: false })
      .where(
        and(
          eq(visions.userId, request.user.id),
          eq(visions.isActive, true),
        ),
      );

    // Get next version number
    const existing = await db
      .select({ version: visions.version })
      .from(visions)
      .where(eq(visions.userId, request.user.id))
      .orderBy(desc(visions.version))
      .limit(1);

    const nextVersion = (existing[0]?.version ?? 0) + 1;

    const created = await db
      .insert(visions)
      .values({
        userId: request.user.id,
        statement: parsed.data.statement,
        version: nextVersion,
        isActive: true,
      })
      .returning();

    return reply.status(201).send({ data: created[0] });
  });

  // PATCH /visions/:id — Update vision statement
  app.patch(
    '/:id',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const parsed = updateVisionSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'Validation error',
          details: parsed.error.flatten(),
        });
      }

      // Get current version
      const current = await db
        .select({ version: visions.version })
        .from(visions)
        .where(
          and(
            eq(visions.id, id),
            eq(visions.userId, request.user.id),
          ),
        );

      if (!current[0]) {
        return reply.status(404).send({ error: 'Vision not found' });
      }

      const updated = await db
        .update(visions)
        .set({
          statement: parsed.data.statement,
          version: current[0].version + 1,
        })
        .where(
          and(
            eq(visions.id, id),
            eq(visions.userId, request.user.id),
          ),
        )
        .returning();

      return { data: updated[0] };
    },
  );
}
