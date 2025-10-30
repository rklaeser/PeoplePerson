import { GOOGLE_MAPS_API_KEY } from '$env/static/private';

// Using Google Places API for better accuracy
// Get API key from: https://console.cloud.google.com/apis/credentials
// Enable "Places API" in your Google Cloud project
const GOOGLE_API_KEY = GOOGLE_MAPS_API_KEY;

// Debug logging
if (GOOGLE_API_KEY) {
	console.log('✓ Google Maps API key loaded, using Google Places API');
} else {
	console.log('✗ No Google Maps API key found - geocoding will fail');
	console.log('  Set GOOGLE_MAPS_API_KEY in .env file');
}

export interface GeocodeResult {
	latitude: number;
	longitude: number;
	formattedAddress?: string;
}

/**
 * Geocode an address to latitude/longitude coordinates
 * @param address Full address object
 * @returns GeocodeResult with coordinates or null if geocoding fails
 */
/**
 * Geocode using Google Places API (New) Text Search
 * More accurate than Geocoding API, especially for specific buildings
 */
async function geocodeWithPlacesAPI(addressString: string): Promise<GeocodeResult | null> {
	try {
		const url = 'https://places.googleapis.com/v1/places:searchText';

		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-Goog-Api-Key': GOOGLE_API_KEY!,
				'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location'
			},
			body: JSON.stringify({
				textQuery: addressString
			})
		});

		const data = await response.json();

		if (!data.places || data.places.length === 0) {
			console.log('Places API (new) found no results for:', addressString);
			return null;
		}

		const place = data.places[0];
		const location = place.location;

		if (!location || !location.latitude || !location.longitude) {
			console.log('Places API result missing location');
			return null;
		}

		return {
			latitude: location.latitude,
			longitude: location.longitude,
			formattedAddress: place.formattedAddress || addressString
		};
	} catch (error) {
		console.error('Error with Places API:', error);
		return null;
	}
}

/**
 * Fallback to Geocoding API if Places API fails
 */
async function geocodeWithGeocodingAPI(addressString: string): Promise<GeocodeResult | null> {
	try {
		const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
		url.searchParams.set('address', addressString);
		url.searchParams.set('key', GOOGLE_API_KEY!);

		const response = await fetch(url.toString());
		const data = await response.json();

		if (data.status !== 'OK' || !data.results || data.results.length === 0) {
			console.log('Geocoding API found no results for:', addressString);
			return null;
		}

		const result = data.results[0];
		const location = result.geometry?.location;

		if (!location || !location.lat || !location.lng) {
			console.log('Geocoding API result missing location');
			return null;
		}

		return {
			latitude: location.lat,
			longitude: location.lng,
			formattedAddress: result.formatted_address
		};
	} catch (error) {
		console.error('Error with Geocoding API:', error);
		return null;
	}
}

export async function geocodeAddress(address: {
	streetAddress?: string | null;
	city?: string | null;
	state?: string | null;
	zip?: string | null;
}): Promise<GeocodeResult | null> {
	try {
		// Check if API key is configured
		if (!GOOGLE_API_KEY) {
			console.error('Geocoding failed: Google Maps API key not configured');
			return null;
		}

		// Build address string from components
		const addressParts: string[] = [];

		if (address.streetAddress) addressParts.push(address.streetAddress);
		if (address.city) addressParts.push(address.city);
		if (address.state) addressParts.push(address.state);
		if (address.zip) addressParts.push(address.zip);

		// Need at least city or zip to geocode
		if (addressParts.length === 0) {
			console.log('No address components provided for geocoding');
			return null;
		}

		const addressString = addressParts.join(', ');
		console.log('Geocoding address:', addressString);

		// Try Places API first (more accurate)
		let result = await geocodeWithPlacesAPI(addressString);

		// Fall back to Geocoding API if Places API fails
		if (!result) {
			console.log('Places API failed, trying Geocoding API...');
			result = await geocodeWithGeocodingAPI(addressString);
		}

		if (result) {
			console.log('Geocoded successfully:', {
				address: addressString,
				lat: result.latitude,
				lng: result.longitude,
				formatted: result.formattedAddress
			});
		} else {
			console.log('All geocoding methods failed for:', addressString);
		}

		return result;
	} catch (error) {
		console.error('Error geocoding address:', error);
		return null;
	}
}

/**
 * Check if geocoding is needed based on address and coordinate data
 */
export function shouldGeocode(data: {
	streetAddress?: string | null;
	city?: string | null;
	state?: string | null;
	zip?: string | null;
	latitude?: number | null;
	longitude?: number | null;
}): boolean {
	// Don't geocode if coordinates are already provided
	if (data.latitude !== undefined || data.longitude !== undefined) {
		return false;
	}

	// Geocode if any address components are provided
	return !!(data.streetAddress || data.city || data.state || data.zip);
}
