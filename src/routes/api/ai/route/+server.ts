// src/routes/api/person/+server.ts
import { json } from '@sveltejs/kit';
import { detectIntent, identifyPerson } from '$lib/langchain/utils';
import { PersonService } from '$lib/services/personService.server';
import { PersonSearchHandler } from '$lib/handlers/personSearchHandler';
import { PersonUpdateHandler } from '$lib/handlers/personUpdateHandler';
import { PersonCreateHandler } from '$lib/handlers/personCreateHandler';
import type { ChatMessage } from '$lib/types';

export async function POST({ request }) {
  const { text } = await request.json();
  
  // Create a readable stream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      try {

        const thinkingData = JSON.stringify({
          type: 'annotation',
          data: {
            role: 'annotation',
            success: true,
            action: 'route',
            message: `Thinking...`,
            people: []
          }
        });
        controller.enqueue(`data: ${thinkingData}\n\n`);

        // Step 1: Detect intent and immediately stream the routing decision
        const { action, confidence } = await detectIntent(text);

        const intentData = JSON.stringify({
          type: 'annotation',
          data: {
            role: 'annotation',
            success: true,
            action: 'route',
            message: `Intent: ${action} (${confidence.toFixed(2)})`,
            people: []
          }
        });
        controller.enqueue(`data: ${intentData}\n\n`);
        
        // Early confidence check - don't attempt processing if confidence is too low
        if (confidence < 0.5) {
          // Send annotation about low confidence
          const annotationData = JSON.stringify({
            type: 'annotation',
            data: {
              role: 'annotation',
              success: true,
              action: 'route',
              message: `Low confidence (${confidence.toFixed(2)}) - skipping processing`,
              people: []
            }
          });
          controller.enqueue(`data: ${annotationData}\n\n`);
          
          // Send immediate response without attempting handlers
          const resultData = JSON.stringify({
            type: 'result',
            data: {
              role: 'system',
              success: false,
              action: 'error',
              message: 'I\'m not sure I can help with that.',
              people: []
            }
          });
          controller.enqueue(`data: ${resultData}\n\n`);
          controller.close();
          return;
        }

        // Step 2: Get all friends for person identification
        const allFriends = await PersonService.getAllFriends();

        // Step 3: Identify people based on the detected intent
        const identification = await identifyPerson(text, action, allFriends);
        
        // Send identification annotation
        const identificationData = JSON.stringify({
          type: 'annotation',
          data: {
            role: 'annotation',
            success: true,
            action: 'identify',
            message: `${identification.reasoning} (${identification.matchedIds.length} matches, ${identification.confidence})`,
            people: []
          }
        });
        controller.enqueue(`data: ${identificationData}\n\n`);

        // Step 4: Route to the appropriate handler based on final action
        const finalAction = identification.action;
        let result: ChatMessage;
        
        // Store the original detected intent for create operations
        const originalIntent = action;
        
        if (finalAction === 'clarify') {
          // Check if the original intent was 'create' - if so, let PersonCreateHandler handle it
          if (originalIntent === 'create') {
            result = await PersonCreateHandler.handle(text, identification);
          } else {
            // Handle clarification case for other intents - show multiple matches and ask user to specify
            const matchedFriends = allFriends.filter(friend => 
              identification.matchedIds.includes(friend.id)
            );
            
            result = {
              role: 'system',
              success: true,
              action: 'clarify',
              message: `I found multiple people with that name. Which one did you mean?`,
              people: matchedFriends
            };
          }
        } else if (finalAction === 'search') {
          result = await PersonSearchHandler.handle(text, identification);
        } else if (finalAction === 'update') {
          result = await PersonUpdateHandler.handle(text, identification);
        } else if (finalAction === 'create') {
          result = await PersonCreateHandler.handle(text, identification);
        } else {
          result = {
            role: 'system',
            success: false,
            action: 'error',
            message: 'Hmm I\'m not sure how to help you with that',
            people: []
          };
        }
        
        // Step 5: Send the final result
        const resultData = JSON.stringify({
          type: 'result',
          data: result
        });
        controller.enqueue(`data: ${resultData}\n\n`);
        
        // Close the stream
        controller.close();
        
      } catch (error) {
        console.error('Processing error:', error);
        const errorData = JSON.stringify({
          type: 'result',
          data: {
            role: 'system',
            success: false,
            action: 'error',
            message: 'I failed to process your request',
            people: []
          }
        });
        controller.enqueue(`data: ${errorData}\n\n`);
        controller.close();
      }
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}