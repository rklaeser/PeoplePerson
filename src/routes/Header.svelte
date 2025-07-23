<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import logo from '$lib/images/svelte-logo.svg';
	import github from '$lib/images/github.svg';
	import { getContext } from 'svelte';
	import { type Writable } from 'svelte/store';
	import Search from '../lib/components/Search.svelte';
	import SearchButton from '$lib/components/SearchButton.svelte';
	import type { Friend } from '$lib/types'; // Import the Friend interface
	import { authStore, isAuthenticated } from '$lib/stores/auth';
	import title from '$lib/images/friendships.svg';
	import { apiClient } from '$lib/utils/apiClient';

	interface Props {
		data: { people: Friend[]; session: any };
	}

	const { data } = $props() as Props;
	let expandSearch = $state(false);
	let expandMenu = $state(false);

	// Detect if we're on a group page and extract group ID
	const isGroupPage = $derived($page.route.id === '/group/[id]');
	const groupId = $derived(isGroupPage ? $page.params.id : undefined);

	// Handler for adding person to group
	async function handleAddToGroup(personId: string) {
		if (!groupId) return;
		
		try {
			// First get the group to retrieve its name
			const groupResponse = await apiClient.getGroup(groupId);
			if (groupResponse.error || !groupResponse.data) {
				console.error('Failed to get group:', groupResponse.error);
				return;
			}

			// Add person to group using Django API
			const response = await apiClient.addPersonToGroup(personId, groupResponse.data.name);

			if (response.error) {
				console.error('Failed to add member to group:', response.error);
			} else {
				// Close search and reload page
				expandSearch = false;
				location.reload();
			}
		} catch (error) {
			console.error('Error adding member to group:', error);
		}
	}
</script>

<header class="flex items-center">
	<div class="ml-4 mt-10"></div>
	{#if expandSearch}
		<div class="fixed inset-10 bg-black bg-opacity-50 backdrop-blur-sm z-50"></div>
		<div class="fixed top-6 flex justify-center w-full z-50">
			<div class="w-10/12 max-w-3xl">
				<Search {data} bind:expandSearch {groupId} onAddToGroup={handleAddToGroup} />
			</div>
		</div>
	{/if}

	<div class="absolute right-6">
		<div class="flex items-center">
			{#if !expandSearch}
				<SearchButton bind:expandSearch />
			{/if}

			<div class="m-2">
				<button onclick={() => (expandMenu = true)} aria-label="Menu">
					<i class="fa-solid fa-ellipsis-vertical text-white text-xl"></i>
				</button>
			</div>
			{#if expandMenu}
				<div class="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50"></div>
				<div class="fixed top-10 right-0 flex justify-center w-1/4 z-50">
					<div class="w-10/12 max-w-3xl">
						<div class="bg-sky-950 rounded-lg shadow-lg text-white">
							<div class="flex justify-end mr-3">
								<button onclick={() => (expandMenu = false)} aria-label="Close Menu">
									<i class="fa-solid fa-xmark text-xl"></i>
								</button>
							</div>
							<div class="flex flex-col gap-4 p-4">
								<a href="/map" class="text-xl" onclick={() => (expandMenu = false)}>Map</a>
								<a href="/stats" class="text-xl" onclick={() => (expandMenu = false)}>Stats</a>
								<a href="/tutorial" class="text-xl" onclick={() => (expandMenu = false)}>Tutorial</a
								>
								{#if $isAuthenticated}
									<button
										class="text-xl text-left"
										onclick={() => {
											expandMenu = false;
											authStore.logout();
										}}
									>
										Sign Out
									</button>
								{:else}
									<a href="/signin" class="text-xl" onclick={() => (expandMenu = false)}>Sign In</a>
								{/if}
							</div>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>
</header>

<style>
	.corner {
		width: 3em;
		height: 3em;
	}
</style>
