<script lang="ts">
  export let data;
  export let isEditing;
</script>

{#if isEditing}
  <form method="POST" action="?/updateStatus" class="flex items-center gap-2 mb-2" on:change|preventDefault={event => event.currentTarget.submit()}>
    <input type="hidden" name="id" value={data.friend.id}>
    <label for="status"><i class="fa-solid fa-seedling"></i></label>
    <select id="intent" name="intent" bind:value={data.friend.intent} class="border px-2 py-1">
      <option value="new">New</option>
      <option value="invest">Invest</option>
      <option value="core">Core</option>
      <option value="romantic">Romantic</option>
      <option value="archive">Archive</option>
      <option value="associate">Associate</option>        
    </select>
  </form>
{:else}
  <p><i class="fa-solid fa-seedling"></i> {data.friend.intent}</p>
{/if}