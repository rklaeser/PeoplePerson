import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies }) => {
	// Clear the Firebase session cookie
	cookies.delete('__session', { path: '/' });

	// Redirect to login page
	throw redirect(302, '/auth/login');
};
