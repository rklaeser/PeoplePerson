import { useState } from 'react'
import { Link } from 'react-router-dom'
import { usePeople, useSearchPeople } from '@/hooks/usePeople'
import Avatar from '@/components/Avatar'

export default function PeopleList() {
  const [searchQuery, setSearchQuery] = useState('')
  const { data: allPeople, isLoading: isLoadingAll } = usePeople()
  const { data: searchResults, isLoading: isSearching } = useSearchPeople(searchQuery)

  const people = searchQuery.trim() ? searchResults : allPeople
  const isLoading = searchQuery.trim() ? isSearching : isLoadingAll

  const intentColors = {
    romantic: 'badge-error',
    core: 'badge-primary',
    archive: 'badge-neutral',
    new: 'badge-success',
    invest: 'badge-warning',
    associate: 'badge-info'
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">People</h1>
        <Link to="/people/new" className="btn btn-primary">
          Add Person
        </Link>
      </div>

      <div className="form-control w-full max-w-md">
        <input
          type="text"
          placeholder="Search people..."
          className="input input-bordered w-full"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {people && people.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {people.map((person) => (
            <Link
              key={person.id}
              to={`/people/${person.id}`}
              className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="card-body">
                <div className="flex items-start gap-3">
                  <Avatar 
                    seed={person.name} 
                    size={48}
                    profilePicIndex={person.profile_pic_index}
                    className="flex-shrink-0"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <h2 className="card-title">{person.name}</h2>
                      <div className={`badge ${intentColors[person.intent]} badge-sm`}>
                        {person.intent}
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-sm opacity-70 line-clamp-3">{person.body}</p>
                {person.mnemonic && (
                  <div className="text-xs italic opacity-60">
                    💭 {person.mnemonic}
                  </div>
                )}
                {person.birthday && (
                  <div className="text-xs opacity-60">
                    🎂 {person.birthday}
                  </div>
                )}
                <div className="card-actions justify-end">
                  <div className="text-xs opacity-50">
                    {new Date(person.updated_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-xl font-semibold mb-2">
            {searchQuery.trim() ? 'No people found' : 'No people yet'}
          </h3>
          <p className="text-base-content/60 mb-6">
            {searchQuery.trim() 
              ? `No people match "${searchQuery}"`
              : 'Start building your network by adding your first person.'
            }
          </p>
          {!searchQuery.trim() && (
            <Link to="/people/new" className="btn btn-primary">
              Add Your First Person
            </Link>
          )}
        </div>
      )}
    </div>
  )
}