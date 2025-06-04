import { json } from '@sveltejs/kit';
import { findPerson } from '$lib/langchain/utils';
import { Person } from '$lib/db/models';

export async function POST({ request }) {
  try {
    const { description } = await request.json();
    
    const people = await Person.findAll({
      include: [
        {
          model: Person,
          as: 'AssociatedPeople',
          through: { attributes: [] }
        }
      ]
    });

    const results = await findPerson(description, people.map(p => p.toJSON()));
    
    return json({ results });
  } catch (error) {
    console.error('Search error:', error);
    return json({ error: 'Failed to perform search' }, { status: 500 });
  }
} 