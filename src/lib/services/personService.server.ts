// File: src/lib/services/personService.server.ts
import { Person, Group, Journal } from '$lib/db/models';
import { Intent } from '$lib/db/models/Person';
import type { Friend } from '$lib/types';

export interface PersonWithGroups extends Person {
  Groups?: Group[];
}

export interface PersonWithAssociates extends Person {
  Associates?: Person[];
}

export interface PersonWithMethods extends Person {
  addGroup: (group: Group) => Promise<void>;
  removeGroup: (groupId: string) => Promise<void>;
  addAssociate: (associate: Person) => Promise<void>;
  removeAssociate: (associateId: string) => Promise<void>;
}

export interface PersonData {
  friend: any;
  associates: any[];
  journals: any[];
  groupData: Array<{ groupId: string; groupName: string }>;
}

export interface CreatePersonInput {
  name: string;
  body?: string | null;
  intent?: Intent | null;
  birthday?: string | null; // YYYY-MM-DD format
  mnemonic?: string | null;
}

export interface UpdatePersonInput {
  personId: string;
  name?: string | null;
  body?: string | null;
  intent?: Intent | null;
  birthday?: string | null;
  mnemonic?: string | null;
}

export class PersonService {
  /**
   * Get all friends/people - for handlers and identification
   */
  static async getAllFriends(): Promise<Friend[]> {
    try {
      const people = await Person.findAll({
        order: [['name', 'ASC']]
      });
      return people.map(person => person.toJSON() as Friend);
    } catch (error) {
      console.error('Error fetching all friends:', error);
      throw error;
    }
  }

  /**
   * Get single friend by ID
   */
  static async getFriend(id: string): Promise<Friend | null> {
    try {
      const person = await Person.findByPk(id);
      return person ? person.toJSON() as Friend : null;
    } catch (error) {
      console.error('Error fetching friend:', error);
      throw error;
    }
  }

  /**
   * Create a new person - Enhanced version for handlers
   */
  static async createFriend(input: CreatePersonInput): Promise<Friend | null> {
    try {
      // Convert string date to Date object if provided
      let birthday: Date | null = null;
      if (input.birthday) {
        birthday = new Date(input.birthday);
        if (isNaN(birthday.getTime())) {
          birthday = null; // Invalid date, set to null
        }
      }

      const person = await Person.create({
        name: input.name,
        body: input.body || 'Add a description',
        intent: input.intent || Intent.NEW,
        birthday: birthday,
        mnemonic: input.mnemonic || null
      });

      console.log('🚀 Friend created:', input.name);
      return person.toJSON() as Friend;
    } catch (error) {
      console.error('Error creating friend:', error);
      return null; // Return null for handler error handling
    }
  }

  /**
   * Update friend - Enhanced version for handlers
   */
  static async updateFriend(id: string, updateData: UpdatePersonInput): Promise<Friend | null> {
    try {
      const person = await Person.findByPk(id);
      if (!person) {
        return null;
      }

      // Prepare update object, only including non-null values
      const updates: any = {};
      
      if (updateData.name !== null && updateData.name !== undefined) {
        updates.name = updateData.name;
      }
      if (updateData.body !== null && updateData.body !== undefined) {
        updates.body = updateData.body;
      }
      if (updateData.intent !== null && updateData.intent !== undefined) {
        updates.intent = updateData.intent;
      }
      if (updateData.mnemonic !== null && updateData.mnemonic !== undefined) {
        updates.mnemonic = updateData.mnemonic;
      }
      if (updateData.birthday !== null && updateData.birthday !== undefined) {
        // Convert string to Date
        if (updateData.birthday) {
          const birthday = new Date(updateData.birthday);
          updates.birthday = isNaN(birthday.getTime()) ? null : birthday;
        } else {
          updates.birthday = null;
        }
      }

      // Only update if there are changes
      if (Object.keys(updates).length > 0) {
        await person.update(updates);
      }

      // Return the updated person
      await person.reload();
      console.log('🚀 Friend updated:', person.name);
      return person.toJSON() as Friend;
    } catch (error) {
      console.error('Error updating friend:', error);
      return null;
    }
  }

