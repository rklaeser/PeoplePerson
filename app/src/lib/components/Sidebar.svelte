<script lang="ts">
	import { authStore } from '$lib/stores/auth.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { getGuide } from '$lib/guides';
	import type { GuideType } from '$lib/types';
	import IconBookOpen from '~icons/lucide/book-open';
	import IconUsers from '~icons/lucide/users';
	import IconMap from '~icons/lucide/map';

	let expanded = $state(false);
	let showAccountMenu = $state(false);
	let userGuideType = $state<GuideType | null>(null);

	async function fetchUserGuide() {
		try {
			const token = await authStore.getIdToken();
			if (!token) return;

			const response = await fetch('/api/user', {
				headers: { Authorization: `Bearer ${token}` }
			});

			if (response.ok) {
				const user = await response.json();
				userGuideType = user.selectedGuide || 'Nico';
			}
		} catch (e) {
			userGuideType = 'Nico'; // Default
		}
	}

	onMount(() => {
		if (authStore.user) {
			fetchUserGuide();
		}
	});

	let guideName = $derived(userGuideType ? getGuide(userGuideType).name : 'Guide');

	const navItems = $derived([
		{ id: 'journal', label: `Chat with ${guideName}`, icon: IconBookOpen, href: '/journal' },
		{ id: 'people', label: 'People', icon: IconUsers, href: '/people' },
		{ id: 'map', label: 'Map', icon: IconMap, href: '/map' }
	]);

	function handleMouseEnter() {
		expanded = true;
	}

	function handleMouseLeave() {
		expanded = false;
		showAccountMenu = false;
	}

	function handleNavigation(href: string) {
		goto(href);
		expanded = false;
	}

	async function handleSignOut() {
		await authStore.signOut();
		goto('/signin');
	}

	function getInitials(name: string): string {
		return name
			.split(' ')
			.map((n) => n[0])
			.join('')
			.toUpperCase()
			.slice(0, 2);
	}

	let currentPath = $derived($page.url.pathname);
</script>

<div
	class="fixed left-0 top-0 h-screen bg-white border-r border-gray-200 transition-all duration-200 ease-in-out z-50 {expanded
		? 'w-60'
		: 'w-16'}"
	onmouseenter={handleMouseEnter}
	onmouseleave={handleMouseLeave}
>
	<div class="flex flex-col h-full">
		<!-- Navigation -->
		<nav class="flex-1 pt-4">
			{#each navItems as item}
				<button
					onclick={() => handleNavigation(item.href)}
					class="w-full flex items-center px-4 py-3 hover:bg-gray-100 transition-colors {currentPath ===
					item.href
						? 'bg-blue-50 text-blue-600'
						: 'text-gray-700'}"
				>
					<svelte:component this={item.icon} class="w-6 h-6 flex-shrink-0" />
					{#if expanded}
						<span class="ml-3 text-sm font-medium">{item.label}</span>
					{/if}
				</button>
			{/each}
		</nav>

		<!-- Bottom section -->
		<div class="border-t border-gray-200">
			<!-- Settings -->
			<button
				onclick={() => handleNavigation('/settings')}
				class="w-full flex items-center px-4 py-3 hover:bg-gray-100 transition-colors {currentPath ===
				'/settings'
					? 'bg-blue-50 text-blue-600'
					: 'text-gray-600'}"
			>
				<svg class="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
					/>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
					/>
				</svg>
				{#if expanded}
					<span class="ml-3 text-sm font-medium">Settings</span>
				{/if}
			</button>

			<!-- Account -->
			<div class="relative">
				<button
					onclick={() => (showAccountMenu = !showAccountMenu)}
					class="w-full flex items-center px-4 py-3 hover:bg-gray-100 transition-colors"
				>
					{#if authStore.user}
						<div
							class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
						>
							{getInitials(authStore.user.displayName || authStore.user.email || 'User')}
						</div>
						{#if expanded}
							<div class="ml-3 text-left flex-1 min-w-0">
								<div class="text-sm font-medium text-gray-900 truncate">
									{authStore.user.displayName || 'User'}
								</div>
								<div class="text-xs text-gray-500 truncate">{authStore.user.email}</div>
							</div>
						{/if}
					{/if}
				</button>

				{#if showAccountMenu && expanded}
					<div
						class="absolute bottom-full left-4 right-4 mb-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
					>
						<button
							onclick={handleSignOut}
							class="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 transition-colors"
						>
							Sign out
						</button>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
