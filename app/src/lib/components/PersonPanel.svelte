<script lang="ts">
	import { authStore } from '$lib/stores/auth.svelte';
	import type { Person, NotebookEntry, Message, Tag } from '$lib/types';
	import { formatDistance, format } from 'date-fns';
	import TagManager from './TagManager.svelte';
	import AddMemoryModal from './AddMemoryModal.svelte';

	interface Props {
		personId: string;
		onPersonDeleted?: () => void;
	}

	let { personId, onPersonDeleted }: Props = $props();

	let loading = $state(true);
	let error = $state('');
	let person = $state<Person | null>(null);
	let memories = $state<NotebookEntry[]>([]);
	let messages = $state<Message[]>([]);
	let activeTab = $state<'profile' | 'memories' | 'messages'>('profile');
	let saving = $state(false);
	let showTagManager = $state(false);
	let showAddMemoryModal = $state(false);
	let allTags = $state<Tag[]>([]);
	let tagSearchQuery = $state('');
	let showTagDropdown = $state(false);

	async function fetchPersonDetails() {
		loading = true;
		error = '';

		try {
			const token = await authStore.getIdToken();
			if (!token) throw new Error('Not authenticated');

			const response = await fetch(`/api/people/${personId}`, {
				headers: { Authorization: `Bearer ${token}` }
			});

			if (!response.ok) throw new Error('Failed to fetch person details');

			const data = await response.json();
			person = data.person;
			memories = data.memories || [];
			messages = data.messages || [];
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load person';
			console.error('Error:', e);
		} finally {
			loading = false;
		}
	}

	// Fetch when personId changes
	$effect(() => {
		if (personId) {
			fetchPersonDetails();
		}
	});

	function formatDate(date: any): string {
		if (!date) return 'Never';
		try {
			const jsDate = date.toDate ? date.toDate() : new Date(date);
			return format(jsDate, 'MMM d, yyyy');
		} catch {
			return 'Unknown';
		}
	}

	function formatRelativeDate(date: any): string {
		if (!date) return 'Never';
		try {
			const jsDate = date.toDate ? date.toDate() : new Date(date);
			return formatDistance(jsDate, new Date(), { addSuffix: true });
		} catch {
			return 'Unknown';
		}
	}

	function getInitials(name: string): string {
		return name
			.split(' ')
			.map((n) => n[0])
			.join('')
			.toUpperCase()
			.slice(0, 2);
	}

	async function updateField(field: string, value: any) {
		if (!person) return;

		saving = true;
		try {
			const token = await authStore.getIdToken();
			if (!token) throw new Error('Not authenticated');

			const response = await fetch(`/api/people/${personId}/update`, {
				method: 'PATCH',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ [field]: value })
			});

			if (!response.ok) throw new Error('Failed to update');

			// Update local state
			person = { ...person, [field]: value };
		} catch (e) {
			console.error('Error updating:', e);
			// Optionally show error toast
		} finally {
			saving = false;
		}
	}

	function handleFieldBlur(field: string, event: Event) {
		const target = event.target as HTMLInputElement | HTMLTextAreaElement;
		const value = target.value;

		if (person && person[field as keyof Person] !== value) {
			updateField(field, value);
		}
	}

	async function fetchAllTags() {
		try {
			const token = await authStore.getIdToken();
			if (!token) throw new Error('Not authenticated');

			const response = await fetch('/api/tags', {
				headers: { Authorization: `Bearer ${token}` }
			});

			if (!response.ok) throw new Error('Failed to fetch tags');

			allTags = await response.json();
		} catch (e) {
			console.error('Error fetching tags:', e);
		}
	}

	async function addTag(tagId: string) {
		if (!person) return;

		try {
			const token = await authStore.getIdToken();
			if (!token) throw new Error('Not authenticated');

			const response = await fetch(`/api/people/${personId}/tags`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ tagId })
			});

			if (!response.ok) throw new Error('Failed to add tag');

			// Update local state
			person = { ...person, tagIds: [...(person.tagIds || []), tagId] };
			tagSearchQuery = '';
			showTagDropdown = false;
		} catch (e) {
			console.error('Error adding tag:', e);
		}
	}

	async function removeTag(tagId: string) {
		if (!person) return;

		try {
			const token = await authStore.getIdToken();
			if (!token) throw new Error('Not authenticated');

			const response = await fetch(`/api/people/${personId}/tags`, {
				method: 'DELETE',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ tagId })
			});

			if (!response.ok) throw new Error('Failed to remove tag');

			// Update local state
			person = { ...person, tagIds: (person.tagIds || []).filter((id) => id !== tagId) };
		} catch (e) {
			console.error('Error removing tag:', e);
		}
	}

	function getTagById(tagId: string): Tag | undefined {
		return allTags.find((t) => t.id === tagId);
	}

	let editingMemoryId = $state<string | null>(null);
	let editingMemoryContent = $state('');

	async function updateMemory(memoryId: string, content: string) {
		saving = true;
		try {
			const token = await authStore.getIdToken();
			if (!token) throw new Error('Not authenticated');

			const response = await fetch(`/api/people/${personId}/memories/${memoryId}`, {
				method: 'PATCH',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ content })
			});

			if (!response.ok) throw new Error('Failed to update memory');

			// Update local state
			memories = memories.map((m) => (m.id === memoryId ? { ...m, content } : m));
			editingMemoryId = null;
			editingMemoryContent = '';
		} catch (e) {
			console.error('Error updating memory:', e);
		} finally {
			saving = false;
		}
	}

	async function deleteMemory(memoryId: string) {
		if (!confirm('Are you sure you want to delete this memory?')) return;

		saving = true;
		try {
			const token = await authStore.getIdToken();
			if (!token) throw new Error('Not authenticated');

			const response = await fetch(`/api/people/${personId}/memories/${memoryId}`, {
				method: 'DELETE',
				headers: { Authorization: `Bearer ${token}` }
			});

			if (!response.ok) throw new Error('Failed to delete memory');

			// Update local state
			memories = memories.filter((m) => m.id !== memoryId);
		} catch (e) {
			console.error('Error deleting memory:', e);
		} finally {
			saving = false;
		}
	}

	function startEditingMemory(memory: NotebookEntry) {
		editingMemoryId = memory.id;
		editingMemoryContent = memory.content;
	}

	function cancelEditingMemory() {
		editingMemoryId = null;
		editingMemoryContent = '';
	}

	async function handleDeletePerson() {
		if (!person) return;

		if (
			!confirm(
				`Are you sure you want to delete ${person.name}? This will permanently delete all memories, messages, and associated data. This action cannot be undone.`
			)
		) {
			return;
		}

		saving = true;
		try {
			const token = await authStore.getIdToken();
			if (!token) throw new Error('Not authenticated');

			const response = await fetch(`/api/people/${personId}/delete`, {
				method: 'DELETE',
				headers: { Authorization: `Bearer ${token}` }
			});

			if (!response.ok) throw new Error('Failed to delete person');

			if (onPersonDeleted) onPersonDeleted();
		} catch (e) {
			console.error('Error deleting person:', e);
			alert('Failed to delete person. Please try again.');
		} finally {
			saving = false;
		}
	}

	$effect(() => {
		fetchAllTags();
	});
