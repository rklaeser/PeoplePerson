import { getDB } from './firebase';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import type {
	User,
	UserCreate,
	UserUpdate,
	Person,
	PersonCreate,
	PersonUpdate,
	Tag,
	TagCreate,
	TagUpdate,
	NotebookEntry,
	NotebookEntryCreate,
	NotebookEntryUpdate,
	Message,
	MessageCreate,
	History,
	HistoryCreate,
	Entry,
	EntryCreate,
	EntryUpdate,
	JournalEntry,
	JournalEntryCreate,
	JournalEntryUpdate,
	PersonAssociation,
	PersonAssociationCreate,
	PersonFilter,
	TagFilter,
	NotebookEntryFilter,
	JournalEntryFilter
} from '$lib/types';

/**
 * Get the base collection path for a user's data
 */
function getUserPath(userId: string): string {
	return `users/${userId}`;
}

// ============================================================================
// User Operations
// ============================================================================

/**
 * Get a user by Firebase UID
 */
export async function getUserByFirebaseUid(firebaseUid: string): Promise<User | null> {
	const db = getDB();
	const snapshot = await db.collection('users').where('firebaseUid', '==', firebaseUid).limit(1).get();

	if (snapshot.empty) {
		return null;
	}

	const doc = snapshot.docs[0];
	return { id: doc.id, ...doc.data() } as User;
}

/**
 * Get a user by ID
 */
export async function getUser(userId: string): Promise<User | null> {
	const db = getDB();
	const doc = await db.doc(`users/${userId}`).get();

	if (!doc.exists) {
		return null;
	}

	return { id: doc.id, ...doc.data() } as User;
}

/**
 * Create a new user
 */
export async function createUser(data: UserCreate): Promise<User> {
	const db = getDB();
	const now = Timestamp.now();

	const userData = {
		firebaseUid: data.firebaseUid,
		name: data.name || null,
		email: data.email || null,
		emailVerified: data.emailVerified || null,
		image: data.image || null,
		selectedGuide: data.selectedGuide || null,
		createdAt: now,
		updatedAt: now
	};

	const docRef = await db.collection('users').add(userData);

	return { id: docRef.id, ...userData } as User;
}

/**
 * Get or create a user (used for first-time login)
 */
export async function getOrCreateUser(firebaseUid: string, email: string | null, selectedGuide?: 'Scout' | 'Nico' | null): Promise<User> {
	let user = await getUserByFirebaseUid(firebaseUid);

	if (!user) {
		user = await createUser({
			firebaseUid,
			email,
			selectedGuide: selectedGuide || null
		});
	}

	return user;
}

/**
 * Update a user
 */
export async function updateUser(userId: string, data: UserUpdate): Promise<void> {
	const db = getDB();
	const updateData = {
		...data,
		updatedAt: Timestamp.now()
	};

	await db.doc(`users/${userId}`).update(updateData);
}

/**
 * Update user's selected guide
 */
export async function updateUserGuide(userId: string, guide: 'Scout' | 'Nico' | null): Promise<void> {
	await updateUser(userId, { selectedGuide: guide });
}

// ============================================================================
// People Operations
// ============================================================================

/**
 * Get all people for a user
 */
export async function getPeople(
	userId: string,
	filter?: PersonFilter
): Promise<Person[]> {
	const db = getDB();
	let query = db.collection(`${getUserPath(userId)}/people`);

	// Apply filters
	if (filter?.tagIds && filter.tagIds.length > 0) {
		// Firestore supports array-contains for single value, array-contains-any for multiple
		query = query.where('tagIds', 'array-contains-any', filter.tagIds.slice(0, 10)) as any;
	}

	// Apply sorting
	const sortBy = filter?.sortBy || 'lastContactDate';
	const sortOrder = filter?.sortOrder || 'desc';
	query = query.orderBy(sortBy, sortOrder) as any;

	// Apply limit
	if (filter?.limit) {
		query = query.limit(filter.limit) as any;
	}

	// Apply pagination
	if (filter?.startAfter) {
		const startDoc = await db.doc(`${getUserPath(userId)}/people/${filter.startAfter}`).get();
		query = query.startAfter(startDoc) as any;
	}

	const snapshot = await query.get();
	const people: Person[] = [];

	snapshot.forEach((doc) => {
		people.push({ id: doc.id, ...doc.data() } as Person);
	});

	// Client-side text search (Firestore doesn't support full-text search natively)
	if (filter?.search) {
		const searchLower = filter.search.toLowerCase();
		return people.filter(
			(p) =>
				p.name.toLowerCase().includes(searchLower) ||
				p.body?.toLowerCase().includes(searchLower) ||
				p.mnemonic?.toLowerCase().includes(searchLower)
		);
	}

	return people;
}

