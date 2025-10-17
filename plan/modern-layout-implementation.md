# Modern Three-Column Layout Implementation Plan for PeoplePerson

## Executive Summary

This plan transforms PeoplePerson from a traditional page-based React app into a modern three-column messaging interface using **2024-2025 best practices**. Based on the analysis of the guide and current implementation limitations, we'll move away from DaisyUI's drawer-based approach to a more flexible, production-ready architecture using **Radix UI primitives, CSS Grid, TanStack Router for type-safe navigation, and Zustand for UI state**.

## Key Architecture Decisions

### Why Not DaisyUI Drawers
- **Production Issues**: Known bugs with `lg:drawer-open`, positioning conflicts, z-index problems
- **Limited Control**: CSS checkbox hacks conflict with React patterns
- **Poor Nesting**: Three-column layouts require nested drawers (only stable in v3.7.0+)
- **Trade-off**: DaisyUI trades flexibility for convenience - wrong choice for complex messaging UI

### Modern Stack Selection
- **Radix UI + shadcn/ui**: Accessible primitives with full control, copy-paste components
- **CSS Grid**: Clean three-column implementation without complex JS
- **TanStack Router**: Type-safe URL state, better than React Router for panel navigation
- **Zustand**: Lightweight UI state (sidebar open/closed, preferences)
- **TanStack Query**: Already in use, handles server state perfectly

## Target Layout Architecture

### Desktop Layout (CSS Grid)
```
┌─────────────────────────────────────────────────────────┐
│                      Top Bar (Optional)                  │
├─────┬─────────────┬─────────────────────────────────────┤
│     │             │                                     │
│  S  │   People    │      Dynamic Right Panel            │
│  i  │    List     │                                     │
│  d  │             │   Tab 1: Messages                   │
│  e  │  ┌─────────┐│   Tab 2: Profile                    │
│  b  │  │[Avatar] ││   Tab 3: Activity                   │
│  a  │  │ Name    ││                                     │
│  r  │  │ Preview ││   (Tabs at top of panel)            │
│     │  └─────────┘│                                     │
└─────┴─────────────┴─────────────────────────────────────┘
250px   300-350px         Remaining space (1fr)
```

### CSS Grid Implementation
```css
.app-layout {
  display: grid;
  grid-template-columns: 250px 350px 1fr;
  height: 100vh;
  
  @media (max-width: 1024px) {
    grid-template-columns: 250px 1fr;
  }
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}
```

## URL Structure (TanStack Router)

```typescript
// Type-safe route definitions
const routeTree = {
  '/': {
    '/people': {
      search: z.object({
        filter: z.enum(['all', 'unread', 'important']).optional(),
        sort: z.enum(['recent', 'name', 'intent']).optional()
      }),
      '/$personId': {
        search: z.object({
          panel: z.enum(['messages', 'profile', 'activity']).default('messages')
        })
      }
    }
  }
}

// Results in URLs like:
/people?filter=unread&sort=recent
/people/123?panel=messages
/people/123?panel=profile
```

## State Management Architecture

### 1. URL State (TanStack Router)
- Selected person ID
- Active panel (messages/profile/activity)
- List filters and sorting
- Search query

### 2. Zustand UI State
```typescript
interface UIStore {
  sidebarCollapsed: boolean
  rightPanelWidth: number
  composerExpanded: boolean
  commandPaletteOpen: boolean
  toggleSidebar: () => void
  setRightPanelWidth: (width: number) => void
}
```

### 3. Server State (TanStack Query - existing)
- People list
- Person details
- Messages
- Real-time updates via WebSocket invalidation

### 4. Local State (useState)
- Form inputs
- Hover states
- Temporary UI states

## Component Architecture

### Core Layout Components

#### 1. AppLayout (CSS Grid Container)
```tsx
// components/layout/AppLayout.tsx
const AppLayout = () => {
  const { sidebarCollapsed } = useUIStore()
  
  return (
    <div className={cn(
      "app-layout",
      sidebarCollapsed && "sidebar-collapsed"
    )}>
      <Sidebar />
      <PeopleList />
      <PersonPanel />
    </div>
  )
}
```

#### 2. Sidebar (Navigation)
```tsx
// components/layout/Sidebar.tsx
// Using Radix UI NavigationMenu primitive
const Sidebar = () => {
  return (
    <NavigationMenu.Root orientation="vertical">
      <NavigationMenu.List>
        <NavigationMenu.Item>
          <NavigationMenu.Link active>People</NavigationMenu.Link>
        </NavigationMenu.Item>
        {/* Groups, Tags, Settings */}
      </NavigationMenu.List>
    </NavigationMenu.Root>
  )
}
```

