import { useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { usePeople } from '@/hooks/api-hooks'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { cn, formatTime, getIntentColor } from '@/lib/utils'
import { Search, Plus } from 'lucide-react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef } from 'react'

export function PeopleList() {
  const navigate = useNavigate()
  const search = useSearch({ from: '/people' })
  const [searchQuery, setSearchQuery] = useState(search.search || '')
  
  const { data: people = [], isLoading, error } = usePeople({
    filter: search.filter,
    sort: search.sort,
    search: searchQuery
  })

  // Debug logging
  console.log('PeopleList state:', { 
    isLoading, 
    error: error?.message, 
    peopleCount: people.length,
    people: people.slice(0, 2) // First 2 people for debugging
  })

  const parentRef = useRef<HTMLDivElement>(null)
  
  const virtualizer = useVirtualizer({
    count: people.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72,
    overscan: 5,
  })

  const handlePersonClick = (personId: string) => {
    navigate({ 
      to: '/people/$personId', 
      params: { personId },
      search: { panel: 'messages' }
    })
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    // TODO: Debounce this
    navigate({ 
      search: { ...search, search: value || undefined }
    })
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

  return (
    <aside 
      className="w-[350px] bg-card border-r border-border flex flex-col"
      aria-label="People list"
    >
      {/* Header */}
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">People</h2>
          <Button size="sm" variant="outline">
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

        {/* Filters */}
        <div className="flex gap-2 text-xs">
          <FilterButton 
            active={search.filter === 'all'} 
            onClick={() => navigate({ search: { ...search, filter: 'all' }})}
          >
            All ({people.length})
          </FilterButton>
          <FilterButton 
            active={search.filter === 'unread'} 
            onClick={() => navigate({ search: { ...search, filter: 'unread' }})}
          >
            Unread
          </FilterButton>
          <FilterButton 
            active={search.filter === 'important'} 
            onClick={() => navigate({ search: { ...search, filter: 'important' }})}
          >
            Important
          </FilterButton>
        </div>
      </div>

      {/* People list */}
      <div 
        ref={parentRef}
        className="flex-1 overflow-auto custom-scrollbar"
        style={{ height: 'calc(100vh - 140px)' }}
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
  style?: React.CSSProperties
}

function PersonListItem({ person, onClick, style }: PersonListItemProps) {
  return (
    <div
      style={style}
      onClick={onClick}
      className="cursor-pointer p-3 hover:bg-accent/50 border-b border-border/50 transition-colors"
    >
      <div className="flex items-start gap-3">
        <Avatar name={person.name} size={40} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium truncate">{person.name}</h3>
            <span className={cn(
              "text-xs px-2 py-0.5 rounded-full border",
              getIntentColor(person.intent)
            )}>
              {person.intent}
            </span>
          </div>
          <p className="text-sm text-muted-foreground truncate mb-1">
            {person.last_message || person.body}
          </p>
          <div className="text-xs text-muted-foreground">
            {formatTime(person.updated_at)}
          </div>
        </div>
      </div>
    </div>
  )
}