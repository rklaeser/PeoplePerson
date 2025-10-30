import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getPeople } from '$lib/server/peopleperson-db';

interface MapPerson {
	id: string;
	name: string;
	latitude: number;
	longitude: number;
	location_source: string;
}

export const GET: RequestHandler = async ({ locals }) => {
	const user = locals.user;

	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		// Fetch all people from Firestore
		const people = await getPeople(user.uid, {});

		// Filter to only people with coordinates and map to MapPerson format
		const mapData: MapPerson[] = people
			.filter((person) => person.latitude !== null && person.longitude !== null)
			.map((person) => ({
				id: person.id,
				name: person.name,
				latitude: person.latitude!,
				longitude: person.longitude!,
				location_source: 'personal' // For now, always personal. Could enhance to show tag locations
			}));

		return json(mapData);
	} catch (error) {
		console.error('Error fetching map data:', error);
		return json({ error: 'Failed to fetch map data' }, { status: 500 });
	}
};
