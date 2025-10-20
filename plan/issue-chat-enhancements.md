# Chat Enhancements: Tag Assignment & Journal Entries

**Goal:** Enhance the chat functionality to handle tag assignments and journal entries for existing people
**Timeline:** 3-5 days
**Complexity:** Medium
**Tech Stack:** Gemini AI, SQLModel, React

---

## Problem Statement

The current chat/AI system only handles creating new contacts. It rejects UPDATE intents with "Hmm, I can't help with that."

**Users cannot:**
- Assign tags to people via chat (e.g., "TJ, Jane, and Dali are all part of Noisebridge. Please add the tag.")
- Add journal entries for existing people (e.g., "I saw Michael Wu today. He went for a run in Golden Gate Park. He's dating. He tripped.")

**Current capabilities:**
- ✅ Detects CREATE intent and extracts new people
- ✅ Handles duplicate detection
- ✅ Creates NotebookEntry records for new people
- ❌ Rejects UPDATE intents
- ❌ Cannot add tags to people
- ❌ Cannot add journal entries to existing people

---

## User Stories

1. **As a user**, I want to add tags to multiple people in one message so I don't have to manually tag each person
2. **As a user**, I want to add journal entries about existing people when I see them so I can quickly record encounters
3. **As a user**, I want the system to match names to existing contacts so I don't have to specify exact names
4. **As a user**, I want to confirm ambiguous matches before they're saved to avoid errors
5. **As a user**, I want clear feedback on what was changed after my message is processed

---

## Current System Architecture

### Intent Detection (api/ai/prompts.py:4-51)
- Classifies messages as CREATE, READ, UPDATE, or NONE
- CREATE intent → extracts people and creates contacts
- UPDATE intent → currently rejected

### Entity Extraction (api/ai/extractor.py:95-131)
- Extracts PersonExtraction objects (name, attributes, email, phone)
- Uses Gemini AI with structured output

### Person Management (api/ai/extractor.py:134-307)
- Creates new Person records
- Handles duplicate detection via SentenceTransformer similarity (threshold: 0.85)
- Manages NotebookEntry creation

### API Endpoint (api/routers/ai.py:35-158)
- `/extract-people` endpoint processes narratives
- Returns ExtractionResponse with intent, people, duplicates, or rejection message

---

## Enhancement Plan

### Phase 1: Tag Assignment (Priority 1)

#### 1.1 Expand Intent Detection
**File:** `api/ai/prompts.py`

Add new sub-intents:
- `UPDATE_TAG_ADD` - Adding tags to people
- `UPDATE_TAG_REMOVE` - Removing tags from people
- `UPDATE_JOURNAL` - Adding journal entries

**Update `INTENT_DETECTION_PROMPT` with examples:**
```
Input: "TJ and Jane are part of Noisebridge. Add the tag."
Intent: UPDATE_TAG_ADD

Input: "I saw Michael today. He went for a run."
Intent: UPDATE_JOURNAL

Input: "Remove the 'Work' tag from Sarah"
Intent: UPDATE_TAG_REMOVE
```

#### 1.2 Create Tag Extraction System
**File:** `api/ai/extractor.py`

**New models:**
```python
class TagAssignment(BaseModel):
    """Extracted tag assignment from text."""
    people_names: List[str]  # ["TJ", "Jane", "Dali"]
    tag_name: str            # "Noisebridge"
    operation: str           # "add" or "remove"

class PersonMatch(BaseModel):
    """Result of matching extracted name to existing person."""
    extracted_name: str
    matched_person_id: Optional[UUID]
    matched_person_name: Optional[str]
    confidence: float
    requires_confirmation: bool
```

**New methods:**
```python
class PersonExtractor:
    def extract_tag_assignments(self, narrative: str) -> List[TagAssignment]:
        """Extract tag assignment operations from text."""
        # Use Gemini to parse:
        # - Which people are mentioned
        # - What tag should be added/removed
        # - Operation type (add/remove)
```

**New prompt:** `TAG_ASSIGNMENT_EXTRACTION_PROMPT`
```
Extract tag assignments from the user's message.

Examples:

Input: "TJ, Jane, and Dali are all part of Noisebridge. Please add the tag."
Output:
- people_names: ["TJ", "Jane", "Dali"]
  tag_name: "Noisebridge"
  operation: "add"

Input: "Remove Sarah and Tom from the Work tag"
Output:
- people_names: ["Sarah", "Tom"]
  tag_name: "Work"
  operation: "remove"
```

#### 1.3 Person Name Matching
**File:** `api/ai/extractor.py`

