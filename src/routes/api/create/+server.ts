import { json } from '@sveltejs/kit';
import { Person, Intent } from '$lib/db/models/Person';

export async function POST({ request }) {
  try {
    const { name, body, intent, birthday, mnemonic } = await request.json();
    if (!name) {
      return json({ error: 'Name is required' }, { status: 400 });
    }
    const newPerson = await Person.create({
      name,
      body: body || '',
      intent: intent || Intent.NEW,
      birthday: birthday || null,
      mnemonic: mnemonic || null
    });
    return json({ success: true, person: newPerson });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}