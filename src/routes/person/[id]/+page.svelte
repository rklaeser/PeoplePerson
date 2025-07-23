<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import '@fortawesome/fontawesome-free/css/all.css';
	import Associates from './Associates.svelte'; // Import the new Associates component
	import Status from './Status.svelte';
	import Location from './Location.svelte';
	import Groups from './Groups.svelte';
	import Body from './Body.svelte';
	import HistoryEntries from './HistoryEntries.svelte';
	import Birthday from './Birthday.svelte';
	import Mnemonic from './Mnemonic.svelte';
	import Name from './Name.svelte';
	import type { Friend, Group, History, Associate } from '$lib/types'; // Import the Friend interface
	import { authStore, isAuthenticated } from '$lib/stores/auth';
	import { apiClient, transformPersonToFriend } from '$lib/utils/apiClient';

	export let data: {
		id: string;
		friend: Friend | null;
		associates: Associate[];
		history: History[];
		groupData: Group[];
	};

	let friend: Friend | null = null;
	let loading = true;
	let groupsComponent: any;
	let associatesComponent: any;

	function goBackWithModal() {
		goto('/?modal=open');
	}

	onMount(() => {
		// Initialize Firebase auth
		const unsubscribe = authStore.init();
		
		// Check authentication state and load data
		const authUnsubscribe = authStore.subscribe(async (state) => {
			if (!state.loading && !state.user) {
				goto('/auth/login');
			} else if (!state.loading && state.user && data.id) {
				// User is authenticated, load friend data
				try {
					const response = await apiClient.getPerson(data.id);
					if (response.error) {
						console.error('Failed to fetch person:', response.error);
						// Could redirect to 404 or show error
					} else if (response.data) {
						friend = transformPersonToFriend(response.data);
					}
				} catch (error) {
					console.error('Error loading person:', error);
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
</script>

{#if $authStore.loading || loading}
	<!-- Loading state -->
	<div class="flex items-center justify-center h-screen">
		<div class="loading loading-spinner loading-lg"></div>
	</div>
{:else if friend}
	<section>
		<button
			class="absolute top-4 left-4 z-10 bg-gray-800 text-white rounded-full p-2 hover:bg-gray-700"
			on:click={goBackWithModal}
			aria-label="Back to list"
		>
			<i class="fas fa-arrow-left"></i>
		</button>
		<div class="relative">
			<Name data={{...data, friend}} />
			<div class="flex flex-col gap-4">
				<Status data={{...data, friend}} />
				<Birthday data={{...data, friend}} />
				<Mnemonic data={{...data, friend}} />
			</div>
		<div class="flex flex-row justify-between mb-10">
			<div class="flex flex-col gap-2 mt-2">
				<div class="flex items-center gap-4">
					<h3>Groups</h3>
					<button
						on:click={() => groupsComponent?.startAdding()}
						class="bg-blue-500 hover:bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm transition-colors"
						title="Add Group"
					>
						+
					</button>
				</div>
				<Groups data={{...data, friend}} bind:this={groupsComponent} />
			</div>
			<div class="flex flex-col gap-2 mt-2">
				<div class="flex items-center gap-5">
					<h3>Associates</h3>
					<button
						on:click={() => associatesComponent?.startAdding()}
						class="bg-blue-500 hover:bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm transition-colors"
						title="Add Associate"
					>
						+
					</button>
				</div>
				<Associates data={{...data, friend}} bind:this={associatesComponent} />
			</div>
		</div>
		<Body data={{...data, friend}} />
		<HistoryEntries data={{...data, friend}} />
	</div>
	</section>
{:else}
	<!-- Error state -->
	<div class="flex items-center justify-center h-screen">
		<div class="text-center">
			<h2 class="text-2xl font-bold mb-4">Person not found</h2>
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
	section {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: left;
		flex: 0.1;
	}
</style>
