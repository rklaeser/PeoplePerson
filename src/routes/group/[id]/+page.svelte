<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount, onDestroy } from 'svelte';
  import type { Friend } from '$lib/types';

  export let data: { 
    group: {id: string; name: string; description: string},
    people: Friend[],
    availablePeople: {id: string; name: string}[]
  };

  let searchQuery = '';
  let filteredPeople: {id: string; name: string}[] = [];
  let dropdownContainer: HTMLDivElement;

  $: {
    if (searchQuery.trim()) {
      filteredPeople = data.availablePeople.filter(person => 
        person.name.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5); // Limit to 5 results
    } else {
      filteredPeople = [];
    }
  }

  function clearSearch() {
    searchQuery = '';
    filteredPeople = [];
  }

  function handleClickOutside(event: MouseEvent) {
    if (dropdownContainer && !dropdownContainer.contains(event.target as Node)) {
      clearSearch();
    }
  }

  async function removeMemberFromGroup(personId: string) {
    try {
      const formData = new FormData();
      formData.append('personId', personId);
      formData.append('groupId', data.group.id);

      const response = await fetch(`/group/${data.group.id}?/removeMember`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        // Reload the page to get updated data
        location.reload();
      } else {
        console.error('Failed to remove member from group');
      }
    } catch (error) {
      console.error('Error removing member from group:', error);
    }
  }

  async function addMemberToGroup(personId: string) {
    try {
      const formData = new FormData();
      formData.append('personId', personId);
      formData.append('groupId', data.group.id);

      const response = await fetch(`/group/${data.group.id}?/addMember`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        // Clear search and reload page
        clearSearch();
        location.reload();
      } else {
        console.error('Failed to add member to group');
      }
    } catch (error) {
      console.error('Error adding member to group:', error);
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      clearSearch();
    }
  }

  function navigateToFriend(id: string) {
    goto(`/person/${id}`);
  }

  function goBack() {
    goto('/');
  }

  onMount(() => {
    document.addEventListener('click', handleClickOutside);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  });
</script>

<section class="p-6">
  <button
    class="absolute top-4 left-4 z-10 bg-gray-800 text-white rounded-full p-2 hover:bg-gray-700"
    on:click={goBack}
    aria-label="Back to home"
  >
    <i class="fas fa-arrow-left"></i>
  </button>

  <div class="max-w-4xl mx-auto">
    <div class="pt-12 mb-6">
      <div class="flex items-center gap-3 mb-3">
        <i class="fa-solid fa-users text-2xl"></i>
        <h1 class="text-3xl font-bold   ">{data.group.name}</h1>
        <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
          {data.people.length} member{data.people.length !== 1 ? 's' : ''}
        </span>
      </div>
      
      {#if data.group.description}
        <p class="text-white text-lg mb-4">{data.group.description}</p>
      {/if}

      <div class="flex items-center gap-2">
          <div class="flex items-center gap-2 rounded-lg p-2 shadow-sm">
            <div class="relative" bind:this={dropdownContainer}>
              <input
                type="text"
                bind:value={searchQuery}
                on:keydown={handleKeydown}
                placeholder="Add someone..."
                class="px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              />
              
              {#if filteredPeople.length > 0}
                <div class="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-40 overflow-y-auto">
                  {#each filteredPeople as person}
                    <div class="flex items-center justify-between px-3 py-2 hover:bg-gray-50 transition-colors">
                      <span class="text-gray-800">{person.name}</span>
                      <button
                        on:click={() => addMemberToGroup(person.id)}
                        class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
      </div>
    </div>

    {#if data.people.length > 0}
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {#each data.people as person}
          <div class="group relative bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <button 
              on:click={() => navigateToFriend(person.id)}
              class="w-full p-4 text-left hover:bg-gray-50 rounded-lg transition-colors"
            >
              <div class="flex items-start justify-between mb-2">
                <h3 class="font-semibold text-lg text-gray-800">{person.name}</h3>
                <span class="inline-block px-2 py-1 text-xs font-medium rounded-full {
                  person.intent === 'core' ? 'bg-blue-100 text-blue-800' :
                  person.intent === 'romantic' ? 'bg-pink-100 text-pink-800' :
                  person.intent === 'invest' ? 'bg-green-100 text-green-800' :
                  person.intent === 'archive' ? 'bg-gray-100 text-gray-800' :
                  person.intent === 'associate' ? 'bg-purple-100 text-purple-800' :
                  'bg-yellow-100 text-yellow-800'
                }">
                  {person.intent || 'new'}
                </span>
              </div>
              
              {#if person.body}
                <p class="text-gray-600 text-sm leading-relaxed mb-2 line-clamp-3">
                  {person.body}
                </p>
              {/if}
              
              <div class="flex items-center gap-4 text-xs text-gray-500">
                {#if person.birthday}
                  <span class="flex items-center gap-1">
                    <i class="fa-solid fa-cake-candles"></i>
                    {person.birthday}
                  </span>
                {/if}
                {#if person.mnemonic}
                  <span class="flex items-center gap-1">
                    <i class="fa-regular fa-lightbulb"></i>
                    {person.mnemonic}
                  </span>
                {/if}
              </div>
            </button>
            
            <!-- Remove member button (appears on hover) -->
            <button 
              on:click={() => removeMemberFromGroup(person.id)}
              class="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              title="Remove {person.name} from group"
            >
              ✕
            </button>
          </div>
        {/each}
      </div>
    {:else}
      <div class="text-center py-12">
        <i class="fa-solid fa-users text-4xl text-gray-400 mb-4"></i>
        <h2 class="text-xl font-semibold text-gray-600 mb-2">No members yet</h2>
        <p class="text-gray-500">This group doesn't have any members.</p>
      </div>
    {/if}
  </div>
</section>

<style>
  .line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
