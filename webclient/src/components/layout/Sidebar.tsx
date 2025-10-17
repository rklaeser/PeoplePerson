import { useUIStore } from '@/stores/ui-store'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Users, Settings, Menu, MessageSquare, LogOut } from 'lucide-react'

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const { user, logout } = useAuth()

  return (
    <nav 
      className={cn(
        "bg-card border-r border-border flex flex-col transition-all duration-200",
        sidebarCollapsed ? "w-[60px]" : "w-[250px]"
      )}
      aria-label="Main navigation"
    >
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="shrink-0"
          >
            <Menu size={20} />
          </Button>
          {!sidebarCollapsed && (
            <h1 className="text-lg font-semibold truncate">PeoplePerson</h1>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-2">
        <nav className="space-y-1">
          <SidebarItem
            icon={<Users size={20} />}
            label="People"
            active
            collapsed={sidebarCollapsed}
          />
          <SidebarItem
            icon={<MessageSquare size={20} />}
            label="Messages"
            collapsed={sidebarCollapsed}
          />
          <SidebarItem
            icon={<Settings size={20} />}
            label="Settings"
            collapsed={sidebarCollapsed}
          />
        </nav>
      </div>

      {/* User section */}
      <div className="p-4 border-t border-border">
        {!sidebarCollapsed ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-medium">
                  {user?.email?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user?.displayName || 'User'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full justify-start gap-2 h-8 text-xs"
              onClick={logout}
            >
              <LogOut size={14} />
              Sign out
            </Button>
          </div>
        ) : (
          <Button 
            variant="ghost" 
            size="icon" 
            className="w-8 h-8"
            onClick={logout}
            title="Sign out"
          >
            <LogOut size={16} />
          </Button>
        )}
      </div>
    </nav>
  )
}

interface SidebarItemProps {
  icon: React.ReactNode
  label: string
  active?: boolean
  collapsed: boolean
  onClick?: () => void
}

function SidebarItem({ icon, label, active, collapsed, onClick }: SidebarItemProps) {
  return (
    <Button
      variant={active ? "secondary" : "ghost"}
      className={cn(
        "w-full justify-start gap-3 h-10",
        collapsed && "px-2"
      )}
      onClick={onClick}
    >
      <span className="shrink-0">{icon}</span>
      {!collapsed && <span className="truncate">{label}</span>}
    </Button>
  )
}