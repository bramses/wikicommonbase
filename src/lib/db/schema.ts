import { pgTable, uuid, text, jsonb, timestamp, vector } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const entries = pgTable('entries', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  data: text('data').notNull(),
  metadata: jsonb('metadata').notNull(),
  embedding: vector('embedding', { dimensions: 1536 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Entry = typeof entries.$inferSelect;
export type NewEntry = typeof entries.$inferInsert;