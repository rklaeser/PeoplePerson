# Replace Categories with Relationship Health Score

## Overview

Replace the current intent-based category system (`core`, `archive`, `develop`, `casual`, `new`) with a dynamic relationship health score (0-100) that automatically reflects relationship vitality based on interaction patterns.

## Current State

### Intent Categories (To Be Replaced)
- **Database**: `IntentChoices` enum with 5 fixed values (core, archive, new, develop, casual)
- **Location**: `api/models.py:PersonBase.intent`
- **Usage**:
  - Visual distinction via color-coded badges in UI
  - Filtering people by intent (single or multiple)
  - Manual categorization requiring user decision

### Implementation Points
- **Backend**: `api/models.py`, `api/routers/people.py`
- **Frontend**: `webclient/src/components/layout/PeopleList.tsx`, `PersonProfile.tsx`, `PersonPanel.tsx`
- **Utilities**: `webclient/src/lib/utils.ts` (color mapping)
- **Types**: `webclient/src/types/api.ts`

## Motivation

**Problems with Current System:**
1. **Artificial boundaries**: Hard cutoffs between categories don't reflect relationship reality
2. **Manual overhead**: Requires conscious recategorization decisions
3. **Judgment burden**: "Archive" feels like giving up on someone
4. **Static**: Doesn't automatically reflect interaction patterns
5. **Limited nuance**: 5 buckets can't capture relationship spectrum

**Benefits of Health Score:**
1. **Automatic**: Degrades naturally based on time since last contact
2. **Gradient**: 0-100 scale captures nuance better than categories
3. **Motivating**: Tree visualization feels actionable, not judgmental
4. **Honest**: Reflects actual interaction patterns, not aspirations
5. **Elegant**: System does the work, user focuses on relationships

## Proposed Solution

### 1. Health Score Model

Replace `intent` field with:

```python
class PersonBase(SQLModel):
    name: str
    body: str = Field(default="Add a description")
    health_score: int = Field(default=100, ge=0, le=100)
    last_contact_date: Optional[datetime] = None
    health_decay_rate: float = Field(default=1.0)  # Points per day
    # ... other fields
```

**Health Score Calculation:**
- Starts at 100 for new relationships
- Decays over time based on `days_since_contact * decay_rate`
- Increases when interactions logged (SMS, calls, meetups)
- Formula: `max(0, 100 - (days_since_contact * decay_rate))`

### 2. Tree Health Visualization

Replace intent badge with tree visual:

| Health Range | Tree State | Color | Visual |
|--------------|------------|-------|--------|
| 80-100 | Thriving | Green | 🌳 Full, lush tree |
| 60-79 | Healthy | Light Green | 🌲 Healthy tree |
| 40-59 | Declining | Yellow | 🍂 Some leaves falling |
| 20-39 | Struggling | Orange | 🍁 Sparse foliage |
| 0-19 | Dormant | Gray/Brown | 🪵 Bare branches |

### 3. Database Migration

**Migration Strategy:**

```python
# Map old intent values to initial health scores
INTENT_TO_HEALTH = {
    "core": 90,      # Active, healthy relationships
    "develop": 70,   # Growing, needs attention
    "new": 100,      # Fresh, full potential
    "casual": 60,    # Maintained but less frequent
    "archive": 20,   # Acknowledged low activity
}
```

**Migration Steps:**
1. Add `health_score`, `last_contact_date`, `health_decay_rate` columns (nullable)
2. Populate initial health scores from intent mapping
3. Set `last_contact_date` from most recent interaction or creation date
4. Remove `intent` column after verification

### 4. API Changes

**New Endpoints:**

```python
# GET /people?health_min=60&health_max=100
# Filter by health score range

# POST /people/{person_id}/log-interaction
# Log interaction and boost health score

# GET /people/health-summary
# Get distribution of relationships by health ranges

# POST /people/{person_id}/set-decay-rate
# Customize decay rate for specific relationships
```

**Health Boost on Interaction:**
- SMS sent/received: +5 points
- Phone call: +10 points
- In-person meetup: +15 points
- Capped at 100

### 5. Frontend Changes

**Components to Update:**

1. **PeopleList.tsx**: Replace intent badge with tree icon + health score
   ```tsx
   <div className="flex items-center gap-2">
     <TreeHealthIcon health={person.health_score} />
     <span className="text-sm text-gray-600">{person.health_score}/100</span>
   </div>
   ```

