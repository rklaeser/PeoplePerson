import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {db} from '$lib/db/client';
import { people, associations, journal, statusEnum } from '$lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';


export const load: PageServerLoad = async ({ params}) => {
  const id = params.id;
     
  
  try{
        const personResult = await db.select().from(people).where(eq(people.id, id)).execute();
        const friend = personResult[0];

        // Fetch the associates
        const associatesResult = await db.select().from(associations)
                                            .innerJoin(people, eq(associations.associate_id, people.id))
                                            .where(eq(associations.primary_id, id))
                                            .execute();
      const associates = associatesResult.map(row => row.people);


    const journals = await db.select().from(journal).where(eq(journal.person_id, id)).execute();

      console.log('🚀 Person fetched:', {friend, associates, journals} );   
      return { friend, associates, journals };
        }
    catch(error){
        console.error('API POST Error:', error);
        return fail(500, { error: 'Failed to add person' });
    } 
};

export const actions = {
  update: async ({ request }) => {
    const data = await request.formData();
    const id = data.get('id') as string;
    const county = data.get('county') as string;
    const intent = data.get('intent') as string;
    const content = data.get('content') as string;
    console.log('🚀 Updating content:', { id, county, intent, content });

    type IntentType = typeof statusEnum.enumValues[number];
    if (
      intent && statusEnum.enumValues.includes(intent as IntentType)
    ) {
      try {
        await db.update(people)
          .set({
            body: content,
            county: county,
            intent: intent as IntentType
          })
          .where(eq(people.id, id));
        console.log('🚀 Content updated');
      } catch (error) {
        console.error('API POST Error:', error);
        return fail(500, { error: 'Failed to update content' });
      }
    } else {
      console.error('Invalid input:', { id, content, county, intent });
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
},
deleteAssociation: async ({ request }) => {
  const data = await request.formData();
  const primaryId = data.get('id') as string;
  const associateId = data.get('associate') as string;
  console.log('🚀 Deleting association:', { primaryId, associateId });

  try {
    await db.delete(associations)
      .where(
        and(
          eq(associations.primary_id, primaryId),
          eq(associations.associate_id, associateId)));
    console.log('🚀 Association deleted from associatins:', { primaryId, associateId });
  } catch (error) {
    console.error('API POST Error:', error);
    return fail(500, { error: 'Failed to delete association' });
  }
  try {
    await db.delete(people).where(eq(people.id, associateId));
    console.log('🚀 Associate deleted from people:', associateId);
  }
  catch (error) {
    console.error('API POST Error:', error);
    return fail(500, { error: 'Failed to delete associate' });
  }
},
createJournal: async ({ request }) => {
  const data = await request.formData();
  const personId = data.get('id') as string;
  const entry = data.get('content') as string;
  const title = data.get('title') as string;
  console.log('🚀 Creating journal entry:', { personId, entry });

  try {
    await db.insert(journal).values({
      person_id: personId,
      body: entry,
      title: title
    });
    console.log('🚀 Journal entry created:', { personId, entry });
  } catch (error) {
    console.error('API POST Error:', error);
    return fail(500, { error: 'Failed to create journal entry' });
  }
},
deleteJournal: async ({ request }) => {
  const data = await request.formData();
  const journalId = data.get('id') as string;
  console.log('🚀 Deleting journal entry:', journalId);

  try {
    await db.delete(journal).where(eq(journal.id, journalId));
    console.log('🚀 Journal entry deleted:', journalId);
  } catch (error) {
    console.error('API POST Error:', error);
    return fail(500, { error: 'Failed to delete journal entry' });
  }
}
};




