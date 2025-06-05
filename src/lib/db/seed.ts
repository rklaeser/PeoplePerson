import { Person, Group, sequelize } from './models';
import { Intent } from './models/Person';

async function seed() {
  try {
    // Clear all tables and recreate them
    await sequelize.sync({ force: true });
    console.log('Database cleared and tables recreated');

    // Create Work group
    const workGroup = await Group.create({
      name: 'Work'
    });

    // Create Beet Club group
    const beetClubGroup = await Group.create({
      name: 'Beet Club'
    });

    // Create Work group members
    const michael = await Person.create({
      name: 'Michael Scott',
      body: 'World\'s Best Boss. My hero.',
      intent: Intent.CORE
    });

    const pam = await Person.create({
      name: 'Pam Beesly',
      body: 'Office Administrator',
      intent: Intent.INVEST
    });

    const creed = await Person.create({
      name: 'Creed Bratton',
      body: 'Quality Assurance, even I think he\'s creepy.',
      intent: Intent.NEW
    });

    // Create Beet Club members
    const rolf = await Person.create({
      name: 'Rolf Ahl',
      body: 'Legendary Beeter',
      intent: Intent.CORE
    });

    const mose = await Person.create({
      name: 'Mose',
      body: 'Legendary Beeter',
      intent: Intent.CORE
    });

    const angela = await Person.create({
      name: 'Angela Martin',
      body: 'Office Administrator',
      intent: Intent.ROMANTIC
    });

    // Create additional people
    const jan = await Person.create({
      name: 'Jan Levinson',
      body: 'Former Dunder Mifflin VP',
      intent: Intent.ASSOCIATE
    });

    const edTruck = await Person.create({
      name: 'Ed Truck',
      body: 'Former Regional Manager, epic death',
      intent: Intent.ARCHIVE
    });

    const david = await Person.create({
        name: 'David Wallace',
        body: 'Left the company.',
        intent: Intent.ARCHIVE
      });

    const jim = await Person.create({
      name: 'Jim Halpert',
      body: 'Sales Representative, kinda mean to me sometimes.',
      intent: Intent.INVEST
    });

    // Associate Work group members
    await (michael as any).addGroup(workGroup);
    await (pam as any).addGroup(workGroup);
    await (creed as any).addGroup(workGroup);
    await (jim as any).addGroup(workGroup);

    // Associate Run Club members
    await (rolf as any).addGroup(beetClubGroup);
    await (mose as any).addGroup(beetClubGroup);

    // Create associations
    await (michael as any).addAssociatedPeople(jan);

    console.log('Database seeded successfully with Work and Run Club groups');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

seed(); 