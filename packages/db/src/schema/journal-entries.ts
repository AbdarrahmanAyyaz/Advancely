import {
  pgTable,
  uuid,
  date,
  text,
  smallint,
  timestamp,
  jsonb,
  index,
  unique,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users';

export const journalEntries = pgTable(
  'journal_entries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    entryDate: date('entry_date').notNull(),
    wins: jsonb('wins').notNull().default([]),
    challenges: text('challenges'),
    gratitude: jsonb('gratitude').notNull().default([]),
    tomorrowFocus: text('tomorrow_focus'),
    mood: smallint('mood'),
    aiInsights: text('ai_insights'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique('journal_entries_user_date_unique').on(table.userId, table.entryDate),
    index('journal_entries_user_date_idx').on(table.userId, table.entryDate),
    check(
      'mood_range_check',
      sql`${table.mood} >= 1 AND ${table.mood} <= 5`,
    ),
  ],
);
