import { Person, Group } from '$lib/db/models';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  try {
    const people = await Person.findAll({
      include: [
        {
          model: Group,
          through: { attributes: [] }
        }
      ]
    });

    const groups = await Group.findAll();

    return {
      people,
      groups
    };
  } catch (error) {
    console.error('Error loading map data:', error);
    return {
      people: [],
      groups: []
    };
  }
}; 