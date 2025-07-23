import { Person, Group, PersonAssociation, GroupAssociation, User, sequelize } from './models';
import { Intent } from './models/Person';

async function seed() {
	try {
		// Clear all tables and recreate them
		await sequelize.sync({ force: true });
		console.log('Database cleared and tables recreated');

		// Create demo user for Dwight Schrute demo with explicit UUID
		const demoUserId = '00000000-0000-0000-0000-000000000001';
		const demoUser = await User.create({
			id: demoUserId,
			name: 'Dwight Schrute Demo',
			email: 'demo@friendshipapp.com',
			image: 'https://example.com/dwight.jpg'
		});
		console.log('Demo user created with ID:', demoUser.id);

		// Create Work group
		const workGroup = await Group.create({
			name: 'Work',
			userId: demoUser.id
		});

		// Create Beet Club group
		const beetClubGroup = await Group.create({
			name: 'Beet Club',
			userId: demoUser.id
		});

		// Create Work group members
		const michael = await Person.create({
			name: 'Michael Scott',
			body: "World's Best Boss. My hero.",
			intent: Intent.CORE,
			profile_pic_index: 0,
			userId: demoUser.id
		});

		const pam = await Person.create({
			name: 'Pam Beesly',
			body: 'Office Administrator',
			intent: Intent.INVEST,
			profile_pic_index: 1,
			userId: demoUser.id
		});

		const creed = await Person.create({
			name: 'Creed Bratton',
			body: "Quality Assurance, even I think he's creepy.",
			intent: Intent.NEW,
			profile_pic_index: 2,
			userId: demoUser.id
		});

		// Create Beet Club members
		const rolf = await Person.create({
			name: 'Rolf Ahl',
			body: 'Legendary Beeter',
			intent: Intent.CORE,
			profile_pic_index: 3,
			userId: demoUser.id
		});

		const mose = await Person.create({
			name: 'Mose',
			body: 'Legendary Beeter',
			intent: Intent.CORE,
			profile_pic_index: 4,
			userId: demoUser.id
		});

		const angela = await Person.create({
			name: 'Angela Martin',
			body: 'Office Administrator',
			intent: Intent.ROMANTIC,
			profile_pic_index: 5,
			userId: demoUser.id
		});

		// Create additional people
		const jan = await Person.create({
			name: 'Jan Levinson',
			body: 'Former Dunder Mifflin VP',
			intent: Intent.CORE,
			profile_pic_index: 6,
			userId: demoUser.id
		});

		const hunter = await Person.create({
			name: 'Hunter',
			body: "Jan's former assistant",
			intent: Intent.ASSOCIATE,
			profile_pic_index: 7,
			userId: demoUser.id
		});

		const edTruck = await Person.create({
			name: 'Ed Truck',
			body: 'Former Regional Manager, epic death',
			intent: Intent.ARCHIVE,
			profile_pic_index: 7,
			userId: demoUser.id
		});

		const david = await Person.create({
			name: 'David Wallace',
			body: 'Left the company.',
			intent: Intent.ARCHIVE,
			profile_pic_index: 8,
			userId: demoUser.id
		});

		const jim = await Person.create({
			name: 'Jim Halpert',
			body: 'Sales Representative, kinda mean to me sometimes.',
			intent: Intent.INVEST,
			profile_pic_index: 9,
			userId: demoUser.id
		});

		// Associate Work group members
		await GroupAssociation.create({
			personId: michael.id,
			groupId: workGroup.id,
			userId: demoUser.id
		});
		await GroupAssociation.create({ personId: pam.id, groupId: workGroup.id, userId: demoUser.id });
		await GroupAssociation.create({
			personId: creed.id,
			groupId: workGroup.id,
			userId: demoUser.id
		});
		await GroupAssociation.create({ personId: jim.id, groupId: workGroup.id, userId: demoUser.id });
		await GroupAssociation.create({
			personId: edTruck.id,
			groupId: workGroup.id,
			userId: demoUser.id
		});
		await GroupAssociation.create({
			personId: david.id,
			groupId: workGroup.id,
			userId: demoUser.id
		});
		await GroupAssociation.create({
			personId: angela.id,
			groupId: workGroup.id,
			userId: demoUser.id
		});
		await GroupAssociation.create({ personId: jan.id, groupId: workGroup.id, userId: demoUser.id });

		// Associate Beet Club members
		await GroupAssociation.create({
			personId: rolf.id,
			groupId: beetClubGroup.id,
			userId: demoUser.id
		});
		await GroupAssociation.create({
			personId: mose.id,
			groupId: beetClubGroup.id,
			userId: demoUser.id
		});

		// Create person associations
		await PersonAssociation.create({
			personId: jan.id,
			associateId: hunter.id,
			userId: demoUser.id
		});

		console.log('Database seeded successfully with Work and Beet Club groups');
	} catch (error) {
		console.error('Error seeding database:', error);
		process.exit(1);
	} finally {
		await sequelize.close();
	}
}

seed();
