<script lang="ts">
  import type { Friend, Group } from '$lib/types';
  import '@fortawesome/fontawesome-free/css/all.css';
  import Table from '$lib/components/Table.svelte';

  export let data: { people: Friend[], groups: Group[] };

  let searchPrompt = '';
  let searchResults = '';
  let isSearching = false;
  let error = '';

  // Create person state
  let createPrompt = '';
  let isCreating = false;
  let createError = '';
  let createMessage = '';
  let errorDetails = '';

  async function handleSearch() {
    if (!searchPrompt.trim()) return;
    
    try {
      isSearching = true;
      error = '';
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ description: searchPrompt })
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      searchResults = data.results;
    } catch (e) {
      console.error('Search error:', e);
      error = 'Failed to perform search. Please try again.';
    } finally {
      isSearching = false;
    }
  }

  async function handleCreate() {
    if (!createPrompt.trim()) return;
    
    try {
      isCreating = true;
      createError = '';
      createMessage = '';
      errorDetails = '';
      const response = await fetch('/api/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ description: createPrompt })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || result.message || 'Failed to create person');
      }

      createMessage = result.message;
      createPrompt = ''; // Clear the input
      // Optionally refresh the page or update the table
      window.location.reload();
    } catch (e) {
      console.error('Create error:', e);
      createError = e instanceof Error ? e.message : 'Failed to create person. Please try again.';
      if (e instanceof Error && e.stack) {
        errorDetails = e.stack;
      }
    } finally {
      isCreating = false;
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      handleSearch();
    }
  }
</script>

<svelte:head>
  <title>Friend Ship</title>
  <meta name="description" content="Friend Ship app" />
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <div class="max-w-2xl mx-auto mb-8">
    <h2 class="text-2xl font-bold mb-4">Create New Person</h2>
    <div class="flex gap-2">
      <textarea
        bind:value={createPrompt}
        placeholder="Describe the person you want to create (name, location, description, etc.)..."
        class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
      />
      <button
        on:click={handleCreate}
        disabled={isCreating}
        class="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:bg-green-300"
      >
        {#if isCreating}
          <i class="fas fa-spinner fa-spin"></i>
        {:else}
          Create
        {/if}
      </button>
    </div>

    {#if createError}
      <div class="mt-4 text-red-500">
        <p class="font-semibold">{createError}</p>
        {#if errorDetails}
          <pre class="mt-2 text-sm bg-gray-100 p-2 rounded overflow-x-auto">{errorDetails}</pre>
        {/if}
      </div>
    {/if}

    {#if createMessage}
      <div class="mt-4 text-green-500">{createMessage}</div>
    {/if}
  </div>

  <div class="max-w-2xl mx-auto mb-8">
    <h2 class="text-2xl font-bold mb-4">Find People</h2>
    <div class="flex gap-2">
      <input
        type="text"
        bind:value={searchPrompt}
        on:keydown={handleKeydown}
        placeholder="Describe the person you're looking for..."
        class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        on:click={handleSearch}
        disabled={isSearching}
        class="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-blue-300"
      >
        {#if isSearching}
          <i class="fas fa-spinner fa-spin"></i>
        {:else}
          Search
        {/if}
      </button>
    </div>

    {#if error}
      <div class="mt-4 text-red-500">{error}</div>
    {/if}

    {#if searchResults}
      <div class="mt-4 p-4 bg-gray-50 rounded-lg">
        <h3 class="font-semibold mb-2">Results:</h3>
        <p>{searchResults}</p>
      </div>
    {/if}
  </div>

  <section>
    <Table people={data.people} groups={data.groups} selectedCounty=""/>
  </section>
</div>

<style>
  section {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    flex: 0.6;
  }
</style>
