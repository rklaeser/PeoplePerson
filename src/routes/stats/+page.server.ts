import { db } from '$lib/db/client'; // Adjust the import according to your project structure
import { people, associations, groups, groupAssociations, journal } from '$lib/db/schema'; // Import the schema
import { fail } from '@sveltejs/kit';
import { eq, ne, and, count, gt, sql } from 'drizzle-orm';
import { json } from '@sveltejs/kit';

export async function load() {
	try {
    // Use drizzle-orm to query the database
    const result = await db
    .select({
      intent: people.intent,
      count: count(),
      recentCount: sql`COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days')`
    })
    .from(people)
    .groupBy(people.intent)
    .execute();


    //console.log("🚀 People fetched: ", result);  // Logs the query result
    return { intents: result } ;  // Return a plain object
  } catch (error) {
    console.error('API GET Error:', error);
    throw new Error('Failed to fetch people');
    }
  }