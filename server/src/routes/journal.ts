import type { FastifyInstance } from 'fastify';
import { eq, and, desc, gte, count } from 'drizzle-orm';
import { journalEntries } from '@advancely/db';
import type { Database } from '@advancely/db';
import { createJournalSchema, updateJournalSchema, POINT_VALUES } from '@advancely/shared';
import { authMiddleware } from '../middleware/auth';
import { createTierGuard } from '../middleware/tier-guard';
import { awardPoints } from '../services/gamification';

async function countJournalThisWeek(
  db: Database,
  userId: string,
): Promise<number> {
  // Get Monday of current week
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  const mondayStr = monday.toISOString().split('T')[0]!;

  const result = await db
    .select({ count: count() })
    .from(journalEntries)
    .where(
      and(
        eq(journalEntries.userId, userId),
        gte(journalEntries.entryDate, mondayStr),
      ),
    );
  return result[0]?.count ?? 0;
}

export async function journalRoutes(app: FastifyInstance): Promise<void> {
  const db = (app as unknown as { db: Database }).db;

  // GET /journal?date=YYYY-MM-DD — Get entry for specific date
  app.get('/', { preHandler: [authMiddleware] }, async (request) => {
    const { date } = request.query as { date?: string };
    const entryDate = date ?? new Date().toISOString().split('T')[0]!;

    const entry = await db
      .select()
      .from(journalEntries)
      .where(
        and(
          eq(journalEntries.userId, request.user.id),
          eq(journalEntries.entryDate, entryDate),
        ),
      )
      .limit(1);

    return { data: entry[0] ?? null };
  });

  // GET /journal/recent?limit=N — Get N most recent entries
  app.get('/recent', { preHandler: [authMiddleware] }, async (request) => {
    const { limit } = request.query as { limit?: string };
    const entryLimit = Math.min(Number(limit) || 7, 30);

    const entries = await db
      .select()
      .from(journalEntries)
      .where(eq(journalEntries.userId, request.user.id))
      .orderBy(desc(journalEntries.entryDate))
      .limit(entryLimit);

    return { data: entries };
  });

  // POST /journal — Create entry (enforce weekly limit for free tier)
  app.post(
    '/',
    {
      preHandler: [
        authMiddleware,
        createTierGuard({
          resource: 'journal',
          countFn: countJournalThisWeek,
        }),
      ],
    },
    async (request, reply) => {
      const parsed = createJournalSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'Validation error',
          details: parsed.error.flatten(),
        });
      }

      // Upsert — one entry per user per date
      const created = await db
        .insert(journalEntries)
        .values({
          userId: request.user.id,
          entryDate: parsed.data.entryDate,
          wins: parsed.data.wins,
          challenges: parsed.data.challenges ?? null,
          gratitude: parsed.data.gratitude,
          tomorrowFocus: parsed.data.tomorrowFocus ?? null,
          mood: parsed.data.mood ?? null,
        })
        .onConflictDoUpdate({
          target: [journalEntries.userId, journalEntries.entryDate],
          set: {
            wins: parsed.data.wins,
            challenges: parsed.data.challenges ?? null,
            gratitude: parsed.data.gratitude,
            tomorrowFocus: parsed.data.tomorrowFocus ?? null,
            mood: parsed.data.mood ?? null,
          },
        })
        .returning();

      // Award points for journal entry
      await awardPoints(
        db,
        request.user.id,
        'journal_entry',
        POINT_VALUES.journalEntry,
        created[0]?.id,
        'journal_entry',
      );

      return reply.status(201).send({
        data: created[0],
        pointsAwarded: POINT_VALUES.journalEntry,
      });
    },
  );

  // PATCH /journal/:id — Update entry (same day only)
  app.patch(
    '/:id',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const parsed = updateJournalSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'Validation error',
          details: parsed.error.flatten(),
        });
      }

      const updateData: Record<string, unknown> = {};
      if (parsed.data.wins !== undefined) updateData.wins = parsed.data.wins;
      if (parsed.data.challenges !== undefined)
        updateData.challenges = parsed.data.challenges;
      if (parsed.data.gratitude !== undefined)
        updateData.gratitude = parsed.data.gratitude;
      if (parsed.data.tomorrowFocus !== undefined)
        updateData.tomorrowFocus = parsed.data.tomorrowFocus;
      if (parsed.data.mood !== undefined) updateData.mood = parsed.data.mood;

      const updated = await db
        .update(journalEntries)
        .set(updateData)
        .where(
          and(
            eq(journalEntries.id, id),
            eq(journalEntries.userId, request.user.id),
          ),
        )
        .returning();

      if (!updated[0]) {
        return reply.status(404).send({ error: 'Journal entry not found' });
      }

      return { data: updated[0] };
    },
  );
}
