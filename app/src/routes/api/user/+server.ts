import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getUser, getUserByFirebaseUid, getOrCreateUser, updateUser } from '$lib/server/peopleperson-db';

/**
 * GET /api/user
 * Get current user's data (does NOT auto-create, use /api/user/guide for signup)
 */
export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const user = await getUserByFirebaseUid(locals.user.uid);

		if (!user) {
			return json({ error: 'User not found' }, { status: 404 });
		}

		return json(user);
	} catch (error) {
		console.error('Error fetching user:', error);
		return json({ error: 'Failed to fetch user' }, { status: 500 });
	}
};

/**
 * PATCH /api/user
 * Update current user's data
 */
export const PATCH: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const user = await getUserByFirebaseUid(locals.user.uid);

		if (!user) {
			return json({ error: 'User not found' }, { status: 404 });
		}

		const data = await request.json();

		// Validate allowed fields
		const allowedFields = ['name', 'image', 'selectedGuide'];
		const updateData: any = {};

		for (const field of allowedFields) {
			if (field in data) {
				updateData[field] = data[field];
			}
		}

		await updateUser(user.id, updateData);

		return json({ success: true });
	} catch (error) {
		console.error('Error updating user:', error);
		return json({ error: 'Failed to update user' }, { status: 500 });
	}
};
