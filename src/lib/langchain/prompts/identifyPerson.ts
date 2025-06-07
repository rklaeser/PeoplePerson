import { PromptTemplate } from '@langchain/core/prompts';

export const identifyPersonPrompt = PromptTemplate.fromTemplate(`
You are an AI assistant helping to identify people based on user input and the detected action intent.

Given the following user input:
{text}

The detected action is: {action}

And the following list of existing people:
{peopleList}

Your task is to:
1. If action is "search": Find people who match the search description
2. If action is "update": Find the specific person being referenced for updating
3. If action is "create": Check if the person already exists (to avoid duplicates)

Return your response with:
- action: The confirmed action (search, create, update, or "clarify" if multiple people match)
- matchedIds: Array of IDs of matching people (empty array if no matches)
- confidence: "certain" if single clear match, "uncertain" if unsure, "no_matches" if none, "multiple_matches" if several people match
- reasoning: Brief explanation of your decision
- needsClarification: true if multiple people match and we need user to clarify which one

Guidelines:
- For "search": Return all matching people, even if multiple
- For "update": If multiple people have the same name/details, set needsClarification=true and action="clarify"
- For "create": If a person with similar name/details already exists, set needsClarification=true and action="clarify"
- If action is "update" but no existing person is found, change action to "create"
- If updating and multiple people match (same name, etc.), request clarification
- Pay attention to distinguishing details in the user input (nicknames, descriptions, context)

Examples:
- "Update John's phone number" with 2 Johns → needsClarification=true, action="clarify"
- "Update John Smith who works at Google" with 1 matching John → needsClarification=false
- "Find all my friends named Sarah" → return all Sarahs, needsClarification=false
`); 