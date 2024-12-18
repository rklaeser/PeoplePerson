<script lang="ts">

  import { goto } from '$app/navigation';
  import type { Friend } from '$lib/types'; // Import the Friend interface
  import type { ActionResult } from '@sveltejs/kit';
  import { applyAction, deserialize } from '$app/forms';

  export let data: { people: Friend[] };

  function navigateToFriend(id: string) {
            query = '';
            goto(`/friend/${id}`);
        }
  let results: Friend[] = [];
  let query = '';
  let showDropdown = false;
  let groupId: string | null = null; // Optional group ID

  // Filter results based on query
  const search = () => {
    if (query.trim() === "") {
      results = [];
      showDropdown = false;
    } else {
      results = data.people.filter((friend) =>
        friend.name.toLowerCase().includes(query.toLowerCase())
      );
      showDropdown = true;
    }
  };

  const handleEnter = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      if (results.length === 1) {
        navigateToFriend(results[0].id);
      } else {
        search();
      }
    }
  };

  const closeDropdown = () => {
    setTimeout(() => {
      showDropdown = false; 
      query = '';
    }, 200);
  };

  const handleSubmit = async (event: Event) => {
    console.log('submitting');
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);

    try {
      const response = await fetch(form.action, {
        method: form.method,
        body: formData
      });
      const result: ActionResult = deserialize(await response.text());
      if (result.type === 'success') {
			// rerun all `load` functions, following the successful update
        if (result.data){
          navigateToFriend(result.data.id);
        }
		}
    } catch (error) {
      console.error('Error adding person:', error);
    }
  };

</script>

<div class="flex flex-col items-center justify-center p-8">
  <input
    type="text"
    placeholder="Search friends..."
    bind:value={query}
    on:input={search}
    on:keydown={handleEnter}
    on:blur={closeDropdown}
    
    class="w-64 p-3 border border-gray-300 rounded-lg shadow-sm mb-4"
  />
  {#if showDropdown && results.length > 0}
  <div class="absolute top-16 z-10 w-64 mt-6 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
    <table class="w-full">

      <tbody>
        {#each results as person}
          <tr>
            <td class="py-2 px-4 border-b border-gray-300">
              <button
                class="w-full text-left px-4 py-2 cursor-pointer hover:bg-blue-100"
                on:click={() => navigateToFriend(person.id)}
              >
                {person.name}
              </button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  {:else if showDropdown && results.length === 0}
  <div class="absolute top-16 z-10 w-64 mt-6 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
    <table class="w-full">
      <tbody>
        <tr>
          <td class="py-2 px-4 border-b border-gray-300">
            <button
              class="w-full text-left px-4 py-2 cursor-pointer hover:bg-red-100"
              
            >
              {query}
            </button>
          </td>
          <td>
            <form method="POST" action="?/create" on:submit={handleSubmit}>
              <input type="hidden" name="name" value={query}>
              {#if groupId}
                      <input type="hidden" name="groupId" value={groupId}> <!-- Conditionally include the group ID -->
              {/if}
              <button type="submit" class="bg-blue-500 text-white px-4 py-2 rounded">Create</button>
              </form>
          </td>
        </tr>
    </tbody>
  </table>
</div>
  {/if}

</div>
