import React, { useState, useEffect } from 'react'
import { auth } from '@/config/firebase'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'
import { useUIStore } from '@/stores/ui-store'

interface FirebaseAuthProps {
  initialMode?: 'signIn' | 'signUp'
  selectedAnimalGuide?: 'Scout' | 'Nico'
  onBack?: () => void
}

const FirebaseAuth: React.FC<FirebaseAuthProps> = ({
  initialMode = 'signIn',
  selectedAnimalGuide,
  onBack
}) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(initialMode === 'signUp')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { setAssistantName } = useUIStore()

  // Set the animal guide when component mounts if provided
  useEffect(() => {
    if (selectedAnimalGuide) {
      setAssistantName(selectedAnimalGuide)
    }
  }, [selectedAnimalGuide, setAssistantName])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password)
        // Set animal guide preference if provided
        if (selectedAnimalGuide) {
          setAssistantName(selectedAnimalGuide)
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password)
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      {selectedAnimalGuide && onBack && (
        <div className="mb-6 flex flex-col items-center">
          <button
            type="button"
            onClick={onBack}
            className="group relative"
          >
            <div className="w-32 h-32 relative">
              <img
                src={selectedAnimalGuide === 'Scout' ? '/scout.png' : '/nico.png'}
                alt={selectedAnimalGuide}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
              <span className="text-white text-sm font-medium px-3 text-center">
                Reconsider my animal guide
              </span>
            </div>
          </button>

          {/* Speech Bubble */}
          <div className="mt-4 relative">
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-border"></div>
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[7px] border-r-[7px] border-b-[7px] border-l-transparent border-r-transparent border-b-card"></div>
            <div className="bg-card border border-border rounded-lg px-4 py-2 shadow-sm">
              <p className="text-sm text-muted-foreground italic text-center">
                {selectedAnimalGuide === 'Scout'
                  ? '"Bark! Ready to help you get started!"'
                  : '"Let us begin our empire together."'
                }
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-md p-8 bg-card border border-border rounded-lg shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">Welcome to PeoplePerson</h1>
          <p className="text-muted-foreground mt-2">
            {isSignUp ? 'Create your account' : 'Sign in to your account'}
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Email
            </label>
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Password
            </label>
            <Input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full"
            disabled={loading}
          >
            {loading && <Loader2 size={16} className="mr-2 animate-spin" />}
            {loading ? 'Please wait...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            className="mt-4 w-full"
            onClick={() => setIsSignUp(!isSignUp)}
            disabled={loading}
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </Button>

          {onBack && (
            <Button
              type="button"
              variant="outline"
              className="mt-2 w-full"
              onClick={onBack}
              disabled={loading}
            >
              Back to landing page
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default FirebaseAuth