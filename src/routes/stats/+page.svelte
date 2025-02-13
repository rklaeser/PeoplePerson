<script lang="ts">
	import { intentImages } from '$lib/images/intentImages';
    import fallbackImage from '$lib/images/github.svg';

    export let data: { intents: { intent: string; count: number, recentCount: number }[] };

  // You can use the data in your component
  let intents = data.intents;
</script>

<main>
  <h1>Statistics</h1>
  
  <ul>
    {#each intents as { intent, count, recentCount }}
      <li class="flex items-center justify-center mb-4">
        <div class= "flex flex-col items-center"> 
            <span class="text-lg">{count}</span>
            <h3>Total</h3>
        </div>
        
        <div class="flex flex-col items-center justify-center ml-10 mr-10">
        <img
        src={intentImages[intent] || fallbackImage}
        alt={intent}
        class="inline-block w-28 h-28 align-middle"
        />
        <h2 class="text-center">{intent}</h2>
        </div>
        <div class= "flex flex-col items-center"> 
            <span class="text-lg">{recentCount}</span>
            <h3>Last week</h3>
        </div>
      </li>
    {/each}
  </ul>
</main>
