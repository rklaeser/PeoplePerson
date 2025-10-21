import { useState } from 'react'
import { useUIStore } from '@/stores/ui-store'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, Trash2 } from 'lucide-react'
import { api } from '@/lib/api-client'
import { auth } from '@/config/firebase'

interface SettingsProps {
  isOpen: boolean
  onClose: () => void
}

export function Settings({ isOpen, onClose }: SettingsProps) {
  const { defaultLocation, setDefaultLocation, assistantName, setAssistantName } = useUIStore()
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [city, setCity] = useState(defaultLocation?.city || '')
  const [state, setState] = useState(defaultLocation?.state || '')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

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

  const handleDeleteAccount = async () => {
    const confirmation = window.confirm(
      'Are you sure you want to delete your account? This will permanently delete all your data including all people, memories, tags, and messages. This action cannot be undone.'
    )

    if (!confirmation) return

    const doubleConfirmation = window.prompt(
      'To confirm deletion, please type "DELETE" in all caps:'
    )

    if (doubleConfirmation !== 'DELETE') {
      alert('Account deletion cancelled.')
      return
    }

    setIsDeleting(true)
    setError(null)

    try {
      // Delete user data from backend
      await api.deleteCurrentUser()

      // Delete Firebase auth account
      const currentUser = auth.currentUser
      if (currentUser) {
        await currentUser.delete()
      }

      // Sign out and redirect to landing
      await logout()
      navigate({ to: '/landing' })
    } catch (err: any) {
      setError(`Failed to delete account: ${err.message || 'Unknown error'}`)
      console.error('Account deletion error:', err)
    } finally {
      setIsDeleting(false)
    }
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
          <div className="p-4 space-y-6">
            {/* Assistant Selection */}
            <div>
              <h3 className="text-sm font-medium mb-3">Animal Guide</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Your animal guide helps you stay connected with the people in your life. Chat with them to add friends, update tags, record memories, and more.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setAssistantName('Scout')}
                  className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                    assistantName === 'Scout'
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-border hover:border-blue-300'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <img
                      src="/scout.png"
                      alt="Scout"
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <div className="text-center">
                      <div className="font-medium text-sm">Scout</div>
                      <div className="text-xs text-muted-foreground">"Bark"</div>
                    </div>
                    {assistantName === 'Scout' && (
                      <span className="text-blue-600 text-lg">✓</span>
                    )}
                  </div>
                </button>

                <button
                  onClick={() => setAssistantName('Nico')}
                  className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                    assistantName === 'Nico'
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-border hover:border-blue-300'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <img
                      src="/nico.png"
                      alt="Nico"
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <div className="text-center">
                      <div className="font-medium text-sm">Nico</div>
                      <div className="text-xs text-muted-foreground">"Purr"</div>
                    </div>
                    {assistantName === 'Nico' && (
                      <span className="text-blue-600 text-lg">✓</span>
                    )}
                  </div>
                </button>
              </div>
            </div>

            {/* Map Location */}
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

            {/* Danger Zone */}
            <div className="border-t border-destructive/30 pt-6">
              <h3 className="text-sm font-medium mb-3 text-destructive">Danger Zone</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="w-full"
              >
                <Trash2 size={16} className="mr-2" />
                {isDeleting ? 'Deleting Account...' : 'Delete Account'}
              </Button>
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
