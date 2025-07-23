import { ChatAnthropic } from '@langchain/anthropic';
import { ANTHROPIC_API_KEY } from '$env/static/private';

// Initialize the OpenAI model
export const model = new ChatAnthropic({
	modelName: 'claude-sonnet-4-20250514',
	temperature: 0.7,
	anthropicApiKey: ANTHROPIC_API_KEY
});
