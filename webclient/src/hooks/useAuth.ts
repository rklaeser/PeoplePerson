import { useState, useEffect } from 'react'
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged 
} from 'firebase/auth'
import { auth } from '@/config/firebase'

export interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null
  })

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setState({
        user,
        loading: false,
        error: null
      })
    }, (error) => {
      setState({
        user: null,
        loading: false,
        error: error.message
      })
    })

    return () => unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    try {
      const result = await signInWithEmailAndPassword(auth, email, password)
      setState({
        user: result.user,
        loading: false,
        error: null
      })
      return result.user
    } catch (error: any) {
      setState({
        user: null,
        loading: false,
        error: error.message
      })
      throw error
    }
  }

  const signUp = async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password)
      setState({
        user: result.user,
        loading: false,
        error: null
      })
      return result.user
    } catch (error: any) {
      setState({
        user: null,
        loading: false,
        error: error.message
      })
      throw error
    }
  }

  const logout = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    try {
      await signOut(auth)
      setState({
        user: null,
        loading: false,
        error: null
      })
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }))
      throw error
    }
  }

  return {
    ...state,
    signIn,
    signUp,
    logout,
    isAuthenticated: !!state.user
  }
}