<script lang="ts">
	import '@fortawesome/fontawesome-free/css/all.css';
	import { goto } from '$app/navigation';
	import type { Friend } from '$lib/types'; // Import the Friend interface
	import type { ActionResult } from '@sveltejs/kit';
	import { applyAction, deserialize } from '$app/forms';
	import { onMount } from 'svelte';
	import { friends } from '$lib/stores/friends';

	interface Props {
		data: { people: Friend[] };
		expandSearch: boolean;
		groupId?: string; // Optional group ID for "Add to group" functionality
		onAddToGroup?: (personId: string) => Promise<void>; // Callback for adding to group
	}

	let { data, expandSearch = $bindable(), groupId, onAddToGroup }: Props = $props();

	function navigateToFriend(id: string) {
		query = '';
		goto(`/person/${id}`);
	}
	let results: Friend[] = $state([]);
	let query = $state('');
	let showDropdown = $state(false);

	// Reactive: search whenever query changes
	$effect(() => {
		search();
	});

	// Filter results based on query
	const search = () => {
		if (query.trim() === '') {
			results = [];
			showDropdown = false;
		} else {
			// Use friends store instead of data.people
			results = ($friends || []).filter((friend) =>
				friend.name.toLowerCase().includes(query.toLowerCase())
			);
			showDropdown = true;
		}
	};

	const handleEnter = (event: KeyboardEvent) => {
		if (event.key === 'Enter') {
			if (results.length === 1) {
				navigateToFriend(results[0].id);
			} else {
				search();
			}
		}
	};

	const closeDropdown = () => {
		setTimeout(() => {
			showDropdown = false;
			query = '';
		}, 200);
	};

	const handleSubmit = async (event: Event) => {
		console.log('submitting');
		event.preventDefault();
		const form = event.target as HTMLFormElement;
		const formData = new FormData(form);
		expandSearch = false;

		try {
			const response = await fetch(form.action, {
				method: form.method,
				body: formData
			});
			const result: ActionResult = deserialize(await response.text());
			if (result.type === 'success') {
				// rerun all `load` functions, following the successful update
				if (result.data) {
					navigateToFriend(result.data.id);
				}
			}
		} catch (error) {
			console.error('Error adding person:', error);
		}
	};
</script>

<div class="relative w-full">
	<div class="shadow-sm">
		<div class="relative">
			<i class="absolute left-3 top-3 z-10 fa-solid fa-magnifying-glass text-xl text-white"></i>
			<input
				type="text"
				placeholder="Search friends"
				bind:value={query}
				oninput={search}
				onkeydown={handleEnter}
				onblur={closeDropdown}
				autofocus
				class="w-full pl-10 pr-10 p-3 bg-sky-950 text-white placeholder-white outline-none"
			/>
			<button
				type="button"
				onclick={() => (expandSearch = false)}
				class="absolute right-3 top-3 z-10 text-white text-xl hover:text-gray-600"
				aria-label="Exit Search"
			>
				<i class="fa-solid fa-xmark text-lg"></i>
			</button>
		</div>
		{#if showDropdown && results.length > 0}
			<div class="w-full max-h-96 overflow-y-auto bg-sky-950 text-white">
				<ul>
					{#each results as person}
						<li class="w-full border-t border-slate-600">
							<div class="flex items-center justify-between py-2 px-10">
								<button
									class="flex-1 text-left cursor-pointer hover:text-gray-300"
									onclick={() => navigateToFriend(person.id)}
								>
									{person.name}
								</button>
								{#if groupId && onAddToGroup}
									<button
										class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors ml-3"
										onclick={() => onAddToGroup?.(person.id)}
									>
										Add to group
									</button>
								{/if}
							</div>
						</li>
					{/each}
				</ul>
			</div>
		{:else if showDropdown && results.length === 0}
			<div class="w-full max-h-96 overflow-y-auto border-t border-slate-600 text-white bg-sky-950">
				<div class="w-full flex justify-between items-center py-2 px-10">
					{query}
					<form method="POST" action="?/create" onsubmit={handleSubmit}>
						<input type="hidden" name="name" value={query} />
						{#if groupId}
							<input type="hidden" name="groupId" value={groupId} />
							<!-- Conditionally include the group ID -->
						{/if}
						<button type="submit" class="bg-blue-500 text-white px-4 py-2 rounded ml-auto"
							>Create</button
						>
					</form>
				</div>
			</div>
		{/if}
	</div>
</div>
