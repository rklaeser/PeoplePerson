import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/services/api'
import { Tag, TagCreate, Person } from '@/types/api'

// Get all tags
export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: async (): Promise<Tag[]> => {
      const { data } = await apiClient.get('/tags')
      return data
    }
  })
}

// Get tags for a person
export function usePersonTags(personId: string) {
  return useQuery({
    queryKey: ['people', personId, 'tags'],
    queryFn: async (): Promise<Tag[]> => {
      const { data } = await apiClient.get(`/people/${personId}/tags`)
      return data
    },
    enabled: !!personId
  })
}

// Get people by tag
export function usePeopleByTag(tagId: string) {
  return useQuery({
    queryKey: ['tags', tagId, 'people'],
    queryFn: async (): Promise<Person[]> => {
      const { data } = await apiClient.get(`/people/by-tag/${tagId}`)
      return data
    },
    enabled: !!tagId
  })
}

// Create tag
export function useCreateTag() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (tag: TagCreate): Promise<Tag> => {
      const { data } = await apiClient.post('/tags', tag)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
    }
  })
}

// Add tag to person
export function useAddTagToPerson() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ personId, name, category, color }: { 
      personId: string
      name: string
      category?: string
      color?: string
    }) => {
      const { data } = await apiClient.post(`/people/${personId}/tags`, {
        name,
        category,
        color
      })
      return data
    },
    onSuccess: (_, { personId }) => {
      queryClient.invalidateQueries({ queryKey: ['people', personId, 'tags'] })
      queryClient.invalidateQueries({ queryKey: ['tags'] })
    }
  })
}

// Remove tag from person
export function useRemoveTagFromPerson() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ personId, tagId }: { personId: string; tagId: string }) => {
      await apiClient.delete(`/people/${personId}/tags/${tagId}`)
    },
    onSuccess: (_, { personId }) => {
      queryClient.invalidateQueries({ queryKey: ['people', personId, 'tags'] })
      queryClient.invalidateQueries({ queryKey: ['tags'] })
    }
  })
}