import { writable } from 'svelte/store';

// Define a type for a friend
interface Friend {
	id: number;
	name: string;
	age: number;
	city: string;
	zip: number;
	mnemonic: string;
	activity: string;
	notes: string;
	associates: Associate[];
}

interface Associate {
	id: number;
	name: string;
	relation: string;
	notes: string;
}

//const result = await db.execute('select 1');
//console.log(result);

// Initial data for the store
const initialPeople: Friend[] = [
	{
		id: 1,
		name: 'John Doe',
		age: 30,
		city: 'NYC',
		zip: 94117,
		mnemonic: 'John Dead Doe',
		activity: 'running',
		notes: 'tbd',
		associates: [{ id: 2, name: 'Ken', relation: 'brother', notes: 'tbd' }]
	}
];

// Create a writable store
export const peopleStore = writable<Friend[]>(initialPeople);

// Optional: Define functions to manipulate the store
export const addFriend = (friend: Friend) => {
	peopleStore.update((people) => [...people, friend]);
};

export const removeFriend = (id: number) => {
	peopleStore.update((people) => people.filter((friend) => person.id !== id));
};

export const updateFriend = (updatedFriend: Friend) => {
	peopleStore.update((people) =>
		people.map((friend) => (person.id === updatedFriend.id ? updatedFriend : person))
	);
};
