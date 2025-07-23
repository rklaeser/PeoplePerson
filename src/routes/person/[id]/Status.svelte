<script lang="ts">
	export let data;

	let isEditing = false;
	let isLoading = false;
	let tempIntent = data.friend.intent;

	function startEditing() {
		isEditing = true;
		tempIntent = data.friend.intent;
	}

	function cancelEdit() {
		isEditing = false;
		tempIntent = data.friend.intent;
	}

	async function saveIntent() {
		if (tempIntent === data.friend.intent) {
			isEditing = false;
			return;
		}

		isLoading = true;
		try {
			const formData = new FormData();
			formData.append('id', data.friend.id);
			formData.append('intent', tempIntent);

			const response = await fetch(`/person/${data.friend.id}?/updateStatus`, {
				method: 'POST',
				body: formData
			});

			if (response.ok) {
				// Optimistic update
				data.friend.intent = tempIntent;
				isEditing = false;
			} else {
				console.error('Failed to update intent');
				tempIntent = data.friend.intent; // Reset on error
			}
		} catch (error) {
			console.error('Error updating intent:', error);
			tempIntent = data.friend.intent; // Reset on error
		} finally {
			isLoading = false;
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			cancelEdit();
		} else if (event.key === 'Enter') {
			saveIntent();
		}
	}
</script>

{#if isEditing}
	<div class="inline-flex items-center rounded-lg overflow-hidden w-fit text-black">
		<div class="bg-gray-300 px-3 py-1 whitespace-nowrap">
			<i class="fa-solid fa-seedling"></i> Intent
		</div>
		<select
			bind:value={tempIntent}
			on:keydown={handleKeydown}
			class="bg-green-300 px-3 py-1 border-none outline-none focus:bg-green-200"
			disabled={isLoading}
		>
			<option value="new">New</option>
			<option value="invest">Invest</option>
			<option value="core">Core</option>
			<option value="romantic">Romantic</option>
			<option value="archive">Archive</option>
			<option value="associate">Associate</option>
		</select>
		<div class="flex gap-1 ml-2">
			<button
				on:click={saveIntent}
				disabled={isLoading}
				class="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs disabled:opacity-50"
			>
				{isLoading ? '...' : '✓'}
			</button>
			<button
				on:click={cancelEdit}
				disabled={isLoading}
				class="bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded text-xs disabled:opacity-50"
			>
				✕
			</button>
		</div>
	</div>
{:else}
	<div
		class="inline-flex items-center rounded-lg overflow-hidden w-fit text-black cursor-pointer hover:shadow-md transition-shadow"
		on:click={startEditing}
		role="button"
		tabindex="0"
		on:keydown={(e) => e.key === 'Enter' && startEditing()}
	>
		<div class="bg-gray-300 hover:bg-gray-400 px-3 py-1 whitespace-nowrap transition-colors">
			<i class="fa-solid fa-seedling"></i> Intent
		</div>
		<div class="bg-green-300 hover:bg-green-400 px-3 py-1 whitespace-nowrap transition-colors">
			{data.friend.intent}
		</div>
	</div>
{/if}
