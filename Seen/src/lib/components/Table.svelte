<script lang=ts>
    import { goto } from '$app/navigation';
	import type { Friend, Group } from '$lib/types'; // Import the Friend interface

      let newName = '';
      let newIntent = 'new';
      
      let selectedStatus = '';
	  let selectedGroup = '';

	  export let people: Friend[] = []; // Expecting a people array
	  export let groups: Group[] = []; // Expecting a groups array
      export let selectedCounty: string = '';
	  export let groupId: string | null = null; // Optional group ID
	  

      function navigateToFriend(id: string) {
            goto(`/friend/${id}`);
        }

async function handleDelete(event: Event) {
	event.preventDefault();
	const form = event.target as HTMLFormElement;
	const formData = new FormData(form);
	const response = await fetch(form.action, {
	  method: form.method,
	  body: formData
	});
	window.location.href = '/';
  }

  $: filteredPeople = people.filter((person) => {
    const statusMatch = selectedStatus === '' || person.intent === selectedStatus;
    const countyMatch = selectedCounty === '' || person.county === selectedCounty;
	const groupMatch = selectedGroup === '' || person.group_id === selectedGroup;
    return statusMatch && countyMatch && groupMatch;
  });

</script>


	<table class="min-w-full bg-white border border-gray-300 shadow-md rounded-lg overflow-hidden">
		<thead class="bg-gray-200">
			<tr class="text-left text-gray-600">
				<th class="py-3 px-4 border-b border-gray-300">
					Status:
					<select bind:value={selectedStatus} class="py-3 px-4 border-b border-gray-300">
						<option value="">All</option>
						<option value="romantic">Romantic</option>
						<option value="core">Core</option>
						<option value="archive">Archive</option>
						<option value="new">New</option>
						<option value="invest">Invest</option>
						<option value="associate">Associate</option>
					  </select>
				</th>
				
				<th class="py-3 px-4 border-b border-gray-300">Name</th>
				<th class="py-3 px-4 border-b border-gray-300">
					Group: 
					<select bind:value={selectedGroup} class="py-3 px-4 border-b border-gray-300">
						<option value="">All</option>
						{#each groups as group}
						  <option value={group.id}>{group.name}</option>
						{/each}
					  </select>
				</th>
				<th class="py-3 px-4 border-b border-gray-300"></th>
			</tr>
		</thead>
		<tbody>
			{#each filteredPeople as person}
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
			<td class="py-2 px-4 border-b border-gray-300">{person.group_name}</td>
			<td class="py-2 px-4 border-b border-gray-300">
			  <form method="POST" action="?/delete" on:submit={handleDelete}>
				<input type="hidden" name="id" value={person.id}>
				<input type="hidden" name="name" value={person.name}>
				<button type="submit" class="text-gray-500 px-6 py-3" aria-label="Delete person"><i class="fa-solid fa-trash"></i></button>
			  </form>
			</td>
			</tr>
			{/each}
			{#if people.length === 0}
				<tr>
					<td colspan="2" class="text-center py-2 text-gray-500">No data available</td>
				</tr>
			{/if}
		</tbody>
	</table>