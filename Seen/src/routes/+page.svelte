
<script lang="ts">

import type { Friend } from '$lib/types'; // Import the Friend interface


export let data: { people: Friend[], groups: Group[] };


  //export let data: { people: { id: string; name: string, intent: string, county: string }[] };

	import counties from '$lib/stores/geojson-counties-fips.json'; // Adjust path as needed
	import type { FeatureCollection, Geometry } from 'geojson';

  import { MapLibre, GeoJSON, FillLayer, MapEvents} from 'svelte-maplibre';
  import type { LngLat, MapMouseEvent } from 'maplibre-gl';
	import Table from '../lib/components/Table.svelte';

  const countiesData: FeatureCollection<Geometry> = counties as FeatureCollection<Geometry>;
  const friendsCounties = new Set(data.people.map(friend => friend.county));
	
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

  let selectedCounty = '';

  function deselectCounty() {
    selectedCounty = '';
  }

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

{#if selectedCounty}
  <button on:click={deselectCounty} class="absolute top-44 right-8 bg-red-500 text-white px-4 py-2 rounded">
    Deselect County
  </button>
{/if}

<section>
	<Table people={data.people} groups={data.groups} {selectedCounty}/>
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
