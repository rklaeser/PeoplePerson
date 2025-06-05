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

// Function to detect intent (search or create) from user input
export async function detectIntent(text: string): Promise<{ action: string; confidence: number }> {
  const intentPrompt = PromptTemplate.fromTemplate(`
You are an AI assistant helping to determine if a user's input is a search query or a request to create a new person.

Given the following input:

{text}

Determine if this is:
1. A search query (asking about existing people)
2. A request to create a new person (providing information about someone to add)

Return ONLY a JSON object in this exact format. Do not include markdown formatting, code blocks, or any other text:
{{
  "action": "search",
  "confidence": 0.95
}}

Where:
- action must be either "search" or "create"
- confidence must be a number between 0 and 1

Consider these patterns:
- Questions like "who", "where", "find", "search" typically indicate a search
- Statements with names and details typically indicate a create request
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