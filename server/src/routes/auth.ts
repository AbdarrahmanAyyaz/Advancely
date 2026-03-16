import type { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import { users } from '@advancely/db';
import type { Database } from '@advancely/db';
import { updateProfileSchema } from '@advancely/shared';
import { authMiddleware, supabaseAdmin } from '../middleware/auth';

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

  // POST /auth/complete-onboarding — Mark onboarding complete
  app.post(
    '/complete-onboarding',
    { preHandler: [authMiddleware] },
    async (request) => {
      const updated = await db
        .update(users)
        .set({ onboardingCompletedAt: new Date() })
        .where(eq(users.id, request.user.id))
        .returning();

      return { data: updated[0] };
    },
  );
}
