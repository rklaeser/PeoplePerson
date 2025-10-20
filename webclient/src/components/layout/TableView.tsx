import { useState, useMemo } from 'react'
import * as React from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { usePeople, useTags } from '@/hooks/api-hooks'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Person, Tag } from '@/types/api'
import { cn } from '@/lib/utils'
import { Search, Menu, ChevronUp, ChevronDown } from 'lucide-react'
import { useUIStore } from '@/stores/ui-store'
import { HamburgerMenu } from './HamburgerMenu'
import { BulkActionsToolbar } from './BulkActionsToolbar'
import { FilterBar, TableFilters } from './FilterBar'

type SortColumn = 'name' | 'health_score' | 'last_contact_date' | 'birthday'
type SortDirection = 'asc' | 'desc'

export function TableView() {
  const navigate = useNavigate()
  const search = useSearch({ from: '/people' })
  const [searchQuery, setSearchQuery] = useState(search.search || '')
  const { toggleHamburgerMenu } = useUIStore()

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Sorting state
  const [sortColumn, setSortColumn] = useState<SortColumn>('health_score')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  // Filter state
  const [filters, setFilters] = useState<TableFilters>({
    healthStatuses: new Set(),
    tags: new Set(),
    hasEmail: null,
    hasPhone: null,
    hasBirthday: null,
    lastContactDays: null,
  })

  const { data: rawPeople = [], isLoading, error } = usePeople({
    filter: search.filter,
    sort: search.sort,
    search: searchQuery
  })

  // Fetch all tags for filtering
  const { data: allTags = [] } = useTags()

  // Build person tags mapping for filtering from the tags already in person data
  const personTagsMap = useMemo(() => {
    const map: Record<string, string[]> = {}
    rawPeople.forEach(person => {
      if (person.tags && person.tags.length > 0) {
        map[person.id] = person.tags.map(t => t.id)
      }
    })
    return map
  }, [rawPeople])

  // Filter and sort people
  const people = useMemo(() => {
    let filtered = [...rawPeople]

    // Apply health status filter from FilterBar
    if (filters.healthStatuses.size > 0) {
      filtered = filtered.filter(p => filters.healthStatuses.has(p.health_status))
    }

    // Apply tag filter
    // Note: Tag filtering will only work for people whose tags have been loaded
    // This is a limitation of the current implementation
    if (filters.tags.size > 0) {
      filtered = filtered.filter(p => {
        const personTags = personTagsMap[p.id] || []
        // Check if person has ANY of the selected tags
        return Array.from(filters.tags).some(tagId => personTags.includes(tagId))
      })
    }

    // Apply last contact days filter
    if (filters.lastContactDays !== null) {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - filters.lastContactDays)
      filtered = filtered.filter(p => {
        if (!p.last_contact_date) return false
        return new Date(p.last_contact_date) >= cutoffDate
      })
    }

    // Apply field presence filters
    if (filters.hasEmail) {
      filtered = filtered.filter(p => p.email && p.email.trim().length > 0)
    }
    if (filters.hasPhone) {
      filtered = filtered.filter(p => p.phone_number && p.phone_number.trim().length > 0)
    }
    if (filters.hasBirthday) {
      filtered = filtered.filter(p => p.birthday && p.birthday.trim().length > 0)
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal: any = a[sortColumn]
      let bVal: any = b[sortColumn]

      // Handle null/undefined
      if (!aVal && !bVal) return 0
      if (!aVal) return 1
      if (!bVal) return -1

      // Convert to comparable values
      if (sortColumn === 'last_contact_date' || sortColumn === 'birthday') {
        aVal = new Date(aVal).getTime()
        bVal = new Date(bVal).getTime()
      }

      const result = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      return sortDirection === 'asc' ? result : -result
    })

    return filtered
  }, [rawPeople, filters, sortColumn, sortDirection, personTagsMap])

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(people.map(p => p.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleSelectRow = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds)
    if (checked) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedIds(newSelected)
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    navigate({
      search: { ...search, search: value || undefined }
    })
  }

  const handleClearSelection = () => {
    setSelectedIds(new Set())
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div>Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 text-center">
        <div className="text-red-600 font-medium mb-2">Error loading people</div>
        <div className="text-sm text-muted-foreground">
          {error.message || 'Failed to connect to API'}
        </div>
      </div>
    )
  }

  const allSelected = people.length > 0 && selectedIds.size === people.length
  const someSelected = selectedIds.size > 0 && selectedIds.size < people.length

  // Count active filters
  const activeFilterCount =
    filters.healthStatuses.size +
    filters.tags.size +
    (filters.hasEmail ? 1 : 0) +
    (filters.hasPhone ? 1 : 0) +
    (filters.hasBirthday ? 1 : 0) +
    (filters.lastContactDays ? 1 : 0)

  return (
    <>
      <HamburgerMenu />
      <div className="flex-1 flex flex-col bg-background">
        {/* Header with hamburger menu and search */}
        <div className="border-b border-border bg-card p-4 flex items-center gap-4">
          <Button
            size="icon"
            variant="ghost"
            onClick={toggleHamburgerMenu}
            title="Menu"
          >
            <Menu size={20} />
          </Button>

          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search people..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="text-sm text-muted-foreground">
            {people.length} {people.length === 1 ? 'person' : 'people'}
          </div>
        </div>

        {/* Filter bar */}
        <FilterBar
          filters={filters}
          onFiltersChange={setFilters}
          activeFilterCount={activeFilterCount}
          availableTags={allTags}
        />

        {/* Bulk actions toolbar */}
        {selectedIds.size > 0 && (
          <BulkActionsToolbar
            selectedCount={selectedIds.size}
            selectedIds={Array.from(selectedIds)}
            onClearSelection={handleClearSelection}
          />
        )}

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full border-collapse">
            <thead className="bg-muted/30 sticky top-0 z-10 border-b border-border">
              <tr>
                <th className="w-12 p-3 text-left border-r border-border">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={input => {
                      if (input) input.indeterminate = someSelected
                    }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 cursor-pointer"
                  />
                </th>
                <SortableHeader
                  label="Name"
                  column="name"
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Health Score"
                  column="health_score"
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                  className="w-32"
                />
                <SortableHeader
                  label="Last Contact"
                  column="last_contact_date"
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                  className="w-40"
                />
                <th className="p-3 text-left text-sm font-medium border-r border-border w-48">
                  Tags
                </th>
                <SortableHeader
                  label="Birthday"
                  column="birthday"
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                  className="w-32"
                />
                <th className="p-3 text-left text-sm font-medium border-r border-border w-24">
                  Zip
                </th>
              </tr>
            </thead>
            <tbody>
              {people.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    No people found
                  </td>
                </tr>
              ) : (
                people.map((person) => (
                  <TableRow
                    key={person.id}
                    person={person}
                    selected={selectedIds.has(person.id)}
                    onSelect={handleSelectRow}
                    tags={person.tags || []}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

interface SortableHeaderProps {
  label: string
  column: SortColumn
  sortColumn: SortColumn
  sortDirection: SortDirection
  onSort: (column: SortColumn) => void
  className?: string
}

function SortableHeader({ label, column, sortColumn, sortDirection, onSort, className }: SortableHeaderProps) {
  const isActive = sortColumn === column

  return (
    <th
      className={cn(
        "p-3 text-left text-sm font-medium border-r border-border cursor-pointer hover:bg-muted/50 select-none",
        className
      )}
      onClick={() => onSort(column)}
    >
      <div className="flex items-center gap-2">
        <span>{label}</span>
        <div className="flex flex-col">
          <ChevronUp
            size={12}
            className={cn(
              "text-muted-foreground",
              isActive && sortDirection === 'asc' && "text-foreground"
            )}
          />
          <ChevronDown
            size={12}
            className={cn(
              "text-muted-foreground -mt-1",
              isActive && sortDirection === 'desc' && "text-foreground"
            )}
          />
        </div>
      </div>
    </th>
  )
}

interface TableRowProps {
  person: Person
  selected: boolean
  onSelect: (id: string, checked: boolean) => void
  tags: Tag[]
}

function TableRow({ person, selected, onSelect, tags }: TableRowProps) {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const formatBirthday = (dateStr?: string) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <tr
      className={cn(
        "border-b border-border hover:bg-muted/30 transition-colors",
        selected && "bg-blue-50"
      )}
    >
      <td className="p-3 border-r border-border">
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => onSelect(person.id, e.target.checked)}
          className="w-4 h-4 cursor-pointer"
        />
      </td>
      <td className="p-3 border-r border-border font-medium">
        {person.name}
      </td>
      <td className="p-3 border-r border-border">
        <div className="flex items-center gap-2">
          <span className="text-lg">{person.health_emoji}</span>
          <span className="font-mono text-sm">{person.health_score}</span>
        </div>
      </td>
      <td className="p-3 border-r border-border text-sm text-muted-foreground">
        {formatDate(person.last_contact_date)}
        {person.days_since_contact !== null && person.days_since_contact !== undefined && (
          <span className="ml-2 text-xs">
            ({person.days_since_contact}d ago)
          </span>
        )}
      </td>
      <td className="p-3 border-r border-border">
        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {tags.map(tag => (
              <span
                key={tag.id}
                className="inline-flex items-center px-2 py-0.5 bg-primary/10 border border-primary/20 rounded-full text-xs"
                style={{
                  backgroundColor: tag.color ? `${tag.color}15` : undefined,
                  borderColor: tag.color ? `${tag.color}40` : undefined,
                  color: tag.color || undefined
                }}
              >
                {tag.name}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        )}
      </td>
      <td className="p-3 border-r border-border text-sm">
        {formatBirthday(person.birthday)}
      </td>
      <td className="p-3 border-r border-border text-sm">
        {person.zip || '-'}
      </td>
    </tr>
  )
}
