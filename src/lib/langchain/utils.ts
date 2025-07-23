import { model } from './config';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import { z } from 'zod';
import type { Friend } from '$lib/types';
import { identifyPersonPrompt } from './prompts/identifyPerson';
import { detectIntentPrompt } from './prompts/detectIntent';
import { extractPersonDataPrompt } from './prompts/extractPersonData';
import { extractUpdateDataPrompt } from './prompts/extractUpdateData';

// Zod schemas for structured outputs
const IntentDetectionSchema = z.object({
	action: z.enum(['search', 'create', 'update']),
	confidence: z.number().min(0).max(1)
});

const CreatePersonSchema = z.object({
	name: z.string(),
	body: z.string().nullable(),
	intent: z.enum(['romantic', 'core', 'archive', 'new', 'invest', 'associate']).nullable(),
	birthday: z.string().nullable(), // Should be YYYY-MM-DD format
	mnemonic: z.string().nullable()
});

const UpdatePersonSchema = z.object({
	personId: z.string(),
	name: z.string().nullable(),
	body: z.string().nullable(),
	intent: z.enum(['romantic', 'core', 'archive', 'new', 'invest', 'associate']).nullable(),
	birthday: z.string().nullable(), // Should be YYYY-MM-DD format
	mnemonic: z.string().nullable()
});

const FindPersonSchema = z.object({
	matchedIds: z.array(z.string()),
	confidence: z.enum(['certain', 'uncertain', 'no_matches'])
});

const IdentifyPersonSchema = z.object({
	action: z.enum(['search', 'create', 'update', 'clarify']),
	matchedIds: z.array(z.string()),
	confidence: z.enum(['certain', 'uncertain', 'no_matches', 'multiple_matches']),
	reasoning: z.string(),
	needsClarification: z.boolean()
});

// Shared function to identify people based on user input and detected intent
export async function identifyPerson(text: string, action: string, people: Friend[]) {
	const peopleList = people
		.map(
			(person) =>
				`ID: ${person.id}\nName: ${person.name}\nDescription: ${person.body}\nIntent: ${person.intent}\nMnemonic: ${person.mnemonic || 'none'}`
		)
		.join('\n---\n');

	const structuredModel = model.withStructuredOutput(IdentifyPersonSchema);

	const chain = RunnableSequence.from([identifyPersonPrompt, structuredModel]);

	const result = await chain.invoke({
		text,
		action,
		peopleList
	});

	return result;
}

// Function to detect intent (search, create, or update) from user input
export async function detectIntent(text: string): Promise<{ action: string; confidence: number }> {
	const structuredModel = model.withStructuredOutput(IntentDetectionSchema);

	const intentChain = RunnableSequence.from([detectIntentPrompt, structuredModel]);

	const result = await intentChain.invoke({ text });
	return result;
}

// Function to extract person creation data with structured output
export async function extractPersonData(text: string) {
	const structuredModel = model.withStructuredOutput(CreatePersonSchema);

	const chain = RunnableSequence.from([extractPersonDataPrompt, structuredModel]);

	return await chain.invoke({ text });
}

// Function to extract person update data with structured output
export async function extractUpdateData(text: string, people: Friend[]) {
	const peopleList = people
		.map(
			(person) =>
				`ID: ${person.id}\nName: ${person.name}\nDescription: ${person.body}\nIntent: ${person.intent}`
		)
		.join('\n---\n');

	const structuredModel = model.withStructuredOutput(UpdatePersonSchema);

	const chain = RunnableSequence.from([extractUpdateDataPrompt, structuredModel]);

	return await chain.invoke({
		text,
		people: peopleList
	});
}
