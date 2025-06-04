import { Person, Group } from '$lib/db/models';
import { fail } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';

interface RawPerson {
  id: string;
  name: string;
  intent: string;
  county: string;
  Groups?: Array<{
    id: string;
    name: string;
  }>;
}

export async function load() {
  try {
    // Use Sequelize to query the database with associations
    const people = await Person.findAll({
      include: [{
        model: Group,
        through: { attributes: [] }, // Don't include the join table attributes
        attributes: ['id', 'name'] // Only include these fields from Group
      }],
      raw: true, // Get plain objects
      nest: true // Nest the included models
    }) as unknown as RawPerson[];

    // Transform the data to match the expected format
    const result = people.map(person => ({
      id: person.id,
      name: person.name,
      intent: person.intent,
      county: person.county,
      group_id: person.Groups?.[0]?.id,
      group_name: person.Groups?.[0]?.name
    }));

    return { people: result };
  } catch (error) {
    console.error('API GET Error:', error);
    throw new Error('Failed to fetch people');
  }
}

