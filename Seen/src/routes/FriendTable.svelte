<script>
	export let people = [];
</script>

<table class="min-w-full bg-white border border-gray-300 shadow-md rounded-lg overflow-hidden">
	<thead class="bg-gray-200">
		<tr class="text-left text-gray-600">
			<th class="py-3 px-4 border-b border-gray-300">Name</th>
			<th class="py-3 px-4 border-b border-gray-300">Age</th>
			<th class="py-3 px-4 border-b border-gray-300">City</th>
		</tr>
	</thead>
	<tbody>
		{#each people as person}
			<tr class="hover:bg-gray-100">
				<td class="py-2 px-4 border-b border-gray-300">{person.name}</td>
				<td class="py-2 px-4 border-b border-gray-300">{person.age}</td>
				<td class="py-2 px-4 border-b border-gray-300">{person.city}</td>
			</tr>
		{/each}
		{#if people.length === 0}
			<tr>
				<td colspan="3" class="text-center py-2 text-gray-500">No data available</td>
			</tr>
		{/if}
	</tbody>
</table>
