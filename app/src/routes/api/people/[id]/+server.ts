import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getPerson, getMemories, getMessages } from '$lib/server/peopleperson-db';

export const GET: RequestHandler = async ({ locals, params }) => {
	const user = locals.user;

	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { id } = params;

	try {
		// Fetch person details
		const person = await getPerson(user.uid, id);

		if (!person) {
			return json({ error: 'Person not found' }, { status: 404 });
		}

		// Fetch related data
		const [memories, messages] = await Promise.all([
			getMemories(user.uid, id, { limit: 50 }),
			getMessages(user.uid, id)
		]);

		return json({
			person,
			memories,
			messages
		});
	} catch (error) {
		console.error('Error fetching person:', error);
		return json({ error: 'Failed to fetch person' }, { status: 500 });
	}
};
