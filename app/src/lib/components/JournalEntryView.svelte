<script lang="ts">
	import { onMount } from 'svelte';
	import { marked } from 'marked';
	import { authStore } from '$lib/stores/auth.svelte';
	import type { JournalEntry, Person } from '$lib/types';

	interface Props {
		entryId: string;
		onClose: () => void;
		onEntryUpdated?: () => void;
	}

	let { entryId, onClose, onEntryUpdated }: Props = $props();

	let entry = $state<JournalEntry | null>(null);
	let people = $state<Person[]>([]);
	let loading = $state(true);
	let error = $state('');
	let isEditing = $state(false);
	let editContent = $state('');
	let conversationPerson = $state<Person | null>(null);

	async function fetchEntry() {
		loading = true;
		error = '';

		try {
			const token = await authStore.getIdToken();
			if (!token) throw new Error('Not authenticated');

			const response = await fetch(`/api/journal/${entryId}`, {
				headers: { Authorization: `Bearer ${token}` }
			});

			if (!response.ok) throw new Error('Failed to fetch entry');

			entry = await response.json();
			editContent = entry?.content || '';

			// Fetch people mentioned in entry
			if (entry && entry.peopleIds.length > 0) {
				await fetchPeople();
			}

			// Fetch conversation person
			if (entry && entry.conversationWith) {
				await fetchConversationPerson(entry.conversationWith);
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load entry';
			console.error('Error fetching entry:', e);
		} finally {
			loading = false;
		}
	}

	async function fetchPeople() {
		try {
			const token = await authStore.getIdToken();
			if (!token) return;

			const response = await fetch('/api/people', {
				headers: { Authorization: `Bearer ${token}` }
			});

			if (response.ok) {
				const allPeople = await response.json();
				people = allPeople.filter((p: Person) => entry?.peopleIds.includes(p.id));
			}
		} catch (e) {
			console.error('Error fetching people:', e);
		}
	}

	async function fetchConversationPerson(personId: string) {
		try {
			const token = await authStore.getIdToken();
			if (!token) return;

			const response = await fetch('/api/people', {
				headers: { Authorization: `Bearer ${token}` }
			});

			if (response.ok) {
				const allPeople = await response.json();
				conversationPerson = allPeople.find((p: Person) => p.id === personId) || null;
			}
		} catch (e) {
			console.error('Error fetching conversation person:', e);
		}
	}

	async function handleSave() {
		if (!entry) return;

		try {
			const token = await authStore.getIdToken();
			if (!token) throw new Error('Not authenticated');

			const response = await fetch(`/api/journal/${entryId}`, {
				method: 'PATCH',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ content: editContent })
			});

			if (!response.ok) throw new Error('Failed to update entry');

			entry = await response.json();
			isEditing = false;
			onEntryUpdated?.();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to save';
			console.error('Error saving entry:', e);
		}
	}

	async function handleMarkDiscussed() {
		if (!entry) return;

		try {
			const token = await authStore.getIdToken();
			if (!token) throw new Error('Not authenticated');

			const response = await fetch(`/api/journal/${entryId}`, {
				method: 'PATCH',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ conversationStatus: 'completed' })
			});

			if (!response.ok) throw new Error('Failed to update status');

			entry = await response.json();
			onEntryUpdated?.();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to update status';
			console.error('Error updating status:', e);
		}
	}

	async function handleDelete() {
		if (!confirm('Are you sure you want to delete this journal entry?')) return;

		try {
			const token = await authStore.getIdToken();
			if (!token) throw new Error('Not authenticated');

			const response = await fetch(`/api/journal/${entryId}`, {
				method: 'DELETE',
				headers: { Authorization: `Bearer ${token}` }
			});

			if (!response.ok) throw new Error('Failed to delete entry');

			onClose();
			onEntryUpdated?.();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to delete';
			console.error('Error deleting entry:', e);
		}
	}

	function formatDate(dateStr: string): string {
		const date = new Date(dateStr);
		return date.toLocaleDateString(undefined, {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	function renderMarkdown(markdown: string): string {
		return marked(markdown || '');
	}

	onMount(() => {
		fetchEntry();
	});
</script>

<div class="h-screen flex flex-col bg-white">
	<!-- Header -->
	<div class="border-b border-gray-200 p-4 flex items-center justify-between">
		<div class="flex items-center gap-4">
			<button
				onclick={onClose}
				class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
			>
				<svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
			{#if entry && !isEditing}
				<h2 class="text-xl font-semibold text-gray-900">{formatDate(entry.date)}</h2>
			{/if}
		</div>
		<div class="flex items-center gap-2">
			{#if !isEditing}
				<button
					onclick={() => {
						isEditing = true;
					}}
					class="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
				>
					Edit
				</button>
				<button
					onclick={handleDelete}
					class="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
				>
					Delete
				</button>
			{:else}
				<button
					onclick={() => {
						isEditing = false;
						editContent = entry?.content || '';
					}}
					class="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
				>
					Cancel
				</button>
				<button
					onclick={handleSave}
					class="px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
				>
					Save
				</button>
			{/if}
		</div>
	</div>

	<!-- Content -->
	<div class="flex-1 overflow-y-auto p-6">
		{#if loading}
			<div class="flex items-center justify-center h-full">
				<div class="text-gray-500">Loading...</div>
			</div>
		{:else if error}
			<div class="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
				{error}
			</div>
		{:else if entry}
			<div class="max-w-3xl mx-auto space-y-6">
				<!-- Entry Content -->
				<div class="bg-white rounded-lg border border-gray-200 p-6">
					<h3 class="text-sm font-medium text-gray-500 mb-3">Your Entry</h3>
					{#if isEditing}
						<textarea
							bind:value={editContent}
							class="w-full min-h-[200px] p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="Write your thoughts..."
						></textarea>
					{:else}
						<div class="prose prose-sm max-w-none text-gray-900 whitespace-pre-wrap">
							{entry.content}
						</div>
					{/if}
				</div>

				<!-- People Badges -->
				{#if people.length > 0 && !isEditing}
					<div class="flex flex-wrap gap-2">
						<span class="text-sm text-gray-500">People:</span>
						{#each people as person (person.id)}
							<a
								href="/people?id={person.id}"
								class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm hover:bg-blue-100 transition-colors"
							>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
								</svg>
								{person.name}
							</a>
						{/each}
					</div>
				{/if}

				<!-- AI Response -->
				{#if entry.aiResponse && !isEditing}
					<div class="bg-gray-50 rounded-lg border border-gray-200 p-6">
						<div class="prose prose-sm max-w-none">
							{@html renderMarkdown(entry.aiResponse)}
						</div>
					</div>
				{/if}

				<!-- Conversation Status -->
				{#if entry.conversationWith && conversationPerson && !isEditing}
					<div class="bg-amber-50 rounded-lg border border-amber-200 p-4">
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-2">
								<svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
								</svg>
								<span class="text-sm font-medium text-amber-900">
									Conversation with {conversationPerson.name}
								</span>
							</div>
							{#if entry.conversationStatus === 'planned'}
								<button
									onclick={handleMarkDiscussed}
									class="px-3 py-1.5 text-sm text-amber-700 hover:bg-amber-100 rounded-lg transition-colors font-medium"
								>
									Mark as Discussed
								</button>
							{:else}
								<span class="text-sm text-amber-700 font-medium">Discussed ✓</span>
							{/if}
						</div>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>
