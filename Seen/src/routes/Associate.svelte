<script lang="ts">
	import type { Associate } from '$lib/stores/peopleStore.ts';
	export let associate = [];
</script>

<div class="associate-info">
	<p><strong>ID:</strong> {associate.id}</p>
	<p><strong>Name:</strong> {associate.name}</p>
	<p><strong>Relation:</strong> {associate.relation}</p>
	<p><strong>Notes:</strong> {associate.notes}</p>
</div>

<style>
	.associate-info {
		border: 1px solid #ccc;
		padding: 10x;
		margin: 10px 0;
		margin-left: 20px;
	}
</style>
