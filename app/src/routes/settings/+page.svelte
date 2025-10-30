<script lang="ts">
	import Sidebar from '$lib/components/Sidebar.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { getGuide, GUIDES } from '$lib/guides';
	import type { GuideType } from '$lib/types';

	let deleting = $state(false);
	let error = $state('');
	let guideError = $state('');
	let selectedGuide = $state<GuideType | null>(null);
	let savingGuide = $state(false);

	async function fetchUserData() {
		try {
			const token = await authStore.getIdToken();
			if (!token) return;

			const response = await fetch('/api/user', {
				headers: { Authorization: `Bearer ${token}` }
			});

			if (!response.ok) return;

			const user = await response.json();
			selectedGuide = user.selectedGuide;
		} catch (e) {
			console.error('Error fetching user data:', e);
		}
	}

	async function handleGuideChange(guideType: GuideType) {
		if (savingGuide || selectedGuide === guideType) return;

		savingGuide = true;
		guideError = '';

		try {
			const token = await authStore.getIdToken();
			if (!token) throw new Error('Not authenticated');

			const response = await fetch('/api/user/guide', {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify({ guideType })
			});

			if (!response.ok) {
				throw new Error('Failed to update guide');
			}

			selectedGuide = guideType;
		} catch (err) {
			guideError = err instanceof Error ? err.message : 'Failed to update guide';
			console.error('Error updating guide:', err);
		} finally {
			savingGuide = false;
		}
	}

	onMount(() => {
		fetchUserData();
	});

	async function handleDeleteAccount() {
		const confirmText = 'DELETE';
		const userInput = prompt(
			`⚠️ WARNING: This will permanently delete your account and ALL data.\n\nThis action cannot be undone. All your people, memories, tags, and messages will be lost forever.\n\nType "${confirmText}" to confirm:`
		);

		if (userInput !== confirmText) {
			if (userInput !== null) {
				alert('Delete cancelled. Text did not match.');
			}
			return;
		}

		deleting = true;
		error = '';

		try {
			const token = await authStore.getIdToken();
			if (!token) throw new Error('Not authenticated');

			const response = await fetch('/api/user/delete', {
				method: 'DELETE',
				headers: {
					Authorization: `Bearer ${token}`
				}
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Failed to delete account');
			}

			// Account deleted successfully
			// Sign out from Firebase client-side
			await authStore.signOut();

			// Show confirmation and redirect to landing page
			alert('Your account has been permanently deleted.');
			goto('/');
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to delete account';
			console.error('Error deleting account:', err);
		} finally {
			deleting = false;
		}
	}
</script>

<Sidebar />

<div class="ml-16 h-screen bg-gray-50 p-8 overflow-y-auto">
	<div class="max-w-4xl mx-auto">
		<h1 class="text-3xl font-bold text-gray-900 mb-6">Settings</h1>

		<!-- Account Section -->
		<div class="bg-white rounded-lg border border-gray-200 p-8 mb-6">
			<h2 class="text-xl font-semibold text-gray-900 mb-4">Account</h2>

			<div class="space-y-4">
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
					<div class="text-gray-900">{authStore.user?.email || 'Not available'}</div>
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">User ID</label>
					<div class="text-gray-600 text-sm font-mono">{authStore.user?.uid || 'Not available'}</div>
				</div>
			</div>
		</div>

		<!-- Preferences Section -->
		<div class="bg-white rounded-lg border border-gray-200 p-8 mb-6">
			<h2 class="text-xl font-semibold text-gray-900 mb-4">Preferences</h2>

			<!-- Guide Selection -->
			<div class="mb-6">
				<h3 class="text-lg font-medium text-gray-900 mb-2">Chat with someone new</h3>
				<p class="text-sm text-gray-600 mb-4">
					Choose who you'd like to chat with in your journal. You can switch anytime!
				</p>

				{#if guideError}
					<div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
						{guideError}
					</div>
				{/if}

				<div class="grid grid-cols-2 gap-4">
					{#each Object.values(GUIDES) as guide}
						{@const isSelected = selectedGuide === guide.type}
						<button
							onclick={() => handleGuideChange(guide.type)}
							disabled={savingGuide}
							class="relative p-4 border-2 rounded-lg transition-all text-left hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed {isSelected
								? 'border-blue-500 bg-blue-50'
								: 'border-gray-200 hover:border-blue-300'}"
						>
							<div class="flex items-start gap-3">
								<img
									src={guide.imageUrl}
									alt={guide.name}
									class="w-16 h-16 rounded-full object-cover"
								/>
								<div class="flex-1">
									<div class="flex items-center gap-2">
										<h4 class="font-semibold text-gray-900">{guide.name}</h4>
										{#if isSelected}
											<span class="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
												Current
											</span>
										{/if}
									</div>
									<p class="text-sm text-gray-600 mt-1">{guide.personality}</p>
								</div>
							</div>
							<p class="text-sm text-gray-700 mt-3">{guide.bio}</p>
						</button>
					{/each}
				</div>
			</div>
		</div>

		<!-- Danger Zone -->
		<div class="bg-white rounded-lg border-2 border-red-200 p-8">
			<h2 class="text-xl font-semibold text-red-900 mb-2">Danger Zone</h2>
			<p class="text-sm text-gray-600 mb-6">
				Once you delete your account, there is no going back. Please be certain.
			</p>

			{#if error}
				<div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
					{error}
				</div>
			{/if}

			<button
				onclick={handleDeleteAccount}
				disabled={deleting}
				class="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{#if deleting}
					Deleting Account...
				{:else}
					Delete Account
				{/if}
			</button>

			<p class="text-xs text-gray-500 mt-3">
				This will permanently delete:
			</p>
			<ul class="text-xs text-gray-500 mt-2 space-y-1 ml-4">
				<li>• Your account and profile</li>
				<li>• All your people and their information</li>
				<li>• All memories and messages</li>
				<li>• All tags and custom data</li>
				<li>• Your guide selection</li>
			</ul>
		</div>
	</div>
</div>
