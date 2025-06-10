<script lang="ts">
	export let data;

	let expandedHistoryIds: string[] = [];

	function expandHistory(id: string) {
		if (expandedHistoryIds.includes(id)) {
			expandedHistoryIds = expandedHistoryIds.filter((historyId) => historyId !== id);
		} else {
			expandedHistoryIds = [...expandedHistoryIds, id];
		}
	}

	function formatDate(dateStr: string) {
		const date = new Date(dateStr);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		});
	}
</script>

<hr class="my-4 border-gray-300" />
<div class="flex items-center justify-between mt-8">
	<h2 class="text-2xl">History</h2>
</div>
<ul>
	{#each data.history as historyEntry}
		<li>
			<div class="flex items-center justify-between">
				<button
					on:click={() => expandHistory(historyEntry.id)}
					class="hover:bg-gray-400 text-white px-4 py-2 rounded"
				>
					{#if historyEntry.changeType === 'prompt'}
						<i class="fas fa-robot mr-2"></i>Updated {historyEntry.field}
					{:else}
						<i class="fas fa-user mr-3"></i>Updated {historyEntry.field}
					{/if}
					- {formatDate(historyEntry.createdAt)}
				</button>
			</div>
			{#if expandedHistoryIds.includes(historyEntry.id)}
				<div class="text-white ml-20">
					<p>
						<strong>Type:</strong>
						{historyEntry.changeType === 'prompt' ? 'AI Assistant' : 'Manual Edit'}
					</p>
					{#if historyEntry.changeType === 'prompt'}
						<p><strong>Original Prompt:</strong> "{historyEntry.detail}"</p>
					{:else}
						<p><strong>Change:</strong> {historyEntry.detail}</p>
					{/if}
				</div>
			{/if}
		</li>
	{/each}

	<!-- Person Created Entry -->
	<li>
		<div class="flex items-center justify-between">
			<button class="text-white px-4 py-2 rounded">
				<i class="fas fa-champagne-glasses mr-2"></i>Friendiversary - {formatDate(
					data.friend.createdAt
				)}</button
			>
		</div>
	</li>
</ul>
