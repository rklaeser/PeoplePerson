import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getPeople } from '$lib/server/peopleperson-db';

export const GET: RequestHandler = async ({ locals, url }) => {
	// Get user from session (you'll need to add this to hooks)
	const user = locals.user;

	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		// Get query parameters
		const search = url.searchParams.get('search') || undefined;
		const sortBy = url.searchParams.get('sortBy') as any;
		const sortOrder = url.searchParams.get('sortOrder') as 'asc' | 'desc' | undefined;
		const limit = url.searchParams.get('limit')
			? parseInt(url.searchParams.get('limit')!)
			: undefined;

		// Fetch people from Firestore
		const people = await getPeople(user.uid, {
			search,
			sortBy,
			sortOrder,
			limit
		});

		return json(people);
	} catch (error) {
		console.error('Error fetching people:', error);
		return json({ error: 'Failed to fetch people' }, { status: 500 });
	}
};
