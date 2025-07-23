import { PromptTemplate } from '@langchain/core/prompts';

export const detectIntentPrompt = PromptTemplate.fromTemplate(`
You are an AI assistant helping to determine if a user's input is a search query, a request to create a new person, or a request to update an existing person.

Given the following input:
{text}

Determine if this is:
1. A search query (asking about existing people)
2. A request to create a new person (providing information about someone to add)
3. A request to update an existing person (adding/modifying information about someone who already exists)

Consider these patterns:
- Questions like "who", "where", "find", "search" typically indicate a search
- Statements with names and details for new people typically indicate a create request
- Statements about adding information to, updating, or modifying existing people indicate an update
- Phrases like "update John's", "add to Sarah's profile", "change Mike's", "John now works at" indicate updates
- If the text mentions someone by name and adds new information about them, it's likely an update
- If unsure, default to search

Provide:
- action: either "search", "create", or "update"
- confidence: a number between 0 and 1 representing how confident you are in this classification
`);
