import {
  pgTable,
  uuid,
  varchar,
  boolean,
  smallint,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users';
import { goals } from './goals';

export const habits = pgTable(
  'habits',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    goalId: uuid('goal_id').references(() => goals.id, {
      onDelete: 'set null',
    }),
    name: varchar('name', { length: 150 }).notNull(),
    category: varchar('category', { length: 20 }).notNull(),
    isActive: boolean('is_active').notNull().default(true),
    sortOrder: smallint('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('habits_active_idx')
      .on(table.userId)
      .where(sql`${table.isActive} = true AND ${table.deletedAt} IS NULL`),
  ],
);
