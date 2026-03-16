/**
 * Tier Guard Middleware Factory
 *
 * Checks if the user's subscription tier allows the requested action.
 * Returns a preHandler function configured for a specific resource type.
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import { TIER_LIMITS } from '@advancely/shared';
import type { Tier } from '@advancely/shared';
import type { Database } from '@advancely/db';

type ResourceType = 'goals' | 'dailyTasks' | 'habits' | 'journal' | 'aiConversations';

const RESOURCE_TO_LIMIT_KEY: Record<ResourceType, keyof (typeof TIER_LIMITS)['free']> = {
  goals: 'maxGoals',
  dailyTasks: 'maxDailyTasks',
  habits: 'maxHabits',
  journal: 'maxJournalPerWeek',
  aiConversations: 'maxAiConversationsPerDay',
};

interface TierGuardOptions {
  resource: ResourceType;
  /**
   * Function that returns the current count for this user/resource.
   * Receives the database instance and user ID.
   */
  countFn: (db: Database, userId: string) => Promise<number>;
}

/**
 * Creates a tier-guard preHandler for a specific resource.
 *
 * Usage:
 * ```ts
 * app.post('/goals', {
 *   preHandler: [authMiddleware, createTierGuard({ resource: 'goals', countFn: countUserGoals })],
 * }, handler);
 * ```
 */
export function createTierGuard(options: TierGuardOptions) {
  return async function tierGuard(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const tier = request.user.tier as Tier;
    const limits = TIER_LIMITS[tier];
    const limitKey = RESOURCE_TO_LIMIT_KEY[options.resource];
    const maxAllowed = limits[limitKey] as number;

    // Infinity means unlimited
    if (maxAllowed === Infinity) {
      return;
    }

    const db = (request.server as unknown as { db: Database }).db;
    const currentCount = await options.countFn(db, request.user.id);

    if (currentCount >= maxAllowed) {
      return reply.status(403).send({
        error: 'Tier limit reached',
        message: `Your ${tier} plan allows a maximum of ${maxAllowed} ${options.resource}. Upgrade to Pro for more.`,
        limit: maxAllowed,
        current: currentCount,
        tier,
      });
    }
  };
}

/**
 * Simple tier feature gate — checks if a feature is enabled for the user's tier.
 */
export function requireFeature(feature: keyof (typeof TIER_LIMITS)['free']['features']) {
  return async function featureGuard(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const tier = request.user.tier as Tier;
    const features = TIER_LIMITS[tier].features;

    if (!features[feature]) {
      return reply.status(403).send({
        error: 'Pro feature',
        message: `This feature requires a Pro subscription.`,
        feature,
        tier,
      });
    }
  };
}
