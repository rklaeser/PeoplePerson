import { Person, Group, Journal } from '$lib/db/models';
import { fail } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	try {
		const people = await Person.findAll({
			include: [
				{
					model: Group,
					through: { attributes: [] }
				},
				{
					model: Person,
					as: 'AssociatedPeople',
					through: { attributes: [] }
				}
			]
		});

		const groups = await Group.findAll();

		return {
			people: people.map(person => person.toJSON()),
			groups: groups.map(group => group.toJSON())
		};
	} catch (error) {
		console.error('Error loading data:', error);
		return {
			people: [],
			groups: []
		};
	}
};

export const actions = {
	create: async ({ request }) => {
		const data = await request.formData();
		const name = data.get('name') as string;
		try {
			const newPerson = await Person.create({
				name: name,
				intent: 'new'
			});
			console.log('🚀 Person added:', name);
			return { id: newPerson.id };
		} catch (error) {
			console.error('API POST Error:', error);
			return fail(500, { error: 'Failed to add person' });
		}
	},
	delete: async ({ request }) => {
		const data = await request.formData();
		const id = data.get('id') as string;
		const name = data.get('name') as string;
		try {
			// Delete associated records first
			await Journal.destroy({ where: { person_id: id } });
			
			// Delete the person (this will cascade delete associations)
			await Person.destroy({ where: { id } });
			
			console.log('🚀 Person deleted:', name);
		} catch (error) {
			console.error('API DELETE Error:', error);
			return fail(500, { error: 'Failed to delete person' });
		}
	}
};