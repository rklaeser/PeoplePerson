import { Outlet, Link, useLocation } from 'react-router-dom'
import Avatar from '@/components/Avatar'
import { useAuth } from '@/contexts/AuthContext'

export default function MainLayout() {
  const location = useLocation()
  const { user, logout } = useAuth()

  const navigation = [
    { name: 'Home', href: '/', current: location.pathname === '/' },
    { name: 'People', href: '/people', current: location.pathname.startsWith('/people') },
    { name: 'Groups', href: '/groups', current: location.pathname.startsWith('/groups') },
    { name: 'Tags', href: '/tags', current: location.pathname.startsWith('/tags') },
  ]

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  return (
    <div className="min-h-screen bg-base-100">
      <div className="navbar bg-base-300 shadow-lg">
        <div className="navbar-start">
          <Link to="/" className="btn btn-ghost text-xl">
            PeoplePerson
          </Link>
        </div>
        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal px-1">
            {navigation.map((item) => (
              <li key={item.name}>
                <Link
                  to={item.href}
                  className={`${item.current ? 'active' : ''}`}
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="navbar-end">
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
              <div className="w-10 rounded-full">
                <Avatar seed={user?.email || "user"} size={40} className="rounded-full" />
              </div>
            </div>
            <ul tabIndex={0} className="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52">
              <li><a>Profile</a></li>
              <li><a>Settings</a></li>
              <li><button onClick={handleLogout}>Logout</button></li>
            </ul>
          </div>
        </div>
      </div>
      
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}