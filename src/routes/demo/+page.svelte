<script lang="ts">
  import FriendListModal from '$lib/components/FriendListModal.svelte';
  import CreateFriendModal from '$lib/components/CreateFriendModal.svelte';
  import GroupListModal from '$lib/components/GroupListModal.svelte';
  import { goto } from '$app/navigation';
  import arc from '$lib/images/arc.png';
  import type { ChatMessage } from '$lib/types';
  import { onMount } from 'svelte';
  import { 
    demoActions, 
    demoPeopleNotAssociates, 
    demoGroups, 
    isDemoMode 
  } from '$lib/stores/demoStore';

  export let data;

  // Initialize demo mode on mount
  onMount(() => {
    demoActions.initDemo();
  });

  // Create reactive data that updates from the store
  $: demoData = {
    people: $demoPeopleNotAssociates.map(person => ({
      ...person,
      group_id: null,
      group_name: null
    })),
    groups: $demoGroups,
    session: { user: { name: 'Dwight Schrute Demo' } },
    isDemo: true
  };

  let inputMessage = '';
  let isProcessing = false;
  
  // Updated chat history type to use ChatMessage interface
  let chatHistory: ChatMessage[] = [];
  
  let isModalOpen = false;
  let isGroupsModalOpen = false;
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
      // In demo mode, we'll simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Add a demo response
      chatHistory = [...chatHistory, {
        role: 'system',
        success: true,
        action: 'demo_response',
        message: 'Demo mode: AI processing is disabled. Try browsing friends or groups to explore the interface!',
        people: []
      }];
      
    } catch (e) {
      chatHistory = [...chatHistory, { 
        role: 'system', 
        success: false,
        action: 'error',
        message: 'Demo mode: AI features are not available',
        people: []
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
    goto(`/demo/person/${friendId}`);
  }

  const headers = [ 'You\'re a friend machine, Dwight', 
                    'Welcome back, Dwight', 
                    'All aboard the friendship, Dwight', 
                  ]

  function getHeader() {
    return headers[Math.floor(Math.random() * headers.length)];
  }
</script>

<!-- Demo Banner -->
<div class="bg-yellow-600 text-black px-4 py-2 text-center font-semibold">
  🎭 DEMO MODE - Exploring with Dwight Schrute's data
  <a href="/auth/signin" class="ml-4 bg-black text-yellow-600 px-3 py-1 rounded text-sm hover:bg-gray-800">
    Exit Demo
  </a>
</div>

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
          placeholder="Search, create, or update a friend (Demo mode - AI disabled)"
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
          on:click={() => isGroupsModalOpen = true}
          class="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          Browse Groups
        </button>
        <button
          on:click={() => isCreateModalOpen = true}
          class="px-4 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition-colors"
        >
          Add Friend (Demo)
        </button>
      </div>
      <div class="flex justify-center mt-4">
        <a
          href="/auth/signin"
          class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
        >
          <i class="fas fa-times mr-2"></i>Exit Demo
        </a>
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
    
    <!-- Chat History -->
    <div class="flex-1 p-4 pt-16 overflow-y-auto">
      <div class="max-w-2xl mx-auto space-y-4">
        {#each chatHistory as msg}
          <div class="flex {msg.role === 'user' ? 'justify-end' : 'justify-start'}">
            <div class="max-w-xs lg:max-w-md px-4 py-2 rounded-lg {
              msg.role === 'user' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-800'
            }">
              {msg.message}
            </div>
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
            placeholder="Search, create, or update a friend (Demo mode - AI disabled)"
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

<!-- Pass demo data to modals -->
<FriendListModal bind:isOpen={isModalOpen} data={demoData} />
<CreateFriendModal bind:isOpen={isCreateModalOpen} data={demoData} />
<GroupListModal bind:isOpen={isGroupsModalOpen} data={demoData} />