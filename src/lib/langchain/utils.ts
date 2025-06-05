import { model } from './config';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import type { Friend } from '$lib/types';

// Function to find people based on a description
export async function findPerson(description: string, people: Friend[]) {
  const prompt = PromptTemplate.fromTemplate(`
You are an AI assistant helping to find people based on descriptions.
Given the following list of people and their descriptions:

{peopleList}

And this search description:
{description}

Please identify the person or people who best match this description.
Return ONLY the IDs of the matching people, separated by commas if there are multiple matches.
If no one matches, return 0.
If you're not sure, return -1.

Examples:
- Single match: "123"
- Multiple matches: "123,456,789"
- No matches: "0"
- Uncertain: "-1"
`);

  const peopleList = people.map(person => 
    `ID: ${person.id}\nName: ${person.name}\nDescription: ${person.body}\nIntent: ${person.intent}---`
  ).join('\n');

  const chain = RunnableSequence.from([
    prompt,
    model,
    new StringOutputParser(),
  ]);

  const result = await chain.invoke({
    peopleList,
    description
  });

  return result;
}

// Function to detect intent (search, create, or update) from user input
export async function detectIntent(text: string): Promise<{ action: string; confidence: number }> {
  const intentPrompt = PromptTemplate.fromTemplate(`
You are an AI assistant helping to determine if a user's input is a search query, a request to create a new person, or a request to update an existing person.

Given the following input:

{text}

Determine if this is:
1. A search query (asking about existing people)
2. A request to create a new person (providing information about someone to add)
3. A request to update an existing person (adding/modifying information about someone who already exists)

Return ONLY a JSON object in this exact format. Do not include markdown formatting, code blocks, or any other text:
{{
  "action": "search",
  "confidence": 0.95
}}

Where:
- action must be either "search", "create", or "update"
- confidence must be a number between 0 and 1

Consider these patterns:
- Questions like "who", "where", "find", "search" typically indicate a search
- Statements with names and details for new people typically indicate a create request
- Statements about adding information to, updating, or modifying existing people indicate an update
- Phrases like "update John's", "add to Sarah's profile", "change Mike's", "John now works at" indicate updates
- If the text mentions someone by name and adds new information about them, it's likely an update
- If unsure, default to search
`);

  const intentChain = RunnableSequence.from([
    intentPrompt,
    model,
    new StringOutputParser(),
  ]);

  const intentResult = await intentChain.invoke({ text });
  return JSON.parse(intentResult);
}

// Function to get the create person prompt template
export function createPersonPrompt(): PromptTemplate {
  return PromptTemplate.fromTemplate(`
You are an AI assistant helping to create a new person in a database.
Given the following description:

{text}

Please extract the following information in a structured format:
- name (required)
- body (optional, description of the person). If there information provided about the person does not fit into another field, put it here.
- intent (optional, must be one of: romantic, core, archive, new, invest, associate). If none, default to new.
- birthday (optional, in YYYY-MM-DD format). If none, default to null's date.
- mnemonic (optional, a memorable phrase or word). If none, create a mnemonic using three or fewer words for the person based off the name and any other information provided.

Return ONLY a valid JSON object in this exact format. Do not include markdown formatting, code blocks, or any other text:

{{
  "name": "string",
  "body": "string or null",
  "intent": "string or null",
  "birthday": "string or null",
  "mnemonic": "string or null"
}}

IMPORTANT: Return only the JSON object, no markdown backticks, no explanations, no additional text.
`);
} 

// Function to get the update person prompt template
export function updatePersonPrompt(): PromptTemplate {
  return PromptTemplate.fromTemplate(`
You are an AI assistant helping to update an existing person in a database.
Given the following update request:

{text}

And the following list of existing people:

{people}

Please identify which person to update and what information to update:
- personId (required, the id of the person to update from the people list)
- name (optional, only if the name should be changed)
- body (optional, additional description to add or replace)
- intent (optional, must be one of: romantic, core, archive, new, invest, associate)
- birthday (optional, in YYYY-MM-DD format)
- mnemonic (optional, a memorable phrase or word)

Only include fields that should be updated. If a field is not mentioned in the update request, do not include it in the response.

Return ONLY a valid JSON object in this exact format. Do not include markdown formatting, code blocks, or any other text:

{{
  "personId": "string",
  "name": "string or null",
  "body": "string or null",
  "intent": "string or null",
  "birthday": "string or null",
  "mnemonic": "string or null"
}}

IMPORTANT: Return only the JSON object, no markdown backticks, no explanations, no additional text.
`);
}