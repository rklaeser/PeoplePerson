<script lang=ts>
    import { goto } from '$app/navigation';
	import type { Friend, Group } from '$lib/types'; // Import the Friend interface
	import { intentImages } from '$lib/images/intentImages';
    import fallbackImage from '$lib/images/github.svg';
    import ProfilePic from '$lib/components/ProfilePic.svelte';
    import { friends, groups, archivedPeople } from '$lib/stores/friends';

      let newName = '';
      let newIntent = 'new';
      
      let selectedStatus = '';
	  let selectedGroup = '';
	  let sortField: 'name' | 'createdAt' | 'updatedAt' = 'name';
	  let sortDirection: 'asc' | 'desc' = 'asc';

	  export let groupId: string | null = null; // Optional group ID
	  
      let showArchived = false;

      function navigateToFriend(id: string) {
            goto(`/person/${id}`);
        }

function handleSort(field: 'name' | 'createdAt' | 'updatedAt') {
	if (sortField === field) {
		sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
	} else {
		sortField = field;
		sortDirection = 'asc';
	}
}

async function handleDelete(event: Event) {
	event.preventDefault();
	const form = event.target as HTMLFormElement;
	const formData = new FormData(form);
	const response = await fetch(form.action, {
	  method: form.method,
	  body: formData
	});
	window.location.href = '/';
  }

  $: filteredPeople = $friends.filter((person) => {
    const statusMatch = selectedStatus === '' || person.intent === selectedStatus;
    // Update group filtering to work with Groups array
    const groupMatch = selectedGroup === '' || 
      (person.Groups && person.Groups.some(group => group.id === selectedGroup));
    return statusMatch && groupMatch;
  })
  .sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'createdAt':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case 'updatedAt':
        comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        break;
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Group people by group when "All" is selected
  $: groupedPeople = selectedGroup === '' 
    ? filteredPeople.reduce((acc, person) => {
        // Handle the Groups array - get the first group name or default to 'No Group'
        const groupName = person.Groups && person.Groups.length > 0 
          ? person.Groups[0].name 
          : 'No Group';
        if (!acc[groupName]) {
          acc[groupName] = [];
        }
        acc[groupName].push(person);
        return acc;
      }, {} as Record<string, Friend[]>)
    : { '': filteredPeople };

  // Sort groups by name for consistent display
  $: sortedGroupNames = selectedGroup === '' 
    ? Object.keys(groupedPeople).sort()
    : [''];


</script>

<div class="w-full">
    <div class="border-b border-gray-300 shadow-md overflow-hidden">
        <div class="flex justify-center gap-x-4 px-4 py-3 text-white">
            <div class="flex items-center gap-2">
                    <span>Sort:</span>
                    <select 
                        bind:value={sortField} 
                        class="py-1 px-2 border border-gray-300 rounded"
                        on:change={() => sortDirection = 'asc'}
                    >
                        <option value="name">Name (A-Z)</option>
                        <option value="createdAt">Last Created</option>
                        <option value="updatedAt">Last Edited</option>
                    </select>
                    <button 
                        class="p-1 hover:text-blue-600 transition-colors"
                        aria-label="Sort"
                        on:click={() => sortDirection = sortDirection === 'asc' ? 'desc' : 'asc'}
                    >
                        <i class="fas fa-sort-{sortDirection === 'asc' ? 'up' : 'down'}"></i>
                    </button>
            </div>
            <div class="flex items-center gap-2">
                <span>Status:</span>
                <select bind:value={selectedStatus} class="py-1 px-2 border border-gray-300 rounded">
                    <option value="">All</option>
                    <option value="romantic">Romantic</option>
                    <option value="core">Core</option>
                    <option value="archive">Archive</option>
                    <option value="new">New</option>
                    <option value="invest">Invest</option>
                    <option value="associate">Associate</option>
                </select>
            </div>
            <div class="flex items-center gap-2">
                <span>Group:</span>
                <select bind:value={selectedGroup} class="py-1 px-2 border border-gray-300 rounded">
                    <option value="">All</option>
                    {#each $groups as group}
                        <option value={group.id}>{group.name}</option>
                    {/each}
                </select>
            </div>
            {#if sortField === 'createdAt'}
                <div class="w-[140px]"></div>
            {:else if sortField === 'updatedAt'}
                <div class="w-[140px]"></div>
            {/if}
            <div class="w-12"></div>
        </div>
        <div>
            {#each sortedGroupNames as groupName}
                {#if selectedGroup === ''}
                    <!-- Group Header -->
                    <div class="bg-gray-200 px-4 py-2 font-semibold text-gray-700 border-b border-gray-300 sticky top-0">
                        {groupName} ({groupedPeople[groupName].length})
                    </div>
                {/if}
                {#each groupedPeople[groupName] as person}
                    <div class="flex gap-x-4 px-4 py-2 border-b border-gray-300 hover:bg-gray-600 cursor-pointer items-center"
                    aria-label={`View ${person.name}'s profile`}
                        on:click={() => navigateToFriend(person.id)}
                        on:keydown={event => { if (event.key === 'Enter' || event.key === ' ') navigateToFriend(person.id); }}
                        tabindex="0"
                        role="button"
                        >
                        <div class="flex items-center justify-between w-full gap-2">
                            <div class="flex items-center gap-2">
                                <ProfilePic index={person.profile_pic_index} size={64} />
                                <span>{person.name}</span>
                            </div>
                        </div>
                        {#if sortField === 'createdAt'}
                            <div class="text-sm text-gray-600 w-[140px]">
                                {new Date(person.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                            </div>
                        {:else if sortField === 'updatedAt'}
                            <div class="text-sm text-gray-600 w-[140px]">
                                {new Date(person.updatedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                            </div>
                        {/if}
                        <div class="w-12">
                            <form method="POST" action="?/delete" on:submit={handleDelete}>
                                <input type="hidden" name="id" value={person.id}>
                                <input type="hidden" name="name" value={person.name}>
                                <button type="submit" class="text-gray-500 px-2 py-1" aria-label="Delete person">
                                    <i class="fa-solid fa-trash"></i>
                                </button>
                            </form>
                        </div>
                    </div>
                {/each}
            {/each}
            {#if $friends.length === 0}
                <div class="flex gap-x-4 px-4 py-2 text-center text-gray-500">
                    <div class="w-full">No data available</div>
                </div>
            {/if}
        </div>
    </div>
</div>

<!-- Archived People Section -->
<div class="mt-4">
    <button 
        class="w-full px-4 py-2 bg-gray-800 text-gray-300 hover:bg-gray-700 flex items-center justify-between"
        on:click={() => showArchived = !showArchived}
    >
        <span>Archived People ({$archivedPeople.length})</span>
        <i class="fas fa-chevron-{showArchived ? 'up' : 'down'}"></i>
    </button>
    
    {#if showArchived}
        <div class="border-b border-gray-300 shadow-md overflow-hidden">
            {#each $archivedPeople as person}
                <div class="flex gap-x-4 px-4 py-2 border-b border-gray-300 hover:bg-gray-600 cursor-pointer items-center"
                    aria-label={`View ${person.name}'s profile`}
                    on:click={() => navigateToFriend(person.id)}
                    on:keydown={event => { if (event.key === 'Enter' || event.key === ' ') navigateToFriend(person.id); }}
                    tabindex="0"
                    role="button"
                >
                    <div class="flex items-center justify-between w-full gap-2">
                        <div class="flex items-center gap-2">
                            <ProfilePic index={person.profile_pic_index} size={64} />
                            <span>{person.name}</span>
                        </div>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>