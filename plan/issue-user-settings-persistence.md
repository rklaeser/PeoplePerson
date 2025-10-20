# User Settings Persistence

## Problem

Currently, user settings are stored only in browser localStorage via Zustand persist middleware. This means:

- Settings don't sync across devices/browsers
- Settings are lost if browser data is cleared
- Users can't access their preferences on different computers

**Current Settings:**
- `assistantName`: 'Scout' | 'Nico' - Animal guide choice
- `defaultLocation`: {city, state, lat, lng} - Default map location
- `theme`: 'light' | 'dark' | 'system' - UI theme preference
- `viewMode`: 'list' | 'table' | 'map' - Default view mode

**Storage:** `localStorage` key: `peopleperson-ui-store`

---

## Current Status

✅ **Working**: Settings persist in browser localStorage
❌ **Missing**: Cross-device synchronization
❌ **Missing**: Backend persistence

---

## Proposed Solution

### Backend Changes

#### 1. Update User Model (`api/models.py`)

Add a `settings` JSON field to the User model:

```python
class User(SQLModel, table=True):
    __tablename__ = "users"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    firebase_uid: str = Field(unique=True, index=True)
    name: str | None = None
    email: str | None = Field(default=None, unique=True, index=True)
    email_verified: datetime | None = None
    image: str | None = None
    settings: dict | None = Field(default_factory=dict, sa_column=Column(JSON))  # NEW
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
```

#### 2. Settings Schema (`api/models.py`)

Create a Pydantic schema for validation:

```python
from pydantic import BaseModel

class LocationSettings(BaseModel):
    city: str
    state: str
    lat: float
    lng: float

class UserSettings(BaseModel):
    assistantName: Literal['Scout', 'Nico'] = 'Scout'
    defaultLocation: LocationSettings | None = None
    theme: Literal['light', 'dark', 'system'] = 'system'
    viewMode: Literal['list', 'table', 'map'] = 'list'
```

#### 3. Settings API Endpoints (`api/routers/settings.py`)

Create new router:

```python
from fastapi import APIRouter, Depends
from api.auth import get_current_user

router = APIRouter(prefix="/api/settings", tags=["settings"])

@router.get("")
async def get_settings(current_user: User = Depends(get_current_user)):
    """Get user settings"""
    return current_user.settings or {}

@router.patch("")
async def update_settings(
    settings: dict,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Update user settings (partial update)"""
    current_settings = current_user.settings or {}
    updated_settings = {**current_settings, **settings}

    current_user.settings = updated_settings
    current_user.updated_at = datetime.now()
    session.add(current_user)
    session.commit()
    session.refresh(current_user)

    return current_user.settings
```

#### 4. Database Migration

Add migration to add `settings` JSONB column:

```sql
ALTER TABLE users ADD COLUMN settings JSONB DEFAULT '{}';
```

---

### Frontend Changes

#### 1. Create Settings API Hooks (`webclient/src/hooks/api-hooks.ts`)

```typescript
export function useUserSettings() {
  return useQuery({
    queryKey: ['userSettings'],
    queryFn: async () => {
      const response = await apiClient.get('/settings')
      return response.data
    },
  })
}

export function useUpdateSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (settings: Partial<UserSettings>) => {
      const response = await apiClient.patch('/settings', settings)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userSettings'] })
    },
  })
}
```

#### 2. Update UI Store (`webclient/src/stores/ui-store.ts`)

Add backend sync capability:

```typescript
export interface UIStore {
  // ... existing fields ...

  // Sync methods
  syncFromBackend: (settings: Partial<UserSettings>) => void
  syncToBackend: (settings: Partial<UserSettings>) => Promise<void>
}
```

#### 3. Settings Sync Component (`webclient/src/components/SettingsSync.tsx`)

Create a component to handle sync:

```typescript
export function SettingsSync() {
  const { data: backendSettings, isLoading } = useUserSettings()
  const { mutateAsync: updateSettings } = useUpdateSettings()
  const {
    assistantName,
    defaultLocation,
    theme,
    viewMode,
    setAssistantName,
    setDefaultLocation,
    setTheme,
    setViewMode
  } = useUIStore()

  // On load: merge backend settings with local
  useEffect(() => {
    if (backendSettings) {
      // Backend takes precedence
      if (backendSettings.assistantName) setAssistantName(backendSettings.assistantName)
      if (backendSettings.defaultLocation) setDefaultLocation(backendSettings.defaultLocation)
      if (backendSettings.theme) setTheme(backendSettings.theme)
      if (backendSettings.viewMode) setViewMode(backendSettings.viewMode)
    }
  }, [backendSettings])

  // Debounced sync to backend when important settings change
  useEffect(() => {
    const timeout = setTimeout(() => {
      updateSettings({
        assistantName,
        defaultLocation,
        theme,
        viewMode
      })
    }, 1000) // Debounce 1 second

    return () => clearTimeout(timeout)
  }, [assistantName, defaultLocation, theme, viewMode])

  return null // No UI needed
}
```

#### 4. Add to Main App (`webclient/src/main.tsx`)

```typescript
if (user) {
  return (
    <>
      <SettingsSync /> {/* Add this */}
      <RouterProvider router={router} />
      <ReactQueryDevtools initialIsOpen={false} />
    </>
  )
}
```

---

## Implementation Strategy

### Hybrid Approach
- **localStorage**: Keep for instant reads and offline functionality
- **Backend**: Persist for cross-device sync
- **Sync Flow**:
  1. User logs in → Fetch from backend
  2. Merge with localStorage (backend wins conflicts)
  3. User changes setting → Update localStorage immediately + debounced backend sync
  4. Offline → Queue updates, sync when back online

### Migration Path
1. Deploy backend changes first (add column, API endpoints)
2. Deploy frontend changes (hooks, sync component)
3. On first login after update: Push localStorage settings to backend
4. Future logins: Backend settings take precedence

### Settings to Sync
- ✅ `assistantName` - Important (follows user across devices)
- ✅ `defaultLocation` - Important (follows user across devices)
- ✅ `theme` - Important (follows user across devices)
- ✅ `viewMode` - Important (follows user across devices)
- ❌ `sidebarCollapsed` - UI state (keep localStorage only)
- ❌ `rightPanelWidth` - UI state (keep localStorage only)
- ❌ `chatPanelOpen` - UI state (keep localStorage only)

---

## Benefits

1. **Cross-device consistency**: Same animal guide and preferences everywhere
2. **Better UX**: Settings survive browser data clearing
3. **User expectations**: Modern apps sync settings
4. **Future-proof**: Easy to add new settings
5. **Simple implementation**: JSON field is flexible and easy to maintain

---

## Alternatives Considered

### Separate UserSettings Table
- **Pros**: Better normalization, typed fields, easier migrations
- **Cons**: More complex, requires joins, overkill for simple settings
- **Decision**: JSON field is simpler and sufficient for our needs

### Keep localStorage Only
- **Pros**: No backend work, simpler
- **Cons**: Settings don't follow users, poor UX
- **Decision**: Not acceptable for important preferences like animal guide

### Use Firebase Remote Config
- **Pros**: Built-in sync, free tier available
- **Cons**: Adds dependency, requires additional setup, less control
- **Decision**: Keep everything in our own backend for consistency

---

## Estimated Effort

- Backend changes: **2-3 hours**
- Frontend changes: **2-3 hours**
- Testing: **1-2 hours**
- **Total: ~1 day**

---

## Priority

**Medium** - Not critical for launch, but improves UX significantly. Implement when:
- Multiple users are using the app regularly
- Users report losing settings
- Adding more important preferences that should sync
