import { useState } from 'react'
import { useUIStore } from '@/stores/ui-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X } from 'lucide-react'

interface SettingsProps {
  isOpen: boolean
  onClose: () => void
}

export function Settings({ isOpen, onClose }: SettingsProps) {
  const { defaultLocation, setDefaultLocation } = useUIStore()
  const [city, setCity] = useState(defaultLocation?.city || '')
  const [state, setState] = useState(defaultLocation?.state || '')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSave = async () => {
    if (!city.trim() || !state.trim()) {
      setError('Please enter both city and state')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      // Geocode the city and state
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}&country=US&format=json&limit=1`,
        {
          headers: {
            'User-Agent': 'PeoplePerson App'
          }
        }
      )

      const data = await response.json()

      if (data && data.length > 0) {
        const location = data[0]
        setDefaultLocation({
          city: city.trim(),
          state: state.trim(),
          lat: parseFloat(location.lat),
          lng: parseFloat(location.lon)
        })
        onClose()
      } else {
        setError('Could not find that location. Please check city and state.')
      }
    } catch (err) {
      setError('Failed to geocode location. Please try again.')
      console.error('Geocoding error:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleClear = () => {
    setDefaultLocation(undefined)
    setCity('')
    setState('')
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />

      {/* Settings Panel */}
      <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
        <div className="bg-card border border-border rounded-lg shadow-lg w-full max-w-md pointer-events-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-lg font-semibold">Settings</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
            >
              <X size={20} />
            </Button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-3">Default Map Location</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Set your default location for the map. This will override browser geolocation.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground">City</label>
                  <Input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g., San Francisco"
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground">State</label>
                  <Input
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="e.g., CA or California"
                    className="mt-1"
                  />
                </div>

                {error && (
                  <div className="text-xs text-red-500">
                    {error}
                  </div>
                )}

                {defaultLocation && (
                  <div className="text-xs text-muted-foreground">
                    Current: {defaultLocation.city}, {defaultLocation.state}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 border-t border-border">
            <Button
              variant="ghost"
              onClick={handleClear}
              disabled={!defaultLocation}
            >
              Clear
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
