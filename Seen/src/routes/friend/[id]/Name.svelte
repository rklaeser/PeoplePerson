<script lang="ts">
    export let data;
</script>

<div class="flex items-center justify-between mt-8">
    {#if data.friend.intent === 'romantic'}
    <h1 class="py-1 px-2 text-4xl">{data.friend.name}🌸</h1>
    {:else if data.friend.intent === 'core'}
    <h1 class="py-1 px-2 text-4xl">{data.friend.name}🌻</h1>
    {:else if data.friend.intent === 'archive'}
    <h1 class="py-1 px-2 text-4xl">{data.friend.name}🥀</h1>
    {:else if data.friend.intent === 'new'}
    <h1 class="py-1 px-2 text-4xl">{data.friend.name}🌰</h1>
    {:else if data.friend.intent === 'invest'}
    <h1 class="py-1 px-2  text-4xl">{data.friend.name}🌱</h1>
    {:else if data.friend.intent === 'associate'}
    <h1 class="py-1 px-2  text-4xl">{data.friend.name}👥</h1>
    {:else}
    <h1 class="py-1 px-2 text-4xl">{data.friend.name}❓</h1>
    {/if}
</div>