<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	// Redirect to new signin page
	onMount(() => {
		goto('/signin');
	});

</script>

<div class="flex items-center justify-center min-h-screen bg-gray-50">
	<div class="text-center">
		<h1 class="text-2xl font-bold mb-4">Redirecting...</h1>
	</div>
</div>
