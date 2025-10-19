# Notebook Entries Feature

## Overview
Transform the current single "notes" field into a dated notebook system where each person has multiple timestamped entries. This enables tracking of interactions and thoughts over time.

## User Requirements
- Notes should be date-based entries in a notebook
- Can add new entries or edit existing ones
- When AI creates/updates a person, it should create or append to today's entry
- If AI determines it's an update with no profile changes, just add a note
- Entries should be fully editable
- Display newest first (reverse chronological)

## User Preferences (from discussion)
- **Migration**: Migrate existing `body` notes into the first notebook entry
- **AI behavior**: Append to today's entry if one exists, otherwise create new
- **Editing**: Fully editable, no history tracking needed
- **Display order**: Newest first (reverse chronological)

---

## Implementation Plan

### 1. Backend - Database Model (api/models.py)

#### New Model: NotebookEntry
```python
class NotebookEntryBase(SQLModel):
    entry_date: str  # YYYY-MM-DD format
    content: str

class NotebookEntry(NotebookEntryBase, table=True):
    __tablename__ = "notebook_entries"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    person_id: UUID = Field(foreign_key="people.id")
    user_id: UUID = Field(foreign_key="users.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    person: Person = Relationship(back_populates="notebook_entries")
    user: User = Relationship(back_populates="notebook_entries")

# Pydantic schemas
class NotebookEntryCreate(NotebookEntryBase):
    pass

class NotebookEntryUpdate(SQLModel):
    entry_date: Optional[str] = None
    content: Optional[str] = None

class NotebookEntryRead(NotebookEntryBase):
    id: UUID
    person_id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
```

#### Update Person Model
- Add relationship: `notebook_entries: List["NotebookEntry"] = Relationship(back_populates="person", cascade_delete=True)`

#### Update User Model
- Add relationship: `notebook_entries: List["NotebookEntry"] = Relationship(back_populates="user", cascade_delete=True)`

### 2. Backend - Database Migration

Create migration script to:
1. Create `notebook_entries` table
2. Migrate existing `Person.body` data:
   ```sql
   INSERT INTO notebook_entries (id, person_id, user_id, entry_date, content, created_at, updated_at)
   SELECT
     gen_random_uuid(),
     id,
     user_id,
     DATE(created_at),
     body,
     created_at,
     created_at
   FROM people
   WHERE body IS NOT NULL AND body != 'Add a description';
   ```
3. Keep `Person.body` field temporarily for backward compatibility

### 3. Backend - API Routes

Create new router file `api/routers/notebook.py`:

```python
@router.get("/api/people/{person_id}/notebook", response_model=List[NotebookEntryRead])
async def get_notebook_entries(
    person_id: UUID,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id)
)
# Returns entries ordered by entry_date DESC (newest first)

@router.post("/api/people/{person_id}/notebook", response_model=NotebookEntryRead)
async def create_notebook_entry(
    person_id: UUID,
    entry: NotebookEntryCreate,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id)
)

@router.put("/api/people/{person_id}/notebook/{entry_id}", response_model=NotebookEntryRead)
async def update_notebook_entry(
    person_id: UUID,
    entry_id: UUID,
    entry_update: NotebookEntryUpdate,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id)
)

@router.delete("/api/people/{person_id}/notebook/{entry_id}")
async def delete_notebook_entry(
    person_id: UUID,
    entry_id: UUID,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id)
)
```

### 4. Backend - AI Integration (api/ai/extractor.py)

#### Update PersonManager class:

