import { Group, Person } from '$lib/db/models';
import { json } from '@sveltejs/kit';
import { getPeopleNotAssociates, getGroups } from '$lib/utils/load';

export async function GET() {
    try {
        const people = await getPeopleNotAssociates();
        const groups = await getGroups();

        return json({
            people: people.map(person => person.toJSON()),
            groups: groups.map(group => group.toJSON())
        });
    } catch (error) {
        console.error('Error loading data:', error);
        return json({
            people: [],
            groups: []
        });
    }
}   