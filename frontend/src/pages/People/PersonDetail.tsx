import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { usePerson, useUpdatePerson } from '@/hooks/usePeople'
import { useMessages, useSendSMS } from '@/hooks/useSMS'
import Avatar from '@/components/Avatar'

export default function PersonDetail() {
  const { id } = useParams<{ id: string }>()
  const [newMessage, setNewMessage] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    name: '',
    body: '',
    phone_number: '',
    birthday: '',
    mnemonic: ''
  })

  const { data: person, isLoading } = usePerson(id!)
  const { data: messages = [] } = useMessages(id!)
  const sendSMS = useSendSMS()
  const updatePerson = useUpdatePerson()

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    )
  }

  if (!person) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-semibold mb-2">Person not found</h3>
        <Link to="/people" className="btn btn-primary">
          Back to People
        </Link>
      </div>
    )
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !person.phone_number) return
    
    try {
      await sendSMS.mutateAsync({
        body: newMessage.trim(),
        person_id: person.id
      })
      setNewMessage('')
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const handleEdit = () => {
    setEditData({
      name: person.name,
      body: person.body,
      phone_number: person.phone_number || '',
      birthday: person.birthday || '',
      mnemonic: person.mnemonic || ''
    })
    setIsEditing(true)
  }

  const handleSave = async () => {
    try {
      await updatePerson.mutateAsync({
        id: person.id,
        ...editData
      })
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update person:', error)
    }
  }

  const intentColors = {
    romantic: 'badge-error',
    core: 'badge-primary',
    archive: 'badge-neutral',
    new: 'badge-success',
    develop: 'badge-warning',
    casual: 'badge-info',
    invest: 'badge-warning',
    associate: 'badge-info'
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <Link to="/people" className="btn btn-ghost btn-sm">
          ← Back to People
        </Link>
        <button 
          onClick={isEditing ? handleSave : handleEdit}
          className="btn btn-primary btn-sm"
          disabled={updatePerson.isPending}
        >
          {isEditing ? 'Save' : 'Edit'}
        </button>
      </div>

      {/* Person Info */}
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <div className="flex items-start gap-4">
            <Avatar 
              seed={person.name} 
              size={80}
              profilePicIndex={person.profile_pic_index}
            />
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editData.name}
                    onChange={(e) => setEditData({...editData, name: e.target.value})}
                    className="input input-bordered w-full"
                    placeholder="Name"
                  />
                  <textarea
                    value={editData.body}
                    onChange={(e) => setEditData({...editData, body: e.target.value})}
                    className="textarea textarea-bordered w-full"
                    placeholder="Description"
                    rows={3}
                  />
                  <input
                    type="tel"
                    value={editData.phone_number}
                    onChange={(e) => setEditData({...editData, phone_number: e.target.value})}
                    className="input input-bordered w-full"
                    placeholder="Phone number"
                  />
                  <input
                    type="text"
                    value={editData.birthday}
                    onChange={(e) => setEditData({...editData, birthday: e.target.value})}
                    className="input input-bordered w-full"
                    placeholder="Birthday"
                  />
                  <input
                    type="text"
                    value={editData.mnemonic}
                    onChange={(e) => setEditData({...editData, mnemonic: e.target.value})}
                    className="input input-bordered w-full"
                    placeholder="Mnemonic"
                  />
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start mb-2">
                    <h1 className="text-2xl font-bold">{person.name}</h1>
                    <div className={`badge ${intentColors[person.intent]} badge-lg`}>
                      {person.intent}
                    </div>
                  </div>
                  <p className="text-base-content/70 mb-4">{person.body}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {person.phone_number && (
                      <div>
                        <span className="font-semibold">Phone:</span> {person.phone_number}
                      </div>
                    )}
                    {person.birthday && (
                      <div>
                        <span className="font-semibold">Birthday:</span> {person.birthday}
                      </div>
                    )}
                    {person.mnemonic && (
                      <div className="md:col-span-2">
                        <span className="font-semibold">💭 Mnemonic:</span> {person.mnemonic}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SMS Section */}
      {person.phone_number && (
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h2 className="card-title">💬 Messages</h2>
            
            {/* Message History */}
            <div className="space-y-2 max-h-96 overflow-y-auto mb-4">
              {messages.length === 0 ? (
                <div className="text-center py-8 text-base-content/60">
                  No messages yet. Start a conversation!
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`chat ${message.direction === 'outbound' ? 'chat-end' : 'chat-start'}`}
                  >
                    <div className={`chat-bubble ${
                      message.direction === 'outbound' ? 'chat-bubble-primary' : 'chat-bubble-secondary'
                    }`}>
                      {message.body}
                    </div>
                    <div className="chat-footer opacity-50 text-xs">
                      {new Date(message.sent_at).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Send Message */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="input input-bordered flex-1"
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sendSMS.isPending}
                className="btn btn-primary"
              >
                {sendSMS.isPending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}

      {!person.phone_number && (
        <div className="alert alert-info">
          <span>Add a phone number to enable SMS messaging</span>
        </div>
      )}
    </div>
  )
}