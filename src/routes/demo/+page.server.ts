import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	try {
		// Call the API with test parameter to get demo data
		const response = await fetch('http://localhost:8000/api/people/?test=1');

		if (!response.ok) {
			throw new Error(`API call failed: ${response.status}`);
		}

		const people = await response.json();

		return {
			people: people,
			groups: [], // TODO: Add groups endpoint call if needed
			isDemo: true
		};
	} catch (error) {
		console.error('Error loading demo data from API:', error);
		// Fallback to empty data if API call fails
		return {
			people: [],
			groups: [],
			isDemo: true
		};
	}
};