**New class:**
```python
class PersonMatcher:
    """Matches extracted names to existing people in database."""

    def __init__(self, session: Session, user_id: UUID):
        self.session = session
        self.user_id = user_id
        self.model = SentenceTransformer('all-mpnet-base-v2')

    def match_person(self, name: str) -> PersonMatch:
        """
        Match extracted name to existing person.

        Confidence levels:
        - >= 0.85: Auto-match
        - 0.70-0.85: Requires confirmation
        - < 0.70: No match found
        """
        # Use existing similarity logic from PersonManager.find_similar()
        # Return PersonMatch with confidence score
```

#### 1.4 Tag Operations Manager
**File:** `api/ai/extractor.py`

**New class:**
```python
class TagOperationsManager:
    """Manages tag assignment and removal operations."""

    def __init__(self, session: Session):
        self.session = session

    def assign_tags(
        self,
        person_ids: List[UUID],
        tag_name: str,
        user_id: UUID
    ) -> Tuple[Tag, List[Person]]:
        """
        Assign tag to multiple people.

        Steps:
        1. Get or create tag by name
        2. For each person, create PersonTag if doesn't exist
        3. Return tag and updated people
        """

    def remove_tags(
        self,
        person_ids: List[UUID],
        tag_name: str,
        user_id: UUID
    ) -> List[Person]:
        """
        Remove tag from multiple people.

        Steps:
        1. Find tag by name
        2. Delete PersonTag relationships
        3. Return updated people
        """
```

#### 1.5 Enhanced API Response
**File:** `api/routers/ai.py`

**Update `ExtractionResponse` model:**
```python
class TagAssignmentMatch(BaseModel):
    """Matched tag assignment ready for confirmation."""
    tag_name: str
    operation: str  # "add" or "remove"
    matched_people: List[PersonMatch]

class ExtractionResponse(BaseModel):
    intent: str
    message: Optional[str]

    # Existing fields for CREATE
    people: Optional[List[PersonExtraction]]
    duplicates: Optional[List[DuplicateWarning]]
    created_persons: Optional[List[dict]]

    # NEW: For tag operations
    tag_assignments: Optional[List[TagAssignmentMatch]]
    requires_confirmation: bool = False
```

**Update `/extract-people` endpoint flow:**
```python
# 1. Detect intent
intent = extractor.detect_intent(narrative)

# 2. Route based on intent
if intent == UPDATE_TAG_ADD or intent == UPDATE_TAG_REMOVE:
    # Extract tag assignments
    assignments = extractor.extract_tag_assignments(narrative)

    # Match people names to existing people
    matcher = PersonMatcher(db, user_id)
    matched_assignments = []

    for assignment in assignments:
        matched_people = [
            matcher.match_person(name)
            for name in assignment.people_names
        ]
        matched_assignments.append(TagAssignmentMatch(
            tag_name=assignment.tag_name,
            operation=assignment.operation,
            matched_people=matched_people
        ))

    # Check if any matches require confirmation
    requires_confirmation = any(
        match.requires_confirmation
        for assignment in matched_assignments
        for match in assignment.matched_people
    )

    return ExtractionResponse(
        intent=intent,
        tag_assignments=matched_assignments,
        requires_confirmation=requires_confirmation
    )
```

#### 1.6 Confirmation Endpoint
**File:** `api/routers/ai.py`

**New endpoint:**
```python
class ConfirmTagAssignmentRequest(BaseModel):
    """Request to confirm tag assignment."""
    tag_name: str
    operation: str  # "add" or "remove"
    person_ids: List[UUID]

@router.post("/confirm-tag-assignment")
async def confirm_tag_assignment(
    request: ConfirmTagAssignmentRequest,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id)
):
    """Execute confirmed tag assignment."""
    manager = TagOperationsManager(db)

    if request.operation == "add":
        tag, people = manager.assign_tags(
            request.person_ids,
            request.tag_name,
            user_id
        )
        return {
            "message": f"Added tag '{tag.name}' to {len(people)} people",
            "tag": tag,
            "people": people
        }
    elif request.operation == "remove":
        people = manager.remove_tags(
            request.person_ids,
            request.tag_name,
            user_id
        )
        return {
            "message": f"Removed tag '{request.tag_name}' from {len(people)} people",
            "people": people
        }
```

#### 1.7 Frontend Changes
**File:** `webclient/src/components/ChatPanel.tsx`

**New UI components:**

