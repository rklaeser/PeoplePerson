import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { X, Send, Loader2, Users, AlertCircle, Edit2, Save, XCircle, Mail, Phone, Trash2 } from 'lucide-react'
import { useExtractPeople, useConfirmPerson, useUpdatePerson, useDeletePerson } from '@/hooks/api-hooks'
import type { ExtractionResponse, DuplicateWarning, Person } from '@/types/api'

interface ChatPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function ChatPanel({ isOpen, onClose }: ChatPanelProps) {
  const [narrative, setNarrative] = useState('')
  const [extractionResult, setExtractionResult] = useState<ExtractionResponse | null>(null)
  const [sessionContacts, setSessionContacts] = useState<Person[]>([])
  const [editingContactId, setEditingContactId] = useState<string | null>(null)

  const extractPeople = useExtractPeople()
  const confirmPerson = useConfirmPerson()
  const updatePerson = useUpdatePerson()
  const deletePerson = useDeletePerson()

  // Clear session when panel closes
  useEffect(() => {
    if (!isOpen) {
      setSessionContacts([])
      setEditingContactId(null)
      setNarrative('')
      setExtractionResult(null)
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!narrative.trim()) return

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
            <Users size={20} />
            <h2 className="text-lg font-semibold">Add Contacts</h2>
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
          {/* Instructions */}
          <Card className="p-4 bg-muted/50">
            <p className="text-sm text-muted-foreground">
              Describe the people you've met and I'll create their contact records. For example:
            </p>
            <p className="text-sm mt-2 italic text-muted-foreground/80">
              "I met Sarah today. She's a designer from Portland who loves hiking."
            </p>
          </Card>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <Textarea
              value={narrative}
              onChange={(e) => setNarrative(e.target.value)}
              placeholder="Tell me about the people you met..."
              className="min-h-[120px] resize-none"
              disabled={extractPeople.isPending}
              maxLength={1000}
            />

            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {narrative.length}/1000
              </span>
              <Button
                type="submit"
                disabled={!narrative.trim() || extractPeople.isPending}
                className="gap-2"
              >
                {extractPeople.isPending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Extract
                  </>
                )}
              </Button>
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
                    ? "bg-green-500/10 border-green-500/20"
                    : "bg-muted"
                )}>
                  <p className="text-sm">{extractionResult.message}</p>
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
    phone_number: contact.phone_number || '',
    intent: contact.intent
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
