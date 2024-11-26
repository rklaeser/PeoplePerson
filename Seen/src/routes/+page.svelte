
<script lang="ts">
	import { goto } from '$app/navigation';
    export let data: { people: { id: string; name: string }[] };


  function navigateToFriend(name: string) {
    goto(`/friend/${name}`);
  }
</script>

<link rel="stylesheet" href="/src/tailwind.css" />

<svelte:head>
	<title>Friend Ship</title>
	<meta name="description" content="Friend Ship app" />
</svelte:head>

<section>
	<form method="POST" action="?/add">
		<label>
			add a todo:
			<input
				name="name"
				autocomplete="off"
				required
			/>
		</label>
	</form>
	<table class="min-w-full bg-white border border-gray-300 shadow-md rounded-lg overflow-hidden">
		<thead class="bg-gray-200">
			<tr class="text-left text-gray-600">
				<th class="py-3 px-4 border-b border-gray-300">ID</th>
				<th class="py-3 px-4 border-b border-gray-300">Name</th>
			</tr>
		</thead>
		<tbody>
			{#each data.people as person}
			<tr class="hover:bg-gray-100 cursor-pointer" on:click={() => navigateToFriend(person.name)}>
			<td class="py-2 px-4 border-b border-gray-300">{person.id}</td>
			<td class="py-2 px-4 border-b border-gray-300">{person.name}</td>
			<td class="py-2 px-4 border-b border-gray-300">
			  <form method="POST" action="?/delete">
				<input type="hidden" name="id" value={person.id}>
				<input type="hidden" name="name" value={person.name}>
				<button type="submit" class="bg-red-500 text-white px-4 py-2 rounded">Delete</button>
			  </form>
			</td>
			{/each}
			{#if data.people.length === 0}
				<tr>
					<td colspan="2" class="text-center py-2 text-gray-500">No data available</td>
				</tr>
			{/if}
		</tbody>
	</table>
</section>

<style>
	section {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		flex: 0.6;
	}
</style>
