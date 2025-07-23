import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async (event) => {
	// Check Firebase session
	const session = event.locals.session;

	if (session?.token) {
		// User is authenticated, redirect to home page
		throw redirect(303, '/');
	}

	// Not authenticated, show signin page
	return {};
};
