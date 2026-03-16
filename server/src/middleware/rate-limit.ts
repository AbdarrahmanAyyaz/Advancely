/**
 * Rate Limit Middleware
 *
 * Per-user rate limiting using an in-memory store.
 * Replace with Redis in production for multi-instance deployments.
 */

import type { FastifyRequest, FastifyReply } from 'fastify';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store: userId -> RateLimitEntry
const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

interface RateLimitOptions {
  /** Maximum requests allowed in the window */
  max: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Key prefix to namespace different rate limits */
  keyPrefix?: string;
}

/**
 * Creates a rate-limit preHandler.
 *
 * Usage:
 * ```ts
 * app.post('/ai/chat', {
 *   preHandler: [authMiddleware, createRateLimit({ max: 30, windowMs: 60_000 })],
 * }, handler);
 * ```
 */
export function createRateLimit(options: RateLimitOptions) {
  const { max, windowMs, keyPrefix = 'rl' } = options;

  return async function rateLimit(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const userId = request.user?.id;
    if (!userId) return; // Skip if no user (shouldn't happen after auth)

    const key = `${keyPrefix}:${userId}`;
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || entry.resetAt <= now) {
      // New window
      store.set(key, { count: 1, resetAt: now + windowMs });
      reply.header('X-RateLimit-Limit', max);
      reply.header('X-RateLimit-Remaining', max - 1);
      return;
    }

    entry.count++;

    if (entry.count > max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      reply.header('Retry-After', retryAfter);
      reply.header('X-RateLimit-Limit', max);
      reply.header('X-RateLimit-Remaining', 0);
      return reply.status(429).send({
        error: 'Too many requests',
        message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
        retryAfter,
      });
    }

    reply.header('X-RateLimit-Limit', max);
    reply.header('X-RateLimit-Remaining', max - entry.count);
  };
}
