import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	// No server-side authentication - will be handled client-side like other pages
	// Data will be fetched client-side with proper auth headers
	
	return {
		id: params.id,
		group: null, // Will be loaded client-side
		people: [],
		availablePeople: []
	};
};

export const actions = {
	create: async ({ request, locals }) => {
		// Check for demo session first
		let session = locals.session;

		// Check for Auth.js session if no demo session and auth is available
		if (!session) {
			session = locals.session;
		}

		if (!session?.token) {
			return fail(401, { error: 'Unauthorized' });
		}

		const data = await request.formData();
		const name = data.get('name') as string;
		const group_id = data.get('groupId') as string;
		console.log('🚀 Creating person in group:', { name, group_id });
		try {
			const newFriend = await Person.create({
				name: name,
				intent: 'new',
				userId: null
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

	removeMember: async ({ request, locals }) => {
		// Check for demo session first
		let session = locals.session;

		// Check for Auth.js session if no demo session and auth is available
		if (!session) {
			session = locals.session;
		}

		if (!session?.token) {
			return fail(401, { error: 'Unauthorized' });
		}

		const data = await request.formData();
		const personId = data.get('personId') as string;
		const groupId = data.get('groupId') as string;

		console.log('🚀 Removing person from group:', { personId, groupId });

		try {
			// Find the person and group with ownership check
			const person = await Person.findOne({ where: { id: personId, userId: null } });
			const group = await Group.findOne({ where: { id: groupId, userId: null } });

			if (!person || !group) {
				return fail(404, { error: 'Person or group not found or access denied' });
			}

			// Remove the association between person and group
			await person.removeGroup(group);

			console.log('🚀 Person removed from group successfully');
			return { success: true };
		} catch (error) {
			console.error('Remove member error:', error);
			return fail(500, { error: 'Failed to remove member from group' });
		}
	},

	addMember: async ({ request, locals }) => {
		// Check for demo session first
		let session = locals.session;

		// Check for Auth.js session if no demo session and auth is available
		if (!session) {
			session = locals.session;
		}

		if (!session?.token) {
			return fail(401, { error: 'Unauthorized' });
		}

		const data = await request.formData();
		const personId = data.get('personId') as string;
		const groupId = data.get('groupId') as string;

		console.log('🚀 Adding person to group:', { personId, groupId });

		try {
			// Find the person and group with ownership check
			const person = await Person.findOne({ where: { id: personId, userId: null } });
			const group = await Group.findOne({ where: { id: groupId, userId: null } });

			if (!person || !group) {
				return fail(404, { error: 'Person or group not found or access denied' });
			}

			// Add the association between person and group
			await person.addGroup(group);

			console.log('🚀 Person added to group successfully');
			return { success: true };
		} catch (error) {
			console.error('Add member error:', error);
			return fail(500, { error: 'Failed to add member to group' });
		}
	}
};
