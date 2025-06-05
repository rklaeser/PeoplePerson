// File: src/routes/api/people/[id]/journals/+server.ts
import { json } from '@sveltejs/kit';
import { PersonService } from '$lib/services/personService.server';

export async function POST({ params, request }: { params: { id: string }; request: Request }) {
  const { id } = params;
  const { content, title } = await request.json();
  
  try {
    await PersonService.createJournalEntry(id, content, title);
    return json({ message: 'Journal entry created successfully' });
  } catch (error) {
    console.error('API POST Error:', error);
    return json({ error: 'Failed to create journal entry' }, { status: 500 });
  }
}