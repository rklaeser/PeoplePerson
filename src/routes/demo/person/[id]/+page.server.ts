import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const id = params.id;

	// Demo routes now use client-side store for data
	// Return minimal data structure that will be populated by the store
	return {
		id,
		isDemo: true
	};
};

// Demo actions that don't actually modify anything
export const actions = {
	updateBody: async ({ request }) => {
		const data = await request.formData();
		const id = data.get('id') as string;
		const content = data.get('content') as string;

		console.log('🎭 Demo: Would update body for', id, 'with:', content);
		// In demo mode, we just log and return success
		return { success: true };
	},

	updateBirthday: async ({ request }) => {
		const data = await request.formData();
		const id = data.get('id') as string;
		const birthday = data.get('birthday') as string;

		console.log('🎭 Demo: Would update birthday for', id, 'with:', birthday);
		return { success: true };
	},

	updateMnemonic: async ({ request }) => {
		const data = await request.formData();
		const id = data.get('id') as string;
		const mnemonic = data.get('mnemonic') as string;

		console.log('🎭 Demo: Would update mnemonic for', id, 'with:', mnemonic);
		return { success: true };
	},

	create: async ({ request }) => {
		const data = await request.formData();
		const name = data.get('name');

		console.log('🎭 Demo: Would create person with name:', name);
		return { success: true };
	},

	delete: async ({ request }) => {
		const data = await request.formData();
		const id = data.get('id') as string;
		const name = data.get('name') as string;

		console.log('🎭 Demo: Would delete person:', { id, name });
		return { success: true };
	},

	createAssociation: async ({ request }) => {
		const data = await request.formData();
		const primaryId = data.get('id') as string;
		const associateName = data.get('associate') as string;

		console.log('🎭 Demo: Would create association:', { primaryId, associateName });
		return { success: true };
	},

	deleteAssociation: async ({ request }) => {
		const data = await request.formData();
		const primaryId = data.get('id') as string;
		const associateId = data.get('associate') as string;

		console.log('🎭 Demo: Would delete association:', { primaryId, associateId });
		return { success: true };
	},

	createHistory: async ({ request }) => {
		const data = await request.formData();
		const personId = data.get('id') as string;
		const changeType = data.get('changeType') as string;
		const field = data.get('field') as string;
		const detail = data.get('detail') as string;

		console.log('🎭 Demo: Would create history:', { personId, changeType, field, detail });
		return { success: true };
	},

	addGroup: async ({ request }) => {
		const data = await request.formData();
		const groupName = data.get('name') as string;
		const personId = data.get('id') as string;

		console.log('🎭 Demo: Would add person to group:', { personId, groupName });
		return { success: true };
	},

	removeGroup: async ({ request }) => {
		const data = await request.formData();
		const groupId = data.get('groupId') as string;
		const personId = data.get('id') as string;

		console.log('🎭 Demo: Would remove person from group:', { personId, groupId });
		return { success: true };
	},

	updateStatus: async ({ request }) => {
		const data = await request.formData();
		const id = data.get('id') as string;
		const intent = data.get('intent') as string;

		console.log('🎭 Demo: Would update status:', { id, intent });
		return { success: true };
	}
};
