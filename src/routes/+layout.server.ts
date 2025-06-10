import { Person, Group } from '$lib/db/models';
import { fail } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

interface RawPerson {
  id: string;
  name: string;
  intent: string;
  Groups?: Array<{
    id: string;
    name: string;
  }>;
}

export const load: LayoutServerLoad = async (event) => {
  // Skip auth for demo routes
  if (event.url.pathname.startsWith('/demo')) {
    return { people: [], session: null };
  }
  
  // Check for Auth.js session
  let session = null;
  if (event.locals.auth) {
    try {
      session = await event.locals.auth();
    } catch (e) {
      // Auth.js not available, continue with no session
    }
  }
  
  // If no session, return empty data
  if (!session?.user?.id) {
    return { people: [], session: null };
  }
  
  try {
    // Use Sequelize to query the database with associations, filtered by userId
    const people = await Person.findAll({
      where: {
        userId: session.user.id
      },
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
      group_id: person.Groups?.[0]?.id,
      group_name: person.Groups?.[0]?.name
    }));

    return { 
      people: result,
      session
    };
  } catch (error) {
    console.error('API GET Error:', error);
    throw new Error('Failed to fetch people');
  }
}

