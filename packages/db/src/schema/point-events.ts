import {
  pgTable,
  uuid,
  varchar,
  smallint,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './users';

export const pointEvents = pgTable(
  'point_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    eventType: varchar('event_type', { length: 30 }).notNull(),
    points: smallint('points').notNull(),
    sourceId: uuid('source_id'),
    sourceType: varchar('source_type', { length: 20 }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('point_events_user_created_idx').on(table.userId, table.createdAt),
  ],
);
