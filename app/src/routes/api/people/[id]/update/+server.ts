import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { updatePerson, getPerson } from '$lib/server/peopleperson-db';
import { geocodeAddress, shouldGeocode } from '$lib/server/geocoding';

export const PATCH: RequestHandler = async ({ locals, params, request }) => {
	const user = locals.user;

	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { id } = params;

	try {
		const updates = await request.json();

		// Automatically geocode if address fields are provided and coordinates aren't
		if (shouldGeocode(updates)) {
			// Fetch existing person data to get complete address
			const existingPerson = await getPerson(user.uid, id);

			// Merge existing address with updates to get complete address
			const completeAddress = {
				streetAddress: updates.streetAddress ?? existingPerson.streetAddress,
				city: updates.city ?? existingPerson.city,
				state: updates.state ?? existingPerson.state,
				zip: updates.zip ?? existingPerson.zip
			};

			console.log('Attempting to geocode address for person:', id);
			const geocodeResult = await geocodeAddress(completeAddress);

			if (geocodeResult) {
				updates.latitude = geocodeResult.latitude;
				updates.longitude = geocodeResult.longitude;
				console.log('Successfully geocoded address:', geocodeResult);
			} else {
				console.log('Geocoding failed, saving without coordinates');
			}
		}

		// Update the person
		await updatePerson(user.uid, id, updates);

		return json({ success: true });
	} catch (error) {
		console.error('Error updating person:', error);
		return json({ error: 'Failed to update person' }, { status: 500 });
	}
};
