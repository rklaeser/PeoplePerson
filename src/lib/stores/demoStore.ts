import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

// Types for demo data
export interface DemoPerson {
	id: string;
	name: string;
	body: string;
	intent: string;
	birthday: string | null;
	mnemonic: string;
	profile_pic_index: number;
	createdAt: string;
	updatedAt: string;
}

export interface DemoGroup {
	id: string;
	name: string;
	description: string;
	createdAt: string;
	updatedAt: string;
}

export interface DemoGroupAssociation {
	personId: string;
	groupId: string;
}

export interface DemoPersonAssociation {
	personId: string;
	associateId: string;
}

export interface DemoHistory {
	id: string;
	personId: string;
	changeType: string;
	field: string;
	detail: string;
	createdAt: string;
	updatedAt: string;
}

// Initial demo data
const initialPeople: DemoPerson[] = [
	{
		id: 'michael-scott',
		name: 'Michael Scott',
		body: "World's Best Boss. My hero.",
		intent: 'core',
		birthday: '1965-03-15',
		mnemonic: "World's best boss",
		profile_pic_index: 0,
		createdAt: '2024-01-01T00:00:00Z',
		updatedAt: '2024-01-01T00:00:00Z'
	},
	{
		id: 'pam-beesly',
		name: 'Pam Beesly',
		body: 'Office Administrator',
		intent: 'invest',
		birthday: '1979-03-25',
		mnemonic: 'The receptionist',
		profile_pic_index: 1,
		createdAt: '2024-01-01T00:00:00Z',
		updatedAt: '2024-01-01T00:00:00Z'
	},
	{
		id: 'creed-bratton',
		name: 'Creed Bratton',
		body: "Quality Assurance, even I think he's creepy.",
		intent: 'new',
		birthday: null,
		mnemonic: 'The creepy guy',
		profile_pic_index: 2,
		createdAt: '2024-01-01T00:00:00Z',
		updatedAt: '2024-01-01T00:00:00Z'
	},
	{
		id: 'jim-halpert',
		name: 'Jim Halpert',
		body: 'Sales Representative, kinda mean to me sometimes.',
		intent: 'invest',
		birthday: '1978-10-01',
		mnemonic: 'The prankster',
		profile_pic_index: 9,
		createdAt: '2024-01-01T00:00:00Z',
		updatedAt: '2024-01-01T00:00:00Z'
	},
	{
		id: 'angela-martin',
		name: 'Angela Martin',
		body: 'Office Administrator',
		intent: 'romantic',
		birthday: '1974-11-11',
		mnemonic: 'The cat lady',
		profile_pic_index: 5,
		createdAt: '2024-01-01T00:00:00Z',
		updatedAt: '2024-01-01T00:00:00Z'
	},
	{
		id: 'rolf-ahl',
		name: 'Rolf Ahl',
		body: 'Legendary Beeter',
		intent: 'core',
		birthday: null,
		mnemonic: 'Beet legend',
		profile_pic_index: 3,
		createdAt: '2024-01-01T00:00:00Z',
		updatedAt: '2024-01-01T00:00:00Z'
	},
	{
		id: 'mose-schrute',
		name: 'Mose',
		body: 'Legendary Beeter',
		intent: 'core',
		birthday: null,
		mnemonic: 'My cousin',
		profile_pic_index: 4,
		createdAt: '2024-01-01T00:00:00Z',
		updatedAt: '2024-01-01T00:00:00Z'
	},
	{
		id: 'jan-levinson',
		name: 'Jan Levinson',
		body: 'Former Dunder Mifflin VP',
		intent: 'core',
		birthday: null,
		mnemonic: 'Former VP',
		profile_pic_index: 6,
		createdAt: '2024-01-01T00:00:00Z',
		updatedAt: '2024-01-01T00:00:00Z'
	},
	{
		id: 'hunter',
		name: 'Hunter',
		body: "Jan's former assistant",
		intent: 'associate',
		birthday: null,
		mnemonic: "Jan's assistant",
		profile_pic_index: 7,
		createdAt: '2024-01-01T00:00:00Z',
		updatedAt: '2024-01-01T00:00:00Z'
	},
	{
		id: 'ed-truck',
		name: 'Ed Truck',
		body: 'Former Regional Manager, epic death',
		intent: 'archive',
		birthday: null,
		mnemonic: 'Decapitated',
		profile_pic_index: 7,
		createdAt: '2024-01-01T00:00:00Z',
		updatedAt: '2024-01-01T00:00:00Z'
	},
	{
		id: 'david-wallace',
		name: 'David Wallace',
		body: 'Left the company.',
		intent: 'archive',
		birthday: null,
		mnemonic: 'Former CFO',
		profile_pic_index: 8,
		createdAt: '2024-01-01T00:00:00Z',
		updatedAt: '2024-01-01T00:00:00Z'
	}
];

const initialGroups: DemoGroup[] = [
	{
		id: 'work-group',
		name: 'Work',
		description: 'Office colleagues',
		createdAt: '2024-01-01T00:00:00Z',
		updatedAt: '2024-01-01T00:00:00Z'
	},
	{
		id: 'beet-club',
		name: 'Beet Club',
		description: 'Fellow beet enthusiasts',
		createdAt: '2024-01-01T00:00:00Z',
		updatedAt: '2024-01-01T00:00:00Z'
	}
];

