import { Group, Person } from '$lib/db/models';
import { json, error } from '@sveltejs/kit';
import { getPeopleNotAssociates, getGroups, getArchivedPeople } from '$lib/utils/load';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
    const session = await locals.auth();
    
    // Return 401 if not authenticated
    if (!session) {
        throw error(401, 'Unauthorized');
    }
    try {
        const people = await getPeopleNotAssociates();
        const archivedPeople = await getArchivedPeople();
        const groups = await getGroups();

        return json({
            people: people.map(person => person.toJSON()),
            archivedPeople: archivedPeople.map(person => person.toJSON()),
            groups: groups.map(group => group.toJSON())
        });
    } catch (error) {
        console.error('Error loading data:', error);
        return json({
            people: [],
            archivedPeople: [],
            groups: []
        });
    }
}   