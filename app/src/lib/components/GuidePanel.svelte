<script lang="ts">
	import type { Guide, Message } from '$lib/types';
	import { authStore } from '$lib/stores/auth.svelte';
	import type { ExtractionResponse } from '$lib/server/ai/types';

	interface Props {
		guide: Guide;
		onClose: () => void;
		onGuideChanged?: () => void;
	}

	interface ChatMessage {
		role: 'user' | 'assistant';
		content: string;
		extraction?: ExtractionResponse;
	}

	let { guide, onClose, onGuideChanged }: Props = $props();
	let activeTab = $state<'profile' | 'messages'>('profile');
	let messages = $state<Message[]>([]);
	let changingGuide = $state(false);

	// Chat state
	let chatMessages = $state<ChatMessage[]>([]);
	let userInput = $state('');
	let sending = $state(false);
	let sessionContacts = $state<any[]>([]);

	async function handleChangeGuide() {
		if (changingGuide) return;

		const newGuideType = guide.type === 'Scout' ? 'Nico' : 'Scout';
		const confirmMessage = `Switch from ${guide.name} to ${newGuideType}? Your guide will be updated.`;

		if (!confirm(confirmMessage)) {
			return;
		}

		changingGuide = true;

		try {
			const token = await authStore.getIdToken();
			if (!token) throw new Error('Not authenticated');

			const response = await fetch('/api/user/guide', {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify({ guideType: newGuideType })
			});

			if (!response.ok) {
				throw new Error('Failed to change guide');
			}

			// Notify parent to refresh
			if (onGuideChanged) {
				onGuideChanged();
			}
		} catch (error) {
			console.error('Error changing guide:', error);
			alert('Failed to change guide. Please try again.');
		} finally {
			changingGuide = false;
		}
	}

	async function handleSendMessage(e: Event) {
		e.preventDefault();

		if (!userInput.trim() || sending) return;

		const message = userInput.trim();
		userInput = '';
		sending = true;

		// Add user message to chat
		chatMessages = [...chatMessages, { role: 'user', content: message }];

		try {
			const token = await authStore.getIdToken();
			if (!token) throw new Error('Not authenticated');

			const response = await fetch('/api/ai/extract-people', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify({ narrative: message })
			});

			const data: ExtractionResponse = await response.json();

			// Add assistant response
			const assistantMessage: ChatMessage = {
				role: 'assistant',
				content: data.message || 'Processed your message.',
				extraction: data
			};

			chatMessages = [...chatMessages, assistantMessage];

			// If people were created, add them to session contacts
			if (data.created_persons && data.created_persons.length > 0) {
				sessionContacts = [...sessionContacts, ...data.created_persons];
			}
		} catch (error) {
			console.error('Error sending message:', error);
			chatMessages = [
				...chatMessages,
				{
					role: 'assistant',
					content: 'Sorry, I encountered an error processing your message. Please try again.'
				}
			];
		} finally {
			sending = false;
		}
	}

	async function confirmTagAssignment(personIds: string[], tagName: string) {
		try {
			const token = await authStore.getIdToken();
			if (!token) throw new Error('Not authenticated');

			const response = await fetch('/api/ai/confirm-tag', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify({ person_ids: personIds, tag_name: tagName })
			});

			const data = await response.json();

			chatMessages = [
				...chatMessages,
				{
					role: 'assistant',
					content: data.message || `Tagged ${personIds.length} people with "${tagName}"`
				}
			];
		} catch (error) {
			console.error('Error confirming tag:', error);
		}
	}

	async function confirmMemoryEntry(personId: string, content: string, date: string) {
		try {
			const token = await authStore.getIdToken();
			if (!token) throw new Error('Not authenticated');

			const response = await fetch('/api/ai/confirm-memory', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify({ person_id: personId, content, date })
			});

			const data = await response.json();

			chatMessages = [
				...chatMessages,
				{
					role: 'assistant',
					content: data.message || 'Memory entry added successfully'
				}
			];
		} catch (error) {
			console.error('Error confirming memory:', error);
		}
	}
</script>

