# Issue: Remove ML Dependencies from Chat Features

## Summary
Remove sentence-transformers and all ML-based similarity matching from the API to reduce container size and complexity. Replace with simple string matching.

## Background
The API was using `sentence-transformers>=3.0.0` which pulls in ~2GB+ of PyTorch/CUDA packages. This is unnecessary since:
- We only call Gemini API for AI features
- Local ML was only used for duplicate person detection and name matching
- Simple string matching is sufficient for our use case

## Changes Made

### 1. Removed ML Dependencies
- ✅ Removed `sentence-transformers>=3.0.0` from requirements.txt
- ✅ Removed `SentenceTransformer` initialization from `PersonManager`
- ✅ Removed all imports of sentence-transformers

### 2. Replaced Similarity Matching
- ✅ Replaced `find_similar()` with `find_by_name()` using case-insensitive string matching
- ✅ Matching priority: exact match > starts with > contains
- ✅ No ML embeddings or cosine similarity

### 3. Removed Duplicate Detection from CREATE Flow
- ✅ Users can now create duplicate people without warnings
- ✅ Removed `DuplicateWarning` class and all references
- ✅ Simplified create flow - no more confirmation dialogs for duplicates

### 4. Updated Name Matching for UPDATE Operations
- ✅ Changed `match_person()` to return `PersonMatchResult` with ALL matches
- ✅ Added `is_ambiguous` flag when multiple people have same name
- ✅ Frontend can now handle disambiguation when needed

### 5. Fixed Model Issues
- ✅ Removed non-existent `intent` field from Person model
- ✅ Updated all tests to reflect new behavior
- ✅ Added better error logging

## Current Status

### Working
- CREATE: People are created immediately without duplicate checks
- Name matching uses simple case-insensitive string search
- Multiple matches are returned for disambiguation
- Backend properly returns `PersonMatchResult` with `is_ambiguous` flag
- Debug logging in place for tracking matches

### ✅ FIXED - Type Mismatch Issue
The issue was a **type mismatch between backend and frontend**, not the matching logic itself!

**Root Cause:**
- Backend was correctly returning nested structure: `PersonMatchResult` with `matches` array and `is_ambiguous` flag
- Frontend types expected a flat structure with `matched_person_id` directly on the match object
- This caused the frontend to incorrectly show "(not found)" even when matches existed

**Solution:**
- ✅ Updated `webclient/src/types/api.ts`:
  - Fixed `PersonMatch` to have `person_id`, `person_name`, `similarity`
  - Added `PersonMatchResult` type with `extracted_name`, `matches[]`, `is_ambiguous`
  - Updated `TagAssignmentMatch` to use `PersonMatchResult[]`
  - Updated `JournalUpdateMatch` to use `PersonMatchResult`

- ✅ Updated `webclient/src/components/layout/ChatPanel.tsx`:
  - Fixed tag assignment handler to work with nested structure
  - Fixed journal entry handler to work with nested structure
  - Added proper display for ambiguous matches (shows all matches with warning)
  - Added proper display for no matches (shows "not found")
  - Disabled confirm button when matches are ambiguous
  - Removed deprecated `intent` field from Person edit form

### Next Steps
1. Deploy changes to staging and test with real data
2. Test all three scenarios:
   - Create duplicate people (should work)
   - Tag with unique name (should match and show single match)
   - Tag with ambiguous name (should show all matches with warning)
3. Rebuild Docker container to verify size reduction from removing ML dependencies

## API Response Structure

### Tag Assignment with Ambiguity
```json
{
  "intent": "UPDATE_TAG",
  "tag_assignments": [{
    "tag_name": "noisebridge",
    "operation": "add",
    "matched_people": [{
      "extracted_name": "john smith",
      "matches": [
        {"person_id": "uuid-1", "person_name": "John Smith", "similarity": 1.0},
        {"person_id": "uuid-2", "person_name": "John Smith", "similarity": 1.0}
      ],
      "is_ambiguous": true
    }]
  }]
}
```

### Journal Update with No Match
```json
{
  "intent": "UPDATE_JOURNAL",
  "journal_updates": [{
    "matched_person": {
      "extracted_name": "Michael",
      "matches": [],
      "is_ambiguous": false
    },
    "entry_content": "I saw Michael today",
    "parsed_date": "2025-10-19"
  }]
}
```

## Files Changed

### Backend (ML Removal)
- `api/requirements.txt` - removed sentence-transformers
- `api/ai/extractor.py` - replaced ML matching with string matching
- `api/routers/ai.py` - removed duplicate detection, added debug logging
- `api/test_ai_module.py` - updated tests for new behavior
- `api/ai/client.py` - no changes (still using Gemini)

### Frontend (Type Fix)
- `webclient/src/types/api.ts` - fixed types to match backend structure
- `webclient/src/components/layout/ChatPanel.tsx` - updated to handle nested match structure and ambiguity
- `plan/issue-chat-features-rid-of-ml.md` - updated documentation

## Testing Commands
```bash
# Test 1: Create duplicates (should work)
curl -X POST /api/ai/extract-people -d '{"narrative": "Met John Smith today"}'
curl -X POST /api/ai/extract-people -d '{"narrative": "Met John Smith from Google"}'

# Test 2: Tag with exact match (should find)
curl -X POST /api/ai/extract-people -d '{"narrative": "Tag john smith as friend"}'

# Test 3: Tag with ambiguous match (should return both)
curl -X POST /api/ai/extract-people -d '{"narrative": "Tag John Smith as noisebridge"}'

# Test 4: Verify no ML packages in container
docker exec <container> pip list | grep sentence  # Should be empty
```

## Open Questions
- Why is case-insensitive matching not finding "john smith" → "John Smith"?
- Should we add fuzzy matching (e.g., "Jon" → "John")?
- Should we log all name matching attempts for debugging?
