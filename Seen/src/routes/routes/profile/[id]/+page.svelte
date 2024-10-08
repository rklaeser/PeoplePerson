<script>
	import { page } from '$app/stores';
	import { peopleStore } from '$lib/stores/peopleStore';
	import { onDestroy } from 'svelte';
	// Get the dynamic ID from the URL
	const personId = $page.params.id;

	let people = [];

	// Subscribe to the store
	const unsubscribe = peopleStore.subscribe((value) => {
		people = value;
	});

	// Clean up the subscription when the component is destroyed
	onDestroy(() => {
		unsubscribe();
	});

	// Fetch or find the person's details based on the ID (replace this with actual data fetching)
	let person = people.find((p) => p.id == personId);
</script>

{#if person}
	<h1>Profile of {person.name}</h1>
	<p>Age: {person.age}</p>
{/if}