/**
 * Get a single person by ID
 */
export async function getPerson(userId: string, personId: string): Promise<Person | null> {
	const db = getDB();
	const doc = await db.doc(`${getUserPath(userId)}/people/${personId}`).get();

	if (!doc.exists) {
		return null;
	}

	return { id: doc.id, ...doc.data() } as Person;
}

/**
 * Create a new person
 */
export async function createPerson(userId: string, data: PersonCreate): Promise<Person> {
	const db = getDB();
	const now = Timestamp.now();

	const personData = {
		name: data.name,
		body: data.body || 'Add a description',
		birthday: data.birthday || null,
		mnemonic: data.mnemonic || null,
		zip: data.zip || null,
		profilePicIndex: data.profilePicIndex || 0,
		email: data.email || null,
		phoneNumber: data.phoneNumber || null,
		lastContactDate: data.lastContactDate || now,
		streetAddress: data.streetAddress || null,
		city: data.city || null,
		state: data.state || null,
		latitude: data.latitude || null,
		longitude: data.longitude || null,
		tagIds: data.tagIds || [],
		createdAt: now,
		updatedAt: now
	};

	const docRef = await db.collection(`${getUserPath(userId)}/people`).add(personData);

	return { id: docRef.id, ...personData } as Person;
}

/**
 * Update a person
 */
export async function updatePerson(
	userId: string,
	personId: string,
	data: PersonUpdate
): Promise<void> {
	const db = getDB();
	const updateData = {
		...data,
		updatedAt: Timestamp.now()
	};

	await db.doc(`${getUserPath(userId)}/people/${personId}`).update(updateData);
}

/**
 * Delete a person (and all subcollections)
 */
export async function deletePerson(userId: string, personId: string): Promise<void> {
	const db = getDB();
	const personRef = db.doc(`${getUserPath(userId)}/people/${personId}`);

	// Delete subcollections
	await deleteCollection(db, `${personRef.path}/memories`, 100);
	await deleteCollection(db, `${personRef.path}/messages`, 100);
	await deleteCollection(db, `${personRef.path}/history`, 100);

	// Delete person document
	await personRef.delete();
}

// ============================================================================
// Tags Operations
// ============================================================================

/**
 * Get all tags for a user
 */
export async function getTags(userId: string, filter?: TagFilter): Promise<Tag[]> {
	const db = getDB();
	let query = db.collection(`${getUserPath(userId)}/tags`);

	// Apply filters
	if (filter?.category) {
		query = query.where('category', '==', filter.category) as any;
	}

	// Apply sorting
	const sortBy = filter?.sortBy || 'name';
	const sortOrder = filter?.sortOrder || 'asc';
	query = query.orderBy(sortBy, sortOrder) as any;

	// Apply limit
	if (filter?.limit) {
		query = query.limit(filter.limit) as any;
	}

	const snapshot = await query.get();
	const tags: Tag[] = [];

	snapshot.forEach((doc) => {
		tags.push({ id: doc.id, ...doc.data() } as Tag);
	});

	// Client-side search
	if (filter?.search) {
		const searchLower = filter.search.toLowerCase();
		return tags.filter((t) => t.name.toLowerCase().includes(searchLower));
	}

	return tags;
}

/**
 * Get a single tag by ID
 */
export async function getTag(userId: string, tagId: string): Promise<Tag | null> {
	const db = getDB();
	const doc = await db.doc(`${getUserPath(userId)}/tags/${tagId}`).get();

	if (!doc.exists) {
		return null;
	}

	return { id: doc.id, ...doc.data() } as Tag;
}

/**
 * Create a new tag
 */
export async function createTag(userId: string, data: TagCreate): Promise<Tag> {
	const db = getDB();
	const now = Timestamp.now();

	const tagData = {
		name: data.name.trim(),
		category: data.category || 'general',
		color: data.color || null,
		description: data.description || null,
		streetAddress: data.streetAddress || null,
		city: data.city || null,
		state: data.state || null,
		zip: data.zip || null,
		latitude: data.latitude || null,
		longitude: data.longitude || null,
		personCount: 0,
		createdAt: now,
		updatedAt: now
	};

	const docRef = await db.collection(`${getUserPath(userId)}/tags`).add(tagData);

	return { id: docRef.id, ...tagData } as Tag;
}