#### 3. PeopleList (Single-Click Pattern)
```tsx
// components/people/PeopleList.tsx
const PeopleList = () => {
  const { data: people } = usePeople()
  const navigate = useNavigate()
  const { personId } = useParams()
  const { filter, sort } = useSearch()
  
  // Virtual scrolling for performance
  const virtualizer = useVirtualizer({
    count: people.length,
    estimateSize: () => 72,
    overscan: 5
  })
  
  return (
    <ScrollArea>
      <div className="p-4 border-b">
        <CommandInput placeholder="Search people..." />
      </div>
      
      <div ref={virtualizer.scrollElement}>
        {virtualizer.getVirtualItems().map(virtualItem => (
          <PersonListItem
            key={people[virtualItem.index].id}
            person={people[virtualItem.index]}
            isSelected={personId === people[virtualItem.index].id}
            onClick={() => navigate(`/people/${people[virtualItem.index].id}?panel=messages`)}
          />
        ))}
      </div>
    </ScrollArea>
  )
}
```

#### 4. PersonPanel (Tabbed Interface)
```tsx
// components/people/PersonPanel.tsx
const PersonPanel = () => {
  const { personId } = useParams()
  const { panel } = useSearch()
  const navigate = useNavigate()
  
  if (!personId) {
    return <EmptyState />
  }
  
  return (
    <div className="flex flex-col h-full">
      <Tabs value={panel} onValueChange={(v) => navigate({ search: { panel: v }})}>
        <TabsList>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>
        
        <TabsContent value="messages" className="flex-1">
          <MessageThread personId={personId} />
        </TabsContent>
        
        <TabsContent value="profile" className="flex-1">
          <PersonProfile personId={personId} />
        </TabsContent>
        
        <TabsContent value="activity" className="flex-1">
          <PersonActivity personId={personId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

#### 5. MessageThread (with Optimistic Updates)
```tsx
// components/messaging/MessageThread.tsx
const MessageThread = ({ personId }) => {
  const { data: messages } = useMessages(personId)
  const sendMessage = useSendMessage()
  
  // Virtual scrolling for large message lists
  const virtualizer = useVirtualizer({
    count: messages.length,
    estimateSize: () => 80,
    overscan: 10,
    reverse: true // Latest messages at bottom
  })
  
  const handleSend = (text: string) => {
    // Optimistic update
    sendMessage.mutate({
      personId,
      text,
      tempId: nanoid()
    }, {
      onError: (error, variables) => {
        // Show retry UI
      }
    })
  }
  
  return (
    <div className="flex flex-col h-full">
      <MessageList virtualizer={virtualizer} messages={messages} />
      <MessageComposer onSend={handleSend} disabled={sendMessage.isPending} />
    </div>
  )
}
```

## Performance Optimizations

### 1. Virtual Scrolling (TanStack Virtual)
- People list: Render only visible items + overscan
- Message threads: Reverse virtual scrolling for chat UI
- Dynamic heights for variable message sizes

### 2. React 18 Concurrent Features
```tsx
// Wrap expensive operations in transitions
const [isPending, startTransition] = useTransition()

const handleFilter = (filter: string) => {
  startTransition(() => {
    setFilter(filter)
  })
}
```

### 3. Code Splitting
```tsx
// Lazy load heavy components
const PersonActivity = lazy(() => import('./PersonActivity'))
const CommandPalette = lazy(() => import('./CommandPalette'))
```

### 4. Optimistic Updates
- Show messages immediately
- Use temporary IDs
- Rollback on error
- Visual indicators (opacity, spinners)

## Real-time Integration Pattern

### WebSocket + TanStack Query
```tsx
// hooks/useRealtimeSync.ts
const useRealtimeSync = () => {
  const queryClient = useQueryClient()
  
  useWebSocket({
    url: WS_URL,
    onMessage: (event) => {
      const { type, data } = JSON.parse(event.data)
      
      switch (type) {
        case 'NEW_MESSAGE':
          // Invalidate queries, let TanStack Query refetch
          queryClient.invalidateQueries(['messages', data.personId])
          break
        case 'PERSON_UPDATED':
          queryClient.invalidateQueries(['person', data.id])
          break
      }
    }
  })
}
```

## Responsive Design Strategy

### Breakpoints
- **Mobile** (< 768px): Single column, stack navigation
- **Tablet** (768-1024px): Two columns, collapsible sidebar
- **Desktop** (> 1024px): Full three columns

### Mobile Adaptations
```tsx
const isMobile = useMediaQuery('(max-width: 768px)')

