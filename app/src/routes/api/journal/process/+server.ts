import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { JournalProcessor } from '$lib/server/ai/journal-processor';

export const POST: RequestHandler = async ({ locals, request }) => {
	const user = locals.user;

	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { content } = await request.json();

		if (!content || typeof content !== 'string') {
			return json({ error: 'Content is required' }, { status: 400 });
		}

		// Process the journal entry with AI
		const processor = new JournalProcessor(user.uid);
		const result = await processor.processEntry(content);

		return json(result);
	} catch (error) {
		console.error('Error processing journal entry:', error);
		return json({ error: 'Failed to process journal entry' }, { status: 500 });
	}
};
