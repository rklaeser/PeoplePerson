# Map View Feature

**Goal:** Add a map view to visualize where people are located, using a smart location hierarchy
**Timeline:** 3-5 days
**Complexity:** Medium
**Tech Stack:** React Leaflet, geopy/Nominatim, PostgreSQL

## Core Concept

Add location data to people and tags, then display them on a map with a smart hierarchy:

**Location Priority:**
1. **Person's personal address** (if set) → highest priority
2. **Tag-based address** (e.g., "Climbing Gym" tag has gym address) → fallback
3. **Zip code only** → minimal location data

**Key Benefits:**
- No redundant data entry (tag "Noise Bridge" has one address, all tagged people inherit it)
- Personal addresses override tag locations when both exist
- Clear UI indication of location source ("Personal" vs "from tag: Climbing Gym")

---

## User Stories

1. **As a user**, I want to add addresses to people so I can see where they live on a map
2. **As a user**, I want tags to have addresses (e.g., "Climbing Gym") so people inherit that location automatically
3. **As a user**, I want to see all my contacts on a map colored by health score (green/yellow/red)
4. **As a user**, I want to click a map marker to navigate to that person's profile
5. **As a user**, I want to know if a person's location is their personal address or from a tag

---

## Database Changes

### Update Person Model (`api/models.py`)

```python
class PersonBase(SQLModel):
    # ... existing fields ...
    zip: Optional[str] = None  # KEEP existing field

    # NEW: Full address fields
    street_address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None

    # NEW: Geocoded coordinates (computed from address)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
```

### Update Tag Model (`api/models.py`)

```python
class TagBase(SQLModel):
    # ... existing fields ...

    # NEW: Tags can have addresses (for place-based tags)
    street_address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
```

### Migration

**File: `alembic/versions/xxx_add_location_fields.py`**

```python
def upgrade():
    # Add to people table
    op.add_column('people', sa.Column('street_address', sa.String(), nullable=True))
    op.add_column('people', sa.Column('city', sa.String(), nullable=True))
    op.add_column('people', sa.Column('state', sa.String(), nullable=True))
    op.add_column('people', sa.Column('latitude', sa.Float(), nullable=True))
    op.add_column('people', sa.Column('longitude', sa.Float(), nullable=True))

    # Add to tags table
    op.add_column('tags', sa.Column('street_address', sa.String(), nullable=True))
    op.add_column('tags', sa.Column('city', sa.String(), nullable=True))
    op.add_column('tags', sa.Column('state', sa.String(), nullable=True))
    op.add_column('tags', sa.Column('zip', sa.String(), nullable=True))
    op.add_column('tags', sa.Column('latitude', sa.Float(), nullable=True))
    op.add_column('tags', sa.Column('longitude', sa.Float(), nullable=True))

def downgrade():
    # Remove from people
    op.drop_column('people', 'longitude')
    op.drop_column('people', 'latitude')
    op.drop_column('people', 'state')
    op.drop_column('people', 'city')
    op.drop_column('people', 'street_address')

    # Remove from tags
    op.drop_column('tags', 'longitude')
    op.drop_column('tags', 'latitude')
    op.drop_column('tags', 'zip')
    op.drop_column('tags', 'state')
    op.drop_column('tags', 'city')
    op.drop_column('tags', 'street_address')
```

---

## Backend Implementation

### Phase 1: Geocoding Service

**File: `api/services/geocoding.py`**

