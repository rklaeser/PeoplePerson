# Firestore Data Model for People Person

## Overview

This document defines the Firestore schema for migrating People Person from PostgreSQL to Firestore. The design uses user-scoped subcollections for security and denormalization for query performance.

## Collection Structure

### User Document
**Path**: `users/{userId}`

```typescript
{
  firebaseUid: string;        // Firebase Auth UID
  name: string | null;
  email: string | null;
  emailVerified: Timestamp | null;
  image: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Indexes**:
- `firebaseUid` (unique)
- `email` (unique)

---

### People Subcollection
**Path**: `users/{userId}/people/{personId}`

```typescript
{
  name: string;
  body: string;               // Description
  birthday: string | null;    // Stored as string (YYYY-MM-DD)
  mnemonic: string | null;
  zip: string | null;
  profilePicIndex: number;    // Default: 0
  email: string | null;
  phoneNumber: string | null; // E.164 format
  lastContactDate: Timestamp;

  // Location fields
  streetAddress: string | null;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;

  // Denormalized data for queries
  tagIds: string[];           // Array of tag IDs

  // Computed fields (optional, can be calculated on read)
  healthScore?: number;
  healthStatus?: 'healthy' | 'warning' | 'dormant';
  daysSinceContact?: number;

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Indexes**:
- `lastContactDate` (for sorting by recent contact)
- `createdAt` (for sorting by creation)
- Composite: `tagIds` + `lastContactDate` (for filtered queries)

---

### Memories (Notebook Entries) Subcollection
**Path**: `users/{userId}/people/{personId}/memories/{memoryId}`

```typescript
{
  entryDate: string;          // YYYY-MM-DD format (immutable)
  content: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Indexes**:
- `entryDate` (for chronological sorting)

**Notes**:
- `entryDate` is immutable after creation
- Use `memoryId` = `entryDate` to enforce one entry per date per person

---

### Messages Subcollection
**Path**: `users/{userId}/people/{personId}/messages/{messageId}`

```typescript
{
  body: string;
  direction: 'inbound' | 'outbound';
  sentAt: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Indexes**:
- `sentAt` (for chronological ordering)

---

### History Subcollection
**Path**: `users/{userId}/people/{personId}/history/{historyId}`

```typescript
{
  changeType: 'prompt' | 'manual';
  field: string;              // Field that changed
  detail: string;             // Description of change
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Indexes**:
- `createdAt` (for chronological ordering)

---

### Tags Subcollection
**Path**: `users/{userId}/tags/{tagId}`

```typescript
{
  name: string;
  category: string;           // Default: "general"
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
  personCount: number;        // Number of people with this tag

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Indexes**:
- `name` (for searching)
- `category` (for filtering)

---

### Entries Subcollection
**Path**: `users/{userId}/entries/{entryId}`

```typescript
{
  content: string;            // Raw narrative text
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  processingResult: string | null;

  // Denormalized person references
  personIds: string[];        // IDs of people mentioned in entry

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Indexes**:
- `processingStatus` (for filtering pending entries)
- `createdAt` (for chronological ordering)

---

### Person Associations Subcollection
**Path**: `users/{userId}/personAssociations/{associationId}`

```typescript
{
  personId: string;           // Reference to person document
  associateId: string;        // Reference to associated person document
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Indexes**:
- `personId` (for querying associations from a person)
- `associateId` (for reverse lookups)

---

## Design Decisions

### 1. User-Scoped Subcollections
All data is stored under `users/{userId}/` subcollections. This provides:
- Simple security rules (only owner can access their data)
- Automatic multi-tenancy
- Easy user deletion (delete user document and subcollections)

### 2. Denormalization Strategy

**Tag IDs in People Documents**
- Store `tagIds[]` array directly in person documents
- Enables filtering people by tag without joins
- Trade-off: Must update person doc when tags change
- Benefit: Fast queries like "show all people with tag X"

**Person Count in Tags**
- Store count of people using each tag
- Update when person-tag associations change
- Enables "show popular tags" without counting

**Person IDs in Entries**
- Store array of person IDs mentioned in each entry
- Enables "find entries about person X"

### 3. Nested Subcollections
Memories, messages, and history are nested under people:
- Natural hierarchy (these belong to a specific person)
- Easy to query (get all memories for person X)
- Automatic cleanup (delete person → deletes nested data)

### 4. Timestamp Usage
- All dates stored as Firestore Timestamps (not strings)
- Exception: `entryDate` in memories uses YYYY-MM-DD string for exact date matching
- Exception: `birthday` stored as string (partial dates possible)

### 5. Health Score
Can be computed on-read from `lastContactDate`:
```typescript
const daysSinceContact = (now - lastContactDate) / (1000 * 60 * 60 * 24);
const healthStatus = daysSinceContact < 30 ? 'healthy' :
                     daysSinceContact < 90 ? 'warning' : 'dormant';
```

Optionally cache in document for faster queries.

---

## Query Examples

### Get all people for user, sorted by recent contact
```typescript
db.collection('users').doc(userId)
  .collection('people')
  .orderBy('lastContactDate', 'desc')
  .get();
```

### Get all people with specific tag
```typescript
db.collection('users').doc(userId)
  .collection('people')
  .where('tagIds', 'array-contains', tagId)
  .get();
```

### Get memories for a person
```typescript
db.collection('users').doc(userId)
  .collection('people').doc(personId)
  .collection('memories')
  .orderBy('entryDate', 'desc')
  .get();
```

### Search people by name
```typescript
// Note: Firestore doesn't support full-text search natively
// Use >= and <= for prefix matching, or integrate Algolia/Typesense
db.collection('users').doc(userId)
  .collection('people')
  .where('name', '>=', searchTerm)
  .where('name', '<=', searchTerm + '\uf8ff')
  .get();
```

---

## Migration Notes

### Data Transformation
1. Convert UUIDs to Firestore document IDs (strings)
2. Convert PostgreSQL timestamps to Firestore Timestamps
3. Extract tag IDs from PersonTag junction table → `tagIds[]` array
4. Extract person IDs from EntryPerson junction table → `personIds[]` array
5. Calculate `personCount` for each tag

### Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only authenticated users can access their own data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Indexes Required
Create composite indexes for:
- `users/{userId}/people`: `tagIds` (array) + `lastContactDate` (desc)
- `users/{userId}/people`: `name` (asc)
- `users/{userId}/tags`: `name` (asc)

---

## Future Optimizations

### Full-Text Search
Consider integrating:
- Algolia (managed search service)
- Typesense (open-source alternative)
- Firebase Extensions for Firestore search

### Aggregation
For expensive aggregations (total people count, tag statistics):
- Use Cloud Functions to maintain aggregate documents
- Store at `users/{userId}/aggregates/stats`

### Pagination
Implement cursor-based pagination:
```typescript
const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
const next = query.startAfter(lastDoc).limit(25);
```
