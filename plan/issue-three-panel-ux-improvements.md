# Issue: Three-Panel UX Improvements

**Type**: UX Enhancement
**Priority**: High
**Complexity**: Medium-High
**Estimated Effort**: 2-3 weeks
**Status**: Planning

## Problem Statement

The current three-panel layout has several UX inconsistencies and missed opportunities for better workflows:
1. People and Messages sidebar buttons serve the same purpose with no clear distinction
2. The AI chat functionality ("addContacts") is poorly named and limited to one location
3. No efficient way to perform bulk operations (tags, edits, deletes) across multiple people
4. The AI chat modal covers content instead of integrating smoothly with the panel layout
5. When the left panel is collapsed, the three-panel paradigm breaks down

## Proposed Solutions

### 1. Eliminate Left Sidebar Navigation

**Issue:** People and Messages buttons have no functional difference, adding unnecessary complexity.

**Solution:**
- Remove the left sidebar entirely (People, Messages, addContacts buttons)
- Far left panel becomes the people list by default
- People list includes existing search and filter functionality
- Add hamburger menu (☰) to people list panel that opens a left sidebar with:
  - **Table View Toggle:** Switch between list view (default) and table view
  - Table view starts as placeholder: "Table view - implement bulk operations here"
  - (Future: Settings, filters, other navigation options)

### 2. Persistent AI Chat Button

**Issue:** AI chat needs to be easily accessible from anywhere.

**Solution:**
- Place AI chat button in top right of the page (globally visible)
- Always accessible regardless of current view
- Context-aware: knows which person is selected (if any)
- Icon: magic wand or sparkle (✨) with "Chat" label

**Behavior:**
- When clicked: slides in AI chat panel from the right
- AI automatically has context of currently selected person/view
- Can perform any operation via natural language:
  - Edit person data
  - Create notebook entries
  - Add/modify tags
  - Bulk operations
  - Log interactions
  - Navigate to people

**Example interaction flow:**
```
User has John's profile open
User clicks AI chat button (top right)
→ AI chat slides in: "I can see you're viewing John's profile. How can I help?"
User types: "Add a note that we discussed hiking plans for next month"
→ AI creates notebook entry dated today with that content
User types: "Tag him as 'outdoors' and update his next contact date to 2 weeks"
→ AI applies tag and updates reminder
```

### 3. Bulk Operations Table View

**Issue:** No efficient way to edit multiple people at once (tags, categorization, deletion).

**Solution:** Implement table view with batch operations:

**Features:**
- Filterable/sortable table of all people
- Multi-select checkboxes
- Bulk actions toolbar:
  - Add/remove tags
  - Change relationship tier
  - Update custom fields
  - Delete multiple people
- Smart filters (by health score, tags, last contact date, etc.)
- Quick inline editing for single-person changes

**Example workflow:**
```
User filters table: health_score < 40 AND tag = "work"
→ Shows 12 people needing attention from work context
User selects 5 people
User clicks "Add Tag" → enters "reactivate-Q2"
→ All 5 people tagged
User selects 2 people with outdated info
User clicks "Delete" → confirms
→ People removed
```

### 4. Simplified Panel Hierarchy

**Issue:** When left panel is reduced, three panels don't make semantic sense.

**Solution:** Simplify to true three-panel layout:

**Panel structure:**
1. **Left Panel:** People list (default, always visible)
   - Show person name + avatar
   - Show context snippet from most recent interaction
   - Search bar at top for filtering people
   - Hamburger menu (☰) for count/statistics and settings
   - Collapsible to narrow mode (just avatars)

2. **Middle Panel:** Person detail or table view
   - Selected person's profile
   - OR table view for bulk operations
   - Context-specific content

3. **Right Panel:** Context panel
   - Notebook entries
   - Interaction history
   - Related information

**Layout states:**
1. **Standard:** All three panels visible [Left] [Middle] [Right]
2. **Left collapsed:** Narrow avatar column [L] [Middle] [Right]
3. **Focus mode:** Hide right panel [Left] [Middle (expanded)]
4. **With AI chat:** Push all panels left [L] [Mid] [Right] [AI Chat]

