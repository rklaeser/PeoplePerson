import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import LandingPage from '@/components/LandingPage'
import FirebaseAuth from '@/components/auth/FirebaseAuth'

export const Route = createFileRoute('/landing')({
  component: LandingPageRoute,
})

function LandingPageRoute() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [authMode, setAuthMode] = useState<'signUp' | 'signIn' | null>(null)
  const [selectedAnimalGuide, setSelectedAnimalGuide] = useState<'Scout' | 'Nico' | undefined>()

  // If user is authenticated, redirect to people page
  if (user) {
    navigate({ to: '/people' })
    return null
  }

  // Show sign-up flow with guide selection
  if (authMode === 'signUp') {
    return (
      <FirebaseAuth
        initialMode="signUp"
        selectedAnimalGuide={selectedAnimalGuide}
        onBack={() => {
          setAuthMode(null)
          setSelectedAnimalGuide(undefined)
        }}
      />
    )
  }

  // Show sign-in flow without guide selection
  if (authMode === 'signIn') {
    return (
      <FirebaseAuth
        initialMode="signIn"
        onBack={() => {
          setAuthMode(null)
        }}
      />
    )
  }

  return (
    <LandingPage
      onGetStarted={(guide) => {
        setSelectedAnimalGuide(guide)
        setAuthMode('signUp')
      }}
      onLogin={() => {
        setAuthMode('signIn')
      }}
    />
  )
}
