import { initializeApp, getApps, type App, cert } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { FIREBASE_PROJECT_ID, FIREBASE_SERVICE_ACCOUNT_KEY } from '$env/static/private';

let app: App;
let db: Firestore;

/**
 * Initialize Firebase Admin SDK
 * Supports both Application Default Credentials (local dev) and service account key (Vercel)
 * Singleton pattern to avoid re-initializing
 */
export function initializeFirebase(): Firestore {
	if (db) {
		return db;
	}

	// Check if already initialized
	if (getApps().length === 0) {
		// Try to use service account key first (for Vercel), then fall back to ADC (for local dev)
		if (FIREBASE_SERVICE_ACCOUNT_KEY) {
			try {
				const serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT_KEY);
				app = initializeApp({
					credential: cert(serviceAccount),
					projectId: FIREBASE_PROJECT_ID
				});
			} catch (error) {
				console.error('Failed to parse service account key:', error);
				throw new Error('Invalid Firebase service account key');
			}
		} else {
			// Using Application Default Credentials for local development
			app = initializeApp({
				projectId: FIREBASE_PROJECT_ID
			});
		}
	} else {
		app = getApps()[0];
	}

	db = getFirestore(app);
	return db;
}

/**
 * Get Firestore instance
 */
export function getDB(): Firestore {
	if (!db) {
		return initializeFirebase();
	}
	return db;
}
