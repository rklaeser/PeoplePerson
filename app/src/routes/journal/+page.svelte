<script lang="ts">
	import { onMount } from 'svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { goto } from '$app/navigation';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import JournalList from '$lib/components/JournalList.svelte';
	import JournalEntryView from '$lib/components/JournalEntryView.svelte';
	import ConversationStarter from '$lib/components/ConversationStarter.svelte';
	import { getGuide } from '$lib/guides';
	import type { GuideType } from '$lib/types';

	// Journal state
	let selectedEntryId = $state<string | null>(null);
	let userGuideType = $state<GuideType | null>(null);
	let loading = $state(true);
	let refreshTrigger = $state(0);

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
			console.error('Error fetching user guide:', e);
			userGuideType = 'Nico'; // Default
		} finally {
			loading = false;
		}
	}

	// Journal handlers
	function handleEntryClick(entryId: string) {
		selectedEntryId = entryId;
	}

	function handleMessageSent(entryId: string) {
		selectedEntryId = entryId;
		refreshTrigger++; // Trigger list refresh
	}

	// Redirect to signin if not authenticated
	onMount(() => {
		if (!authStore.user) {
			goto('/signin');
		} else {
			fetchUserGuide();
		}
	});

	let guide = $derived(userGuideType ? getGuide(userGuideType) : null);
</script>

<Sidebar />

{#if loading}
	<div class="ml-16 flex items-center justify-center h-screen bg-gray-50">
		<div class="text-gray-500">Loading...</div>
	</div>
{:else}
	<div class="ml-16 flex flex-col h-screen bg-gray-50">
		<!-- Header with Guide Info -->
		{#if guide}
			<div class="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
				<img src={guide.imageUrl} alt={guide.name} class="w-12 h-12 rounded-full object-cover" />
				<div>
					<h1 class="text-xl font-semibold text-gray-900">Chat with {guide.name}</h1>
					<p class="text-sm text-gray-600">{guide.personality}</p>
				</div>
			</div>
		{/if}

		<div class="flex flex-1 overflow-hidden">
			<!-- Journal List -->
			<JournalList
				{selectedEntryId}
				onEntryClick={handleEntryClick}
				{refreshTrigger}
			/>

			<!-- Right panel - Show conversation starter or selected entry -->
			<div class="flex-1 bg-gray-50">
				{#if selectedEntryId}
					<JournalEntryView
						entryId={selectedEntryId}
						onClose={() => selectedEntryId = null}
					/>
				{:else if guide}
					<ConversationStarter
						{guide}
						onMessageSent={handleMessageSent}
					/>
				{/if}
			</div>
		</div>
	</div>
{/if}
