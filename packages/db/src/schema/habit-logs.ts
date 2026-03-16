import {
  pgTable,
  uuid,
  date,
  boolean,
  timestamp,
  index,
  unique,
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { habits } from './habits';

export const habitLogs = pgTable(
  'habit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    habitId: uuid('habit_id')
      .notNull()
      .references(() => habits.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    logDate: date('log_date').notNull(),
    isCompleted: boolean('is_completed').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique('habit_logs_habit_date_unique').on(table.habitId, table.logDate),
    index('habit_logs_user_date_idx').on(table.userId, table.logDate),
    index('habit_logs_habit_date_idx').on(table.habitId, table.logDate),
  ],
);
