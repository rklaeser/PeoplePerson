import { useParams, useSearch, useNavigate, useLocation } from '@tanstack/react-router'
import { usePerson } from '@/hooks/api-hooks'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { MessageSquare, User, Activity } from 'lucide-react'
import { MessageThread } from './MessageThread'
import { PersonProfile } from './PersonProfile'
import { PersonActivity } from './PersonActivity'
import { useUIStore } from '@/stores/ui-store'
import { Avatar } from '@/components/ui/avatar'

export function PersonPanel() {
  const location = useLocation()
  const navigate = useNavigate()
  const { personId } = useParams({ from: '/people/$personId' })
  const search = useSearch({ from: '/people/$personId' }) || { panel: 'messages' }
  const { toggleChatPanel, assistantName } = useUIStore()

  // Check if we're on a person route
  const isPersonRoute = location.pathname.startsWith('/people/') && location.pathname !== '/people'

  const { data: person, isLoading } = usePerson(personId || '')
  
  if (!isPersonRoute) {
    return (
      <main 
        className="flex-1 flex items-center justify-center bg-background"
        aria-label="No selection"
      >
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <MessageSquare size={24} className="text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">Select a person</h3>
          <p className="text-muted-foreground max-w-sm">
            Choose someone from the list to view their messages and profile information.
          </p>
        </div>
      </main>
    )
  }

  if (!personId) {
    return (
      <main 
        className="flex-1 flex items-center justify-center bg-background"
        aria-label="No selection"
      >
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <MessageSquare size={24} className="text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">Select a person</h3>
          <p className="text-muted-foreground max-w-sm">
            Choose someone from the list to view their messages and profile information.
          </p>
        </div>
      </main>
    )
  }

  if (isLoading) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <div>Loading...</div>
      </main>
    )
  }

  if (!person) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <div>Person not found</div>
      </main>
    )
  }

  const handleTabChange = (panel: 'messages' | 'profile' | 'activity') => {
    navigate({
      to: '/people/$personId',
      params: { personId: personId || '' },
      search: { panel }
    })
  }

  // Check if person has contact information
  const hasContactInfo = !!(person?.email || person?.phone_number)

  // Default to profile if on messages tab but no contact info
  const activePanel = !hasContactInfo && search.panel === 'messages' ? 'profile' : search.panel

  return (
    <main className="flex-1 flex flex-col bg-background" aria-label="Person details">
      {/* Header with tabs */}
      <div className="border-b border-border bg-card">
        <div className="p-4">
          <div className="flex items-center gap-4 mb-4">
            <Avatar name={person.name} size={64} />
            <div className="flex-1">
              <h2 className="text-4xl font-semibold">{person.name}</h2>
            </div>
            <button
              onClick={toggleChatPanel}
              className="flex items-center gap-1 px-3 py-2 rounded-full border-2 border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors cursor-pointer"
            >
              <img
                src={assistantName === 'Scout' ? '/scout.png' : '/nico.png'}
                alt={assistantName}
                className="w-8 h-8 rounded-full object-cover"
              />
              <span className="text-sm font-medium">Chat</span>
            </button>
          </div>

          {/* Tab navigation */}
          <div className="flex gap-1">
            {hasContactInfo && (
              <TabButton
                active={activePanel === 'messages'}
                onClick={() => handleTabChange('messages')}
                icon={<MessageSquare size={16} />}
              >
                Messages
              </TabButton>
            )}
            <TabButton
              active={activePanel === 'profile'}
              onClick={() => handleTabChange('profile')}
              icon={<User size={16} />}
            >
              Profile
            </TabButton>
            <TabButton
              active={activePanel === 'activity'}
              onClick={() => handleTabChange('activity')}
              icon={<Activity size={16} />}
            >
              Activity
            </TabButton>
          </div>
        </div>
      </div>

      {/* Panel content */}
      <div className="flex-1 overflow-hidden">
        {activePanel === 'messages' && <MessageThread personId={personId} />}
        {activePanel === 'profile' && <PersonProfile personId={personId} />}
        {activePanel === 'activity' && <PersonActivity personId={personId} />}
      </div>
    </main>
  )
}

interface TabButtonProps {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  children: React.ReactNode
}

function TabButton({ active, onClick, icon, children }: TabButtonProps) {
  return (
    <Button
      variant={active ? "default" : "ghost"}
      size="sm"
      onClick={onClick}
      className={cn(
        "gap-2 h-8",
        active && "bg-primary text-primary-foreground"
      )}
    >
      {icon}
      {children}
    </Button>
  )
}