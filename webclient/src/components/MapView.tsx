import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useMapData } from '../hooks/api-hooks'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-react'
import { useUIStore } from '@/stores/ui-store'

// Fix for default marker icons in Leaflet
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
})

L.Marker.prototype.options.icon = DefaultIcon

interface MapPerson {
  id: string
  name: string
  latitude: number
  longitude: number
  location_source: string
}

// Component to auto-fit bounds to markers
function AutoFitBounds({ people }: { people: MapPerson[] }) {
  const map = useMap()

  useEffect(() => {
    if (people.length > 0) {
      const bounds = L.latLngBounds(
        people.map(p => [p.latitude, p.longitude])
      )
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 })
    }
  }, [people, map])

  return null
}

export function MapView() {
  const { data: mapData = [] } = useMapData()
  const navigate = useNavigate()
  const { toggleHamburgerMenu, defaultLocation, hamburgerMenuOpen } = useUIStore()

  // State for map center - defaults to center of US
  const [mapCenter, setMapCenter] = useState<[number, number]>([39.8283, -98.5795])
  const [locationLoaded, setLocationLoaded] = useState(false)

  // Get user's current location on mount (only if no settings location)
  useEffect(() => {
    // Priority 1: Use settings location if available
    if (defaultLocation) {
      console.log('Using settings location:', defaultLocation.city, defaultLocation.state)
      setMapCenter([defaultLocation.lat, defaultLocation.lng])
      setLocationLoaded(true)
      return
    }

    // Priority 2: Try geolocation
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('Got user location:', position.coords.latitude, position.coords.longitude)
          setMapCenter([position.coords.latitude, position.coords.longitude])
          setLocationLoaded(true)
        },
        (error) => {
          console.log('Geolocation error, using default center (US):', error.message)
          // Keep default center [39.8283, -98.5795]
          setLocationLoaded(true)
        },
        {
          timeout: 5000,
          maximumAge: 300000, // Cache for 5 minutes
        }
      )
    } else {
      console.log('Geolocation not supported by browser, using default center')
      setLocationLoaded(true)
    }
  }, [defaultLocation])

  const handleMarkerClick = (personId: string) => {
    navigate({ to: `/people/${personId}` })
  }

  // Don't render map until we've attempted to get location
  if (!locationLoaded) {
    console.log('Map waiting for location to load...')
    return (
      <div className="relative h-full flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p className="text-lg">Loading map...</p>
        </div>
      </div>
    )
  }

  console.log('Map rendering with center:', mapCenter, 'mapData length:', mapData.length)

  if (mapData.length === 0) {
    return (
      <div className="relative h-full flex items-center justify-center">
        {/* Floating hamburger menu button - hidden when menu is open */}
        {!hamburgerMenuOpen && (
          <Button
            size="icon"
            variant="ghost"
            onClick={toggleHamburgerMenu}
            title="Menu"
            className="absolute top-4 left-4 z-10 bg-white/90 hover:bg-white/100 shadow-md"
          >
            <Menu size={20} />
          </Button>
        )}

        {/* Empty state */}
        <div className="text-center text-gray-500">
          <p className="text-lg mb-2">No locations to display</p>
          <p className="text-sm">Add addresses to people or tags to see them on the map</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      {/* Floating hamburger menu button - hidden when menu is open */}
      {!hamburgerMenuOpen && (
        <Button
          size="icon"
          variant="ghost"
          onClick={toggleHamburgerMenu}
          title="Menu"
          className="absolute top-4 left-4 z-[1000] bg-white/90 hover:bg-white/100 shadow-md"
        >
          <Menu size={20} />
        </Button>
      )}

      <MapContainer
        key={`${mapCenter[0]}-${mapCenter[1]}`}
        center={mapCenter}
        zoom={12}
        style={{ height: '100%', width: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        className="z-0"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        <ZoomControl position="topright" />

        <AutoFitBounds people={mapData} />

      {mapData.map((person) => (
        <Marker
          key={person.id}
          position={[person.latitude, person.longitude]}
          eventHandlers={{
            click: () => handleMarkerClick(person.id)
          }}
        >
          <Popup>
            <div className="p-2">
              <h3 className="font-semibold text-lg mb-2">{person.name}</h3>

              <div className="text-xs text-gray-600 mb-3">
                Location: {formatLocationSource(person.location_source)}
              </div>

              <button
                onClick={() => handleMarkerClick(person.id)}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                View Profile
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
      </MapContainer>
    </div>
  )
}

function formatLocationSource(source: string): string {
  if (source === 'personal') return 'Personal address'
  if (source.startsWith('tag:')) return `From tag: ${source.slice(4)}`
  if (source.startsWith('zip:')) return `Zip code: ${source.slice(4)}`
  return source
}
