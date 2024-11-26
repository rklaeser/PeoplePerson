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
        return result[0];   
        }
    catch(error){
        console.error('API POST Error:', error);
        return fail(500, { error: 'Failed to add person' });
    }
    
  }
};


