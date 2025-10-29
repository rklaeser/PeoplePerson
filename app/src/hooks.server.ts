import type { Handle } from '@sveltejs/kit';
import { initializeFirebase } from '$lib/server/firebase';
import { getAuth } from 'firebase-admin/auth';

export const handle: Handle = async ({ event, resolve }) => {
	// Initialize Firebase
	initializeFirebase();

	// Get Firebase auth token from cookie or Authorization header
	const sessionCookie = event.cookies.get('session');
	const authHeader = event.request.headers.get('Authorization');
	const token = sessionCookie || authHeader?.replace('Bearer ', '');

	if (token) {
		try {
			// Verify the token with Firebase Admin
			const auth = getAuth();
			const decodedToken = await auth.verifyIdToken(token);

			// Add user to locals
			event.locals.user = {
				uid: decodedToken.uid,
				email: decodedToken.email,
				emailVerified: decodedToken.email_verified
			};
		} catch (error) {
			// Token invalid or expired
			console.error('Failed to verify token:', error);
			event.locals.user = null;
		}
	} else {
		event.locals.user = null;
	}

	return resolve(event);
};
