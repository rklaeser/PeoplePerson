<script lang="ts">
	import '../app.css';
	import { authStore } from '$lib/stores/auth.svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let { children } = $props();

	// Check authentication and redirect if needed
	onMount(() => {
		// Wait for auth to initialize
		const checkAuth = setInterval(() => {
			if (!authStore.loading) {
				clearInterval(checkAuth);

				// Get current path
				const currentPath = window.location.pathname;

				// Public routes that don't require authentication
				const publicRoutes = ['/', '/signin', '/signup', '/login'];
				const isPublicRoute = publicRoutes.includes(currentPath) || currentPath.startsWith('/blog');

				// If not authenticated and trying to access protected route, redirect to landing page
				if (!authStore.user && !isPublicRoute) {
					goto('/');
				}

				// If authenticated and on auth pages, redirect to people page
				if (authStore.user && (currentPath === '/login' || currentPath === '/signin' || currentPath === '/signup')) {
					goto('/people');
				}
			}
		}, 100);

		// Cleanup
		return () => clearInterval(checkAuth);
	});
</script>

{#if authStore.loading}
	<div class="flex items-center justify-center min-h-screen">
		<div class="text-center">
			<h1 class="text-2xl font-bold mb-4">Loading...</h1>
			<p class="text-gray-600">Please wait</p>
		</div>
	</div>
{:else}
	{@render children?.()}
{/if}
