import { integer, pgTable, serial, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const people = pgTable('people', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: text('name').notNull(),
	zip: integer('zip').notNull(),
	created_at: timestamp('created_at').notNull().defaultNow(),
	body: text('body').notNull()
});