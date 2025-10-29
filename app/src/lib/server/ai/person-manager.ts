/**
 * Person management for AI-powered contact creation
 */
import {
	getPeople,
	createPerson,
	updatePerson,
	upsertMemory,
	getTags,
	createTag,
	addTagToPerson,
	type Person,
	type NotebookEntry
} from '$lib/server/peopleperson-db';
import type {
	PersonExtraction,
	PersonMatchResult,
	PersonMatch,
	TagAssignmentMatch,
	MemoryUpdateMatch
} from './types';

export class PersonManager {
	private userId: string;

	constructor(userId: string) {
		this.userId = userId;
	}

	/**
	 * Find people by name using case-insensitive matching
	 */
	async findByName(name: string): Promise<Person[]> {
		const allPeople = await getPeople(this.userId);
		const nameLower = name.toLowerCase().trim();

		// Categorize matches
		const exactMatches: Person[] = [];
		const startsWithMatches: Person[] = [];
		const containsMatches: Person[] = [];

		for (const person of allPeople) {
			const personNameLower = person.name.toLowerCase();

			if (personNameLower === nameLower) {
				exactMatches.push(person);
			} else if (personNameLower.startsWith(nameLower)) {
				startsWithMatches.push(person);
			} else if (personNameLower.includes(nameLower)) {
				containsMatches.push(person);
			}
		}

		// Return matches in priority order
		return [...exactMatches, ...startsWithMatches, ...containsMatches];
	}

	/**
	 * Match extracted name to existing people
	 */
	async matchPerson(name: string): Promise<PersonMatchResult> {
		const people = await this.findByName(name);

		if (people.length === 0) {
			return {
				extracted_name: name,
				matches: [],
				is_ambiguous: false
			};
		}

		// Convert to PersonMatch objects
		const matches: PersonMatch[] = people.map((person) => ({
			person_id: person.id,
			person_name: person.name,
			similarity: person.name.toLowerCase() === name.toLowerCase() ? 1.0 : 0.8
		}));

		return {
			extracted_name: name,
			matches,
			is_ambiguous: matches.length > 1
		};
	}

	/**
	 * Create a new person from extraction
	 */
	async createPerson(extraction: PersonExtraction): Promise<Person> {
		// Create person
		const person = await createPerson(this.userId, {
			name: extraction.name,
			body: '', // Deprecated
			email: extraction.email || undefined,
			phoneNumber: extraction.phone_number || undefined
		});

		// Create initial memory entry if attributes exist
		if (extraction.attributes) {
			const today = new Date().toISOString().split('T')[0];
			await upsertMemory(this.userId, person.id, {
				entryDate: today,
				content: extraction.attributes
			});
		}

		return person;
	}

	/**
	 * Link extraction to existing person by appending to today's memory
	 */
	async linkToExisting(extraction: PersonExtraction, existingId: string): Promise<Person> {
		const people = await getPeople(this.userId);
		const person = people.find((p) => p.id === existingId);

		if (!person) {
			throw new Error(`Person with id ${existingId} not found`);
		}

		// Update phone if provided and not already set
		if (extraction.phone_number && !person.phoneNumber) {
			await updatePerson(this.userId, existingId, { phoneNumber: extraction.phone_number });
		}

		// Append to today's memory entry
		if (extraction.attributes) {
			const today = new Date().toISOString().split('T')[0];
			// upsertMemory will append to existing content
			await upsertMemory(this.userId, existingId, {
				entryDate: today,
				content: extraction.attributes
			});
		}

		// Fetch updated person
		const updatedPeople = await getPeople(this.userId);
		const updatedPerson = updatedPeople.find((p) => p.id === existingId);

		return updatedPerson!;
	}

	/**
	 * Assign tag to multiple people (creates tag if doesn't exist)
	 */
	async assignTags(
		personIds: string[],
		tagName: string
	): Promise<{ tag: any; people: Person[] }> {
		// Get or create tag (search by name)
		const tags = await getTags(this.userId, { search: tagName });
		let tag = tags.find((t) => t.name.toLowerCase() === tagName.toLowerCase());

		if (!tag) {
			tag = await createTag(this.userId, {
				name: tagName,
				category: 'general'
			});
		}

		// Assign tag to each person
		const updatedPeople: Person[] = [];
		for (const personId of personIds) {
			await addTagToPerson(this.userId, personId, tag.id);

			const people = await getPeople(this.userId);
			const person = people.find((p) => p.id === personId);
			if (person) {
				updatedPeople.push(person);
			}
		}

		return { tag, people: updatedPeople };
	}

	/**
	 * Add journal entry for a person on a specific date
	 */
	async addJournalEntry(personId: string, content: string, date: string): Promise<NotebookEntry> {
		// Upsert memory entry (will merge with existing content)
		const memory = await upsertMemory(this.userId, personId, {
			entryDate: date,
			content: content
		});

		// Update last contact date if entry is for today
		const today = new Date().toISOString().split('T')[0];
		if (date === today) {
			await updatePerson(this.userId, personId, { lastContactDate: new Date() });
		}

		return memory;
	}

	/**
	 * Match tag assignment to existing people
	 */
	async matchTagAssignment(peopleNames: string[], tagName: string, operation: string): Promise<TagAssignmentMatch> {
		const matchedPeople: PersonMatchResult[] = [];

		for (const name of peopleNames) {
			const matchResult = await this.matchPerson(name);
			matchedPeople.push(matchResult);
		}

		return {
			tag_name: tagName,
			operation,
			matched_people: matchedPeople
		};
	}

	/**
	 * Match memory update to existing person
	 */
	async matchMemoryUpdate(
		personName: string,
		entryContent: string,
		date?: string
	): Promise<MemoryUpdateMatch> {
		const matchResult = await this.matchPerson(personName);
		const parsedDate = parseRelativeDate(date);

		return {
			matched_person: matchResult,
			entry_content: entryContent,
			parsed_date: parsedDate
		};
	}
}

/**
 * Parse relative dates to ISO format
 */
export function parseRelativeDate(dateStr?: string): string {
	const now = new Date();

	if (!dateStr || dateStr.toLowerCase() === 'today') {
		return now.toISOString().split('T')[0];
	}

	if (dateStr.toLowerCase() === 'yesterday') {
		const yesterday = new Date(now);
		yesterday.setDate(yesterday.getDate() - 1);
		return yesterday.toISOString().split('T')[0];
	}

	// Try to parse as ISO date
	try {
		const date = new Date(dateStr);
		if (!isNaN(date.getTime())) {
			return date.toISOString().split('T')[0];
		}
	} catch (e) {
		// Fall through to default
	}

	// Default to today if can't parse
	return now.toISOString().split('T')[0];
}