2. **PersonProfile.tsx**: Add health visualization section
   - Large tree visual
   - Health score with trend (↑↓)
   - Days since last contact
   - Projected health in 30/60/90 days

3. **Dashboard/Home**: Add health-based filters
   - "Needs Attention" (health < 40)
   - "Thriving" (health > 80)
   - "Recently Declining" (lost >20 points in 30 days)

4. **Remove**: `getIntentColor()` utility function

**New UI Components:**

1. **TreeHealthIcon.tsx**: SVG tree with state based on health
2. **HealthScoreBar.tsx**: Horizontal bar with gradient
3. **RelationshipHealthDashboard.tsx**: Overview of all relationships

### 6. Background Jobs

**Health Decay Cron Job:**

```python
# Run daily
async def decay_relationship_health():
    """Decay health scores for all people based on time since last contact"""
    people = await get_all_people()
    for person in people:
        if person.last_contact_date:
            days_elapsed = (datetime.now() - person.last_contact_date).days
            new_health = max(0, 100 - (days_elapsed * person.health_decay_rate))
            person.health_score = new_health
            await update_person(person)
```

### 7. Advanced Features (Future)

- **Smart decay rates**: ML-based decay rates based on historical patterns
- **Relationship momentum**: Track velocity of health changes
- **Nudges**: Notifications when relationships drop below thresholds
- **Seasonal adjustments**: Account for expected contact patterns (e.g., college friends)
- **Relationship types**: Different decay rates for family vs friends vs colleagues

## Implementation Plan

### Phase 1: Backend Foundation (Week 1)
- [ ] Add health score fields to Person model
- [ ] Create database migration with intent→health mapping
- [ ] Update PersonBase schema and validation
- [ ] Add `log_interaction` endpoint
- [ ] Implement health score calculation logic
- [ ] Add health-based filtering to GET /people
- [ ] Write unit tests for health calculations

### Phase 2: Data Migration (Week 1-2)
- [ ] Run migration on development database
- [ ] Verify data integrity
- [ ] Add health decay background job
- [ ] Test decay calculations with sample data
- [ ] Create migration rollback plan

### Phase 3: Frontend UI (Week 2)
- [ ] Create TreeHealthIcon component
- [ ] Create HealthScoreBar component
- [ ] Update PeopleList to show health instead of intent
- [ ] Update PersonProfile with health visualization
- [ ] Add health-based filter options
- [ ] Remove intent-related code and utilities

### Phase 4: Interaction Logging (Week 3)
- [ ] Add interaction logging to SMS router
- [ ] Create manual interaction logging UI
- [ ] Add interaction history view
- [ ] Test health score updates on interactions

### Phase 5: Polish & Deploy (Week 3-4)
- [ ] Create RelationshipHealthDashboard
- [ ] Add health trends and projections
- [ ] Write user documentation
- [ ] Deploy to staging
- [ ] User testing and feedback
- [ ] Deploy to production

## Testing Strategy

### Unit Tests
- Health score calculation with various decay rates
- Health boost from different interaction types
- Boundary conditions (0, 100, negative days)
- Intent→health migration mapping

### Integration Tests
- Health decay background job
- Interaction logging updates health
- Filtering by health ranges
- API endpoint responses

### E2E Tests
- Create person → view health → log interaction → verify boost
- Filter people by health ranges
- Health visualization renders correctly
- Dashboard shows accurate distribution

## Rollback Plan

If issues arise:
1. **Keep intent column**: Don't drop during initial migration
2. **Feature flag**: Toggle between intent/health display in frontend
3. **Reverse migration**: Script to restore intent from health scores
4. **Gradual rollout**: Enable for subset of users first

## Success Metrics

- **Adoption**: % of users logging interactions within first week
- **Engagement**: Increase in contact with "declining" relationships
- **Satisfaction**: User feedback on health score vs categories
- **Accuracy**: User perception of health score matching reality
- **Maintenance**: Reduction in manual categorization actions

## Open Questions

1. **Decay rate defaults**: Should different relationship types have different default decay rates?
2. **Health boost calibration**: Are the +5/+10/+15 boosts appropriate?
3. **Historical data**: Should we backfill `last_contact_date` from SMS/call history?
4. **UI preferences**: Should users be able to toggle between tree/bar/number display?
5. **Notifications**: What health thresholds should trigger nudges?

## References

- Current models: `api/models.py`
- People router: `api/routers/people.py`
- Frontend types: `webclient/src/types/api.ts`
- Existing tests: `api/test_people_endpoints.py`
