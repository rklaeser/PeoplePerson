import type { Timestamp } from 'firebase/firestore';

// ============================================================================
// Core Data Types
// ============================================================================

export type GuideType = 'Scout' | 'Nico';

export interface Guide {
	type: GuideType;
	name: string;
	imageUrl: string;
	bio: string;
	personality: string;
}

export interface User {
	id: string; // Firestore document ID
	firebaseUid: string;
	name: string | null;
	email: string | null;
	emailVerified: Timestamp | null;
	image: string | null;
	selectedGuide: GuideType | null;
	createdAt: Timestamp;
	updatedAt: Timestamp;
}

export interface Person {
	id: string; // Firestore document ID
	name: string;
	body: string;
	birthday: string | null; // YYYY-MM-DD format
	mnemonic: string | null;
	zip: string | null;
	profilePicIndex: number;
	email: string | null;
	phoneNumber: string | null; // E.164 format
	lastContactDate: Timestamp;

	// Location fields
	streetAddress: string | null;
	city: string | null;
	state: string | null;
	latitude: number | null;
	longitude: number | null;

	// Denormalized data
	tagIds: string[];

	// Computed fields (optional, calculated on read)
	healthScore?: number;
	healthStatus?: HealthStatus;
	daysSinceContact?: number;

	// Metadata
	createdAt: Timestamp;
	updatedAt: Timestamp;
}

export interface Tag {
	id: string; // Firestore document ID
	name: string;
	category: string;
	color: string | null;
	description: string | null;

	// Location fields
	streetAddress: string | null;
	city: string | null;
	state: string | null;
	zip: string | null;
	latitude: number | null;
	longitude: number | null;

	// Denormalized count
	personCount: number;

	// Metadata
	createdAt: Timestamp;
	updatedAt: Timestamp;
}

export interface NotebookEntry {
	id: string; // Firestore document ID
	entryDate: string; // YYYY-MM-DD format (immutable)
	content: string;
	createdAt: Timestamp;
	updatedAt: Timestamp;
}

export interface Message {
	id: string; // Firestore document ID
	body: string;
	direction: MessageDirection;
	sentAt: Timestamp;
	createdAt: Timestamp;
	updatedAt: Timestamp;
}

export interface History {
	id: string; // Firestore document ID
	changeType: ChangeType;
	field: string;
	detail: string;
	createdAt: Timestamp;
	updatedAt: Timestamp;
}

export interface Entry {
	id: string; // Firestore document ID
	content: string;
	processingStatus: ProcessingStatus;
	processingResult: string | null;
	personIds: string[];
	createdAt: Timestamp;
	updatedAt: Timestamp;
}

export interface JournalEntry {
	id: string; // Firestore document ID
	date: string; // YYYY-MM-DD format
	content: string; // User's journal entry
	peopleIds: string[]; // IDs of people mentioned (for bidirectional linking)
	aiResponse: string | null; // AI-generated insights, questions, conversation plans (markdown formatted)
	conversationWith: string | null; // personId if planning conversation
	conversationStatus: ConversationStatus | null;
	createdAt: Timestamp;
	updatedAt: Timestamp;
}

export interface PersonAssociation {
	id: string; // Firestore document ID
	personId: string;
	associateId: string;
	createdAt: Timestamp;
	updatedAt: Timestamp;
}

// ============================================================================
// Enums / String Literals
// ============================================================================

export type HealthStatus = 'healthy' | 'warning' | 'dormant';

export type MessageDirection = 'inbound' | 'outbound';

export type ChangeType = 'prompt' | 'manual';

export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type IntentChoice = 'core' | 'archive' | 'new' | 'develop' | 'casual';

export type ConversationStatus = 'planned' | 'completed';

// ============================================================================
// Create/Update DTOs (Data Transfer Objects)
// ============================================================================

export interface UserCreate {
	firebaseUid: string;
	name?: string | null;
	email?: string | null;
	emailVerified?: Timestamp | null;
	image?: string | null;
	selectedGuide?: GuideType | null;
}

export interface UserUpdate {
	name?: string | null;
	email?: string | null;
	emailVerified?: Timestamp | null;
	image?: string | null;
	selectedGuide?: GuideType | null;
}

export interface PersonCreate {
	name: string;
	body?: string;
	birthday?: string | null;
	mnemonic?: string | null;
	zip?: string | null;
	profilePicIndex?: number;
	email?: string | null;
	phoneNumber?: string | null;
	lastContactDate?: Timestamp;
	streetAddress?: string | null;
	city?: string | null;
	state?: string | null;
	latitude?: number | null;
	longitude?: number | null;
	tagIds?: string[];
}

export interface PersonUpdate {
	name?: string;
	body?: string;
	birthday?: string | null;
	mnemonic?: string | null;
	zip?: string | null;
	profilePicIndex?: number;
	email?: string | null;
	phoneNumber?: string | null;
	lastContactDate?: Timestamp;
	streetAddress?: string | null;
	city?: string | null;
	state?: string | null;
	latitude?: number | null;
	longitude?: number | null;
	tagIds?: string[];
}

