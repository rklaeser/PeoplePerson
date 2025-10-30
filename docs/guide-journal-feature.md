# Guide Journal & Reflection Feature

## Overview

This document outlines a new feature for PeoplePerson that transforms the guide (Nico/Scout) from a simple contact management assistant into a personal reflection and emotional processing companion. The feature adds journaling capabilities that allow users to process thoughts and feelings, plan conversations, and derive insights about their relationships.

## Motivation

Users want to use the guide for more than just managing contact information. The current "memories" feature only captures factual interactions ("I saw Michael today. He went for a run."). This new feature enables:

- **Emotional processing**: Working through feelings about relationships and situations
- **Conversation planning**: Preparing for difficult discussions with structured talking points
- **Pattern recognition**: Identifying themes across multiple relationships
- **Decision making**: Processing choices and their implications
- **Cross-person reflections**: Thoughts that involve multiple people simultaneously

### Example Use Cases

1. Processing conflicted feelings about a partner's jealousy regarding friendships
2. Planning how to have a conversation about needing personal space
3. Reflecting on why multiple friends have concerns about a relationship
4. Preparing talking points for a difficult conversation with a parent

## Current State vs. Proposed State

### Current State

- **Guide location**: Right-side ChatPanel (hidden until opened)
- **Guide function**: AI-powered contact management (create/update people, tags, memories)
- **Data model**: Memories are simple date-stamped text entries attached to specific people
- **Limitation**: No way to process thoughts that span multiple people or aren't tied to a specific interaction

### Proposed State

- **Guide location**: Dedicated left sidebar section (equal prominence to People section)
- **Guide function**: Dual purpose - contact management + personal reflection/journaling
- **Data model**: Rich journal entries with metadata, insights, and conversation plans
- **Enhancement**: Bidirectional linking between journal entries and people

## Data Model

### Journal Entry Structure

```typescript
interface JournalEntry {
  id: string;
  userId: string;
  date: string;
  entry: string; // Raw text of the journal entry

  // Structured metadata (AI-extracted)
  peopleIds: string[]; // References to Person records mentioned
  peopleNames?: Record<string, string>; // { personId: "Jordan", ... }
  emotions: string[]; // e.g., ["conflicted", "anxious", "hopeful"]
  topics: string[]; // e.g., ["boundaries", "jealousy", "career"]

  // Processing outputs (AI-generated or user-added)
  insights?: string[];
  questions?: string[];

  // Forward-looking elements
  conversationPlans?: ConversationPlan[];
  decisions?: Decision[];

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface ConversationPlan {
  personId: string; // Links to specific person this conversation is with
  personName?: string;
  goal: string; // What you want to achieve in the conversation
  keyPoints: string[]; // Main points to cover
  concerns?: string[]; // Potential issues to navigate
  openings?: Record<string, string>; // Possible ways to start the conversation
  reassurances?: string[]; // Points to emphasize for sensitive topics
}

interface Decision {
  description: string; // What needs to be decided
  status: 'pending' | 'made' | 'deferred';
  timeframe?: string; // When this needs to be decided
}
```

### Firestore Structure

```
users/
  {userId}/
    people/
      {personId}/
        - name, phone, tags, etc.
        memories/ (existing - interaction logs)
        messages/ (existing - SMS history)

    journal/ (NEW)
      {entryId}/
        - entry text
        - peopleIds: ["person123", "person456"]
        - emotions, topics, insights
        - conversationPlans
        - decisions
```

## UI Structure

### Left Sidebar - New Guide Section

```
┌─────────────────────────┐
│ 🧭 Nico                 │ ← Guide avatar/name
├─────────────────────────┤
│ [+ New Reflection]      │ ← Quick entry button
├─────────────────────────┤
│ Recent Entries:         │
│ 📝 Today: Jordan talk   │
│ 📝 Oct 28: Dad meeting  │
│ 📝 Oct 24: Friends...   │
├─────────────────────────┤
│ Upcoming Plans:         │
│ 💬 Jordan: Space talk   │
│ 💬 Dad: Job search      │
├─────────────────────────┤
│ Open Questions:         │
│ ❓ Friendship boundaries│
│ ❓ Career direction     │
└─────────────────────────┘
```

