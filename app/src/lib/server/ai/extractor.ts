/**
 * Entity extraction and person management for NLP-powered contact creation
 */
import { GeminiClient } from './gemini-client';
import {
	INTENT_DETECTION_PROMPT,
	ENTITY_EXTRACTION_PROMPT,
	TAG_ASSIGNMENT_EXTRACTION_PROMPT,
	JOURNAL_ENTRY_EXTRACTION_PROMPT
} from './prompts';
import {
	IntentAnalysisSchema,
	PersonExtractionSchema,
	TagAssignmentSchema,
	MemoryUpdateSchema,
	type IntentAnalysis,
	type PersonExtraction,
	type TagAssignment,
	type MemoryUpdate
} from './types';

export class PersonExtractor {
	private client: GeminiClient;

	constructor() {
		this.client = new GeminiClient();
	}

	/**
	 * Detect the intent of the user's message
	 */
	async detectIntent(narrative: string): Promise<IntentAnalysis> {
		const prompt = INTENT_DETECTION_PROMPT.replace('{user_message}', narrative);
		const result = await this.client.generateStructured<IntentAnalysis>(
			prompt,
			IntentAnalysisSchema
		);

		// Ensure is_create_request is computed if not present
		if (result.is_create_request === undefined) {
			result.is_create_request = result.intent === 'create';
		}

		return result;
	}

	/**
	 * Extract people from narrative text
	 */
	async extract(narrative: string): Promise<PersonExtraction[]> {
		const prompt = ENTITY_EXTRACTION_PROMPT.replace('{narrative}', narrative);
		const result = await this.client.generateStructured<{ people: PersonExtraction[] }>(
			prompt,
			PersonExtractionSchema
		);

		return result.people || [];
	}

	/**
	 * Extract tag assignment operations from text
	 */
	async extractTagAssignments(narrative: string): Promise<TagAssignment[]> {
		const prompt = TAG_ASSIGNMENT_EXTRACTION_PROMPT.replace('{narrative}', narrative);
		const result = await this.client.generateStructured<{ assignments: TagAssignment[] }>(
			prompt,
			TagAssignmentSchema
		);

		return result.assignments || [];
	}

	/**
	 * Extract memory entries about existing people
	 */
	async extractMemoryEntries(narrative: string): Promise<MemoryUpdate[]> {
		const prompt = JOURNAL_ENTRY_EXTRACTION_PROMPT.replace('{narrative}', narrative);
		const result = await this.client.generateStructured<{ entries: MemoryUpdate[] }>(
			prompt,
			MemoryUpdateSchema
		);

		return result.entries || [];
	}
}
