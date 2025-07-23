import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import {
	apiClient,
	transformPersonToFriend,
	isAuthError,
	isNotFoundError
} from '$lib/utils/apiClient';

export const load: PageServerLoad = async ({ params }) => {
	// No server-side authentication - will be handled client-side like main page
	// Data will be fetched client-side with proper auth headers
	
	return {
		id: params.id,
		friend: null, // Will be loaded client-side
		associates: [],
		history: [],
		groupData: []
	};
};

export const actions = {
	updateBody: async ({ request, locals }) => {
		// Check for Firebase session
		const session = locals.session;

		if (!session?.token) {
			return fail(401, { error: 'Unauthorized' });
		}

		const data = await request.formData();
		const id = data.get('id') as string;
		const content = data.get('content') as string;

		console.log('🚀 Updating content:', { id, content });

		try {
			const response = await apiClient.updatePerson(id, { body: content });

			if (response.error) {
				if (isAuthError(response.status)) {
					return fail(401, { error: 'Unauthorized' });
				}
				return fail(500, { error: response.error });
			}

			return { success: true };
		} catch (error) {
			console.error('Update Body Error:', error);
			return fail(500, { error: 'Failed to update content' });
		}
	},

	updateBirthday: async ({ request, locals }) => {
		// Check for Firebase session
		const session = locals.session;

		if (!session?.token) {
			return fail(401, { error: 'Unauthorized' });
		}

		const data = await request.formData();
		const id = data.get('id') as string;
		const birthday = data.get('birthday') as string;

		console.log('🚀 Updating birthday:', { id, birthday });

		try {
			const response = await apiClient.updatePerson(id, { birthday: birthday || null });

			if (response.error) {
				if (isAuthError(response.status)) {
					return fail(401, { error: 'Unauthorized' });
				}
				return fail(500, { error: response.error });
			}

			return { success: true };
		} catch (error) {
			console.error('Update Birthday Error:', error);
			return fail(500, { error: 'Failed to update birthday' });
		}
	},

	updateMnemonic: async ({ request, locals }) => {
		// Check for Firebase session
		const session = locals.session;

		if (!session?.token) {
			return fail(401, { error: 'Unauthorized' });
		}

		const data = await request.formData();
		const id = data.get('id') as string;
		const mnemonic = data.get('mnemonic') as string;

		console.log('🚀 Updating mnemonic:', { id, mnemonic });

		try {
			const response = await apiClient.updatePerson(id, { mnemonic: mnemonic || null });

			if (response.error) {
				if (isAuthError(response.status)) {
					return fail(401, { error: 'Unauthorized' });
				}
				return fail(500, { error: response.error });
			}

			return { success: true };
		} catch (error) {
			console.error('Update Mnemonic Error:', error);
			return fail(500, { error: 'Failed to update mnemonic' });
		}
	},

	create: async ({ request, locals }) => {
		// Check for Firebase session
		const session = locals.session;

		if (!session?.token) {
			return fail(401, { error: 'Unauthorized' });
		}

		const data = await request.formData();
		const name = data.get('name');

		if (!name || typeof name !== 'string') {
			console.error('Invalid name:', name);
			return fail(400, { error: 'Invalid name' });
		}

		try {
			const response = await apiClient.createPerson({
				name,
				body: 'Add a description',
				intent: 'new'
			});

			if (response.error) {
				if (isAuthError(response.status)) {
					return fail(401, { error: 'Unauthorized' });
				}
				return fail(500, { error: response.error });
			}

			return { success: true, id: response.data?.id };
		} catch (error) {
			console.error('Create Person Error:', error);
			return fail(500, { error: 'Failed to add person' });
		}
	},

	delete: async ({ request, locals }) => {
		// Check for Firebase session
		const session = locals.session;

		if (!session?.token) {
			return fail(401, { error: 'Unauthorized' });
		}

		console.log('🚀 Deleting person: server');
		const data = await request.formData();
		const id = data.get('id') as string;
		const name = data.get('name') as string;

		console.log('🚀 Deleting person:', { id, name });

		try {
			const response = await apiClient.deletePerson(id);

			if (response.error) {
				if (isAuthError(response.status)) {
					return fail(401, { error: 'Unauthorized' });
				}
				if (response.status === 501) {
					return fail(501, { error: 'Delete functionality not yet implemented in API' });
				}
				return fail(500, { error: response.error });
			}

			return { success: true };
		} catch (error) {
			console.error('Delete Person Error:', error);
			return fail(500, { error: 'Failed to delete person' });
		}
	},

	// Note: createAssociation functionality is not available in current FastAPI endpoints
	// This would need to be implemented in the API first
	createAssociation: async ({ request, locals }) => {
		// Check for Firebase session
		const session = locals.session;

		if (!session?.token) {
			return fail(401, { error: 'Unauthorized' });
		}

		// For now, return not implemented since this endpoint doesn't exist in FastAPI
		return fail(501, { error: 'Association functionality not yet implemented in API' });

		// TODO: Implement when FastAPI has association endpoints
		// const data = await request.formData();
		// const primaryId = data.get('id') as string;
		// const associateName = data.get('associate') as string;
		//
		// console.log('🚀 Creating association:', { primaryId, associateName });
		//
		// try {
		//     const response = await apiClient.createAssociation(primaryId, associateName);
		//     // handle response...
		// } catch (error) {
		//     console.error('Create Association Error:', error);
		//     return fail(500, { error: 'Failed to create association' });
		// }
	}
};
