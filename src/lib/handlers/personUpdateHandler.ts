import type { ChatMessage, Friend } from '$lib/types';
import { PersonService } from '$lib/services/personService.server';
import { extractUpdateData } from '$lib/langchain/utils';
import { Intent } from '$lib/db/models/Person';
import type { UpdatePersonInput } from '$lib/services/personService.server';

export class PersonUpdateHandler {
  static async handle(text: string, identification?: any): Promise<ChatMessage> {
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
        const allFriends = await PersonService.getAllFriends();
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
        const allFriends = await PersonService.getAllFriends();
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
}