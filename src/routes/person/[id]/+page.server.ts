// File: src/routes/friend/[id]/+page.server.ts
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { PersonService } from '$lib/services/personService.server';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
  const id = params.id;
  
  try {
    const personData = await PersonService.getPersonWithDetails(id);
    
    if (!personData) {
      throw error(404, 'Person not found');
    }

    console.log('🚀 Person fetched:', personData);
    return personData;
  } catch (err) {
    console.error('Page Load Error:', err);
    throw error(500, 'Failed to fetch person');
  }
};

export const actions = {
  updateBody: async ({ request }) => {
    const data = await request.formData();
    const id = data.get('id') as string;
    const content = data.get('content') as string;

    console.log('🚀 Updating content:', { id, content });

    try {
      await PersonService.updatePersonBody(id, content);
    } catch (error) {
      console.error('Update Body Error:', error);
      return fail(500, { error: 'Failed to update content' });
    }
  },

  updateBirthday: async ({ request }) => {
    const data = await request.formData();
    const id = data.get('id') as string;
    const birthday = data.get('birthday') as string;
    
    console.log('🚀 Updating birthday:', { id, birthday });

    try {
      await PersonService.updatePersonBirthday(id, birthday);
    } catch (error) {
      console.error('Update Birthday Error:', error);
      return fail(500, { error: 'Failed to update birthday' });
    }
  },

  updateMnemonic: async ({ request }) => {
    const data = await request.formData();
    const id = data.get('id') as string;
    const mnemonic = data.get('mnemonic') as string;
    
    console.log('🚀 Updating mnemonic:', { id, mnemonic });

    try {
      await PersonService.updatePersonMnemonic(id, mnemonic);
    } catch (error) {
      console.error('Update Mnemonic Error:', error);
      return fail(500, { error: 'Failed to update mnemonic' });
    }
  },

  create: async ({ request }) => {
    const data = await request.formData();
    const name = data.get('name');
    
    if (!name || typeof name !== 'string') {
      console.error('Invalid name:', name);
      return fail(400, { error: 'Invalid name' });
    }

    try {
      await PersonService.createPerson(name);
    } catch (error) {
      console.error('Create Person Error:', error);
      return fail(500, { error: 'Failed to add person' });
    }
  },

  delete: async ({ request }) => {
    console.log('🚀 Deleting person: server');
    const data = await request.formData();
    const id = data.get('id') as string;
    const name = data.get('name') as string;
    
    console.log('🚀 Deleting person:', { id, name });

    try {
      await PersonService.deletePerson(id, name);
    } catch (error) {
      console.error('Delete Person Error:', error);
      return fail(500, { error: 'Failed to delete person' });
    }
  },

  createAssociation: async ({ request }) => {
    const data = await request.formData();
    const primaryId = data.get('id') as string;
    const associateName = data.get('associate') as string;
    
    console.log('🚀 Creating association:', { primaryId, associateName });

    try {
      await PersonService.createAssociation(primaryId, associateName);
    } catch (error) {
      console.error('Create Association Error:', error);
      return fail(500, { error: 'Failed to create association' });
    }
  },

  deleteAssociation: async ({ request }) => {
    const data = await request.formData();
    const primaryId = data.get('id') as string;
    const associateId = data.get('associate') as string;
    
    console.log('🚀 Deleting association:', { primaryId, associateId });

    try {
      await PersonService.deleteAssociation(primaryId, associateId);
    } catch (error) {
      console.error('Delete Association Error:', error);
      return fail(500, { error: 'Failed to delete association' });
    }
  },

  createJournal: async ({ request }) => {
    const data = await request.formData();
    const personId = data.get('id') as string;
    const entry = data.get('content') as string;
    const title = data.get('title') as string;
    
    console.log('🚀 Creating journal entry:', { personId, entry });

    try {
      await PersonService.createJournalEntry(personId, entry, title);
    } catch (error) {
      console.error('Create Journal Error:', error);
      return fail(500, { error: 'Failed to create journal entry' });
    }
  },

  addGroup: async ({ request }) => {
    const data = await request.formData();
    const groupName = data.get('name') as string;
    const personId = data.get('id') as string;
    
    console.log('🚀 Adding person to group:', { personId, groupName });

    try {
      await PersonService.addPersonToGroup(personId, groupName);
    } catch (error) {
      console.error('Add Group Error:', error);
      return fail(500, { error: 'Failed to add person to group' });
    }
  },

  removeGroup: async ({ request }) => {
    const data = await request.formData();
    const groupId = data.get('groupId') as string;
    const personId = data.get('id') as string;
    
    console.log('🚀 Removing person from group:', { personId, groupId });

    try {
      await PersonService.removePersonFromGroup(personId, groupId);
    } catch (error) {
      console.error('Remove Group Error:', error);
      return fail(500, { error: 'Failed to remove person from group' });
    }
  },

  updateStatus: async ({ request }) => {
    const data = await request.formData();
    const id = data.get('id') as string;
    const intent = data.get('intent') as string;
    
    console.log('🚀 Updating status:', { id, intent });

    try {
      await PersonService.updatePersonStatus(id, intent);
    } catch (error) {
      console.error('Update Status Error:', error);
      return fail(500, { error: 'Failed to update status' });
    }
  },
};