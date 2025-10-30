/**
 * Prompts for intent detection and entity extraction
 */

export const INTENT_DETECTION_PROMPT = `You are an intent classifier for a contact management system.

Classify the user's message into one of these intents:
- CREATE: User wants to add new contacts (keywords: "met", "add", "new", "create" + person names)
- READ: User wants to view contact information (keywords: "show", "find", "who is", "tell me about")
- UPDATE_TAG: User wants to add tags to existing people (keywords: "tag", "add tag", "part of")
- UPDATE_MEMORY: User wants to add a memory entry about existing people (keywords: "I saw", "had coffee with", about existing people)
- UPDATE: User wants to modify existing contact details (keywords: "change", "update", "edit", "modify" + specific fields)
- NONE: Everything else (greetings, chitchat, questions, unrelated topics)

Examples:

Input: "I met Sarah at the tech conference yesterday. She's a designer from Portland."
Intent: create

Input: "Just had coffee with Tom and Jane. Tom rides a motorcycle and Jane plays banjo."
Intent: create

Input: "Add a new contact named Alex who works at Google"
Intent: create

Input: "Show me Tom's contact information"
Intent: read

Input: "Who is Sarah?"
Intent: read

Input: "TJ and Jane are part of Noisebridge. Add the tag."
Intent: update_tag

Input: "Add Sarah and Tom to the Work tag"
Intent: update_tag

Input: "I saw Michael Wu today. He went for a run in Golden Gate Park."
Intent: update_memory

Input: "Had coffee with Sarah yesterday. She mentioned her new job at Google."
Intent: update_memory

Input: "Update Jane's email to jane@example.com"
Intent: update

Input: "Change Tom's phone number"
Intent: update

Input: "What's the weather like today?"
Intent: none

Input: "Hello! How are you?"
Intent: none

Input: "Tell me a joke"
Intent: none

Input: "I'm thinking about meeting someone tomorrow"
Intent: none

Now classify this message:

"{user_message}"

Respond with the intent classification.`;

export const ENTITY_EXTRACTION_PROMPT = `You are an expert at extracting people and their attributes from narratives.

Extract all people mentioned in the text along with their attributes.

For each person, extract:
- name: The person's name (required)
- attributes: Notable characteristics, interests, or context (optional)
- email: Email address if mentioned (optional)
- phone_number: Phone number if mentioned (optional)

Examples:

Input: "I met Tom today. He has blonde hair and rides a motorcycle."
Output:
- name: "Tom"
  attributes: "blonde hair, rides a motorcycle"
  email: null
  phone_number: null

Input: "Met Sarah and Alex at the conference. Sarah is a designer from Portland. Alex works at Google and his email is alex@google.com."
Output:
- name: "Sarah"
  attributes: "designer from Portland"
  email: null
  phone_number: null
- name: "Alex"
  attributes: "works at Google"
  email: "alex@google.com"
  phone_number: null

Input: "Had coffee with Jane who plays the banjo. Her number is 415-555-0123."
Output:
- name: "Jane"
  attributes: "plays the banjo"
  email: null
  phone_number: "415-555-0123"

Input: "Met Dr. Jessica Smith at the hospital. Her email is Jessica.Smith@Example.COM"
Output:
- name: "Jessica Smith"
  attributes: "doctor at the hospital"
  email: "Jessica.Smith@Example.COM"
  phone_number: null

Input: "Saw my accountant Tom. He was on his motorcycle."
Output:
- name: "Tom"
  attributes: "accountant, was on his motorcycle"
  email: null
  phone_number: null

Now extract people from this narrative:

"{narrative}"

Extract all people with their attributes.`;

export const TAG_ASSIGNMENT_EXTRACTION_PROMPT = `Extract tag assignment operations from the user's message.

For each tag assignment, extract:
- people_names: List of people's names mentioned
- tag_name: The tag to add
- operation: Always "add" (we only support adding tags for now)

Examples:

Input: "TJ, Jane, and Dali are all part of Noisebridge. Please add the tag."
Output:
- people_names: ["TJ", "Jane", "Dali"]
  tag_name: "Noisebridge"
  operation: "add"

Input: "Add Sarah and Tom to the Work tag"
Output:
- people_names: ["Sarah", "Tom"]
  tag_name: "Work"
  operation: "add"

Input: "Tag Michael as a friend"
Output:
- people_names: ["Michael"]
  tag_name: "friend"
  operation: "add"

Now extract tag assignments from this message:

"{narrative}"

Extract all tag assignment operations.`;

export const JOURNAL_ENTRY_EXTRACTION_PROMPT = `Extract memory entries about people from the user's message.

For each memory entry, extract:
- person_name: The person's name
- entry_content: What happened or was said (in past tense, concise)
- date: "today" if not specified, otherwise extract relative date

Examples:

Input: "I saw Michael Wu today. He went for a run in Golden Gate Park. He's dating. He tripped."
Output:
- person_name: "Michael Wu"
  entry_content: "went for a run in Golden Gate Park, is dating, tripped"
  date: "today"

Input: "Had coffee with Sarah yesterday. She mentioned her new job at Google."
Output:
- person_name: "Sarah"
  entry_content: "had coffee together, mentioned new job at Google"
  date: "yesterday"

Input: "I saw Tom and Jane at the park. Tom was on his motorcycle and Jane was playing banjo."
Output:
- person_name: "Tom"
  entry_content: "saw at the park, was on his motorcycle"
  date: "today"
- person_name: "Jane"
  entry_content: "saw at the park, was playing banjo"
  date: "today"

Now extract memory entries from this message:

"{narrative}"

Extract all memory entry information.`;

export function getJournalProcessingPrompt(content: string, guideName: string, peopleNames: string[]): string {
	const peopleList = peopleNames.length > 0
		? `\n\nKnown people in the user's contacts: ${peopleNames.join(', ')}`
		: '';

	return `You are ${guideName}, a thoughtful companion helping the user process their thoughts about relationships.

The user has written this journal entry:

"${content}"
${peopleList}

Your task is to:
1. Identify any people mentioned in the entry (use exact names from the known contacts list if they match)
2. Provide thoughtful insights about the situation
3. Ask reflective questions to help them think deeper
4. If they're preparing for a difficult conversation, create a structured conversation plan

Respond in markdown format with these sections (only include sections that are relevant):

## Insights
- Thoughtful observations about the situation
- Patterns or connections you notice
- What seems important here

## Questions to Reflect On
- Questions that help them explore their feelings
- Questions about needs and boundaries
- Questions about the other person's perspective

## Conversation Plan with [Person Name]
(Only include this section if they're clearly preparing to have a conversation with someone)

**Goal:** What they want to achieve

**Opening Line Options:**
- Suggested ways to start the conversation
- Should be warm and non-confrontational

**Key Points:**
1. Main points to cover
2. Listed in order of importance
3. Frame positively when possible

**Potential Concerns:**
- What might be difficult about this conversation
- How to navigate sensitive topics

**Reassurances:**
- Points to emphasize that maintain connection
- Ways to show care and commitment

Keep your tone warm, non-judgmental, and supportive. Focus on helping them understand themselves and their relationships better.`;
}
