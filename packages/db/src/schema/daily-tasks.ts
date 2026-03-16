import {
  pgTable,
  uuid,
  varchar,
  boolean,
  date,
  smallint,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { goals } from './goals';

export const dailyTasks = pgTable(
  'daily_tasks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    goalId: uuid('goal_id').references(() => goals.id, {
      onDelete: 'set null',
    }),
    title: varchar('title', { length: 300 }).notNull(),
    isCompleted: boolean('is_completed').notNull().default(false),
    taskDate: date('task_date').notNull(),
    source: varchar('source', { length: 10 }).notNull().default('manual'),
    sortOrder: smallint('sort_order').notNull().default(0),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('daily_tasks_user_date_idx').on(table.userId, table.taskDate),
  ],
);
