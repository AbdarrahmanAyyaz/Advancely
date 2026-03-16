import {
  pgTable,
  uuid,
  integer,
  date,
  index,
  unique,
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { habits } from './habits';

export const streakSnapshots = pgTable(
  'streak_snapshots',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    habitId: uuid('habit_id')
      .notNull()
      .references(() => habits.id, { onDelete: 'cascade' }),
    currentStreak: integer('current_streak').notNull().default(0),
    bestStreak: integer('best_streak').notNull().default(0),
    snapshotDate: date('snapshot_date').notNull(),
  },
  (table) => [
    unique('streak_snapshots_habit_date_unique').on(
      table.habitId,
      table.snapshotDate,
    ),
    index('streak_snapshots_user_date_idx').on(
      table.userId,
      table.snapshotDate,
    ),
  ],
);
