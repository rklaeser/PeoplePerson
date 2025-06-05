
// File: src/routes/api/people/[id]/+server.ts
import { json } from '@sveltejs/kit';
import { PersonService } from '$lib/services/personService.server';

export async function GET({ params }: { params: { id: string } }) {
  const { id } = params;
  
  try {
    const personData = await PersonService.getPersonWithDetails(id);
    
    if (!personData) {
      return json({ error: 'Person not found' }, { status: 404 });
    }
    
    return json(personData);
  } catch (error) {
    console.error('API GET Error:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT({ params, request }: { params: { id: string }; request: Request }) {
  const { id } = params;
  const updates = await request.json();
  
  try {
    // Handle different types of updates
    if (updates.body !== undefined) {
      await PersonService.updatePersonBody(id, updates.body);
    }
    if (updates.birthday !== undefined) {
      await PersonService.updatePersonBirthday(id, updates.birthday);
    }
    if (updates.mnemonic !== undefined) {
      await PersonService.updatePersonMnemonic(id, updates.mnemonic);
    }
    if (updates.intent !== undefined) {
      await PersonService.updatePersonStatus(id, updates.intent);
    }
    
    // Return updated person data
    const updatedPerson = await PersonService.getPersonWithDetails(id);
    return json(updatedPerson);
  } catch (error) {
    console.error('API PUT Error:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE({ params }: { params: { id: string } }) {
  const { id } = params;
  
  try {
    await PersonService.deletePerson(id);
    return json({ message: 'Person deleted successfully' });
  } catch (error) {
    console.error('API DELETE Error:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}