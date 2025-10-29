import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { upsertMemory } from '$lib/server/peopleperson-db';

export const POST: RequestHandler = async ({ locals, params, request }) => {
	const user = locals.user;

	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { id: personId } = params;

	try {
		const data = await request.json();

		if (!data.entryDate || !data.content) {
			return json({ error: 'Entry date and content are required' }, { status: 400 });
		}

		const memory = await upsertMemory(user.uid, personId, {
			entryDate: data.entryDate,
			content: data.content
		});

		return json(memory);
	} catch (error) {
		console.error('Error creating memory:', error);
		return json({ error: 'Failed to create memory' }, { status: 500 });
	}
};