### Main Area - Journal Entry View

When viewing a journal entry:

```
┌─────────────────────────────────────────────┐
│ Oct 28, 2025                                │
├─────────────────────────────────────────────┤
│ I'm thinking about a conversation I had     │
│ with Jordan about our schedule...           │
│ [Full entry text]                           │
│                                             │
├─────────────────────────────────────────────┤
│ People: 👤 Jordan                           │
│                                             │
│ Emotions: thoughtful, cautious, caring      │
│                                             │
│ Topics: personal_space, boundaries,         │
│         relationship_health                 │
│                                             │
├─────────────────────────────────────────────┤
│ 💡 Insights:                                │
│ • Three weeks of daily togetherness is a lot│
│ • Her phrase "find the we without losing    │
│   the I" supports this idea                 │
│ • The way I frame this matters              │
│                                             │
├─────────────────────────────────────────────┤
│ 💬 Conversation Plan with Jordan:           │
│                                             │
│ Goal: Propose regular nights apart for      │
│       individual reflection                 │
│                                             │
│ Opening: "I love you, and I love spending   │
│ time with you..."                           │
│                                             │
│ Key Points:                                 │
│ • Start with affirmation of love            │
│ • Reference her wisdom about "the I"        │
│ • Frame as strengthening us                 │
│                                             │
│ [Mark as discussed] [Edit plan]             │
└─────────────────────────────────────────────┘
```

### Person Profile - Journal Tab

When viewing a specific person (e.g., Jordan):

```
┌─────────────────────────────────────────────┐
│ Jordan                                      │
│ 📱 555-1234                                 │
├─────────────────────────────────────────────┤
│ [About] [Memories] [Messages] [Journal]     │
├─────────────────────────────────────────────┤
│ Referenced in 4 journal entries:            │
│                                             │
│ 📝 Oct 28 - Personal space & boundaries     │
│    "...three weeks together every day...    │
│    find the we without losing the I..."     │
│    Emotions: thoughtful, cautious           │
│    [View full entry →]                      │
│                                             │
│ 📝 Oct 24 - Friends' reactions              │
│    "Why don't Jordan and my galpals get     │
│    along?..."                               │
│    Emotions: defensive, confused            │
│    [View full entry →]                      │
│                                             │
│ 📝 Oct 23 - London trip decision            │
│    "...signing up to London feels weird     │
│    after the fight..."                      │
│    Emotions: conflicted, hesitant           │
│    [View full entry →]                      │
└─────────────────────────────────────────────┘
```

## Key Features

### 1. Bidirectional Linking

- **Journal → People**: Each entry stores `peopleIds` array of all people mentioned
- **People → Journal**: Query journal entries where `peopleIds` contains the person's ID
- **UI**: Clickable person badges in journal entries, journal tab in person profiles

### 2. AI-Powered Extraction

When user writes to the guide:

```
User: "I'm struggling with Jordan's jealousy about Kiara. I don't know if her
       boundaries are reasonable..."

AI extracts:
- People: Jordan, Kiara
- Emotions: struggling, uncertain
- Topics: jealousy, boundaries
- Potential insights: [generated based on conversation]
```

### 3. Conversation Planning

Guide helps structure difficult conversations:
- Goal setting
- Key points to cover
- Potential concerns to address
- Opening lines
- Reassurances to provide

### 4. Pattern Recognition

Over time, the guide can identify:
- Recurring themes across entries
- Emotional patterns
- Questions that keep coming up
- Progress on decisions

### 5. Flexible Person References

- **Known people**: Automatically linked to existing Person records
- **Unknown people**: AI detects mentions, prompts user to add to contacts
- **Manual linking**: User can add/remove people from entries later
- **Deletion handling**: If person is deleted, name remains in journal as text

## Implementation Phases

