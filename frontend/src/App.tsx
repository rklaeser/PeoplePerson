import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryProvider } from '@/providers/QueryProvider'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import MainLayout from '@/layouts/MainLayout'
import Home from '@/pages/Home'
import PeopleList from '@/pages/People/PeopleList'
import FirebaseAuth from '@/components/FirebaseAuth'

function AppContent() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    )
  }

  if (!user) {
    return <FirebaseAuth />
  }

  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="people" element={<PeopleList />} />
        <Route path="groups" element={<div>Groups - Coming Soon</div>} />
        <Route path="tags" element={<div>Tags - Coming Soon</div>} />
      </Route>
    </Routes>
  )
}

function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </QueryProvider>
  )
}

export default App
