import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PersonExtractor } from '$lib/server/ai/extractor';
import { PersonManager } from '$lib/server/ai/person-manager';
import type { ExtractionResponse } from '$lib/server/ai/types';

/**
 * POST /api/ai/extract-people
 * Extract people, tags, or memories from natural language narrative
 */
export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { narrative } = await request.json();

		if (!narrative || typeof narrative !== 'string') {
			return json({ error: 'narrative is required' }, { status: 400 });
		}

		const extractor = new PersonExtractor();
		const manager = new PersonManager(locals.user.uid);

		// Step 1: Detect intent
		const intentAnalysis = await extractor.detectIntent(narrative);

		const response: ExtractionResponse = {
			intent: intentAnalysis.intent
		};

		// Step 2: Handle based on intent
		switch (intentAnalysis.intent) {
			case 'create':
				// Extract people from narrative
				const extractions = await extractor.extract(narrative);

				// For each extracted person, check for duplicates
				const createdPeople = [];
				for (const extraction of extractions) {
					// Try to create the person
					try {
						const person = await manager.createPerson(extraction);
						createdPeople.push(person);
					} catch (error) {
						console.error(`Error creating person ${extraction.name}:`, error);
					}
				}

				response.message = `Created ${createdPeople.length} contact(s)`;
				response.people = extractions;
				response.created_persons = createdPeople;
				break;

			case 'update_tag':
				// Extract tag assignments
				const tagAssignments = await extractor.extractTagAssignments(narrative);

				// Match people names to existing people
				const tagMatches = [];
				for (const assignment of tagAssignments) {
					const match = await manager.matchTagAssignment(
						assignment.people_names,
						assignment.tag_name,
						assignment.operation
					);
					tagMatches.push(match);
				}

				response.message = 'Tag assignments extracted. Please confirm.';
				response.tag_assignments = tagMatches;
				break;

			case 'update_memory':
				// Extract memory entries
				const memoryEntries = await extractor.extractMemoryEntries(narrative);

				// Match person names to existing people
				const memoryMatches = [];
				for (const entry of memoryEntries) {
					const match = await manager.matchMemoryUpdate(
						entry.person_name,
						entry.entry_content,
						entry.date
					);
					memoryMatches.push(match);
				}

				response.message = 'Memory entries extracted. Please confirm.';
				response.memory_updates = memoryMatches;
				break;

			case 'read':
				response.message = "I can help you view contacts, but I need more specific information. Try asking 'Show me all contacts' or 'Find Tom'.";
				break;

			case 'update':
				response.message = "I can help you update contacts. Please specify what you'd like to change.";
				break;

			case 'none':
			default:
				response.message = "I'm here to help you manage your contacts. You can:\n- Add new contacts: 'I met Sarah at the conference'\n- Add tags: 'Add Tom to the Work tag'\n- Add memories: 'I saw Michael today. He went for a run'";
				break;
		}

		return json(response);
	} catch (error: any) {
		console.error('Error in extract-people:', error);

		// Check for Gemini API key error
		if (error.message?.includes('GEMINI_API_KEY')) {
			return json({
				error: 'AI service not configured. Please add your Gemini API key to use this feature.'
			}, { status: 503 });
		}

		return json({ error: 'Failed to process narrative' }, { status: 500 });
	}
};
