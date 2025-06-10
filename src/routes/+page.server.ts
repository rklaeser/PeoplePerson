import { Person, Group, History } from '$lib/db/models';
import { fail, redirect } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getPeopleNotAssociates, getGroups } from '$lib/utils/load';

export const load: PageServerLoad = async (event) => {
	// Check for Auth.js session
	let session = null;
	if (event.locals.auth) {
		try {
			session = await event.locals.auth();
		} catch (e) {
			// Auth.js not available, continue with no session
		}
	}
	
	// Redirect to signin if not authenticated
	if (!session?.user?.id) {
		throw redirect(303, '/auth/signin');
	}
	
	try {
		const people = await getPeopleNotAssociates(session.user.id);
		const groups = await getGroups(session.user.id);

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
	create: async ({ request, locals }) => {
		// Check for Auth.js session
		let session = null;
		if (locals.auth) {
			try {
				session = await locals.auth();
			} catch (e) {
				// Auth.js not available
			}
		}
		
		if (!session?.user?.id) {
			return fail(401, { error: 'Unauthorized' });
		}
		
		const data = await request.formData();
		const name = data.get('name') as string;
		try {
			const newPerson = await Person.create({
				name: name,
				intent: 'new',
				userId: session.user.id
			});
			console.log('🚀 Person added:', name);
			return { id: newPerson.id };
		} catch (error) {
			console.error('API POST Error:', error);
			return fail(500, { error: 'Failed to add person' });
		}
	},
	delete: async ({ request, locals }) => {
		// Check for Auth.js session
		let session = null;
		if (locals.auth) {
			try {
				session = await locals.auth();
			} catch (e) {
				// Auth.js not available
			}
		}
		
		if (!session?.user?.id) {
			return fail(401, { error: 'Unauthorized' });
		}

		const data = await request.formData();
		const id = data.get('id') as string;
		const name = data.get('name') as string;
		try {
			// Delete associated records first (with userId filter)
			await History.destroy({ where: { personId: id, userId: session.user.id } });
			
			// Delete the person (ensure ownership)
			await Person.destroy({ where: { id, userId: session.user.id } });
			
			console.log('🚀 Person deleted:', name);
		} catch (error) {
			console.error('API DELETE Error:', error);
			return fail(500, { error: 'Failed to delete person' });
		}
	}
};