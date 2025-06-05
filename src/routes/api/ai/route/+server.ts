import { json } from '@sveltejs/kit';
import { model } from '$lib/langchain/config';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import { createPerson } from '$lib/db/utils/createPerson';
import { findPerson, detectIntent, createPersonPrompt, updatePersonPrompt } from '$lib/langchain/utils';
import { Person } from '$lib/db/models/Person';
import { Intent } from '$lib/db/models/Person';
import type { Friend } from '$lib/types';

interface PersonWithAssociates extends Person {
  AssociatedPeople?: PersonWithAssociates[];
}

export async function POST({ request }) {
  try {
    const { text } = await request.json();

    // Use the new detectIntent utility
    const { action, confidence } = await detectIntent(text);

    // If it's a search request
    if (action === 'search' || confidence < 0.7) {
      const people = await Person.findAll({
        include: [
          {
            model: Person,
            as: 'AssociatedPeople',
            through: { attributes: [] }
          }
        ]
      }) as PersonWithAssociates[];

      // Convert Person objects to Friend objects
      const friends: Friend[] = people.map(person => ({
        ...person.toJSON(),
        birthday: person.birthday ? person.birthday.toISOString().split('T')[0] : null,
        associates: person.AssociatedPeople?.map(associate => ({
          ...associate.toJSON(),
          birthday: associate.birthday ? associate.birthday.toISOString().split('T')[0] : null
        }))
      }));

      const results = await findPerson(text, friends);
      return json({
        success: true,
        action: 'search',
        message: results
      });
    }

    // If it's an update request
    if (action === 'update') {
      const people = await Person.findAll({
        include: [
          {
            model: Person,
            as: 'AssociatedPeople',
            through: { attributes: [] }
          }
        ]
      }) as PersonWithAssociates[];

      // Convert Person objects to Friend objects
      const friends: Friend[] = people.map(person => ({
        ...person.toJSON(),
        birthday: person.birthday ? person.birthday.toISOString().split('T')[0] : null,
        associates: person.AssociatedPeople?.map(associate => ({
          ...associate.toJSON(),
          birthday: associate.birthday ? associate.birthday.toISOString().split('T')[0] : null
        }))
      }));

      const updatePrompt = updatePersonPrompt();

      const updateChain = RunnableSequence.from([
        updatePrompt,
        model,
        new StringOutputParser(),
      ]);

      const result = await updateChain.invoke({ text, people: JSON.stringify(friends) });
      const updateData = JSON.parse(result);
      console.log('updateData', updateData);

      if (!updateData.personId) {
        return json({
          success: false,
          action: 'update',
          message: 'Could not identify which person to update'
        });
      }


      // Find the person to update
      const personToUpdate = await Person.findByPk(updateData.personId);
      if (!personToUpdate) {
        return json({
          success: false,
          action: 'update',
          message: 'Person not found'
        });
      }

      // Helper function to safely get enum value
      function getEnumValue<T extends { [key: string]: string }>(
        enumObj: T,
        value: string | null
      ): T[keyof T] | undefined {
        if (!value) return undefined;
        const lowerValue = value.toLowerCase();
        return Object.values(enumObj).includes(lowerValue) ? lowerValue as T[keyof T] : undefined;
      }

      // Update the person with new data
      const updateFields: any = {};
      if (updateData.name) updateFields.name = updateData.name;
      if (updateData.body) updateFields.body = updateData.body;
      if (updateData.intent) updateFields.intent = getEnumValue(Intent, updateData.intent);
      if (updateData.birthday) updateFields.birthday = new Date(updateData.birthday);
      if (updateData.mnemonic) updateFields.mnemonic = updateData.mnemonic;

      await personToUpdate.update(updateFields);
      console.log('updateFields', updateFields);

      return json({
        success: true,
        action: 'update',
        message: `I updated ${personToUpdate.name}`,
        person: personToUpdate
      });
    }

    // If it's a create request
    const createPrompt = createPersonPrompt();

    const createChain = RunnableSequence.from([
      createPrompt,
      model,
      new StringOutputParser(),
    ]);

    const result = await createChain.invoke({ text });
    const personData = JSON.parse(result);

    // Helper function to safely get enum value
    function getEnumValue<T extends { [key: string]: string }>(
      enumObj: T,
      value: string | null
    ): T[keyof T] | undefined {
      if (!value) return undefined;
      const lowerValue = value.toLowerCase();
      return Object.values(enumObj).includes(lowerValue) ? lowerValue as T[keyof T] : undefined;
    }

    // Create the person using our utility function
    const newPerson = await createPerson({
      name: personData.name,
      body: personData.body,
      intent: getEnumValue(Intent, personData.intent),
      birthday: personData.birthday ? new Date(personData.birthday) : null,
      mnemonic: personData.mnemonic
    });

    return json({
      success: true,
      action: 'create',
      message: `I created ${newPerson.name}`,
      person: newPerson
    });
  } catch (error) {
    console.error('Processing error:', error);
    return json({
      success: false,
      action: 'error',
      message: 'I failed to process your request',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
} 