import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { Person, PersonCreate, PersonUpdate, MessageCreate } from '@/types/api'

// Query keys
export const queryKeys = {
  currentUser: ['user', 'current'] as const,
  people: (params?: { filter?: string; sort?: string; search?: string }) => 
    ['people', params] as const,
  person: (id: string) => ['person', id] as const,
  messages: (personId: string) => ['messages', personId] as const,
}

// User hooks
export const useCurrentUser = () => {
  return useQuery({
    queryKey: queryKeys.currentUser,
    queryFn: api.getCurrentUser,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// People hooks
export const usePeople = (params?: { 
  filter?: string
  sort?: string 
  search?: string 
}) => {
  return useQuery({
    queryKey: queryKeys.people(params),
    queryFn: () => api.getPeople(params),
    staleTime: 30 * 1000, // 30 seconds
  })
}

export const usePerson = (id: string) => {
  return useQuery({
    queryKey: queryKeys.person(id),
    queryFn: () => api.getPerson(id),
    enabled: !!id,
    staleTime: 60 * 1000, // 1 minute
  })
}

export const useCreatePerson = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: PersonCreate) => api.createPerson(data),
    onSuccess: (newPerson) => {
      // Invalidate people list
      queryClient.invalidateQueries({ queryKey: ['people'] })
      // Add to cache
      queryClient.setQueryData(queryKeys.person(newPerson.id), newPerson)
    },
  })
}

export const useUpdatePerson = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PersonUpdate }) => 
      api.updatePerson(id, data),
    onSuccess: (updatedPerson, { id }) => {
      // Update cached person
      queryClient.setQueryData(queryKeys.person(id), updatedPerson)
      // Invalidate people list to update there too
      queryClient.invalidateQueries({ queryKey: ['people'] })
    },
  })
}

export const useDeletePerson = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => api.deletePerson(id),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.person(id) })
      // Invalidate people list
      queryClient.invalidateQueries({ queryKey: ['people'] })
      // Remove messages
      queryClient.removeQueries({ queryKey: queryKeys.messages(id) })
    },
  })
}

// Message hooks
export const useMessages = (personId: string) => {
  return useQuery({
    queryKey: queryKeys.messages(personId),
    queryFn: () => api.getMessages(personId),
    enabled: !!personId,
    staleTime: 10 * 1000, // 10 seconds for real-time feel
  })
}

export const useSendMessage = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: MessageCreate) => api.sendMessage(data),
    onMutate: async (data) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.messages(data.person_id) })
      
      // Snapshot previous value
      const previousMessages = queryClient.getQueryData(queryKeys.messages(data.person_id))
      
      // Optimistically update
      const tempMessage = {
        id: `temp-${Date.now()}`,
        body: data.body,
        direction: 'outbound' as const,
        person_id: data.person_id,
        user_id: 'current-user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        sent_at: new Date().toISOString(),
        is_from_me: true,
      }
      
      queryClient.setQueryData(
        queryKeys.messages(data.person_id),
        (old: any) => old ? [...old, tempMessage] : [tempMessage]
      )
      
      return { previousMessages, tempMessage }
    },
    onError: (err, data, context) => {
      // Rollback on error
      if (context?.previousMessages) {
        queryClient.setQueryData(
          queryKeys.messages(data.person_id),
          context.previousMessages
        )
      }
    },
    onSuccess: (newMessage, data) => {
      // Replace temp message with real one
      queryClient.setQueryData(
        queryKeys.messages(data.person_id),
        (old: any) => {
          if (!old) return [newMessage]
          return old.map((msg: any) => 
            msg.id.startsWith('temp-') ? newMessage : msg
          )
        }
      )
      
      // Update person's last message
      queryClient.invalidateQueries({ queryKey: ['people'] })
    },
  })
}

export const useSendSMS = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ personId, body }: { personId: string; body: string }) => 
      api.sendSMS(personId, body),
    onMutate: async ({ personId, body }) => {
      // Similar optimistic update as sendMessage
      await queryClient.cancelQueries({ queryKey: queryKeys.messages(personId) })
      
      const previousMessages = queryClient.getQueryData(queryKeys.messages(personId))
      
      const tempMessage = {
        id: `temp-sms-${Date.now()}`,
        body,
        direction: 'outbound' as const,
        person_id: personId,
        user_id: 'current-user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        sent_at: new Date().toISOString(),
        is_from_me: true,
      }
      
      queryClient.setQueryData(
        queryKeys.messages(personId),
        (old: any) => old ? [...old, tempMessage] : [tempMessage]
      )
      
      return { previousMessages, tempMessage }
    },
    onError: (err, { personId }, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(
          queryKeys.messages(personId),
          context.previousMessages
        )
      }
    },
    onSuccess: (newMessage, { personId }) => {
      queryClient.setQueryData(
        queryKeys.messages(personId),
        (old: any) => {
          if (!old) return [newMessage]
          return old.map((msg: any) => 
            msg.id.startsWith('temp-sms-') ? newMessage : msg
          )
        }
      )
      
      queryClient.invalidateQueries({ queryKey: ['people'] })
    },
  })
}