```python
"""
Geocoding service to convert addresses to coordinates.
Uses geopy with Nominatim (free, OpenStreetMap-based).
"""

from geopy.geocoders import Nominatim
from typing import Optional, Tuple
import logging

logger = logging.getLogger(__name__)

# Initialize geocoder (Nominatim requires a user agent)
geolocator = Nominatim(user_agent="peopleperson-app")


def geocode_address(
    street_address: Optional[str] = None,
    city: Optional[str] = None,
    state: Optional[str] = None,
    zip_code: Optional[str] = None
) -> Optional[Tuple[float, float]]:
    """
    Convert address to coordinates.

    Args:
        street_address: Street address (e.g., "123 Main St")
        city: City name
        state: State name or abbreviation
        zip_code: ZIP/postal code

    Returns:
        Tuple of (latitude, longitude) or None if geocoding fails

    Examples:
        >>> geocode_address(zip_code="94110")
        (37.7484, -122.4156)

        >>> geocode_address(street_address="1 Hacker Way", city="Menlo Park", state="CA")
        (37.4845, -122.1477)
    """
    # Build address string from available components
    parts = [p for p in [street_address, city, state, zip_code] if p]
    if not parts:
        logger.warning("No address components provided for geocoding")
        return None

    address = ", ".join(parts)

    try:
        location = geolocator.geocode(address, timeout=10)
        if location:
            logger.info(f"Geocoded '{address}' to ({location.latitude}, {location.longitude})")
            return (location.latitude, location.longitude)
        else:
            logger.warning(f"Could not geocode address: {address}")
            return None
    except Exception as e:
        logger.error(f"Geocoding error for '{address}': {e}")
        return None


def reverse_geocode(latitude: float, longitude: float) -> Optional[dict]:
    """
    Convert coordinates to address (optional feature for future).

    Returns:
        Dictionary with address components or None
    """
    try:
        location = geolocator.reverse((latitude, longitude), timeout=10)
        if location:
            return location.raw.get('address', {})
    except Exception as e:
        logger.error(f"Reverse geocoding error: {e}")

    return None
```

**Add to `requirements.txt`:**
```
geopy==2.4.1
```

---

### Phase 2: Location Hierarchy Logic

**File: `api/services/location.py`**

```python
"""
Location resolution service - implements the location hierarchy.
Priority: Person address > Tag address > Zip code
"""

from sqlmodel import Session, select
from typing import Optional, Tuple
from api.models import Person, Tag, PersonTag
from api.services.geocoding import geocode_address
import logging

logger = logging.getLogger(__name__)


def get_person_coordinates(
    db: Session,
    person: Person
) -> Optional[Tuple[float, float, str]]:
    """
    Get coordinates for a person using location hierarchy.

    Priority:
    1. Person's own address (street + city + state)
    2. Person's own coordinates (if manually set)
    3. Tag-based location (from tags with addresses)
    4. Person's zip code only

    Args:
        db: Database session
        person: Person object

    Returns:
        Tuple of (latitude, longitude, source_description) or None

    Examples:
        (37.7749, -122.4194, "personal")
        (37.7849, -122.4094, "tag:Climbing Gym")
        (37.7484, -122.4156, "zip:94110")
    """

    # 1. Try person's stored coordinates (if address was geocoded)
    if person.latitude is not None and person.longitude is not None:
        return (person.latitude, person.longitude, "personal")

    # 2. Try to geocode person's full address
    if any([person.street_address, person.city, person.state]):
        coords = geocode_address(
            street_address=person.street_address,
            city=person.city,
            state=person.state,
            zip_code=person.zip
        )
        if coords:
            return (coords[0], coords[1], "personal")

    # 3. Try tag-based locations
    person_tags = db.exec(
        select(Tag)
        .join(PersonTag, PersonTag.tag_id == Tag.id)
        .where(PersonTag.person_id == person.id)
        .where(
            (Tag.latitude.isnot(None)) |
            (Tag.street_address.isnot(None))
        )
    ).all()

    for tag in person_tags:
        # Use stored tag coordinates if available
        if tag.latitude is not None and tag.longitude is not None:
            return (tag.latitude, tag.longitude, f"tag:{tag.name}")

        # Try to geocode tag address
        if any([tag.street_address, tag.city, tag.state, tag.zip]):
            coords = geocode_address(
                street_address=tag.street_address,
                city=tag.city,
                state=tag.state,
                zip_code=tag.zip
            )
            if coords:
                return (coords[0], coords[1], f"tag:{tag.name}")

    # 4. Fall back to person's zip code only
    if person.zip:
        coords = geocode_address(zip_code=person.zip)
        if coords:
            return (coords[0], coords[1], f"zip:{person.zip}")

    logger.info(f"No location data available for person {person.id}")
    return None
```

