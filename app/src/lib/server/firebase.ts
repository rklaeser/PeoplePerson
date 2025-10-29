import { initializeApp, getApps, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { FIREBASE_PROJECT_ID } from '$env/static/private';

let app: App;
let db: Firestore;

/**
 * Initialize Firebase Admin SDK
 * Uses Application Default Credentials (gcloud auth application-default login)
 * Singleton pattern to avoid re-initializing
 */
export function initializeFirebase(): Firestore {
	if (db) {
		return db;
	}

	// Check if already initialized
	if (getApps().length === 0) {
		// Using Application Default Credentials - no need for service account key
		app = initializeApp({
			projectId: FIREBASE_PROJECT_ID
		});
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