1. **Tag Assignment Confirmation Modal**
   - Shows: "Add tag 'Noisebridge' to:"
   - Lists matched people with confidence indicators:
     - ✅ TJ (100% match)
     - ⚠️ Jane Smith (85% match - is this correct?)
     - ❌ Dali (no match found - create new?)
   - Buttons: [Confirm] [Edit] [Cancel]

2. **Success Feedback**
   - Toast notification: "Added tag 'Noisebridge' to TJ, Jane, and Dali"
   - Update people list to show new tags

**New hooks:**
```typescript
// In api-hooks.ts
export function useConfirmTagAssignment() {
  return useMutation({
    mutationFn: async (request: ConfirmTagAssignmentRequest) => {
      const response = await apiClient.post('/ai/confirm-tag-assignment', request)
      return response.data
    },
    onSuccess: () => {
      // Invalidate people queries to refresh tags
      queryClient.invalidateQueries(['people'])
    }
  })
}
```

---

### Phase 2: Journal Entries (Priority 2)

#### 2.1 Journal Entry Extraction
**File:** `api/ai/extractor.py`

**New models:**
```python
class JournalUpdate(BaseModel):
    """Extracted journal entry for existing person."""
    person_name: str
    entry_content: str
    date: Optional[str] = None  # "today", "yesterday", or specific date

class JournalUpdateMatch(BaseModel):
    """Matched journal update ready for confirmation."""
    matched_person: PersonMatch
    entry_content: str
    parsed_date: str  # ISO format date
```

**New method:**
```python
class PersonExtractor:
    def extract_journal_entries(self, narrative: str) -> List[JournalUpdate]:
        """Extract journal entries about existing people."""
```

**New prompt:** `JOURNAL_ENTRY_EXTRACTION_PROMPT`
```
Extract journal entries about people from the user's message.

Examples:

Input: "I saw Michael Wu today. He went for a run in Golden Gate Park. He's dating. He tripped."
Output:
- person_name: "Michael Wu"
  entry_content: "went for a run in Golden Gate Park, is dating, tripped"
  date: "today"

Input: "Had coffee with Sarah yesterday. She mentioned her new job at Google."
Output:
- person_name: "Sarah"
  entry_content: "had coffee together, mentioned new job at Google"
  date: "yesterday"
```

#### 2.2 Date Parsing
**File:** `api/ai/extractor.py`

**New utility function:**
```python
def parse_relative_date(date_str: Optional[str]) -> str:
    """
    Parse relative dates to ISO format.

    Examples:
        "today" -> "2025-10-19"
        "yesterday" -> "2025-10-18"
        "2 days ago" -> "2025-10-17"
        "2025-10-15" -> "2025-10-15"
    """
    if not date_str or date_str.lower() == "today":
        return datetime.utcnow().date().isoformat()

    if date_str.lower() == "yesterday":
        return (datetime.utcnow().date() - timedelta(days=1)).isoformat()

    # Handle "X days ago"
    match = re.match(r'(\d+)\s+days?\s+ago', date_str.lower())
    if match:
        days = int(match.group(1))
        return (datetime.utcnow().date() - timedelta(days=days)).isoformat()

    # Try to parse as ISO date
    try:
        return datetime.fromisoformat(date_str).date().isoformat()
    except:
        return datetime.utcnow().date().isoformat()
```

#### 2.3 Journal Entry Manager
**File:** `api/ai/extractor.py`

**Enhance `PersonManager` class:**
```python
class PersonManager:
    # ... existing methods ...

    def add_journal_entry(
        self,
        person_id: UUID,
        content: str,
        date: str  # ISO format
    ) -> NotebookEntry:
        """
        Add journal entry for a person on a specific date.

        Steps:
        1. Get or create NotebookEntry for the date
        2. Append content (with newline if entry exists)
        3. Update last_contact_date on Person if date is today
        4. Return updated entry
        """
        # Get or create entry for date
        statement = select(NotebookEntry).where(
            NotebookEntry.person_id == person_id,
            NotebookEntry.entry_date == date
        )
        entry = self.session.exec(statement).first()

        person = self.session.get(Person, person_id)

        if not entry:
            entry = NotebookEntry(
                person_id=person_id,
                user_id=person.user_id,
                entry_date=date,
                content=content
            )
        else:
            # Append to existing entry
            if entry.content:
                entry.content = f"{entry.content}\n{content}"
            else:
                entry.content = content

        entry.updated_at = datetime.utcnow()
        self.session.add(entry)

        # Update last_contact_date if entry is for today
        if date == datetime.utcnow().date().isoformat():
            person.last_contact_date = datetime.utcnow()
            self.session.add(person)

        self.session.commit()
        self.session.refresh(entry)

        return entry
```

