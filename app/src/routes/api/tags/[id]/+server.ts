import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getTag, updateTag, deleteTag } from '$lib/server/peopleperson-db';

export const GET: RequestHandler = async ({ locals, params }) => {
	const user = locals.user;

	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { id } = params;

	try {
		const tag = await getTag(user.uid, id);

		if (!tag) {
			return json({ error: 'Tag not found' }, { status: 404 });
		}

		return json(tag);
	} catch (error) {
		console.error('Error fetching tag:', error);
		return json({ error: 'Failed to fetch tag' }, { status: 500 });
	}
};

export const PATCH: RequestHandler = async ({ locals, params, request }) => {
	const user = locals.user;

	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { id } = params;

	try {
		const updates = await request.json();

		// Update the tag
		await updateTag(user.uid, id, updates);

		return json({ success: true });
	} catch (error) {
		console.error('Error updating tag:', error);
		return json({ error: 'Failed to update tag' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
	const user = locals.user;

	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { id } = params;

	try {
		// Delete the tag (will also remove from all people)
		await deleteTag(user.uid, id);

		return json({ success: true });
	} catch (error) {
		console.error('Error deleting tag:', error);
		return json({ error: 'Failed to delete tag' }, { status: 500 });
	}
};
