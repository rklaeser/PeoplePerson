import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies, locals, request }) => {
	console.log('Custom logout page - clearing session');

	// Log all cookies to see what we're working with
	const cookieHeader = request.headers.get('cookie');
	console.log('All cookies:', cookieHeader);

	// Clear Auth.js session cookies manually with different variations
	cookies.delete('authjs.session-token', { path: '/' });

	console.log('Session cookies cleared, redirecting to signin');
	throw redirect(303, '/signin');
};
