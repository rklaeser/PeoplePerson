import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { updatePerson } from '$lib/server/peopleperson-db';

export const PATCH: RequestHandler = async ({ locals, params, request }) => {
	const user = locals.user;

	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { id } = params;

	try {
		const updates = await request.json();

		// Update the person
		await updatePerson(user.uid, id, updates);

		return json({ success: true });
	} catch (error) {
		console.error('Error updating person:', error);
		return json({ error: 'Failed to update person' }, { status: 500 });
	}
};
