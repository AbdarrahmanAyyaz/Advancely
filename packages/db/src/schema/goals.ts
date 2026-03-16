import {
  pgTable,
  uuid,
  varchar,
  text,
  date,
  smallint,
  timestamp,
  jsonb,
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { visions } from './visions';

export const goals = pgTable('goals', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  visionId: uuid('vision_id')
    .notNull()
    .references(() => visions.id),
  title: varchar('title', { length: 200 }).notNull(),
  category: varchar('category', { length: 20 }).notNull(),
  description: text('description'),
  targetDate: date('target_date'),
  progress: smallint('progress').notNull().default(0),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  milestones: jsonb('milestones').notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});
