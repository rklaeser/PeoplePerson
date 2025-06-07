<script lang="ts">
	import { goto } from '$app/navigation';
	
	export let data;
	export let isEditing;

	let newAssociateName: string = '';

	function navigateToFriend(id: string) {
    	goto(`/person/${id}`);
  	}
</script>

{#if isEditing}
		<div class="flex items-center gap-2 mb-2">
			<form method="POST" action="?/createAssociation" class="flex items-center gap-2">
			  <label for="group"><i class="fa-solid fa-users"></i></label>
			  <input type="text" id="associate" name="associate" bind:value={newAssociateName} class="border px-2 py-1 mb-2" list="group-list">
			  <input type="hidden" name="id" value={data.friend.id}>
			  <button type="submit" class="bg-blue-500 text-white px-4 py-2 rounded">+ Add Associate</button>
			</form>
			<div class="flex gap-2">
			  {#each data.associates as associate}
				<form method="POST" action="?/deleteAssociation" class="flex items-center gap-2">
				  <input type="hidden" name="id" value={data.friend.id}>
				  <input type="hidden" name="associate" value={associate.id}>
				  <button type="submit" class="bg-gray-200 hover:bg-gray-300 text-black flex items-center rounded cursor-pointer" aria-label="Delete {associate.name}">
					<div class="flex-grow px-4 py-2">
					  <i class="fa-solid fa-user"></i> {associate.name}
					</div>
					<div class="bg-gray-400 text-white px-4 py-2 rounded-r">
					  X
					</div>
				</form>
			  {/each}
			</div>
		  </div>

	{:else}
	{#if data.associates.length > 0}
	<div class="flex items-center gap-2 mb-2">
		{#each data.associates as associate}
		<button on:click={() => navigateToFriend(associate.id)} class="bg-gray-300 hover:bg-gray-400 text-black flex items-center rounded cursor-pointer" aria-label="Delete {associate.name}">
			<div class="flex-grow px-4 py-2">
			  <i class="fa-solid fa-user"></i> {associate.name}
			</div>
		  </button>
		{/each}
		</div>
	{:else}
		<p>No associates</p>
	{/if}
	{/if}