const initialGroupAssociations: DemoGroupAssociation[] = [
	// Work group members
	{ personId: 'michael-scott', groupId: 'work-group' },
	{ personId: 'pam-beesly', groupId: 'work-group' },
	{ personId: 'creed-bratton', groupId: 'work-group' },
	{ personId: 'jim-halpert', groupId: 'work-group' },
	{ personId: 'angela-martin', groupId: 'work-group' },
	{ personId: 'jan-levinson', groupId: 'work-group' },
	{ personId: 'ed-truck', groupId: 'work-group' },
	{ personId: 'david-wallace', groupId: 'work-group' },

	// Beet Club members
	{ personId: 'rolf-ahl', groupId: 'beet-club' },
	{ personId: 'mose-schrute', groupId: 'beet-club' }
];

const initialPersonAssociations: DemoPersonAssociation[] = [
	{ personId: 'jan-levinson', associateId: 'hunter' }
];

const initialHistory: DemoHistory[] = [
	{
		id: 'history-1',
		personId: 'michael-scott',
		changeType: 'MANUAL',
		field: 'description',
		detail: 'Updated description',
		createdAt: '2024-01-01T00:00:00Z',
		updatedAt: '2024-01-01T00:00:00Z'
	}
];

// Demo mode flag
export const isDemoMode = writable(false);

// Core stores
export const demoPeople = writable<DemoPerson[]>(initialPeople);
export const demoGroups = writable<DemoGroup[]>(initialGroups);
export const demoGroupAssociations = writable<DemoGroupAssociation[]>(initialGroupAssociations);
export const demoPersonAssociations = writable<DemoPersonAssociation[]>(initialPersonAssociations);
export const demoHistory = writable<DemoHistory[]>(initialHistory);

// Derived stores for common queries
export const demoPeopleNotAssociates = derived(demoPeople, ($people) =>
	$people.filter((person) => !['associate', 'archive'].includes(person.intent))
);

export const demoArchivedPeople = derived(demoPeople, ($people) =>
	$people.filter((person) => person.intent === 'archive')
);

