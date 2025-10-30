# PostgreSQL to Firestore Migration Guide

This guide covers migrating your PeoplePerson data from PostgreSQL (Cloud SQL) to Firestore.

## Prerequisites

1. **Google Cloud authentication**
   ```bash
   gcloud auth application-default login
   gcloud config set project peopleperson-app
   ```

2. **Start the Cloud SQL proxy** (in a separate terminal)
   ```bash
   make sql
   ```
   This connects to `peopleperson-app:us-central1:peopleperson-db` on `localhost:5432`

3. **Activate Python environment**
   ```bash
   cd api
   source venv/bin/activate
   ```

## Migration Steps

### 1. Test with Dry Run (Recommended)

First, run a dry run to see what would be migrated:

```bash
# Check all users
python migrate_postgres_to_firestore.py --dry-run

# Check specific user
python migrate_postgres_to_firestore.py --dry-run --user-email your@email.com
```

This will show you:
- How many users will be migrated
- How many people, tags, memories, messages, etc. for each user
- No data is written to Firestore

### 2. Migrate a Test User

Migrate a single user first to verify everything works:

```bash
python migrate_postgres_to_firestore.py --user-email your@email.com
```

### 3. Verify Migration

Check your Firestore console:
- Visit: https://console.firebase.google.com/project/peopleperson-app/firestore
- Look for `users/{userId}/people`, `users/{userId}/tags`, etc.

Or use the MCP server to query:
```bash
cd mcp-server
npm run build
# Then use MCP tools to list documents
```

### 4. Migrate All Users

Once you've verified one user works:

```bash
python migrate_postgres_to_firestore.py
```

## Firestore Structure

The migration transforms PostgreSQL's relational schema into Firestore's nested collections:

```
users/
  {firebaseUid}/
    people/
      {personId}/
        - person data (name, email, phone, location, etc.)
        - tagIds: [array of tag IDs]
        memories/
          {entryDate}/
            - content
            - timestamps
        messages/
          {messageId}/
            - body, direction, sentAt
        history/
          {historyId}/
            - changeType, field, detail
    tags/
      {tagId}/
        - name, category, color, personCount, etc.
    entries/
      {entryId}/
        - content, processingStatus, personIds
```

## Troubleshooting

### "DATABASE_URL not found"
- Ensure `api/.env` has `DATABASE_URL` set
- Should look like: `postgresql://postgres:PASSWORD@localhost:5432/peopleperson_staging`

### "Failed to initialize Firebase"
- Run: `gcloud auth application-default login`
- Ensure project is set: `gcloud config set project peopleperson-app`

### "Connection refused" to PostgreSQL
- Make sure Cloud SQL proxy is running: `make sql`
- Verify it's listening on port 5432

### Checking Migration Results

Use the Firestore console or write a simple query script:

```python
import firebase_admin
from firebase_admin import firestore

firebase_admin.initialize_app()
db = firestore.client()

# List all users
users_ref = db.collection('users')
users = users_ref.limit(10).get()

for user_doc in users:
    print(f"User: {user_doc.id}")

    # Count their people
    people = db.collection(f'users/{user_doc.id}/people').get()
    print(f"  People: {len(people)}")
```

## Rollback

If something goes wrong, you can delete the Firestore data:

```bash
# Using the Firestore console
# 1. Go to https://console.firebase.google.com/project/peopleperson-app/firestore
# 2. Select the 'users' collection
# 3. Delete all documents

# Or use a script to clear data (not included in this repo)
```

Your PostgreSQL data remains untouched during migration.

## Next Steps

After successful migration:

1. Update the SvelteKit app to use the new Firestore data
2. Test the SvelteKit app thoroughly
3. Consider running both systems in parallel temporarily
4. Eventually deprecate the PostgreSQL database

## Schema Differences

### PostgreSQL → Firestore Mapping

| PostgreSQL | Firestore |
|-----------|-----------|
| `users` table | `users/{firebaseUid}` document |
| `people` table | `users/{userId}/people/{personId}` |
| `tags` table | `users/{userId}/tags/{tagId}` |
| `personTags` join table | `tagIds` array in person doc |
| `notebookEntries` table | `users/{userId}/people/{personId}/memories/{date}` |
| `messages` table | `users/{userId}/people/{personId}/messages/{msgId}` |
| `history` table | `users/{userId}/people/{personId}/history/{historyId}` |
| `entries` table | `users/{userId}/entries/{entryId}` |
| `entryPeople` join table | `personIds` array in entry doc |

### Field Name Changes

PostgreSQL uses snake_case, Firestore uses camelCase:
- `profile_pic_index` → `profilePicIndex`
- `last_contact_date` → `lastContactDate`
- `created_at` → `createdAt`
- etc.
