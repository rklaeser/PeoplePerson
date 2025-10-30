<script lang="ts">
	import { authStore } from '$lib/stores/auth.svelte';
	import type { Guide } from '$lib/types';

	interface Props {
		guide: Guide;
		onMessageSent: (entryId: string) => void;
	}

	let { guide, onMessageSent }: Props = $props();

	let content = $state('');
	let saving = $state(false);
	let processing = $state(false);
	let error = $state('');

	// Conversation starter prompts based on guide personality
	const starterPrompts = {
		Nico: [
			"What's on your mind today?",
			"Tell me about your relationships.",
			"How are things going?",
			"What's been weighing on you?",
			"Any conversations you're thinking about?"
		],
		Scout: [
			"Hey! How's your day going?",
			"What's new with you?",
			"Tell me what's happening!",
			"How are your friends doing?",
			"What's making you happy today?"
		]
	};

	// Pick a random prompt
	const prompts = starterPrompts[guide.type as keyof typeof starterPrompts] || starterPrompts.Nico;
	const selectedPrompt = prompts[Math.floor(Math.random() * prompts.length)];

	async function handleSubmit() {
		if (!content.trim()) {
			error = 'Please write something';
			return;
		}

		saving = true;
		processing = true;
		error = '';

		try {
			const token = await authStore.getIdToken();
			if (!token) throw new Error('Not authenticated');

			// Step 1: Process the entry with AI
			const processResponse = await fetch('/api/journal/process', {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ content: content.trim() })
			});

			if (!processResponse.ok) throw new Error('Failed to process entry');

			const { aiResponse, peopleIds, conversationWith } = await processResponse.json();
			processing = false;

			// Get today's date in YYYY-MM-DD format
			const today = new Date().toISOString().split('T')[0];

			// Step 2: Create the journal entry with AI results
			const createResponse = await fetch('/api/journal', {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					date: today,
					content: content.trim(),
					peopleIds,
					aiResponse,
					conversationWith,
					conversationStatus: conversationWith ? 'planned' : null
				})
			});

			if (!createResponse.ok) throw new Error('Failed to create entry');

			const newEntry = await createResponse.json();
			onMessageSent(newEntry.id);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to send message';
			console.error('Error creating entry:', e);
		} finally {
			saving = false;
			processing = false;
		}
	}

	function handleKeyDown(e: KeyboardEvent) {
		// Submit on Cmd/Ctrl + Enter
		if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
			e.preventDefault();
			handleSubmit();
		}
	}
</script>

<div class="h-full flex flex-col bg-gray-50">
	<div class="flex-1 flex items-center justify-center p-6">
		<div class="max-w-2xl w-full">
			<!-- Guide greeting -->
			<div class="mb-8 text-center">
				<img src={guide.imageUrl} alt={guide.name} class="w-20 h-20 rounded-full mx-auto mb-4 object-cover" />
				<h2 class="text-2xl font-semibold text-gray-900 mb-2">{selectedPrompt}</h2>
				<p class="text-gray-600">{guide.name} is here to listen</p>
			</div>

			{#if error}
				<div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
					{error}
				</div>
			{/if}

			<!-- Message input -->
			<div class="bg-white rounded-lg border border-gray-200 shadow-sm">
				<textarea
					bind:value={content}
					onkeydown={handleKeyDown}
					placeholder="Share what's on your mind..."
					class="w-full min-h-[200px] p-4 border-0 rounded-t-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 resize-none"
					disabled={saving}
				></textarea>
				<div class="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
					<p class="text-xs text-gray-500">
						Press Cmd/Ctrl + Enter to send
					</p>
					<button
						onclick={handleSubmit}
						disabled={saving || !content.trim()}
						class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{#if processing}
							Processing...
						{:else if saving}
							Sending...
						{:else}
							Send
						{/if}
					</button>
				</div>
			</div>
		</div>
	</div>
</div>
