<script lang="ts">
  import FriendListModal from '$lib/components/FriendListModal.svelte';
  import CreateFriendModal from '$lib/components/CreateFriendModal.svelte';
  import { goto } from '$app/navigation';
  import arc from '$lib/images/arc.png';
  import { onMount } from 'svelte';
  import {reload } from '$lib/stores/friends';

  export let data;

  let inputMessage = '';
  let isProcessing = false;
  
  // Updated chat history type to handle both text and friend data
  let chatHistory: { 
    role: 'user' | 'system', 
    text?: string,
    friendData?: {
      id: string,
      body: string,
      intent: string,
      name: string,
      createdAt?: string,
      updatedAt?: string,
      mnemonic?: string | null
    }
  }[] = [];
  
  let isModalOpen = false;
  let showChat = false;
  let isCreateModalOpen = false;

  async function handleSubmit() {
    if (!inputMessage.trim()) return;
    
    // Add user message
    chatHistory = [...chatHistory, { role: 'user', text: inputMessage }];
    
    try {
      isProcessing = true;
      const response = await fetch('/api/ai/route', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: inputMessage })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to process request');
      }

      if (result.action === 'search') {
        const personData = await fetch(`/api/person/${result.message}`);
        const person = await personData.json();
        console.log(person);
        
        // Add friend card to chat history
        chatHistory = [...chatHistory, { 
          role: 'system', 
          friendData: {
            id: person.friend.id,
            name: person.friend.name, // or person.name if available
            body: person.friend.body,
            intent: person.friend.intent,
            mnemonic: person.mnemonic
          }
        }];
        console.log(chatHistory);

      } else {
        // Add regular text response
        chatHistory = [...chatHistory, { role: 'system', text: result.message }];
      }
      
      inputMessage = ''; // Clear input
      
    } catch (e) {
      chatHistory = [...chatHistory, { 
        role: 'system', 
        text: e instanceof Error ? e.message : 'Error processing request' 
      }];
    } finally {
      isProcessing = false;
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
                    'Another day, another friendship', 
                    'All aboard the friend ship', 
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
    
    <!-- Chat History - now handles both text and friend cards -->
    <div class="flex-1 p-4 pt-16 overflow-y-auto">
      <div class="max-w-2xl mx-auto space-y-4">
        {#each chatHistory as msg}
          <div class="flex {msg.role === 'user' ? 'justify-end' : 'justify-start'}">
            {#if msg.friendData}
              <!-- Friend Card - Now clickable -->
              <button
                class="bg-white border border-gray-200 rounded-lg shadow-md p-4 max-w-sm hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer text-left"
                on:click={() => handleFriendClick(msg.friendData!.id)}
              >
                <div class="flex items-start justify-between mb-2">
                  <h3 class="font-semibold text-lg text-gray-800">{msg.friendData.name}</h3>
                  <span class="inline-block px-2 py-1 text-xs font-medium rounded-full {
                    msg.friendData.intent === 'core' ? 'bg-blue-100 text-blue-800' :
                    msg.friendData.intent === 'casual' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }">
                    {msg.friendData.intent}
                  </span>
                </div>
                {#if msg.friendData.body}
                  <p class="text-gray-600 text-sm leading-relaxed">
                    {msg.friendData.body}
                  </p>
                {/if}
              </button>
            {:else}
              <!-- Regular text message -->
              <div class="max-w-xs lg:max-w-md px-4 py-2 rounded-lg {
                msg.role === 'user' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-800'
              }">
                {msg.text}
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