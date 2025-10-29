import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getUserByFirebaseUid } from '$lib/server/peopleperson-db';
import { getDB, initializeFirebase } from '$lib/server/firebase';
import { getAuth } from 'firebase-admin/auth';

/**
 * DELETE /api/user/delete
 * Delete current user and all their data (for testing purposes)
 * WARNING: This deletes both Firestore data AND Firebase Auth user
 */
export const DELETE: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		initializeFirebase();
		const auth = getAuth();
		const user = await getUserByFirebaseUid(locals.user.uid);

		if (!user) {
			return json({ error: 'User not found' }, { status: 404 });
		}

		const db = getDB();

		// Delete all people and their subcollections
		const peopleSnapshot = await db.collection(`users/${user.id}/people`).get();
		for (const personDoc of peopleSnapshot.docs) {
			// Delete memories
			const memoriesSnapshot = await db
				.collection(`users/${user.id}/people/${personDoc.id}/memories`)
				.get();
			for (const memoryDoc of memoriesSnapshot.docs) {
				await memoryDoc.ref.delete();
			}

			// Delete messages
			const messagesSnapshot = await db
				.collection(`users/${user.id}/people/${personDoc.id}/messages`)
				.get();
			for (const messageDoc of messagesSnapshot.docs) {
				await messageDoc.ref.delete();
			}

			// Delete history
			const historySnapshot = await db
				.collection(`users/${user.id}/people/${personDoc.id}/history`)
				.get();
			for (const historyDoc of historySnapshot.docs) {
				await historyDoc.ref.delete();
			}

			// Delete person
			await personDoc.ref.delete();
		}

		// Delete tags
		const tagsSnapshot = await db.collection(`users/${user.id}/tags`).get();
		for (const tagDoc of tagsSnapshot.docs) {
			await tagDoc.ref.delete();
		}

		// Delete entries
		const entriesSnapshot = await db.collection(`users/${user.id}/entries`).get();
		for (const entryDoc of entriesSnapshot.docs) {
			await entryDoc.ref.delete();
		}

		// Delete user document
		await db.doc(`users/${user.id}`).delete();

		// Delete Firebase Auth user (if it exists)
		try {
			await auth.deleteUser(locals.user.uid);
		} catch (authError: any) {
			// If user is already deleted, that's fine
			if (authError.code !== 'auth/user-not-found') {
				throw authError;
			}
			console.log('Firebase Auth user already deleted, continuing...');
		}

		return json({
			success: true,
			message: 'User and all data deleted successfully'
		});
	} catch (error) {
		console.error('Error deleting user:', error);
		return json({ error: 'Failed to delete user' }, { status: 500 });
	}
};
