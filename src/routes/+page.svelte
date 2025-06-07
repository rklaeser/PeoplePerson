<script lang="ts">
  import FriendListModal from '$lib/components/FriendListModal.svelte';
  import CreateFriendModal from '$lib/components/CreateFriendModal.svelte';
  import { goto } from '$app/navigation';
  import arc from '$lib/images/arc.png';
  import { onMount } from 'svelte';
  import {reload } from '$lib/stores/friends';
  import type { ChatMessage } from '$lib/types';

  export let data;

  let inputMessage = '';
  let isProcessing = false;
  
  // Updated chat history type to use ChatMessage interface
  let chatHistory: ChatMessage[] = [];
  
  let isModalOpen = false;
  let showChat = false;
  let isCreateModalOpen = false;

  async function handleSubmit() {
    if (!inputMessage.trim()) return;
    
    const currentMessage = inputMessage;
    
    // Add user message
    chatHistory = [...chatHistory, { 
      role: 'user',
      success: true,
      action: 'message',
      message: currentMessage,
      people: []
    }];
    
    inputMessage = ''; // Clear input immediately
    isProcessing = true;
    
    try {
      // Use EventSource for SSE
      const eventSource = new EventSource('/api/ai/route', {
        // Note: EventSource doesn't support POST directly, so we'll use a different approach
      });
      
      // Alternative: Use fetch with streaming
      const response = await fetch('/api/ai/route', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({ text: currentMessage })
      });

      if (!response.ok) {
        throw new Error('Failed to process request');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) {
        throw new Error('No response stream available');
      }

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const eventData = JSON.parse(line.slice(6));
              
              if (eventData.type === 'annotation') {
                // Immediately add the routing annotation
                chatHistory = [...chatHistory, eventData.data];
              } else if (eventData.type === 'result') {
                // Add the final result
                chatHistory = [...chatHistory, eventData.data];
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
      
    } catch (e) {
      chatHistory = [...chatHistory, { 
        role: 'system', 
        success: false,
        action: 'error',
        message: e instanceof Error ? e.message : 'Error processing request',
        people: []
      }];
    } finally {
      isProcessing = false;
    }
  }

  async function handleButtonClick(button: any) {
    if (button.action === 'update') {
      // Navigate to update the existing person
      goto(`/person/${button.personId}`);
    } else if (button.action === 'create_new') {
      // Create the new person with the stored data
      isProcessing = true;
      
      try {
        const response = await fetch('/api/person', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            text: `create new friend ${button.personData.name}`,
            forceCreate: true,
            personData: button.personData
          })
        });

        if (!response.ok) {
          throw new Error('Failed to create new friend');
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        
        if (!reader) {
          throw new Error('No response stream available');
        }

        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const eventData = JSON.parse(line.slice(6));
                
                if (eventData.type === 'result') {
                  chatHistory = [...chatHistory, eventData.data];
                }
              } catch (e) {
                console.error('Error parsing SSE data:', e);
              }
            }
          }
        }
        
      } catch (e) {
        chatHistory = [...chatHistory, { 
          role: 'system', 
          success: false,
          action: 'error',
          message: e instanceof Error ? e.message : 'Error creating new friend',
          people: []
        }];
      } finally {
        isProcessing = false;
      }
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  }

  function handleBack() {
    chatHistory = [];
    inputMessage = '';
    showChat = false;
  }

  function handleFriendClick(friendId: string) {
    goto(`/person/${friendId}`);
  }

  const headers = [ 'You\'re a friend machine, Dwight', 
                    'Welcome back, Dwight', 
                    'All aboard the friendship, Dwight', 
                  ]

  function getHeader() {
    return headers[Math.floor(Math.random() * headers.length)];
  }

  onMount(() => {
    reload();
  });

</script>

