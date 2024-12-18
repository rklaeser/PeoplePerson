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

  let isEditing = false;

  function toggleEdit() {
    isEditing = !isEditing;
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
 
</script>

<section>
  <div class="relative">
    <form method="POST" action="?/delete" on:submit={handleDelete}>
      <input type="hidden" name="id" value={data.friend.id}>
      <input type="hidden" name="name" value={data.friend.name}>
      <button type="submit" class="text-gray-500 px-6 py-3" aria-label="Delete person"><i class="fa-solid fa-trash"></i></button>
    </form>
    <Name {data}/>
  <div class ="flex gap-4"> 
    <Status {data} {isEditing}/>
    <Location {data} {isEditing}/>
    <Birthday {data} {isEditing}/>
    <Mnemonic {data} {isEditing}/>
  </div>
  <div class="flex flex-col gap-2 mt-2">
    <Groups {data} {isEditing}/>
    <Associates {data} {isEditing}/>
  </div>
  {#if isEditing}
    <button on:click={toggleEdit} class="absolute top-[60px] right-0 bg-blue-500 text-white px-6 py-3 text-lg rounded">Save</button>
  {:else}
  <button on:click={toggleEdit} class="absolute top-[60px] right-0 text-gray-500 px-6 py-3 text-lg" aria-label="Edit"><i class="fas fa-pencil-alt"></i></button>
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