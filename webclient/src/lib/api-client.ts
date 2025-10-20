import axios, { AxiosResponse } from 'axios'
import { auth } from '@/config/firebase'
import { API_BASE_URL } from '@/config/api'
import {
  Person,
  PersonCreate,
  PersonUpdate,
  Message,
  MessageCreate,
  User,
  NarrativeRequest,
  ExtractionResponse,
  ConfirmPersonRequest,
  ConfirmTagAssignmentRequest,
  ConfirmMemoryEntryRequest,
  NotebookEntry,
  NotebookEntryCreate,
  NotebookEntryUpdate,
  Tag,
  TagCreate,
  TagUpdate,
  MapPerson
} from '@/types/api'

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth interceptor
apiClient.interceptors.request.use(async (config) => {
  const user = auth.currentUser
  if (user) {
    const token = await user.getIdToken()
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log(`API Success: ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data)
    return response
  },
  (error) => {
    console.error(`API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    })
    if (error.response?.status === 401) {
      console.error('Authentication error - user may need to re-login')
    }
    return Promise.reject(error)
  }
)

// API functions
export const api = {
  // Auth
  async getCurrentUser(): Promise<User> {
    const response: AxiosResponse<User> = await apiClient.get('/api/users/me')
    return response.data
  },

  // People
  async getPeople(params?: { 
    filter?: string
    sort?: string 
    search?: string 
  }): Promise<Person[]> {
    const response: AxiosResponse<Person[]> = await apiClient.get('/api/people', { params })
    return response.data
  },

  async getPerson(id: string): Promise<Person> {
    const response: AxiosResponse<Person> = await apiClient.get(`/api/people/${id}`)
    return response.data
  },

  async createPerson(data: PersonCreate): Promise<Person> {
    const response: AxiosResponse<Person> = await apiClient.post('/api/people', data)
    return response.data
  },

  async updatePerson(id: string, data: PersonUpdate): Promise<Person> {
    const response: AxiosResponse<Person> = await apiClient.patch(`/api/people/${id}`, data)
    return response.data
  },

  async deletePerson(id: string): Promise<void> {
    await apiClient.delete(`/api/people/${id}`)
  },

  async markAsContacted(personId: string): Promise<{ message: string; health_score: number; last_contact_date: string }> {
    const response = await apiClient.post(`/api/people/${personId}/contact`)
    return response.data
  },

  async getMapData(): Promise<MapPerson[]> {
    const response: AxiosResponse<MapPerson[]> = await apiClient.get('/api/people/map-data')
    return response.data
  },

  // Messages
  async getMessages(personId: string): Promise<Message[]> {
    const response: AxiosResponse<Message[]> = await apiClient.get(`/api/sms/messages/${personId}`)
    // Add computed field for UI
    return response.data.map(msg => ({
      ...msg,
      is_from_me: msg.direction === 'outbound'
    }))
  },

  async sendMessage(data: MessageCreate): Promise<Message> {
    const response: AxiosResponse<Message> = await apiClient.post('/api/sms/send', data)
    return {
      ...response.data,
      is_from_me: response.data.direction === 'outbound'
    }
  },

  // SMS
  async sendSMS(personId: string, body: string): Promise<Message> {
    const response: AxiosResponse<Message> = await apiClient.post('/api/sms/send', {
      person_id: personId,
      body
    })
    return {
      ...response.data,
      is_from_me: response.data.direction === 'outbound'
    }
  },

  // Notebook entries
  async getNotebookEntries(personId: string): Promise<NotebookEntry[]> {
    const response: AxiosResponse<NotebookEntry[]> = await apiClient.get(`/api/people/${personId}/notebook`)
    return response.data
  },

  async createNotebookEntry(personId: string, data: NotebookEntryCreate): Promise<NotebookEntry> {
    const response: AxiosResponse<NotebookEntry> = await apiClient.post(`/api/people/${personId}/notebook`, data)
    return response.data
  },

  async updateNotebookEntry(personId: string, entryId: string, data: NotebookEntryUpdate): Promise<NotebookEntry> {
    const response: AxiosResponse<NotebookEntry> = await apiClient.put(`/api/people/${personId}/notebook/${entryId}`, data)
    return response.data
  },

  async deleteNotebookEntry(personId: string, entryId: string): Promise<void> {
    await apiClient.delete(`/api/people/${personId}/notebook/${entryId}`)
  },

  // AI extraction
  async extractPeople(data: NarrativeRequest): Promise<ExtractionResponse> {
    const response: AxiosResponse<ExtractionResponse> = await apiClient.post('/api/ai/extract-people', data)
    return response.data
  },

  async confirmPerson(data: ConfirmPersonRequest): Promise<Person> {
    const response: AxiosResponse<Person> = await apiClient.post('/api/ai/confirm-person', data)
    return response.data
  },

  async confirmTagAssignment(data: ConfirmTagAssignmentRequest): Promise<{ message: string; tag: Tag; people: Person[] }> {
    const response = await apiClient.post('/api/ai/confirm-tag-assignment', data)
    return response.data
  },

  async confirmMemoryEntry(data: ConfirmMemoryEntryRequest): Promise<{ message: string; entry: NotebookEntry }> {
    const response = await apiClient.post('/api/ai/confirm-memory-entry', data)
    return response.data
  },

  // Tags
  async getTags(params?: {
    category?: string
    search?: string
    skip?: number
    limit?: number
  }): Promise<Tag[]> {
    const response: AxiosResponse<Tag[]> = await apiClient.get('/api/tags', { params })
    return response.data
  },

  async getTag(tagId: string): Promise<Tag> {
    const response: AxiosResponse<Tag> = await apiClient.get(`/api/tags/${tagId}`)
    return response.data
  },

  async createTag(data: TagCreate): Promise<Tag> {
    const response: AxiosResponse<Tag> = await apiClient.post('/api/tags', data)
    return response.data
  },

  async updateTag(tagId: string, data: TagUpdate): Promise<Tag> {
    const response: AxiosResponse<Tag> = await apiClient.patch(`/api/tags/${tagId}`, data)
    return response.data
  },

  async deleteTag(tagId: string): Promise<void> {
    await apiClient.delete(`/api/tags/${tagId}`)
  },

  async getPersonTags(personId: string): Promise<Tag[]> {
    const response: AxiosResponse<Tag[]> = await apiClient.get(`/api/people/${personId}/tags`)
    return response.data
  },

  async addTagToPerson(personId: string, tagData: { name: string; category?: string; color?: string }): Promise<{ message: string }> {
    const response: AxiosResponse<{ message: string }> = await apiClient.post(`/api/people/${personId}/tags`, tagData)
    return response.data
  },

  async removeTagFromPerson(personId: string, tagId: string): Promise<void> {
    await apiClient.delete(`/api/people/${personId}/tags/${tagId}`)
  }
}

export default apiClient