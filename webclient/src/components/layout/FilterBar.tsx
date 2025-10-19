import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { X, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface TableFilters {
  healthStatuses: Set<string>
  tags: Set<string>
  hasEmail: boolean | null
  hasPhone: boolean | null
  hasBirthday: boolean | null
  lastContactDays: number | null
}

interface FilterBarProps {
  filters: TableFilters
  onFiltersChange: (filters: TableFilters) => void
  activeFilterCount: number
  availableTags: Array<{ id: string; name: string }>
}

export function FilterBar({ filters, onFiltersChange, activeFilterCount, availableTags }: FilterBarProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const toggleHealthStatus = (status: string) => {
    const newStatuses = new Set(filters.healthStatuses)
    if (newStatuses.has(status)) {
      newStatuses.delete(status)
    } else {
      newStatuses.add(status)
    }
    onFiltersChange({ ...filters, healthStatuses: newStatuses })
  }

  const toggleTag = (tagId: string) => {
    const newTags = new Set(filters.tags)
    if (newTags.has(tagId)) {
      newTags.delete(tagId)
    } else {
      newTags.add(tagId)
    }
    onFiltersChange({ ...filters, tags: newTags })
  }

  const clearAllFilters = () => {
    onFiltersChange({
      healthStatuses: new Set(),
      tags: new Set(),
      hasEmail: null,
      hasPhone: null,
      hasBirthday: null,
      lastContactDays: null,
    })
  }

  const healthOptions = [
    { value: 'healthy', label: 'Healthy', emoji: '🌳', color: 'bg-green-100 text-green-800 border-green-300' },
    { value: 'warning', label: 'Warning', emoji: '⚠️', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
    { value: 'dormant', label: 'Dormant', emoji: '🪵', color: 'bg-red-100 text-red-800 border-red-300' },
  ]

  const lastContactOptions = [
    { value: 7, label: 'Last 7 days' },
    { value: 30, label: 'Last 30 days' },
    { value: 90, label: 'Last 90 days' },
    { value: 180, label: 'Last 6 months' },
  ]

  return (
    <div className="border-b border-border bg-muted/20">
      <div className="p-3 flex items-center gap-3">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsExpanded(!isExpanded)}
          className="gap-2"
        >
          <Filter size={16} />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-primary text-primary-foreground rounded-full text-xs font-medium">
              {activeFilterCount}
            </span>
          )}
        </Button>

        {activeFilterCount > 0 && (
          <Button
            size="sm"
            variant="ghost"
            onClick={clearAllFilters}
            className="gap-2 text-muted-foreground"
          >
            <X size={14} />
            Clear all
          </Button>
        )}

        {/* Active filter pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {Array.from(filters.healthStatuses).map(status => {
            const option = healthOptions.find(o => o.value === status)
            if (!option) return null
            return (
              <FilterPill
                key={status}
                label={`${option.emoji} ${option.label}`}
                onRemove={() => toggleHealthStatus(status)}
              />
            )
          })}
          {Array.from(filters.tags).map(tagId => {
            const tag = availableTags.find(t => t.id === tagId)
            if (!tag) return null
            return (
              <FilterPill
                key={tagId}
                label={`🏷️ ${tag.name}`}
                onRemove={() => toggleTag(tagId)}
              />
            )
          })}
          {filters.lastContactDays && (
            <FilterPill
              label={`Last ${filters.lastContactDays} days`}
              onRemove={() => onFiltersChange({ ...filters, lastContactDays: null })}
            />
          )}
          {filters.hasEmail && (
            <FilterPill
              label="Has email"
              onRemove={() => onFiltersChange({ ...filters, hasEmail: null })}
            />
          )}
          {filters.hasPhone && (
            <FilterPill
              label="Has phone"
              onRemove={() => onFiltersChange({ ...filters, hasPhone: null })}
            />
          )}
          {filters.hasBirthday && (
            <FilterPill
              label="Has birthday"
              onRemove={() => onFiltersChange({ ...filters, hasBirthday: null })}
            />
          )}
        </div>
      </div>

      {/* Expanded filter options */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-border bg-card pt-3">
          {/* Health Status Filter */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">
              Health Status
            </label>
            <div className="flex gap-2">
              {healthOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => toggleHealthStatus(option.value)}
                  className={cn(
                    "px-3 py-1.5 rounded-md border text-sm font-medium transition-all",
                    filters.healthStatuses.has(option.value)
                      ? option.color
                      : "bg-background border-border text-muted-foreground hover:bg-muted"
                  )}
                >
                  <span className="mr-1">{option.emoji}</span>
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Last Contact Filter */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">
              Last Contact
            </label>
            <div className="flex gap-2">
              {lastContactOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => onFiltersChange({
                    ...filters,
                    lastContactDays: filters.lastContactDays === option.value ? null : option.value
                  })}
                  className={cn(
                    "px-3 py-1.5 rounded-md border text-sm font-medium transition-all",
                    filters.lastContactDays === option.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border text-muted-foreground hover:bg-muted"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Field Presence Filters */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">
              Has Information
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => onFiltersChange({
                  ...filters,
                  hasEmail: filters.hasEmail ? null : true
                })}
                className={cn(
                  "px-3 py-1.5 rounded-md border text-sm font-medium transition-all",
                  filters.hasEmail
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border text-muted-foreground hover:bg-muted"
                )}
              >
                Email
              </button>
              <button
                onClick={() => onFiltersChange({
                  ...filters,
                  hasPhone: filters.hasPhone ? null : true
                })}
                className={cn(
                  "px-3 py-1.5 rounded-md border text-sm font-medium transition-all",
                  filters.hasPhone
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border text-muted-foreground hover:bg-muted"
                )}
              >
                Phone
              </button>
              <button
                onClick={() => onFiltersChange({
                  ...filters,
                  hasBirthday: filters.hasBirthday ? null : true
                })}
                className={cn(
                  "px-3 py-1.5 rounded-md border text-sm font-medium transition-all",
                  filters.hasBirthday
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border text-muted-foreground hover:bg-muted"
                )}
              >
                Birthday
              </button>
            </div>
          </div>

          {/* Tags filter */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">
              Tags
            </label>
            {availableTags.length === 0 ? (
              <div className="text-xs text-muted-foreground italic">
                No tags available yet. Add tags to people in their profiles.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {availableTags.map(tag => (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-md border text-sm font-medium transition-all",
                      filters.tags.has(tag.id)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border text-muted-foreground hover:bg-muted"
                    )}
                  >
                    🏷️ {tag.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function FilterPill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <div className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-xs font-medium">
      <span>{label}</span>
      <button
        onClick={onRemove}
        className="hover:bg-primary/20 rounded p-0.5"
      >
        <X size={12} />
      </button>
    </div>
  )
}
