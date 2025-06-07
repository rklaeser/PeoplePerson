import type { ChatMessage, Friend } from '$lib/types';
import { PersonService } from '$lib/services/personService.server';

export class PersonSearchHandler {
  static async handle(text: string, identification?: any): Promise<ChatMessage> {
    try {
      // If identification is provided, use those results
      if (identification) {
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
            message: 'I found multiple people matching your search. Here they are:',
            people: matchedFriends
          };
        }
        
        // Handle no matches
        if (confidence === 'no_matches' || matchedIds.length === 0) {
          return {
            role: 'system',
            success: true,
            action: 'search',
            message: 'No matching friends found for your search.',
            people: []
          };
        }

        // Get the actual friend objects
        const allFriends = await PersonService.getAllFriends();
        const matchedFriends = allFriends.filter(friend => 
          matchedIds.includes(friend.id)
        );

        const message = matchedFriends.length === 1 
          ? `Found ${matchedFriends[0].name}:`
          : `Found ${matchedFriends.length} matching friends:`;

        return {
          role: 'system',
          success: true,
          action: 'search',
          message: message,
          people: matchedFriends
        };
      }

      // Fallback: search all friends if no identification provided
      const allFriends = await PersonService.getAllFriends();
      return {
        role: 'system',
        success: true,
        action: 'search',
        message: `Here are all your friends:`,
        people: allFriends
      };
      
    } catch (error) {
      console.error('Search handler error:', error);
      return {
        role: 'system',
        success: false,
        action: 'error',
        message: 'Failed to search for friends. Please try again.',
        people: []
      };
    }
  }
}