import { db } from '$lib/db/client'; // Adjust the import according to your project structure
import { people } from '$lib/db/schema'; // Import the schema
import { fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';


export async function load({ fetch }) {
	const res = await fetch('/api/people');
	if (!res.ok) {
	  throw new Error('Failed to fetch people');
	}
	const people = await res.json();
	return {
	  people
	};
  }

  export const actions = {
    add: async ({ request }) => {
      const data = await request.formData();
      const name = data.get('name');
      if (name && typeof name === 'string') {
        try {
          await db.insert(people).values({
            name: name,
            zip: 94117,
            body: '## Hello, world!'
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