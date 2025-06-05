import { json } from '@sveltejs/kit';
import { model } from '$lib/langchain/config';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import { createPerson } from '$lib/db/utils/createPerson';
import { findPerson } from '$lib/langchain/utils';
import { Person } from '$lib/db/models/Person';
import { Intent } from '$lib/db/models/Person';
import type { Friend } from '$lib/types';

interface PersonWithAssociates extends Person {
  AssociatedPeople?: PersonWithAssociates[];
}

export async function POST({ request }) {
  try {
    console.log('here');
    const { text } = await request.json();

    // First, determine if this is a search or create request
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

    console.log('here');
    const intentResult = await intentChain.invoke({ text });
    console.log(intentResult);
    const { action, confidence } = JSON.parse(intentResult);

    // If it's a search request
    if (action === 'search' || confidence < 0.7) {
      const people = await Person.findAll({
        include: [
          {
            model: Person,
            as: 'AssociatedPeople',
            through: { attributes: [] }
          }
        ]
      }) as PersonWithAssociates[];

      // Convert Person objects to Friend objects
      const friends: Friend[] = people.map(person => ({
        ...person.toJSON(),
        birthday: person.birthday ? person.birthday.toISOString().split('T')[0] : null,
        associates: person.AssociatedPeople?.map(associate => ({
          ...associate.toJSON(),
          birthday: associate.birthday ? associate.birthday.toISOString().split('T')[0] : null
        }))
      }));

      const results = await findPerson(text, friends);
      return json({
        success: true,
        action: 'search',
        message: results
      });
    }

    // If it's a create request
    const createPrompt = PromptTemplate.fromTemplate(`
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

    const createChain = RunnableSequence.from([
      createPrompt,
      model,
      new StringOutputParser(),
    ]);

    const result = await createChain.invoke({ text });
    const personData = JSON.parse(result);

    // Helper function to safely get enum value
    function getEnumValue<T extends { [key: string]: string }>(
      enumObj: T,
      value: string | null
    ): T[keyof T] | undefined {
      if (!value) return undefined;
      const upperValue = value.toUpperCase();
      return Object.values(enumObj).includes(upperValue) ? upperValue as T[keyof T] : undefined;
    }

    // Create the person using our utility function
    const newPerson = await createPerson({
      name: personData.name,
      body: personData.body,
      intent: getEnumValue(Intent, personData.intent),
      birthday: personData.birthday ? new Date(personData.birthday) : null,
      mnemonic: personData.mnemonic
    });

    return json({
      success: true,
      action: 'create',
      message: `I created ${newPerson.name}`,
      person: newPerson
    });
  } catch (error) {
    console.error('Processing error:', error);
    return json({
      success: false,
      action: 'error',
      message: 'I failed to process your request',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
} 