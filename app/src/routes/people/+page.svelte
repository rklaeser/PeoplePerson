<script lang="ts">
	import { onMount } from 'svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import PersonCard from '$lib/components/PersonCard.svelte';
	import PersonPanel from '$lib/components/PersonPanel.svelte';
	import GuideCard from '$lib/components/GuideCard.svelte';
	import GuidePanel from '$lib/components/GuidePanel.svelte';
	import TagManager from '$lib/components/TagManager.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import { getGuide } from '$lib/guides';
	import type { Person, Tag, GuideType } from '$lib/types';

	let people = $state<Person[]>([]);
	let loading = $state(true);
	let error = $state('');
	let searchQuery = $state('');
	let selectedPersonId = $state<string | null>(null);
	let selectedGuide = $state(false);
	let userGuideType = $state<GuideType | null>(null);
	let showTagManager = $state(false);
	let allTags = $state<Tag[]>([]);
	let selectedTagIds = $state<string[]>([]);

	async function fetchPeople() {
		loading = true;
		error = '';

		try {
			// Get Firebase ID token
			const token = await authStore.getIdToken();

			if (!token) {
				throw new Error('Not authenticated');
			}

			// Build query params
			const params = new URLSearchParams();
			if (searchQuery) params.append('search', searchQuery);
			params.append('sortBy', 'lastContactDate');
			params.append('sortOrder', 'desc');

			// Fetch from API
			const response = await fetch(`/api/people?${params}`, {
				headers: {
					Authorization: `Bearer ${token}`
				}
			});

			if (!response.ok) {
				throw new Error(`Failed to fetch: ${response.statusText}`);
			}

			let fetchedPeople = await response.json();

			// Client-side tag filtering
			if (selectedTagIds.length > 0) {
				fetchedPeople = fetchedPeople.filter((person: Person) =>
					selectedTagIds.every((tagId) => person.tagIds?.includes(tagId))
				);
			}

			people = fetchedPeople;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load people';
			console.error('Error fetching people:', e);
		} finally {
			loading = false;
		}
	}

	async function fetchTags() {
		try {
			const token = await authStore.getIdToken();
			if (!token) return;

			const response = await fetch('/api/tags', {
				headers: { Authorization: `Bearer ${token}` }
			});

			if (!response.ok) return;

			allTags = await response.json();
		} catch (e) {
			console.error('Error fetching tags:', e);
		}
	}

	async function fetchUserData() {
		try {
			const token = await authStore.getIdToken();
			if (!token) return;

			const response = await fetch('/api/user', {
				headers: { Authorization: `Bearer ${token}` }
			});

			if (!response.ok) return;

			const user = await response.json();
			userGuideType = user.selectedGuide;
		} catch (e) {
			console.error('Error fetching user data:', e);
		}
	}

	function toggleTagFilter(tagId: string) {
		if (selectedTagIds.includes(tagId)) {
			selectedTagIds = selectedTagIds.filter((id) => id !== tagId);
		} else {
			selectedTagIds = [...selectedTagIds, tagId];
		}
		fetchPeople();
	}

	function clearTagFilters() {
		selectedTagIds = [];
		fetchPeople();
	}

	function getTagById(tagId: string): Tag | undefined {
		return allTags.find((t) => t.id === tagId);
	}

	// Fetch on mount
	onMount(() => {
		fetchUserData();
		fetchPeople();
		fetchTags();
	});

	// Debounced search
	let searchTimeout: ReturnType<typeof setTimeout>;
	function handleSearch(event: Event) {
		const target = event.target as HTMLInputElement;
		searchQuery = target.value;

		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => {
			fetchPeople();
		}, 300);
	}

	function handlePersonClick(personId: string) {
		selectedPersonId = personId;
		selectedGuide = false;
	}

	function handleGuideClick() {
		selectedGuide = true;
		selectedPersonId = null;
	}

	function handleGuideChanged() {
		// Refresh user data to get new guide
		fetchUserData();
		// Keep guide panel open to show the new guide
		selectedGuide = true;
	}

	function handlePersonDeleted() {
		// Remove from list and deselect
		people = people.filter((p) => p.id !== selectedPersonId);
		selectedPersonId = null;
	}

	async function handleAddPerson() {
		try {
			const token = await authStore.getIdToken();
			if (!token) throw new Error('Not authenticated');

			const response = await fetch('/api/people/create', {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json'
				}
			});

			if (!response.ok) throw new Error('Failed to create person');

			const newPerson = await response.json();

			// Add to people list
			people = [newPerson, ...people];

			// Select the new person
			selectedPersonId = newPerson.id;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to create person';
			console.error('Error creating person:', e);
		}
	}
