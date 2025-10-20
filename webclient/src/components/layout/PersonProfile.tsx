import { useState, useEffect } from 'react'
import { usePerson, useUpdatePerson, useDeletePerson, usePeople, useNotebookEntries, useCreateNotebookEntry, useUpdateNotebookEntry, useDeleteNotebookEntry, useMarkAsContacted, usePersonTags, useAddTagToPerson, useRemoveTagFromPerson, useTags } from '@/hooks/api-hooks'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { HealthScore } from '@/components/HealthScore'
import { Edit, Phone, MapPin, Calendar, Brain, X, Check, Plus, Trash2, MessageCircle, Tag as TagIcon, PenLine } from 'lucide-react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import type { PersonUpdate } from '@/types/api'

interface PersonProfileProps {
  personId: string
}

export function PersonProfile({ personId }: PersonProfileProps) {
  const navigate = useNavigate()
  const search = useSearch({ strict: false }) as { edit?: string }
  const { data: person, isLoading } = usePerson(personId)
  const { data: allPeople = [] } = usePeople({})
  const updatePerson = useUpdatePerson()
  const deletePerson = useDeletePerson()
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

  // Check if we should start in edit mode based on URL parameter
  useEffect(() => {
    if (search.edit === 'true' && person && !isEditing) {
      setFormData({
        name: person.name,
        phone_number: person.phone_number || '',
        street_address: person.street_address || '',
        city: person.city || '',
        state: person.state || '',
        zip: person.zip || '',
        birthday: person.birthday || '',
      })
      setIsEditing(true)
    }
  }, [search.edit, person, isEditing])

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
    if (person) {
      setFormData({
        name: person.name,
        phone_number: person.phone_number || '',
        street_address: person.street_address || '',
        city: person.city || '',
        state: person.state || '',
        zip: person.zip || '',
        birthday: person.birthday || '',
      })
    }
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
      console.error('Failed to save person:', error)
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

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${person.name}? This action cannot be undone.`)) {
      return
    }

    try {
      // Determine next navigation target before deleting
      const remainingPeople = allPeople.filter(p => p.id !== personId)

      // Delete first (with optimistic updates)
      await deletePerson.mutateAsync(personId)

      // Then navigate after successful deletion
      if (remainingPeople.length > 0) {
        navigate({
          to: '/people/$personId',
          params: { personId: remainingPeople[0].id },
          search: { panel: 'profile' },
          replace: true
        })
      } else {
        // If no people left, go to empty people list
        navigate({ to: '/people', replace: true })
      }
    } catch (error) {
      console.error('Failed to delete person:', error)
      // Error handling: optimistic update will be rolled back automatically
    }
  }

  // Check if person has any contact information
  const hasContactInfo = !!(
    person.phone_number ||
    person.street_address ||
    person.city ||
    person.state ||
    person.zip ||
    person.birthday
  )

  return (
    <div className="flex-1 overflow-auto custom-scrollbar p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Tags and Edit/Save buttons at top */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Display existing tags */}
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

          {/* Add Tag button */}
          <button
            onClick={() => setIsAddingTag(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-background border border-border rounded-full text-sm hover:bg-accent transition-colors"
          >
            <Plus size={14} />
            Tag
          </button>

          {/* Spacer to push edit buttons to the right */}
          <div className="flex-1" />

          {/* Edit/Save buttons */}
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

        {/* Name editing - only show in edit mode */}
        {isEditing && (
          <div className="bg-card border border-border rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4">Name</h2>
            <Input
              value={formData.name ?? person.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Name"
              className="text-lg"
            />
          </div>
        )}

        {/* Add tag interface - shown when adding tag */}
        {isAddingTag && (
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="space-y-4">
              {/* Quick add - show available tags first */}
              {!newTagName && availableTags.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Quick add</div>
                  <div className="flex flex-wrap gap-2">
                    {availableTags.slice(0, 15).map((tag) => (
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
                </div>
              )}

              {/* Search or create */}
              <div className="space-y-2">
                <div className="text-sm font-medium">Search or create new</div>
                <div className="flex gap-2">
                  <Input
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="Type to search (e.g., Noisebridge) or create new tag"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (suggestedTags.length === 1) {
                          // If only one match, add that tag
                          handleQuickAddTag(suggestedTags[0].name)
                        } else {
                          // Otherwise create new tag
                          handleAddTag()
                        }
                      } else if (e.key === 'Escape') {
                        setIsAddingTag(false)
                        setNewTagName('')
                      }
                    }}
                    autoFocus={availableTags.length === 0}
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

                {/* Matching tags when typing */}
                {newTagName && suggestedTags.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground font-medium">
                      Matching tags - click to add
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {suggestedTags.map((tag) => (
                        <button
                          key={tag.id}
                          onClick={() => handleQuickAddTag(tag.name)}
                          disabled={addTagToPerson.isPending}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/20 hover:bg-primary/30 border border-primary/40 rounded-full text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          <Plus size={12} />
                          {tag.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Create new tag option */}
                {newTagName && newTagName.trim() && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddTag()}
                    disabled={addTagToPerson.isPending}
                    className="w-full"
                  >
                    <Plus size={14} className="mr-2" />
                    {suggestedTags.find(t => t.name.toLowerCase() === newTagName.toLowerCase())
                      ? `Add "${newTagName}"`
                      : `Create new tag "${newTagName}"`}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Contact Information - only show if editing or has contact info */}
        {(isEditing || hasContactInfo) && (
          <div className="bg-card border border-border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Contact Information</h2>
          <div className="space-y-3">
            {isEditing ? (
              <>
                <div className="flex items-center gap-3">
                  <Phone size={16} className="text-muted-foreground flex-shrink-0" />
                  <Input
                    value={formData.phone_number ?? person.phone_number ?? ''}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    placeholder="Phone number"
                    type="tel"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <MapPin size={16} className="text-muted-foreground flex-shrink-0" />
                  <Input
                    value={formData.street_address ?? person.street_address ?? ''}
                    onChange={(e) => setFormData({ ...formData, street_address: e.target.value })}
                    placeholder="Street Address"
                  />
                </div>
                <div className="flex items-center gap-3 ml-8">
                  <Input
                    value={formData.city ?? person.city ?? ''}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="City"
                    className="flex-1"
                  />
                  <Input
                    value={formData.state ?? person.state ?? ''}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="State"
                    className="w-20"
                  />
                  <Input
                    value={formData.zip ?? person.zip ?? ''}
                    onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                    placeholder="ZIP"
                    className="w-24"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Calendar size={16} className="text-muted-foreground flex-shrink-0" />
                  <Input
                    value={formData.birthday ?? person.birthday ?? ''}
                    onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                    placeholder="Birthday"
                  />
                </div>
              </>
            ) : (
              <>
                {person?.phone_number && (
                  <div className="flex items-center gap-3">
                    <Phone size={16} className="text-muted-foreground" />
                    <span>{person.phone_number}</span>
                  </div>
                )}
                {(person?.street_address || person?.city || person?.state || person?.zip) && (
                  <div className="flex items-center gap-3">
                    <MapPin size={16} className="text-muted-foreground flex-shrink-0" />
                    <div className="flex flex-col">
                      {person.street_address && <span>{person.street_address}</span>}
                      <span>
                        {[person.city, person.state, person.zip].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  </div>
                )}
                {person?.birthday && (
                  <div className="flex items-center gap-3">
                    <Calendar size={16} className="text-muted-foreground" />
                    <span>{person.birthday}</span>
                  </div>
                )}
              </>
            )}
          </div>
          </div>
        )}

        {/* Memories */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Memories</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNewEntry}
              disabled={isCreatingEntry}
            >
              <PenLine size={16} className="mr-2" />
              Write
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

        {/* Danger Zone - only show in edit mode */}
        {isEditing && (
          <div className="bg-card border border-destructive/50 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-2 text-destructive">Danger Zone</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Once you delete a person, there is no going back. Please be certain.
            </p>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deletePerson.isPending}
            >
              <Trash2 size={16} className="mr-2" />
              Delete Person
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}