export interface TagCreate {
	name: string;
	category?: string;
	color?: string | null;
	description?: string | null;
	streetAddress?: string | null;
	city?: string | null;
	state?: string | null;
	zip?: string | null;
	latitude?: number | null;
	longitude?: number | null;
}

export interface TagUpdate {
	name?: string;
	category?: string;
	color?: string | null;
	description?: string | null;
	streetAddress?: string | null;
	city?: string | null;
	state?: string | null;
	zip?: string | null;
	latitude?: number | null;
	longitude?: number | null;
}

export interface NotebookEntryCreate {
	entryDate: string; // YYYY-MM-DD
	content: string;
}

export interface NotebookEntryUpdate {
	content: string; // Only content is editable
}

export interface MessageCreate {
	body: string;
	direction: MessageDirection;
	sentAt?: Timestamp;
}

export interface HistoryCreate {
	changeType: ChangeType;
	field: string;
	detail: string;
}

export interface EntryCreate {
	content: string;
	processingStatus?: ProcessingStatus;
	processingResult?: string | null;
	personIds?: string[];
}

export interface EntryUpdate {
	content?: string;
	processingStatus?: ProcessingStatus;
	processingResult?: string | null;
	personIds?: string[];
}

export interface JournalEntryCreate {
	date: string; // YYYY-MM-DD
	content: string;
	peopleIds?: string[];
	aiResponse?: string | null;
	conversationWith?: string | null;
	conversationStatus?: ConversationStatus | null;
}

export interface JournalEntryUpdate {
	content?: string;
	peopleIds?: string[];
	aiResponse?: string | null;
	conversationWith?: string | null;
	conversationStatus?: ConversationStatus | null;
}

export interface PersonAssociationCreate {
	personId: string;
	associateId: string;
}

// ============================================================================
// Extended Types with Related Data
// ============================================================================

export interface PersonWithTags extends Person {
	tags: Tag[];
}

export interface PersonWithMemories extends Person {
	latestMemory?: NotebookEntry;
}

export interface PersonDetailed extends PersonWithTags {
	latestMemory?: NotebookEntry;
	messages: Message[];
	history: History[];
	associations: Person[];
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface SMSSendRequest {
	personId: string;
	body: string;
}

export interface AIExtractionRequest {
	content: string;
}

export interface AIExtractionResponse {
	personIds: string[];
	intent: IntentChoice;
	extractedPeople: Array<{
		name: string;
		body?: string;
		tags?: string[];
	}>;
}

export interface HealthScoreResult {
	score: number;
	status: HealthStatus;
	emoji: string;
	daysSinceContact: number;
}

export interface GeocodeResult {
	latitude: number;
	longitude: number;
	formattedAddress?: string;
}

// ============================================================================
// Query/Filter Types
// ============================================================================

export interface PersonFilter {
	search?: string; // Search in name, body, mnemonic
	tagIds?: string[]; // Filter by tags
	healthStatus?: HealthStatus; // Filter by health status
	sortBy?: 'name' | 'lastContact' | 'created';
	sortOrder?: 'asc' | 'desc';
	limit?: number;
	startAfter?: string; // For pagination (document ID)
}

export interface TagFilter {
	search?: string;
	category?: string;
	sortBy?: 'name' | 'personCount' | 'created';
	sortOrder?: 'asc' | 'desc';
	limit?: number;
}

export interface NotebookEntryFilter {
	startDate?: string; // YYYY-MM-DD
	endDate?: string; // YYYY-MM-DD
	sortOrder?: 'asc' | 'desc';
	limit?: number;
}

export interface JournalEntryFilter {
	personId?: string; // Filter by person mentioned
	conversationStatus?: ConversationStatus; // Filter by conversation status
	startDate?: string; // YYYY-MM-DD
	endDate?: string; // YYYY-MM-DD
	sortOrder?: 'asc' | 'desc';
	limit?: number;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Helper to convert Firestore Timestamp to Date
 */
export function timestampToDate(timestamp: Timestamp | null): Date | null {
	if (!timestamp) return null;
	return timestamp.toDate();
}

/**
 * Helper to get ISO date string from Timestamp
 */
export function timestampToISO(timestamp: Timestamp | null): string | null {
	if (!timestamp) return null;
	return timestamp.toDate().toISOString();
}

/**
 * Helper to format date for display
 */
export function formatDate(timestamp: Timestamp | Date | null, format = 'short'): string {
	if (!timestamp) return '';

	const date = timestamp instanceof Date ? timestamp : timestamp.toDate();

	if (format === 'short') {
		return date.toLocaleDateString();
	} else if (format === 'long') {
		return date.toLocaleDateString(undefined, {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	} else if (format === 'time') {
		return date.toLocaleTimeString(undefined, {
			hour: '2-digit',
			minute: '2-digit'
		});
	} else {
		return date.toLocaleString();
	}
}
