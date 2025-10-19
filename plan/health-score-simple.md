# Simple Health Score Implementation

**Goal:** Replace manual intent categories with automatic relationship health tracking
**Timeline:** 3-5 days
**Complexity:** Low
**Philosophy:** Ship fast, iterate based on real user feedback

## Core Hypothesis

Automatic health scores based on last contact date will motivate users more than manual categories.

## What We're Building (V1)

A simple health score (0-100) that:
- Automatically decreases as time passes since last contact
- Updates automatically when SMS messages are sent/received
- Shows 3 clear visual states (healthy/warning/dormant)
- Replaces the intent category system

**That's it.** No quality multipliers, no interaction types, no predictive analytics.

---

## Implementation

### Phase 1: Database (1 day)

#### Update Person Model

**File: `api/models.py`**

```python
class PersonBase(SQLModel):
    name: str
    body: str = Field(default="Add a description")
    birthday: Optional[str] = None
    mnemonic: Optional[str] = None
    zip: Optional[str] = None
    profile_pic_index: int = Field(default=0)
    email: Optional[str] = None
    phone_number: Optional[str] = None

    # NEW: Health Score Fields
    last_contact_date: datetime = Field(default_factory=datetime.utcnow)

    # REMOVE: intent field (delete in migration)
```

**Key decisions:**
- ✅ Store `last_contact_date` (single source of truth)
- ✅ Calculate `health_score` on-demand (no stale data)
- ✅ No interaction history table (YAGNI)
- ✅ No relationship tiers (YAGNI)

#### Migration

**File: `alembic/versions/xxx_add_health_score.py`**

```python
def upgrade():
    # Add last_contact_date column
    op.add_column('people', sa.Column('last_contact_date', sa.DateTime(), nullable=False, server_default=sa.func.now()))

    # Backfill from most recent message
    connection = op.get_bind()
    connection.execute(
        sa.text("""
            UPDATE people p
            SET last_contact_date = COALESCE(
                (SELECT MAX(m."sentAt") FROM messages m WHERE m."personId" = p.id),
                p."createdAt"
            )
        """)
    )

    # Drop intent column
    op.drop_column('people', 'intent')

def downgrade():
    op.add_column('people', sa.Column('intent', sa.String(), nullable=True))
    op.drop_column('people', 'last_contact_date')
```

---

### Phase 2: Backend Logic (1 day)

#### Health Score Calculation

**File: `api/services/health_score.py`**

```python
"""
Simple health score calculation.
Score decays linearly based on days since last contact.
"""

from datetime import datetime
from typing import Literal

HealthStatus = Literal["healthy", "warning", "dormant"]

# Simple linear decay: lose ~1.5 points per day
# 100 → 0 in about 66 days
DECAY_RATE_PER_DAY = 1.5


def calculate_health_score(last_contact_date: datetime) -> int:
    """
    Calculate health score based on days since last contact.

    Formula: 100 - (days_inactive × 1.5)

    Returns:
        Health score (0-100)
    """
    days_inactive = (datetime.utcnow() - last_contact_date).days
    score = 100 - (days_inactive * DECAY_RATE_PER_DAY)
    return max(0, min(100, int(score)))


def get_health_status(score: int) -> HealthStatus:
    """
    Get health status from score.

    Returns:
        - healthy: 70-100 (green)
        - warning: 40-69 (yellow)
        - dormant: 0-39 (red)
    """
    if score >= 70:
        return "healthy"
    elif score >= 40:
        return "warning"
    else:
        return "dormant"


def get_health_emoji(status: HealthStatus) -> str:
    """Get emoji for health status"""
    return {
        "healthy": "🌳",
        "warning": "🍂",
        "dormant": "🪵",
    }[status]
```

**Why this is enough:**
- Users understand "days since last contact"
- 1.5 points/day feels right (66 days to dormant)
- Can be tuned later based on feedback
- No complexity, no edge cases

---

### Phase 3: API Endpoints (1 day)

#### Add Health Info to Person Response

**File: `api/routers/people.py`**

