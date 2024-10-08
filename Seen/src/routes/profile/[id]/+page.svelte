<script>
	import { page } from '$app/stores';
	import { peopleStore } from '$lib/stores/peopleStore';
	import { onDestroy } from 'svelte';
	import Associate from '../../Associate.svelte';
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
	let friend = people.find((p) => p.id == personId);
</script>

{#if friend}
	<h1>Profile of {friend.name}</h1>
	<div class="friend-info">
		<p><strong>ID:</strong> {friend.id}</p>
		<p><strong>Name:</strong> {friend.name}</p>
		<p><strong>Age:</strong> {friend.age}</p>
		<p><strong>City:</strong> {friend.city}</p>
		<p><strong>Zip:</strong> {friend.zip}</p>
		<p><strong>Mnemonic:</strong> {friend.mnemonic}</p>
		<p><strong>Activity:</strong> {friend.activity}</p>
		<p><strong>Notes:</strong> {friend.notes}</p>
		<h3>Associates</h3>
		{#each friend.associates as associate}
			<Associate {associate} />
		{/each}
	</div>
{/if}