if (isMobile) {
  return (
    <MobileLayout>
      <Routes>
        <Route path="/people" element={<PeopleList />} />
        <Route path="/people/:id" element={<PersonPanel />} />
      </Routes>
    </MobileLayout>
  )
}
```

## Accessibility Requirements

### ARIA Landmarks
```tsx
<nav aria-label="Main navigation">{/* Sidebar */}</nav>
<aside aria-label="People list">{/* List */}</aside>
<main aria-label="Conversation">{/* Panel */}</main>
```

### Keyboard Navigation
- Tab through interactive elements
- Arrow keys for list navigation
- Escape to close dialogs
- CMD+K for command palette

### Focus Management
```tsx
// Focus message input when selecting conversation
useEffect(() => {
  if (personId) {
    messageInputRef.current?.focus()
  }
}, [personId])
```

## Implementation Phases

### Phase 1: Foundation (Days 1-2)
1. Set up TanStack Router with type-safe routes
2. Create Zustand store for UI state
3. Implement CSS Grid layout structure
4. Install Radix UI primitives and shadcn/ui components

### Phase 2: Core Components (Days 3-4)
1. Build AppLayout with responsive grid
2. Create Sidebar with Radix NavigationMenu
3. Implement PeopleList with virtual scrolling
4. Add search functionality with debouncing

### Phase 3: Person Panel (Days 5-6)
1. Create tabbed PersonPanel container
2. Build MessageThread with virtual scrolling
3. Implement PersonProfile view
4. Add PersonActivity timeline

### Phase 4: Real-time & Performance (Days 7-8)
1. Integrate WebSocket with TanStack Query
2. Add optimistic updates for messages
3. Implement React 18 concurrent features
4. Add code splitting for heavy components

### Phase 5: Polish & Accessibility (Days 9-10)
1. Add loading skeletons
2. Implement error boundaries
3. Add keyboard navigation
4. Test with screen readers
5. Add CMD+K command palette

## Migration Strategy from Current Code

### Incremental Adoption
1. Keep existing React Query setup (works perfectly)
2. Add TanStack Router alongside React Router initially
3. Build new layout in parallel route
4. Migrate components one by one
5. Switch default route when ready

### Component Reuse
- **Keep**: Authentication, API layer, React Query hooks
- **Adapt**: PersonDetail → PersonProfile component
- **Replace**: MainLayout → AppLayout with CSS Grid
- **New**: Virtual scrolling, command palette, real-time sync

## Success Metrics

### Performance
- Initial render < 1.8s (LCP)
- Interaction delay < 100ms (FID)
- Layout shift < 0.1 (CLS)
- 60fps scrolling with 10,000+ items

### User Experience
- Single-click navigation
- Instant message sending (optimistic)
- Deep linkable URLs
- Keyboard accessible

### Developer Experience
- Type-safe navigation
- No prop drilling
- Clear state separation
- Easy to extend

## Critical Implementation Notes

### Avoid These Patterns
1. **Never use double-click** for primary actions
2. **Don't put sensitive data in URLs** (use Zustand)
3. **Always disable buttons** after click (prevent duplicates)
4. **Don't use DaisyUI drawers** for production three-column layouts

### Required Libraries
```json
{
  "@tanstack/react-router": "^1.x",
  "@tanstack/react-virtual": "^3.x",
  "@radix-ui/react-navigation-menu": "^1.x",
  "@radix-ui/react-tabs": "^1.x",
  "@radix-ui/react-scroll-area": "^1.x",
  "zustand": "^4.x",
  "react-use-websocket": "^4.x",
  "cmdk": "^0.2.x"
}
```

## Next Steps

1. Review and approve this modernized plan
2. Set up development branch
3. Install required dependencies
4. Create basic CSS Grid layout
5. Implement TanStack Router
6. Begin Phase 1 implementation

This plan leverages 2024-2025 best practices to create a production-ready, performant, and maintainable three-column messaging interface that avoids the pitfalls of DaisyUI's drawer approach while providing superior user and developer experience.