import axios from 'axios'
import { auth } from '@/config/firebase'
import { API_BASE_URL } from '@/config/api'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth interceptor to include Firebase token
apiClient.interceptors.request.use(async (config) => {
  console.log('DEBUG: API interceptor called')
  const user = auth.currentUser
  console.log('DEBUG: auth.currentUser:', user)
  if (user) {
    try {
      console.log('DEBUG: Getting token for user:', user.uid)
      const token = await user.getIdToken()
      console.log('DEBUG: Got token:', token.substring(0, 50) + '...')
      config.headers.Authorization = `Bearer ${token}`
    } catch (error) {
      console.error('Error getting token:', error)
    }
  } else {
    console.log('DEBUG: No user found, not adding auth header')
  }
  return config
})

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear any stored data on auth error
      localStorage.clear()
      // Force re-authentication by refreshing the page
      window.location.reload()
    }
    return Promise.reject(error)
  }
)