import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getUserByFirebaseUid, getOrCreateUser, updateUserGuide } from '$lib/server/peopleperson-db';
import type { GuideType } from '$lib/types';

/**
 * PATCH /api/user/guide
 * Update user's selected guide
 */
export const PATCH: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { guideType } = await request.json();

		// Validate guide type
		if (guideType !== 'Scout' && guideType !== 'Nico' && guideType !== null) {
			return json({ error: 'Invalid guide type. Must be "Scout", "Nico", or null' }, { status: 400 });
		}

		// Get or create user (in case this is their first action after signup)
		const user = await getOrCreateUser(
			locals.user.uid,
			locals.user.email || null,
			guideType as GuideType | null
		);

		// Update guide if user already existed
		if (user.selectedGuide !== guideType) {
			await updateUserGuide(user.id, guideType as GuideType | null);
		}

		return json({ success: true, selectedGuide: guideType });
	} catch (error) {
		console.error('Error updating guide:', error);
		return json({ error: 'Failed to update guide' }, { status: 500 });
	}
};