### 5. AI Chat Panel Behavior

**Issue:** AI chat appears as a modal, covering the far-right panel content.

**Solution:** Slide-in panel that pushes content left:

**New behavior:**
- AI chat slides in from the right as a panel
- Pushes the current rightmost content to the left
- Creates a fourth temporary panel during chat
- Smooth animation (300ms ease-out)
- Can be dismissed with ESC or close button
- Content underneath remains visible but compressed

**Visual flow:**
```
Before: [People List] [Person Detail] [Context Panel]
After:  [People (compressed)] [Detail (compressed)] [Context (compressed)] [AI Chat]
```

**Top-right positioning:**
- AI chat button always visible in app header (top right)
- Consistent placement across all views
- Badge indicator if AI has suggestions/notifications

**Responsive behavior:**
- On narrow screens (<1200px), AI chat becomes full-overlay modal (current behavior)
- On wide screens (≥1200px), uses slide-in push behavior

## User Benefits

1. **Simplified navigation:** No confusing sidebar, people list is always the left panel
2. **Always-accessible AI:** Top-right button works from anywhere with full context
3. **Efficient bulk operations:** Table view saves time on repetitive tasks
4. **Better spatial awareness:** AI chat doesn't hide content, integrates smoothly
5. **Cleaner interface:** Fewer navigation elements, clearer purpose for each panel
6. **Faster workflows:** Natural language edits from any context
7. **Consistent layout:** True three-panel design that makes sense

## Implementation Plan

### Phase 1: Remove Sidebar & Restructure Layout (Week 1)
- Remove left sidebar navigation (People, Messages, addContacts buttons)
- Make people list the default left panel
- Add hamburger menu (☰) to people list panel
- Create hamburger menu sidebar that slides in from left
- Add table view toggle in hamburger menu
- Create placeholder table view component
- Add global AI chat button to app header (top right)
- Implement context-aware AI chat initialization
- Update chat prompts to handle person-specific and global context
- Test natural language editing capabilities

### Phase 2: Bulk Operations Table (Week 1-2)
- Create new TableView component with filtering
- Implement multi-select and checkbox UI
- Build bulk action handlers (tags, tier updates, deletion)
- Add server-side batch endpoints if needed
- Test performance with large datasets

### Phase 3: Panel Layout Refactor (Week 2)
- Redesign collapsed left panel behavior
- Move people list to default left panel content
- Add recent interaction context to list items
- Implement collapsible states

### Phase 4: AI Chat Slide-In (Week 2-3)
- Replace modal with slide-in panel component
- Implement push-left animation for other panels
- Add responsive breakpoints (modal vs slide-in)
- Smooth transition animations
- Keyboard shortcuts (ESC to close)

### Phase 5: Polish & Testing (Week 3)
- Add tooltips to AI chat button
- Implement badge notifications for AI suggestions
- Test keyboard shortcuts and accessibility
- Update user documentation
- Performance testing with large datasets

## Technical Considerations

### State Management
- AI chat context needs to know which person is selected
- Bulk selection state needs to persist during filtering
- Panel collapse states should be saved to user preferences

### API Endpoints Needed
- `PATCH /api/people/bulk` - Bulk update tags, tiers, etc.
- `DELETE /api/people/bulk` - Bulk delete
- Extend AI chat endpoints to accept person context

### Component Architecture
```
<AppLayout>
  <AppHeader>
    {/* App title, user menu, etc. */}
    <AIChatButton position="top-right" /> {/* Global AI chat button */}
  </AppHeader>

  <ThreePanelLayout>
    <LeftPanel> {/* People list - always visible */}
      <HamburgerMenu /> {/* Count, settings */}
      <SearchBar />
      <FilterControls />
      <PeopleList showContext={true} />
    </LeftPanel>

    <MiddlePanel> {/* Person detail or table view */}
      <PersonPanel />
      // OR
      <TableView bulkActions={true} />
    </MiddlePanel>

    <RightPanel> {/* Context, notebook, etc. */}
      <NotebookPanel />
      <InteractionHistory />
    </RightPanel>
  </ThreePanelLayout>

  <AIChat mode="slide-in" context={currentView} /> {/* Slides in from right, pushes all panels left */}
</AppLayout>
```

