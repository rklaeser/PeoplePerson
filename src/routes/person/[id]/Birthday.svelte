<script lang="ts">
    export let data;
    export let isEditing
</script>

{#if isEditing}
<form method="POST" action="?/updateBirthday" class="flex items-center gap-2 mb-2" on:change|preventDefault={event => event.currentTarget.submit()}>
    <input type="hidden" name="id" value={data.friend.id}>
    <label for="birthday"><i class="fa-solid fa-cake-candles"></i></label>
    <input type="date" id="birthday" name="birthday" bind:value={data.friend.birthday} class="border px-2 py-1 mb-2">
  </form>
{:else}
    {#if data.friend.birthday}
    <p><i class="fa-solid fa-cake-candles"></i> {data.friend.birthday}</p>
    {/if}
{/if}