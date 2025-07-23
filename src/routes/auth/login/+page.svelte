<script lang="ts">
	import { authStore } from '$lib/stores/auth';
	import { onMount } from 'svelte';

	let email = '';
	let password = '';
	let loading = false;
	let error: string | null = null;

	onMount(() => {
		// Subscribe to auth store for loading and error states
		const unsubscribe = authStore.subscribe((state) => {
			loading = state.loading;
			error = state.error;
		});

		return unsubscribe;
	});

	async function handleSubmit() {
		if (!email || !password) {
			error = 'Please enter email and password';
			return;
		}

		await authStore.login(email, password);
	}
</script>

<div class="min-h-screen flex items-center justify-center bg-base-200">
	<div class="card w-96 bg-base-100 shadow-xl">
		<div class="card-body">
			<h2 class="card-title text-2xl font-bold text-center w-full">Login</h2>

			<form on:submit|preventDefault={handleSubmit} class="space-y-4">
				<div class="form-control">
					<label class="label" for="email">
						<span class="label-text">Email</span>
					</label>
					<input
						id="email"
						type="email"
						bind:value={email}
						class="input input-bordered"
						placeholder="you@example.com"
						required
						disabled={loading}
					/>
				</div>

				<div class="form-control">
					<label class="label" for="password">
						<span class="label-text">Password</span>
					</label>
					<input
						id="password"
						type="password"
						bind:value={password}
						class="input input-bordered"
						placeholder="••••••••"
						required
						disabled={loading}
					/>
				</div>

				{#if error}
					<div class="alert alert-error">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="stroke-current shrink-0 h-6 w-6"
							fill="none"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						<span>{error}</span>
					</div>
				{/if}

				<div class="form-control mt-6">
					<button type="submit" class="btn btn-primary" disabled={loading}>
						{#if loading}
							<span class="loading loading-spinner"></span>
							Logging in...
						{:else}
							Login
						{/if}
					</button>
				</div>
			</form>

			<div class="divider">OR</div>

			<p class="text-center text-sm">
				Don't have an account?
				<a href="/auth/register" class="link link-primary">Register</a>
			</p>
		</div>
	</div>
</div>
