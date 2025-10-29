<script lang="ts">
	import { authStore } from '$lib/stores/auth.svelte';
	import { format } from 'date-fns';

	interface Props {
		show: boolean;
		personId: string;
		personName: string;
		onClose: () => void;
		onMemoryAdded?: () => void;
	}

	let { show = false, personId, personName, onClose, onMemoryAdded }: Props = $props();

	let entryDate = $state(format(new Date(), 'yyyy-MM-dd'));
	let content = $state('');
	let saving = $state(false);
	let error = $state('');

	async function saveMemory() {
		if (!content.trim()) {
			error = 'Memory content is required';
			return;
		}

		saving = true;
		error = '';

		try {
			const token = await authStore.getIdToken();
			if (!token) throw new Error('Not authenticated');

			const response = await fetch(`/api/people/${personId}/memories/create`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					entryDate,
					content: content.trim()
				})
			});

			if (!response.ok) throw new Error('Failed to create memory');

			// Reset form
			content = '';
			entryDate = format(new Date(), 'yyyy-MM-dd');

			if (onMemoryAdded) onMemoryAdded();
			onClose();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to save memory';
			console.error('Error saving memory:', e);
		} finally {
			saving = false;
		}
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
		} else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
			saveMemory();
		}
	}
</script>

{#if show}
	<div
		class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
		onclick={onClose}
		onkeydown={handleKeyDown}
	>
		<div
			class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
			onclick={(e) => e.stopPropagation()}
		>
			<!-- Header -->
			<div class="px-6 py-4 border-b border-gray-200">
				<div class="flex items-center justify-between">
					<h2 class="text-xl font-semibold text-gray-900">
						Add Memory for {personName}
					</h2>
					<button
						onclick={onClose}
						class="text-gray-400 hover:text-gray-600 transition-colors"
					>
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>
			</div>

			<!-- Body -->
			<div class="p-6">
				{#if error}
					<div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
						{error}
					</div>
				{/if}

				<div class="space-y-4">
					<!-- Date -->
					<div>
						<label for="entryDate" class="block text-sm font-medium text-gray-700 mb-1">
							Date
						</label>
						<input
							id="entryDate"
							type="date"
							bind:value={entryDate}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>

					<!-- Content -->
					<div>
						<label for="content" class="block text-sm font-medium text-gray-700 mb-1">
							Memory
						</label>
						<textarea
							id="content"
							bind:value={content}
							placeholder="What happened? What did you talk about?"
							rows="8"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
						></textarea>
						<p class="mt-1 text-xs text-gray-500">
							Tip: Press Cmd/Ctrl + Enter to save quickly
						</p>
					</div>
				</div>
			</div>

			<!-- Footer -->
			<div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
				<button
					onclick={onClose}
					class="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
				>
					Cancel
				</button>
				<button
					onclick={saveMemory}
					disabled={saving || !content.trim()}
					class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
				>
					{saving ? 'Saving...' : 'Save Memory'}
				</button>
			</div>
		</div>
	</div>
{/if}