/**
 * Update a tag
 */
export async function updateTag(userId: string, tagId: string, data: TagUpdate): Promise<void> {
	const db = getDB();
	const updateData = {
		...data,
		updatedAt: Timestamp.now()
	};

	await db.doc(`${getUserPath(userId)}/tags/${tagId}`).update(updateData);
}

/**
 * Delete a tag
 */
export async function deleteTag(userId: string, tagId: string): Promise<void> {
	const db = getDB();
	await db.doc(`${getUserPath(userId)}/tags/${tagId}`).delete();

	// Remove tag from all people
	const people = await getPeople(userId, { tagIds: [tagId] });
	const batch = db.batch();

	people.forEach((person) => {
		const personRef = db.doc(`${getUserPath(userId)}/people/${person.id}`);
		batch.update(personRef, {
			tagIds: FieldValue.arrayRemove(tagId)
		});
	});

	await batch.commit();
}

/**
 * Add tag to person
 */
export async function addTagToPerson(
	userId: string,
	personId: string,
	tagId: string
): Promise<void> {
	const db = getDB();
	const batch = db.batch();

	// Add tag to person
	const personRef = db.doc(`${getUserPath(userId)}/people/${personId}`);
	batch.update(personRef, {
		tagIds: FieldValue.arrayUnion(tagId),
		updatedAt: Timestamp.now()
	});

	// Increment tag person count
	const tagRef = db.doc(`${getUserPath(userId)}/tags/${tagId}`);
	batch.update(tagRef, {
		personCount: FieldValue.increment(1),
		updatedAt: Timestamp.now()
	});

	await batch.commit();
}

/**
 * Remove tag from person
 */
export async function removeTagFromPerson(
	userId: string,
	personId: string,
	tagId: string
): Promise<void> {
	const db = getDB();
	const batch = db.batch();

	// Remove tag from person
	const personRef = db.doc(`${getUserPath(userId)}/people/${personId}`);
	batch.update(personRef, {
		tagIds: FieldValue.arrayRemove(tagId),
		updatedAt: Timestamp.now()
	});

	// Decrement tag person count
	const tagRef = db.doc(`${getUserPath(userId)}/tags/${tagId}`);
	batch.update(tagRef, {
		personCount: FieldValue.increment(-1),
		updatedAt: Timestamp.now()
	});

	await batch.commit();
}

// ============================================================================
// Notebook/Memory Operations
// ============================================================================

/**
 * Get memories for a person
 */
export async function getMemories(
	userId: string,
	personId: string,
	filter?: NotebookEntryFilter
): Promise<NotebookEntry[]> {
	const db = getDB();
	let query = db.collection(`${getUserPath(userId)}/people/${personId}/memories`);

	// Apply date filters
	if (filter?.startDate) {
		query = query.where('entryDate', '>=', filter.startDate) as any;
	}
	if (filter?.endDate) {
		query = query.where('entryDate', '<=', filter.endDate) as any;
	}

	// Apply sorting
	const sortOrder = filter?.sortOrder || 'desc';
	query = query.orderBy('entryDate', sortOrder) as any;

	// Apply limit
	if (filter?.limit) {
		query = query.limit(filter.limit) as any;
	}

	const snapshot = await query.get();
	const memories: NotebookEntry[] = [];

	snapshot.forEach((doc) => {
		memories.push({ id: doc.id, ...doc.data() } as NotebookEntry);
	});

	return memories;
}

/**
 * Get a single memory
 */
export async function getMemory(
	userId: string,
	personId: string,
	memoryId: string
): Promise<NotebookEntry | null> {
	const db = getDB();
	const doc = await db
		.doc(`${getUserPath(userId)}/people/${personId}/memories/${memoryId}`)
		.get();

	if (!doc.exists) {
		return null;
	}

	return { id: doc.id, ...doc.data() } as NotebookEntry;
}

/**
 * Create or update a memory (upsert based on entryDate)
 */
