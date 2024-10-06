<script>
	export let data = [];
</script>

<table class="min-w-full bg-white border border-gray-200">
	<thead>
		<tr class="bg-gray-200">
			<th class="py-2 px-4 border">Name</th>
			<th class="py-2 px-4 border">Age</th>
			<th class="py-2 px-4 border">City</th>
		</tr>
	</thead>
	<tbody>
		{#each data as person}
			<tr class="hover:bg-gray-100">
				<td class="py-2 px-4 border">{person.name}</td>
				<td class="py-2 px-4 border">{person.age}</td>
				<td class="py-2 px-4 border">{person.city}</td>
			</tr>
		{/each}
	</tbody>
</table>
