<script lang=ts>

    export let data;
    export let isEditing;
    
    let newName = '';
</script>

{#if isEditing}
<div class="flex items-center gap-2 mb-2">
    <form method="POST" action="?/addGroup" class="flex items-center gap-2">
      <label for="group"><i class="fa-solid fa-users"></i></label>
      <input type="text" id="name" name="name" bind:value={newName} class="border px-2 py-1 mb-2" list="group-list">
      <input type="hidden" name="id" value={data.friend.id}>
      <button type="submit" class="bg-blue-500 text-white px-4 py-2 rounded">+ Add Group</button>
    </form>
    <div class="flex gap-2">
      {#each data.groupData as group}
        <form method="POST" action="?/removeGroup" class="flex items-center gap-2">
          <input type="hidden" name="id" value={data.friend.id}>
          <input type="hidden" name="groupId" value={group.groupId}>
          <button type="submit" class="bg-gray-200 hover:bg-gray-300 text-black flex items-center rounded cursor-pointer" aria-label="Delete {group.groupName}">
            <div class="flex-grow px-4 py-2">
              <i class="fa-solid fa-users"></i> {group.groupName}
            </div>
            <div class="bg-gray-400 text-white px-4 py-2 rounded-r">
              X
            </div>
        </form>
      {/each}
    </div>
  </div>
{:else}
    {#each data.groupData as group}
        <p><i class="fa-solid fa-users"></i> {group.groupName}</p>
    {/each}
{/if}