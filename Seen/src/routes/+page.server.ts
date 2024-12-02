import { db } from '$lib/db/client'; // Adjust the import according to your project structure
import { people } from '$lib/db/schema'; // Import the schema
import { fail } from '@sveltejs/kit';
import { eq, ne, and } from 'drizzle-orm';
import { json } from '@sveltejs/kit';


export async function load() {
	try {
    // Use drizzle-orm to query the database
    const result = await db.select().from(people)
                                    .where(
                                      and(
                                        ne(people.intent, 'archive'), 
                                        ne(people.intent, 'associate')
                                      )).execute();
    console.log("🚀 People fetched");  // Logs the query result
    return { people: result };  // Return a plain object
  } catch (error) {
    console.error('API GET Error:', error);
    throw new Error('Failed to fetch people');
    }
  }

  export const actions = {
    create: async ({ request }) => {
      const data = await request.formData();
      const name = data.get('name');
      if (name && typeof name === 'string') {
        try {
          await db.insert(people).values({
            name: name,
            intent: 'new'
          });
          console.log('🚀 Person added:', name);
        } catch (error) {
          console.error('API POST Error:', error);
          return fail(500, { error: 'Failed to add person' });
        }
      } else {
        console.error('Invalid name:', name);
        return fail(400, { error: 'Invalid name' });
      }
    },
    delete: async ({ request }) => {
      const data = await request.formData();
      const id = data.get('id');
      const name = data.get('name');
      if (id && typeof id === 'string' && typeof name === 'string') {
        try {
          await db.delete(people).where(eq(people.id, id));
          console.log('🚀 Person deleted:', name);
        } catch (error) {
          console.error('API DELETE Error:', error);
          return fail(500, { error: 'Failed to delete person' });
        }
      } else {
        console.error('Invalid id:', id);
        return fail(400, { error: 'Invalid id' });
      }
    }
  };