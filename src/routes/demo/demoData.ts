// Hardcoded demo data for Dwight Schrute demo
export const demoUser = {
  id: 'demo-user',
  name: 'Dwight Schrute Demo',
  email: 'demo@friendshipapp.com',
  image: 'https://example.com/dwight.jpg'
};

export const demoPeople = [
  {
    id: 'michael-scott',
    name: 'Michael Scott',
    body: 'World\'s Best Boss. My hero.',
    intent: 'core',
    birthday: '1965-03-15',
    mnemonic: 'World\'s best boss',
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
    body: 'Quality Assurance, even I think he\'s creepy.',
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
    body: 'Jan\'s former assistant',
    intent: 'associate',
    birthday: null,
    mnemonic: 'Jan\'s assistant',
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

export const demoGroups = [
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

export const demoGroupAssociations = [
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

export const demoPersonAssociations = [
  { personId: 'jan-levinson', associateId: 'hunter' }
];

export const demoHistory = [
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

// Helper functions to get demo data
export function getDemoPeopleNotAssociates() {
  return demoPeople.filter(person => 
    !['associate', 'archive'].includes(person.intent)
  );
}

export function getDemoArchivedPeople() {
  return demoPeople.filter(person => person.intent === 'archive');
}

export function getDemoPersonById(id: string) {
  return demoPeople.find(person => person.id === id);
}

export function getDemoGroupById(id: string) {
  return demoGroups.find(group => group.id === id);
}

export function getDemoPersonWithDetails(id: string) {
  const person = getDemoPersonById(id);
  if (!person) return null;

  // Get person's groups
  const personGroupIds = demoGroupAssociations
    .filter(assoc => assoc.personId === id)
    .map(assoc => assoc.groupId);
  
  const groups = demoGroups
    .filter(group => personGroupIds.includes(group.id))
    .map(group => ({
      groupId: group.id,
      groupName: group.name
    }));

  // Get person's associates
  const associateIds = demoPersonAssociations
    .filter(assoc => assoc.personId === id)
    .map(assoc => assoc.associateId);
  
  const associates = demoPeople.filter(person => associateIds.includes(person.id));

  // Get person's history
  const history = demoHistory.filter(h => h.personId === id);

  return {
    friend: person,
    associates,
    history,
    groupData: groups
  };
}

export function getDemoGroupWithPeople(id: string) {
  const group = getDemoGroupById(id);
  if (!group) return null;

  // Get people in this group
  const peopleIds = demoGroupAssociations
    .filter(assoc => assoc.groupId === id)
    .map(assoc => assoc.personId);
  
  const people = demoPeople.filter(person => peopleIds.includes(person.id));
  
  // Get available people (not in this group)
  const availablePeople = demoPeople.filter(person => !peopleIds.includes(person.id));

  return {
    group,
    people,
    availablePeople: availablePeople.map(p => ({ id: p.id, name: p.name }))
  };
}