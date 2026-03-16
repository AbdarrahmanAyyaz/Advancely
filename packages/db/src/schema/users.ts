import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  smallint,
  timestamp,
  jsonb,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey(), // References auth.users(id)
  email: varchar('email', { length: 255 }).notNull().unique(),
  displayName: varchar('display_name', { length: 100 }),
  avatarUrl: text('avatar_url'),
  tier: varchar('tier', { length: 10 }).notNull().default('free'),
  totalPoints: integer('total_points').notNull().default(0),
  currentLevel: smallint('current_level').notNull().default(1),
  onboardingCompletedAt: timestamp('onboarding_completed_at', {
    withTimezone: true,
  }),
  aiContextSummary: jsonb('ai_context_summary'),
  timezone: varchar('timezone', { length: 50 }).notNull().default('UTC'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});
