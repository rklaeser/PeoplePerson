import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/services/api'
import { Message, MessageCreate } from '@/types/api'

// Get messages for a person
export function useMessages(personId: string) {
  return useQuery({
    queryKey: ['messages', personId],
    queryFn: async (): Promise<Message[]> => {
      const { data } = await apiClient.get(`/sms/messages/${personId}`)
      return data
    },
    enabled: !!personId
  })
}

// Send SMS message
export function useSendSMS() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (message: MessageCreate): Promise<Message> => {
      const { data } = await apiClient.post('/sms/send', message)
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['messages', data.person_id] })
    }
  })
}

// Validate phone number
export function useValidatePhone() {
  return useMutation({
    mutationFn: async (phoneNumber: string): Promise<{ valid: boolean; formatted: string | null }> => {
      const { data } = await apiClient.post('/sms/validate-phone', null, {
        params: { phone_number: phoneNumber }
      })
      return data
    }
  })
}