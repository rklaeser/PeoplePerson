<script lang=ts>
	import { page } from '$app/stores';
	import logo from '$lib/images/svelte-logo.svg';
	import github from '$lib/images/github.svg';
	import { getContext } from 'svelte';
  	import { type Writable } from 'svelte/store';
  	import Search from '../lib/components/Search.svelte';

	export let data: { people: { id: string; name: string; intent: string; county: string }[] }; // Accept data as a prop

</script>

<header class="flex items-center justify-between">
	<div class="corner">
		<a href="/">🚢</a>
	</div>

	<Search {data} />

	<div class="corner">
		<a href="https://github.com/sveltejs/kit">
			<img src={github} alt="GitHub" />
		</a>
	</div>
</header>

<style>

	.corner {
		width: 3em;
		height: 3em;
	}

</style>
