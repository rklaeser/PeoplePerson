<script lang="ts">
    export let data;
    export let isEditing
</script>

{#if isEditing}
<form method="POST" action="?/updateMnemonic" class="flex items-center gap-2 mb-2" on:change|preventDefault={event => event.currentTarget.submit()}>
    <input type="hidden" name="id" value={data.friend.id}>
    <label for="mnemonic"><i class="fa-regular fa-lightbulb"></i></label>
    <input type="text" id="mnemonic" name="mnemonic" bind:value={data.friend.mnemonic} class="border px-2 py-1 mb-2" placeholder="Enter mnemonic">
  </form>
{:else}
    {#if data.friend.mnemonic}
    <p><i class="fa-regular fa-lightbulb"></i> {data.friend.mnemonic}</p>
    {/if}
{/if}