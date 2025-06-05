// File: src/routes/api/people/[id]/groups/+server.ts
import { json } from '@sveltejs/kit';
import { PersonService } from '$lib/services/personService.server';

export async function POST({ params, request }: { params: { id: string }; request: Request }) {
  const { id } = params;
  const { groupName } = await request.json();
  
  try {
    await PersonService.addPersonToGroup(id, groupName);
    return json({ message: 'Person added to group successfully' });
  } catch (error) {
    console.error('API POST Error:', error);
    return json({ error: 'Failed to add person to group' }, { status: 500 });
  }
}

export async function DELETE({ params, request }: { params: { id: string }; request: Request }) {
  const { id } = params;
  const { groupId } = await request.json();
  
  try {
    await PersonService.removePersonFromGroup(id, groupId);
    return json({ message: 'Person removed from group successfully' });
  } catch (error) {
    console.error('API DELETE Error:', error);
    return json({ error: 'Failed to remove person from group' }, { status: 500 });
  }
}