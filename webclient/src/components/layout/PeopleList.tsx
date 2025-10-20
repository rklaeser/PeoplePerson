import { useState, useMemo } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { usePeople, useCreatePerson } from '@/hooks/api-hooks'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { HealthScore } from '@/components/HealthScore'
import { cn, formatTime } from '@/lib/utils'
import { Search, Plus, Menu } from 'lucide-react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef } from 'react'
import { useUIStore } from '@/stores/ui-store'
import { TableView } from './TableView'

export function PeopleList() {
  const navigate = useNavigate()
  const search = useSearch({ from: '/people' })
  const [searchQuery, setSearchQuery] = useState(search.search || '')
  const { viewMode, toggleHamburgerMenu } = useUIStore()
  const createPerson = useCreatePerson()

  const { data: rawPeople = [], isLoading, error } = usePeople({
    filter: search.filter,
    sort: search.sort,
    search: searchQuery
  })

  // Filter and sort people by health status
  const people = useMemo(() => {
    let filtered = [...rawPeople]

    // Apply health filter
    if (search.filter === 'needs-attention') {
      filtered = filtered.filter(p => p.health_status === 'warning' || p.health_status === 'dormant')
    } else if (search.filter === 'healthy') {
      filtered = filtered.filter(p => p.health_status === 'healthy')
    } else if (search.filter === 'dormant') {
      filtered = filtered.filter(p => p.health_status === 'dormant')
    }

    // Sort by health score (lowest first) to surface people who need attention
    filtered.sort((a, b) => a.health_score - b.health_score)

    return filtered
  }, [rawPeople, search.filter])

  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: people.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 96,
    overscan: 5,
  })

  const handlePersonClick = (personId: string) => {
    navigate({
      to: '/people/$personId',
      params: { personId },
      search: { panel: 'messages' }
    })
  }

  const handleNameClick = (personId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click from firing
    navigate({
      to: '/people/$personId',
      params: { personId },
      search: { panel: 'profile' }
    })
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    // TODO: Debounce this
    navigate({
      search: (prev) => ({
        filter: prev.filter,
        sort: prev.sort,
        search: value || undefined
      })
    })
  }

  const handleAddPerson = async () => {
    try {
      const newPerson = await createPerson.mutateAsync({
        name: 'Untitled User',
        body: '',
      })
      // Navigate to the new person in edit mode
      navigate({
        to: '/people/$personId',
        params: { personId: newPerson.id },
        search: { panel: 'profile', edit: 'true' }
      })
    } catch (error) {
      console.error('Failed to create person:', error)
    }
  }

  if (isLoading) {
    return (
      <aside className="w-[350px] bg-card border-r border-border flex items-center justify-center">
        <div>Loading...</div>
      </aside>
    )
  }

  if (error) {
    return (
      <aside className="w-[350px] bg-card border-r border-border flex flex-col items-center justify-center p-4 text-center">
        <div className="text-red-600 font-medium mb-2">Error loading people</div>
        <div className="text-sm text-muted-foreground mb-4">
          {error.message || 'Failed to connect to API'}
        </div>
        <div className="text-xs text-muted-foreground">
          Make sure the API server is running on port 8000
        </div>
      </aside>
    )
  }

  // If in table mode, TableView takes full width
  if (viewMode === 'table') {
    return <TableView />
  }

  return (
    <aside
      className="w-[350px] h-screen bg-card border-r border-border flex flex-col"
      aria-label="People list"
    >
        {/* Header */}
        <div className="p-4 border-b border-border space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="ghost"
                onClick={toggleHamburgerMenu}
                title="Menu"
              >
                <Menu size={20} />
              </Button>
              <h2 className="text-lg font-semibold">People</h2>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleAddPerson}
              disabled={createPerson.isPending}
            >
              <Plus size={16} className="mr-2" />
              Add
            </Button>
          </div>
        
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search people..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Health Filters */}
        <div className="flex gap-2 text-xs">
          <FilterButton
            active={!search.filter || search.filter === 'all'}
            onClick={() => navigate({ search: (prev) => ({
              filter: 'all',
              sort: prev.sort,
              search: prev.search
            }) })}
          >
            All ({rawPeople.length})
          </FilterButton>
          <FilterButton
            active={search.filter === 'healthy'}
            onClick={() => navigate({ search: (prev) => ({
              filter: 'healthy',
              sort: prev.sort,
              search: prev.search
            }) })}
          >
            🌳 Thriving
          </FilterButton>
          <FilterButton
            active={search.filter === 'needs-attention'}
            onClick={() => navigate({ search: (prev) => ({
              filter: 'needs-attention',
              sort: prev.sort,
              search: prev.search
            }) })}
          >
            🍁 Declining
          </FilterButton>
          <FilterButton
            active={search.filter === 'dormant'}
            onClick={() => navigate({ search: (prev) => ({
              filter: 'dormant',
              sort: prev.sort,
              search: prev.search
            }) })}
          >
            🪵 Dormant
          </FilterButton>
        </div>
      </div>

      {/* People list or Table view */}
      {viewMode === 'list' ? (
        <div
          ref={parentRef}
          className="flex-1 overflow-auto scrollbar-hide min-h-0"
        >
          {people.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No people found
            </div>
          ) : (
            <div
              style={{ height: virtualizer.getTotalSize() }}
              className="relative"
            >
              {virtualizer.getVirtualItems().map((virtualItem) => {
                const person = people[virtualItem.index]
                return (
                  <PersonListItem
                    key={person.id}
                    person={person}
                    onClick={() => handlePersonClick(person.id)}
                    onNameClick={handleNameClick}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: virtualItem.size,
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                  />
                )
              })}
            </div>
          )}
        </div>
      ) : (
        <TableView />
      )}
    </aside>
  )
}