  /**
   * Fetch a person with all their related data (groups, associates, journals)
   */
  static async getPersonWithDetails(id: string): Promise<PersonData | null> {
    try {
      // Fetch the person with their groups
      const friend = await Person.findByPk(id, {
        include: [{
          model: Group,
          through: { attributes: [] }
        }]
      }) as PersonWithGroups;

      if (!friend) {
        return null;
      }

      // Fetch the associates (people who are associated with this person)
      const associates = await Person.findAll({
        include: [{
          model: Person,
          as: 'Associates',
          through: { attributes: [] }
        }],
        where: { id }
      }) as PersonWithAssociates[];

      // Fetch journal entries
      const journals = await Journal.findAll({
        where: { personId: id },
        order: [['createdAt', 'DESC']]
      });

      // Transform group data to match the expected format
      const groupData = friend.Groups?.map(group => ({
        groupId: group.id,
        groupName: group.name
      })) || [];

      return {
        friend: friend.toJSON(),
        associates: associates[0]?.Associates?.map(a => a.toJSON()) || [],
        journals: journals.map(j => j.toJSON()),
        groupData
      };
    } catch (error) {
      console.error('Error fetching person details:', error);
      throw error;
    }
  }

  /**
   * Update person body/content
   */
  static async updatePersonBody(id: string, content: string): Promise<void> {
    try {
      await Person.update(
        { body: content },
        { where: { id } }
      );
      console.log('🚀 Content updated');
    } catch (error) {
      console.error('Error updating person body:', error);
      throw error;
    }
  }

  /**
   * Update person birthday
   */
  static async updatePersonBirthday(id: string, birthday: string): Promise<void> {
    try {
      await Person.update(
        { birthday },
        { where: { id } }
      );
      console.log('🚀 Birthday updated');
    } catch (error) {
      console.error('Error updating person birthday:', error);
      throw error;
    }
  }

  /**
   * Update person mnemonic
   */
  static async updatePersonMnemonic(id: string, mnemonic: string): Promise<void> {
    try {
      await Person.update(
        { mnemonic },
        { where: { id } }
      );
      console.log('🚀 Mnemonic updated');
    } catch (error) {
      console.error('Error updating person mnemonic:', error);
      throw error;
    }
  }

  /**
   * Create a new person - Legacy method for backwards compatibility
   */
  static async createPerson(name: string): Promise<Person> {
    try {
      const person = await Person.create({ name });
      console.log('🚀 Person added:', name);
      return person;
    } catch (error) {
      console.error('Error creating person:', error);
      throw error;
    }
  }

  /**
   * Delete person and related data
   */
  static async deletePerson(id: string, name?: string): Promise<void> {
    try {
      // Delete associated records first
      await Journal.destroy({ where: { person_id: id } });
      
      // Delete the person (this will cascade delete associations)
      await Person.destroy({ where: { id } });
      
      console.log('🚀 Person deleted:', { id, name });
    } catch (error) {
      console.error('Error deleting person:', error);
      throw error;
    }
  }

  /**
   * Create association between two people
   */
  static async createAssociation(primaryId: string, associateName: string): Promise<void> {
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
      console.error('Error creating association:', error);
      throw error;
    }
  }

  /**
   * Delete association between two people
   */
  static async deleteAssociation(primaryId: string, associateId: string): Promise<void> {
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
      console.error('Error deleting association:', error);
      throw error;
    }
  }

  /**
   * Create journal entry for a person
   */
  static async createJournalEntry(personId: string, content: string, title: string): Promise<void> {
    try {
      await Journal.create({
        person_id: personId,
        content,
        title
      });
      console.log('🚀 Journal entry created');
    } catch (error) {
      console.error('Error creating journal entry:', error);
      throw error;
    }
  }

  /**
   * Add person to group (create group if it doesn't exist)
   */
  static async addPersonToGroup(personId: string, groupName: string): Promise<void> {
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
      console.error('Error adding person to group:', error);
      throw error;
    }
  }

  /**
   * Remove person from group
   */
  static async removePersonFromGroup(personId: string, groupId: string): Promise<void> {
    try {
      const person = await Person.findByPk(personId) as PersonWithMethods;
      if (!person) {
        throw new Error('Person not found');
      }
      await person.removeGroup(groupId);
      console.log('🚀 Person removed from group:', { personId, groupId });
    } catch (error) {
      console.error('Error removing person from group:', error);
      throw error;
    }
  }

  /**
   * Update person status/intent
   */
  static async updatePersonStatus(id: string, intent: string): Promise<void> {
    if (!intent || !Object.values(Intent).includes(intent as Intent)) {
      throw new Error('Invalid intent value');
    }

    try {
      await Person.update(
        { intent: intent as Intent },
        { where: { id } }
      );
      console.log('🚀 Status updated');
    } catch (error) {
      console.error('Error updating person status:', error);
      throw error;
    }
  }
}