</script>

<Sidebar />

<div class="ml-16 flex h-screen bg-gray-50">
	<!-- Left sidebar - People list -->
	<div class="w-96 bg-white border-r border-gray-200 flex flex-col">
		<!-- Header -->
		<div class="p-4 border-b border-gray-200">
			<div class="flex items-center justify-between mb-4">
				<h1 class="text-2xl font-bold">People</h1>
				<button
					onclick={handleAddPerson}
					class="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
				>
					Add Person
				</button>
			</div>

			<!-- Search -->
			<div class="relative">
				<input
					type="text"
					placeholder="Search people..."
					value={searchQuery}
					oninput={handleSearch}
					class="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
				<svg
					class="absolute right-3 top-2.5 w-5 h-5 text-gray-400"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
					/>
				</svg>
			</div>

			<!-- Tag filters -->
			{#if allTags.length > 0}
				<div class="mt-3">
					<div class="flex items-center justify-between mb-2">
						<span class="text-xs font-medium text-gray-600">Filter by tags:</span>
						<button
							onclick={() => (showTagManager = true)}
							class="text-xs text-blue-600 hover:text-blue-700"
						>
							Manage
						</button>
					</div>
					<div class="flex flex-wrap gap-1.5">
						{#each allTags as tag (tag.id)}
							{@const isSelected = selectedTagIds.includes(tag.id)}
							<button
								onclick={() => toggleTagFilter(tag.id)}
								class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all {isSelected
									? 'ring-2 ring-offset-1'
									: 'opacity-60 hover:opacity-100'}"
								style="background-color: {tag.color || '#3B82F6'}; color: white; {isSelected
									? `ring-color: ${tag.color || '#3B82F6'}`
									: ''}"
							>
								<div class="w-1.5 h-1.5 rounded-full {isSelected ? 'bg-white' : 'bg-transparent'}"></div>
								{tag.name}
							</button>
						{/each}
					</div>
					{#if selectedTagIds.length > 0}
						<button
							onclick={clearTagFilters}
							class="text-xs text-gray-500 hover:text-gray-700 mt-2"
						>
							Clear filters
						</button>
					{/if}
				</div>
			{/if}
		</div>

		<!-- People list -->
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
			{:else}
				<div>
					<!-- Guide Card (always at top if user has one) -->
					{#if userGuideType}
						<GuideCard guide={getGuide(userGuideType)} selected={selectedGuide} onclick={handleGuideClick} />
						<div class="border-b-2 border-gray-300"></div>
					{/if}

					<!-- Regular People Cards -->
					{#if people.length === 0}
						<div class="flex items-center justify-center h-64">
							<div class="text-center text-gray-500">
								<p class="mb-2">No people found</p>
								{#if searchQuery}
									<p class="text-sm">Try a different search</p>
								{:else if userGuideType}
									<p class="text-sm">
										Your guide {getGuide(userGuideType).name} is here to help! Start by adding your first
										friend.
									</p>
								{/if}
							</div>
						</div>
					{:else}
						<div class="divide-y divide-gray-100">
							{#each people as person (person.id)}
								<PersonCard {person} {allTags} selected={selectedPersonId === person.id} onclick={() => handlePersonClick(person.id)} />
							{/each}
						</div>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Footer stats -->
		<div class="p-4 border-t border-gray-200 bg-gray-50">
			<div class="text-sm text-gray-600">
				{people.length} {people.length === 1 ? 'person' : 'people'}
			</div>
		</div>
	</div>

	<!-- Right panel - Person detail or Guide panel -->
	<div class="flex-1 bg-gray-50">
		{#if selectedGuide && userGuideType}
			<GuidePanel
				guide={getGuide(userGuideType)}
				onClose={() => (selectedGuide = false)}
				onGuideChanged={handleGuideChanged}
			/>
		{:else if selectedPersonId}
			<PersonPanel personId={selectedPersonId} onPersonDeleted={handlePersonDeleted} />
		{:else}
			<div class="flex items-center justify-center h-full">
				<div class="text-center text-gray-500">
					<svg
						class="mx-auto h-12 w-12 text-gray-400 mb-4"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
						/>
					</svg>
					<p class="text-lg">Select a person to view details</p>
				</div>
			</div>
		{/if}
	</div>
</div>

<!-- Tag Manager Modal -->
<TagManager
	show={showTagManager}
	onClose={() => (showTagManager = false)}
	onTagsChanged={() => {
		fetchTags();
		fetchPeople();
	}}
/>
