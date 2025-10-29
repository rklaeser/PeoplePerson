import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createPerson, getPeople } from '$lib/server/peopleperson-db';

export const POST: RequestHandler = async ({ locals }) => {
	const user = locals.user;

	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		// Get all existing people to check for name conflicts
		const existingPeople = await getPeople(user.uid);

		// Find a unique name (New Person, New Person 1, New Person 2, etc.)
		let personName = 'New Person';
		const newPersonNames = existingPeople
			.map(p => p.name)
			.filter(name => name === 'New Person' || /^New Person \d+$/.test(name));

		if (newPersonNames.length > 0) {
			// Extract numbers from existing "New Person X" names
			const numbers = newPersonNames
				.map(name => {
					if (name === 'New Person') return 0;
					const match = name.match(/^New Person (\d+)$/);
					return match ? parseInt(match[1]) : 0;
				})
				.sort((a, b) => a - b);

			// Find the next available number
			let nextNum = 1;
			for (const num of numbers) {
				if (num === nextNum - 1 || num === 0) {
					nextNum++;
				}
			}

			personName = `New Person ${nextNum}`;
		}

		// Create the person
		const newPerson = await createPerson(user.uid, {
			name: personName,
			body: 'Add a description'
		});

		return json(newPerson);
	} catch (error) {
		console.error('Error creating person:', error);
		return json({ error: 'Failed to create person' }, { status: 500 });
	}
};
