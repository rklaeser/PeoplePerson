import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PersonManager } from '$lib/server/ai/person-manager';
import type { PersonExtraction } from '$lib/server/ai/types';

/**
 * POST /api/ai/confirm-person
 * Confirm creation of a new person or link to existing
 */
export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { extraction, action, existing_id } = await request.json();

		if (!extraction || !action) {
			return json({ error: 'extraction and action are required' }, { status: 400 });
		}

		const manager = new PersonManager(locals.user.uid);

		let person;
		if (action === 'create_new') {
			person = await manager.createPerson(extraction as PersonExtraction);
		} else if (action === 'link_existing' && existing_id) {
			person = await manager.linkToExisting(extraction as PersonExtraction, existing_id);
		} else {
			return json({ error: 'Invalid action or missing existing_id' }, { status: 400 });
		}

		return json({
			message: action === 'create_new' ? 'Person created successfully' : 'Updated existing person',
			person
		});
	} catch (error: any) {
		console.error('Error in confirm-person:', error);
		return json({ error: error.message || 'Failed to confirm person' }, { status: 500 });
	}
};