#### 2.4 API Endpoint Updates
**File:** `api/routers/ai.py`

**Update `ExtractionResponse`:**
```python
class ExtractionResponse(BaseModel):
    # ... existing fields ...

    # NEW: For journal entries
    journal_updates: Optional[List[JournalUpdateMatch]]
```

**Update `/extract-people` endpoint:**
```python
elif intent == UPDATE_JOURNAL:
    # Extract journal entries
    entries = extractor.extract_journal_entries(narrative)

    # Match people
    matcher = PersonMatcher(db, user_id)
    matched_updates = []

    for entry in entries:
        matched_person = matcher.match_person(entry.person_name)
        parsed_date = parse_relative_date(entry.date)

        matched_updates.append(JournalUpdateMatch(
            matched_person=matched_person,
            entry_content=entry.entry_content,
            parsed_date=parsed_date
        ))

    requires_confirmation = any(
        update.matched_person.requires_confirmation
        for update in matched_updates
    )

    return ExtractionResponse(
        intent=intent,
        journal_updates=matched_updates,
        requires_confirmation=requires_confirmation
    )
```

**New confirmation endpoint:**
```python
class ConfirmJournalEntryRequest(BaseModel):
    person_id: UUID
    content: str
    date: str  # ISO format

@router.post("/confirm-journal-entry")
async def confirm_journal_entry(
    request: ConfirmJournalEntryRequest,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id)
):
    """Execute confirmed journal entry."""
    manager = PersonManager(db)
    entry = manager.add_journal_entry(
        request.person_id,
        request.content,
        request.date
    )

    return {
        "message": f"Added journal entry for {entry.person.name}",
        "entry": entry
    }
```

#### 2.5 Frontend Changes
**File:** `webclient/src/components/ChatPanel.tsx`

**New UI components:**

1. **Journal Entry Confirmation Modal**
   - Shows: "Add journal entry for:"
   - Person: Michael Wu (95% match)
   - Date: Today (October 19, 2025) [editable]
   - Content: "went for a run in Golden Gate Park, is dating, tripped"
   - Buttons: [Confirm] [Edit] [Cancel]

2. **Success Feedback**
   - Toast: "Added journal entry for Michael Wu"
   - Navigate to person's profile to show new entry

---

### Phase 3: Advanced Features (Priority 3)

#### 3.1 Multi-Operation Messages
Handle messages with multiple operations:
- "I saw Sarah today. Add her to the 'Friends' tag. She mentioned she's moving to Seattle."
  - UPDATE_JOURNAL + UPDATE_TAG

#### 3.2 Batch Operations Feedback
Better UI for bulk operations:
- "Added tag 'Conference' to 12 people"
- Show list of affected people

#### 3.3 Undo Functionality
Allow users to undo recent operations:
- Store operation history
- "Undo: Remove tag assignment"

#### 3.4 Smart Tag Suggestions
Suggest tags based on context:
- "I saw Sarah at the climbing gym" → Suggest "Climbing" tag

---

## Technical Decisions

### Why Enhance Existing Intent System?
- ✅ Reuses existing Gemini AI infrastructure
- ✅ Consistent with current extraction patterns
- ✅ Minimal architectural changes

### Why Use Fuzzy Matching for Names?
- ✅ Users don't need exact names ("Michael" vs "Michael Wu")
- ✅ Existing SentenceTransformer already loaded
- ✅ Confidence scores allow user confirmation

### Why Confirmation Step?
- ✅ Prevents accidental tag assignments
- ✅ Allows correction of fuzzy matches
- ✅ Builds user trust in AI operations

### Tag Auto-Creation vs Manual?
- **Decision:** Auto-create tags that don't exist
- **Rationale:** Reduces friction, matches user mental model
- **Alternative:** Could prompt "Tag 'Noisebridge' doesn't exist. Create it?"

---

## Testing Strategy

### Unit Tests
**File:** `api/test_ai_extraction.py`

