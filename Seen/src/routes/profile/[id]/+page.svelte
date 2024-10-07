<script>
	import { page } from '$app/stores';
	import { people } from '$lib/stores/peopleStore';

	// Get the dynamic ID from the URL
	const personId = $page.params.id;

	// Fetch or find the person's details based on the ID (replace this with actual data fetching)

	let person = people.find((p) => p.id == personId);
</script>

{#if person}
	<h1>Profile of {person.name}</h1>
	<p>Age: {person.age}</p>
{/if}
