import type { ChatMessage, Friend } from '$lib/types';
import { PersonService } from '$lib/services/personService.server';
import { extractUpdateData } from '$lib/langchain/utils';
import { Intent } from '$lib/db/models/Person';
import { ChangeType } from '$lib/db/models';
import type { UpdatePersonInput } from '$lib/services/personService.server';

export class PersonUpdateHandler {
  static async handle(text: string, identification: any = null, userId: string): Promise<ChatMessage> {
    try {
      if (!identification) {
        return {
          role: 'system',
          success: false,
          action: 'error',
          message: 'Unable to identify which friend to update.',
          people: []
        };
      }

      const { matchedIds, confidence, needsClarification } = identification;

      // Handle clarification case
      if (needsClarification && matchedIds.length > 1) {
        const allFriends = await PersonService.getAllFriends(userId);
        const matchedFriends = allFriends.filter(friend => 
          matchedIds.includes(friend.id)
        );
        
        return {
          role: 'system',
          success: true,
          action: 'clarify',
          message: 'I found multiple people with that name. Which one did you want to update?',
          people: matchedFriends
        };
      }

      // Handle single match - proceed with update
      if (matchedIds.length === 1) {
        const personId = matchedIds[0];
        const allFriends = await PersonService.getAllFriends(userId);
        const friendToUpdate = allFriends.find(f => f.id === personId);
        
        if (!friendToUpdate) {
          return {
            role: 'system',
            success: false,
            action: 'error',
            message: 'Friend not found in database.',
            people: []
          };
        }

        // Extract update data
        const updateData = await extractUpdateData(text, allFriends);
        
        // Convert string intent to enum if present
        const intentMap: Record<string, Intent> = {
          'romantic': Intent.ROMANTIC,
          'core': Intent.CORE,
          'archive': Intent.ARCHIVE,
          'new': Intent.NEW,
          'invest': Intent.INVEST,
          'associate': Intent.ASSOCIATE
        };
        
        // Create a new object with the correct types
        const typedUpdateData: UpdatePersonInput = {
          personId: updateData.personId,
          name: updateData.name,
          body: updateData.body,
          intent: updateData.intent ? intentMap[updateData.intent] || null : null,
          birthday: updateData.birthday,
          mnemonic: updateData.mnemonic
        };
        
        // Apply the update using PersonService
        const updatedFriend = await PersonService.updateFriend(personId, typedUpdateData);
        
        if (!updatedFriend) {
          return {
            role: 'system',
            success: false,
            action: 'error',
            message: 'Failed to update friend information.',
            people: []
          };
        }

        // Create history entries for each changed field
        await PersonUpdateHandler.createHistoryEntries(friendToUpdate, updatedFriend, text, userId);

        return {
          role: 'system',
          success: true,
          action: 'update',
          message: `Successfully updated ${updatedFriend.name}'s information.`,
          people: [updatedFriend]
        };
      }

      // Handle no matches
      if (matchedIds.length === 0) {
        return {
          role: 'system',
          success: false,
          action: 'error',
          message: 'Could not find the person you want to update. Please be more specific or create a new friend instead.',
          people: []
        };
      }

      // Fallback
      return {
        role: 'system',
        success: false,
        action: 'error',
        message: 'Unable to determine which friend to update.',
        people: []
      };

    } catch (error) {
      console.error('Update handler error:', error);
      return {
        role: 'system',
        success: false,
        action: 'error',
        message: 'Failed to update friend. Please try again.',
        people: []
      };
    }
  }

  /**
   * Create history entries for each field that was changed
   */
  private static async createHistoryEntries(oldFriend: Friend, updatedFriend: Friend, userPrompt: string, userId: string): Promise<void> {
    try {
      // Check each field for changes and create specific history entries
      if (oldFriend.name !== updatedFriend.name) {
        await PersonService.createHistoryEntry(updatedFriend.id, ChangeType.PROMPT, 'name', userPrompt, userId);
      }

      if (oldFriend.body !== updatedFriend.body) {
        await PersonService.createHistoryEntry(updatedFriend.id, ChangeType.PROMPT, 'description', userPrompt, userId);
      }

      if (oldFriend.intent !== updatedFriend.intent) {
        await PersonService.createHistoryEntry(updatedFriend.id, ChangeType.PROMPT, 'intent', userPrompt, userId);
      }

      if (oldFriend.birthday !== updatedFriend.birthday) {
        await PersonService.createHistoryEntry(updatedFriend.id, ChangeType.PROMPT, 'birthday', userPrompt, userId);
      }

      if (oldFriend.mnemonic !== updatedFriend.mnemonic) {
        await PersonService.createHistoryEntry(updatedFriend.id, ChangeType.PROMPT, 'mnemonic', userPrompt, userId);
      }

    } catch (error) {
      console.error('Error creating history entries:', error);
      // Don't throw error here - we don't want to fail the update if history creation fails
    }
  }
}