export async function upsertMemory(
	userId: string,
	personId: string,
	data: NotebookEntryCreate
): Promise<NotebookEntry> {
	const db = getDB();
	const now = Timestamp.now();

	// Use entryDate as document ID to enforce one entry per date
	const memoryRef = db.doc(
		`${getUserPath(userId)}/people/${personId}/memories/${data.entryDate}`
	);
	const existingDoc = await memoryRef.get();

	const memoryData = {
		entryDate: data.entryDate,
		content: data.content,
		updatedAt: now,
		...(existingDoc.exists ? {} : { createdAt: now })
	};

	await memoryRef.set(memoryData, { merge: true });

	return { id: data.entryDate, ...memoryData, createdAt: existingDoc.exists ? (existingDoc.data()!.createdAt as Timestamp) : now } as NotebookEntry;
}

/**
 * Update a memory (content only)
 */
export async function updateMemory(
	userId: string,
	personId: string,
	memoryId: string,
	data: NotebookEntryUpdate
): Promise<void> {
	const db = getDB();
	await db
		.doc(`${getUserPath(userId)}/people/${personId}/memories/${memoryId}`)
		.update({
			content: data.content,
			updatedAt: Timestamp.now()
		});
}

/**
 * Delete a memory
 */
export async function deleteMemory(
	userId: string,
	personId: string,
	memoryId: string
): Promise<void> {
	const db = getDB();
	await db.doc(`${getUserPath(userId)}/people/${personId}/memories/${memoryId}`).delete();
}

// ============================================================================
// Message Operations
// ============================================================================

/**
 * Get messages for a person
 */
export async function getMessages(userId: string, personId: string): Promise<Message[]> {
	const db = getDB();
	const snapshot = await db
		.collection(`${getUserPath(userId)}/people/${personId}/messages`)
		.orderBy('sentAt', 'desc')
		.get();

	const messages: Message[] = [];
	snapshot.forEach((doc) => {
		messages.push({ id: doc.id, ...doc.data() } as Message);
	});

	return messages;
}

/**
 * Create a message
 */
export async function createMessage(
	userId: string,
	personId: string,
	data: MessageCreate
): Promise<Message> {
	const db = getDB();
	const now = Timestamp.now();

	const messageData = {
		body: data.body,
		direction: data.direction,
		sentAt: data.sentAt || now,
		createdAt: now,
		updatedAt: now
	};

	const docRef = await db
		.collection(`${getUserPath(userId)}/people/${personId}/messages`)
		.add(messageData);

	return { id: docRef.id, ...messageData } as Message;
}

// ============================================================================
// History Operations
// ============================================================================

/**
 * Get history for a person
 */
export async function getHistory(userId: string, personId: string): Promise<History[]> {
	const db = getDB();
	const snapshot = await db
		.collection(`${getUserPath(userId)}/people/${personId}/history`)
		.orderBy('createdAt', 'desc')
		.limit(50)
		.get();

	const history: History[] = [];
	snapshot.forEach((doc) => {
		history.push({ id: doc.id, ...doc.data() } as History);
	});

	return history;
}

/**
 * Create a history entry
 */
export async function createHistory(
	userId: string,
	personId: string,
	data: HistoryCreate
): Promise<History> {
	const db = getDB();
	const now = Timestamp.now();

	const historyData = {
		changeType: data.changeType,
		field: data.field,
		detail: data.detail,
		createdAt: now,
		updatedAt: now
	};

	const docRef = await db
		.collection(`${getUserPath(userId)}/people/${personId}/history`)
		.add(historyData);

	return { id: docRef.id, ...historyData } as History;
}

// ============================================================================
// Entry Operations
// ============================================================================

/**
 * Get entries for a user
 */
export async function getEntries(userId: string): Promise<Entry[]> {
	const db = getDB();
	const snapshot = await db
		.collection(`${getUserPath(userId)}/entries`)
		.orderBy('createdAt', 'desc')
		.limit(50)
		.get();

	const entries: Entry[] = [];
	snapshot.forEach((doc) => {
		entries.push({ id: doc.id, ...doc.data() } as Entry);
	});

	return entries;
}

/**
 * Create an entry
 */
export async function createEntry(userId: string, data: EntryCreate): Promise<Entry> {
	const db = getDB();
	const now = Timestamp.now();

	const entryData = {
		content: data.content,
		processingStatus: data.processingStatus || 'pending',
		processingResult: data.processingResult || null,
		personIds: data.personIds || [],
		createdAt: now,
		updatedAt: now
	};

	const docRef = await db.collection(`${getUserPath(userId)}/entries`).add(entryData);

	return { id: docRef.id, ...entryData } as Entry;
}

