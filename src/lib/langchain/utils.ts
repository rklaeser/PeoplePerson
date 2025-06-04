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
Return ONLY the names of the matching people, separated by commas if there are multiple matches.
If no one matches, return "No matches found".

Keep your response no more than 10 words. If you don't know the answer, return "I'm not sure, what else could you tell me about them?". If there are multiple matches, say "You probably mean 'bestMatch' but you might also mean 'otherMatches'".
`);

  const peopleList = people.map(person => 
    `Name: ${person.name}\nDescription: ${person.body}\nIntent: ${person.intent}\nRegion: ${person.region}\n---`
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