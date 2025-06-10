<script lang="ts">
    import { onMount } from 'svelte';
    import { reload } from '$lib/stores/friends';
    import { isDemoMode, demoActions } from '$lib/stores/demoStore';
  
  
    let name = '';
    let body = '';
    let intent = 'new';
    let birthday: string | null = null;
    let mnemonic = '';
    let isSaving = false;
    let error = '';
  
    export let isOpen = false;
    export let data: any = null; // Demo data passed from parent
  
    function closeModal() {
      isOpen = false;
    }
  
    async function saveFriend() {
      if (!name.trim()) {
        error = 'Name is required';
        return;
      }
      isSaving = true;
      error = '';
      
      try {
        if ($isDemoMode || data?.isDemo) {
          // Demo mode: use store actions
          const newPerson = demoActions.createPerson(name, intent);
          if (body) demoActions.updatePerson(newPerson.id, { body });
          if (birthday) demoActions.updatePerson(newPerson.id, { birthday });
          if (mnemonic) demoActions.updatePerson(newPerson.id, { mnemonic });
          
          // Reset form
          name = '';
          body = '';
          intent = 'new';
          birthday = null;
          mnemonic = '';
          closeModal();
        } else {
          // Regular mode: API call
          const response = await fetch('/api/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name,
              body,
              intent,
              birthday,
              mnemonic
            })
          });
          const result = await response.json();
          if (!response.ok) {
            error = result.error || 'Failed to create friend';
            isSaving = false;
            return;
          }
          // Reload the friends data
          await reload();
          closeModal();
        }
      } catch (e) {
        error = 'Failed to create friend';
      } finally {
        isSaving = false;
      }
    }
  </script>
  
  {#if isOpen}
    <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div class="bg-gray-900 text-gray-100 rounded-lg shadow-xl p-8 w-full max-w-md">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold">Add Friend</h2>
          <button on:click={closeModal} class="text-gray-400 hover:text-gray-200 text-2xl">&times;</button>
        </div>
        <form on:submit|preventDefault={saveFriend} class="space-y-4">
          <div>
            <label class="block mb-1">Name</label>
            <input class="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700" bind:value={name} required />
          </div>
          <div>
            <label class="block mb-1">Body</label>
            <textarea class="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700" bind:value={body} />
          </div>
          <div>
            <label class="block mb-1">Intent</label>
            <select class="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700" bind:value={intent}>
              <option value="romantic">Romantic</option>
              <option value="core">Core</option>
              <option value="archive">Archive</option>
              <option value="new">New</option>
              <option value="invest">Invest</option>
              <option value="associate">Associate</option>
            </select>
          </div>
          <div>
            <label class="block mb-1">Birthday</label>
            <input type="date" class="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700" bind:value={birthday} />
          </div>
          <div>
            <label class="block mb-1">Mnemonic</label>
            <input class="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700" bind:value={mnemonic} />
          </div>
          {#if error}
            <div class="text-red-400">{error}</div>
          {/if}
          <div class="flex justify-end gap-2">
            <button type="button" on:click={closeModal} class="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600">Cancel</button>
            <button type="submit" class="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  {/if}

  <style>
    :global(.modal-open) {
      overflow: hidden;
    }
  </style>