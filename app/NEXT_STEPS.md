# PeoplePerson SvelteKit - Next Steps

## Current State (2025-10-29)

### ✅ Completed Features

#### Core Infrastructure
- **Firebase Integration**: Full Firebase Auth + Firestore setup
- **Data Migration**: Successfully migrated 6 users, 32 people, 3 tags, 30 memories from PostgreSQL (staging) to Firestore
- **Authentication**: Sign in, sign up, Google OAuth working
- **Server Hooks**: Auth middleware in `hooks.server.ts` extracts Firebase token and adds user to `locals`

#### UI Components & Layout
- **Tri-fold Collapsible Sidebar**: Icon-only (64px) that expands to 240px on hover
  - Navigation: Home 🏠, Table 📊, Map 🗺️
  - Bottom section: Settings ⚙️ and Account with sign-out
  - Auto-collapses on mouse leave and after navigation
  - Active state highlighting
- **3-Pane Home View** (`/people`):
  - Narrow sidebar (navigation)
  - People list panel (384px) with search and tag filtering
  - Person detail panel (flexible width)

#### People Management
- **People List**:
  - Search functionality (debounced)
  - Tag filtering (multi-select with AND logic)
  - "Add Person" creates auto-numbered names ("New Person", "New Person 1", etc.)
  - Person cards show:
    - Avatar with initials (color-coded)
    - Name, description preview
    - Up to 3 tags (colored badges) + "+X" indicator
    - Last contact date, location
- **Person Detail Panel**:
  - 3 tabs: Profile, Memories, Messages
  - Auto-save on blur for all fields
  - Delete person button (with confirmation)

#### Profile Tab
- **Tags section** (at top):
  - Autocomplete search to add tags
  - Display tags with colors
  - Remove tags with X button
  - "Manage Tags" button → TagManager modal
- **Description**: Editable textarea
- **Contact Information**:
  - Phone, street address, city/state/zip, birthday, email
  - All auto-save on blur
- **Memory Aid/Mnemonic**: Textarea for memorable facts
- **Metadata**: Last contact, created, updated dates

#### Memories Tab
- List all memories sorted by date
- "+ Add Memory" button (top of list and when empty)
- Inline editing: hover to show edit/delete buttons
- AddMemoryModal: Date picker + content textarea
- Full CRUD: Create, edit, delete memories

#### Messages Tab
- Display messages (inbound/outbound)
- No send functionality yet (placeholder)

#### Tag Management
- **TagManager Modal**:
  - Create tags with name, color (8 color options), category
  - Edit tags inline
  - Delete tags (removes from all people)
  - Shows person count per tag
- **API Endpoints**:
  - `GET /api/tags` - List all tags
  - `POST /api/tags/create` - Create tag
  - `GET/PATCH/DELETE /api/tags/[id]` - Get/update/delete tag
  - `POST/DELETE /api/people/[id]/tags` - Add/remove tag from person

### 🚧 Placeholder Pages
- `/table` - "This view will be implemented soon"
- `/map` - "This view will be implemented soon"
- `/settings` - "Settings will go here"

---

## 📋 Next Priorities

### 1. Table View (`/table`)
**Goal**: Spreadsheet-style view of all people with sortable columns

**Implementation Plan**:
- Create table component with columns:
  - Name (with avatar)
  - Tags (badge display)
  - Email
  - Phone
  - City, State
  - Last Contact
  - Created Date
- Features:
  - Sortable columns (click header to sort)
  - Row selection (checkbox)
  - Bulk actions (add tags, delete)
  - Click row to open PersonPanel (slide-in from right)
  - Export to CSV button
- Use existing API endpoints (`/api/people`)
- Consider using a data table library like TanStack Table

**Files to Create**:
- `src/lib/components/PeopleTable.svelte`
- Update `src/routes/table/+page.svelte`

### 2. Map View (`/map`)
**Goal**: Interactive map showing contacts by location

