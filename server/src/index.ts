import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { createDb } from '@advancely/db';
import type { Database } from '@advancely/db';

// Route imports
import { authRoutes } from './routes/auth';
import { visionRoutes } from './routes/visions';
import { goalRoutes } from './routes/goals';
import { taskRoutes } from './routes/tasks';
import { habitRoutes } from './routes/habits';
import { journalRoutes } from './routes/journal';
import { aiRoutes } from './routes/ai';
import { pointRoutes } from './routes/points';
import { webhookRoutes } from './routes/webhooks';

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Augment Fastify instance type with db
declare module 'fastify' {
  interface FastifyInstance {
    db: Database;
  }
}

async function main(): Promise<void> {
  const app = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    },
  });

  // Register CORS
  await app.register(cors, {
    origin: true,
    credentials: true,
  });

  // Allow empty bodies with Content-Type: application/json.
  // Mobile clients often send this header even on POST/PATCH with no body.
  app.addContentTypeParser(
    'application/json',
    { parseAs: 'string' },
    (_req, body, done) => {
      try {
        const str = (body as string).trim();
        done(null, str.length > 0 ? JSON.parse(str) : undefined);
      } catch (err) {
        done(err as Error, undefined);
      }
    },
  );

  // Database connection
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }
  const db = createDb(databaseUrl);

  // Decorate fastify instance with db
  app.decorate('db', db);

  // Health check
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Register route plugins
  await app.register(authRoutes, { prefix: '/auth' });
  await app.register(visionRoutes, { prefix: '/visions' });
  await app.register(goalRoutes, { prefix: '/goals' });
  await app.register(taskRoutes, { prefix: '/tasks' });
  await app.register(habitRoutes, { prefix: '/habits' });
  await app.register(journalRoutes, { prefix: '/journal' });
  await app.register(aiRoutes, { prefix: '/ai' });
  await app.register(pointRoutes, { prefix: '/points' });
  await app.register(webhookRoutes, { prefix: '/webhooks' });

  try {
    await app.listen({ port: PORT, host: HOST });
    app.log.info(`Server listening on ${HOST}:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
