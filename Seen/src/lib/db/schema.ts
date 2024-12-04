import { integer, pgTable, text, timestamp, uuid, pgEnum, primaryKey } from 'drizzle-orm/pg-core';

// Define the enum type for status
export const statusEnum = pgEnum('intent', ['romantic', 'core', 'archive', 'new', 'invest', 'associate']);

export const regionEnum = pgEnum('region', ['midwest', 'bay', 'tahoe', 'sac', 'socal', 'uncategorized']);


export const people = pgTable('people', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  region: regionEnum().notNull().default('uncategorized'),
  zip: integer('zip').notNull().default(0),
  county: text('county').notNull().$default(() => 'uncategorized'), // Add county field
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
  body: text('body').notNull().$default(() => 'Add a description'), // Add body field with default value
  intent: statusEnum().notNull().default('new') // Add status field with default value 'new'
});

// Define the associations table
export const associations = pgTable('associations', {
  primary_id: uuid('primary_id').notNull().references(() => people.id),
  associate_id: uuid('associate_id').notNull().references(() => people.id),
  created_at: timestamp('created_at').notNull().defaultNow(),
}, (table) => {
  return [
    primaryKey({ columns: [table.primary_id, table.associate_id] })
  ];
}
);

export const journal = pgTable('journal', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  person_id: uuid('person_id').notNull().references(() => people.id),
  title: text('title').notNull().$default(() => 'Untitled'),
  body: text('body').notNull(),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date())
});

export const groups = pgTable('groups', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  name: text('name').notNull(),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date())
});

export const groupAssociations = pgTable('groupAssociations', {
  group_id: uuid('group_id').notNull().references(() => groups.id),
  person_id: uuid('person_id').notNull().references(() => people.id),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date())
}, (table) => {
  return [
    primaryKey({ columns: [table.group_id, table.person_id] })
  ];
});