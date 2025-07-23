<script lang="ts">
	import type { Group } from '$lib/types';
	import '@fortawesome/fontawesome-free/css/all.css';
	import Table from './Table.svelte';
	import { slide, fade } from 'svelte/transition';
	import { isDemoMode } from '$lib/stores/demoStore';

	export let isOpen = false;
	export let data: any = null; // Demo data passed from parent

	function closeModal() {
		isOpen = false;
	}

	// Close modal when pressing Escape
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			closeModal();
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
	<div
		class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-center"
		transition:fade={{ duration: 200 }}
	>
		<div
			class="w-full bg-gray-900 text-gray-100 rounded-t-3xl shadow-xl transform transition-transform duration-300 ease-out"
			style="height: 80vh;"
			transition:slide={{ duration: 300 }}
		>
			<div class="p-4 flex justify-between items-center border-b">
				<h2 class="text-2xl font-bold">Friends</h2>
				<button
					on:click={closeModal}
					class="p-2 hover:bg-gray-100 rounded-full transition-colors"
					aria-label="Close"
				>
					<i class="fas fa-times text-gray-500"></i>
				</button>
			</div>
			<div class="overflow-auto" style="height: calc(80vh - 4rem);">
				<Table friendsData={data?.people || []} />
			</div>
		</div>
	</div>
{/if}

<style>
	:global(.modal-open) {
		overflow: hidden;
	}
</style>
