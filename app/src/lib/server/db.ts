import { getDB } from './firebase';

/**
 * Generic Firestore database utilities
 * Extend these for your specific collections
 */

/**
 * Get all documents from a collection
 * @param collectionName - Name of the collection
 * @param orderByField - Optional field to order by (defaults to document ID)
 * @returns Array of documents with their data
 */
export async function getAllDocuments<T>(
	collectionName: string,
	orderByField: string = '__name__'
): Promise<T[]> {
	const db = getDB();
	const snapshot = await db.collection(collectionName).orderBy(orderByField).get();

	const documents: T[] = [];
	snapshot.forEach((doc) => {
		documents.push(doc.data() as T);
	});

	return documents;
}

/**
 * Get a single document by ID
 * @param collectionName - Name of the collection
 * @param docId - Document ID
 * @returns Document data or null if not found
 */
export async function getDocumentById<T>(
	collectionName: string,
	docId: string
): Promise<T | null> {
	const db = getDB();
	const doc = await db.collection(collectionName).doc(docId).get();

	if (!doc.exists) {
		return null;
	}

	return doc.data() as T;
}

/**
 * Create or update a document
 * @param collectionName - Name of the collection
 * @param docId - Document ID
 * @param data - Document data
 */
export async function setDocument<T>(
	collectionName: string,
	docId: string,
	data: T
): Promise<void> {
	const db = getDB();
	await db.collection(collectionName).doc(docId).set(data);
}

/**
 * Update specific fields in a document
 * @param collectionName - Name of the collection
 * @param docId - Document ID
 * @param data - Partial document data to update
 */
export async function updateDocument<T>(
	collectionName: string,
	docId: string,
	data: Partial<T>
): Promise<void> {
	const db = getDB();
	await db.collection(collectionName).doc(docId).update(data);
}

/**
 * Delete a document
 * @param collectionName - Name of the collection
 * @param docId - Document ID
 */
export async function deleteDocument(collectionName: string, docId: string): Promise<void> {
	const db = getDB();
	await db.collection(collectionName).doc(docId).delete();
}

/**
 * Get the total count of documents in a collection
 * @param collectionName - Name of the collection
 * @returns Count of documents
 */
export async function getDocumentCount(collectionName: string): Promise<number> {
	const db = getDB();
	const snapshot = await db.collection(collectionName).count().get();
	return snapshot.data().count;
}
