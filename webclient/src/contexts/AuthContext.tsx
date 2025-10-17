import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from '@/config/firebase'

interface AuthContextType {
  user: User | null
  loading: boolean
  logout: () => Promise<void>
  getToken: () => Promise<string | null>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const logout = async () => {
    await signOut(auth)
    localStorage.clear() // Clear any existing tokens/data
  }

  const getToken = async () => {
    if (user) {
      return await user.getIdToken()
    }
    return null
  }

  const value: AuthContextType = {
    user,
    loading,
    logout,
    getToken
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}