import type { ChatMessage, Friend } from '$lib/types';
import { PersonService } from '$lib/services/personService.server';
import { extractPersonData } from '$lib/langchain/utils';
import { Intent } from '$lib/db/models/Person';
import { ChangeType } from '$lib/db/models';

export class PersonCreateHandler {
	static async handle(
		text: string,
		identification: any = null,
		userId: string
	): Promise<ChatMessage> {
		try {
			// Extract person data from the text first
			const personData = await extractPersonData(text);

			if (!personData.name) {
				return {
					role: 'system',
					success: false,
					action: 'error',
					message:
						"I could not determine the person's name. Please include a name when creating a new friend.",
					people: []
				};
			}

			// Check for existing people with the same name
			const allFriends = await PersonService.getAllFriends(userId);
			const existingWithSameName = allFriends.filter(
				(friend) => friend.name.toLowerCase() === personData.name.toLowerCase()
			);

			// Also check matched IDs from identification if available
			let existingFromMatching: Friend[] = [];
			if (identification && identification.matchedIds.length > 0) {
				existingFromMatching = allFriends.filter((friend) =>
					identification.matchedIds.includes(friend.id)
				);
			}

			// Combine and deduplicate existing people
			const allExisting = [...existingWithSameName, ...existingFromMatching];
			const uniqueExisting = allExisting.filter(
				(friend, index, array) => array.findIndex((f) => f.id === friend.id) === index
			);

			// If there are existing people with the same name, show clarification options
			if (uniqueExisting.length > 0) {
				return {
					role: 'system',
					success: true,
					action: 'clarify_create',
					message: `It looks like there's already someone by that name`,
					people: uniqueExisting,
					buttons: [
						{
							text: `Update existing ${personData.name}`,
							action: 'update',
							personId: uniqueExisting[0].id
						},
						{
							text: `Create New "${personData.name}"`,
							action: 'create_new',
							personData: personData
						}
					]
				};
			}

			// Convert string intent to enum if present
			const intentMap: Record<string, Intent> = {
				romantic: Intent.ROMANTIC,
				core: Intent.CORE,
				archive: Intent.ARCHIVE,
				new: Intent.NEW,
				invest: Intent.INVEST,
				associate: Intent.ASSOCIATE
			};

			// Create the new friend using PersonService
			const newFriend = await PersonService.createFriend({
				...personData,
				intent: personData.intent ? intentMap[personData.intent] || null : null,
				userId: userId
			});

			if (!newFriend) {
				return {
					role: 'system',
					success: false,
					action: 'error',
					message: 'Failed to create new friend. Please try again.',
					people: []
				};
			}

			// Create initial history entry
			await PersonService.createHistoryEntry(
				newFriend.id,
				ChangeType.PROMPT,
				'person',
				text,
				userId
			);

			return {
				role: 'system',
				success: true,
				action: 'create',
				message: `Successfully created ${newFriend.name} as a new friend!`,
				people: [newFriend]
			};
		} catch (error) {
			console.error('Create handler error:', error);
			return {
				role: 'system',
				success: false,
				action: 'error',
				message: 'Failed to create new friend. Please try again.',
				people: []
			};
		}
	}
}
