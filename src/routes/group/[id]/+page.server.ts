import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {db} from '$lib/db/client';
import { people, associations, journal, statusEnum, groups, groupAssociations } from '$lib/db/schema';
import { eq, and, exists, sql } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params}) => {
    const id = params.id;
    try{
        const groupResult = await db.select().from(groups).where(eq(groups.id, id)).execute();
        const group = groupResult[0];

        const members = await db.select(
            {
                id: people.id,
                name: people.name,
                intent: people.intent,
                county: people.county
            }
        )
            .from(people)
            .innerJoin(groupAssociations, eq(groupAssociations.person_id, people.id))
            .where(eq(groupAssociations.group_id, id))
            .execute();

        console.log('🚀 Group fetched:', {group, members} );
        return {group, people: members };
    }
    catch(error){
        console.error('API POST Error:', error);
        return fail(500, { error: 'Failed to add person' });
    }    
}

export const actions = {
    create: async ({ request }) => {
      const data = await request.formData();
      const name = data.get('name') as string;
      const group_id = data.get('groupId') as string;
      console.log('🚀 Creating person in group:', { name, group_id });
        try {
            const newFriend = await db.insert(people).values({
            name: name,
            intent: 'new'
          }).returning({ insertedId: people.id });
          console.log('🚀 Person added:', name);

          let person_id = newFriend[0].insertedId;
        
        // Add person to group
        await db.insert(groupAssociations).values({
            person_id: person_id,
            group_id: group_id
        });
        console.log('🚀 Person added to group:', { person_id, group_id });

        } catch (error) {
          console.error('API POST Error:', error);
          return fail(500, { error: 'Failed to add person' });
    }
    },
}