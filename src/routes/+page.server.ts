import { db } from '$lib/db/client'; // Adjust the import according to your project structure
import { people, associations, groups, groupAssociations, journal } from '$lib/db/schema'; // Import the schema
import { fail } from '@sveltejs/kit';
import { eq, ne, and } from 'drizzle-orm';
import { json } from '@sveltejs/kit';

export async function load() {
	try {
    // Use drizzle-orm to query the database
    const result = await db.select().from(groups).execute();
    //console.log("🚀 People fetched: ", result);  // Logs the query result
    return {groups: result} ;  // Return a plain object
  } catch (error) {
    console.error('API GET Error:', error);
    throw new Error('Failed to fetch people');
    }
  }

  export const actions = {
    create: async ({ request }) => {
      const data = await request.formData();
      const name = data.get('name') as string;
        try {
          await db.insert(people).values({
            name: name,
            intent: 'new'
          });
          console.log('🚀 Person added:', name);

          let newFriend = await db.select(
            {id: people.id}
          ).from(people).where(eq(people.name, name));

          return { id: newFriend[0].id };
        } catch (error) {
          console.error('API POST Error:', error);
          return fail(500, { error: 'Failed to add person' });
        }
    },
    delete: async ({ request }) => {
      const data = await request.formData();
      const id = data.get('id') as string;
      const name = data.get('name') as string;
        try {

          await db.delete(associations).where(eq(associations.primary_id, id));
          await db.delete(groupAssociations).where(eq(groupAssociations.person_id, id));
          await db.delete(journal).where(eq(journal.person_id, id));

          await db.delete(people).where(eq(people.id, id));
          console.log('🚀 Person deleted:', name);
        } catch (error) {
          console.error('API DELETE Error:', error);
          return fail(500, { error: 'Failed to delete person' });
        }

    }
  };