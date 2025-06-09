<script lang=ts>
  import { goto } from '$app/navigation';

  export let data;
  
  let isAdding = false;
  let newName = '';

  export function startAdding() {
    isAdding = true;
    newName = '';
  }

  function cancelAdding() {
    isAdding = false;
    newName = '';
  }

  async function addGroup() {
    if (!newName.trim()) return;

    try {
      const formData = new FormData();
      formData.append('id', data.friend.id);
      formData.append('name', newName);

      const response = await fetch(`/person/${data.friend.id}?/addGroup`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        // Reload the page to get updated data
        location.reload();
      } else {
        console.error('Failed to add group');
      }
    } catch (error) {
      console.error('Error adding group:', error);
    }
  }

  async function removeGroup(groupId: string) {
    try {
      const formData = new FormData();
      formData.append('id', data.friend.id);
      formData.append('groupId', groupId);

      const response = await fetch(`/person/${data.friend.id}?/removeGroup`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        // Reload the page to get updated data
        location.reload();
      } else {
        console.error('Failed to remove group');
      }
    } catch (error) {
      console.error('Error removing group:', error);
    }
  }

  function navigateToGroup(id: string) {
    console.log('Navigating to group: ', id);
    goto(`/group/${id}`);
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      cancelAdding();
    } else if (event.key === 'Enter') {
      addGroup();
    }
  }
</script>

{#if isAdding}
  <div class="flex items-center gap-2 mb-2">
    <input 
      type="text" 
      bind:value={newName} 
      on:keydown={handleKeydown}
      class="border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" 
      placeholder="Enter group name"
      autofocus
    />
    <button 
      on:click={addGroup} 
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

{#if data.groupData.length > 0}
  <div class="flex gap-2 flex-wrap">
    {#each data.groupData as group}
      <div class="group relative">
        <button 
          on:click={() => navigateToGroup(group.groupId)} 
          class="bg-gray-300 hover:bg-gray-400 text-black flex items-center rounded cursor-pointer transition-colors pr-8"
        >
          <div class="px-4 py-2">
            <i class="fa-solid fa-users"></i> {group.groupName}
          </div>
        </button>
        <button 
          on:click={() => removeGroup(group.groupId)}
          class="absolute right-1 top-1/2 transform -translate-y-1/2 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
          title="Remove from group"
        >
          ✕
        </button>
      </div>
    {/each}
  </div>
{:else}
  <p class="text-gray-500 italic">No groups</p>
{/if}
