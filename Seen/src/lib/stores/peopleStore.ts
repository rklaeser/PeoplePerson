import { writable } from 'svelte/store';

// Define a type for a person
interface Person {
	id: number;
	name: string;
	age: number;
	city: string;
}

// Initial data for the store
const initialPeople: Person[] = [
	{ id: 1, name: 'John Doe', age: 30, city: 'NYC' },
	{ id: 2, name: 'Jane Smith', age: 25, city: 'LA' }
];

// Create a writable store
export const peopleStore = writable<Person[]>(initialPeople);

// Optional: Define functions to manipulate the store
export const addPerson = (person: Person) => {
	peopleStore.update((people) => [...people, person]);
};

export const removePerson = (id: number) => {
	peopleStore.update((people) => people.filter((person) => person.id !== id));
};

export const updatePerson = (updatedPerson: Person) => {
	peopleStore.update((people) =>
		people.map((person) => (person.id === updatedPerson.id ? updatedPerson : person))
	);
};
