import { createFileRoute, Navigate } from '@tanstack/react-router'
import { useAuth } from '@/contexts/AuthContext'

export const Route = createFileRoute('/')({
  component: IndexRoute,
})

function IndexRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return null
  }

  // Redirect to people page if authenticated, landing if not
  return <Navigate to={user ? "/people" : "/landing"} replace />
}