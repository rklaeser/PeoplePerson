<script lang=ts>

    export let data;
    export let isEditing;

  import counties from '$lib/stores/geojson-counties-fips.json'; // Adjust path as needed
  import type { FeatureCollection, Geometry } from 'geojson';

   // Explicitly type the imported JSON as a GeoJSON FeatureCollection
   const countiesData: FeatureCollection<Geometry> = counties as FeatureCollection<Geometry>;

// Extract county names from the GeoJSON data
const countyNames = countiesData.features
  .map(feature => feature.properties?.NAME)
  .filter(name => name != undefined);
</script>

{#if isEditing}
<div class="flex items-center gap-2 mb-2">
<form method="POST" action="?/updateCounty" class="flex items-center gap-2 mb-2"  on:change|preventDefault={event => event.currentTarget.submit()}>
    <input type="hidden" name="id" value={data.friend.id}>
    <label for="county"><i class="fa-solid fa-location-dot"></i></label>
    <input type="text" id="county" name="county" bind:value={data.friend.county} class="border px-2 py-1 mb-2" list="county-list">
    <datalist id="county-list">
      {#each countyNames as county}
        <option value={county}>{county}</option>
      {/each}
    </datalist>
  </form>
</div>
{:else}
    <p><i class="fa-solid fa-location-dot"></i> {data.friend.county}</p>
{/if}