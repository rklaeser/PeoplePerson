import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { deletePerson } from '$lib/server/peopleperson-db';

export const DELETE: RequestHandler = async ({ locals, params }) => {
	const user = locals.user;

	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { id } = params;

	try {
		// Delete the person and all subcollections
		await deletePerson(user.uid, id);

		return json({ success: true });
	} catch (error) {
		console.error('Error deleting person:', error);
		return json({ error: 'Failed to delete person' }, { status: 500 });
	}
};
