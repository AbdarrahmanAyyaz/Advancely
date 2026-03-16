import type { FastifyInstance } from 'fastify';
import { eq, and, desc, gte, count } from 'drizzle-orm';
import { aiConversations } from '@advancely/db';
import type { Database } from '@advancely/db';
import { aiChatMessageSchema } from '@advancely/shared';
import { authMiddleware } from '../middleware/auth';
import { createTierGuard } from '../middleware/tier-guard';
import { requireFeature } from '../middleware/tier-guard';
import { createRateLimit } from '../middleware/rate-limit';
import { routeAiTask } from '../services/ai/router';
import { buildUserContext } from '../services/ai/context-builder';
import {
  extractOnboardingPlan,
  finalizeOnboardingPlan,
} from '../services/onboarding-finalizer';
import { ONBOARDING_SYSTEM_PROMPT } from '../prompts/onboarding-v1';
import { buildMorningBriefPrompt } from '../prompts/morning-brief-v1';
import { buildReflectionPrompt } from '../prompts/evening-reflection-v1';

async function countAiConversationsToday(
  db: Database,
  userId: string,
): Promise<number> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const result = await db
    .select({ count: count() })
    .from(aiConversations)
    .where(
      and(
        eq(aiConversations.userId, userId),
        eq(aiConversations.conversationType, 'chat'),
        gte(aiConversations.createdAt, todayStart),
      ),
    );
  return result[0]?.count ?? 0;
}

