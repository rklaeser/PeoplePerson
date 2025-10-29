import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { updateMemory, deleteMemory } from '$lib/server/peopleperson-db';

export const PATCH: RequestHandler = async ({ locals, params, request }) => {
	const user = locals.user;

	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { id: personId, memoryId } = params;

	try {
		const data = await request.json();

		if (!data.content) {
			return json({ error: 'Content is required' }, { status: 400 });
		}

		await updateMemory(user.uid, personId, memoryId, {
			content: data.content
		});

		return json({ success: true });
	} catch (error) {
		console.error('Error updating memory:', error);
		return json({ error: 'Failed to update memory' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
	const user = locals.user;

	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { id: personId, memoryId } = params;

	try {
		await deleteMemory(user.uid, personId, memoryId);

		return json({ success: true });
	} catch (error) {
		console.error('Error deleting memory:', error);
		return json({ error: 'Failed to delete memory' }, { status: 500 });
	}
};
