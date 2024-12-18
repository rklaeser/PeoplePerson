import { db } from '$lib/db/client'; // Adjust the import according to your project structure
import { people, groups, groupAssociations } from '$lib/db/schema'; // Import the schema
import { fail } from '@sveltejs/kit';
import { eq, ne, and } from 'drizzle-orm';
import { json } from '@sveltejs/kit';


export async function load() {
  try {
    // Use drizzle-orm to query the database and join tables
    const result = await db.select({
      id: people.id,
      name: people.name,
      intent: people.intent,
      county: people.county,
      group_id: groupAssociations.group_id,
      group_name: groups.name
    })
    .from(people)
    .leftJoin(groupAssociations, eq(people.id, groupAssociations.person_id))
    .leftJoin(groups, eq(groupAssociations.group_id, groups.id))
    .execute();

    // Return the result as a plain object
    return { people: result };
  } catch (error) {
    console.error('API GET Error:', error);
    throw new Error('Failed to fetch people');
  }
}