```python
from api.services.health_score import calculate_health_score, get_health_status, get_health_emoji

# Update existing PersonRead model
class PersonRead(PersonBase):
    id: UUID
    user_id: UUID
    created_at: datetime

    # Computed fields (not stored)
    health_score: int = 0
    health_status: str = "healthy"
    health_emoji: str = "🌳"
    days_since_contact: int = 0

    @classmethod
    def from_person(cls, person: Person) -> "PersonRead":
        """Create PersonRead with computed health fields"""
        health_score = calculate_health_score(person.last_contact_date)
        health_status = get_health_status(health_score)
        days_since_contact = (datetime.utcnow() - person.last_contact_date).days

        return cls(
            **person.dict(),
            health_score=health_score,
            health_status=health_status,
            health_emoji=get_health_emoji(health_status),
            days_since_contact=days_since_contact,
        )

# Update list endpoint
@router.get("/")
async def get_people(
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
) -> list[PersonRead]:
    people = db.exec(
        select(Person).where(Person.user_id == current_user.id)
    ).all()

    return [PersonRead.from_person(p) for p in people]
```

#### Update SMS Webhook

**File: `api/routers/sms.py`**

```python
@router.post("/webhook")
async def sms_webhook(
    request: Request,
    db: Session = Depends(get_session)
):
    """
    Twilio webhook - receive and store SMS messages.
    Update last_contact_date to refresh health score.
    """
    form_data = await request.form()

    # ... existing SMS processing ...

    # Update last contact date (refreshes health score)
    person = db.get(Person, person_id)
    person.last_contact_date = datetime.utcnow()
    db.add(person)
    db.commit()

    return {"status": "received"}
```

**Optional: Manual "Mark as Contacted" endpoint**

```python
@router.post("/{person_id}/contact")
async def mark_as_contacted(
    person_id: UUID,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Manually mark that you contacted this person"""
    person = db.get(Person, person_id)
    if not person or person.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Person not found")

    person.last_contact_date = datetime.utcnow()
    db.add(person)
    db.commit()

    health_score = calculate_health_score(person.last_contact_date)
    return {
        "message": "Contact logged",
        "health_score": health_score
    }
```

---

### Phase 4: Frontend (1-2 days)

#### Health Score Component

**File: `webclient/src/components/HealthScore.tsx`**

```typescript
import React from 'react'

type HealthStatus = 'healthy' | 'warning' | 'dormant'

interface HealthScoreProps {
  score: number
  status: HealthStatus
  emoji: string
  daysSinceContact: number
  size?: 'sm' | 'md'
}

const STATUS_COLORS = {
  healthy: 'text-green-600',
  warning: 'text-yellow-600',
  dormant: 'text-red-600',
}

const STATUS_BG = {
  healthy: 'bg-green-50',
  warning: 'bg-yellow-50',
  dormant: 'bg-red-50',
}

export function HealthScore({
  score,
  status,
  emoji,
  daysSinceContact,
  size = 'md'
}: HealthScoreProps) {
  const isSmall = size === 'sm'

  return (
    <div className={`flex items-center gap-2 ${STATUS_BG[status]} rounded-lg px-3 py-2`}>
      <span className={isSmall ? 'text-lg' : 'text-2xl'}>{emoji}</span>
      <div>
        <div className={`font-semibold ${STATUS_COLORS[status]} ${isSmall ? 'text-sm' : 'text-base'}`}>
          {score}
        </div>
        {!isSmall && (
          <div className="text-xs text-gray-500">
            {daysSinceContact}d ago
          </div>
        )}
      </div>
    </div>
  )
}
```

#### Update People List

**File: `webclient/src/components/layout/PeopleList.tsx`**

Replace intent filtering with health filtering:

```typescript
const HEALTH_FILTERS = [
  { label: 'All', value: null },
  { label: 'Needs Attention', value: 'warning', emoji: '⚠️' },
  { label: 'Dormant', value: 'dormant', emoji: '🪵' },
  { label: 'Healthy', value: 'healthy', emoji: '🌳' },
]

// Filter logic
const filteredPeople = people.filter(person => {
  if (!healthFilter) return true
  return person.health_status === healthFilter
})

// Sort by health score (lowest first) to surface people who need attention
const sortedPeople = [...filteredPeople].sort((a, b) =>
  a.health_score - b.health_score
)

// In person card, replace intent badge with:
<HealthScore
  score={person.health_score}
  status={person.health_status}
  emoji={person.health_emoji}
  daysSinceContact={person.days_since_contact}
  size="sm"
/>
```

#### Update Person Profile

**File: `webclient/src/components/layout/PersonProfile.tsx`**

