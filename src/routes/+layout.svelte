<script lang=ts>
	import Header from './Header.svelte';
	import '../app.css';
	import '../tailwind.css';
	import type { Friend } from '$lib/types'; // Import the Friend interface
</script>

<div class="h-screen bg-gray-900 text-gray-100 p-10">
		<slot />
</div>

<style>
</style>
