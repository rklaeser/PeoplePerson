import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	getJournalEntry,
	updateJournalEntry,
	deleteJournalEntry
} from '$lib/server/peopleperson-db';

export const GET: RequestHandler = async ({ locals, params }) => {
	const user = locals.user;

	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const entry = await getJournalEntry(user.uid, params.id);

		if (!entry) {
			return json({ error: 'Journal entry not found' }, { status: 404 });
		}

		return json(entry);
	} catch (error) {
		console.error('Error fetching journal entry:', error);
		return json({ error: 'Failed to fetch journal entry' }, { status: 500 });
	}
};

export const PATCH: RequestHandler = async ({ locals, params, request }) => {
	const user = locals.user;

	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const data = await request.json();

		// Validate entry exists
		const entry = await getJournalEntry(user.uid, params.id);
		if (!entry) {
			return json({ error: 'Journal entry not found' }, { status: 404 });
		}

		// Update the journal entry
		await updateJournalEntry(user.uid, params.id, data);

		// Return updated entry
		const updatedEntry = await getJournalEntry(user.uid, params.id);
		return json(updatedEntry);
	} catch (error) {
		console.error('Error updating journal entry:', error);
		return json({ error: 'Failed to update journal entry' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
	const user = locals.user;

	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		// Validate entry exists
		const entry = await getJournalEntry(user.uid, params.id);
		if (!entry) {
			return json({ error: 'Journal entry not found' }, { status: 404 });
		}

		// Delete the journal entry
		await deleteJournalEntry(user.uid, params.id);

		return json({ success: true });
	} catch (error) {
		console.error('Error deleting journal entry:', error);
		return json({ error: 'Failed to delete journal entry' }, { status: 500 });
	}
};
