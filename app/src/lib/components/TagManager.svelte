<script lang="ts">
	import { authStore } from '$lib/stores/auth.svelte';
	import type { Tag } from '$lib/types';

	interface Props {
		show: boolean;
		onClose: () => void;
		onTagsChanged?: () => void;
	}

	let { show = false, onClose, onTagsChanged }: Props = $props();

	let tags = $state<Tag[]>([]);
	let loading = $state(true);
	let saving = $state(false);
	let editingTag = $state<Tag | null>(null);
	let newTagName = $state('');
	let newTagColor = $state('#3B82F6');
	let newTagCategory = $state('general');

	const colorOptions = [
		{ name: 'Blue', value: '#3B82F6' },
		{ name: 'Red', value: '#EF4444' },
		{ name: 'Green', value: '#10B981' },
		{ name: 'Yellow', value: '#F59E0B' },
		{ name: 'Purple', value: '#8B5CF6' },
		{ name: 'Pink', value: '#EC4899' },
		{ name: 'Indigo', value: '#6366F1' },
		{ name: 'Gray', value: '#6B7280' }
	];

	async function fetchTags() {
		loading = true;
		try {
			const token = await authStore.getIdToken();
			if (!token) throw new Error('Not authenticated');

			const response = await fetch('/api/tags', {
				headers: { Authorization: `Bearer ${token}` }
			});

			if (!response.ok) throw new Error('Failed to fetch tags');

			tags = await response.json();
		} catch (e) {
			console.error('Error fetching tags:', e);
		} finally {
			loading = false;
		}
	}

	async function createTag() {
		if (!newTagName.trim()) return;

		saving = true;
		try {
			const token = await authStore.getIdToken();
			if (!token) throw new Error('Not authenticated');

			const response = await fetch('/api/tags/create', {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					name: newTagName.trim(),
					color: newTagColor,
					category: newTagCategory
				})
			});

			if (!response.ok) throw new Error('Failed to create tag');

			newTagName = '';
			newTagColor = '#3B82F6';
			newTagCategory = 'general';

			await fetchTags();
			if (onTagsChanged) onTagsChanged();
		} catch (e) {
			console.error('Error creating tag:', e);
		} finally {
			saving = false;
		}
	}

	async function updateTag(tag: Tag) {
		saving = true;
		try {
			const token = await authStore.getIdToken();
			if (!token) throw new Error('Not authenticated');

			const response = await fetch(`/api/tags/${tag.id}`, {
				method: 'PATCH',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					name: tag.name,
					color: tag.color,
					category: tag.category
				})
			});

			if (!response.ok) throw new Error('Failed to update tag');

			editingTag = null;
			await fetchTags();
			if (onTagsChanged) onTagsChanged();
		} catch (e) {
			console.error('Error updating tag:', e);
		} finally {
			saving = false;
		}
	}

	async function deleteTag(tagId: string) {
		if (!confirm('Are you sure you want to delete this tag? It will be removed from all people.'))
			return;

		saving = true;
		try {
			const token = await authStore.getIdToken();
			if (!token) throw new Error('Not authenticated');

			const response = await fetch(`/api/tags/${tagId}`, {
				method: 'DELETE',
				headers: { Authorization: `Bearer ${token}` }
			});

			if (!response.ok) throw new Error('Failed to delete tag');

			await fetchTags();
			if (onTagsChanged) onTagsChanged();
		} catch (e) {
			console.error('Error deleting tag:', e);
		} finally {
			saving = false;
		}
	}

	$effect(() => {
		if (show) {
			fetchTags();
		}
	});
</script>

{#if show}
	<div
		class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
		onclick={onClose}
	>
		<div
			class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
			onclick={(e) => e.stopPropagation()}
		>
			<!-- Header -->
			<div class="px-6 py-4 border-b border-gray-200">
				<div class="flex items-center justify-between">
					<h2 class="text-xl font-semibold text-gray-900">Manage Tags</h2>
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
			<div class="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
				<!-- Create new tag form -->
				<div class="mb-6 p-4 bg-gray-50 rounded-lg">
					<h3 class="text-sm font-semibold text-gray-700 mb-3">Create New Tag</h3>
					<div class="flex gap-2">
						<input
							type="text"
							bind:value={newTagName}
							placeholder="Tag name"
							class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
							onkeydown={(e) => e.key === 'Enter' && createTag()}
						/>
						<select
							bind:value={newTagColor}
							class="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
							style="background-color: {newTagColor}; color: white;"
						>
							{#each colorOptions as color}
								<option value={color.value} style="background-color: {color.value};">
									{color.name}
								</option>
							{/each}
						</select>
						<button
							onclick={createTag}
							disabled={saving || !newTagName.trim()}
							class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
							Create
						</button>
					</div>
				</div>

				<!-- Tags list -->
				<div class="space-y-2">
					{#if loading}
						<div class="text-center text-gray-500 py-4">Loading tags...</div>
					{:else if tags.length === 0}
						<div class="text-center text-gray-500 py-4">No tags yet. Create one above!</div>
					{:else}
						{#each tags as tag (tag.id)}
							<div
								class="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
							>
								{#if editingTag?.id === tag.id}
									<!-- Edit mode -->
									<input
										type="text"
										bind:value={editingTag.name}
										class="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
									/>
									<select
										bind:value={editingTag.color}
										class="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
										style="background-color: {editingTag.color}; color: white;"
									>
										{#each colorOptions as color}
											<option value={color.value} style="background-color: {color.value};">
												{color.name}
											</option>
										{/each}
									</select>
									<button
										onclick={() => updateTag(editingTag!)}
										class="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
									>
										Save
									</button>
									<button
										onclick={() => (editingTag = null)}
										class="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
									>
										Cancel
									</button>
								{:else}
									<!-- View mode -->
									<div
										class="w-4 h-4 rounded-full flex-shrink-0"
										style="background-color: {tag.color || '#3B82F6'};"
									></div>
									<span class="flex-1 text-gray-900">{tag.name}</span>
									<span class="text-xs text-gray-500">{tag.personCount || 0} people</span>
									<button
										onclick={() => (editingTag = { ...tag })}
										class="p-1 text-gray-400 hover:text-blue-600 transition-colors"
										title="Edit tag"
									>
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
											/>
										</svg>
									</button>
									<button
										onclick={() => deleteTag(tag.id)}
										class="p-1 text-gray-400 hover:text-red-600 transition-colors"
										title="Delete tag"
									>
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
											/>
										</svg>
									</button>
								{/if}
							</div>
						{/each}
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}
