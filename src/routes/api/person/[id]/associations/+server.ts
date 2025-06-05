// File: src/routes/api/people/+server.ts
import { json } from '@sveltejs/kit';
import { PersonService } from '$lib/services/personService.server';

export async function POST({ request }: { request: Request }) {
  const { name } = await request.json();
  
  if (!name || typeof name !== 'string') {
    return json({ error: 'Invalid name' }, { status: 400 });
  }
  
  try {
    const person = await PersonService.createPerson(name);
    return json(person);
  } catch (error) {
    console.error('API POST Error:', error);
    return json({ error: 'Failed to create person' }, { status: 500 });
  }
}

export async function DELETE({ request }: { request: Request }) {
  const { id } = await request.json();
  
  try {
    await PersonService.deletePerson(id);
    return json({ message: 'Person deleted successfully' });
  } catch (error) {
    console.error('API DELETE Error:', error);
    return json({ error: 'Failed to delete person' }, { status: 500 });
  }
}