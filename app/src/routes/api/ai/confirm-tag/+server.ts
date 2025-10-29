import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PersonManager } from '$lib/server/ai/person-manager';

/**
 * POST /api/ai/confirm-tag
 * Confirm tag assignment to people
 */
export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { tag_name, person_ids } = await request.json();

		if (!tag_name || !person_ids || !Array.isArray(person_ids)) {
			return json({ error: 'tag_name and person_ids (array) are required' }, { status: 400 });
		}

		const manager = new PersonManager(locals.user.uid);

		const result = await manager.assignTags(person_ids, tag_name);

		return json({
			message: `Added ${person_ids.length} person(s) to tag "${tag_name}"`,
			tag: result.tag,
			people: result.people
		});
	} catch (error: any) {
		console.error('Error in confirm-tag:', error);
		return json({ error: error.message || 'Failed to assign tag' }, { status: 500 });
	}
};
