import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getUserByFirebaseUid } from '$lib/server/peopleperson-db';

/**
 * GET /api/debug/auth
 * Check current auth state
 */
export const GET: RequestHandler = async ({ locals }) => {
	const authUser = locals.user;

	if (!authUser) {
		return json({
			authenticated: false,
			message: 'Not authenticated - no Firebase Auth user'
		});
	}

	try {
		const firestoreUser = await getUserByFirebaseUid(authUser.uid);

		return json({
			authenticated: true,
			firebaseAuth: {
				uid: authUser.uid,
				email: authUser.email,
				emailVerified: authUser.emailVerified
			},
			firestoreUser: firestoreUser ? {
				id: firestoreUser.id,
				email: firestoreUser.email,
				selectedGuide: firestoreUser.selectedGuide
			} : null,
			message: firestoreUser
				? 'Both Firebase Auth and Firestore user exist'
				: 'Firebase Auth exists but NO Firestore user (deleted or not created yet)'
		});
	} catch (error) {
		return json({
			authenticated: true,
			firebaseAuth: {
				uid: authUser.uid,
				email: authUser.email
			},
			error: 'Error checking Firestore user'
		});
	}
};
