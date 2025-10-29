<script lang="ts">
	import type { Person, Tag } from '$lib/types';
	import { formatDistance } from 'date-fns';

	interface Props {
		person: Person;
		allTags?: Tag[];
		selected?: boolean;
		onclick?: () => void;
	}

	let { person, allTags = [], selected = false, onclick }: Props = $props();

	function getTagById(tagId: string): Tag | undefined {
		return allTags.find((t) => t.id === tagId);
	}

	// Generate avatar color based on name
	function getAvatarColor(name: string): string {
		const colors = [
			'bg-blue-500',
			'bg-green-500',
			'bg-purple-500',
			'bg-pink-500',
			'bg-yellow-500',
			'bg-indigo-500',
			'bg-red-500',
			'bg-orange-500'
		];
		const index = name.charCodeAt(0) % colors.length;
		return colors[index];
	}

	// Get initials from name
	function getInitials(name: string): string {
		return name
			.split(' ')
			.map((n) => n[0])
			.join('')
			.toUpperCase()
			.slice(0, 2);
	}

	// Format last contact date
	function formatLastContact(date: any): string {
		if (!date) return 'Never';

		try {
			// Handle Firestore Timestamp
			const jsDate = date.toDate ? date.toDate() : new Date(date);
			return formatDistance(jsDate, new Date(), { addSuffix: true });
		} catch {
			return 'Unknown';
		}
	}
</script>

<button
	type="button"
	onclick={onclick}
	class="w-full p-4 text-left hover:bg-gray-50 transition-colors {selected
		? 'bg-blue-50 border-l-4 border-blue-500'
		: 'border-l-4 border-transparent'}"
>
	<div class="flex items-start space-x-3">
		<!-- Avatar -->
		<div class="flex-shrink-0">
			<div
				class="w-12 h-12 rounded-full {getAvatarColor(
					person.name
				)} flex items-center justify-center text-white font-semibold"
			>
				{getInitials(person.name)}
			</div>
		</div>

		<!-- Content -->
		<div class="flex-1 min-w-0">
			<!-- Name -->
			<div class="flex items-center justify-between">
				<h3 class="text-sm font-semibold text-gray-900 truncate">
					{person.name}
				</h3>
			</div>

			<!-- Description -->
			{#if person.body && person.body !== 'Add a description'}
				<p class="text-sm text-gray-600 line-clamp-2 mt-1">
					{person.body}
				</p>
			{/if}

			<!-- Tags -->
			{#if person.tagIds && person.tagIds.length > 0}
				<div class="flex flex-wrap gap-1 mt-2">
					{#each person.tagIds.slice(0, 3) as tagId}
						{@const tag = getTagById(tagId)}
						{#if tag}
							<span
								class="inline-flex items-center px-2 py-0.5 rounded-full text-xs text-white"
								style="background-color: {tag.color || '#3B82F6'};"
							>
								{tag.name}
							</span>
						{/if}
					{/each}
					{#if person.tagIds.length > 3}
						<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-200 text-gray-600">
							+{person.tagIds.length - 3}
						</span>
					{/if}
				</div>
			{/if}

			<!-- Metadata -->
			<div class="flex items-center mt-2 text-xs text-gray-500 space-x-3">
				<!-- Last contact -->
				<span>
					{formatLastContact(person.lastContactDate)}
				</span>

				<!-- Location -->
				{#if person.city && person.state}
					<span class="flex items-center space-x-1">
						<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
							<path
								fill-rule="evenodd"
								d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
								clip-rule="evenodd"
							/>
						</svg>
						<span>{person.city}, {person.state}</span>
					</span>
				{/if}
			</div>
		</div>
	</div>
</button>
