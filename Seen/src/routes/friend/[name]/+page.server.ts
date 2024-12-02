import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {db} from '$lib/db/client';
import { people, associations, statusEnum } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';


export const load: PageServerLoad = async ({ params, url }) => {
  const name = params.name;
  const id = url.searchParams.get('id') as string;

  console.log('🚀 Person fetched:', {name, id}); 
  try{
        const personResult = await db.select().from(people).where(eq(people.id, id)).execute();
        const friend = personResult[0];

        console.log('🚀 Person fetched:', friend.name);        
        // Fetch the associates
        const associatesResult = await db.select().from(associations)
                                            .innerJoin(people, eq(associations.associate_id, people.id))
                                            .where(eq(associations.primary_id, id))
                                            .execute();
      const associates = associatesResult.map(row => row.people);
      return { friend, associates };
        }
    catch(error){
        console.error('API POST Error:', error);
        return fail(500, { error: 'Failed to add person' });
    } 
};

/*
export const load = async ({ params }) => {
  const id = params.id;

  try {
    // Fetch the primary person
    const personResult = await db.select().from(people).where(eq(people.id, id)).execute();
    const person = personResult[0];

    // Fetch the associates
    const associatesResult = await db.select()
      .from(associations)
      .innerJoin(people, eq(associations.associate_id, people.id))
      .where(eq(associations.primary_id, id))
      .execute();
    const associates = associatesResult.map(row => row.people);

    console.log("🚀 Person and associates fetched");
    return { person, associates };
  } catch (error) {
    console.error('API GET Error:', error);
    throw new Error('Failed to fetch person and associates');
  }
};
*/
export const actions = {
  update: async ({ request }) => {
    const data = await request.formData();
    const id = data.get('id') as string;
    const zip = data.get('zip') as string;
    const intent = data.get('intent') as string;
    const content = data.get('content') as string;

    //const allowedIntents = ['romantic', 'core', 'archive', 'new', 'invest'] as const;
    type IntentType = typeof statusEnum.enumValues[number];
    if (
      zip && !isNaN(Number(zip)) &&
      intent && statusEnum.enumValues.includes(intent as IntentType)
    ) {
      try {
        await db.update(people)
          .set({
            body: content,
            zip: Number(zip),
            intent: intent as IntentType
          })
          .where(eq(people.id, id));
        console.log('🚀 Content updated');
      } catch (error) {
        console.error('API POST Error:', error);
        return fail(500, { error: 'Failed to update content' });
      }
    } else {
      console.error('Invalid input:', { id, content, zip, intent });
      return fail(400, { error: 'Invalid input' });
    }
  },
  create: async ({ request }) => {
    const data = await request.formData();
    const name = data.get('name');
    if (name && typeof name === 'string') {
      try {
        await db.insert(people).values({
          name: name,
          zip: 94117,
          body: '## Hello, world!',
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
  createAssociation: async ({ request }) => {
    const data = await request.formData();
    const primaryId = data.get('id') as string;
    const associateName = data.get('associate') as string;
    console.log('🚀 Creating association:', { primaryId, associateName });
  
    // Create the associate (friend)
    let associateId: string;
    try {
      const result = await db.insert(people).values({
        name: associateName,
        intent: 'associate'
      }).returning({ id: people.id })
      associateId = result[0].id;
      console.log('🚀 Associate created:', associateId);
    } catch (error) {
      console.error('API POST Error:', error);
      return fail(500, { error: 'Failed to create associate' });
    }

  // Create the association
  try {
    await db.insert(associations).values({
      primary_id: primaryId,
      associate_id: associateId
    });
    console.log('🚀 Association created:', { primaryId, associateId });
  } catch (error) {
    console.error('API POST Error:', error);
    return fail(500, { error: 'Failed to create association' });
  }
}
};




