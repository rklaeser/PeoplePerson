import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getUserByFirebaseUid } from '$lib/server/peopleperson-db';

/**
 * GET /api/user/check
 * Check if a Firestore user exists (does NOT auto-create)
 */
export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const user = await getUserByFirebaseUid(locals.user.uid);

		return json({
			exists: !!user,
			user: user
				? {
						id: user.id,
						email: user.email,
						selectedGuide: user.selectedGuide
				  }
				: null
		});
	} catch (error) {
		console.error('Error checking user:', error);
		return json({ error: 'Failed to check user' }, { status: 500 });
	}
};
