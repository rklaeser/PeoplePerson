import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PersonManager, parseRelativeDate } from '$lib/server/ai/person-manager';

/**
 * POST /api/ai/confirm-memory
 * Confirm memory entry for a person
 */
export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { person_id, content, date } = await request.json();

		if (!person_id || !content) {
			return json({ error: 'person_id and content are required' }, { status: 400 });
		}

		const manager = new PersonManager(locals.user.uid);
		const parsedDate = parseRelativeDate(date);

		const entry = await manager.addJournalEntry(person_id, content, parsedDate);

		return json({
			message: 'Memory entry added successfully',
			entry
		});
	} catch (error: any) {
		console.error('Error in confirm-memory:', error);
		return json({ error: error.message || 'Failed to add memory entry' }, { status: 500 });
	}
};
