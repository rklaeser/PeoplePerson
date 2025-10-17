import { useState, useRef, useEffect } from 'react'
import { useMessages, useSendSMS } from '@/hooks/api-hooks'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn, formatTime } from '@/lib/utils'
import { Send, Loader2 } from 'lucide-react'
import { useVirtualizer } from '@tanstack/react-virtual'

interface MessageThreadProps {
  personId: string
}

export function MessageThread({ personId }: MessageThreadProps) {
  const [messageText, setMessageText] = useState('')
  const { data: messages = [], isLoading } = useMessages(personId)
  const sendSMS = useSendSMS()
  
  const parentRef = useRef<HTMLDivElement>(null)
  
  // Reverse the messages for chat display (newest at bottom)
  const reversedMessages = [...messages].reverse()
  
  const virtualizer = useVirtualizer({
    count: reversedMessages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 5,
  })

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (parentRef.current) {
      parentRef.current.scrollTop = parentRef.current.scrollHeight
    }
  }, [messages.length])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageText.trim() || sendSMS.isPending) return

    try {
      await sendSMS.mutateAsync({
        personId,
        body: messageText.trim()
      })
      setMessageText('')
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 size={24} className="animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Messages */}
      <div 
        ref={parentRef}
        className="flex-1 overflow-auto custom-scrollbar p-4 space-y-4"
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No messages yet. Start a conversation!
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble 
              key={message.id} 
              message={message} 
              isFromMe={message.is_from_me || false}
            />
          ))
        )}
      </div>

      {/* Message input */}
      <div className="border-t border-border p-4">
        <form onSubmit={handleSend} className="flex gap-2">
          <Input
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
            disabled={sendSMS.isPending}
          />
          <Button 
            type="submit" 
            size="icon"
            disabled={!messageText.trim() || sendSMS.isPending}
          >
            {sendSMS.isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}

interface MessageBubbleProps {
  message: any // Use proper Message type
  isFromMe: boolean
}

function MessageBubble({ message, isFromMe }: MessageBubbleProps) {
  return (
    <div className={cn(
      "flex",
      isFromMe ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "max-w-[70%] rounded-lg px-3 py-2",
        isFromMe 
          ? "bg-primary text-primary-foreground" 
          : "bg-muted"
      )}>
        <p className="text-sm whitespace-pre-wrap">{message.body}</p>
        <div className={cn(
          "text-xs mt-1 opacity-70",
          isFromMe ? "text-right" : "text-left"
        )}>
          {formatTime(message.sent_at || message.created_at)}
        </div>
      </div>
    </div>
  )
}