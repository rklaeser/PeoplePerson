import { usePerson } from '@/hooks/api-hooks'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { getIntentColor } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Edit, Phone, MapPin, Calendar, Brain } from 'lucide-react'

interface PersonProfileProps {
  personId: string
}

export function PersonProfile({ personId }: PersonProfileProps) {
  const { data: person, isLoading } = usePerson(personId)

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

  return (
    <div className="flex-1 overflow-auto custom-scrollbar p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <Avatar name={person.name} size={80} />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-2xl font-bold">{person.name}</h1>
              <Button variant="outline" size="sm">
                <Edit size={16} className="mr-2" />
                Edit
              </Button>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <span className={cn(
                "text-sm px-3 py-1 rounded-full border font-medium",
                getIntentColor(person.intent)
              )}>
                {person.intent}
              </span>
              <span className="text-sm text-muted-foreground">
                Added {new Date(person.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Contact Information</h2>
          <div className="space-y-3">
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
          </div>
        </div>

        {/* Notes */}
        {person.body && (
          <div className="bg-card border border-border rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4">Notes</h2>
            <p className="text-muted-foreground whitespace-pre-wrap">{person.body}</p>
          </div>
        )}

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