**Implementation Plan**:
- Integrate mapping library (Leaflet or Mapbox)
- Filter people with valid lat/long or city/state
- Features:
  - Markers for each person (color-coded by tags?)
  - Cluster markers when zoomed out
  - Click marker to show person card (popup or side panel)
  - Filter by tags (reuse existing tag filter component)
  - Geocode addresses that don't have lat/long yet
- API: May need geocoding service (Google Maps API or Nominatim)

**Files to Create**:
- `src/lib/components/PeopleMap.svelte`
- Update `src/routes/map/+page.svelte`
- Consider: Add geocoding helper functions

**Dependencies to Add**:
```bash
npm install leaflet
npm install -D @types/leaflet
```

### 3. Settings Page (`/settings`)
**Goal**: User preferences and account settings

**Implementation Plan**:
- Sections:
  - **Account**: Display name, email, change password, delete account
  - **Theme**: Dark/light mode toggle (implement with Tailwind dark mode)
  - **Notifications**: Email preferences (future feature)
  - **Data**: Export all data, import data
  - **About**: App version, privacy policy, terms of service
- Create settings store for persisting preferences to localStorage

**Files to Create**:
- `src/lib/stores/settings.svelte.ts`
- Update `src/routes/settings/+page.svelte`
- Add theme toggle functionality

### 4. Messages/SMS Integration
**Goal**: Send and receive SMS messages via Twilio

**Current State**: Twilio secrets exist in terraform but not integrated

**Implementation Plan**:
- Server-side Twilio integration:
  - Create `/api/messages/send` endpoint
  - Webhook endpoint `/api/messages/webhook` for incoming messages
  - Store messages in Firestore (already have Message type)
- UI updates:
  - "Send Message" button in Messages tab
  - Message composer (textarea + send button)
  - Real-time message updates (consider Firestore listeners)
  - Message status indicators (sent, delivered, failed)

**Files to Create**:
- `src/lib/server/twilio.ts` - Twilio client wrapper
- `src/routes/api/messages/send/+server.ts`
- `src/routes/api/messages/webhook/+server.ts`
- Update `PersonPanel.svelte` Messages tab