/**
 * Update an entry
 */
export async function updateEntry(
	userId: string,
	entryId: string,
	data: EntryUpdate
): Promise<void> {
	const db = getDB();
	const updateData = {
		...data,
		updatedAt: Timestamp.now()
	};

	await db.doc(`${getUserPath(userId)}/entries/${entryId}`).update(updateData);
}

// ============================================================================
// Journal Operations
// ============================================================================

/**
 * Get journal entries for a user
 */
export async function getJournalEntries(
	userId: string,
	filter?: JournalEntryFilter
): Promise<JournalEntry[]> {
	const db = getDB();
	let query = db.collection(`${getUserPath(userId)}/journal`);

	// Apply filters
	if (filter?.personId) {
		query = query.where('peopleIds', 'array-contains', filter.personId) as any;
	}
	if (filter?.conversationStatus) {
		query = query.where('conversationStatus', '==', filter.conversationStatus) as any;
	}
	if (filter?.startDate) {
		query = query.where('date', '>=', filter.startDate) as any;
	}
	if (filter?.endDate) {
		query = query.where('date', '<=', filter.endDate) as any;
	}

	// Apply sorting
	const sortOrder = filter?.sortOrder || 'desc';
	query = query.orderBy('date', sortOrder) as any;

	// Apply limit
	if (filter?.limit) {
		query = query.limit(filter.limit) as any;
	}

	const snapshot = await query.get();
	const entries: JournalEntry[] = [];

	snapshot.forEach((doc) => {
		entries.push({ id: doc.id, ...doc.data() } as JournalEntry);
	});

	return entries;
}

/**
 * Get a single journal entry by ID
 */
export async function getJournalEntry(
	userId: string,
	entryId: string
): Promise<JournalEntry | null> {
	const db = getDB();
	const doc = await db.doc(`${getUserPath(userId)}/journal/${entryId}`).get();

	if (!doc.exists) {
		return null;
	}

	return { id: doc.id, ...doc.data() } as JournalEntry;
}

/**
 * Create a journal entry
 */
export async function createJournalEntry(
	userId: string,
	data: JournalEntryCreate
): Promise<JournalEntry> {
	const db = getDB();
	const now = Timestamp.now();

	const entryData = {
		date: data.date,
		content: data.content,
		peopleIds: data.peopleIds || [],
		aiResponse: data.aiResponse || null,
		conversationWith: data.conversationWith || null,
		conversationStatus: data.conversationStatus || null,
		createdAt: now,
		updatedAt: now
	};

	const docRef = await db.collection(`${getUserPath(userId)}/journal`).add(entryData);

	return { id: docRef.id, ...entryData } as JournalEntry;
}

/**
 * Update a journal entry
 */
export async function updateJournalEntry(
	userId: string,
	entryId: string,
	data: JournalEntryUpdate
): Promise<void> {
	const db = getDB();
	const updateData = {
		...data,
		updatedAt: Timestamp.now()
	};

	await db.doc(`${getUserPath(userId)}/journal/${entryId}`).update(updateData);
}

/**
 * Delete a journal entry
 */
export async function deleteJournalEntry(userId: string, entryId: string): Promise<void> {
	const db = getDB();
	await db.doc(`${getUserPath(userId)}/journal/${entryId}`).delete();
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Delete all documents in a collection (for cleanup)
 */
async function deleteCollection(
	db: FirebaseFirestore.Firestore,
	collectionPath: string,
	batchSize: number
): Promise<void> {
	const collectionRef = db.collection(collectionPath);
	const query = collectionRef.limit(batchSize);

	return new Promise((resolve, reject) => {
		deleteQueryBatch(db, query, resolve).catch(reject);
	});
}

async function deleteQueryBatch(
	db: FirebaseFirestore.Firestore,
	query: FirebaseFirestore.Query,
	resolve: () => void
): Promise<void> {
	const snapshot = await query.get();

	const batchSize = snapshot.size;
	if (batchSize === 0) {
		resolve();
		return;
	}

	const batch = db.batch();
	snapshot.docs.forEach((doc) => {
		batch.delete(doc.ref);
	});
	await batch.commit();

	process.nextTick(() => {
		deleteQueryBatch(db, query, resolve);
	});
}
