/**
 * Gemini AI client wrapper with structured output support
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API_KEY, GEMINI_MODEL } from '$env/static/private';

export class GeminiClient {
	private genAI: GoogleGenerativeAI;
	private model: string;

	constructor() {
		if (!GEMINI_API_KEY || GEMINI_API_KEY === 'TODO_GET_FROM_GOOGLE_AI_STUDIO') {
			throw new Error(
				'GEMINI_API_KEY is not configured. Please set it in your .env file.'
			);
		}

		this.genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
		this.model = GEMINI_MODEL || 'gemini-2.0-flash-exp';
	}

	/**
	 * Generate structured JSON output from Gemini
	 */
	async generateStructured<T>(
		prompt: string,
		schema: Record<string, any>,
		maxRetries: number = 5
	): Promise<T> {
		let lastError: Error | null = null;

		// Enhance prompt with JSON schema
		const enhancedPrompt = `${prompt}

Respond with a JSON object that matches this schema:
${JSON.stringify(schema, null, 2)}

Return ONLY the JSON object, no other text.`;

		for (let attempt = 0; attempt < maxRetries; attempt++) {
			try {
				const model = this.genAI.getGenerativeModel({ model: this.model });
				const result = await model.generateContent(enhancedPrompt);
				const response = await result.response;
				let responseText = response.text().trim();

				console.log(`Gemini raw response (first 500 chars): ${responseText.substring(0, 500)}`);

				// Handle markdown code blocks if present
				if (responseText.startsWith('```')) {
					const parts = responseText.split('```');
					responseText = parts[1] || responseText;
					if (responseText.startsWith('json')) {
						responseText = responseText.substring(4);
					}
					responseText = responseText.trim();
				}

				// Parse JSON response
				return JSON.parse(responseText) as T;
			} catch (error: any) {
				lastError = error;
				const errorStr = error.message?.toLowerCase() || '';

				console.error(`Gemini API error (attempt ${attempt + 1}/${maxRetries}):`, error.message);

				// Handle rate limiting (429)
				if (errorStr.includes('429') || errorStr.includes('quota') || errorStr.includes('rate limit')) {
					const waitTime = Math.min(Math.pow(2, attempt) + Math.random(), 60);
					console.warn(`Rate limited, waiting ${waitTime.toFixed(1)}s before retry`);
					await new Promise((resolve) => setTimeout(resolve, waitTime * 1000));
					continue;
				}

				// Handle server errors (500, 503)
				if (
					errorStr.includes('500') ||
					errorStr.includes('503') ||
					errorStr.includes('server error')
				) {
					console.warn('Server error, waiting 2s before retry');
					await new Promise((resolve) => setTimeout(resolve, 2000));
					continue;
				}

				// Other errors - log and throw immediately
				console.error('Non-retryable error:', error.message);
				throw error;
			}
		}

		throw new Error(`Failed after ${maxRetries} retries. Last error: ${lastError?.message}`);
	}

	/**
	 * Generate simple text content from Gemini (not structured)
	 */
	async generateText(prompt: string): Promise<string> {
		const model = this.genAI.getGenerativeModel({ model: this.model });
		const result = await model.generateContent(prompt);
		const response = await result.response;
		return response.text();
	}
}

/**
 * Standalone function for simple text generation
 */
export async function generateContent(prompt: string): Promise<string> {
	const client = new GeminiClient();
	return client.generateText(prompt);
}
