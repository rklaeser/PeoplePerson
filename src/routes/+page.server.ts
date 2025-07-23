import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { apiClient, isAuthError } from '$lib/utils/apiClient';

export const load: PageServerLoad = async ({ locals }) => {
	// No server-side data loading needed since we're using Firebase auth
	// Data will be fetched client-side with proper auth headers
	return {
		people: [],
		groups: []
	};
};

export const actions = {
	create: async ({ request, locals }) => {
		// Check for Firebase session
		const session = locals.session;

		if (!session?.token) {
			return fail(401, { error: 'Unauthorized' });
		}

		const data = await request.formData();
		const name = data.get('name') as string;
		
		try {
			const response = await apiClient.createPerson({
				name: name,
				body: 'Add a description',
				intent: 'new'
			});

			if (response.error) {
				if (isAuthError(response.status)) {
					return fail(401, { error: 'Unauthorized' });
				}
				return fail(500, { error: response.error });
			}

			console.log('🚀 Person added:', name);
			return { id: response.data?.id };
		} catch (error) {
			console.error('API POST Error:', error);
			return fail(500, { error: 'Failed to add person' });
		}
	},
	
	delete: async ({ request, locals }) => {
		// Check for Firebase session
		const session = locals.session;

		if (!session?.token) {
			return fail(401, { error: 'Unauthorized' });
		}

		const data = await request.formData();
		const id = data.get('id') as string;
		const name = data.get('name') as string;
		
		try {
			const response = await apiClient.deletePerson(id);

			if (response.error) {
				if (isAuthError(response.status)) {
					return fail(401, { error: 'Unauthorized' });
				}
				return fail(500, { error: response.error });
			}

			console.log('🚀 Person deleted:', name);
		} catch (error) {
			console.error('API DELETE Error:', error);
			return fail(500, { error: 'Failed to delete person' });
		}
	}
};
