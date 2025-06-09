<script lang="ts">
    import type { Group } from '$lib/types';
    import '@fortawesome/fontawesome-free/css/all.css';
    import { slide, fade } from 'svelte/transition';
    import { groups } from '$lib/stores/friends';
    import { goto } from '$app/navigation';
  
    export let isOpen = false;
  
    function closeModal() {
      isOpen = false;
    }
  
    // Close modal when pressing Escape
    function handleKeydown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        closeModal();
      }
    }

    function navigateToGroup(id: string) {
      goto(`/group/${id}`);
    }
  </script>
  
  <svelte:window on:keydown={handleKeydown} />
  
  {#if isOpen}
  <div
    class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-center"
    transition:fade={{ duration: 200 }}
  >
      <div
        class="w-full bg-gray-900 text-gray-100 rounded-t-3xl shadow-xl transform transition-transform duration-300 ease-out"
        style="height: 80vh;"
        transition:slide={{ duration: 300 }}
      >
        <div class="p-4 flex justify-between items-center border-b">
          <h2 class="text-2xl font-bold">Groups</h2>
          <button
            on:click={closeModal}
            class="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close"
          >
            <i class="fas fa-times text-gray-500"></i>
          </button>
        </div>
        <div class="overflow-auto" style="height: calc(80vh - 4rem);">
          <div class="divide-y divide-gray-700">
            {#each $groups as group}
              <div 
                class="flex gap-x-4 px-4 py-3 hover:bg-gray-800 cursor-pointer items-center"
                on:click={() => navigateToGroup(group.id)}
                on:keydown={event => { if (event.key === 'Enter' || event.key === ' ') navigateToGroup(group.id); }}
                tabindex="0"
                role="button"
              >
                <div class="flex items-center justify-between w-full gap-2">
                  <div class="flex items-center gap-2">
                    <i class="fas fa-users text-gray-400"></i>
                    <span>{group.name}</span>
                  </div>
                  <span class="text-sm text-gray-400">
                    {group.People?.length || 0} members
                  </span>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </div>
  {/if}
  
  <style>
    :global(.modal-open) {
      overflow: hidden;
    }
  </style> 