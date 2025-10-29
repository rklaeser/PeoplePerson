import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { addTagToPerson, removeTagFromPerson } from '$lib/server/peopleperson-db';

export const POST: RequestHandler = async ({ locals, params, request }) => {
	const user = locals.user;

	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { id: personId } = params;

	try {
		const { tagId } = await request.json();

		if (!tagId) {
			return json({ error: 'Tag ID is required' }, { status: 400 });
		}

		await addTagToPerson(user.uid, personId, tagId);

		return json({ success: true });
	} catch (error) {
		console.error('Error adding tag to person:', error);
		return json({ error: 'Failed to add tag' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ locals, params, request }) => {
	const user = locals.user;

	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { id: personId } = params;

	try {
		const { tagId } = await request.json();

		if (!tagId) {
			return json({ error: 'Tag ID is required' }, { status: 400 });
		}

		await removeTagFromPerson(user.uid, personId, tagId);

		return json({ success: true });
	} catch (error) {
		console.error('Error removing tag from person:', error);
		return json({ error: 'Failed to remove tag' }, { status: 500 });
	}
};
