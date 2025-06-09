<script lang="ts">
  import { goto } from '$app/navigation';
  
  export let data;

  let isAdding = false;
  let newAssociateName: string = '';

  export function startAdding() {
    isAdding = true;
    newAssociateName = '';
  }

  function cancelAdding() {
    isAdding = false;
    newAssociateName = '';
  }

  async function addAssociate() {
    if (!newAssociateName.trim()) return;

    try {
      const formData = new FormData();
      formData.append('id', data.friend.id);
      formData.append('associate', newAssociateName);

      const response = await fetch(`/person/${data.friend.id}?/createAssociation`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        // Reload the page to get updated data
        location.reload();
      } else {
        console.error('Failed to add associate');
      }
    } catch (error) {
      console.error('Error adding associate:', error);
    }
  }

  async function removeAssociate(associateId: string) {
    try {
      const formData = new FormData();
      formData.append('id', data.friend.id);
      formData.append('associate', associateId);

      const response = await fetch(`/person/${data.friend.id}?/deleteAssociation`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        // Reload the page to get updated data
        location.reload();
      } else {
        console.error('Failed to remove associate');
      }
    } catch (error) {
      console.error('Error removing associate:', error);
    }
  }

  function navigateToFriend(id: string) {
    goto(`/person/${id}`);
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      cancelAdding();
    } else if (event.key === 'Enter') {
      addAssociate();
    }
  }
</script>

{#if isAdding}
  <div class="flex items-center gap-2 mb-2">
    <input 
      type="text" 
      bind:value={newAssociateName} 
      on:keydown={handleKeydown}
      class="border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" 
      placeholder="Enter associate name"
      autofocus
    />
    <button 
      on:click={addAssociate} 
      class="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded text-sm transition-colors"
    >
      ✓
    </button>
    <button 
      on:click={cancelAdding} 
      class="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded text-sm transition-colors"
    >
      ✕
    </button>
  </div>
{/if}

{#if data.associates.length > 0}
  <div class="flex gap-2 flex-wrap">
    {#each data.associates as associate}
      <div class="group relative">
        <button 
          on:click={() => navigateToFriend(associate.id)} 
          class="bg-gray-300 hover:bg-gray-400 text-black flex items-center rounded cursor-pointer transition-colors pr-8"
        >
          <div class="px-4 py-2">
            <i class="fa-solid fa-user"></i> {associate.name}
          </div>
        </button>
        <button 
          on:click={() => removeAssociate(associate.id)}
          class="absolute right-1 top-1/2 transform -translate-y-1/2 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
          title="Remove association"
        >
          ✕
        </button>
      </div>
    {/each}
  </div>
{:else}
  <p class="text-gray-500 italic">No associates</p>
{/if}


