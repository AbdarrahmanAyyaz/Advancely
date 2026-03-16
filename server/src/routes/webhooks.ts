import type { FastifyInstance } from 'fastify';

/**
 * Webhook routes
 *
 * Handles external service callbacks (RevenueCat, etc.)
 * These routes do NOT use authMiddleware — they use webhook-specific auth.
 */
export async function webhookRoutes(app: FastifyInstance): Promise<void> {
  // POST /webhooks/revenuecat — Handle subscription status changes
  app.post('/revenuecat', async (request, reply) => {
    // Verify webhook secret
    const webhookSecret = process.env.REVENUECAT_WEBHOOK_SECRET;
    const authHeader = request.headers.authorization;

    if (!webhookSecret || authHeader !== `Bearer ${webhookSecret}`) {
      return reply.status(401).send({ error: 'Invalid webhook secret' });
    }

    // TODO: Implement RevenueCat webhook handling in payments phase
    // 1. Parse the event payload
    // 2. Update subscriptions table
    // 3. Update users.tier accordingly
    request.log.info(
      { body: request.body },
      'RevenueCat webhook received',
    );

    return { received: true };
  });
}
