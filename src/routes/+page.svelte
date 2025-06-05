<script lang="ts">
  import FriendListModal from '$lib/components/FriendListModal.svelte';
  import CreateFriendModal from '$lib/components/CreateFriendModal.svelte';

  export let data;

  let inputMessage = '';
  let isProcessing = false;
  let chatHistory: { role: 'user' | 'system', text: string }[] = [];
  let isModalOpen = false;
  let showChat = false;
  let isCreateModalOpen = false;

  async function handleSubmit() {
    if (!inputMessage.trim()) return;
    
    // Add user message
    chatHistory = [...chatHistory, { role: 'user', text: inputMessage }];
    
    try {
      isProcessing = true;
      const response = await fetch('/api/process', {
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

      // Add system response
      chatHistory = [...chatHistory, { role: 'system', text: result.message }];
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

const headers = [ 'You\'re a friend machine, Dwight', 
                  'Another day, another friendship', 
                  'All aboard the friend ship', 
                ]

function getHeader() {
  return headers[Math.floor(Math.random() * headers.length)];
}

</script>

{#if chatHistory.length === 0}
  <!-- Initial centered view -->
  <div class="flex flex-col justify-center items-center h-full">
    <div class="max-w-2xl w-full px-4">
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
    
    <!-- Chat History - now only scrolls when needed -->
    <div class="flex-1 p-4 pt-16 overflow-y-auto">
      <div class="max-w-2xl mx-auto space-y-4">
        {#each chatHistory as msg}
          <div class="flex {msg.role === 'user' ? 'justify-end' : 'justify-start'}">
            <div class="max-w-xs lg:max-w-md px-4 py-2 rounded-lg {
              msg.role === 'user' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-800'
            }">
              {msg.text}
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
<FriendListModal data={data} bind:isOpen={isModalOpen} />
<CreateFriendModal bind:isOpen={isCreateModalOpen} />
