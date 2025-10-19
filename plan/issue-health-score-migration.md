# Issue: Migrate from Intent Categories to Relationship Health Score

**Type**: Feature Enhancement
**Priority**: High
**Complexity**: Medium-High
**Estimated Effort**: 3-4 weeks

## Problem Statement

The current intent-based category system (`core`, `archive`, `develop`, `casual`, `new`) requires manual categorization and creates artificial boundaries that don't reflect the natural spectrum of relationship health. Users must consciously decide when to "archive" someone, which feels judgmental, and categories don't automatically update based on actual interaction patterns.

## Proposed Solution

Replace the intent category system with a dynamic **relationship health score** (0-100) that:
- Automatically decays over time based on last contact
- Increases when interactions are logged
- Uses an intuitive tree metaphor (thriving 🌳 → dormant 🪵)
- Eliminates manual categorization overhead

## User Benefits

1. **Automatic tracking**: System reflects reality without manual updates
2. **Visual motivation**: Tree going from green to brown is more actionable than static "archive" label
3. **Nuanced insight**: 0-100 scale shows gradients, not just 5 buckets
4. **Less guilt**: Natural decay vs explicit "archiving"
5. **Actionable**: Clear priority list based on "needs attention" threshold

## Technical Changes

### Backend
- Add `health_score`, `last_contact_date`, `health_decay_rate` to Person model
- Remove `intent` enum field
- Add health-based filtering endpoints
- Implement health decay background job
- Add interaction logging that boosts health score

### Frontend
- Replace intent badge with tree health visualization
- Add health score bar/number display
- Create health-based filters ("Needs Attention", "Thriving")
- Add interaction logging UI
- Build relationship health dashboard

### Database
- Migration script with intent→health mapping:
  - `core` → 90
  - `develop` → 70
  - `new` → 100
  - `casual` → 60
  - `archive` → 20

## Detailed Plan

See full implementation plan: [`plan/replace-categories-with-health-score.md`](./replace-categories-with-health-score.md)

## Acceptance Criteria

- [ ] Health score field added to Person model (0-100)
- [ ] All existing people migrated to health scores
- [ ] Health decays automatically based on time since last contact
- [ ] Logging interaction (SMS/call/meetup) boosts health score
- [ ] Tree visualization shows relationship health at a glance
- [ ] Can filter people by health score ranges
- [ ] Background job runs daily to decay health scores
- [ ] Intent category system fully removed from codebase
- [ ] All tests passing
- [ ] Documentation updated

## Implementation Phases

1. **Backend Foundation** (Week 1)
   - Database schema changes
   - API endpoints for health score
   - Health calculation logic

2. **Data Migration** (Week 1-2)
   - Migration script
   - Background decay job
   - Data verification

3. **Frontend UI** (Week 2)
   - Tree health component
   - Update people list & profile views
   - Remove intent badge code

4. **Interaction Logging** (Week 3)
   - Log interactions from SMS
   - Manual interaction logging UI
   - Health boost implementation

5. **Polish & Deploy** (Week 3-4)
   - Dashboard with health overview
   - Trends and projections
   - User testing and deployment

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Users prefer explicit categories | High | Keep intent column initially; add feature flag |
| Health decay too fast/slow | Medium | Make decay rate configurable per person |
| Migration loses semantic meaning | Medium | Use sensible intent→health mapping |
| Users don't log interactions | High | Auto-log from SMS; make manual logging easy |

## Open Questions

- [ ] Should different relationship types (family/friends/colleagues) have different decay rates?
- [ ] What health score boost values are appropriate for different interaction types?
- [ ] Should we backfill `last_contact_date` from existing SMS history?
- [ ] Do we need notifications when relationships drop below certain thresholds?
- [ ] Should users customize tree vs bar vs number visualization?

## Success Metrics

- Increase in user engagement with "declining" relationships (health < 40)
- Reduction in time spent on manual categorization
- Positive user feedback on tree metaphor vs categories
- 80%+ accuracy in health score reflecting perceived relationship state

## Dependencies

- SMS/call logging system for automatic interaction tracking
- Background job scheduler for daily health decay
- No external dependencies

## References

- Design exploration: Conversation about categories vs health score
- Implementation plan: `plan/replace-categories-with-health-score.md`
- Current code:
  - `api/models.py:PersonBase.intent`
  - `api/routers/people.py`
  - `webclient/src/lib/utils.ts:getIntentColor()`
