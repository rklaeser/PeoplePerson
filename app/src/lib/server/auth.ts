import { getAuth } from 'firebase-admin/auth';
import { initializeFirebase } from './firebase';
import type { RequestEvent } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { AUTHORIZED_EMAILS } from '$env/static/private';

// Parse authorized emails from environment variable
const authorizedEmailsList = AUTHORIZED_EMAILS.split(',').map((email) => email.trim());

/**
 * Verify Firebase ID token from request headers
 * Returns the decoded token if valid, null otherwise
 */
export async function verifyAuthToken(request: Request) {
	// Get token from Authorization header
	const authHeader = request.headers.get('Authorization');

	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return null;
	}

	const token = authHeader.substring(7); // Remove 'Bearer ' prefix

	try {
		// Initialize Firebase Admin if needed
		initializeFirebase();

		// Verify the token
		const auth = getAuth();
		const decodedToken = await auth.verifyIdToken(token);

		// Check if email is in whitelist
		if (decodedToken.email && authorizedEmailsList.includes(decodedToken.email)) {
			return decodedToken;
		}

		console.warn('Unauthorized email attempted access:', decodedToken.email);
		return null;
	} catch (error) {
		console.error('Error verifying auth token:', error);
		return null;
	}
}

/**
 * Middleware function to protect API routes
 * Call this at the start of your API route handlers
 */
export async function requireAuth(event: RequestEvent) {
	const decodedToken = await verifyAuthToken(event.request);

	if (!decodedToken) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	return decodedToken;
}
