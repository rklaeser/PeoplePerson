<script lang="ts">
  export let data;
  
  let isEditing = false;
  let isLoading = false;
  let tempBirthday = data.friend.birthday || '';

  function startEditing() {
    isEditing = true;
    tempBirthday = data.friend.birthday || '';
  }

  function cancelEdit() {
    isEditing = false;
    tempBirthday = data.friend.birthday || '';
  }

  async function saveBirthday() {
    if (tempBirthday === data.friend.birthday) {
      isEditing = false;
      return;
    }

    isLoading = true;
    try {
      const formData = new FormData();
      formData.append('id', data.friend.id);
      formData.append('birthday', tempBirthday);

      const response = await fetch(`/person/${data.friend.id}?/updateBirthday`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        // Optimistic update
        data.friend.birthday = tempBirthday;
        isEditing = false;
      } else {
        console.error('Failed to update birthday');
        tempBirthday = data.friend.birthday || '';
      }
    } catch (error) {
      console.error('Error updating birthday:', error);
      tempBirthday = data.friend.birthday || '';
    } finally {
      isLoading = false;
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      cancelEdit();
    } else if (event.key === 'Enter') {
      saveBirthday();
    }
  }
</script>

{#if isEditing}
  <div class="inline-flex items-center rounded-lg overflow-hidden w-fit text-black">
    <div class="bg-gray-300 px-3 py-1 whitespace-nowrap">
      <i class="fa-solid fa-cake-candles"></i> Birthday
    </div>
    <input 
      type="date" 
      bind:value={tempBirthday} 
      on:keydown={handleKeydown}
      class="bg-yellow-300 px-3 py-1 border-none outline-none focus:bg-yellow-200"
      disabled={isLoading}
    />
    <div class="flex gap-1 ml-2">
      <button 
        on:click={saveBirthday} 
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
  {#if data.friend.birthday}
    <div 
      class="inline-flex items-center rounded-lg overflow-hidden w-fit text-black cursor-pointer hover:shadow-md transition-shadow"
      on:click={startEditing}
      role="button"
      tabindex="0"
      on:keydown={(e) => e.key === 'Enter' && startEditing()}
    >
      <div class="bg-gray-300 hover:bg-gray-400 px-3 py-1 whitespace-nowrap transition-colors">
        <i class="fa-solid fa-cake-candles"></i> Birthday
      </div>
      <div class="bg-yellow-300 hover:bg-yellow-400 px-3 py-1 whitespace-nowrap transition-colors">
        {data.friend.birthday}
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
        <i class="fa-solid fa-cake-candles"></i> Birthday
      </div>
      <div class="bg-yellow-300 hover:bg-yellow-400 px-3 py-1 whitespace-nowrap transition-colors">
        Not set
      </div>
    </div>
  {/if}
{/if}