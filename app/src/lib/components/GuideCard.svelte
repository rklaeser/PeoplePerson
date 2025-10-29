<script lang="ts">
	import type { Guide } from '$lib/types';

	interface Props {
		guide: Guide;
		selected?: boolean;
		onclick?: () => void;
	}

	let { guide, selected = false, onclick }: Props = $props();
</script>

<button
	type="button"
	onclick={onclick}
	class="w-full p-4 text-left hover:bg-purple-50 transition-colors border-l-4 {selected
		? 'bg-purple-50 border-purple-500'
		: 'border-transparent hover:border-purple-200'}"
>
	<div class="flex items-start space-x-3">
		<!-- Guide Profile Image -->
		<div class="flex-shrink-0 relative">
			<img src={guide.imageUrl} alt={guide.name} class="w-12 h-12 rounded-full object-cover" />
			<!-- Guide Badge -->
			<div
				class="absolute -bottom-1 -right-1 w-5 h-5 bg-purple-500 rounded-full border-2 border-white flex items-center justify-center"
			>
				<span class="text-xs">⭐</span>
			</div>
		</div>

		<!-- Content -->
		<div class="flex-1 min-w-0">
			<div class="flex items-center gap-2 mb-1">
				<h3 class="font-semibold text-gray-900">{guide.name}</h3>
				<span class="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
					Your Guide
				</span>
			</div>
			<p class="text-sm text-gray-600 line-clamp-2">
				{guide.bio}
			</p>
		</div>
	</div>
</button>
