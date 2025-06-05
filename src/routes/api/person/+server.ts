// File: src/routes/api/people/[id]/+server.js
import { json } from '@sveltejs/kit';
import { Person, Intent } from '$lib/db/models/Person';

export const prerender = false; // Disable prerendering for this endpoint

export async function GET({ params }: { params: { id: string } }) {
  // Get ID from route parameters, not search params
  const { id } = params;
  
  try {
    // Use drizzle-orm to query the database
    const result = await Person.findByPk(id);
    
    if (!result) {
      return json({ error: 'Person not found' }, { status: 404 });
    }
    
    console.log("🚀 Person fetched:", result);
    return json(result);
  } catch (error) {
    console.error('API GET Error:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Optional: If you want to handle other HTTP methods
export async function DELETE({ params }: { params: { id: string } }) {
  const { id } = params;
  
  try {
    const deleted = await Person.destroy({ where: { id } });
    if (!deleted) {
      return json({ error: 'Person not found' }, { status: 404 });
    }
    return json({ message: 'Person deleted successfully' });
  } catch (error) {
    console.error('API DELETE Error:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT({ params, request }: { params: { id: string }, request: Request }) {
  const { id } = params;
  const updates = await request.json();
  
  try {
    const [updatedCount] = await Person.update(updates, { where: { id } });
    if (updatedCount === 0) {
      return json({ error: 'Person not found' }, { status: 404 });
    }
    
    const updatedPerson = await Person.findByPk(id);
    return json(updatedPerson);
  } catch (error) {
    console.error('API PUT Error:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}