---

### Phase 3: API Endpoints

**File: `api/routers/people.py`**

Add new endpoint for map data:

```python
from api.services.location import get_person_coordinates
from api.services.health_score import calculate_health_score, get_health_status, get_health_emoji

@router.get("/map-data")
async def get_map_data(
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
) -> list[dict]:
    """
    Get all people with coordinates for map display.

    Returns:
        List of people with location data and health scores

    Example response:
        [
            {
                "id": "uuid",
                "name": "Alice",
                "latitude": 37.7749,
                "longitude": -122.4194,
                "location_source": "personal",
                "health_score": 85,
                "health_status": "healthy",
                "health_emoji": "🌳"
            },
            {
                "id": "uuid",
                "name": "Bob",
                "latitude": 37.7849,
                "longitude": -122.4094,
                "location_source": "tag:Climbing Gym",
                "health_score": 45,
                "health_status": "warning",
                "health_emoji": "🍂"
            }
        ]
    """
    people = db.exec(
        select(Person).where(Person.user_id == current_user.id)
    ).all()

    map_data = []
    for person in people:
        coords = get_person_coordinates(db, person)
        if coords:
            latitude, longitude, location_source = coords
            health_score = calculate_health_score(person.last_contact_date)
            health_status = get_health_status(health_score)

            map_data.append({
                "id": str(person.id),
                "name": person.name,
                "latitude": latitude,
                "longitude": longitude,
                "location_source": location_source,
                "health_score": health_score,
                "health_status": health_status,
                "health_emoji": get_health_emoji(health_status),
                "profile_pic_index": person.profile_pic_index,
            })

    return map_data
```

Update PATCH endpoint to geocode addresses:

```python
from api.services.geocoding import geocode_address

@router.patch("/{person_id}")
async def update_person(
    person_id: UUID,
    person_update: PersonUpdate,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Update person - geocode address if changed"""
    person = db.get(Person, person_id)
    if not person or person.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Person not found")

    # Update fields
    for key, value in person_update.dict(exclude_unset=True).items():
        setattr(person, key, value)

    # If address changed, re-geocode
    address_fields = ['street_address', 'city', 'state', 'zip']
    if any(key in person_update.dict(exclude_unset=True) for key in address_fields):
        coords = geocode_address(
            street_address=person.street_address,
            city=person.city,
            state=person.state,
            zip_code=person.zip
        )
        if coords:
            person.latitude, person.longitude = coords
        else:
            # Clear coords if geocoding fails
            person.latitude = None
            person.longitude = None

    person.updated_at = datetime.utcnow()
    db.add(person)
    db.commit()
    db.refresh(person)

    return PersonRead.from_person(person)
```

**File: `api/routers/tags.py`**

Similar update for tag addresses:

```python
@router.patch("/{tag_id}")
async def update_tag(
    tag_id: UUID,
    tag_update: TagUpdate,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Update tag - geocode address if changed"""
    # ... existing validation ...

    # Update fields
    for key, value in tag_update.dict(exclude_unset=True).items():
        setattr(tag, key, value)

    # If address changed, re-geocode
    address_fields = ['street_address', 'city', 'state', 'zip']
    if any(key in tag_update.dict(exclude_unset=True) for key in address_fields):
        coords = geocode_address(
            street_address=tag.street_address,
            city=tag.city,
            state=tag.state,
            zip_code=tag.zip
        )
        if coords:
            tag.latitude, tag.longitude = coords

    # ... commit and return ...
```

---

## Frontend Implementation

### Phase 1: Install Dependencies

```bash
cd webclient
npm install leaflet react-leaflet
npm install -D @types/leaflet
```

### Phase 2: Map Component

**File: `webclient/src/components/MapView.tsx`**

