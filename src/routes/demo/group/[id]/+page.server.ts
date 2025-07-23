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

export const actions = {
	create: async ({ request }) => {
		const data = await request.formData();
		const name = data.get('name') as string;
		const group_id = data.get('groupId') as string;

		console.log('🎭 Demo: Would create person in group:', { name, group_id });
		return { success: true };
	},

	removeMember: async ({ request }) => {
		const data = await request.formData();
		const personId = data.get('personId') as string;
		const groupId = data.get('groupId') as string;

		console.log('🎭 Demo: Would remove person from group:', { personId, groupId });
		return { success: true };
	},

	addMember: async ({ request }) => {
		const data = await request.formData();
		const personId = data.get('personId') as string;
		const groupId = data.get('groupId') as string;

		console.log('🎭 Demo: Would add person to group:', { personId, groupId });
		return { success: true };
	}
};
