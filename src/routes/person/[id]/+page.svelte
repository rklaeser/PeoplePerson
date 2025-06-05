<script lang="ts">
  import { goto } from '$app/navigation';
  import '@fortawesome/fontawesome-free/css/all.css';
  import Associates from './Associates.svelte'; // Import the new Associates component
	import Status from './Status.svelte';
  import Location from './Location.svelte';
	import Groups from './Groups.svelte';
  import Body from './Body.svelte';
  import JournalEntries from './JournalEntries.svelte';
  import Birthday from './Birthday.svelte';
  import Mnemonic from './Mnemonic.svelte';
  import Name from './Name.svelte';
  import type { Friend, Group, Journal, Associate } from '$lib/types'; // Import the Friend interface


  export let data: { friend: Friend, 
                     associates: Associate[],
                     journals: Journal[],
                    groupData: Group[] };

  let isEditing = false;

  function toggleEdit() {
    isEditing = !isEditing;
  }

  function goBackWithModal() {
    goto('/?modal=open');
  }

 
</script>

<section>
  <button
    class="absolute top-4 left-4 z-10 bg-gray-800 text-white rounded-full p-2 hover:bg-gray-700"
    on:click={goBackWithModal}
    aria-label="Back to list"
  >
    <i class="fas fa-arrow-left"></i>
  </button>
  <div class="relative">
    <Name {data} {isEditing}/>
    <div class ="flex flex-col gap-4"> 
      <h1>Attributes</h1>
      <Status {data} {isEditing}/>
      <Birthday {data} {isEditing}/>
      <Mnemonic {data} {isEditing}/>
    </div>
    <div class="flex flex-col gap-2 mt-2">
      <h1>Associations</h1>
      <Groups {data} {isEditing}/>
      <Associates {data} {isEditing}/>
    </div>
    {#if isEditing}
      <button on:click={toggleEdit} class="absolute top-[140px] right-0 bg-blue-500 text-white px-6 py-3 text-lg rounded">Save</button>
    {:else}
    <button on:click={toggleEdit} class="absolute top-[140px] right-0 text-gray-500 px-6 py-3 text-lg" aria-label="Edit"><i class="fas fa-pencil-alt"></i></button>
    {/if}
    <Body {data}/>
    <JournalEntries {data}/>
  </div>
</section>



<style>
  section {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: left;
    flex: 0.1;
  }
</style>