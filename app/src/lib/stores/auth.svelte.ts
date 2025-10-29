import { getClientAuth } from '$lib/firebase';
import {
	signInWithEmailAndPassword,
	createUserWithEmailAndPassword,
	signInWithPopup,
	GoogleAuthProvider,
	signOut as firebaseSignOut,
	onAuthStateChanged,
	type User
} from 'firebase/auth';
import { browser } from '$app/environment';

class AuthStore {
	user = $state<User | null>(null);
	loading = $state(true);
	initialized = false;

	constructor() {
		if (browser) {
			this.initialize();
		}
	}

	initialize() {
		if (this.initialized) return;
		this.initialized = true;

		const auth = getClientAuth();
		onAuthStateChanged(auth, (user) => {
			this.user = user;
			this.loading = false;
		});
	}

	async signIn(email: string, password: string) {
		const auth = getClientAuth();
		try {
			const userCredential = await signInWithEmailAndPassword(auth, email, password);
			return { success: true, user: userCredential.user };
		} catch (error: any) {
			return { success: false, error: error.message };
		}
	}

	async signUp(email: string, password: string) {
		const auth = getClientAuth();
		try {
			const userCredential = await createUserWithEmailAndPassword(auth, email, password);
			return { success: true, user: userCredential.user };
		} catch (error: any) {
			return { success: false, error: error.message };
		}
	}

	async signInWithGoogle() {
		const auth = getClientAuth();
		const provider = new GoogleAuthProvider();
		try {
			const userCredential = await signInWithPopup(auth, provider);
			return { success: true, user: userCredential.user };
		} catch (error: any) {
			return { success: false, error: error.message };
		}
	}

	async signOut() {
		const auth = getClientAuth();
		try {
			await firebaseSignOut(auth);
			return { success: true };
		} catch (error: any) {
			return { success: false, error: error.message };
		}
	}

	async getIdToken(): Promise<string | null> {
		if (!this.user) return null;
		try {
			return await this.user.getIdToken();
		} catch (error) {
			console.error('Error getting ID token:', error);
			return null;
		}
	}
}

export const authStore = new AuthStore();
