<script lang="ts">
	import Table from '$lib/components/Table.svelte';
	import type { Friend } from '$lib/types';

	export let data;

	let selectedPersonId = '';
	let newMemberName = '';

	function handleFriendClick(friend: Friend) {
		window.location.href = `/demo/person/${friend.id}`;
	}

	async function removeMember(personId: string) {
		console.log('🎭 Demo: Simulating member removal');
		// In demo mode, we just show a message
		alert('Demo mode: Member removal simulated!');
	}

	async function addExistingMember() {
		if (!selectedPersonId) return;
		console.log('🎭 Demo: Simulating adding existing member');
		alert('Demo mode: Adding existing member simulated!');
	}

	async function createNewMember() {
		if (!newMemberName.trim()) return;
		console.log('🎭 Demo: Simulating creating new member');
		alert('Demo mode: Creating new member simulated!');
		newMemberName = '';
	}
</script>

<!-- Demo Banner -->
<div class="bg-yellow-600 text-black px-4 py-2 text-center font-semibold">
	🎭 DEMO MODE - All changes are simulated
	<a
		href="/auth/signin"
		class="ml-4 bg-black text-yellow-600 px-3 py-1 rounded text-sm hover:bg-gray-800"
	>
		Exit Demo
	</a>
</div>

<div class="container mx-auto p-4 max-w-6xl">
	<div class="flex items-center mb-6">
		<a href="/demo" class="btn btn-ghost mr-4">
			<i class="fas fa-arrow-left"></i>
			Back to Demo
		</a>
		<h1 class="text-3xl font-bold">{data.group.name} Group</h1>
	</div>

	{#if data.group.description}
		<p class="text-gray-600 mb-6">{data.group.description}</p>
	{/if}

	<!-- Group Members -->
	<div class="card bg-base-100 shadow-xl mb-6">
		<div class="card-body">
			<h2 class="card-title mb-4">Group Members ({data.people.length})</h2>

			{#if data.people.length > 0}
				<Table
					friendsData={data.people}
					onFriendClick={handleFriendClick}
					showGroupColumn={false}
				/>

				<!-- Remove Member Actions -->
				<div class="mt-4 p-4 bg-red-50 rounded-lg">
					<h3 class="font-semibold text-red-800 mb-2">Remove Members (Demo)</h3>
					<div class="flex flex-wrap gap-2">
						{#each data.people as person}
							<button
								on:click={() => removeMember(person.id)}
								class="btn btn-sm btn-outline btn-error"
							>
								Remove {person.name}
							</button>
						{/each}
					</div>
				</div>
			{:else}
				<p class="text-gray-500">No members in this group yet.</p>
			{/if}
		</div>
	</div>

	<!-- Add Members -->
	<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
		<!-- Add Existing Member -->
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body">
				<h3 class="card-title">Add Existing Person (Demo)</h3>
				<div class="form-control">
					<label class="label">
						<span class="label-text">Select Person</span>
					</label>
					<select bind:value={selectedPersonId} class="select select-bordered">
						<option value="">Choose a person...</option>
						{#each data.availablePeople as person}
							<option value={person.id}>{person.name}</option>
						{/each}
					</select>
				</div>
				<div class="card-actions justify-end mt-4">
					<button on:click={addExistingMember} disabled={!selectedPersonId} class="btn btn-primary">
						Add to Group
					</button>
				</div>
			</div>
		</div>

		<!-- Create New Member -->
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body">
				<h3 class="card-title">Create New Person (Demo)</h3>
				<div class="form-control">
					<label class="label">
						<span class="label-text">Person Name</span>
					</label>
					<input
						type="text"
						bind:value={newMemberName}
						placeholder="Enter name..."
						class="input input-bordered"
					/>
				</div>
				<div class="card-actions justify-end mt-4">
					<button
						on:click={createNewMember}
						disabled={!newMemberName.trim()}
						class="btn btn-secondary"
					>
						Create & Add
					</button>
				</div>
			</div>
		</div>
	</div>
</div>
