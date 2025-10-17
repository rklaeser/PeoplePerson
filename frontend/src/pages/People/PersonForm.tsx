import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useCreatePerson } from '@/hooks/usePeople'
import { PersonCreate } from '@/types/api'

export default function PersonForm() {
  const navigate = useNavigate()
  const createPerson = useCreatePerson()
  
  const [formData, setFormData] = useState<PersonCreate>({
    name: '',
    body: '',
    intent: 'new',
    birthday: '',
    mnemonic: '',
    zip: '',
    phone_number: '',
    profile_pic_index: 0
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const person = await createPerson.mutateAsync(formData)
      navigate(`/people/${person.id}`)
    } catch (error) {
      console.error('Failed to create person:', error)
    }
  }

  const handleChange = (field: keyof PersonCreate, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Add New Person</h1>
        <Link to="/people" className="btn btn-ghost">
          Cancel
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="card bg-base-100 shadow-lg">
        <div className="card-body space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Name *</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="input input-bordered"
              placeholder="Enter person's name"
              required
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Description</span>
            </label>
            <textarea
              value={formData.body}
              onChange={(e) => handleChange('body', e.target.value)}
              className="textarea textarea-bordered"
              placeholder="Tell me about this person..."
              rows={3}
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Phone Number</span>
            </label>
            <input
              type="tel"
              value={formData.phone_number}
              onChange={(e) => handleChange('phone_number', e.target.value)}
              className="input input-bordered"
              placeholder="+1 (555) 123-4567"
            />
            <label className="label">
              <span className="label-text-alt">For SMS messaging</span>
            </label>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Relationship Intent</span>
            </label>
            <select
              value={formData.intent}
              onChange={(e) => handleChange('intent', e.target.value as any)}
              className="select select-bordered"
            >
              <option value="new">New</option>
              <option value="develop">Develop</option>
              <option value="core">Core</option>
              <option value="casual">Casual</option>
              <option value="romantic">Romantic</option>
              <option value="archive">Archive</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Birthday</span>
              </label>
              <input
                type="text"
                value={formData.birthday}
                onChange={(e) => handleChange('birthday', e.target.value)}
                className="input input-bordered"
                placeholder="e.g. March 15, 1990"
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Location</span>
              </label>
              <input
                type="text"
                value={formData.zip}
                onChange={(e) => handleChange('zip', e.target.value)}
                className="input input-bordered"
                placeholder="City, State or ZIP"
              />
            </div>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Memory Aid</span>
            </label>
            <input
              type="text"
              value={formData.mnemonic}
              onChange={(e) => handleChange('mnemonic', e.target.value)}
              className="input input-bordered"
              placeholder="How to remember this person..."
            />
          </div>

          <div className="card-actions justify-end pt-4">
            <Link to="/people" className="btn btn-ghost">
              Cancel
            </Link>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!formData.name.trim() || createPerson.isPending}
            >
              {createPerson.isPending ? 'Creating...' : 'Create Person'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}