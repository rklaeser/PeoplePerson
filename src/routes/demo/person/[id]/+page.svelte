<script lang="ts">
	import Name from '../../../person/[id]/Name.svelte';
	import Body from '../../../person/[id]/Body.svelte';
	import Birthday from '../../../person/[id]/Birthday.svelte';
	import Mnemonic from '../../../person/[id]/Mnemonic.svelte';
	import Status from '../../../person/[id]/Status.svelte';
	import Associates from '../../../person/[id]/Associates.svelte';
	import Groups from '../../../person/[id]/Groups.svelte';
	import JournalEntries from '../../../person/[id]/JournalEntries.svelte';
	import ProfilePic from '$lib/components/ProfilePic.svelte';
	import { onMount } from 'svelte';
	import {
		demoActions,
		demoPeople,
		demoGroups,
		demoGroupAssociations,
		demoJournals,
		isDemoMode
	} from '$lib/stores/demoStore';

	export let data;
	let isEditing = false;

	// Initialize demo mode and find the person
	onMount(() => {
		demoActions.initDemo();
	});

	// Create reactive demo data structure
	$: friend = $demoPeople.find((p) => p.id === data.id);
	$: friendGroups = $demoGroupAssociations
		.filter((assoc) => assoc.personId === data.id)
		.map((assoc) => $demoGroups.find((g) => g.id === assoc.groupId))
		.filter(Boolean);
	$: friendJournals = $demoJournals.filter((j) => j.personId === data.id);
	$: associates = []; // Demo doesn't have person associations yet

	$: demoData = friend
		? {
				friend: {
					...friend,
					Groups: friendGroups,
					Journals: friendJournals,
					Associates: associates
				},
				groups: $demoGroups,
				isDemo: true
			}
		: null;
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

<div class="container mx-auto p-4 max-w-4xl">
	<div class="flex items-center mb-6">
		<a href="/demo" class="btn btn-ghost mr-4">
			<i class="fas fa-arrow-left"></i>
			Back to Demo
		</a>
		<h1 class="text-2xl font-bold">{friend?.name || 'Friend Not Found'}</h1>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- Left Column - Profile Info -->
		<div class="lg:col-span-2 space-y-6">
			<!-- Profile Picture and Name -->
			<div class="card bg-base-100 shadow-xl">
				<div class="card-body">
					<div class="flex items-center space-x-4">
						<ProfilePic intent={friend?.intent} index={friend?.profile_pic_index} />
						<div class="flex-1">
							<Name data={demoData} {isEditing} />
						</div>
					</div>
				</div>
			</div>

			<!-- Description -->
			<div class="card bg-base-100 shadow-xl">
				<div class="card-body">
					<Body data={demoData} />
				</div>
			</div>

			<!-- Personal Details -->
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div class="card bg-base-100 shadow-xl">
					<div class="card-body">
						<Birthday data={demoData} />
					</div>
				</div>
				<div class="card bg-base-100 shadow-xl">
					<div class="card-body">
						<Mnemonic data={demoData} />
					</div>
				</div>
			</div>

			<!-- Status -->
			<div class="card bg-base-100 shadow-xl">
				<div class="card-body">
					<Status data={demoData} />
				</div>
			</div>
		</div>

		<!-- Right Column - Relationships & History -->
		<div class="space-y-6">
			<!-- Associates -->
			<div class="card bg-base-100 shadow-xl">
				<div class="card-body">
					<Associates data={demoData} />
				</div>
			</div>

			<!-- Groups -->
			<div class="card bg-base-100 shadow-xl">
				<div class="card-body">
					<Groups data={demoData} />
				</div>
			</div>

			<!-- Journal/History -->
			<div class="card bg-base-100 shadow-xl">
				<div class="card-body">
					<JournalEntries data={demoData} />
				</div>
			</div>
		</div>
	</div>
</div>
