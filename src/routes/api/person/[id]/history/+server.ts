// File: src/routes/api/people/[id]/history/+server.ts
import { json } from '@sveltejs/kit';
import { PersonService } from '$lib/services/personService.server';

export async function POST({ params, request }: { params: { id: string }; request: Request }) {
  const { id } = params;
  const { changeType, field, detail } = await request.json();
  
  try {
    await PersonService.createHistoryEntry(id, changeType, field, detail);
    return json({ message: 'History entry created successfully' });
  } catch (error) {
    console.error('API POST Error:', error);
    return json({ error: 'Failed to create history entry' }, { status: 500 });
  }
}