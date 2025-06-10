<script lang=ts>
	import Header from './Header.svelte';
	import '../app.css';
	import '../tailwind.css';
	import type { Friend } from '$lib/types'; // Import the Friend interface

	export let data;
</script>

<div class="h-screen bg-gray-900 text-gray-100">
	{#if data.session}
		<Header {data} />
	{/if}
	<div class="p-10 {data.session ? 'pt-5' : ''}">
		<slot />
	</div>
</div>

<style>
</style>
