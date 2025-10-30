# Simplified Guide Journal Feature Plan

## Core Principle
**Use flexible text fields with markdown formatting instead of rigid schemas**. Let the AI structure its responses naturally rather than forcing everything into typed arrays and nested objects.

---

## Simplified Data Model

### Journal Entry (Minimal Structure)

```typescript
interface JournalEntry {
  id: string;
  userId: string;
  date: string; // ISO date (YYYY-MM-DD)

  // User content
  content: string; // Raw journal entry text

  // Linking
  peopleIds: string[]; // IDs of people mentioned (for bidirectional linking)

  // AI-generated content (all markdown-formatted)
  aiResponse?: string; // Insights, questions, conversation plans formatted as markdown

  // Conversation tracking (optional, only if this entry involves conversation planning)
  conversationWith?: string; // personId if planning conversation
  conversationStatus?: 'planned' | 'completed';

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**That's it. 9 fields total, most optional.**

---

## Why This Is Simpler

### Original Proposal (Rejected)
```typescript
interface JournalEntry {
  id: string;
  userId: string;
  date: string;
  entry: string;
  peopleIds: string[];
  peopleNames?: Record<string, string>;
  emotions: string[];           // ❌ Over-engineered
  topics: string[];             // ❌ Over-engineered
  insights?: string[];          // ❌ Should be single markdown
  questions?: string[];         // ❌ Should be single markdown
  conversationPlans?: ConversationPlan[]; // ❌ Complex nested object
  decisions?: Decision[];       // ❌ YAGNI
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface ConversationPlan {
  personId: string;
  personName?: string;
  goal: string;
  keyPoints: string[];
  concerns?: string[];
  openings?: Record<string, string>;
  reassurances?: string[];
}

interface Decision {
  description: string;
  status: 'pending' | 'made' | 'deferred';
  timeframe?: string;
}
```

**Problems:**
- 14+ fields across multiple interfaces
- Rigid structure forces AI into specific formats
- Arrays of strings everywhere (emotions[], topics[], insights[], questions[])
- Nested objects (ConversationPlan with 7 fields)
- Decision tracking (YAGNI - add later if actually needed)

### Simplified Proposal (Recommended)
```typescript
interface JournalEntry {
  id: string;
  userId: string;
  date: string;
  content: string;              // ✅ User's journal entry
  peopleIds: string[];          // ✅ For bidirectional linking
  aiResponse?: string;          // ✅ All AI content as markdown
  conversationWith?: string;    // ✅ Optional conversation tracking
  conversationStatus?: 'planned' | 'completed';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Benefits:**
- 9 fields total (vs 14+)
- No nested objects (vs ConversationPlan, Decision)
- AI formats naturally in markdown
- Easy to evolve (just change markdown formatting)
- Still achieves all desired features

---

## AI Response Formatting

Instead of rigid schemas, the AI formats its response as markdown:

```markdown
## Insights
- You've been together every day for three weeks - that's intense
- Her phrase "find the we without losing the I" actually supports your need
- The way you frame this conversation will matter

## Questions to Reflect On
- How much alone time do you actually need per week?
- What does Jordan need? Have you asked?
- What does "finding the I" mean for you?

## Conversation Plan: Talk with Jordan

**Goal:** Propose regular nights apart for individual reflection

**Opening Line Options:**
- "I love you, and I love spending time with you..."
- "Remember when you said we need to find the we without losing the I?"

**Key Points:**
1. Start with affirmation of love and commitment
2. Reference her wisdom about maintaining individuality
3. Frame alone time as strengthening the relationship
4. Propose specific schedule (e.g., Tuesday nights apart)

**Potential Concerns:**
- She might hear "I don't want to be with you"
- Be clear this is about personal growth, not distance

**Reassurances:**
- This will make our time together more meaningful
- You're not pulling away, you're investing in yourself to bring more to "us"
```

This gives structure through **markdown conventions** rather than **typed fields**.

---

## How This Achieves Your Features

### 1. ✅ Journal entries referencing multiple people
- `peopleIds: string[]` - simple array of IDs
- Query: `where('peopleIds', 'array-contains', personId)`

### 2. ✅ Emotional processing & reflection
- User writes in `content` field (freeform)
- AI responds in `aiResponse` with insights section

### 3. ✅ Conversation planning with talking points
- AI includes "## Conversation Plan" section in `aiResponse`
- `conversationWith` stores the personId
- `conversationStatus` tracks 'planned' → 'completed'

### 4. ✅ Bidirectional linking
- Journal → People: `peopleIds` array
- People → Journal: Query where `array-contains`
- Person profile shows "Journal" tab with entries

### 5. ✅ Pattern recognition (future)
- All content is in searchable text fields
- Can query across `content` and `aiResponse`
- Can add embedding search later if needed

### 6. ✅ Track open questions & upcoming plans
- Parse `aiResponse` for "## Questions" sections
- Query `conversationStatus === 'planned'` for upcoming plans
- Display in sidebar

---

## Firestore Structure

```
users/
  {userId}/
    people/
      {personId}/
        - name, email, phoneNumber, tags, etc.
        memories/              # Existing - factual logs attached to ONE person
          {entryDate}/
            - content
        messages/              # Existing - SMS history

    journal/                   # NEW - reflections spanning MULTIPLE people
      {entryId}/
        - date: "2025-10-28"
        - content: "I'm thinking about..."
        - peopleIds: ["person123", "person456"]
        - aiResponse: "## Insights\n- ..."
        - conversationWith: "person123"
        - conversationStatus: "planned"
```

### Firestore Indexes Needed
```
users/{userId}/journal
  - peopleIds (array)
  - date (desc)
  - conversationStatus
```

---

## Implementation Phases (Simplified)

### Phase 1: Basic Journal Storage (1-2 days)
- [ ] Create `journal` collection in Firestore
- [ ] TypeScript interface for JournalEntry
- [ ] Basic CRUD operations (create, read, update, delete)
- [ ] Security rules: users can only access their own journal

### Phase 2: UI - Journal List & Entry View (2-3 days)
- [ ] Add "Journal" section to left sidebar (collapsible)
- [ ] List recent journal entries (date + preview)
- [ ] Entry detail view (show content + aiResponse as rendered markdown)
- [ ] "New Entry" button + simple textarea
- [ ] Person badges (clickable links to profiles)

### Phase 3: AI Integration (2-3 days)
- [ ] Extend Gemini integration for journal processing
- [ ] Extract `peopleIds` from entry content (match against existing people)
- [ ] Generate `aiResponse` with insights, questions, conversation plans
- [ ] Handle conversation planning intent (set `conversationWith`, `conversationStatus`)

### Phase 4: Person Profile Integration (1 day)
- [ ] Add "Journal" tab to PersonPanel
- [ ] Query: `where('peopleIds', 'array-contains', personId)`
- [ ] Display journal entries that mention this person
- [ ] Show preview of entry + emotions/themes from aiResponse

### Phase 5: Conversation Tracking (1 day)
- [ ] "Mark as Discussed" button for entries with `conversationWith`
- [ ] Sidebar widget: "Upcoming Conversations" (status === 'planned')
- [ ] Prompt to reflect after marking conversation as completed

### Phase 6: Polish (ongoing)
- [ ] Parse aiResponse for "## Questions" → display in sidebar
- [ ] Search across journal entries
- [ ] Export functionality
- [ ] Rich text editor (optional)

**Total: ~1-2 weeks vs original 6-phase plan**

---

## Key Simplifications

| Original Proposal | Simplified Version | Why |
|------------------|-------------------|-----|
| `emotions: string[]` | Included in `aiResponse` markdown | No need for separate field, AI can mention emotions naturally |
| `topics: string[]` | Included in `aiResponse` markdown | Same reason - flexible vs rigid |
| `insights?: string[]` | Single `aiResponse` field | One markdown blob instead of array |
| `questions?: string[]` | Included in `aiResponse` markdown | Parse with markdown headers |
| `conversationPlans?: ConversationPlan[]` | `conversationWith + conversationStatus + aiResponse` | Single conversation per entry, plan in markdown |
| `decisions?: Decision[]` | REMOVED (YAGNI) | Add later only if you actually use it |
| `peopleNames?: Record<string, string>` | REMOVED | Just query Person records by ID when displaying |
| Complex `ConversationPlan` object | Markdown in `aiResponse` | AI formats naturally, easier to evolve |

---

## Migration Path (If You Build Original First)

If you've already built the complex version:

```typescript
// Convert old structure to new
function migrateJournalEntry(old: OldJournalEntry): JournalEntry {
  // Combine all structured fields into markdown
  const aiResponse = `
## Insights
${old.insights?.map(i => `- ${i}`).join('\n')}

## Questions
${old.questions?.map(q => `- ${q}`).join('\n')}

## Topics
${old.topics.join(', ')}

## Emotions
${old.emotions.join(', ')}

${old.conversationPlans?.[0] ? `
## Conversation Plan with ${old.conversationPlans[0].personName}

**Goal:** ${old.conversationPlans[0].goal}

**Key Points:**
${old.conversationPlans[0].keyPoints.map((p, i) => `${i+1}. ${p}`).join('\n')}
` : ''}
  `.trim();

  return {
    id: old.id,
    userId: old.userId,
    date: old.date,
    content: old.entry,
    peopleIds: old.peopleIds,
    aiResponse,
    conversationWith: old.conversationPlans?.[0]?.personId,
    conversationStatus: 'planned',
    createdAt: old.createdAt,
    updatedAt: old.updatedAt
  };
}
```

---

## Example Usage Flow

### User writes journal entry:
```
User: "I'm struggling with Jordan's jealousy about Kiara. We've been
       together every day for three weeks and I need space, but I don't
       know how to bring it up without hurting her feelings."
```

### System processes:
1. **Extract people:** Detects "Jordan" and "Kiara" → `peopleIds: [jordan_id, kiara_id]`
2. **Detect intent:** This involves conversation planning → `conversationWith: jordan_id`, `conversationStatus: 'planned'`
3. **Generate AI response:** Format as markdown with insights, questions, conversation plan
4. **Store:** Single document in `journal/{entryId}`

### Display in UI:
```
┌─────────────────────────────────────────────┐
│ October 28, 2025                            │
├─────────────────────────────────────────────┤
│ I'm struggling with Jordan's jealousy...    │
│ [full content]                              │
│                                             │
│ People: 👤 Jordan  👤 Kiara                │
│                                             │
├─────────────────────────────────────────────┤
│ [Rendered markdown of aiResponse]           │
│                                             │
│ Insights                                    │
│ • Three weeks together is intense           │
│ • Her wisdom supports your need             │
│                                             │
│ Conversation Plan: Talk with Jordan         │
│ Goal: Propose regular nights apart          │
│ ...                                         │
│                                             │
│ [Mark as Discussed]                         │
└─────────────────────────────────────────────┘
```

### In sidebar:
```
┌─────────────────────────┐
│ 💬 Upcoming Talks       │
│ Jordan: Space talk      │ ← conversationStatus === 'planned'
└─────────────────────────┘
```

---

## Technical Implementation Notes

### AI Prompt Structure
```typescript
const systemPrompt = `You are ${guideName}, helping the user process their thoughts about relationships.

When they write a journal entry:
1. Identify people mentioned (match against: ${peopleNames})
2. Provide insights about the situation
3. Ask reflective questions
4. If they're preparing for a conversation, create a structured plan

Format your response as markdown with sections:
## Insights
## Questions to Reflect On
## Conversation Plan (if applicable)
`;
```

### Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/journal/{entryId} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```

### Query Examples
```typescript
// Get all journal entries
const entries = await db
  .collection(`users/${userId}/journal`)
  .orderBy('date', 'desc')
  .limit(20)
  .get();

// Get entries mentioning a person
const personEntries = await db
  .collection(`users/${userId}/journal`)
  .where('peopleIds', 'array-contains', personId)
  .orderBy('date', 'desc')
  .get();

// Get upcoming conversations
const upcomingTalks = await db
  .collection(`users/${userId}/journal`)
  .where('conversationStatus', '==', 'planned')
  .orderBy('date', 'desc')
  .get();
```

---

## What You Get

**Same Features:**
- ✅ Multi-person journal entries
- ✅ Emotional processing
- ✅ Conversation planning
- ✅ Bidirectional linking
- ✅ Pattern recognition (via text search)
- ✅ Track upcoming conversations

**But Simpler:**
- 9 fields instead of 14+
- 1 interface instead of 3
- Markdown instead of rigid schemas
- Easier to evolve (just change markdown format)
- Less code to maintain
- Faster to implement

---

## Open Questions (Still Valid)

1. **Conversation follow-up**: After marking as "discussed," prompt for reflection entry?
2. **AI mode detection**: Explicit "Contact Management" vs "Reflection" mode, or auto-detect?
3. **Privacy**: Additional encryption for journal entries?
4. **Export**: Format for backing up journal entries?

---

**Document Version**: 2.0 (Simplified)
**Last Updated**: October 30, 2025
**Changes from v1.0**: Removed complex schemas, unified AI content in markdown, eliminated YAGNI features
