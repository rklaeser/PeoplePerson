<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount, onDestroy } from 'svelte';
	import type { Friend } from '$lib/types';
	import { authStore, isAuthenticated } from '$lib/stores/auth';
	import { apiClient, transformPersonToFriend } from '$lib/utils/apiClient';

	export let data: {
		id: string;
		group: any | null;
		people: Friend[];
		availablePeople: { id: string; name: string }[];
	};

	let group: any | null = null;
	let people: Friend[] = [];
	let availablePeople: { id: string; name: string }[] = [];
	let loading = true;


	onMount(() => {
		// Initialize Firebase auth
		const unsubscribe = authStore.init();
		
		// Check authentication state and load data
		const authUnsubscribe = authStore.subscribe(async (state) => {
			if (!state.loading && !state.user) {
				goto('/auth/login');
			} else if (!state.loading && state.user && data.id) {
				// User is authenticated, load group data
				try {
					const response = await apiClient.getGroup(data.id);
					if (response.error) {
						console.error('Failed to fetch group:', response.error);
						// Could redirect to 404 or show error
					} else if (response.data) {
						group = response.data;
						
						// Load group members
						const membersResponse = await apiClient.getGroupMembers(data.id);
						if (membersResponse.error) {
							console.error('Failed to fetch group members:', membersResponse.error);
							people = [];
						} else {
							const membersData = membersResponse.data || [];
							people = membersData.map(transformPersonToFriend);
						}
						
						// TODO: Load available people for autocomplete
						availablePeople = [];
					}
				} catch (error) {
					console.error('Error loading group:', error);
				} finally {
					loading = false;
				}
			}
		});
		
		return () => {
			unsubscribe();
			authUnsubscribe();
		};
	});


	async function removeMemberFromGroup(personId: string) {
		try {
			const response = await apiClient.removePersonFromGroup(personId, group.id);

			if (response.error) {
				console.error('Failed to remove member from group:', response.error);
			} else {
				// Reload the page to get updated data
				location.reload();
			}
		} catch (error) {
			console.error('Error removing member from group:', error);
		}
	}

	async function addMemberToGroup(personId: string) {
		try {
			const response = await apiClient.addPersonToGroup(personId, group.name);

			if (response.error) {
				console.error('Failed to add member to group:', response.error);
			} else {
				// Reload page
				location.reload();
			}
		} catch (error) {
			console.error('Error adding member to group:', error);
		}
	}


	function navigateToFriend(id: string) {
		goto(`/person/${id}`);
	}

	function goBack() {
		goto('/');
	}

</script>

{#if $authStore.loading || loading}
	<!-- Loading state -->
	<div class="flex items-center justify-center h-screen">
		<div class="loading loading-spinner loading-lg"></div>
	</div>
{:else if group}
	<section class="p-6">
		<button
			class="absolute top-4 left-4 z-10 bg-gray-800 text-white rounded-full p-2 hover:bg-gray-700"
			on:click={goBack}
			aria-label="Back to home"
		>
			<i class="fas fa-arrow-left"></i>
		</button>

		<div class="max-w-4xl mx-auto">
			<div class="pt-12 mb-6">
				<div class="flex items-center gap-3 mb-3">
					<i class="fa-solid fa-users text-2xl"></i>
					<h1 class="text-3xl font-bold">{group.name}</h1>
					<span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
						{people.length} member{people.length !== 1 ? 's' : ''}
					</span>
				</div>

				{#if group.description}
					<p class="text-white text-lg mb-4">{group.description}</p>
				{/if}


			{#if people.length > 0}
				<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{#each people as person}
						<div
							class="group relative bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow"
						>
							<button
								on:click={() => navigateToFriend(person.id)}
								class="w-full p-4 text-left hover:bg-gray-50 rounded-lg transition-colors"
							>
								<div class="flex items-start justify-between mb-2">
									<h3 class="font-semibold text-lg text-gray-800">{person.name}</h3>
									<span
										class="inline-block px-2 py-1 text-xs font-medium rounded-full {person.intent ===
										'core'
											? 'bg-blue-100 text-blue-800'
											: person.intent === 'romantic'
												? 'bg-pink-100 text-pink-800'
												: person.intent === 'invest'
													? 'bg-green-100 text-green-800'
													: person.intent === 'archive'
														? 'bg-gray-100 text-gray-800'
														: person.intent === 'associate'
															? 'bg-purple-100 text-purple-800'
															: 'bg-yellow-100 text-yellow-800'}"
									>
										{person.intent || 'new'}
									</span>
								</div>

								{#if person.body}
									<p class="text-gray-600 text-sm leading-relaxed mb-2 line-clamp-3">
										{person.body}
									</p>
								{/if}

								<div class="flex items-center gap-4 text-xs text-gray-500">
									{#if person.birthday}
										<span class="flex items-center gap-1">
											<i class="fa-solid fa-cake-candles"></i>
											{person.birthday}
										</span>
									{/if}
								</div>
							</button>

							<!-- Remove member button (appears on hover) -->
							<button
								on:click={() => removeMemberFromGroup(person.id)}
								class="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
								title="Remove {person.name} from group"
							>
								✕
							</button>
						</div>
					{/each}
				</div>
			{:else}
				<div class="text-center py-12">
					<i class="fa-solid fa-users text-4xl text-gray-400 mb-4"></i>
					<h2 class="text-xl font-semibold text-gray-600 mb-2">No members yet</h2>
					<p class="text-gray-500">This group doesn't have any members.</p>
				</div>
			{/if}
		</div>
	</div>
	</section>
{:else}
	<!-- Error state -->
	<div class="flex items-center justify-center h-screen">
		<div class="text-center">
			<h2 class="text-2xl font-bold mb-4">Group not found</h2>
			<button 
				on:click={() => goto('/')}
				class="btn btn-primary"
			>
				Go back home
			</button>
		</div>
	</div>
{/if}

<style>
	.line-clamp-3 {
		display: -webkit-box;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
