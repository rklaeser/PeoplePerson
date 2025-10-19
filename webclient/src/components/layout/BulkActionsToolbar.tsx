import { Button } from '@/components/ui/button'
import { X, Tags, Trash2, Download } from 'lucide-react'
import { useState } from 'react'
import { usePeople } from '@/hooks/api-hooks'

interface BulkActionsToolbarProps {
  selectedCount: number
  selectedIds: string[]
  onClearSelection: () => void
}

export function BulkActionsToolbar({ selectedCount, selectedIds, onClearSelection }: BulkActionsToolbarProps) {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const { data: people = [] } = usePeople({})

  const handleExportCSV = () => {
    // Get selected people data
    const selectedPeople = people.filter(p => selectedIds.includes(p.id))

    // Create CSV content
    const headers = ['Name', 'Health Score', 'Last Contact', 'Tags', 'Birthday', 'Zip', 'Email', 'Phone']
    const rows = selectedPeople.map(person => [
      person.name,
      person.health_score,
      person.last_contact_date || '',
      '', // Tags placeholder
      person.birthday || '',
      person.zip || '',
      person.email || '',
      person.phone_number || ''
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `people-export-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleDelete = () => {
    // TODO: Implement actual delete API call
    console.log('Delete selected:', selectedIds)
    setShowConfirmDelete(false)
    onClearSelection()
  }

  const handleAddTags = () => {
    // TODO: Open tag picker modal
    console.log('Add tags to:', selectedIds)
  }

  return (
    <div className="bg-blue-50 border-b border-blue-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">
            {selectedCount} selected
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={onClearSelection}
            className="h-6 px-2"
          >
            <X size={14} />
          </Button>
        </div>

        <div className="h-6 w-px bg-border" />

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleAddTags}
            className="gap-2"
          >
            <Tags size={16} />
            Add Tags
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleExportCSV}
            className="gap-2"
          >
            <Download size={16} />
            Export CSV
          </Button>

          {showConfirmDelete ? (
            <div className="flex items-center gap-2 ml-2">
              <span className="text-sm text-destructive font-medium">
                Delete {selectedCount} {selectedCount === 1 ? 'person' : 'people'}?
              </span>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleDelete}
              >
                Confirm
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowConfirmDelete(false)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowConfirmDelete(true)}
              className="gap-2 text-destructive hover:text-destructive"
            >
              <Trash2 size={16} />
              Delete
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
