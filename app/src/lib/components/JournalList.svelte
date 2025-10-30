<script lang="ts">
	import { onMount } from 'svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import type { JournalEntry } from '$lib/types';

	interface Props {
		selectedEntryId: string | null;
		onEntryClick: (entryId: string) => void;
		refreshTrigger?: number;
	}

	let { selectedEntryId, onEntryClick, refreshTrigger = 0 }: Props = $props();

	let entries = $state<JournalEntry[]>([]);
	let loading = $state(true);
	let error = $state('');

	async function fetchEntries() {
		loading = true;
		error = '';

		try {
			const token = await authStore.getIdToken();
			if (!token) throw new Error('Not authenticated');

			const response = await fetch('/api/journal?limit=50&sortOrder=desc', {
				headers: { Authorization: `Bearer ${token}` }
			});

			if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);

			entries = await response.json();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load journal entries';
			console.error('Error fetching journal entries:', error);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		fetchEntries();
	});

	// Refetch when refreshTrigger changes
	$effect(() => {
		if (refreshTrigger > 0) {
			fetchEntries();
		}
	});

	function formatDate(dateStr: string): string {
		const date = new Date(dateStr);
		const today = new Date();
		const yesterday = new Date(today);
		yesterday.setDate(yesterday.getDate() - 1);

		if (date.toDateString() === today.toDateString()) {
			return 'Today';
		} else if (date.toDateString() === yesterday.toDateString()) {
			return 'Yesterday';
		} else {
			return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
		}
	}

	function getPreview(content: string): string {
		return content.length > 80 ? content.substring(0, 80) + '...' : content;
	}
</script>

<div class="w-96 bg-white border-r border-gray-200 flex flex-col">
	<!-- Header -->
	<div class="p-4 border-b border-gray-200">
		<h1 class="text-2xl font-bold">Conversations</h1>
	</div>

	<!-- Entries list -->
	<div class="flex-1 overflow-y-auto">
		{#if loading}
			<div class="flex items-center justify-center h-full">
				<div class="text-gray-500">Loading...</div>
			</div>
		{:else if error}
			<div class="p-4">
				<div class="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
					{error}
				</div>
			</div>
		{:else if entries.length === 0}
			<div class="flex items-center justify-center h-64">
				<div class="text-center text-gray-500">
					<p class="mb-2">No conversations yet</p>
					<p class="text-sm">Start chatting with your guide</p>
				</div>
			</div>
		{:else}
			<div class="divide-y divide-gray-100">
				{#each entries as entry (entry.id)}
					<button
						onclick={() => onEntryClick(entry.id)}
						class="w-full p-4 text-left hover:bg-gray-50 transition-colors {selectedEntryId ===
						entry.id
							? 'bg-blue-50 border-l-4 border-blue-600'
							: ''}"
					>
						<div class="flex items-start justify-between mb-1">
							<span class="text-sm font-medium text-gray-900">{formatDate(entry.date)}</span>
							{#if entry.conversationStatus === 'planned'}
								<span
									class="text-xs px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full"
								>
									Planned
								</span>
							{/if}
						</div>
						<p class="text-sm text-gray-600 line-clamp-2">{getPreview(entry.content)}</p>
						{#if entry.peopleIds && entry.peopleIds.length > 0}
							<div class="mt-2 flex items-center gap-1">
								<svg class="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
								</svg>
								<span class="text-xs text-gray-500">{entry.peopleIds.length} {entry.peopleIds.length === 1 ? 'person' : 'people'}</span>
							</div>
						{/if}
					</button>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Footer stats -->
	<div class="p-4 border-t border-gray-200 bg-gray-50">
		<div class="text-sm text-gray-600">
			{entries.length} {entries.length === 1 ? 'conversation' : 'conversations'}
		</div>
	</div>
</div>