```python
def get_or_create_today_entry(
    self,
    person_id: UUID,
    user_id: UUID
) -> NotebookEntry:
    """Get today's entry or create if doesn't exist."""
    today = datetime.utcnow().date().isoformat()

    statement = select(NotebookEntry).where(
        NotebookEntry.person_id == person_id,
        NotebookEntry.entry_date == today
    )
    entry = self.session.exec(statement).first()

    if not entry:
        entry = NotebookEntry(
            person_id=person_id,
            user_id=user_id,
            entry_date=today,
            content=""
        )
        self.session.add(entry)
        self.session.commit()
        self.session.refresh(entry)

    return entry

def create_person(self, extraction: PersonExtraction, user_id: UUID) -> Person:
    """Create person and initial notebook entry."""
    person = Person(
        name=extraction.name,
        body="",  # Deprecated, use notebook instead
        user_id=user_id,
        intent="new",
        email=extraction.email,
        phone_number=extraction.phone_number
    )

    self.session.add(person)
    self.session.commit()
    self.session.refresh(person)

    # Create first notebook entry if attributes exist
    if extraction.attributes:
        today = datetime.utcnow().date().isoformat()
        entry = NotebookEntry(
            person_id=person.id,
            user_id=user_id,
            entry_date=today,
            content=extraction.attributes
        )
        self.session.add(entry)
        self.session.commit()

    return person

def link_to_existing(self, extraction: PersonExtraction, existing_id: UUID) -> Person:
    """Link to existing person by appending to today's entry."""
    person = self.session.get(Person, existing_id)
    if not person:
        raise ValueError(f"Person with id {existing_id} not found")

    # Get or create today's entry
    entry = self.get_or_create_today_entry(existing_id, person.user_id)

    # Append new attributes
    if extraction.attributes:
        if entry.content:
            entry.content = f"{entry.content}\n{extraction.attributes}"
        else:
            entry.content = extraction.attributes

        self.session.add(entry)
        self.session.commit()

    # Update phone if provided and not set
    if extraction.phone_number and not person.phone_number:
        person.phone_number = extraction.phone_number
        self.session.add(person)
        self.session.commit()

    self.session.refresh(person)
    return person
```

### 5. Frontend - TypeScript Types (webclient/src/types/api.ts)

```typescript
export interface NotebookEntry {
  id: string
  person_id: string
  user_id: string
  entry_date: string  // YYYY-MM-DD
  content: string
  created_at: string
  updated_at: string
}

export interface NotebookEntryCreate {
  entry_date: string
  content: string
}

export interface NotebookEntryUpdate {
  entry_date?: string
  content?: string
}
```

### 6. Frontend - API Client (webclient/src/lib/api-client.ts)

```typescript
// Notebook
async getNotebookEntries(personId: string): Promise<NotebookEntry[]> {
  const response = await apiClient.get(`/api/people/${personId}/notebook`)
  return response.data
},

async createNotebookEntry(personId: string, data: NotebookEntryCreate): Promise<NotebookEntry> {
  const response = await apiClient.post(`/api/people/${personId}/notebook`, data)
  return response.data
},

async updateNotebookEntry(personId: string, entryId: string, data: NotebookEntryUpdate): Promise<NotebookEntry> {
  const response = await apiClient.put(`/api/people/${personId}/notebook/${entryId}`, data)
  return response.data
},

async deleteNotebookEntry(personId: string, entryId: string): Promise<void> {
  await apiClient.delete(`/api/people/${personId}/notebook/${entryId}`)
}
```

### 7. Frontend - React Hooks (webclient/src/hooks/api-hooks.ts)

```typescript
export const queryKeys = {
  // ... existing keys
  notebookEntries: (personId: string) => ['notebook', personId] as const,
}

export const useNotebookEntries = (personId: string) => {
  return useQuery({
    queryKey: queryKeys.notebookEntries(personId),
    queryFn: () => api.getNotebookEntries(personId),
    enabled: !!personId,
    staleTime: 30 * 1000,
  })
}

export const useCreateNotebookEntry = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ personId, data }: { personId: string; data: NotebookEntryCreate }) =>
      api.createNotebookEntry(personId, data),
    onSuccess: (_, { personId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notebookEntries(personId) })
    },
  })
}

export const useUpdateNotebookEntry = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ personId, entryId, data }: { personId: string; entryId: string; data: NotebookEntryUpdate }) =>
      api.updateNotebookEntry(personId, entryId, data),
    onSuccess: (_, { personId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notebookEntries(personId) })
    },
  })
}

export const useDeleteNotebookEntry = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ personId, entryId }: { personId: string; entryId: string }) =>
      api.deleteNotebookEntry(personId, entryId),
    onSuccess: (_, { personId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notebookEntries(personId) })
    },
  })
}
```

