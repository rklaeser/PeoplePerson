import { useState } from 'react'
import { usePerson, useUpdatePerson, useNotebookEntries, useCreateNotebookEntry, useUpdateNotebookEntry, useDeleteNotebookEntry, useMarkAsContacted, usePersonTags, useAddTagToPerson, useRemoveTagFromPerson, useTags } from '@/hooks/api-hooks'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { HealthScore } from '@/components/HealthScore'
import { cn } from '@/lib/utils'
import { Edit, Phone, MapPin, Calendar, Brain, X, Check, Plus, Trash2, MessageCircle, Tag as TagIcon } from 'lucide-react'
import type { PersonUpdate } from '@/types/api'

interface PersonProfileProps {
  personId: string
}

export function PersonProfile({ personId }: PersonProfileProps) {
  const { data: person, isLoading } = usePerson(personId)
  const updatePerson = useUpdatePerson()
  const markAsContacted = useMarkAsContacted()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<PersonUpdate>({})

  // Notebook state
  const { data: entries = [], isLoading: entriesLoading } = useNotebookEntries(personId)
  const createEntry = useCreateNotebookEntry()
  const updateEntry = useUpdateNotebookEntry()
  const deleteEntry = useDeleteNotebookEntry()
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState('')
  const [isCreatingEntry, setIsCreatingEntry] = useState(false)
  const [newEntryContent, setNewEntryContent] = useState('')

  // Tags state
  const { data: personTags = [], isLoading: tagsLoading } = usePersonTags(personId)
  const { data: allTags = [] } = useTags()
  const addTagToPerson = useAddTagToPerson()
  const removeTagFromPerson = useRemoveTagFromPerson()
  const [isAddingTag, setIsAddingTag] = useState(false)
  const [newTagName, setNewTagName] = useState('')

  // Filter available tags (not already assigned to this person)
  const availableTags = allTags.filter(
    tag => !personTags.find(pt => pt.id === tag.id)
  )

  // Filter suggested tags based on search
  const suggestedTags = availableTags.filter(tag =>
    tag.name.toLowerCase().includes(newTagName.toLowerCase())
  )

  const handleMarkAsContacted = async () => {
    try {
      await markAsContacted.mutateAsync(personId)
    } catch (error) {
      console.error('Failed to mark as contacted:', error)
    }
  }

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

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div>Loading profile...</div>
      </div>
    )
  }

  if (!person) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div>Profile not found</div>
      </div>
    )
  }

  const handleEdit = () => {
    setFormData({
      name: person.name,
      phone_number: person.phone_number || '',
      zip: person.zip || '',
      birthday: person.birthday || '',
    })
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setFormData({})
  }

  const handleSave = async () => {
    try {
      await updatePerson.mutateAsync({ id: personId, data: formData })
      setIsEditing(false)
      setFormData({})
    } catch (error) {
      console.error('Failed to update person:', error)
    }
  }

  // Notebook handlers
  const handleNewEntry = () => {
    setIsCreatingEntry(true)
    setNewEntryContent('')
  }

  const handleCancelNewEntry = () => {
    setIsCreatingEntry(false)
    setNewEntryContent('')
  }

  const handleSaveNewEntry = async () => {
    if (!newEntryContent.trim()) return

    try {
      const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
      await createEntry.mutateAsync({
        personId,
        data: {
          entry_date: today,
          content: newEntryContent,
        },
      })
      setIsCreatingEntry(false)
      setNewEntryContent('')
    } catch (error) {
      console.error('Failed to create entry:', error)
    }
  }

  const handleEditEntry = (entryId: string, content: string) => {
    setEditingEntryId(entryId)
    setEditingContent(content)
  }

  const handleCancelEdit = () => {
    setEditingEntryId(null)
    setEditingContent('')
  }

  const handleSaveEntry = async (entryId: string) => {
    try {
      await updateEntry.mutateAsync({
        personId,
        entryId,
        data: { content: editingContent },
      })
      setEditingEntryId(null)
      setEditingContent('')
    } catch (error) {
      console.error('Failed to update entry:', error)
    }
  }

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return

    try {
      await deleteEntry.mutateAsync({ personId, entryId })
    } catch (error) {
      console.error('Failed to delete entry:', error)
    }
  }

  // Tag handlers
  const handleAddTag = async (tagName?: string) => {
    const nameToAdd = tagName || newTagName.trim()
    if (!nameToAdd) return

    try {
      await addTagToPerson.mutateAsync({
        personId,
        tagData: { name: nameToAdd, category: 'general' }
      })
      setNewTagName('')
      setIsAddingTag(false)
    } catch (error) {
      console.error('Failed to add tag:', error)
    }
  }

  const handleRemoveTag = async (tagId: string) => {
    try {
      await removeTagFromPerson.mutateAsync({ personId, tagId })
    } catch (error) {
      console.error('Failed to remove tag:', error)
    }
  }

  const handleQuickAddTag = async (tagName: string) => {
    await handleAddTag(tagName)
  }

  return (
    <div className="flex-1 overflow-auto custom-scrollbar p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <Avatar name={person.name} size={80} />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              {isEditing ? (
                <Input
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="text-2xl font-bold h-12"
                  placeholder="Name"
                />
              ) : (
                <h1 className="text-2xl font-bold">{person.name}</h1>
              )}
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancel}
                      disabled={updatePerson.isPending}
                    >
                      <X size={16} className="mr-2" />
                      Cancel
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleSave}
                      disabled={updatePerson.isPending}
                    >
                      <Check size={16} className="mr-2" />
                      Save
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" size="sm" onClick={handleEdit}>
                    <Edit size={16} className="mr-2" />
                    Edit
                  </Button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <HealthScore
                score={person.health_score}
                status={person.health_status}
                emoji={person.health_emoji}
                daysSinceContact={person.days_since_contact}
                size="md"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAsContacted}
                disabled={markAsContacted.isPending}
              >
                <MessageCircle size={16} className="mr-2" />
                Mark as Contacted
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              Added {new Date(person.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Contact Information</h2>
          <div className="space-y-3">
            {isEditing ? (
              <>
                <div className="flex items-center gap-3">
                  <Phone size={16} className="text-muted-foreground flex-shrink-0" />
                  <Input
                    value={formData.phone_number || ''}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    placeholder="Phone number"
                    type="tel"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <MapPin size={16} className="text-muted-foreground flex-shrink-0" />
                  <Input
                    value={formData.zip || ''}
                    onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                    placeholder="ZIP code"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Calendar size={16} className="text-muted-foreground flex-shrink-0" />
                  <Input
                    value={formData.birthday || ''}
                    onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                    placeholder="Birthday"
                  />
                </div>
              </>
            ) : (
              <>
                {person.phone_number && (
                  <div className="flex items-center gap-3">
                    <Phone size={16} className="text-muted-foreground" />
                    <span>{person.phone_number}</span>
                  </div>
                )}
                {person.zip && (
                  <div className="flex items-center gap-3">
                    <MapPin size={16} className="text-muted-foreground" />
                    <span>{person.zip}</span>
                  </div>
                )}
                {person.birthday && (
                  <div className="flex items-center gap-3">
                    <Calendar size={16} className="text-muted-foreground" />
                    <span>{person.birthday}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Tags */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <TagIcon size={16} />
              Tags
            </h2>
            {!isAddingTag && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddingTag(true)}
              >
                <Plus size={16} className="mr-2" />
                Add Tag
              </Button>
            )}
          </div>

          {tagsLoading ? (
            <div className="text-center py-4 text-muted-foreground">Loading tags...</div>
          ) : (
            <div className="space-y-3">
              {/* Add new tag form */}
              {isAddingTag && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      placeholder="Search or create tag (e.g., NoiseBridge)"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAddTag()
                        } else if (e.key === 'Escape') {
                          setIsAddingTag(false)
                          setNewTagName('')
                        }
                      }}
                      autoFocus
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsAddingTag(false)
                        setNewTagName('')
                      }}
                    >
                      Cancel
                    </Button>
                  </div>

                  {/* Suggested tags */}
                  {availableTags.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs text-muted-foreground font-medium">
                        {newTagName ? 'Matching tags' : 'Available tags'}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(newTagName ? suggestedTags : availableTags).slice(0, 10).map((tag) => (
                          <button
                            key={tag.id}
                            onClick={() => handleQuickAddTag(tag.name)}
                            disabled={addTagToPerson.isPending}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-secondary hover:bg-secondary/80 border border-border rounded-full text-sm transition-colors disabled:opacity-50"
                          >
                            <Plus size={12} />
                            {tag.name}
                          </button>
                        ))}
                      </div>
                      {newTagName && !suggestedTags.find(t => t.name.toLowerCase() === newTagName.toLowerCase()) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAddTag()}
                          disabled={addTagToPerson.isPending}
                          className="w-full"
                        >
                          <Plus size={14} className="mr-2" />
                          Create new tag "{newTagName}"
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Display existing tags */}
              {personTags.length === 0 && !isAddingTag ? (
                <p className="text-muted-foreground text-center py-4">
                  No tags yet. Click "Add Tag" to create one.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {personTags.map((tag) => (
                    <div
                      key={tag.id}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-sm"
                    >
                      <span>{tag.name}</span>
                      <button
                        onClick={() => handleRemoveTag(tag.id)}
                        className="hover:text-destructive transition-colors"
                        disabled={removeTagFromPerson.isPending}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Notebook */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Notebook</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNewEntry}
              disabled={isCreatingEntry}
            >
              <Plus size={16} className="mr-2" />
              New Entry
            </Button>
          </div>

          {entriesLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading entries...</div>
          ) : (
            <div className="space-y-4">
              {/* New entry form */}
              {isCreatingEntry && (
                <div className="border rounded-lg p-3 bg-muted/20">
                  <div className="text-sm font-medium text-muted-foreground mb-2">
                    {formatTimestamp(new Date().toISOString())}
                  </div>
                  <Textarea
                    value={newEntryContent}
                    onChange={(e) => setNewEntryContent(e.target.value)}
                    placeholder="Write your entry..."
                    className="min-h-[100px] mb-2"
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
                  No entries yet. Click "New Entry" to add one.
                </p>
              ) : (
                entries.map((entry) => (
                  <div key={entry.id} className="border rounded-lg p-3">
                    {editingEntryId === entry.id ? (
                      // Edit mode
                      <div className="space-y-2">
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
                        <div className="flex items-center justify-between mb-2">
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
                        <p className="text-sm whitespace-pre-wrap">{entry.content}</p>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Mnemonic */}
        {person.mnemonic && (
          <div className="bg-card border border-border rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Brain size={16} />
              Memory Aid
            </h2>
            <p className="text-muted-foreground italic">{person.mnemonic}</p>
          </div>
        )}

        {/* Statistics */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Statistics</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Last updated</div>
              <div className="font-medium">
                {new Date(person.updated_at).toLocaleDateString()}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Profile index</div>
              <div className="font-medium">{person.profile_pic_index}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}