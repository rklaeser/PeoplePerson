import { Link } from 'react-router-dom'
import { usePeople } from '@/hooks/usePeople'

export default function Home() {
  const { data: people, isLoading, error } = usePeople()

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="alert alert-error">
        <span>Error loading people: {error.message}</span>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="hero bg-base-200 rounded-lg">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <h1 className="text-5xl font-bold">PeoplePerson</h1>
            <p className="py-6">
              Your AI-powered friend management app. Remember details about your friends
              and never forget what matters most.
            </p>
            <Link to="/people" className="btn btn-primary">
              Manage People
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="stat bg-base-200 rounded-lg">
          <div className="stat-figure text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <div className="stat-title">Total People</div>
          <div className="stat-value text-primary">{people?.length || 0}</div>
          <div className="stat-desc">Friends in your network</div>
        </div>

        <div className="stat bg-base-200 rounded-lg">
          <div className="stat-figure text-secondary">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"></path>
            </svg>
          </div>
          <div className="stat-title">Core Friends</div>
          <div className="stat-value text-secondary">
            {people?.filter(p => p.intent === 'core').length || 0}
          </div>
          <div className="stat-desc">Your closest connections</div>
        </div>

        <div className="stat bg-base-200 rounded-lg">
          <div className="stat-figure text-accent">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path>
            </svg>
          </div>
          <div className="stat-title">New Connections</div>
          <div className="stat-value text-accent">
            {people?.filter(p => p.intent === 'new').length || 0}
          </div>
          <div className="stat-desc">Recent additions</div>
        </div>
      </div>

      <div className="card bg-base-200">
        <div className="card-body">
          <h2 className="card-title">Recent People</h2>
          {people && people.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {people.slice(0, 6).map((person) => (
                <Link
                  key={person.id}
                  to={`/people/${person.id}`}
                  className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow"
                >
                  <div className="card-body">
                    <h3 className="card-title text-sm">{person.name}</h3>
                    <p className="text-xs opacity-70 line-clamp-2">{person.body}</p>
                    <div className="badge badge-outline badge-sm">
                      {person.intent}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-base-content/60">No people added yet.</p>
              <Link to="/people" className="btn btn-primary btn-sm mt-4">
                Add Your First Person
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}