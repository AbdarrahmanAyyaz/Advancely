import type { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import { users, aiConversations } from '@advancely/db';
import type { Database } from '@advancely/db';
import { updateProfileSchema } from '@advancely/shared';
import { authMiddleware, supabaseAdmin } from '../middleware/auth';
import { routeAiTask } from '../services/ai/router';
import { buildUserContext } from '../services/ai/context-builder';
import { buildMorningBriefPrompt } from '../prompts/morning-brief-v1';

export async function authRoutes(app: FastifyInstance): Promise<void> {
  const db = (app as unknown as { db: Database }).db;

  // POST /auth/signup — Create user via admin API (auto-confirms email)
  app.post('/signup', async (request, reply) => {
    const { email, password } = request.body as {
      email: string;
      password: string;
    };

    if (!email || !password) {
      return reply
        .status(400)
        .send({ error: 'Email and password are required' });
    }

    if (password.length < 8) {
      return reply
        .status(400)
        .send({ error: 'Password must be at least 8 characters' });
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      return reply.status(400).send({ error: error.message });
    }

    return { data: { user: { id: data.user.id, email: data.user.email } } };
  });

  // GET /auth/me — Get current user profile
  app.get('/me', { preHandler: [authMiddleware] }, async (request) => {
    const profile = await db
      .select()
      .from(users)
      .where(eq(users.id, request.user.id));

    if (!profile[0]) {
      return { error: 'Profile not found' };
    }

    return { data: profile[0] };
  });

  // PATCH /auth/me — Update profile
  app.patch('/me', { preHandler: [authMiddleware] }, async (request, reply) => {
    const parsed = updateProfileSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'Validation error',
        details: parsed.error.flatten(),
      });
    }

    const updateData: Record<string, unknown> = {};
    if (parsed.data.displayName !== undefined) {
      updateData.displayName = parsed.data.displayName;
    }
    if (parsed.data.avatarUrl !== undefined) {
      updateData.avatarUrl = parsed.data.avatarUrl;
    }
    if (parsed.data.timezone !== undefined) {
      updateData.timezone = parsed.data.timezone;
    }

    const updated = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, request.user.id))
      .returning();

    return { data: updated[0] };
  });

  // POST /auth/complete-onboarding — Mark onboarding complete + generate first brief
  app.post(
    '/complete-onboarding',
    { preHandler: [authMiddleware] },
    async (request) => {
      const updated = await db
        .update(users)
        .set({ onboardingCompletedAt: new Date() })
        .where(eq(users.id, request.user.id))
        .returning();

      // Generate first morning brief in the background (don't block the response)
      // This ensures the dashboard has content immediately when the user arrives
      (async () => {
        try {
          const context = await buildUserContext(db, request.user.id);
          const prompt = buildMorningBriefPrompt(context);

          const aiResult = await routeAiTask({
            taskType: 'morning_brief',
            systemPrompt: prompt,
            messages: [
              {
                role: 'user',
                content: 'Generate my morning brief for today.',
              },
            ],
            userId: request.user.id,
          });

          await db.insert(aiConversations).values({
            userId: request.user.id,
            conversationType: 'morning_brief',
            messages: [
              {
                role: 'user',
                content: 'Generate my morning brief for today.',
                ts: new Date().toISOString(),
              },
              {
                role: 'assistant',
                content: aiResult.content,
                ts: new Date().toISOString(),
              },
            ],
            modelUsed: aiResult.modelUsed,
            inputTokens: aiResult.inputTokens,
            outputTokens: aiResult.outputTokens,
          });
        } catch (err) {
          console.error('Failed to generate first morning brief:', err);
        }
      })();

      return { data: updated[0] };
    },
  );
}