{#if chatHistory.length === 0}
  <!-- Initial centered view -->
  <div class="flex flex-col justify-start pt-20 items-center h-full">
    <div class="max-w-2xl w-full px-4">
      <img src={arc} alt="The Friend Ship" class="w-1/3 mx-auto" />
      <h1 class="text-3xl font-bold text-center mb-8">{getHeader()}</h1>
      <div class="flex gap-2">
        <textarea
          bind:value={inputMessage}
          on:keydown={handleKeydown}
          placeholder="Search, create, or update a friend"
          class="bg-gray-800 text-gray-100 flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows="3"
        ></textarea>
        <button
          on:click={handleSubmit}
          disabled={isProcessing || !inputMessage.trim()}
          class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isProcessing ? '...' : 'Send'}
        </button>
      </div>
      <div class="flex justify-center mt-6 gap-4">
        <button
          on:click={() => isModalOpen = true}
          class="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          Browse Friends
        </button>
        <button
          on:click={() => isCreateModalOpen = true}
          class="px-4 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition-colors"
        >
          Add Friend
        </button>
      </div>
    </div>
  </div>
{:else}
  <!-- Chat view with messages -->
  <div class="h-full flex flex-col relative">
    <!-- Back Button -->
    <button
      class="absolute top-4 left-4 z-10 bg-gray-800 text-white rounded-full p-2 hover:bg-gray-700"
      on:click={handleBack}
      aria-label="Back to home"
    >
      <i class="fas fa-arrow-left"></i>
    </button>
    
    <!-- Chat History - now handles text, friend cards, buttons, and annotations -->
    <div class="flex-1 p-4 pt-16 overflow-y-auto">
      <div class="max-w-2xl mx-auto space-y-4">
        {#each chatHistory as msg}
          <div class="flex {msg.role === 'user' ? 'justify-end' : 'justify-start'}">
            
            {#if msg.role === 'annotation'}
              <!-- Annotation styling - small gray text on the left -->
              <div class="max-w-xs lg:max-w-md px-3 py-1 text-xs text-gray-500 italic">
                {msg.message}
              </div>
            
            {:else if msg.action === 'clarify_create' && msg.buttons}
              <!-- Special handling for clarify_create with buttons -->
              <div class="flex flex-col max-w-md">
                <div class="px-4 py-2 rounded-lg bg-yellow-50 border border-yellow-200 text-gray-800 mb-3">
                  {msg.message}
                </div>
                
                <!-- Show existing people if any -->
                {#if msg.people && msg.people.length > 0}
                  {#each msg.people as person}
                    <div class="bg-white border border-gray-200 rounded-lg shadow-md p-4 mb-2">
                      <div class="flex items-start justify-between mb-2">
                        <h3 class="font-semibold text-lg text-gray-800">{person.name}</h3>
                        <span class="inline-block px-2 py-1 text-xs font-medium rounded-full {
                          person.intent === 'core' ? 'bg-blue-100 text-blue-800' :
                          person.intent === 'casual' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }">
                          {person.intent || 'new'}
                        </span>
                      </div>
                      {#if person.body}
                        <p class="text-gray-600 text-sm leading-relaxed">
                          {person.body}
                        </p>
                      {/if}
                      <p class="text-xs text-gray-500 mt-2">
                        {person.mnemonic || 'not the composer'}
                      </p>
                    </div>
                  {/each}
                {/if}
                
                <!-- Action buttons -->
                <div class="flex gap-2 mt-2">
                  {#each msg.buttons as button}
                    <button
                      on:click={() => handleButtonClick(button)}
                      disabled={isProcessing}
                      class="px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed {
                        button.action === 'update' 
                          ? 'bg-blue-500 text-white hover:bg-blue-600' 
                          : 'bg-green-500 text-white hover:bg-green-600'
                      }"
                    >
                      {button.text}
                    </button>
                  {/each}
                </div>
              </div>
              
            {:else if msg.action === 'clarify_create' && msg.buttons}
              <!-- Special handling for clarify_create with buttons -->
              <div class="flex flex-col max-w-md">
                <div class="px-4 py-2 rounded-lg bg-yellow-50 border border-yellow-200 text-gray-800 mb-3">
                  {msg.message}
                </div>
                
                <!-- Show existing people if any -->
                {#if msg.people && msg.people.length > 0}
                  {#each msg.people as person}
                    <div class="bg-white border border-gray-200 rounded-lg shadow-md p-4 mb-2">
                      <div class="flex items-start justify-between mb-2">
                        <h3 class="font-semibold text-lg text-gray-800">{person.name}</h3>
                        <span class="inline-block px-2 py-1 text-xs font-medium rounded-full {
                          person.intent === 'core' ? 'bg-blue-100 text-blue-800' :
                          person.intent === 'casual' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }">
                          {person.intent || 'new'}
                        </span>
                      </div>
                      {#if person.body}
                        <p class="text-gray-600 text-sm leading-relaxed">
                          {person.body}
                        </p>
                      {/if}
                      <p class="text-xs text-gray-500 mt-2">
                        {person.mnemonic || 'not the composer'}
                      </p>
                    </div>
                  {/each}
                {/if}
                
                <!-- Action buttons -->
                <div class="flex gap-2 mt-2">
                  {#each msg.buttons as button}
                    <button
                      on:click={() => handleButtonClick(button)}
                      disabled={isProcessing}
                      class="px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed {
                        button.action === 'update' 
                          ? 'bg-blue-500 text-white hover:bg-blue-600' 
                          : 'bg-green-500 text-white hover:bg-green-600'
                      }"
                    >
                      {button.text}
                    </button>
                  {/each}
                </div>
              </div>
              
            {:else if msg.people && msg.people.length > 0}
              <div class="flex flex-col">
                <div class="max-w-xs lg:max-w-md px-4 py-2 rounded-lg {
                  msg.role === 'user' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-800'
                }">
                  {msg.message}
                </div>
                {#each msg.people as person}
                  <button
                    class="bg-white border border-gray-200 rounded-lg shadow-md p-4 max-w-sm hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer text-left {
                      msg.action === 'clarify' ? 'mt-2 border-orange-200 hover:border-orange-400' : ''
                    }"
                    on:click={() => {
                      if (msg.action === 'clarify') {
                        // Handle clarification click - send a more specific message
                        inputMessage = `Update ${person.name} (${person.mnemonic || person.id})`;
                      } else {
                        handleFriendClick(person.id);
                      }
                    }}
                  >
                    <div class="flex items-start justify-between mb-2">
                      <h3 class="font-semibold text-lg text-gray-800">{person.name}</h3>
                      <div class="flex flex-col items-end gap-1">
                        <span class="inline-block px-2 py-1 text-xs font-medium rounded-full {
                          person.intent === 'core' ? 'bg-blue-100 text-blue-800' :
                          person.intent === 'casual' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }">
                          {person.intent}
                        </span>
                        {#if msg.action === 'clarify' && person.mnemonic}
                          <span class="text-xs text-gray-500 italic">
                            {person.mnemonic}
                          </span>
                        {/if}
                      </div>
                    </div>
                    {#if person.body}
                      <p class="text-gray-600 text-sm leading-relaxed">
                        {person.body}
                      </p>
                    {/if}
                    {#if msg.action === 'clarify'}
                      <p class="text-xs text-orange-600 mt-2 font-medium">
                        Click to select this person
                      </p>
                    {/if}
                  </button>
                {/each}
              </div>

            {:else}
              <!-- Regular text message -->
              <div class="max-w-xs lg:max-w-md px-4 py-2 rounded-lg {
                msg.role === 'user' 
                  ? 'bg-blue-500 text-white' 
                  : msg.role === 'system'
                    ? 'bg-gray-200 text-gray-800'
                    : 'bg-gray-200 text-gray-800'
              }">
                {msg.message}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </div>

    <!-- Fixed bottom input -->
    <div class="flex-shrink-0 p-4 border-t">
      <div class="max-w-4xl mx-auto flex flex-col gap-2">
        <div class="flex gap-2">
          <textarea
            bind:value={inputMessage}
            on:keydown={handleKeydown}
            placeholder="Search, create, or update a friend"
            class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows="3"
          ></textarea>
          <button
            on:click={handleSubmit}
            disabled={isProcessing || !inputMessage.trim()}
            class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isProcessing ? '...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- USE TWO-WAY BINDING HERE -->
<FriendListModal bind:isOpen={isModalOpen} />
<CreateFriendModal bind:isOpen={isCreateModalOpen} />