### 8. Frontend - Profile UI (webclient/src/components/layout/PersonProfile.tsx)

Replace the Notes section with a Notebook section:

```typescript
// Component state
const [editingEntryId, setEditingEntryId] = useState<string | null>(null)
const [editingContent, setEditingContent] = useState('')
const [editingDate, setEditingDate] = useState('')

const { data: entries = [], isLoading: entriesLoading } = useNotebookEntries(personId)
const createEntry = useCreateNotebookEntry()
const updateEntry = useUpdateNotebookEntry()
const deleteEntry = useDeleteNotebookEntry()

// JSX
<div className="bg-card border border-border rounded-lg p-4">
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-lg font-semibold">Notebook</h2>
    <Button
      variant="outline"
      size="sm"
      onClick={() => handleNewEntry()}
    >
      <Plus size={16} className="mr-2" />
      New Entry
    </Button>
  </div>

  {entriesLoading ? (
    <div>Loading entries...</div>
  ) : entries.length === 0 ? (
    <p className="text-muted-foreground text-center py-8">
      No entries yet. Click "New Entry" to add one.
    </p>
  ) : (
    <div className="space-y-4">
      {entries.map(entry => (
        <div key={entry.id} className="border rounded-lg p-3">
          {editingEntryId === entry.id ? (
            // Edit mode
            <div className="space-y-2">
              <Input
                type="date"
                value={editingDate}
                onChange={(e) => setEditingDate(e.target.value)}
              />
              <Textarea
                value={editingContent}
                onChange={(e) => setEditingContent(e.target.value)}
                className="min-h-[100px]"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleSaveEntry(entry.id)}>
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditingEntryId(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            // View mode
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">
                  {new Date(entry.entry_date).toLocaleDateString()}
                </span>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEditEntry(entry)}
                  >
                    <Edit size={14} />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteEntry(entry.id)}
                  >
                    <Trash size={14} />
                  </Button>
                </div>
              </div>
              <p className="text-sm whitespace-pre-wrap">{entry.content}</p>
            </>
          )}
        </div>
      ))}
    </div>
  )}
</div>
```

---

## Testing Checklist

### Backend
- [ ] Create notebook_entries table via migration
- [ ] Migrate existing Person.body data to notebook entries
- [ ] Test GET /api/people/{id}/notebook returns entries newest first
- [ ] Test POST creates new entry with today's date
- [ ] Test PUT updates entry content and/or date
- [ ] Test DELETE removes entry
- [ ] Test AI creates notebook entry when creating person
- [ ] Test AI appends to today's entry when linking to existing person
- [ ] Test AI creates new entry when no entry exists for today

### Frontend
- [ ] Notebook entries display newest first
- [ ] "New Entry" button creates entry with today's date
- [ ] Can edit entry date and content inline
- [ ] Can delete entries
- [ ] Empty state shows when no entries exist
- [ ] Cache invalidates properly after create/update/delete
- [ ] UI updates when AI creates/updates entries

---

## Migration Strategy

1. **Phase 1**: Backend implementation
   - Create models and migration
   - Migrate existing data
   - Add API routes
   - Update AI integration

2. **Phase 2**: Frontend implementation
   - Add types and API client methods
   - Add React hooks
   - Update PersonProfile UI

3. **Phase 3**: Deprecation (future)
   - Remove Person.body field from API responses
   - Remove body from frontend forms
   - Clean up database schema

---

## Notes

- Keep Person.body field initially for backward compatibility
- Notebook entries are scoped to person_id and user_id for security
- entry_date stored as string (YYYY-MM-DD) for simplicity
- AI always works with today's date for new entries
- Future enhancement: Add tags/categories to entries