```typescript
import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useMapData } from '../hooks/api-hooks'
import { useNavigate } from '@tanstack/react-router'

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
  health_score: number
  health_status: 'healthy' | 'warning' | 'dormant'
  health_emoji: string
  profile_pic_index: number
}

// Custom markers colored by health status
function getMarkerIcon(status: 'healthy' | 'warning' | 'dormant'): L.Icon {
  const colors = {
    healthy: '#22c55e',  // green-500
    warning: '#eab308',  // yellow-500
    dormant: '#ef4444',  // red-500
  }

  const color = colors[status]

  const svgIcon = `
    <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
      <path fill="${color}" stroke="#fff" stroke-width="2" d="M12.5 0C5.6 0 0 5.6 0 12.5c0 9.4 12.5 28.5 12.5 28.5S25 21.9 25 12.5C25 5.6 19.4 0 12.5 0z"/>
      <circle fill="#fff" cx="12.5" cy="12.5" r="5"/>
    </svg>
  `

  return L.icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(svgIcon),
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [0, -41]
  })
}

// Component to auto-fit bounds to markers
function AutoFitBounds({ people }: { people: MapPerson[] }) {
  const map = useMap()

  useEffect(() => {
    if (people.length > 0) {
      const bounds = L.latLngBounds(
        people.map(p => [p.latitude, p.longitude])
      )
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [people, map])

  return null
}

export function MapView() {
  const { data: mapData = [] } = useMapData()
  const navigate = useNavigate()

  // Default center (SF) - will be overridden by AutoFitBounds
  const defaultCenter: [number, number] = [37.7749, -122.4194]

  const handleMarkerClick = (personId: string) => {
    navigate({ to: `/people/${personId}` })
  }

  if (mapData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-500">
          <p className="text-lg mb-2">No locations to display</p>
          <p className="text-sm">Add addresses to people or tags to see them on the map</p>
        </div>
      </div>
    )
  }

  return (
    <MapContainer
      center={defaultCenter}
      zoom={12}
      style={{ height: '100%', width: '100%' }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <AutoFitBounds people={mapData} />

      {mapData.map((person) => (
        <Marker
          key={person.id}
          position={[person.latitude, person.longitude]}
          icon={getMarkerIcon(person.health_status)}
          eventHandlers={{
            click: () => handleMarkerClick(person.id)
          }}
        >
          <Popup>
            <div className="p-2">
              <h3 className="font-semibold text-lg mb-1">{person.name}</h3>

              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{person.health_emoji}</span>
                <span className="text-sm">
                  Score: <strong>{person.health_score}</strong>
                </span>
              </div>

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
  )
}

function formatLocationSource(source: string): string {
  if (source === 'personal') return 'Personal address'
  if (source.startsWith('tag:')) return `From tag: ${source.slice(4)}`
  if (source.startsWith('zip:')) return `Zip code: ${source.slice(4)}`
  return source
}
```

---

### Phase 3: API Hook

**File: `webclient/src/hooks/api-hooks.ts`**

Add hook for map data:

```typescript
export function useMapData() {
  return useQuery({
    queryKey: ['map-data'],
    queryFn: async () => {
      const response = await apiClient.get('/people/map-data')
      return response.data as MapPerson[]
    },
  })
}
```

**File: `webclient/src/types/api.ts`**

Update types:

```typescript
export interface Person {
  id: string
  name: string
  body: string
  birthday?: string
  mnemonic?: string

  // Address fields
  street_address?: string
  city?: string
  state?: string
  zip?: string
  latitude?: number
  longitude?: number

  // ... other existing fields ...
}

export interface Tag {
  id: string
  name: string
  category: string
  color?: string
  description?: string

  // NEW: Address fields for location tags
  street_address?: string
  city?: string
  state?: string
  zip?: string
  latitude?: number
  longitude?: number

  created_at: string
  updated_at: string
}

export interface MapPerson {
  id: string
  name: string
  latitude: number
  longitude: number
  location_source: string
  health_score: number
  health_status: 'healthy' | 'warning' | 'dormant'
  health_emoji: string
  profile_pic_index: number
}
```

---

### Phase 4: View Mode Integration

**File: `webclient/src/components/layout/AppLayout.tsx`**

Add map to view modes:

