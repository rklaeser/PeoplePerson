import { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { cn, formatTime } from '@/lib/utils'
import { X, ArrowUp, Loader2, Users, AlertCircle, Edit2, Save, XCircle, Mail, Phone, Trash2, ExternalLink } from 'lucide-react'
import { useExtractPeople, useConfirmPerson, useConfirmTagAssignment, useConfirmMemoryEntry, useUpdatePerson, useDeletePerson, usePeople } from '@/hooks/api-hooks'
import { useUIStore } from '@/stores/ui-store'
import type { ExtractionResponse, DuplicateWarning, Person, TagAssignmentMatch, MemoryUpdateMatch, PersonMatch } from '@/types/api'

interface ChatPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function ChatPanel({ isOpen, onClose }: ChatPanelProps) {
  const navigate = useNavigate()
  const { assistantName } = useUIStore()
  const [narrative, setNarrative] = useState('')
  const [extractionResult, setExtractionResult] = useState<ExtractionResponse | null>(null)
  const [sessionContacts, setSessionContacts] = useState<Person[]>([])
  const [editingContactId, setEditingContactId] = useState<string | null>(null)
  const [disambiguationSelections, setDisambiguationSelections] = useState<Record<string, string>>({})

  const extractPeople = useExtractPeople()
  const confirmPerson = useConfirmPerson()
  const confirmTagAssignment = useConfirmTagAssignment()
  const confirmMemoryEntry = useConfirmMemoryEntry()
  const updatePerson = useUpdatePerson()
  const deletePerson = useDeletePerson()
  const { data: allPeople = [] } = usePeople({})

  // Clear session when panel closes
  useEffect(() => {
    if (!isOpen) {
      setSessionContacts([])
      setEditingContactId(null)
      setNarrative('')
      setExtractionResult(null)
      setDisambiguationSelections({})
    }
  }, [isOpen])

  // Clear disambiguation selections when extraction result changes
  useEffect(() => {
    setDisambiguationSelections({})
  }, [extractionResult])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!narrative.trim()) return

    // Check character limit
    if (narrative.length > 1000) {
      alert('Message is too long. Please keep it under 1000 characters.')
      return
    }

    try {
      const result = await extractPeople.mutateAsync({ narrative })
      setExtractionResult(result)

      // If successful extraction with no duplicates, add to session and clear textarea
      if (result.message && result.message.includes('Added') && result.created_persons) {
        // Add created persons to session
        setSessionContacts(prev => [...prev, ...result.created_persons!])

        // Clear textarea for next entry
        setNarrative('')

        // Clear extraction result after a brief moment
        setTimeout(() => {
          setExtractionResult(null)
        }, 3000)
      }
    } catch (error) {
      console.error('Extraction failed:', error)
    }
  }

  const handleDuplicateAction = async (
    warning: DuplicateWarning,
    action: 'create_new' | 'link_existing'
  ) => {
    try {
      const person = await confirmPerson.mutateAsync({
        extraction: warning.extraction,
        action,
        existing_id: action === 'link_existing' ? warning.existing_id : undefined,
      })

      // Add to session contacts
      setSessionContacts(prev => [...prev, person])

      // Remove this duplicate from the list
      setExtractionResult(prev => {
        if (!prev || !prev.duplicates) return prev
        const remaining = prev.duplicates.filter(d => d !== warning)

        // If no more duplicates, clear textarea
        if (remaining.length === 0) {
          setNarrative('')
          // Clear extraction result after showing success
          setTimeout(() => setExtractionResult(null), 2000)
        }

        return {
          ...prev,
          duplicates: remaining
        }
      })
    } catch (error) {
      console.error('Confirmation failed:', error)
    }
  }

  const handleTagAssignment = async (assignment: TagAssignmentMatch) => {
    try {
      // Collect all valid person IDs from all matches
      const validPersonIds: string[] = []

      // Collect person IDs from all matched people
      for (const matchResult of assignment.matched_people) {
        if (matchResult.matches.length === 0) {
          // Skip unmatched
          continue
        } else if (matchResult.is_ambiguous) {
          // Use the selected person ID from disambiguation
          const selectedId = disambiguationSelections[matchResult.extracted_name]
          if (selectedId) {
            validPersonIds.push(selectedId)
          }
        } else {
          // Single match - use it
          validPersonIds.push(matchResult.matches[0].person_id)
        }
      }

      if (validPersonIds.length === 0) {
        alert('No matching people found. Please create these contacts first.')
        return
      }

      await confirmTagAssignment.mutateAsync({
        tag_name: assignment.tag_name,
        operation: assignment.operation,
        person_ids: validPersonIds
      })

      // Remove this assignment from the list
      setExtractionResult(prev => {
        if (!prev || !prev.tag_assignments) return prev
        const remaining = prev.tag_assignments.filter(a => a !== assignment)

        // If no more tag assignments, clear textarea
        if (remaining.length === 0) {
          setNarrative('')
          // Clear extraction result after showing success
          setTimeout(() => setExtractionResult(null), 2000)
        }

        return {
          ...prev,
          tag_assignments: remaining
        }
      })
    } catch (error) {
      console.error('Tag assignment failed:', error)
    }
  }

  const handleMemoryEntry = async (update: MemoryUpdateMatch) => {
    try {
      // Check if ambiguous
      if (update.matched_person.is_ambiguous) {
        alert('Multiple people match this name. Please be more specific.')
        return
      }

      // Prepare request - either with person_id (existing) or person_name (new)
      const hasMatch = update.matched_person.matches.length > 0
      const request = hasMatch
        ? {
            person_id: update.matched_person.matches[0].person_id,
            content: update.entry_content,
            date: update.parsed_date
          }
        : {
            person_name: update.matched_person.extracted_name,
            content: update.entry_content,
            date: update.parsed_date
          }

      await confirmMemoryEntry.mutateAsync(request)

      // Remove this entry from the list
      setExtractionResult(prev => {
        if (!prev || !prev.memory_updates) return prev
        const remaining = prev.memory_updates.filter(u => u !== update)

        // If no more memory entries, clear textarea
        if (remaining.length === 0) {
          setNarrative('')
          // Clear extraction result after showing success
          setTimeout(() => setExtractionResult(null), 2000)
        }

        return {
          ...prev,
          memory_updates: remaining
        }
      })
    } catch (error) {
      console.error('Memory entry failed:', error)
    }
  }

  const handleClose = () => {
    setSessionContacts([])
    setEditingContactId(null)
    setNarrative('')
    setExtractionResult(null)
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 transition-opacity z-40",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={handleClose}
      />

      {/* Panel */}
      <div
        className={cn(
          "fixed right-0 top-0 h-full w-full sm:w-[480px] bg-background border-l shadow-2xl transition-transform duration-300 z-50 flex flex-col",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-muted/50 border-2 border-border flex items-center justify-center p-1">
              <img
                src={assistantName === 'Scout' ? '/scout.png' : '/nico.png'}
                alt={assistantName}
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            <h2 className="text-lg font-semibold">{assistantName}</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
          >
            <X size={20} />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Instructions - Scout's message on left */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-muted/50 border-2 border-border flex items-center justify-center p-1">
                <img
                  src={assistantName === 'Scout' ? '/scout.png' : '/nico.png'}
                  alt={assistantName}
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              <span className="text-sm font-semibold">{assistantName}</span>
            </div>
            <Card className="p-4 bg-muted/50 max-w-[80%]">
              <p className="text-sm text-muted-foreground mb-2">
                Bark! Let's...
              </p>
              <ul className="text-sm text-muted-foreground/80 space-y-1">
                <li>• Add friends: "I met Sarah. She's a designer from Portland."</li>
                <li>• Update friends: "TJ and Jane are part of Noisebridge. Add the tag."</li>
                <li>• Record memories: "I saw Michael today. He went for a run."</li>
              </ul>
            </Card>
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit}>
            <div className="relative">
              <Textarea
                value={narrative}
                onChange={(e) => setNarrative(e.target.value)}
                placeholder="How can I help?"
                className="min-h-[120px] resize-none pr-12"
                disabled={extractPeople.isPending}
              />
              <button
                type="submit"
                disabled={!narrative.trim() || extractPeople.isPending}
                className={cn(
                  "absolute bottom-2 right-2 w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                  !narrative.trim() || extractPeople.isPending
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                )}
              >
                {extractPeople.isPending ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <ArrowUp size={18} />
                )}
              </button>
            </div>
          </form>

          {/* Results */}
          {extractionResult && (
            <div className="space-y-3">
              {/* Success Message */}
              {extractionResult.message && (
                <Card className={cn(
                  "p-4",
                  extractionResult.message.includes('Added')
                    ? "bg-blue-500/10 border-blue-500/20"
                    : "bg-muted"
                )}>
                  {extractionResult.created_persons && extractionResult.created_persons.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">
                        Created new {extractionResult.created_persons.length === 1 ? 'friend' : 'friends'}:
                      </p>
                      <div className="space-y-1">
                        {extractionResult.created_persons.map((person) => (
                          <button
                            key={person.id}
                            onClick={() => {
                              navigate({
                                to: '/people/$personId',
                                params: { personId: person.id },
                                search: { panel: 'profile' }
                              })
                              handleClose()
                            }}
                            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 hover:underline"
                          >
                            <span>{person.name}</span>
                            <ExternalLink size={14} />
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm">{extractionResult.message}</p>
                  )}
                </Card>
              )}

              {/* Duplicate Warnings */}
              {extractionResult.duplicates?.map((warning, index) => (
                <Card key={index} className="p-4 bg-yellow-500/10 border-yellow-500/20">
                  <div className="flex gap-2 mb-3">
                    <AlertCircle size={20} className="text-yellow-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-sm mb-1">
                        Found existing contact: {warning.existing_name}
                      </p>
                      {warning.existing_notes && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {warning.existing_notes}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mb-3">
                        Similarity: {(warning.similarity * 100).toFixed(0)}%
                      </p>
                      <p className="text-sm mb-2">
                        Is this the same person?
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleDuplicateAction(warning, 'link_existing')}
                      disabled={confirmPerson.isPending}
                      className="flex-1"
                    >
                      Yes, same person
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDuplicateAction(warning, 'create_new')}
                      disabled={confirmPerson.isPending}
                      className="flex-1"
                    >
                      No, create new
                    </Button>
                  </div>
                </Card>
              ))}

              {/* Tag Assignment Confirmations */}
              {extractionResult.tag_assignments?.map((assignment, index) => {
                const ambiguousMatches = assignment.matched_people.filter(m => m.is_ambiguous)
                const allAmbiguousResolved = ambiguousMatches.every(m =>
                  disambiguationSelections[m.extracted_name]
                )

                return (
                  <Card key={index} className="p-4 bg-blue-500/10 border-blue-500/20">
                    <div className="mb-3">
                      <p className="font-medium text-sm mb-3">
                        Add tag "{assignment.tag_name}" to:
                      </p>

                      {assignment.matched_people.map((matchResult, idx) => (
                        <div key={idx} className="mb-3 last:mb-0">
                          {matchResult.matches.length === 0 ? (
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-red-600">✗</span>
                              <span>{matchResult.extracted_name} (not found)</span>
                            </div>
                          ) : matchResult.is_ambiguous ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-yellow-600">⚠</span>
                                <span className="font-medium">Which "{matchResult.extracted_name}"?</span>
                              </div>
                              <div className="space-y-2 ml-6">
                                {matchResult.matches.map((match) => {
                                  const personDetails = allPeople.find(p => p.id === match.person_id)
                                  const isSelected = disambiguationSelections[matchResult.extracted_name] === match.person_id

                                  return (
                                    <button
                                      key={match.person_id}
                                      onClick={() => setDisambiguationSelections(prev => ({
                                        ...prev,
                                        [matchResult.extracted_name]: match.person_id
                                      }))}
                                      className={cn(
                                        "w-full text-left p-3 rounded-md border-2 transition-all",
                                        isSelected
                                          ? "border-blue-500 bg-blue-500/10"
                                          : "border-border bg-card hover:border-blue-300"
                                      )}
                                    >
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                          <p className="font-medium text-sm">{match.person_name}</p>
                                          {personDetails?.latest_notebook_entry_content && (
                                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                              {personDetails.latest_notebook_entry_content}
                                            </p>
                                          )}
                                          <p className="text-xs text-muted-foreground mt-1">
                                            Created {formatTime(personDetails?.created_at || '')}
                                          </p>
                                        </div>
                                        {isSelected && (
                                          <span className="text-blue-600 text-lg shrink-0">✓</span>
                                        )}
                                      </div>
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-green-600">✓</span>
                              <span>{matchResult.matches[0].person_name} ({(matchResult.matches[0].similarity * 100).toFixed(0)}% match)</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handleTagAssignment(assignment)}
                      disabled={confirmTagAssignment.isPending || !allAmbiguousResolved}
                      className="w-full"
                    >
                      {confirmTagAssignment.isPending ? 'Assigning...' :
                       !allAmbiguousResolved ? 'Select a person for each name' :
                       'Confirm'}
                    </Button>
                  </Card>
                )
              })}

              {/* Memory Confirmations */}
              {extractionResult.memory_updates?.map((update, index) => {
                const hasMatch = update.matched_person.matches.length > 0
                const isAmbiguous = update.matched_person.is_ambiguous

                return (
                  <Card key={index} className="p-4 bg-purple-500/10 border-purple-500/20">
                    <div className="mb-3">
                      <p className="font-medium text-sm mb-2">
                        {hasMatch && !isAmbiguous
                          ? 'Add memory:'
                          : isAmbiguous
                          ? 'Multiple matches found:'
                          : 'Create friend & add memory:'}
                      </p>
                      {isAmbiguous ? (
                        <>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-yellow-600">⚠</span>
                            <span className="text-sm font-medium">{update.matched_person.extracted_name} matches multiple people:</span>
                          </div>
                          <ul className="ml-6 space-y-0.5 mb-2">
                            {update.matched_person.matches.map((match, matchIdx) => (
                              <li key={matchIdx} className="text-xs text-muted-foreground">
                                • {match.person_name} ({(match.similarity * 100).toFixed(0)}% match)
                              </li>
                            ))}
                          </ul>
                          <p className="text-sm mb-1">
                            <span className="text-muted-foreground">Date:</span> {update.parsed_date}
                          </p>
                          <p className="text-sm mb-3">
                            <span className="text-muted-foreground">Entry:</span> {update.entry_content}
                          </p>
                        </>
                      ) : hasMatch ? (
                        <>
                          <p className="text-sm mb-1">
                            <span className="text-muted-foreground">Person:</span> {update.matched_person.matches[0].person_name} ({(update.matched_person.matches[0].similarity * 100).toFixed(0)}% match)
                          </p>
                          <p className="text-sm mb-1">
                            <span className="text-muted-foreground">Date:</span> {update.parsed_date}
                          </p>
                          <p className="text-sm mb-3">
                            <span className="text-muted-foreground">Entry:</span> {update.entry_content}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm mb-1">
                            <span className="text-muted-foreground">Person:</span> <span className="text-orange-600">{update.matched_person.extracted_name} (new)</span>
                          </p>
                          <p className="text-sm mb-1">
                            <span className="text-muted-foreground">Date:</span> {update.parsed_date}
                          </p>
                          <p className="text-sm mb-3">
                            <span className="text-muted-foreground">Entry:</span> {update.entry_content}
                          </p>
                        </>
                      )}
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handleMemoryEntry(update)}
                      disabled={confirmMemoryEntry.isPending || isAmbiguous}
                      className="w-full"
                    >
                      {confirmMemoryEntry.isPending ? (
                        hasMatch ? 'Adding...' : 'Creating...'
                      ) : isAmbiguous ? (
                        'Disambiguate name first'
                      ) : (
                        hasMatch ? 'Confirm' : 'Create friend & add memory'
                      )}
                    </Button>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Error State */}
          {extractPeople.isError && (
            <Card className="p-4 bg-red-500/10 border-red-500/20">
              <p className="text-sm text-red-600">
                {extractPeople.error instanceof Error
                  ? extractPeople.error.message
                  : 'Failed to extract contacts. Please try again.'}
              </p>
            </Card>
          )}

          {/* Session History */}
          {sessionContacts.length > 0 && (
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">
                  Created this session ({sessionContacts.length})
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSessionContacts([])}
                  className="text-xs h-7"
                >
                  Clear All
                </Button>
              </div>

              <div className="space-y-2">
                {sessionContacts.map((contact) => (
                  <ContactCard
                    key={contact.id}
                    contact={contact}
                    isEditing={editingContactId === contact.id}
                    onEdit={() => setEditingContactId(contact.id)}
                    onCancelEdit={() => setEditingContactId(null)}
                    onSave={async (updates) => {
                      await updatePerson.mutateAsync({
                        id: contact.id,
                        data: updates
                      })
                      // Update local state
                      setSessionContacts(prev =>
                        prev.map(c => c.id === contact.id ? { ...c, ...updates } : c)
                      )
                      setEditingContactId(null)
                    }}
                    onDelete={async () => {
                      await deletePerson.mutateAsync(contact.id)
                      setSessionContacts(prev => prev.filter(c => c.id !== contact.id))
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ContactCard Component
interface ContactCardProps {
  contact: Person
  isEditing: boolean
  onEdit: () => void
  onCancelEdit: () => void
  onSave: (updates: Partial<Person>) => Promise<void>
  onDelete: () => Promise<void>
}

function ContactCard({
  contact,
  isEditing,
  onEdit,
  onCancelEdit,
  onSave,
  onDelete
}: ContactCardProps) {
  const [editForm, setEditForm] = useState({
    name: contact.name,
    body: contact.body,
    email: contact.email || '',
    phone_number: contact.phone_number || ''
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(editForm)
    } catch (error) {
      console.error('Failed to save:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Delete ${contact.name}?`)) return

    setIsDeleting(true)
    try {
      await onDelete()
    } catch (error) {
      console.error('Failed to delete:', error)
      setIsDeleting(false)
    }
  }

  if (isEditing) {
    return (
      <Card className="p-4 space-y-3 bg-blue-500/5 border-blue-500/20">
        <div className="space-y-2">
          <label className="text-xs font-medium">Name</label>
          <Input
            value={editForm.name}
            onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Name"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium">Notes</label>
          <Textarea
            value={editForm.body}
            onChange={(e) => setEditForm(prev => ({ ...prev, body: e.target.value }))}
            placeholder="Notes about this person..."
            className="min-h-[80px] resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <label className="text-xs font-medium">Email</label>
            <Input
              type="email"
              value={editForm.email}
              onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
              placeholder="email@example.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium">Phone</label>
            <Input
              type="tel"
              value={editForm.phone_number}
              onChange={(e) => setEditForm(prev => ({ ...prev, phone_number: e.target.value }))}
              placeholder="123-456-7890"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving || !editForm.name.trim()}
            className="flex-1 gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={14} />
                Save
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onCancelEdit}
            disabled={isSaving}
            className="gap-2"
          >
            <XCircle size={14} />
            Cancel
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium truncate">{contact.name}</h4>
          {contact.body && contact.body !== "Add a description" && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {contact.body}
            </p>
          )}
          <div className="flex flex-col gap-1 mt-2">
            {contact.email && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Mail size={12} />
                <span className="truncate">{contact.email}</span>
              </div>
            )}
            {contact.phone_number && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Phone size={12} />
                <span>{contact.phone_number}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onEdit}
            title="Edit contact"
          >
            <Edit2 size={14} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleDelete}
            disabled={isDeleting}
            title="Delete contact"
          >
            {isDeleting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Trash2 size={14} />
            )}
          </Button>
        </div>
      </div>
    </Card>
  )
}
