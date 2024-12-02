
<script lang="ts">
	import { goto } from '$app/navigation';
    export let data: { people: { id: string; name: string, intent: string }[] };


	function navigateToFriend(id: string) {
    goto(`/friend/${id}`);
  }

  let newName = '';
  let newIntent = 'new';

</script>

<link rel="stylesheet" href="/src/tailwind.css" />

<svelte:head>
	<title>Friend Ship</title>
	<meta name="description" content="Friend Ship app" />
</svelte:head>

<section>
	<table class="min-w-full bg-white border border-gray-300 shadow-md rounded-lg overflow-hidden">
		<thead class="bg-gray-200">
			<tr class="text-left text-gray-600">
				<th class="py-3 px-4 border-b border-gray-300">Status</th>
				<th class="py-3 px-4 border-b border-gray-300">Name</th>
				<th class="py-3 px-4 border-b border-gray-300"></th>
			</tr>
		</thead>
		<tbody>
			<tr>
				<td class="py-2 px-4 border-b border-gray-300">
				  <select bind:value={newIntent} class="border px-2 py-1 mb-2">
					<option value="romantic">Romantic</option>
					<option value="core">Core</option>
					<option value="archive">Archive</option>
					<option value="new">New</option>
					<option value="invest">Invest</option>
				  </select>
				</td>
				<td class="py-2 px-4 border-b border-gray-300">
				  <input type="text" bind:value={newName} class="border px-2 py-1 mb-2" placeholder="Enter name" />
				</td>
				<td class="py-2 px-4 border-b border-gray-300">
				  <form method="POST" action="?/create">
					<input type="hidden" name="name" value={newName}>
					<input type="hidden" name="intent" value={newIntent}>
					<button type="submit" class="bg-green-500 text-white px-4 py-2 rounded">Create</button>
				  </form>
				</td>
			  </tr>
			{#each data.people as person}
			<tr class="hover:bg-gray-100 cursor-pointer" on:click={() => navigateToFriend(person.id)}>
				{#if person.intent === 'romantic'}
				<td class="py-2 px-4 border-b border-gray-300">🌸</td>
			  {:else if person.intent === 'core'}
				<td class="py-2 px-4 border-b border-gray-300">🌻</td>
			  {:else if person.intent === 'archive'}
				<td class="py-2 px-4 border-b border-gray-300">🥀</td>
			  {:else if person.intent === 'new'}
				<td class="py-2 px-4 border-b border-gray-300">🌰</td>
			  {:else if person.intent === 'invest'}
				<td class="py-2 px-4 border-b border-gray-300">🌱</td>
			  {:else}
				<td class="py-2 px-4 border-b border-gray-300">❓</td>
			  {/if}
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
