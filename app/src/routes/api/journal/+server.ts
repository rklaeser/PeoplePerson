import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getJournalEntries, createJournalEntry } from '$lib/server/peopleperson-db';

export const GET: RequestHandler = async ({ locals, url }) => {
	const user = locals.user;

	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		// Get query parameters
		const personId = url.searchParams.get('personId') || undefined;
		const conversationStatus = url.searchParams.get('conversationStatus') as any;
		const startDate = url.searchParams.get('startDate') || undefined;
		const endDate = url.searchParams.get('endDate') || undefined;
		const sortOrder = url.searchParams.get('sortOrder') as 'asc' | 'desc' | undefined;
		const limit = url.searchParams.get('limit')
			? parseInt(url.searchParams.get('limit')!)
			: undefined;

		// Fetch journal entries from Firestore
		const entries = await getJournalEntries(user.uid, {
			personId,
			conversationStatus,
			startDate,
			endDate,
			sortOrder,
			limit
		});

		return json(entries);
	} catch (error) {
		console.error('Error fetching journal entries:', error);
		return json({ error: 'Failed to fetch journal entries' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ locals, request }) => {
	const user = locals.user;

	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const data = await request.json();

		// Validate required fields
		if (!data.date || !data.content) {
			return json({ error: 'Date and content are required' }, { status: 400 });
		}

		// Create the journal entry
		const newEntry = await createJournalEntry(user.uid, {
			date: data.date,
			content: data.content,
			peopleIds: data.peopleIds || [],
			aiResponse: data.aiResponse || null,
			conversationWith: data.conversationWith || null,
			conversationStatus: data.conversationStatus || null
		});

		return json(newEntry);
	} catch (error) {
		console.error('Error creating journal entry:', error);
		return json({ error: 'Failed to create journal entry' }, { status: 500 });
	}
};
