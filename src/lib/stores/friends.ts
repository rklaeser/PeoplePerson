import { writable } from 'svelte/store';
import type { Friend, Group } from '$lib/types';
import { apiClient, transformPersonToFriend } from '$lib/utils/apiClient';

// Create a writable store with an initial empty array
export const friends = writable<Friend[]>([]);
export const groups = writable<Group[]>([]);
export const archivedPeople = writable<Friend[]>([]);

// Function to reload the friends data
export async function reload() {
	try {
		const response = await apiClient.getAllPeople();
		
		if (response.error) {
			console.error('Failed to fetch people:', response.error);
			return;
		}

		// Handle Django REST Framework pagination format
		const peopleData = response.data;
		const people = peopleData?.results || [];
		const transformedFriends = people.map(transformPersonToFriend);
		friends.set(transformedFriends);

		// Fetch groups
		try {
			const groupsResponse = await apiClient.getAllGroups();
			if (groupsResponse.error) {
				console.error('Failed to fetch groups:', groupsResponse.error);
				groups.set([]);
			} else {
				const groupsData = groupsResponse.data?.results || groupsResponse.data || [];
				groups.set(groupsData);
			}
		} catch (error) {
			console.error('Error loading groups:', error);
			groups.set([]);
		}

		// TODO: Fetch archived people
		archivedPeople.set([]);
	} catch (error) {
		console.error('Error reloading friends:', error);
	}
}
