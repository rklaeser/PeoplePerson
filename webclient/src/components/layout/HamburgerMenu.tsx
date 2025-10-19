import { useUIStore } from '@/stores/ui-store'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { X, LayoutList, Table, Settings, LogOut } from 'lucide-react'

export function HamburgerMenu() {
  const { hamburgerMenuOpen, setHamburgerMenuOpen, viewMode, setViewMode } = useUIStore()
  const { logout } = useAuth()

  if (!hamburgerMenuOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40 transition-opacity"
        onClick={() => setHamburgerMenuOpen(false)}
      />

      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border z-50 transition-transform flex flex-col",
          hamburgerMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">PeoplePerson</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setHamburgerMenuOpen(false)}
          >
            <X size={20} />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 space-y-4">
          {/* View Mode Toggle */}
          <div>
            <h3 className="text-sm font-medium mb-2">View Mode</h3>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => {
                  setViewMode('list')
                  setHamburgerMenuOpen(false)
                }}
              >
                <LayoutList size={16} className="mr-2" />
                List
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => {
                  setViewMode('table')
                  setHamburgerMenuOpen(false)
                }}
              >
                <Table size={16} className="mr-2" />
                Table
              </Button>
            </div>
          </div>
        </div>

        {/* Footer with Settings and Sign Out */}
        <div className="p-4 border-t border-border space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2"
            onClick={() => {
              // TODO: Navigate to settings
              setHamburgerMenuOpen(false)
            }}
          >
            <Settings size={16} />
            Settings
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2"
            onClick={() => {
              logout()
              setHamburgerMenuOpen(false)
            }}
          >
            <LogOut size={16} />
            Sign Out
          </Button>
        </div>
      </div>
    </>
  )
}