```typescript
import { MapView } from '../MapView'

type ViewMode = 'list' | 'table' | 'map'

export function AppLayout() {
  const [viewMode, setViewMode] = useState<ViewMode>('list')

  return (
    <div className="flex h-screen">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        {/* View mode selector */}
        <div className="border-b p-2 flex gap-2">
          <button
            onClick={() => setViewMode('list')}
            className={viewMode === 'list' ? 'font-bold' : ''}
          >
            📋 List
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={viewMode === 'table' ? 'font-bold' : ''}
          >
            📊 Table
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={viewMode === 'map' ? 'font-bold' : ''}
          >
            🗺️ Map
          </button>
        </div>

        {/* Main content area */}
        <div className="flex-1 overflow-hidden">
          {viewMode === 'map' ? (
            <MapView />
          ) : viewMode === 'table' ? (
            <TableView />
          ) : (
            <div className="flex flex-1">
              <PeopleList />
              <PersonPanel />
              <ChatPanel />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

---

### Phase 5: Address Editing UI

**File: `webclient/src/components/layout/PersonProfile.tsx`**

Add address section:

```typescript
<div className="mb-6">
  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
    📍 Address
  </h3>

  <div className="space-y-2">
    <input
      type="text"
      placeholder="Street Address"
      value={editedPerson.street_address || ''}
      onChange={(e) => setEditedPerson({
        ...editedPerson,
        street_address: e.target.value
      })}
      className="w-full px-3 py-2 border rounded"
    />

    <div className="grid grid-cols-3 gap-2">
      <input
        type="text"
        placeholder="City"
        value={editedPerson.city || ''}
        onChange={(e) => setEditedPerson({
          ...editedPerson,
          city: e.target.value
        })}
        className="px-3 py-2 border rounded"
      />

      <input
        type="text"
        placeholder="State"
        value={editedPerson.state || ''}
        onChange={(e) => setEditedPerson({
          ...editedPerson,
          state: e.target.value
        })}
        className="px-3 py-2 border rounded"
      />

      <input
        type="text"
        placeholder="Zip"
        value={editedPerson.zip || ''}
        onChange={(e) => setEditedPerson({
          ...editedPerson,
          zip: e.target.value
        })}
        className="px-3 py-2 border rounded"
      />
    </div>

    {person.latitude && person.longitude && (
      <div className="text-xs text-gray-500">
        📍 Location: {person.latitude.toFixed(4)}, {person.longitude.toFixed(4)}
      </div>
    )}
  </div>