### Responsive Breakpoints
- **< 768px:** Stack panels vertically, AI chat as modal
- **768px - 1200px:** Two-panel layout, AI chat as modal
- **≥ 1200px:** Three-panel layout, AI chat slides in

## Acceptance Criteria

- [ ] Left sidebar navigation removed (People, Messages, addContacts buttons)
- [ ] People list is the default left panel
- [ ] Hamburger menu (☰) added to people list panel
- [ ] Hamburger menu opens sidebar from left with table view toggle
- [ ] AI chat button appears in app header (top right, globally visible)
- [ ] Clicking AI chat button opens chat with context of current view/person
- [ ] AI chat can edit person data, create notebook entries, add tags via natural language
- [ ] AI chat can perform bulk operations via natural language
- [ ] Table view implemented with filtering and sorting
- [ ] Multi-select works in table view
- [ ] Bulk tag add/remove works
- [ ] Bulk delete works with confirmation
- [ ] People list shows recent interaction context
- [ ] People list is searchable and filterable
- [ ] AI chat slides in from right, pushing all content left (on desktop)
- [ ] AI chat is modal on mobile/narrow screens
- [ ] All animations are smooth (300ms)
- [ ] Keyboard shortcuts work (ESC to close chat)
- [ ] User preferences saved (panel states, collapsed modes)

## Open Questions

- [ ] What should hamburger menu sidebar contain beyond table view toggle?
- [ ] What's the ideal width ratio when AI chat pushes content left? (60-40? 70-30?)
- [ ] Should table view be a separate route or a toggle in the current view?
- [ ] Do we need keyboard shortcuts for bulk selection (Cmd+A, Shift+Click)?
- [ ] Should AI chat remember context between sessions (e.g., last person discussed)?
- [ ] What's the maximum number of people that can be bulk-edited at once?
- [ ] Should hamburger menu stay open/pinned or auto-close after selection?

## Dependencies

- AI chat backend must support person-specific context
- Bulk operation endpoints (may require new API design)
- Animation library (Framer Motion, React Spring, or CSS transitions)
- Table component library (TanStack Table, React Table, or custom)

## Risks & Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Panel animations janky on mobile | Medium | Medium | Use CSS transforms, hardware acceleration, test on devices |
| AI context switching confuses users | High | Low | Clear visual indicators, breadcrumbs, confirmation prompts |
| Bulk operations accidentally delete data | High | Medium | Require explicit confirmation, allow undo within 10s |
| Users don't discover hamburger menu | Medium | Medium | Tooltip on first visit, count badge to draw attention |
| Table view performance degrades with 1000+ people | Medium | Low | Implement virtualization, pagination, or infinite scroll |
| Removing sidebar navigation disorients existing users | Medium | Low | Migration announcement, tutorial overlay on first login |

## Success Metrics

- **Efficiency:** Time to tag 10 people reduced by 80% (using bulk ops vs individual)
- **Discoverability:** 80%+ users find and use AI chat button in top right within first session
- **Engagement:** AI chat usage increases 2x due to global accessibility
- **Satisfaction:** Users report less UI confusion in navigation (survey)
- **Performance:** Panel animations maintain 60fps on mid-range devices
- **Simplicity:** Navigation clicks reduced by 50% (no sidebar, direct access to people list)

## Related Issues

- Health Score Implementation (#issue-implement-health-score.md) - Table view should show health scores
- SMS Integration - Recent interaction context comes from SMS/messages
- Notebook Entries Feature - AI chat should create notebook entries

## Next Steps

1. Review and approve this UX improvement plan
2. Create design mockups for each change (Figma/Sketch)
3. User testing with mockups (5-10 users)
4. Create feature branch: `feature/three-panel-ux-improvements`
5. Implement in phases (magic button → bulk ops → panel refactor → AI slide-in)
6. Deploy to staging for testing
7. Gather user feedback
8. Iterate and deploy to production

---

_This UX improvement plan addresses key pain points in the three-panel layout while maintaining consistency and improving discoverability of AI-powered features._
