
<script lang="ts">
	import { goto } from '$app/navigation';
    export let data: { people: { id: string; name: string, intent: string, county: string }[] };

	import counties from '$lib/stores/geojson-counties-fips.json'; // Adjust path as needed
	import type { FeatureCollection, Geometry } from 'geojson';

  import { MapLibre, GeoJSON, FillLayer, MapEvents} from 'svelte-maplibre';
  import type { LngLat, MapMouseEvent } from 'maplibre-gl';
  const countiesData: FeatureCollection<Geometry> = counties as FeatureCollection<Geometry>;
  const friendsCounties = new Set(data.people.map(friend => friend.county));
  console.log('friendsCounties:', Array.from(friendsCounties));


	function navigateToFriend(id: string) {
    goto(`/friend/${id}`);
  }
  function handleMapClick(e: MapMouseEvent) {
    const map = e.target;
    const features = map.queryRenderedFeatures(e.point, {
      layers: ['counties-layer'] // Adjust layer name as needed
    });

    if (features.length > 0) {
      const county = features[0].properties.NAME; // Adjust property name as needed
      selectedCounty = county;
    } else{
	  selectedCounty = '';
	}
  }

  let newName = '';
  let newIntent = 'new';
  let searchQuery = '';
  let selectedStatus = '';
  let selectedCounty = '';
  let filteredFriends = data.people;

  $: filteredFriends = data.people.filter(friend =>
    friend.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (selectedStatus === '' || friend.intent === selectedStatus) &&
	(selectedCounty === '' || friend.county === selectedCounty)

  );

</script>

<link rel="stylesheet" href="/src/tailwind.css" />

<svelte:head>
	<title>Friend Ship</title>
	<meta name="description" content="Friend Ship app" />
</svelte:head>

<MapLibre 
  center={[-121.5,38.35]}
  zoom={7}
  class="map"
  standardControls
  style="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
  >
  <MapEvents onclick={handleMapClick} />
  <GeoJSON id="states" data={countiesData} promoteId="STATEFP">
      <FillLayer
	  id="counties-layer"
	  paint={{
        'fill-color': [
          'case',
          ['==', selectedCounty, ''],
          ['case',
            ['in', ['get', 'NAME'], ['literal', Array.from(friendsCounties)]],
            '#ff0000', // Color for counties with friends
            '#888888'  // Default color
          ],
          ['==', ['get', 'NAME'], selectedCounty],
          '#ff0000', // Color for the selected county
          '#888888'  // Default color for other counties
        ],
        'fill-opacity': 0.5,
      }}
        beforeLayerType="symbol"
        manageHoverState
      />
  </GeoJSON>

</MapLibre>

<section>
	<input
    type="text"
    placeholder="Search friends..."
    bind:value={searchQuery}
    class="border px-2 py-1 mb-4 w-full"
  />
  <select bind:value={selectedStatus} class="border px-2 py-1 mb-4 w-full">
    <option value="">All Statuses</option>
    <option value="romantic">Romantic</option>
    <option value="core">Core</option>
    <option value="archive">Archive</option>
    <option value="new">New</option>
    <option value="invest">Invest</option>
    <option value="associate">Associate</option>
  </select>
	<table class="min-w-full bg-white border border-gray-300 shadow-md rounded-lg overflow-hidden">
		<thead class="bg-gray-200">
			<tr class="text-left text-gray-600">
				<th class="py-3 px-4 border-b border-gray-300">Status</th>
				<th class="py-3 px-4 border-b border-gray-300">Name</th>
				<th class="py-3 px-4 border-b border-gray-300"></th>
			</tr>
		</thead>
		<tbody>
			<tr>
				<td class="py-2 px-4 border-b border-gray-300">
				  <select bind:value={newIntent} class="border px-2 py-1 mb-2">
					<option value="romantic">Romantic</option>
					<option value="core">Core</option>
					<option value="archive">Archive</option>
					<option value="new">New</option>
					<option value="invest">Invest</option>
				  </select>
				</td>
				<td class="py-2 px-4 border-b border-gray-300">
				  <input type="text" bind:value={newName} class="border px-2 py-1 mb-2" placeholder="Enter name" />
				</td>
				<td class="py-2 px-4 border-b border-gray-300">
				  <form method="POST" action="?/create">
					<input type="hidden" name="name" value={newName}>
					<input type="hidden" name="intent" value={newIntent}>
					<button type="submit" class="bg-green-500 text-white px-4 py-2 rounded">Create</button>
				  </form>
				</td>
			  </tr>
			{#each filteredFriends as person}
			<tr class="hover:bg-gray-100 cursor-pointer" on:click={() => navigateToFriend(person.id)}>
				{#if person.intent === 'romantic'}
				<td class="py-2 px-4 border-b border-gray-300">🌸</td>
			  {:else if person.intent === 'core'}
				<td class="py-2 px-4 border-b border-gray-300">🌻</td>
			  {:else if person.intent === 'archive'}
				<td class="py-2 px-4 border-b border-gray-300">🥀</td>
			  {:else if person.intent === 'new'}
				<td class="py-2 px-4 border-b border-gray-300">🌰</td>
			  {:else if person.intent === 'invest'}
				<td class="py-2 px-4 border-b border-gray-300">🌱</td>
			  {:else}
				<td class="py-2 px-4 border-b border-gray-300">❓</td>
			  {/if}
			<td class="py-2 px-4 border-b border-gray-300">{person.name}</td>
			<td class="py-2 px-4 border-b border-gray-300">
			  <form method="POST" action="?/delete">
				<input type="hidden" name="id" value={person.id}>
				<input type="hidden" name="name" value={person.name}>
				<button type="submit" class="bg-red-500 text-white px-4 py-2 rounded">Delete</button>
			  </form>
			</td>
			</tr>
			{/each}
			{#if data.people.length === 0}
				<tr>
					<td colspan="2" class="text-center py-2 text-gray-500">No data available</td>
				</tr>
			{/if}
		</tbody>
	</table>
</section>

<style>
	section {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		flex: 0.6;
	}
	:global(.map) {
    height: 500px;
  }
</style>
