import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import {
  Person,
  PersonCreate,
  PersonUpdate,
  MessageCreate,
  NarrativeRequest,
  ConfirmPersonRequest,
  NotebookEntryCreate,
  NotebookEntryUpdate,
  TagCreate,
  TagUpdate
} from '@/types/api'

// Query keys
export const queryKeys = {
  currentUser: ['user', 'current'] as const,
  people: (params?: { filter?: string; sort?: string; search?: string }) =>
    ['people', params] as const,
  person: (id: string) => ['person', id] as const,
  messages: (personId: string) => ['messages', personId] as const,
  notebookEntries: (personId: string) => ['notebook', personId] as const,
  tags: (params?: { category?: string; search?: string }) => ['tags', params] as const,
  tag: (id: string) => ['tag', id] as const,
  personTags: (personId: string) => ['person-tags', personId] as const,
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

export const useMarkAsContacted = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (personId: string) => api.markAsContacted(personId),
    onSuccess: (_, personId) => {
      // Invalidate person to refetch with new health score
      queryClient.invalidateQueries({ queryKey: queryKeys.person(personId) })
      // Invalidate people list to update health scores there too
      queryClient.invalidateQueries({ queryKey: ['people'] })
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

// Notebook Entry hooks
export const useNotebookEntries = (personId: string) => {
  return useQuery({
    queryKey: queryKeys.notebookEntries(personId),
    queryFn: () => api.getNotebookEntries(personId),
    enabled: !!personId,
    staleTime: 30 * 1000, // 30 seconds
  })
}

export const useCreateNotebookEntry = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ personId, data }: { personId: string; data: NotebookEntryCreate }) =>
      api.createNotebookEntry(personId, data),
    onSuccess: (_, { personId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notebookEntries(personId) })
    },
  })
}

export const useUpdateNotebookEntry = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ personId, entryId, data }: { personId: string; entryId: string; data: NotebookEntryUpdate }) =>
      api.updateNotebookEntry(personId, entryId, data),
    onSuccess: (_, { personId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notebookEntries(personId) })
    },
  })
}

export const useDeleteNotebookEntry = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ personId, entryId }: { personId: string; entryId: string }) =>
      api.deleteNotebookEntry(personId, entryId),
    onSuccess: (_, { personId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notebookEntries(personId) })
    },
  })
}

// AI Extraction hooks
export const useExtractPeople = () => {
  return useMutation({
    mutationFn: (data: NarrativeRequest) => api.extractPeople(data),
  })
}

export const useConfirmPerson = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ConfirmPersonRequest) => api.confirmPerson(data),
    onSuccess: (newPerson) => {
      // Invalidate people list to show new person
      queryClient.invalidateQueries({ queryKey: ['people'] })
      // Add to cache
      queryClient.setQueryData(queryKeys.person(newPerson.id), newPerson)
    },
  })
}

// Tag hooks
export const useTags = (params?: { category?: string; search?: string }) => {
  return useQuery({
    queryKey: queryKeys.tags(params),
    queryFn: () => api.getTags(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useTag = (id: string) => {
  return useQuery({
    queryKey: queryKeys.tag(id),
    queryFn: () => api.getTag(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

export const useCreateTag = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: TagCreate) => api.createTag(data),
    onSuccess: (newTag) => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      queryClient.setQueryData(queryKeys.tag(newTag.id), newTag)
    },
  })
}

export const useUpdateTag = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TagUpdate }) => api.updateTag(id, data),
    onSuccess: (updatedTag, { id }) => {
      queryClient.setQueryData(queryKeys.tag(id), updatedTag)
      queryClient.invalidateQueries({ queryKey: ['tags'] })
    },
  })
}

export const useDeleteTag = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.deleteTag(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.tag(id) })
      queryClient.invalidateQueries({ queryKey: ['tags'] })
    },
  })
}

// Person-Tag association hooks
export const usePersonTags = (personId: string) => {
  return useQuery({
    queryKey: queryKeys.personTags(personId),
    queryFn: () => api.getPersonTags(personId),
    enabled: !!personId,
    staleTime: 30 * 1000, // 30 seconds
  })
}

export const useAddTagToPerson = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ personId, tagData }: { personId: string; tagData: { name: string; category?: string; color?: string } }) =>
      api.addTagToPerson(personId, tagData),
    onSuccess: (_, { personId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.personTags(personId) })
      queryClient.invalidateQueries({ queryKey: ['tags'] })
    },
  })
}

export const useRemoveTagFromPerson = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ personId, tagId }: { personId: string; tagId: string }) =>
      api.removeTagFromPerson(personId, tagId),
    onSuccess: (_, { personId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.personTags(personId) })
    },
  })
}