import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/services/api'
import { Person, PersonCreate, PersonUpdate } from '@/types/api'

// Get all people
export function usePeople() {
  return useQuery({
    queryKey: ['people'],
    queryFn: async (): Promise<Person[]> => {
      const { data } = await apiClient.get('/people')
      return data
    }
  })
}

// Get a single person
export function usePerson(id: string) {
  return useQuery({
    queryKey: ['people', id],
    queryFn: async (): Promise<Person> => {
      const { data } = await apiClient.get(`/people/${id}`)
      return data
    },
    enabled: !!id
  })
}

// Search people
export function useSearchPeople(query: string) {
  return useQuery({
    queryKey: ['people', 'search', query],
    queryFn: async (): Promise<Person[]> => {
      const { data } = await apiClient.get(`/people/search?query=${encodeURIComponent(query)}`)
      return data
    },
    enabled: !!query.trim()
  })
}

// Create person
export function useCreatePerson() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (person: PersonCreate): Promise<Person> => {
      const { data } = await apiClient.post('/people', person)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people'] })
    }
  })
}

// Update person
export function useUpdatePerson() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, ...person }: { id: string } & PersonUpdate): Promise<Person> => {
      const { data } = await apiClient.patch(`/people/${id}`, person)
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['people'] })
      queryClient.invalidateQueries({ queryKey: ['people', data.id] })
    }
  })
}

// Delete person
export function useDeletePerson() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await apiClient.delete(`/people/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people'] })
    }
  })
}