```python
def test_extract_tag_assignments():
    """Test tag assignment extraction."""
    extractor = PersonExtractor()

    narrative = "TJ, Jane, and Dali are all part of Noisebridge. Please add the tag."
    assignments = extractor.extract_tag_assignments(narrative)

    assert len(assignments) == 1
    assert assignments[0].tag_name == "Noisebridge"
    assert set(assignments[0].people_names) == {"TJ", "Jane", "Dali"}
    assert assignments[0].operation == "add"

def test_extract_journal_entries():
    """Test journal entry extraction."""
    extractor = PersonExtractor()

    narrative = "I saw Michael Wu today. He went for a run in Golden Gate Park."
    entries = extractor.extract_journal_entries(narrative)

    assert len(entries) == 1
    assert entries[0].person_name == "Michael Wu"
    assert "Golden Gate Park" in entries[0].entry_content
    assert entries[0].date == "today"

def test_person_matching():
    """Test fuzzy person matching."""
    # Setup: Create person "Michael Wu"
    matcher = PersonMatcher(db, user_id)

    # Should match "Michael" to "Michael Wu"
    match = matcher.match_person("Michael")
    assert match.confidence >= 0.85
    assert match.matched_person_name == "Michael Wu"
```

### Integration Tests
**File:** `api/test_ai_integration.py`

```python
def test_tag_assignment_flow():
    """Test full tag assignment flow."""
    # 1. Extract
    response = client.post("/ai/extract-people", json={
        "narrative": "TJ and Jane are part of Noisebridge. Add the tag."
    })
    assert response.json()["intent"] == "UPDATE_TAG_ADD"
    assert len(response.json()["tag_assignments"]) == 1

    # 2. Confirm
    person_ids = [match["matched_person_id"] for match in response.json()["tag_assignments"][0]["matched_people"]]
    confirm_response = client.post("/ai/confirm-tag-assignment", json={
        "tag_name": "Noisebridge",
        "operation": "add",
        "person_ids": person_ids
    })
    assert "Added tag" in confirm_response.json()["message"]

    # 3. Verify
    for person_id in person_ids:
        person = client.get(f"/people/{person_id}")
        assert any(tag["name"] == "Noisebridge" for tag in person.json()["tags"])
```

### Edge Cases
1. **Person name matching:**
   - Multiple people with same name
   - No match found
   - Very low confidence match

2. **Tag operations:**
   - Tag already assigned to person
   - Tag doesn't exist (create it)
   - Empty people list

3. **Date parsing:**
   - "2 weeks ago"
   - Future dates
   - Invalid date formats

4. **Multiple operations:**
   - Message with both tag assignment and journal entry
   - Multiple tag assignments in one message

---

## Success Metrics

After implementation, users should be able to:
- ✅ Add tags to multiple people in one natural language message
- ✅ Add journal entries to existing people with natural language
- ✅ Use partial names that fuzzy match to existing people
- ✅ Confirm ambiguous matches before they're saved
- ✅ Receive clear feedback on what operations were performed
- ✅ See updated tags and journal entries immediately in the UI

---

## Migration Considerations

**No database migrations required** - all existing tables support these features:
- `PersonTag` table already exists for tag assignments
- `NotebookEntry` table already exists for journal entries
- `Tag` table already exists with user_id scoping

---

## Timeline Estimate

**Phase 1: Tag Assignment**
- Day 1: Intent detection + tag extraction prompts
- Day 2: Person matching + TagOperationsManager
- Day 3: API endpoint updates + frontend confirmation UI
- **Total: 3 days**

**Phase 2: Journal Entries**
- Day 4: Journal extraction prompts + date parsing
- Day 5: API updates + frontend UI
- **Total: 2 days**

**Phase 3: Advanced Features** (Optional)
- Day 6-7: Multi-operation support + undo + polish
- **Total: 2 days**

**Overall: 3-7 days** depending on scope

---

## Open Questions

1. **Auto-create tags?** Or prompt user to create first?
   - **Recommendation:** Auto-create for better UX

2. **Confidence threshold for auto-match?**
   - Current: 0.85 for duplicates
   - **Recommendation:** Same 0.85 for auto-match, 0.70-0.85 for confirmation

3. **How to handle "I saw Sarah and Tom today"?**
   - Create separate journal entries for each?
   - Create one shared entry?
   - **Recommendation:** Separate entries for clarity

4. **Support tag removal in Phase 1?**
   - **Recommendation:** Yes, minimal extra work

5. **Should journal entries update last_contact_date?**
   - **Recommendation:** Yes, if entry date is today

---

## Future Enhancements (Post-MVP)

- Support for tag categories in natural language ("Add work tag")
- Bulk import from messages ("I met these 10 people at the conference...")
- Voice input support
- Smart suggestions ("Did you mean to add the 'Work' tag?")
- Context awareness (remember previous conversation)
- Photo upload + OCR for business cards

---

_This follows the YAGNI philosophy: start with core tag and journal functionality, validate with users, then iterate based on feedback._
