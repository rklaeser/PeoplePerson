<script>
	import Counter from './Counter.svelte';
	import welcome from '$lib/images/svelte-welcome.webp';
	import welcome_fallback from '$lib/images/svelte-welcome.png';
	import FriendTable from './FriendTable.svelte';
	import { peopleStore, addFriend, removeFriend, updateFriend } from '$lib/stores/peopleStore';
	import { onDestroy } from 'svelte';

	let people = [];

	// Subscribe to the store
	const unsubscribe = peopleStore.subscribe((value) => {
		people = value;
	});

	// Clean up the subscription when the component is destroyed
	onDestroy(() => {
		unsubscribe();
	});
</script>

<link rel="stylesheet" href="/src/tailwind.css" />

<svelte:head>
	<title>Friend Ship</title>
	<meta name="description" content="Friend Ship app" />
</svelte:head>

<section>
	<FriendTable {people} />
</section>

<style>
	section {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		flex: 0.6;
	}

	h1 {
		width: 100%;
	}
</style>
