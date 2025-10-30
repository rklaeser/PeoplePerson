import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getPeople, updatePerson } from '$lib/server/peopleperson-db';
import { geocodeAddress } from '$lib/server/geocoding';

/**
 * Utility endpoint to geocode all people with addresses but no coordinates
 * Useful for backfilling existing data
 */
export const POST: RequestHandler = async ({ locals }) => {
	const user = locals.user;

	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		// Get all people
		const people = await getPeople(user.uid, {});

		// Find people with addresses but no coordinates
		const peopleToGeocode = people.filter(
			(person) =>
				(person.streetAddress || person.city || person.state || person.zip) &&
				(person.latitude === null || person.longitude === null)
		);

		console.log(`Found ${peopleToGeocode.length} people to geocode`);

		const results = {
			total: peopleToGeocode.length,
			success: 0,
			failed: 0,
			errors: [] as string[]
		};

		// Geocode each person (with a small delay to avoid rate limiting)
		for (const person of peopleToGeocode) {
			try {
				const geocodeResult = await geocodeAddress({
					streetAddress: person.streetAddress,
					city: person.city,
					state: person.state,
					zip: person.zip
				});

				if (geocodeResult) {
					await updatePerson(user.uid, person.id, {
						latitude: geocodeResult.latitude,
						longitude: geocodeResult.longitude
					});
					results.success++;
					console.log(`Geocoded ${person.name}: ${geocodeResult.latitude}, ${geocodeResult.longitude}`);
				} else {
					results.failed++;
					results.errors.push(`Failed to geocode ${person.name}`);
				}

				// Small delay to avoid hitting rate limits (OpenStreetMap has a 1 req/sec limit)
				await new Promise((resolve) => setTimeout(resolve, 1100));
			} catch (error) {
				results.failed++;
				results.errors.push(`Error geocoding ${person.name}: ${error}`);
				console.error(`Error geocoding ${person.name}:`, error);
			}
		}

		return json(results);
	} catch (error) {
		console.error('Error geocoding people:', error);
		return json({ error: 'Failed to geocode people' }, { status: 500 });
	}
};
