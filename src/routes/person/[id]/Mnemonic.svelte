<script lang="ts">
  export let data;
  
  let isEditing = false;
  let isLoading = false;
  let tempMnemonic = data.friend.mnemonic || '';

  function startEditing() {
    isEditing = true;
    tempMnemonic = data.friend.mnemonic || '';
  }

  function cancelEdit() {
    isEditing = false;
    tempMnemonic = data.friend.mnemonic || '';
  }

  async function saveMnemonic() {
    if (tempMnemonic === data.friend.mnemonic) {
      isEditing = false;
      return;
    }

    isLoading = true;
    try {
      const formData = new FormData();
      formData.append('id', data.friend.id);
      formData.append('mnemonic', tempMnemonic);

      const response = await fetch(`/person/${data.friend.id}?/updateMnemonic`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        // Optimistic update
        data.friend.mnemonic = tempMnemonic;
        isEditing = false;
      } else {
        console.error('Failed to update mnemonic');
        tempMnemonic = data.friend.mnemonic || '';
      }
    } catch (error) {
      console.error('Error updating mnemonic:', error);
      tempMnemonic = data.friend.mnemonic || '';
    } finally {
      isLoading = false;
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      cancelEdit();
    } else if (event.key === 'Enter') {
      saveMnemonic();
    }
  }
</script>

{#if isEditing}
  <div class="inline-flex items-center rounded-lg overflow-hidden w-fit text-black">
    <div class="bg-gray-300 px-3 py-1 whitespace-nowrap">
      <i class="fa-regular fa-lightbulb"></i> Mnemonic
    </div>
    <input 
      type="text" 
      bind:value={tempMnemonic} 
      on:keydown={handleKeydown}
      class="bg-blue-300 px-3 py-1 border-none outline-none focus:bg-blue-200 min-w-[120px]"
      placeholder="Enter mnemonic"
      disabled={isLoading}
    />
    <div class="flex gap-1 ml-2">
      <button 
        on:click={saveMnemonic} 
        disabled={isLoading}
        class="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs disabled:opacity-50"
      >
        {isLoading ? '...' : '✓'}
      </button>
      <button 
        on:click={cancelEdit} 
        disabled={isLoading}
        class="bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded text-xs disabled:opacity-50"
      >
        ✕
      </button>
    </div>
  </div>
{:else}
  {#if data.friend.mnemonic}
    <div 
      class="inline-flex items-center rounded-lg overflow-hidden w-fit text-black cursor-pointer hover:shadow-md transition-shadow"
      on:click={startEditing}
      role="button"
      tabindex="0"
      on:keydown={(e) => e.key === 'Enter' && startEditing()}
    >
      <div class="bg-gray-300 hover:bg-gray-400 px-3 py-1 whitespace-nowrap transition-colors">
        <i class="fa-regular fa-lightbulb"></i> Mnemonic
      </div>
      <div class="bg-blue-300 hover:bg-blue-400 px-3 py-1 whitespace-nowrap transition-colors">
        {data.friend.mnemonic}
      </div>
    </div>
  {:else}
    <div 
      class="inline-flex items-center rounded-lg overflow-hidden w-fit text-black cursor-pointer hover:shadow-md transition-shadow opacity-60"
      on:click={startEditing}
      role="button"
      tabindex="0"
      on:keydown={(e) => e.key === 'Enter' && startEditing()}
    >
      <div class="bg-gray-300 hover:bg-gray-400 px-3 py-1 whitespace-nowrap transition-colors">
        <i class="fa-regular fa-lightbulb"></i> Mnemonic
      </div>
      <div class="bg-blue-300 hover:bg-blue-400 px-3 py-1 whitespace-nowrap transition-colors">
        Not set
      </div>
    </div>
  {/if}
{/if}