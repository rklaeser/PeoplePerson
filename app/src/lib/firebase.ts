import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import {
	PUBLIC_FIREBASE_API_KEY,
	PUBLIC_FIREBASE_AUTH_DOMAIN,
	PUBLIC_FIREBASE_PROJECT_ID
} from '$env/static/public';

let app: FirebaseApp;
let auth: Auth;

/**
 * Initialize Firebase client SDK
 * Uses singleton pattern to avoid re-initializing
 */
export function initializeFirebaseClient(): Auth {
	if (auth) {
		return auth;
	}

	const firebaseConfig = {
		apiKey: PUBLIC_FIREBASE_API_KEY,
		authDomain: PUBLIC_FIREBASE_AUTH_DOMAIN,
		projectId: PUBLIC_FIREBASE_PROJECT_ID
	};

	app = initializeApp(firebaseConfig);
	auth = getAuth(app);

	return auth;
}

/**
 * Get Auth instance
 */
export function getClientAuth(): Auth {
	if (!auth) {
		return initializeFirebaseClient();
	}
	return auth;
}
