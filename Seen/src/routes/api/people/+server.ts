
import { db } from '$lib/db/client';
import { json } from '@sveltejs/kit';
import { friendTable } from '$lib/db/schema'; // Import the schema

export async function GET() {
  try {
    // Use drizzle-orm to query the database
    const result = await db.select().from(friendTable).execute();
    console.log(result);  // Logs the query result
    return json(result);  // Sends the result as a JSON response
  } catch (error) {
    console.error('API Route Error:', error);
    return json({ error: error }, { status: 500 });
  }
}

/*
// src/routes/api/people/+server.ts
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async () => {
  const people = [
    { id: 1, name: 'John Doe' },
    { id: 2, name: 'Jane Doe' }
  ];

  return new Response(JSON.stringify(people), {
    headers: { 'Content-Type': 'application/json' }
  });
};
*/