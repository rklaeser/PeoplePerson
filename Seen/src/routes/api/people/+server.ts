
import { db } from '$lib/db/client';
import { json } from '@sveltejs/kit';
import { people } from '$lib/db/schema'; // Import the schema

export const prerender = false; // Disable prerendering for this endpoint

export async function GET() {
  try {
    // Use drizzle-orm to query the database
    const result = await db.select().from(people).execute();
    console.log("🚀 People fetched");  // Logs the query result
    return json(result);  // Sends the result as a JSON response
  } catch (error) {
    console.error('API GET Error:', error);
    return json({ error: error }, { status: 500 });
  }
}

