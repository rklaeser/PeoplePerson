import { integer, pgTable, serial, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const people = pgTable('people', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: text('name').notNull()
});