export async function aiRoutes(app: FastifyInstance): Promise<void> {
  const db = (app as unknown as { db: Database }).db;

  // POST /ai/onboarding — Send message in onboarding conversation
  app.post(
    '/onboarding',
    {
      preHandler: [
        authMiddleware,
        createRateLimit({ max: 20, windowMs: 60_000, keyPrefix: 'ai-onboard' }),
      ],
    },
    async (request, reply) => {
      const parsed = aiChatMessageSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'Validation error',
          details: parsed.error.flatten(),
        });
      }

      // Get or create onboarding conversation
      let conversation = parsed.data.conversationId
        ? (
            await db
              .select()
              .from(aiConversations)
              .where(
                and(
                  eq(aiConversations.id, parsed.data.conversationId),
                  eq(aiConversations.userId, request.user.id),
                  eq(aiConversations.conversationType, 'onboarding'),
                ),
              )
          )[0]
        : undefined;

      const existingMessages = (
        conversation?.messages as Array<{
          role: 'user' | 'assistant';
          content: string;
          ts: string;
        }>
      ) ?? [];

      // Add user's message
      const updatedMessages = [
        ...existingMessages,
        {
          role: 'user' as const,
          content: parsed.data.message,
          ts: new Date().toISOString(),
        },
      ];

      // Call AI
      const aiResult = await routeAiTask({
        taskType: 'onboarding',
        systemPrompt: ONBOARDING_SYSTEM_PROMPT,
        messages: updatedMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        userId: request.user.id,
      });

      // Add AI response
      updatedMessages.push({
        role: 'assistant',
        content: aiResult.content,
        ts: new Date().toISOString(),
      });

      // Save or update conversation
      if (conversation) {
        await db
          .update(aiConversations)
          .set({
            messages: updatedMessages,
            inputTokens: conversation.inputTokens + aiResult.inputTokens,
            outputTokens: conversation.outputTokens + aiResult.outputTokens,
          })
          .where(eq(aiConversations.id, conversation.id));
      } else {
        const created = await db
          .insert(aiConversations)
          .values({
            userId: request.user.id,
            conversationType: 'onboarding',
            messages: updatedMessages,
            modelUsed: aiResult.modelUsed,
            inputTokens: aiResult.inputTokens,
            outputTokens: aiResult.outputTokens,
          })
          .returning();
        conversation = created[0];
      }

      // Check if AI has generated a structured plan
      const plan = extractOnboardingPlan(aiResult.content);

      return {
        data: {
          conversationId: conversation?.id,
          message: aiResult.content,
          modelUsed: aiResult.modelUsed,
          plan: plan ?? undefined,
        },
      };
    },
  );

  // POST /ai/onboarding/finalize — Save the plan and create vision/goals/habits
  app.post(
    '/onboarding/finalize',
    {
      preHandler: [authMiddleware],
    },
    async (request, reply) => {
      const body = request.body as {
        plan: {
          vision_statement: string;
          goals: Array<{
            title: string;
            category: string;
            description: string;
            year1_milestone: string;
          }>;
          suggested_habits: Array<{
            name: string;
            category: string;
            linked_goal_title: string;
            reason: string;
          }>;
        };
        selectedHabitIndices?: number[];
      };

      if (!body.plan?.vision_statement || !Array.isArray(body.plan?.goals)) {
        return reply
          .status(400)
          .send({ error: 'Invalid plan: missing vision or goals' });
      }

      // Filter habits if user deselected some
      let filteredPlan = body.plan;
      if (body.selectedHabitIndices && Array.isArray(body.selectedHabitIndices)) {
        filteredPlan = {
          ...body.plan,
          suggested_habits: body.selectedHabitIndices
            .filter((i) => i < (body.plan.suggested_habits?.length ?? 0))
            .map((i) => body.plan.suggested_habits[i]!),
        };
      }

      const result = await finalizeOnboardingPlan(
        db,
        request.user.id,
        filteredPlan as import('../services/onboarding-finalizer').OnboardingPlan,
      );

      return { data: result };
    },
  );

  // GET /ai/morning-brief — Generate today's morning brief
  app.get(
    '/morning-brief',
    {
      preHandler: [
        authMiddleware,
        createRateLimit({ max: 5, windowMs: 60_000, keyPrefix: 'ai-brief' }),
      ],
    },
    async (request) => {
      const context = await buildUserContext(db, request.user.id);
      const prompt = buildMorningBriefPrompt(context);

      const aiResult = await routeAiTask({
        taskType: 'morning_brief',
        systemPrompt: prompt,
        messages: [
          { role: 'user', content: 'Generate my morning brief for today.' },
        ],
        userId: request.user.id,
      });

      // Save conversation
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

      return { data: { brief: aiResult.content } };
    },
  );

  // POST /ai/reflect — Send journal entry for AI reflection (Pro only)
  app.post(
    '/reflect',
    {
      preHandler: [
        authMiddleware,
        requireFeature('patternDetection'),
        createRateLimit({ max: 5, windowMs: 60_000, keyPrefix: 'ai-reflect' }),
      ],
    },
    async (request, reply) => {
      const body = request.body as {
        wins?: string[];
        challenges?: string | null;
        gratitude?: string[];
        tomorrowFocus?: string | null;
        mood?: number | null;
      };

      const context = await buildUserContext(db, request.user.id);
      const prompt = buildReflectionPrompt(context, {
        wins: body.wins ?? [],
        challenges: body.challenges ?? null,
        gratitude: body.gratitude ?? [],
        tomorrowFocus: body.tomorrowFocus ?? null,
        mood: body.mood ?? null,
      });

      const aiResult = await routeAiTask({
        taskType: 'reflection',
        systemPrompt: prompt,
        messages: [
          { role: 'user', content: 'Reflect on my journal entry.' },
        ],
        userId: request.user.id,
      });

      return { data: { insight: aiResult.content } };
    },
  );

  // POST /ai/chat — Free-form companion conversation (enforce daily limit)
  app.post(
    '/chat',
    {
      preHandler: [
        authMiddleware,
        createTierGuard({
          resource: 'aiConversations',
          countFn: countAiConversationsToday,
        }),
        createRateLimit({ max: 10, windowMs: 60_000, keyPrefix: 'ai-chat' }),
      ],
    },
    async (request, reply) => {
      const parsed = aiChatMessageSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'Validation error',
          details: parsed.error.flatten(),
        });
      }

      const context = await buildUserContext(db, request.user.id);

      const systemPrompt = `You are the Advancely companion — a warm, strategic best friend.

USER CONTEXT:
- Name: ${context.displayName}
- Vision: ${context.visionStatement}
- Active goals: ${JSON.stringify(context.activeGoals)}
- Level: ${context.currentLevel} (${context.totalPoints} points)
- Current streak: ${context.currentStreak} days

Be concise, warm, and actionable. Connect advice back to their vision and goals when relevant.`;

      // Get existing conversation if provided
      let existingMessages: Array<{
        role: 'user' | 'assistant';
        content: string;
        ts: string;
      }> = [];

      if (parsed.data.conversationId) {
        const conv = await db
          .select()
          .from(aiConversations)
          .where(
            and(
              eq(aiConversations.id, parsed.data.conversationId),
              eq(aiConversations.userId, request.user.id),
            ),
          );
        if (conv[0]) {
          existingMessages = conv[0].messages as typeof existingMessages;
        }
      }

      const updatedMessages = [
        ...existingMessages,
        {
          role: 'user' as const,
          content: parsed.data.message,
          ts: new Date().toISOString(),
        },
      ];

      const aiResult = await routeAiTask({
        taskType: 'chat',
        systemPrompt,
        messages: updatedMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        userId: request.user.id,
      });

      updatedMessages.push({
        role: 'assistant',
        content: aiResult.content,
        ts: new Date().toISOString(),
      });

      // Save conversation
      let conversationId = parsed.data.conversationId;
      if (conversationId) {
        await db
          .update(aiConversations)
          .set({ messages: updatedMessages })
          .where(eq(aiConversations.id, conversationId));
      } else {
        const created = await db
          .insert(aiConversations)
          .values({
            userId: request.user.id,
            conversationType: 'chat',
            messages: updatedMessages,
            modelUsed: aiResult.modelUsed,
            inputTokens: aiResult.inputTokens,
            outputTokens: aiResult.outputTokens,
          })
          .returning();
        conversationId = created[0]?.id;
      }

      return {
        data: {
          conversationId,
          message: aiResult.content,
        },
      };
    },
  );
}
