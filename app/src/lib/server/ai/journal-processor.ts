/**
 * Journal entry processing with AI
 */
import { generateContent } from './gemini-client';
import { getJournalProcessingPrompt } from './prompts';
import { getPeople, getUser } from '../peopleperson-db';
import { getGuide } from '$lib/guides';
import type { Person } from '$lib/types';

export interface JournalProcessingResult {
	aiResponse: string; // Markdown formatted response
	peopleIds: string[]; // IDs of people mentioned
	conversationWith: string | null; // personId if conversation plan detected
}

export class JournalProcessor {
	private userId: string;

	constructor(userId: string) {
		this.userId = userId;
	}

	/**
	 * Process a journal entry and generate AI insights
	 */
	async processEntry(content: string): Promise<JournalProcessingResult> {
		// Get user's guide for personality
		const user = await getUser(this.userId);
		const guideType = user?.selectedGuide || 'Nico';
		const guide = getGuide(guideType);

		// Get all people names for context
		const allPeople = await getPeople(this.userId);
		const peopleNames = allPeople.map((p) => p.name);

		// Generate AI response
		const prompt = getJournalProcessingPrompt(content, guide.name, peopleNames);
		const aiResponse = await generateContent(prompt);

		// Extract people mentioned in the entry
		const mentionedPeople = this.extractMentionedPeople(content, allPeople);
		const peopleIds = mentionedPeople.map((p) => p.id);

		// Detect if there's a conversation plan
		const conversationWith = this.detectConversationPlan(aiResponse, mentionedPeople);

		return {
			aiResponse: aiResponse.trim(),
			peopleIds,
			conversationWith
		};
	}

	/**
	 * Extract people mentioned in the journal entry
	 */
	private extractMentionedPeople(content: string, allPeople: Person[]): Person[] {
		const contentLower = content.toLowerCase();
		const mentioned: Person[] = [];

		for (const person of allPeople) {
			const nameLower = person.name.toLowerCase();

			// Check for exact name match or first name match
			if (contentLower.includes(nameLower)) {
				mentioned.push(person);
			} else {
				// Check first name only
				const firstName = person.name.split(' ')[0].toLowerCase();
				// Use word boundaries to avoid partial matches
				const regex = new RegExp(`\\b${firstName}\\b`, 'i');
				if (regex.test(content)) {
					mentioned.push(person);
				}
			}
		}

		return mentioned;
	}

	/**
	 * Detect if the AI response includes a conversation plan and extract the person
	 */
	private detectConversationPlan(aiResponse: string, mentionedPeople: Person[]): string | null {
		// Check if there's a "Conversation Plan with" section
		const conversationPlanRegex = /##\s+Conversation Plan with\s+([^\n]+)/i;
		const match = aiResponse.match(conversationPlanRegex);

		if (!match) {
			return null;
		}

		const personNameInPlan = match[1].trim();

		// Try to match to a person from mentionedPeople
		const matchedPerson = mentionedPeople.find((p) => {
			const nameLower = p.name.toLowerCase();
			const planNameLower = personNameInPlan.toLowerCase();
			return (
				planNameLower.includes(nameLower) ||
				nameLower.includes(planNameLower) ||
				planNameLower.includes(p.name.split(' ')[0].toLowerCase())
			);
		});

		return matchedPerson?.id || null;
	}
}