</script>

<div class="flex flex-col h-full bg-white">
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
	{:else if person}
		<!-- Header with avatar and name -->
		<div class="p-6 border-b border-gray-200">
			<div class="flex items-start space-x-4">
				<div class="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-xl font-semibold flex-shrink-0">
					{getInitials(person.name)}
				</div>
				<div class="flex-1 min-w-0">
					<!-- Editable name -->
					<input
						type="text"
						value={person.name}
						onblur={(e) => handleFieldBlur('name', e)}
						class="text-2xl font-bold text-gray-900 w-full bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 -mx-2"
					/>
					<div class="mt-2 space-y-1">
						{#if person.email}
							<p class="text-sm text-gray-600">{person.email}</p>
						{/if}
						{#if person.phoneNumber}
							<p class="text-sm text-gray-600">{person.phoneNumber}</p>
						{/if}
						{#if person.city && person.state}
							<p class="text-sm text-gray-600">{person.city}, {person.state}</p>
						{/if}
					</div>
					{#if saving}
						<p class="text-xs text-gray-500 mt-2">Saving...</p>
					{/if}
				</div>
				<button
					onclick={handleDeletePerson}
					class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
					title="Delete person"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
						/>
					</svg>
				</button>
			</div>
		</div>

		<!-- Tabs -->
		<div class="border-b border-gray-200">
			<nav class="flex -mb-px">
				<button
					onclick={() => (activeTab = 'profile')}
					class="px-6 py-3 text-sm font-medium border-b-2 transition-colors {activeTab === 'profile'
						? 'border-blue-500 text-blue-600'
						: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
				>
					Profile
				</button>
				<button
					onclick={() => (activeTab = 'memories')}
					class="px-6 py-3 text-sm font-medium border-b-2 transition-colors {activeTab === 'memories'
						? 'border-blue-500 text-blue-600'
						: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
				>
					Memories ({memories.length})
				</button>
				<button
					onclick={() => (activeTab = 'messages')}
					class="px-6 py-3 text-sm font-medium border-b-2 transition-colors {activeTab === 'messages'
						? 'border-blue-500 text-blue-600'
						: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
				>
					Messages ({messages.length})
				</button>
			</nav>
		</div>

		<!-- Tab content -->
		<div class="flex-1 overflow-y-auto">
			{#if activeTab === 'profile'}
				<div class="p-6 space-y-6">
					<!-- Tags -->
					<div class="border border-gray-200 rounded-lg p-4">
						<div class="flex items-center justify-between mb-3">
							<h3 class="text-sm font-semibold text-gray-700">Tags</h3>
							<button
								onclick={() => (showTagManager = true)}
								class="text-xs text-blue-600 hover:text-blue-700 font-medium"
							>
								Manage Tags
							</button>
						</div>

						<!-- Tag input with autocomplete -->
						<div class="mb-3 relative">
							<input
								type="text"
								bind:value={tagSearchQuery}
								onfocus={() => (showTagDropdown = true)}
								onblur={() => setTimeout(() => (showTagDropdown = false), 200)}
								placeholder="Add tags..."
								class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>

							{#if showTagDropdown && tagSearchQuery.length > 0}
								{@const filteredTags = allTags.filter(
									(t) =>
										!person.tagIds?.includes(t.id) &&
										t.name.toLowerCase().includes(tagSearchQuery.toLowerCase())
								)}
								{#if filteredTags.length > 0}
									<div class="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
										{#each filteredTags as tag}
											<button
												onclick={() => addTag(tag.id)}
												class="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2"
											>
												<div
													class="w-3 h-3 rounded-full"
													style="background-color: {tag.color || '#3B82F6'};"
												></div>
												<span class="text-sm">{tag.name}</span>
											</button>
										{/each}
									</div>
								{/if}
							{/if}
						</div>

						<!-- Current tags -->
						<div class="flex flex-wrap gap-2">
							{#if person.tagIds && person.tagIds.length > 0}
								{#each person.tagIds as tagId}
									{@const tag = getTagById(tagId)}
									{#if tag}
										<span
											class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs text-white"
											style="background-color: {tag.color || '#3B82F6'};"
										>
											{tag.name}
											<button
												onclick={() => removeTag(tagId)}
												class="hover:bg-white hover:bg-opacity-20 rounded-full p-0.5 transition-colors"
												aria-label="Remove tag"
											>
												<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
												</svg>
											</button>
										</span>
									{/if}
								{/each}
							{:else}
								<p class="text-sm text-gray-500">No tags assigned</p>
							{/if}
						</div>
					</div>

					<!-- Description -->
					<div>
						<h3 class="text-sm font-semibold text-gray-700 mb-2">Description</h3>
						<textarea
							value={person.body || ''}
							onblur={(e) => handleFieldBlur('body', e)}
							placeholder="Add a description..."
							rows="4"
							class="w-full text-gray-900 bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
						></textarea>
					</div>

					<!-- Contact Information -->
					<div class="border border-gray-200 rounded-lg p-4">
						<h3 class="text-sm font-semibold text-gray-700 mb-4">Contact Information</h3>
						<div class="space-y-3">
							<!-- Phone -->
							<div class="flex items-center gap-3">
								<svg class="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
								</svg>
								<input
									type="tel"
									value={person.phoneNumber || ''}
									onblur={(e) => handleFieldBlur('phoneNumber', e)}
									placeholder="Phone number"
									class="flex-1 text-sm text-gray-900 bg-white border border-gray-300 rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
								/>
							</div>

							<!-- Street Address -->
							<div class="flex items-center gap-3">
								<svg class="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
								</svg>
								<input
									type="text"
									value={person.streetAddress || ''}
									onblur={(e) => handleFieldBlur('streetAddress', e)}
									placeholder="Street address"
									class="flex-1 text-sm text-gray-900 bg-white border border-gray-300 rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
								/>
							</div>

							<!-- City, State, ZIP -->
							<div class="flex items-center gap-2 ml-7">
								<input
									type="text"
									value={person.city || ''}
									onblur={(e) => handleFieldBlur('city', e)}
									placeholder="City"
									class="flex-1 text-sm text-gray-900 bg-white border border-gray-300 rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
								/>
								<input
									type="text"
									value={person.state || ''}
									onblur={(e) => handleFieldBlur('state', e)}
									placeholder="State"
									class="w-20 text-sm text-gray-900 bg-white border border-gray-300 rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
								/>
								<input
									type="text"
									value={person.zip || ''}
									onblur={(e) => handleFieldBlur('zip', e)}
									placeholder="ZIP"
									class="w-24 text-sm text-gray-900 bg-white border border-gray-300 rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
								/>
							</div>

							<!-- Birthday -->
							<div class="flex items-center gap-3">
								<svg class="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
								</svg>
								<input
									type="text"
									value={person.birthday || ''}
									onblur={(e) => handleFieldBlur('birthday', e)}
									placeholder="Birthday (e.g., Jan 15, 1990)"
									class="flex-1 text-sm text-gray-900 bg-white border border-gray-300 rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
								/>
							</div>

							<!-- Email -->
							<div class="flex items-center gap-3">
								<svg class="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
								</svg>
								<input
									type="email"
									value={person.email || ''}
									onblur={(e) => handleFieldBlur('email', e)}
									placeholder="Email"
									class="flex-1 text-sm text-gray-900 bg-white border border-gray-300 rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
								/>
							</div>
						</div>
					</div>

					<!-- Memory Aid / Mnemonic -->
					<div class="border border-gray-200 rounded-lg p-4">
						<h3 class="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
							</svg>
							Memory Aid
						</h3>
						<textarea
							value={person.mnemonic || ''}
							onblur={(e) => handleFieldBlur('mnemonic', e)}
							placeholder="A memorable fact or story to help remember this person..."
							rows="2"
							class="w-full text-sm text-gray-900 bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none italic"
						></textarea>
					</div>

					<!-- Metadata -->
					<div class="border border-gray-200 rounded-lg p-4">
						<h3 class="text-sm font-semibold text-gray-700 mb-3">Metadata</h3>
						<div class="space-y-2 text-sm text-gray-600">
							<div>
								<span class="font-medium">Last Contact:</span> {formatRelativeDate(person.lastContactDate)}
							</div>
							<div>
								<span class="font-medium">Created:</span> {formatRelativeDate(person.createdAt)}
							</div>
							<div>
								<span class="font-medium">Updated:</span> {formatRelativeDate(person.updatedAt)}
							</div>
						</div>
					</div>
				</div>
			{:else if activeTab === 'memories'}
				<div class="divide-y divide-gray-100">
					{#if memories.length === 0}
						<div class="p-6 text-center text-gray-500">
							<p class="mb-3">No memories yet</p>
							<button
								onclick={() => (showAddMemoryModal = true)}
								class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
							>
								Add First Memory
							</button>
						</div>
					{:else}
						<!-- Add Memory button at top -->
						<div class="p-4 bg-gray-50">
							<button
								onclick={() => (showAddMemoryModal = true)}
								class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
							>
								+ Add Memory
							</button>
						</div>

						{#each memories as memory (memory.id)}
							<div class="p-6 hover:bg-gray-50 group">
								<div class="flex items-start justify-between mb-2">
									<h3 class="text-sm font-semibold text-gray-900">
										{formatDate(memory.entryDate)}
									</h3>
									<div class="flex items-center gap-2">
										<span class="text-xs text-gray-500">
											{formatRelativeDate(memory.createdAt)}
										</span>
										{#if editingMemoryId !== memory.id}
											<button
												onclick={() => startEditingMemory(memory)}
												class="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-blue-600 transition-all"
												title="Edit memory"
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
												onclick={() => deleteMemory(memory.id)}
												class="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 transition-all"
												title="Delete memory"
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
								</div>

								{#if editingMemoryId === memory.id}
									<!-- Edit mode -->
									<textarea
										bind:value={editingMemoryContent}
										rows="4"
										class="w-full mb-3 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
									></textarea>
									<div class="flex gap-2">
										<button
											onclick={() => updateMemory(memory.id, editingMemoryContent)}
											class="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
										>
											Save
										</button>
										<button
											onclick={cancelEditingMemory}
											class="px-3 py-1.5 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
										>
											Cancel
										</button>
									</div>
								{:else}
									<!-- View mode -->
									<p class="text-gray-700 whitespace-pre-wrap">{memory.content}</p>
								{/if}
							</div>
						{/each}
					{/if}
				</div>
			{:else if activeTab === 'messages'}
				<div class="divide-y divide-gray-100">
					{#if messages.length === 0}
						<div class="p-6 text-center text-gray-500">
							<p>No messages yet</p>
						</div>
					{:else}
						{#each messages as message (message.id)}
							<div
								class="p-6 {message.direction === 'outbound'
									? 'bg-blue-50'
									: 'bg-white'}"
							>
								<div class="flex items-start justify-between mb-2">
									<span
										class="text-xs font-semibold {message.direction ===
										'outbound'
											? 'text-blue-600'
											: 'text-gray-600'}"
									>
										{message.direction === 'outbound' ? 'You' : person.name}
									</span>
									<span class="text-xs text-gray-500">
										{formatRelativeDate(message.sentAt)}
									</span>
								</div>
								<p class="text-gray-900">{message.body}</p>
							</div>
						{/each}
					{/if}
				</div>
			{/if}
		</div>
	{/if}
</div>

<!-- Tag Manager Modal -->
<TagManager
	show={showTagManager}
	onClose={() => (showTagManager = false)}
	onTagsChanged={() => fetchAllTags()}
/>

<!-- Add Memory Modal -->
{#if person}
	<AddMemoryModal
		show={showAddMemoryModal}
		personId={personId}
		personName={person.name}
		onClose={() => (showAddMemoryModal = false)}
		onMemoryAdded={() => fetchPersonDetails()}
	/>
{/if}
