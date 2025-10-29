/**
 * Types for AI extraction and person management
 */

export type CRUDIntent = 'create' | 'read' | 'update_tag' | 'update_memory' | 'update' | 'none';

export interface IntentAnalysis {
	intent: CRUDIntent;
	is_create_request: boolean;
}

export interface PersonExtraction {
	name: string;
	attributes?: string | null;
	email?: string | null;
	phone_number?: string | null;
}

export interface TagAssignment {
	people_names: string[];
	tag_name: string;
	operation: string;
}

export interface MemoryUpdate {
	person_name: string;
	entry_content: string;
	date?: string;
}

export interface PersonMatch {
	person_id: string;
	person_name: string;
	similarity: number;
}

export interface PersonMatchResult {
	extracted_name: string;
	matches: PersonMatch[];
	is_ambiguous: boolean;
}

export interface TagAssignmentMatch {
	tag_name: string;
	operation: string;
	matched_people: PersonMatchResult[];
}

export interface MemoryUpdateMatch {
	matched_person: PersonMatchResult;
	entry_content: string;
	parsed_date: string; // ISO format date
}

export interface ExtractionResponse {
	intent: CRUDIntent;
	message?: string;
	people?: PersonExtraction[];
	created_persons?: any[]; // Person objects

	// For tag operations
	tag_assignments?: TagAssignmentMatch[];

	// For memory entries
	memory_updates?: MemoryUpdateMatch[];
}

// JSON Schemas for Gemini structured output

export const IntentAnalysisSchema = {
	type: 'object',
	properties: {
		intent: {
			type: 'string',
			enum: ['create', 'read', 'update_tag', 'update_memory', 'update', 'none']
		},
		is_create_request: {
			type: 'boolean'
		}
	},
	required: ['intent', 'is_create_request']
};

export const PersonExtractionSchema = {
	type: 'object',
	properties: {
		people: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					name: { type: 'string' },
					attributes: { type: ['string', 'null'] },
					email: { type: ['string', 'null'] },
					phone_number: { type: ['string', 'null'] }
				},
				required: ['name']
			}
		}
	},
	required: ['people']
};

export const TagAssignmentSchema = {
	type: 'object',
	properties: {
		assignments: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					people_names: {
						type: 'array',
						items: { type: 'string' }
					},
					tag_name: { type: 'string' },
					operation: { type: 'string' }
				},
				required: ['people_names', 'tag_name', 'operation']
			}
		}
	},
	required: ['assignments']
};

export const MemoryUpdateSchema = {
	type: 'object',
	properties: {
		entries: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					person_name: { type: 'string' },
					entry_content: { type: 'string' },
					date: { type: 'string' }
				},
				required: ['person_name', 'entry_content']
			}
		}
	},
	required: ['entries']
};