interface FilterButtonProps {
  children: React.ReactNode
  active: boolean
  onClick: () => void
}

function FilterButton({ children, active, onClick }: FilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-2 py-1 rounded-md transition-colors",
        active 
          ? "bg-primary text-primary-foreground" 
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      )}
    >
      {children}
    </button>
  )
}

interface PersonListItemProps {
  person: any // Use proper Person type
  onClick: () => void
  onNameClick: (personId: string, e: React.MouseEvent) => void
  style?: React.CSSProperties
}

function PersonListItem({ person, onClick, onNameClick, style }: PersonListItemProps) {
  // Determine what to show in preview: latest message or latest notebook entry
  const getPreviewText = () => {
    const lastMessageTime = person.updated_at ? new Date(person.updated_at).getTime() : 0
    const notebookEntryTime = person.latest_notebook_entry_time
      ? new Date(person.latest_notebook_entry_time).getTime()
      : 0

    // Show whichever is newer
    if (notebookEntryTime > lastMessageTime && person.latest_notebook_entry_content) {
      return person.latest_notebook_entry_content
    } else if (person.last_message) {
      return person.last_message
    } else if (person.latest_notebook_entry_content) {
      return person.latest_notebook_entry_content
    } else {
      return person.body
    }
  }

  return (
    <div
      style={style}
      onClick={onClick}
      className="cursor-pointer p-3 hover:bg-accent/50 border-b border-border/50 transition-colors"
    >
      <div className="flex items-start gap-3">
        <Avatar name={person.name} size={40} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <h3
                className="font-medium hover:underline cursor-pointer flex-shrink-0"
                onClick={(e) => onNameClick(person.id, e)}
              >
                {person.name}
              </h3>
              {person.tags && person.tags.length > 0 && (
                <div className="flex gap-1 flex-wrap overflow-hidden">
                  {person.tags.slice(0, 3).map((tag: import('@/types/api').Tag) => (
                    <span
                      key={tag.id}
                      className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20"
                      style={{
                        backgroundColor: tag.color ? `${tag.color}15` : undefined,
                        borderColor: tag.color ? `${tag.color}40` : undefined,
                        color: tag.color || undefined
                      }}
                    >
                      {tag.name}
                    </span>
                  ))}
                  {person.tags.length > 3 && (
                    <span className="text-xs text-muted-foreground">
                      +{person.tags.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <HealthScore
                score={person.health_score}
                status={person.health_status}
                emoji={person.health_emoji}
                daysSinceContact={person.days_since_contact}
                size="sm"
              />
            </div>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {getPreviewText()}
          </p>
        </div>
      </div>
    </div>
  )
}