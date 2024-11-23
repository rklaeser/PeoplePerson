import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const friendTable = pgTable('friend_table', {
	id: serial('id').primaryKey(),
	name: text('name').notNull()
});
