<script lang="ts">
	import { onMount } from 'svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import type L from 'leaflet';

	let mapPeople = $state<MapPerson[]>([]);
	let loading = $state(true);
	let error = $state('');
	let mapContainer: HTMLDivElement;
	let map: L.Map | null = null;

	interface MapPerson {
		id: string;
		name: string;
		latitude: number;
		longitude: number;
		location_source: string;
	}

	async function fetchMapData() {
		loading = true;
		error = '';

		try {
			const token = await authStore.getIdToken();
			if (!token) throw new Error('Not authenticated');

			const response = await fetch('/api/people/map-data', {
				headers: {
					Authorization: `Bearer ${token}`
				}
			});

			if (!response.ok) {
				throw new Error(`Failed to fetch: ${response.statusText}`);
			}

			mapPeople = await response.json();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load map data';
			console.error('Error fetching map data:', e);
		} finally {
			loading = false;
		}
	}

	async function initMap() {
		// Dynamically import Leaflet (client-side only)
		const L = await import('leaflet');
		await import('leaflet/dist/leaflet.css');

		// Fix for default marker icons in Leaflet with Vite
		const iconRetinaUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
		const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
		const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

		const DefaultIcon = L.icon({
			iconRetinaUrl,
			iconUrl,
			shadowUrl,
			iconSize: [25, 41],
			iconAnchor: [12, 41],
			popupAnchor: [1, -34],
			shadowSize: [41, 41]
		});

		L.Marker.prototype.options.icon = DefaultIcon;

		// Determine initial center
		let center: [number, number] = [39.8283, -98.5795]; // Default: center of US
		let zoom = 4;

		// Try to get user's geolocation
		if ('geolocation' in navigator && mapPeople.length === 0) {
			try {
				const position = await new Promise<GeolocationPosition>((resolve, reject) => {
					navigator.geolocation.getCurrentPosition(resolve, reject, {
						timeout: 5000,
						maximumAge: 300000
					});
				});
				center = [position.coords.latitude, position.coords.longitude];
				zoom = 12;
			} catch (e) {
				console.log('Geolocation not available, using default center');
			}
		}

		// Initialize map
		map = L.map(mapContainer, {
			zoomControl: false
		}).setView(center, zoom);

		// Add tile layer (using CARTO light theme)
		L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
			attribution:
				'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
			maxZoom: 20
		}).addTo(map);

		// Add zoom control to top right
		L.control.zoom({ position: 'topright' }).addTo(map);

		// Add markers
		updateMarkers(L);
	}

	function updateMarkers(L: typeof import('leaflet')) {
		if (!map) return;

		// Clear existing markers
		map.eachLayer((layer) => {
			if (layer instanceof L.Marker) {
				map!.remove(layer);
			}
		});

		if (mapPeople.length === 0) return;

		// Add markers for each person
		const markers: L.Marker[] = [];
		mapPeople.forEach((person) => {
			const marker = L.marker([person.latitude, person.longitude])
				.addTo(map!)
				.bindPopup(
					`<div class="p-2">
						<h3 class="font-semibold text-lg mb-2">${person.name}</h3>
						<button
							onclick="window.location.href='/people?person=${person.id}'"
							class="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
						>
							View Profile
						</button>
					</div>`,
					{ maxWidth: 300 }
				);
			markers.push(marker);
		});

		// Auto-fit bounds to show all markers
		if (markers.length > 0) {
			const group = L.featureGroup(markers);
			map.fitBounds(group.getBounds(), { padding: [50, 50], maxZoom: 12 });
		}
	}

	onMount(() => {
		fetchMapData();

		return () => {
			// Cleanup map on unmount
			if (map) {
				map.remove();
				map = null;
			}
		};
	});

	// Initialize map once data is loaded and container is available
	$effect(() => {
		if (!loading && !error && mapPeople.length > 0 && mapContainer && !map) {
			initMap();
		}
	});

	// Watch for changes in people data
	$effect(() => {
		if (map && !loading) {
			import('leaflet').then((L) => updateMarkers(L));
		}
	});
</script>

<Sidebar />

<div class="ml-16 flex flex-col h-screen bg-gray-50">
	{#if loading}
		<div class="flex items-center justify-center h-full">
			<div class="text-center text-gray-500">
				<p class="text-lg">Loading map...</p>
			</div>
		</div>
	{:else if error}
		<div class="flex items-center justify-center h-full">
			<div class="text-center">
				<div class="text-red-600 mb-4">Error loading map</div>
				<p class="text-gray-600">{error}</p>
			</div>
		</div>
	{:else if mapPeople.length === 0}
		<div class="flex items-center justify-center h-full">
			<div class="text-center text-gray-500">
				<div class="text-6xl mb-4">🗺️</div>
				<p class="text-lg mb-2">No locations to display</p>
				<p class="text-sm">Add addresses to people to see them on the map</p>
			</div>
		</div>
	{:else}
		<div class="relative w-full h-full">
			<!-- Map Container -->
			<div bind:this={mapContainer} class="absolute inset-0 z-0"></div>

			<!-- Info Badge -->
			<div class="absolute top-4 right-20 z-[1000] bg-white/90 px-4 py-2 rounded-lg shadow-md">
				<span class="text-sm font-medium text-gray-700">
					{mapPeople.length} {mapPeople.length === 1 ? 'location' : 'locations'}
				</span>
			</div>
		</div>
	{/if}
</div>

<style>
	:global(.leaflet-container) {
		font-family: inherit;
	}

	:global(.leaflet-popup-content-wrapper) {
		border-radius: 8px;
	}

	:global(.leaflet-popup-content) {
		margin: 0;
	}
</style>
