import { writable } from 'svelte/store';
import type { Friend, Group } from '$lib/types';

// Create a writable store with an initial empty array
export const friends = writable<Friend[]>([]);
export const groups = writable<Group[]>([]);
export const archivedPeople = writable<Friend[]>([]);

// Function to reload the friends data
export async function reload() {
  const response = await fetch('/api/people');
  const data = await response.json();
  friends.set(data.people);
  groups.set(data.groups);
  archivedPeople.set(data.archivedPeople);
} 