```typescript
// Add health score display
<div className="mb-4">
  <HealthScore
    score={person.health_score}
    status={person.health_status}
    emoji={person.health_emoji}
    daysSinceContact={person.days_since_contact}
    size="md"
  />
</div>

// Add "Mark as Contacted" button
<button
  onClick={async () => {
    await fetch(`/api/people/${person.id}/contact`, { method: 'POST' })
    refetch()
  }}
  className="px-4 py-2 bg-blue-600 text-white rounded-lg"
>
  Mark as Contacted
</button>
```

#### Update TypeScript Types

**File: `webclient/src/types/api.ts`**

```typescript
export interface Person {
  id: string
  name: string
  body: string
  birthday?: string
  mnemonic?: string
  zip?: string
  profile_pic_index: number
  email?: string
  phone_number?: string
  last_contact_date: string

  // Computed fields
  health_score: number
  health_status: 'healthy' | 'warning' | 'dormant'
  health_emoji: string
  days_since_contact: number

  created_at: string
  user_id: string
}
```

---

## Testing Checklist

- [ ] Migration runs successfully
- [ ] Health score calculates correctly for various dates
- [ ] SMS updates last_contact_date
- [ ] Manual "mark as contacted" works
- [ ] People list shows health scores
- [ ] Filtering by health status works
- [ ] Sorting by score works (lowest first)
- [ ] UI shows correct colors for each status
- [ ] All existing tests still pass

---

## What We're NOT Building (Yet)

These are features to consider AFTER validating V1:

- ❌ Interaction history table
- ❌ Quality levels (surface/meaningful/deep)
- ❌ Multiple interaction types
- ❌ Relationship tiers
- ❌ Anti-gaming mechanisms
- ❌ Daily decay background job
- ❌ Velocity/trend tracking
- ❌ Predictions
- ❌ Dashboard with statistics
- ❌ Notifications

**Why?** We don't know if users will care about basic health scores yet. Build these if users ask for them.

---

## Success Metrics (Week 1-2)

1. **Understanding:** Do users understand what the score means?
2. **Accuracy:** Do users feel the scores match reality?
3. **Motivation:** Do users reach out to "warning" or "dormant" contacts more?
4. **Complaints:** What do users say is missing or wrong?

---

## Tuning Parameters (Easy to Adjust)

If users complain the decay is too fast/slow:

```python
# In health_score.py, change this one number:
DECAY_RATE_PER_DAY = 1.5  # Adjust based on feedback

# Or make thresholds more/less sensitive:
def get_health_status(score: int) -> HealthStatus:
    if score >= 70:  # Adjust these thresholds
        return "healthy"
    elif score >= 40:
        return "warning"
    else:
        return "dormant"
```

Ship, measure, tune, repeat.

---

## Future Iterations (Based on Feedback)

### If users say: "Some people I talk to less often but they're still important"
**Then add:** Relationship tiers with different decay rates

### If users say: "I want to track when I had coffee vs just texted"
**Then add:** Interaction types and history

### If users say: "I don't remember to mark contacts manually"
**Then add:** Better auto-detection from calendar, email, etc.

### If users say: "The score drops too fast initially"
**Then add:** Grace periods or exponential decay

---

## Deployment Plan

1. **Deploy to staging** with test data
2. **Manual QA:** Test all flows
3. **Deploy to production**
4. **Monitor:** Watch for errors, user feedback
5. **Iterate:** Based on actual usage

---

## Timeline

- **Day 1:** Database migration + backend logic
- **Day 2:** API endpoints + SMS integration
- **Day 3:** Frontend components
- **Day 4:** Testing + polish
- **Day 5:** Deploy + monitor

**Total: 3-5 days** (vs 3-4 weeks for the complex version)

---

## The Key Insight

The value isn't in complex formulas. The value is in:
1. **Automatic tracking** (no manual categorization)
2. **Visual feedback** (tree emoji shows status at a glance)
3. **Prioritization** (sort by score to see who needs attention)

Everything else is speculation. Build the core, validate it, then iterate.

---

## Questions to Answer With V1

- Do users check the health scores?
- Do they reach out to people with low scores?
- Do they understand what affects the score?
- What's the first feature they ask for?

**Then build that feature.** Not before.

---

_This plan follows YAGNI principles: build the simplest thing that could work, ship it fast, learn from real users, iterate based on data._