// Utility functions
function generateId(): string {
	return `demo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function updateTimestamp(item: any): any {
	return {
		...item,
		updatedAt: new Date().toISOString()
	};
}

// Demo actions
export const demoActions = {
	// Initialize demo mode
	initDemo() {
		isDemoMode.set(true);
		demoPeople.set([...initialPeople]);
		demoGroups.set([...initialGroups]);
		demoGroupAssociations.set([...initialGroupAssociations]);
		demoPersonAssociations.set([...initialPersonAssociations]);
		demoHistory.set([...initialHistory]);
		console.log('🎭 Demo mode initialized');
	},

	// Exit demo mode
	exitDemo() {
		isDemoMode.set(false);
		console.log('🎭 Demo mode exited');
	},

	// Person actions
	createPerson(name: string, intent: string = 'new'): DemoPerson {
		const newPerson: DemoPerson = {
			id: generateId(),
			name,
			body: 'Add a description',
			intent,
			birthday: null,
			mnemonic: 'Add a mnemonic',
			profile_pic_index: Math.floor(Math.random() * 10),
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};

		demoPeople.update((people) => [...people, newPerson]);
		console.log('🎭 Demo: Created person', newPerson);
		return newPerson;
	},

	updatePerson(id: string, updates: Partial<DemoPerson>) {
		demoPeople.update((people) =>
			people.map((person) =>
				person.id === id ? updateTimestamp({ ...person, ...updates }) : person
			)
		);
		console.log('🎭 Demo: Updated person', id, updates);
	},

	deletePerson(id: string) {
		demoPeople.update((people) => people.filter((person) => person.id !== id));
		demoGroupAssociations.update((assocs) => assocs.filter((assoc) => assoc.personId !== id));
		demoPersonAssociations.update((assocs) =>
			assocs.filter((assoc) => assoc.personId !== id && assoc.associateId !== id)
		);
		demoHistory.update((history) => history.filter((h) => h.personId !== id));
		console.log('🎭 Demo: Deleted person', id);
	},

	// Group actions
	createGroup(name: string): DemoGroup {
		const newGroup: DemoGroup = {
			id: generateId(),
			name,
			description: '',
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};

		demoGroups.update((groups) => [...groups, newGroup]);
		console.log('🎭 Demo: Created group', newGroup);
		return newGroup;
	},

	updateGroup(id: string, updates: Partial<DemoGroup>) {
		demoGroups.update((groups) =>
			groups.map((group) => (group.id === id ? updateTimestamp({ ...group, ...updates }) : group))
		);
		console.log('🎭 Demo: Updated group', id, updates);
	},

	deleteGroup(id: string) {
		demoGroups.update((groups) => groups.filter((group) => group.id !== id));
		demoGroupAssociations.update((assocs) => assocs.filter((assoc) => assoc.groupId !== id));
		console.log('🎭 Demo: Deleted group', id);
	},

	// Association actions
	addPersonToGroup(personId: string, groupId: string) {
		demoGroupAssociations.update((assocs) => {
			if (assocs.some((assoc) => assoc.personId === personId && assoc.groupId === groupId)) {
				return assocs; // Already exists
			}
			return [...assocs, { personId, groupId }];
		});
		console.log('🎭 Demo: Added person to group', { personId, groupId });
	},

	removePersonFromGroup(personId: string, groupId: string) {
		demoGroupAssociations.update((assocs) =>
			assocs.filter((assoc) => !(assoc.personId === personId && assoc.groupId === groupId))
		);
		console.log('🎭 Demo: Removed person from group', { personId, groupId });
	},

	createAssociation(personId: string, associateId: string) {
		demoPersonAssociations.update((assocs) => {
			if (
				assocs.some((assoc) => assoc.personId === personId && assoc.associateId === associateId)
			) {
				return assocs; // Already exists
			}
			return [...assocs, { personId, associateId }];
		});
		console.log('🎭 Demo: Created association', { personId, associateId });
	},

	deleteAssociation(personId: string, associateId: string) {
		demoPersonAssociations.update((assocs) =>
			assocs.filter((assoc) => !(assoc.personId === personId && assoc.associateId === associateId))
		);
		console.log('🎭 Demo: Deleted association', { personId, associateId });
	},

	// History actions
	createHistoryEntry(personId: string, changeType: string, field: string, detail: string) {
		const newHistory: DemoHistory = {
			id: generateId(),
			personId,
			changeType,
			field,
			detail,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};

		demoHistory.update((history) => [newHistory, ...history]);
		console.log('🎭 Demo: Created history entry', newHistory);
	}
};

// Helper functions to get computed data
export function getDemoPersonWithDetails(id: string) {
	let person: DemoPerson | undefined;
	let groups: DemoGroup[] = [];
	let associates: DemoPerson[] = [];
	let history: DemoHistory[] = [];
	let people: DemoPerson[] = [];
	let groupAssociations: DemoGroupAssociation[] = [];
	let personAssociations: DemoPersonAssociation[] = [];
	let allGroups: DemoGroup[] = [];
	let allHistory: DemoHistory[] = [];

	// Subscribe to get current values
	const unsubscribePeople = demoPeople.subscribe((value) => (people = value));
	const unsubscribeGroups = demoGroups.subscribe((value) => (allGroups = value));
	const unsubscribeGroupAssocs = demoGroupAssociations.subscribe(
		(value) => (groupAssociations = value)
	);
	const unsubscribePersonAssocs = demoPersonAssociations.subscribe(
		(value) => (personAssociations = value)
	);
	const unsubscribeHistory = demoHistory.subscribe((value) => (allHistory = value));

	person = people.find((p) => p.id === id);

	if (person) {
		// Get person's groups
		const personGroupIds = groupAssociations
			.filter((assoc) => assoc.personId === id)
			.map((assoc) => assoc.groupId);

		groups = allGroups.filter((group) => personGroupIds.includes(group.id));

		// Get person's associates
		const associateIds = personAssociations
			.filter((assoc) => assoc.personId === id)
			.map((assoc) => assoc.associateId);

		associates = people.filter((person) => associateIds.includes(person.id));

		// Get person's history
		history = allHistory.filter((h) => h.personId === id);
	}

	// Cleanup subscriptions
	unsubscribePeople();
	unsubscribeGroups();
	unsubscribeGroupAssocs();
	unsubscribePersonAssocs();
	unsubscribeHistory();

	if (!person) return null;

	return {
		friend: person,
		associates,
		history,
		groupData: groups.map((group) => ({
			groupId: group.id,
			groupName: group.name
		}))
	};
}

export function getDemoGroupWithPeople(id: string) {
	let group: DemoGroup | undefined;
	let people: DemoPerson[] = [];
	let allPeople: DemoPerson[] = [];
	let groupAssociations: DemoGroupAssociation[] = [];
	let allGroups: DemoGroup[] = [];

	// Subscribe to get current values
	const unsubscribePeople = demoPeople.subscribe((value) => (allPeople = value));
	const unsubscribeGroups = demoGroups.subscribe((value) => (allGroups = value));
	const unsubscribeGroupAssocs = demoGroupAssociations.subscribe(
		(value) => (groupAssociations = value)
	);

	group = allGroups.find((g) => g.id === id);

	if (group) {
		// Get people in this group
		const peopleIds = groupAssociations
			.filter((assoc) => assoc.groupId === id)
			.map((assoc) => assoc.personId);

		people = allPeople.filter((person) => peopleIds.includes(person.id));
	}

	// Get available people (not in this group)
	const availablePeople = allPeople.filter(
		(person) => !people.some((groupPerson) => groupPerson.id === person.id)
	);

	// Cleanup subscriptions
	unsubscribePeople();
	unsubscribeGroups();
	unsubscribeGroupAssocs();

	if (!group) return null;

	return {
		group,
		people,
		availablePeople: availablePeople.map((p) => ({ id: p.id, name: p.name }))
	};
}
