<script lang="ts">
	export let data;
	import { goto } from '$app/navigation';
	let isAddingAssociate = false;

	let newAssociateName: string = '';

	function navigateToFriend(id: string) {
    	goto(`/friend/${id}`);
  }

	function toggleAddAssociate() {
   	 isAddingAssociate = !isAddingAssociate;
  }
</script>

<div>
	<div class="flex items-center justify-between mt-8">
		<h2 class="text-2xl">Associates</h2>
		<button on:click={toggleAddAssociate} class="bg-blue-500 text-white px-4 py-2 rounded">+ Add Associate</button>
	</div>
	{#if isAddingAssociate}
		<form method="POST" action="?/createAssociation" class="form-style mt-4">
		<input type="hidden" name="id" value={data.friend.id}>
		<div class="mb-4">
			<label for="newAssociateName" class="block text-sm font-medium text-gray-700">Associate Name</label>
			<input type="text" id="newAssociateName" name="associate" bind:value={newAssociateName} class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="Enter associate name">
		</div>
		<button type="submit" class="bg-blue-500 text-white px-4 py-2 rounded">Save</button>
		</form>
	{/if}
	<ul>
		{#each data.associates as associate}
			<div class="flex items-center justify-between">
				<button on:click={() => navigateToFriend(associate.id)} class="bg-gray-200 hover:bg-gray-300 text-black px-4 py-2 rounded">{associate.name}</button>
				<div>
				<form method="POST" action="?/deleteAssociation" class="form-style">  
					<input type="hidden" name="id" value={data.friend.id}>
					<input type="hidden" name="associate" value={associate.id}>
					<button type="submit" class="bg-red-500 text-white px-4 py-2 rounded-full text-sm">X</button>
				</form>
				</div>
			</div>
				<hr class="my-4 border-gray-300">
		{/each}
	</ul>	
</div>

<style>

</style>