**Secrets Needed** (already in terraform):
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`

### 5. "Mark as Contacted" Quick Action
**Goal**: One-click to update lastContactDate

**Implementation Plan**:
- Add button back (removed Quick Actions section)
- Options:
  - Button in PersonPanel header (next to delete)
  - Button in each person card
  - Keyboard shortcut (e.g., Cmd+K)
- Updates `lastContactDate` to now
- Show toast notification "Marked as contacted"
- Refresh person data

**Files to Update**:
- `PersonPanel.svelte` or `PersonCard.svelte`
- Create toast notification component

---

## 🐛 Known Issues

1. **Accessibility Warnings**: Missing `aria-label` on icon-only buttons
   - Add labels to all icon buttons for screen readers
   - Add keyboard handlers to modal overlays

2. **No Error Handling UI**: Errors only logged to console
   - Create toast/notification system
   - Show user-friendly error messages

3. **No Loading States**: Some actions don't show loading indicators
   - Add skeleton loaders for lists
   - Add spinners for async actions

4. **No Pagination**: People list loads all people
   - Implement virtual scrolling or pagination
   - Backend already supports `limit` and `startAfter` params

5. **Tag Colors Not Persistent**: Colors generated client-side in PersonCard
   - Already stored in Firestore, just need to fetch and pass to component
   - Fixed in PersonPanel, need to apply to PersonCard

---

## 🎨 UI/UX Improvements

1. **Keyboard Shortcuts**:
   - Add keyboard navigation (arrow keys in lists)
   - Common actions (Cmd+K for search, Cmd+N for new person, etc.)
   - Escape to close modals

2. **Search Improvements**:
   - Add filters (by tag, location, date range)
   - Recent searches
   - Search highlights

3. **Responsive Design**:
   - Mobile layout (stack panels vertically?)
   - Tablet layout
   - Touch-friendly interactions

4. **Animations**:
   - Smooth transitions between views
   - List item animations (add/remove)
   - Loading skeletons

5. **Empty States**:
   - Better empty state for no people ("Get started by adding your first contact")
   - Empty state for no memories
   - Empty state for no tags

---

## 🔧 Technical Debt

1. **Type Safety**:
   - Some `any` types in error handling
   - Firestore Timestamp types need better handling

2. **Error Boundaries**:
   - No error boundaries for React-style error catching
   - Implement SvelteKit error handling

3. **Testing**:
   - No tests yet
   - Need unit tests for stores
   - Need integration tests for API routes
   - Need E2E tests for critical flows

4. **Performance**:
   - No memoization of computed values
   - Consider virtualizing long lists
   - Image optimization (if adding profile photos)

5. **Security**:
   - Review Firestore security rules
   - Add rate limiting to API endpoints
   - Add CSRF protection

---

## 📦 Future Features (Lower Priority)

1. **Profile Photos**: Upload and display photos (Firebase Storage)
2. **Contact Import**: Import from CSV, Google Contacts, etc.
3. **Smart Reminders**: "You haven't contacted [Person] in 30 days"
4. **Notes**: Separate notes system (different from memories)
5. **Relationships**: Link people together (family, colleagues, etc.)
6. **Groups**: Create groups of people (beyond tags)
7. **Activity Feed**: Recent activity across all people
8. **Search History**: Save and revisit previous searches
9. **Duplicate Detection**: Find and merge duplicate contacts
10. **Email Integration**: Send emails from the app
11. **Calendar Integration**: View upcoming birthdays/events
12. **AI Features**: Generate message suggestions, summarize interactions

---

## 📁 File Structure Reference

```
app/
├── src/
│   ├── lib/
│   │   ├── components/
│   │   │   ├── AddMemoryModal.svelte
│   │   │   ├── PersonCard.svelte
│   │   │   ├── PersonPanel.svelte
│   │   │   ├── Sidebar.svelte
│   │   │   └── TagManager.svelte
│   │   ├── server/
│   │   │   ├── firebase.ts (Admin SDK)
│   │   │   └── peopleperson-db.ts (Firestore CRUD)
│   │   ├── stores/
│   │   │   ├── auth.svelte.ts
│   │   │   └── ui.svelte.ts
│   │   ├── firebase.ts (Client SDK)
│   │   └── types.ts
│   ├── routes/
│   │   ├── api/
│   │   │   ├── people/
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── delete/+server.ts
│   │   │   │   │   ├── memories/
│   │   │   │   │   │   ├── create/+server.ts
│   │   │   │   │   │   └── [memoryId]/+server.ts
│   │   │   │   │   ├── tags/+server.ts
│   │   │   │   │   ├── update/+server.ts
│   │   │   │   │   └── +server.ts
│   │   │   │   ├── create/+server.ts
│   │   │   │   └── +server.ts
│   │   │   └── tags/
│   │   │       ├── [id]/+server.ts
│   │   │       ├── create/+server.ts
│   │   │       └── +server.ts
│   │   ├── map/+page.svelte
│   │   ├── people/+page.svelte
│   │   ├── settings/+page.svelte
│   │   ├── signin/+page.svelte
│   │   ├── signup/+page.svelte
│   │   ├── table/+page.svelte
│   │   └── +page.svelte
│   ├── hooks.server.ts
│   └── app.html
├── .env
└── package.json
```

---

## 🚀 Quick Start for Next Session

1. **Check server is running**: `npm run dev` (should be on http://localhost:5175/)
2. **Verify data**: Check Firestore has people, tags, memories
3. **Test auth**: Sign in works, sidebar shows user info
4. **Pick a priority**: Start with Table View (#1) or Map View (#2)

**Recommended Next Task**: Implement Table View - it's the most straightforward and will provide immediate value for managing lots of contacts.
