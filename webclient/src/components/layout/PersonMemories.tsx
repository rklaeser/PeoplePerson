import { useState } from 'react'
import { useNotebookEntries, useCreateNotebookEntry, useUpdateNotebookEntry, useDeleteNotebookEntry } from '@/hooks/api-hooks'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Edit, Trash2, Plus } from 'lucide-react'

interface PersonMemoriesProps {
  personId: string
}

// Component to linkify URLs in text
function LinkifiedText({ text }: { text: string }) {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const parts = text.split(urlRegex)

  return (
    <>
      {parts.map((part, index) => {
        if (part.match(urlRegex)) {
          return (
            <a
              key={index}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline hover:text-primary/80"
            >
              {part}
            </a>
          )
        }
        return <span key={index}>{part}</span>
      })}
    </>
  )
}

export function PersonMemories({ personId }: PersonMemoriesProps) {
  const { data: entries = [], isLoading: entriesLoading } = useNotebookEntries(personId)
  const createEntry = useCreateNotebookEntry()
  const updateEntry = useUpdateNotebookEntry()
  const deleteEntry = useDeleteNotebookEntry()
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState('')
  const [isCreatingEntry, setIsCreatingEntry] = useState(false)
  const [newEntryContent, setNewEntryContent] = useState('')

  // Format timestamp for notebook entries
  const formatTimestamp = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const entryDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

    const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

    if (entryDate.getTime() === today.getTime()) {
      return `Today at ${timeStr}`
    } else if (entryDate.getTime() === yesterday.getTime()) {
      return `Yesterday at ${timeStr}`
    } else {
      return `${date.toLocaleDateString()} at ${timeStr}`
    }
  }

  // Notebook handlers
  const handleNewEntry = () => {
    setIsCreatingEntry(true)
    setNewEntryContent('')
  }

  const handleSaveNewEntry = async () => {
    if (!newEntryContent.trim()) return

    try {
      await createEntry.mutateAsync({
        personId,
        content: newEntryContent
      })
      setNewEntryContent('')
      setIsCreatingEntry(false)
    } catch (error) {
      console.error('Failed to create entry:', error)
    }
  }

  const handleCancelNewEntry = () => {
    setIsCreatingEntry(false)
    setNewEntryContent('')
  }

  const handleEditEntry = (entryId: string, content: string) => {
    setEditingEntryId(entryId)
    setEditingContent(content)
  }

  const handleSaveEntry = async (entryId: string) => {
    if (!editingContent.trim()) return

    try {
      await updateEntry.mutateAsync({
        personId,
        entryId,
        content: editingContent
      })
      setEditingEntryId(null)
    } catch (error) {
      console.error('Failed to update entry:', error)
    }
  }

  const handleCancelEdit = () => {
    setEditingEntryId(null)
    setEditingContent('')
  }

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return

    try {
      await deleteEntry.mutateAsync({ personId, entryId })
    } catch (error) {
      console.error('Failed to delete entry:', error)
    }
  }

  return (
    <div className="flex-1 overflow-auto custom-scrollbar p-6">
      <div className="max-w-2xl mx-auto">
        {/* Add button in top right */}
        <div className="flex justify-end mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNewEntry}
            disabled={isCreatingEntry}
            className="gap-1"
          >
            <Plus size={16} />
          </Button>
        </div>

        {entriesLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading entries...</div>
        ) : (
          <div className="space-y-6">
            {/* New entry form */}
            {isCreatingEntry && (
              <div className="pb-6 border-b border-border">
                <div className="text-sm font-medium text-muted-foreground mb-3">
                  {formatTimestamp(new Date().toISOString())}
                </div>
                <Textarea
                  value={newEntryContent}
                  onChange={(e) => setNewEntryContent(e.target.value)}
                  placeholder="Write your memory..."
                  className="min-h-[100px] mb-3"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveNewEntry} disabled={createEntry.isPending}>
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCancelNewEntry}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Existing entries */}
            {entries.length === 0 && !isCreatingEntry ? (
              <p className="text-muted-foreground text-center py-8">
                No memories yet. Click + to add one.
              </p>
            ) : (
              entries.map((entry, index) => (
                <div key={entry.id} className={index > 0 || isCreatingEntry ? "pt-6 border-t border-border" : ""}>
                  {editingEntryId === entry.id ? (
                    // Edit mode
                    <div className="space-y-3">
                      <div className="text-sm font-medium text-muted-foreground">
                        {formatTimestamp(entry.created_at)}
                      </div>
                      <Textarea
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        className="min-h-[100px]"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleSaveEntry(entry.id)} disabled={updateEntry.isPending}>
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View mode
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-muted-foreground">
                          {formatTimestamp(entry.created_at)}
                        </span>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditEntry(entry.id, entry.content)}
                          >
                            <Edit size={14} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteEntry(entry.id)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">
                        <LinkifiedText text={entry.content} />
                      </p>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
