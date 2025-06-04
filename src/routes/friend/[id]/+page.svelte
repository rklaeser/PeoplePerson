<script lang="ts">
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

  console.log('Friend Data:', data);

  let isEditing = false;

  function toggleEdit() {
    isEditing = !isEditing;
  }

 
</script>

<section>
  <div class="relative">
    
    <Name {data} {isEditing}/>
  <div class ="flex flex-col gap-4"> 
    <h1>Attributes</h1>
    <Status {data} {isEditing}/>
    <Location {data} {isEditing}/>
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