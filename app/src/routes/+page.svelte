<script lang="ts">
	import { authStore } from '$lib/stores/auth.svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import Landing from '$lib/components/Landing.svelte';

	// Redirect to people page if authenticated
	onMount(() => {
		if (authStore.user) {
			goto('/people');
		}
	});
</script>

{#if authStore.user}
	<div class="flex items-center justify-center min-h-screen bg-gray-50">
		<div class="text-center">
			<h1 class="text-2xl font-bold mb-4">Redirecting...</h1>
		</div>
	</div>
{:else}
	<Landing />
{/if}
