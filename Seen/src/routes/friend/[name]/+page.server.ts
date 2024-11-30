import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {db} from '$lib/db/client';
import { people } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';


export const load: PageServerLoad = async ({ params }) => {
if (params.name && typeof params.name === 'string') {
    try{
        const result = await db.select().from(people).where(eq(people.name, params.name)).execute();
        console.log('🚀 Person fetched:', result[0].name);
        console.log('🚀     Body:', result[0].body);
        return result[0];   
        }
    catch(error){
        console.error('API POST Error:', error);
        return fail(500, { error: 'Failed to add person' });
    }
    
  }
};

export const actions = {
    update: async ({ request }) => {
        const data = await request.formData();
        const id = data.get('id');
        const content = data.get('content');
        console.log('🚀 Content updated');
        if (id && typeof id === 'string' && content && typeof content === 'string') {
          try {
            await db.update(people).set({body: content}).where(eq(people.id, id));
            console.log('🚀 Content updated');
          } catch (error) {
            console.error('API POST Error:', error);
            return fail(500, { error: 'Failed to add person' });
        }
        } else {
          console.error('Invalid name:', name);
          return fail(400, { error: 'Invalid name' });
        }
      },
}


