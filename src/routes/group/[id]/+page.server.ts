import type { PageServerLoad } from './$types';
import { Group, Person } from '$lib/db/models';
import type { Friend } from '$lib/types';
import { fail } from '@sveltejs/kit';


export const load: PageServerLoad = async ({ params }) => {
  const id = params.id;
  try {
    // Fetch the group by ID
    const group = await Group.findByPk(id);
    if (!group) {
      throw new Error('Group not found');
    }

    // Fetch people in the group (with all Friend fields)
    const people = await Person.findAll({
      include: [
        {
          model: Group,
          where: { id },
          through: { attributes: [] },
          attributes: []
        }
      ]
    });

    // Map to Friend type
    const friends: Friend[] = people.map(person => ({
      id: person.id,
      name: person.name,
      body: person.body,
      intent: person.intent,
      birthday: person.birthday ? (typeof person.birthday === 'string' ? person.birthday : person.birthday?.toISOString().split('T')[0]) : null,
      mnemonic: person.mnemonic,
      createdAt: person.createdAt?.toISOString?.() ?? '',
      updatedAt: person.updatedAt?.toISOString?.() ?? '',
      group_id: group.id,
      group_name: group.name
    }));

    return { group: { id: group.id, name: group.name }, people: friends };
  } catch (error) {
    console.error('Sequelize group page error:', error);
    return fail(500, { error: 'Failed to fetch group or people' });
  }
};

export const actions = {
    create: async ({ request }) => {
      const data = await request.formData();
      const name = data.get('name') as string;
      const group_id = data.get('groupId') as string;
      console.log('🚀 Creating person in group:', { name, group_id });
        try {
            const newFriend = await Person.create({
            name: name,
            intent: 'new'
          });
          console.log('🚀 Person added:', name);

          let person_id = newFriend.id;
        
        // Add person to group
        await (person_id as any).addGroup(group_id);
        console.log('🚀 Person added to group:', { person_id, group_id });

        } catch (error) {
          console.error('API POST Error:', error);
          return fail(500, { error: 'Failed to add person' });
    }
    },
}