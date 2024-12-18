import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {db} from '$lib/db/client';
import { people, associations, journal, statusEnum, groups, groupAssociations } from '$lib/db/schema';
import { eq, and, exists, sql } from 'drizzle-orm';
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

      const groupData = await db.select({
        groupId: groups.id,
        groupName: groups.name
      }).from(groups).innerJoin(groupAssociations, eq(groups.id, groupAssociations.group_id)).where(eq(groupAssociations.person_id, id));
    

    const journals = await db.select().from(journal).where(eq(journal.person_id, id)).execute();

      console.log('🚀 Person fetched:', {friend, associates, journals, groupData} );   
      return { friend, associates, journals, 
        groupData: groupData.length ? groupData : []
       };
        }
    catch(error){
        console.error('API POST Error:', error);
        return fail(500, { error: 'Failed to add person' });
    } 
};

export const actions = {
  updateBody: async ({ request }) => {
    const data = await request.formData();
    const id = data.get('id') as string;
    const content = data.get('content') as string;

    console.log('🚀 Updating content:', { id, content });

      try {
        await db.update(people)
          .set({
            body: content          })
          .where(eq(people.id, id));
        console.log('🚀 Content updated');

      } catch (error) {
        console.error('API POST Error:', error);
        return fail(500, { error: 'Failed to update content' });
      }
  },
  updateBirthday: async ({ request }) => {
    const data = await request.formData();
    const id = data.get('id') as string;
    const birthday = data.get('birthday') as string;
    console.log('🚀 Updating birthday:', { id, birthday });

    try {
      await db.update(people).set({
        birthday: birthday
      }).where(eq(people.id, id));
      console.log('🚀 Birthday updated');
    } catch (error) {
      console.error('API POST Error:', error);
      return fail(500, { error: 'Failed to update birthday' });
    }
  },
  updateMnemonic: async ({ request }) => {
    const data = await request.formData();
    const id = data.get('id') as string;
    const mnemonic = data.get('mnemonic') as string;
    console.log('🚀 Updating mnemonic:', { id, mnemonic });

    try {
      await db.update(people).set({
        mnemonic: mnemonic
      }).where(eq(people.id, id));
      console.log('🚀 Mnemonic updated');
    } catch (error) {
      console.error('API POST Error:', error);
      return fail(500, { error: 'Failed to update mnemonic' });
    }
  },
  create: async ({ request }) => {
    const data = await request.formData();
    const name = data.get('name');
    if (name && typeof name === 'string') {
      try {
        await db.insert(people).values({
          name: name        });
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
    console.log('🚀 Deleting person: server');
    const data = await request.formData();
    const id = data.get('id') as string;
    const name = data.get('name') as string;
    console.log('🚀 Deleting person:', { id, name });

    try {

      await db.delete(associations).where(eq(associations.primary_id, id));
      await db.delete(groupAssociations).where(eq(groupAssociations.person_id, id));
      await db.delete(journal).where(eq(journal.person_id, id));


      await db.delete(people).where(eq(people.id, id));
      console.log('🚀 Person deleted:', { id, name });
    } catch (error) {
      console.error('API DELETE Error:', error);
      return fail(500, { error: 'Failed to delete person'});
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
},
addGroup: async ({ request }) => {
  const data = await request.formData();
  const groupName = data.get('name') as string;
  const personId = data.get('id') as string;
  console.log('🚀 Adding person to group:', { personId, groupName });
  let groupId: string;
  try {
    // Get group ID, add group if does not exist
    const group = await db.select(
      {id: groups.id}
    ).from(groups).where(eq(groups.name, groupName)).execute();
    if (group.length === 0) {
      const newGroup = await db.insert(groups).values({ name: groupName }).returning({ insertedId: groups.id });
      groupId = newGroup[0].insertedId;
    }
    else{
      groupId = group[0].id;
    }

    // Add person to group
    await db.insert(groupAssociations).values({
      person_id: personId,
      group_id: groupId
    });
    console.log('🚀 Person added to group:', { personId, groupId });
  } catch (error) {
    console.error('API POST Error:', error);
    return fail(500, { error: 'Failed to add person to group' });
  }
},
removeGroup: async ({ request }) => {
  const data = await request.formData();
  const groupId = data.get('groupId') as string;
  const personId = data.get('id') as string;
  console.log('🚀 Removing person from group:', { personId, groupId });

  try {
    await db.delete(groupAssociations).where(
      and(
        eq(groupAssociations.group_id, groupId),
        eq(groupAssociations.person_id, personId)
      )
    );
    console.log('🚀 Person removed from group:', { personId, groupId });
  } catch (error) {
    console.error('API POST Error:', error);
    return fail(500, { error: 'Failed to remove person from group' });
  }
},
updateStatus: async ({ request }) => {
 const data = await request.formData();
  const id = data.get('id') as string;
  const intent = data.get('intent') as string;
  console.log('🚀 Updating status:', { id, intent });
  type IntentType = typeof statusEnum.enumValues[number];
    if (
      intent && statusEnum.enumValues.includes(intent as IntentType)
    )
  try{
    await db.update(people).set({
      intent: intent as IntentType
    }).where(eq(people.id, id));
    console.log('🚀 Status updated');
  }
  catch(error){
    console.error('API POST Error:', error);
    return fail(500, { error: 'Failed to update status' });
  }

},
updateCounty: async ({ request }) => {
  const data = await request.formData();
  const id = data.get('id') as string;
  const county = data.get('county') as string;
  console.log('🚀 Updating county:', { id, county });

  try {
    await db.update(people).set({
      county: county
    }).where(eq(people.id, id));
    console.log('🚀 County updated');
  } catch (error) {
    console.error('API POST Error:', error);
    return fail(500, { error: 'Failed to update county' });
  }
}
};