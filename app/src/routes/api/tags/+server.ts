import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getTags } from '$lib/server/peopleperson-db';

export const GET: RequestHandler = async ({ locals, url }) => {
	const user = locals.user;

	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const search = url.searchParams.get('search') || undefined;
		const category = url.searchParams.get('category') || undefined;
		const sortBy = (url.searchParams.get('sortBy') as 'name' | 'createdAt' | undefined) || 'name';
		const sortOrder = (url.searchParams.get('sortOrder') as 'asc' | 'desc' | undefined) || 'asc';
		const limit = url.searchParams.get('limit')
			? parseInt(url.searchParams.get('limit')!)
			: undefined;

		const tags = await getTags(user.uid, {
			search,
			category,
			sortBy,
			sortOrder,
			limit
		});

		return json(tags);
	} catch (error) {
		console.error('Error fetching tags:', error);
		return json({ error: 'Failed to fetch tags' }, { status: 500 });
	}
};
