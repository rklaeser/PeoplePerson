<script lang="ts">
	import Header from './Header.svelte';
	import '../app.css';
	import '../tailwind.css';
	import type { Friend } from '$lib/types'; // Import the Friend interface
	import { authStore, isAuthenticated } from '$lib/stores/auth';
	import { onMount } from 'svelte';

	export let data;

	// Initialize Firebase auth state listener
	onMount(() => {
		const unsubscribe = authStore.init();
		return unsubscribe;
	});
</script>

<div class="h-screen bg-gray-900 text-gray-100">
	{#if $isAuthenticated}
		<Header {data} />
	{/if}
	<div class="p-10 {$isAuthenticated ? 'pt-5' : ''}">
		<slot />
	</div>
</div>

<style>
</style>
