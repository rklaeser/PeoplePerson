import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createTag } from '$lib/server/peopleperson-db';

export const POST: RequestHandler = async ({ locals, request }) => {
	const user = locals.user;

	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const data = await request.json();

		if (!data.name || data.name.trim().length === 0) {
			return json({ error: 'Tag name is required' }, { status: 400 });
		}

		const newTag = await createTag(user.uid, {
			name: data.name.trim(),
			category: data.category || 'general',
			color: data.color || null,
			description: data.description || null,
			streetAddress: data.streetAddress || null,
			city: data.city || null,
			state: data.state || null,
			zip: data.zip || null,
			latitude: data.latitude || null,
			longitude: data.longitude || null
		});

		return json(newTag);
	} catch (error) {
		console.error('Error creating tag:', error);
		return json({ error: 'Failed to create tag' }, { status: 500 });
	}
};
