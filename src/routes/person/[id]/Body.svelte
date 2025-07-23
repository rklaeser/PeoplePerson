<script lang="ts">
	import snarkdown from 'snarkdown';
	import { Carta, MarkdownEditor } from 'carta-md';
	import 'carta-md/default.css';
	import type { Friend, Group, History, Associate } from '$lib/types';

	const carta = new Carta({
		sanitizer: false
	});

	export let data: {
		friend: Friend;
		associates: Associate[];
		history: History[];
		groupData: Group[];
	};

	let isEditing = false;
	let markdownContent = data.friend.body || '';

	function toggleEdit() {
		isEditing = !isEditing;
		if (isEditing) {
			markdownContent = data.friend.body || '';
		}
	}

	function handleSave() {
		data.friend.body = markdownContent;
	}
</script>

<div class="relative">
	{#if isEditing}
		<form
			method="POST"
			action="?/updateBody"
			class="flex flex-col gap-4 w-full"
			on:submit={handleSave}
		>
			<div class="flex justify-between items-center">
				<h3>Description</h3>
				<div class="flex gap-2">
					<button
						type="button"
						on:click={toggleEdit}
						class="bg-gray-500 text-white px-4 py-2 rounded">Cancel</button
					>
					<button type="submit" class="bg-blue-500 text-white px-4 py-2 rounded">Save</button>
				</div>
			</div>
			<input type="hidden" name="id" value={data.friend.id} />
			<input type="hidden" name="content" value={markdownContent} />

			<div class="carta-editor">
				<MarkdownEditor
					{carta}
					bind:value={markdownContent}
					placeholder="Type your summary here using Markdown..."
				/>
			</div>
		</form>
	{:else}
		<button
			on:click={toggleEdit}
			class="absolute top-[-15px] right-0 text-white px-6 py-3 text-lg"
			aria-label="Edit"
		>
			<i class="fas fa-pencil-alt"></i>
		</button>
		<h3>Description</h3>
		<hr class=" mb-3 border-gray-300" />

		<div class="markdown-content">
			{@html snarkdown(data.friend.body || 'No summary yet. Click the edit button to add one.')}
		</div>
	{/if}
</div>

<style>
	.carta-editor {
		min-height: 400px;
		border: 1px solid #374151;
		border-radius: 0.5rem;
		--carta-bg: #1f2937;
		--carta-text: #f9fafb;
		--carta-border: #374151;
	}

	/* Override Carta's default styles for dark theme */
	:global(.carta-editor .carta-toolbar) {
		background-color: #374151 !important;
		border-color: #4b5563 !important;
	}

	:global(.carta-editor .carta-input) {
		background-color: #1f2937 !important;
		color: #f9fafb !important;
		border-color: #4b5563 !important;
	}

	:global(.carta-editor .carta-input textarea) {
		background-color: #1f2937 !important;
		color: #f9fafb !important;
	}

	:global(.carta-editor textarea) {
		background-color: #1f2937 !important;
		color: #f9fafb !important;
	}

	:global(.carta-editor .cm-editor) {
		background-color: #1f2937 !important;
		color: #f9fafb !important;
	}

	:global(.carta-editor .cm-content) {
		color: #f9fafb !important;
	}

	:global(.carta-editor .cm-cursor) {
		border-left-color: #f9fafb !important;
	}

	:global(.carta-editor textarea) {
		caret-color: #f9fafb !important;
	}

	:global(.carta-editor .carta-input textarea) {
		caret-color: #f9fafb !important;
	}

	:global(.carta-editor .carta-preview) {
		background-color: #111827 !important;
		color: #f9fafb !important;
		border-color: #4b5563 !important;
	}

	:global(.carta-editor .carta-toolbar button) {
		color: #d1d5db !important;
		background-color: transparent !important;
	}

	:global(.carta-editor .carta-toolbar button:hover) {
		background-color: #4b5563 !important;
		color: #f9fafb !important;
	}

	.markdown-content {
		line-height: 1.6;
	}

	.markdown-content h1 {
		font-size: 1.875rem;
		font-weight: bold;
		margin: 1rem 0;
	}
	.markdown-content h2 {
		font-size: 1.5rem;
		font-weight: bold;
		margin: 0.875rem 0;
	}
	.markdown-content h3 {
		font-size: 1.25rem;
		font-weight: bold;
		margin: 0.75rem 0;
	}
	.markdown-content p {
		margin: 0.5rem 0;
	}
	.markdown-content ul,
	.markdown-content ol {
		margin: 0.5rem 0;
		padding-left: 1.5rem;
	}
	.markdown-content blockquote {
		border-left: 4px solid #e5e7eb;
		padding-left: 1rem;
		margin: 1rem 0;
	}
	.markdown-content code {
		background-color: #f3f4f6;
		padding: 0.125rem 0.25rem;
		border-radius: 0.25rem;
	}
	.markdown-content pre {
		background-color: #f3f4f6;
		padding: 1rem;
		border-radius: 0.5rem;
		overflow-x: auto;
	}
</style>
