import { json } from '@sveltejs/kit';
import { model } from '$lib/langchain/config';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import { createPerson } from '$lib/db/utils/createPerson';
import { Intent } from '$lib/db/models/Person';

export async function POST({ request }) {
  try {
    const { description } = await request.json();

    const prompt = PromptTemplate.fromTemplate(`
        You are an AI assistant helping to create a new person in a database.
        Given the following description:
        
        {description}
        
        Please extract the following information in a structured format:
        - name (required)
        - body (optional, description of the person). If there information provided about the person does not fit into another field, put it here.
        - intent (optional, must be one of: romantic, core, archive, new, invest, associate). If none, default to new.
        - birthday (optional, in YYYY-MM-DD format). If none, default to null's date.
        - mnemonic (optional, a memorable phrase or word). If none, create a mnemonic for the person based off the name and any other information provided.
        
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
    const chain = RunnableSequence.from([
      prompt,
      model,
      new StringOutputParser(),
    ]);

    const result = await chain.invoke({
      description
    });

    // Parse the JSON response
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
      message: `I created ${newPerson.name}`,
      person: newPerson 
    });
  } catch (error) {
    console.error('Create error:', error);
    return json({ 
      success: false, 
      message: 'I failed to create a new person',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
} 