<div class="flex flex-col h-full bg-white">
	<!-- Header with guide image -->
	<div class="flex items-center gap-4 p-6 border-b bg-gradient-to-r from-purple-50 to-white">
		<img src={guide.imageUrl} alt={guide.name} class="w-16 h-16 rounded-full object-cover" />
		<div class="flex-1">
			<h2 class="text-2xl font-bold text-gray-900">{guide.name}</h2>
			<span class="text-sm text-purple-600 font-medium">Your Guide</span>
		</div>
		<button
			onclick={onClose}
			class="text-gray-400 hover:text-gray-600 text-2xl leading-none p-2"
			aria-label="Close"
		>
			×
		</button>
	</div>

	<!-- Tabs: Profile, Messages (NO Memories) -->
	<div class="flex border-b">
		<button
			onclick={() => (activeTab = 'profile')}
			class="flex-1 px-6 py-3 text-sm font-medium transition-colors {activeTab === 'profile'
				? 'text-blue-600 border-b-2 border-blue-600'
				: 'text-gray-500 hover:text-gray-700'}"
		>
			Profile
		</button>
		<button
			onclick={() => (activeTab = 'messages')}
			class="flex-1 px-6 py-3 text-sm font-medium transition-colors {activeTab === 'messages'
				? 'text-blue-600 border-b-2 border-blue-600'
				: 'text-gray-500 hover:text-gray-700'}"
		>
			Messages
		</button>
	</div>

	<!-- Tab Content -->
	<div class="flex-1 overflow-y-auto p-6">
		{#if activeTab === 'profile'}
			<!-- Show guide bio, personality, change guide button -->
			<div class="space-y-6">
				<div>
					<h3 class="text-lg font-semibold text-gray-900 mb-2">About</h3>
					<p class="text-gray-700">{guide.bio}</p>
				</div>

				<div>
					<h3 class="text-lg font-semibold text-gray-900 mb-2">Personality</h3>
					<p class="text-gray-600">{guide.personality}</p>
				</div>

				<!-- Divider -->
				<div class="border-t pt-6">
					<h3 class="text-lg font-semibold text-gray-900 mb-4">Change Your Guide</h3>
					<p class="text-sm text-gray-600 mb-4">
						Want to switch things up? You can change your guide at any time.
					</p>

					<!-- Change Guide Button -->
					<button
						onclick={handleChangeGuide}
						disabled={changingGuide}
						class="w-full py-3 px-4 bg-purple-100 text-purple-700 rounded-lg font-medium hover:bg-purple-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{#if changingGuide}
							Changing guide...
						{:else}
							Switch to {guide.type === 'Scout' ? 'Nico' : 'Scout'} 🔄
						{/if}
					</button>
				</div>
			</div>
		{:else if activeTab === 'messages'}
			<!-- Chat Interface -->
			<div class="flex flex-col h-full -m-6">
				<!-- Chat Messages -->
				<div class="flex-1 overflow-y-auto p-6 space-y-4">
					{#if chatMessages.length === 0}
						<!-- Welcome Message -->
						<div class="flex flex-col items-center justify-center py-12 text-center">
							<img src={guide.imageUrl} alt={guide.name} class="w-20 h-20 rounded-full mb-4" />
							<h3 class="text-lg font-semibold text-gray-900 mb-2">Chat with {guide.name}</h3>
							<p class="text-gray-600 max-w-sm mb-4">
								Tell me about people you meet, and I'll help you keep track of them!
							</p>
							<div class="text-sm text-gray-500 text-left max-w-md space-y-2">
								<p><strong>Try saying:</strong></p>
								<ul class="list-disc list-inside">
									<li>"I met Sarah at the conference. She's a designer from Portland."</li>
									<li>"Add Tom to the Work tag"</li>
									<li>"I saw Michael today. He went for a run."</li>
								</ul>
							</div>
						</div>
					{:else}
						{#each chatMessages as msg}
							{#if msg.role === 'user'}
								<!-- User Message -->
								<div class="flex justify-end">
									<div class="max-w-[80%] bg-blue-500 text-white rounded-lg px-4 py-2">
										{msg.content}
									</div>
								</div>
							{:else}
								<!-- Assistant Message -->
								<div class="flex gap-3">
									<img
										src={guide.imageUrl}
										alt={guide.name}
										class="w-8 h-8 rounded-full flex-shrink-0"
									/>
									<div class="flex-1">
										<div class="bg-gray-100 rounded-lg px-4 py-2 text-gray-900">
											{msg.content}
										</div>

										<!-- Show confirmation cards for tag assignments -->
										{#if msg.extraction?.tag_assignments && msg.extraction.tag_assignments.length > 0}
											<div class="mt-2 space-y-2">
												{#each msg.extraction.tag_assignments as tagAssignment}
													<div class="bg-white border border-gray-200 rounded-lg p-4">
														<h4 class="font-medium text-gray-900 mb-2">
															Tag Assignment: {tagAssignment.tag_name}
														</h4>
														{#each tagAssignment.matched_people as personMatch}
															{#if personMatch.matches.length === 1}
																<div class="text-sm text-gray-600">
																	• {personMatch.matches[0].person_name}
																</div>
															{:else if personMatch.matches.length > 1}
																<div class="text-sm text-yellow-600">
																	⚠️ Multiple matches for "{personMatch.extracted_name}". Please
																	select one.
																</div>
															{:else}
																<div class="text-sm text-red-600">
																	❌ No match found for "{personMatch.extracted_name}"
																</div>
															{/if}
														{/each}

														<button
															onclick={() =>
																confirmTagAssignment(
																	tagAssignment.matched_people.flatMap((pm) =>
																		pm.matches.map((m) => m.person_id)
																	),
																	tagAssignment.tag_name
																)}
															class="mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
														>
															Confirm
														</button>
													</div>
												{/each}
											</div>
										{/if}

										<!-- Show confirmation cards for memory updates -->
										{#if msg.extraction?.memory_updates && msg.extraction.memory_updates.length > 0}
											<div class="mt-2 space-y-2">
												{#each msg.extraction.memory_updates as memoryUpdate}
													<div class="bg-white border border-gray-200 rounded-lg p-4">
														<h4 class="font-medium text-gray-900 mb-2">Memory Entry</h4>
														{#if memoryUpdate.matched_person.matches.length === 1}
															<div class="text-sm text-gray-600 mb-2">
																<strong>{memoryUpdate.matched_person.matches[0].person_name}</strong>:
																{memoryUpdate.entry_content}
															</div>
															<div class="text-xs text-gray-500 mb-3">
																Date: {memoryUpdate.parsed_date}
															</div>

															<button
																onclick={() =>
																	confirmMemoryEntry(
																		memoryUpdate.matched_person.matches[0].person_id,
																		memoryUpdate.entry_content,
																		memoryUpdate.parsed_date
																	)}
																class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
															>
																Confirm
															</button>
														{:else if memoryUpdate.matched_person.matches.length > 1}
															<div class="text-sm text-yellow-600">
																⚠️ Multiple matches for "{memoryUpdate.matched_person.extracted_name}".
																Please select one.
															</div>
														{:else}
															<div class="text-sm text-red-600">
																❌ No match found for "{memoryUpdate.matched_person.extracted_name}"
															</div>
														{/if}
													</div>
												{/each}
											</div>
										{/if}

										<!-- Show created contacts -->
										{#if msg.extraction?.created_persons && msg.extraction.created_persons.length > 0}
											<div class="mt-2 space-y-2">
												{#each msg.extraction.created_persons as person}
													<div class="bg-green-50 border border-green-200 rounded-lg p-3">
														<div class="text-sm font-medium text-green-900">
															✓ Created: {person.name}
														</div>
													</div>
												{/each}
											</div>
										{/if}
									</div>
								</div>
							{/if}
						{/each}
					{/if}
				</div>

				<!-- Chat Input -->
				<div class="border-t p-4 bg-white">
					<form onsubmit={handleSendMessage} class="flex gap-2">
						<input
							type="text"
							bind:value={userInput}
							disabled={sending}
							placeholder="Tell me about someone you met..."
							class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
						/>
						<button
							type="submit"
							disabled={sending || !userInput.trim()}
							class="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{sending ? 'Sending...' : 'Send'}
						</button>
					</form>
				</div>
			</div>
		{/if}
	</div>
</div>
