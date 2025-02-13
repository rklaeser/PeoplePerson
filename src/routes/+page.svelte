
<script lang="ts">

import type { Friend } from '$lib/types'; // Import the Friend interface
import '@fortawesome/fontawesome-free/css/all.css';


export let data: { people: Friend[], groups: Group[] };


  //export let data: { people: { id: string; name: string, intent: string, county: string }[] };

	import counties from '$lib/stores/geojson-counties-fips.json'; // Adjust path as needed
	import type { FeatureCollection, Geometry } from 'geojson';

  import { MapLibre, GeoJSON, FillLayer, MapEvents} from 'svelte-maplibre';
  import type { LngLat, MapMouseEvent } from 'maplibre-gl';
	import Table from '../lib/components/Table.svelte';

  const countiesData: FeatureCollection<Geometry> = counties as FeatureCollection<Geometry>;
    const friendsCounties = data.people.reduce((acc, friend) => {
      acc[friend.county] = (acc[friend.county] || 0) + 1;
      return acc;
  }, {} as Record<string, number>);

  // Function to determine the color based on the count of friends
  function getColor(count: number): string {
    if (count === 0) return '#d3d3d3'; // Light gray for 0 friends
    if (count <= 5) return '#add8e6'; // Light blue for 1-5 friends
    if (count <= 10) return '#87ceeb'; // Sky blue for 6-10 friends
    if (count <= 20) return '#4682b4'; // Steel blue for 11-20 friends
    return '#0000ff'; // Blue for 21+ friends
  }

  // Create an object that maps county names to colors
  const countyColors = Object.keys(friendsCounties).reduce((acc, county) => {
    acc[county] = getColor(friendsCounties[county]);
    return acc;
  }, {} as Record<string, string>);
	
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


<svelte:head>
	<title>Friend Ship</title>
	<meta name="description" content="Friend Ship app" />
</svelte:head>
<div class="z-0">
<MapLibre 
  center={[-121.5,38.35]}
  zoom={7}
  class="map"
  standardControls
  style="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
  cooperativeGestures
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
            ['in', ['get', 'NAME'], ['literal', Object.keys(friendsCounties)]],
            '#4682b4', // Color for counties with friends
            '#888888'  // Default color
          ],
          ['==', ['get', 'NAME'], selectedCounty],
          '#4682b4', // Color for the selected county
          '#888888'  // Default color for other counties
        ],
        'fill-opacity': 0.5,
      }}
      beforeLayerType="symbol"
      manageHoverState
    />
  </GeoJSON>
</MapLibre>
</div>

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