### Phase 1: Core Data Structure
- [ ] Create `journal` collection in Firestore
- [ ] Define TypeScript interfaces for JournalEntry, ConversationPlan, Decision
- [ ] Add Firestore security rules for journal collection
- [ ] Create basic CRUD operations for journal entries

### Phase 2: Guide UI Section
- [ ] Add Guide section to left sidebar (parallel to People)
- [ ] Create journal entry list view (recent entries)
- [ ] Create journal entry detail view
- [ ] Add "New Reflection" button with text input

### Phase 3: AI Integration
- [ ] Extend existing Gemini integration for journal processing
- [ ] Extract people mentions and link to Person records
- [ ] Extract emotions, topics from entry text
- [ ] Generate initial insights and questions
- [ ] Create conversation plan structure with AI assistance

### Phase 4: Person Profile Integration
- [ ] Add "Journal" tab to PersonPanel
- [ ] Query and display journal entries that reference the person
- [ ] Add person badges to journal entries (clickable to profiles)
- [ ] Show entry previews with emotions/topics

### Phase 5: Advanced Features
- [ ] Conversation plan tracking (mark as discussed/completed)
- [ ] Decision tracking (pending → made)
- [ ] Pattern recognition across entries
- [ ] Search and filter (by emotion, topic, person)
- [ ] Export journal entries

### Phase 6: Polish
- [ ] Guide personality integration (Scout vs. Nico processing style)
- [ ] Rich text editing for journal entries
- [ ] Inline person linking while typing (@Jordan autocomplete)
- [ ] Timeline view of reflections
- [ ] Emotion/topic analytics

## Technical Considerations

### Firestore Queries

**Get all journal entries for a person:**
```typescript
firebase
  .collection(`users/${userId}/journal`)
  .where('peopleIds', 'array-contains', personId)
  .orderBy('date', 'desc')
  .get()
```

**Get recent journal entries:**
```typescript
firebase
  .collection(`users/${userId}/journal`)
  .orderBy('date', 'desc')
  .limit(20)
  .get()
```

### AI Prompting Strategy

The guide needs different prompting for:
1. **Contact management mode**: "Extract people, tags, memories from this message"
2. **Reflection mode**: "Help me process these feelings and plan this conversation"

Can use intent detection or explicit mode switching.

### Privacy & Security

- Journal entries are highly personal and sensitive
- Firestore security rules must ensure users can only access their own journal
- Consider encryption at rest for journal content
- Clear user consent for AI processing of emotional content

### Performance

- Journal entries could grow large over time
- Use pagination for list views
- Index on common query patterns (peopleIds, date, userId)
- Consider caching recent entries

## Open Questions

1. **Mode switching**: Should the guide have explicit "Contact Management" vs. "Reflection" modes, or intelligently detect intent?

2. **Conversation plan workflow**: After marking a conversation as "discussed," should we prompt for a follow-up reflection on how it went?

3. **Memory vs. Journal**: How do we distinguish between:
   - Memory: "I saw Michael today, he went for a run" (factual log)
   - Journal: "I'm processing feelings about Michael's behavior" (reflection)

4. **Shared reflections**: Could journal entries ever be shared with others, or always private?

5. **Guide personality**: How much should Scout vs. Nico's personality influence reflection processing style?

6. **Analytics**: Should we show users analytics on their emotions over time, frequent topics, etc.?

## Success Metrics

- Users create journal entries regularly (not just contact management)
- Users reference conversation plans when preparing for discussions
- Users report feeling heard and supported by the guide
- Journal entries successfully link to relevant people
- Users find value in seeing journal context when viewing person profiles

## Related Features

- This complements the existing memories feature (memories = factual logs, journal = emotional processing)
- Could integrate with SMS messages (reflect on a conversation you had)
- Could integrate with tags (journal about all friends in "College" tag)
- Future: Share select journal entries or insights with therapist/coach

---

**Document Version**: 1.0
**Last Updated**: October 30, 2025
**Author**: Reed (with Claude)
