<script lang="ts">
	import { goto } from '$app/navigation';
	import '@fortawesome/fontawesome-free/css/all.css';
	import Associates from './Associates.svelte'; // Import the new Associates component
	import Status from './Status.svelte';
	import Location from './Location.svelte';
	import Groups from './Groups.svelte';
	import Body from './Body.svelte';
	import HistoryEntries from './HistoryEntries.svelte';
	import Birthday from './Birthday.svelte';
	import Mnemonic from './Mnemonic.svelte';
	import Name from './Name.svelte';
	import type { Friend, Group, History, Associate } from '$lib/types'; // Import the Friend interface

	export let data: {
		friend: Friend;
		associates: Associate[];
		history: History[];
		groupData: Group[];
	};

	let groupsComponent: any;
	let associatesComponent: any;

	function goBackWithModal() {
		goto('/?modal=open');
	}
</script>

<section>
	<button
		class="absolute top-4 left-4 z-10 bg-gray-800 text-white rounded-full p-2 hover:bg-gray-700"
		on:click={goBackWithModal}
		aria-label="Back to list"
	>
		<i class="fas fa-arrow-left"></i>
	</button>
	<div class="relative">
		<Name {data} />
		<div class="flex flex-col gap-4">
			<Status {data} />
			<Birthday {data} />
			<Mnemonic {data} />
		</div>
		<div class="flex flex-row justify-between mb-10">
			<div class="flex flex-col gap-2 mt-2">
				<div class="flex items-center gap-4">
					<h3>Groups</h3>
					<button
						on:click={() => groupsComponent?.startAdding()}
						class="bg-blue-500 hover:bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm transition-colors"
						title="Add Group"
					>
						+
					</button>
				</div>
				<Groups {data} bind:this={groupsComponent} />
			</div>
			<div class="flex flex-col gap-2 mt-2">
				<div class="flex items-center gap-5">
					<h3>Associates</h3>
					<button
						on:click={() => associatesComponent?.startAdding()}
						class="bg-blue-500 hover:bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm transition-colors"
						title="Add Associate"
					>
						+
					</button>
				</div>
				<Associates {data} bind:this={associatesComponent} />
			</div>
		</div>
		<Body {data} />
		<HistoryEntries {data} />
	</div>
</section>

<style>
	section {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: left;
		flex: 0.1;
	}
</style>