</div>
```

**Add similar address fields to tag editor** (wherever tags are edited in the UI)

---

## Testing Checklist

### Backend
- [ ] Migration runs successfully (both upgrade and downgrade)
- [ ] Geocoding service correctly converts addresses to coordinates
- [ ] Geocoding handles missing/invalid addresses gracefully
- [ ] `/api/people/map-data` endpoint returns correct location hierarchy
- [ ] Person PATCH geocodes address when updated
- [ ] Tag PATCH geocodes address when updated
- [ ] Location priority works: personal > tag > zip

### Frontend
- [ ] Map view displays with OpenStreetMap tiles
- [ ] Markers appear for people with locations
- [ ] Markers are colored by health status (green/yellow/red)
- [ ] Clicking marker opens popup with person info
- [ ] "View Profile" button navigates to person detail
- [ ] Map auto-fits bounds to show all markers
- [ ] Address fields appear in PersonProfile editor
- [ ] Address fields appear in tag editor
- [ ] Saving address triggers geocoding
- [ ] Location source is displayed ("Personal" vs "from tag: X")
- [ ] Empty state shows when no locations exist

### Integration
- [ ] Tag with address → person inherits location on map
- [ ] Person address overrides tag address
- [ ] Updating tag address updates all tagged people on map
- [ ] Removing person address falls back to tag location
- [ ] Map refetches after address updates

---

## Future Enhancements (V2+)

These are NOT part of the initial implementation but could be added later:

### Map Features
- [ ] **Marker clustering** - Group nearby markers (using `react-leaflet-cluster`)
- [ ] **Search on map** - Find address and add marker
- [ ] **Filter map** - Show only certain health statuses or tags
- [ ] **Heatmap mode** - Show contact density
- [ ] **Draw radius** - "Find people within X miles of location"

### Location Features
- [ ] **Bulk geocoding** - Geocode all existing zips in background
- [ ] **Location history** - Track when people move
- [ ] **Nearby suggestions** - "You have 3 friends in this neighborhood"
- [ ] **Meeting point calculator** - Find midpoint between multiple people
- [ ] **Geofencing** - Get notified when you're near someone

### Data Improvements
- [ ] **Multiple addresses per person** - Home, work, etc.
- [ ] **Address validation** - Use Google Places API for autocomplete
- [ ] **Privacy controls** - Hide specific people from map
- [ ] **Location sharing** - Optional feature to share your location

---

## Technical Decisions

### Why Leaflet over Google Maps?
- **Free** - No API key or billing required
- **Open source** - Active community, extensible
- **OpenStreetMap** - Good coverage, regularly updated
- **Lightweight** - Smaller bundle size than Google Maps

### Why Nominatim for Geocoding?
- **Free** - No API key needed
- **Good accuracy** - Powered by OpenStreetMap
- **Rate limit** - 1 request/second (acceptable for manual address entry)
- **Can upgrade later** - Easy to swap for Google Geocoding API if needed

### Why Store Coordinates?
- **Performance** - Don't re-geocode on every map load
- **Offline** - Works even if geocoding service is down
- **Consistency** - Location doesn't change if geocoding results change
- **Cache** - Update only when address changes

---

## Deployment Considerations

### Environment Setup
- No API keys required for initial version (Nominatim is free)
- Add `geopy` to production requirements
- Ensure PostgreSQL has Float type support (it does)

### Performance
- Geocoding happens on PATCH (when addresses are saved)
- Map data endpoint only runs when map view is opened
- No background jobs needed initially
- Consider rate limiting if many addresses are added at once

### Error Handling
- Geocoding failures don't block saves (coordinates are optional)
- Invalid addresses result in no map marker (not an error)
- Map gracefully handles empty results
- Log geocoding failures for debugging

---

## Timeline Estimate

**Day 1: Backend Foundation**
- Migration script
- Add address fields to models
- Create geocoding service
- Test geocoding with various addresses

**Day 2: Backend API**
- Location hierarchy logic
- `/api/people/map-data` endpoint
- Update person/tag PATCH endpoints
- API testing

**Day 3: Frontend Map**
- Install Leaflet dependencies
- Create MapView component
- Add custom health-colored markers
- Test map rendering and interactions

**Day 4: UI Integration**
- Add address fields to PersonProfile
- Add address fields to tag editor
- Add map view mode to AppLayout
- Wire up API hooks

**Day 5: Testing & Polish**
- End-to-end testing
- Fix bugs
- UI polish (loading states, error handling)
- Documentation

**Total: 3-5 days** depending on complexity and bugs

---

## Success Criteria

After implementing this feature, users should be able to:

1. ✅ Add addresses to people and see them on a map
2. ✅ Add addresses to tags (e.g., "Climbing Gym") and see tagged people inherit that location
3. ✅ See personal addresses take priority over tag addresses
4. ✅ View all contacts on a color-coded map (by health score)
5. ✅ Click markers to navigate to person profiles
6. ✅ Understand where each person's location comes from (personal vs tag vs zip)
7. ✅ Switch between list/table/map views seamlessly

---

## Open Questions

1. **Default map center** - Use user's location (requires geolocation permission) or default to specific city?
2. **Tag UI** - Should tags have a checkbox "This is a place" or just show address fields for all tags?
3. **Zip-only display** - Should zip-only locations show as a larger circle (less precise) vs pin (address)?
4. **Mobile view** - Should map be full-screen on mobile or keep 3-panel layout?
5. **Geocoding feedback** - Show user when address is being geocoded? Show error if it fails?

---

_This follows the YAGNI philosophy: build a solid foundation with the core features, validate with users, then iterate based on real feedback._
