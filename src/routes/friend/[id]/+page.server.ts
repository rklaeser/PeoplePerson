import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { Person, Group, Journal, sequelize } from '$lib/db/models';
import { Intent } from '$lib/db/models/Person';
import { fail } from '@sveltejs/kit';
import { Op } from 'sequelize';

interface PersonWithGroups extends Person {
  Groups?: Group[];
}

interface PersonWithAssociates extends Person {
  AssociatedPeople?: Person[];
}

interface PersonWithMethods extends Person {
  addGroup: (group: Group) => Promise<void>;
  removeGroup: (groupId: string) => Promise<void>;
  addAssociate: (associate: Person) => Promise<void>;
  removeAssociate: (associateId: string) => Promise<void>;
}

export const load: PageServerLoad = async ({ params }) => {
  const id = params.id;
  
  try {
    // Fetch the person with their groups
    const friend = await Person.findByPk(id, {
      include: [{
        model: Group,
        through: { attributes: [] }
      }]
    }) as PersonWithGroups;

    if (!friend) {
      throw error(404, 'Person not found');
    }

    // Fetch the associates (people who are associated with this person)
    const associates = await Person.findAll({
      include: [{
        model: Person,
        as: 'AssociatedPeople',
        through: { attributes: [] }
      }],
      where: {
        id: id
      }
    }) as PersonWithAssociates[];

    // Fetch journal entries
    const journals = await Journal.findAll({
      where: {
        personId: id
      },
      order: [['createdAt', 'DESC']]
    });

    // Transform group data to match the expected format
    const groupData = friend.Groups?.map(group => ({
      groupId: group.id,
      groupName: group.name
    })) || [];

    console.log('🚀 Person fetched:', { friend, associates, journals, groupData });
    return { 
      friend: friend.toJSON(),
      associates: associates[0]?.AssociatedPeople?.map(a => a.toJSON()) || [],
      journals: journals.map(j => j.toJSON()),
      groupData
    };
  } catch (err) {
    console.error('API GET Error:', err);
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
      await Person.update(
        { body: content },
        { where: { id } }
      );
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
      await Person.update(
        { birthday },
        { where: { id } }
      );
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
      await Person.update(
        { mnemonic },
        { where: { id } }
      );
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
        await Person.create({ name });
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
      // Delete associated records first
      await Journal.destroy({ where: { person_id: id } });
      
      // Delete the person (this will cascade delete associations)
      await Person.destroy({ where: { id } });
      
      console.log('🚀 Person deleted:', { id, name });
    } catch (error) {
      console.error('API DELETE Error:', error);
      return fail(500, { error: 'Failed to delete person' });
    }
  },

  createAssociation: async ({ request }) => {
    const data = await request.formData();
    const primaryId = data.get('id') as string;
    const associateName = data.get('associate') as string;
    console.log('🚀 Creating association:', { primaryId, associateName });
  
    try {
      // Create the associate (friend)
      const associate = await Person.create({
        name: associateName,
        intent: 'associate'
      });

      // Get the primary person
      const primaryPerson = await Person.findByPk(primaryId) as PersonWithMethods;
      if (!primaryPerson) {
        throw new Error('Primary person not found');
      }

      // Create the association
      await primaryPerson.addAssociate(associate);
      
      console.log('🚀 Association created:', { primaryId, associateId: associate.id });
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
      // Get the primary person
      const primaryPerson = await Person.findByPk(primaryId) as PersonWithMethods;
      if (!primaryPerson) {
        throw new Error('Primary person not found');
      }

      // Remove the association
      await primaryPerson.removeAssociate(associateId);
      
      // Delete the associate
      await Person.destroy({ where: { id: associateId } });
      
      console.log('🚀 Association deleted:', { primaryId, associateId });
    } catch (error) {
      console.error('API POST Error:', error);
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
      await Journal.create({
        person_id: personId,
        content: entry,
        title: title
      });
      console.log('🚀 Journal entry created');
    } catch (error) {
      console.error('API POST Error:', error);
      return fail(500, { error: 'Failed to create journal entry' });
    }
  },

  addGroup: async ({ request }) => {
    const data = await request.formData();
    const groupName = data.get('name') as string;
    const personId = data.get('id') as string;
    console.log('🚀 Adding person to group:', { personId, groupName });

    try {
      // Get group ID, add group if does not exist
      const group = await Group.findOne({ where: { name: groupName } });
      const person = await Person.findByPk(personId) as PersonWithMethods;
      if (!person) {
        throw new Error('Person not found');
      }

      if (!group) {
        const newGroup = await Group.create({ name: groupName });
        await person.addGroup(newGroup);
      } else {
        await person.addGroup(group);
      }
      console.log('🚀 Person added to group:', { personId, groupName });
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
      const person = await Person.findByPk(personId) as PersonWithMethods;
      if (!person) {
        throw new Error('Person not found');
      }
      await person.removeGroup(groupId);
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

    if (intent && Object.values(Intent).includes(intent as Intent)) {
      try {
        await Person.update(
          { intent: intent as Intent },
          { where: { id } }
        );
        console.log('🚀 Status updated');
      } catch (error) {
        console.error('API POST Error:', error);
        return fail(500, { error: 'Failed to update status' });
      }
    }
  },

  updateCounty: async ({ request }) => {
    const data = await request.formData();
    const id = data.get('id') as string;
    const county = data.get('county') as string;
    console.log('🚀 Updating county:', { id, county });

    try {
      await Person.update(
        { county },
        { where: { id } }
      );
      console.log('🚀 County updated');
    } catch (error) {
      console.error('API POST Error:', error);
      return fail(500, { error: 'Failed to update county' });
    }
  }
};