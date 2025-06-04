import { Person, Group, sequelize } from './models';
import { Region, Intent } from './models/Person';

async function seed() {
  try {
    // Clear all tables and recreate them
    await sequelize.sync({ force: true });
    console.log('Database cleared and tables recreated');

    // Create Work group
    const workGroup = await Group.create({
      name: 'Work'
    });

    // Create Run Club group
    const runClubGroup = await Group.create({
      name: 'Run Club'
    });

    // Create Work group members
    const michael = await Person.create({
      name: 'Michael Scott',
      region: Region.SCRANTON,
      county: 'Scranton',
      body: 'World\'s Best Boss',
      intent: Intent.NEW
    });

    const pam = await Person.create({
      name: 'Pam Beesly',
      region: Region.SCRANTON,
      county: 'Scranton',
      body: 'Office Administrator',
      intent: Intent.ROMANTIC
    });

    const creed = await Person.create({
      name: 'Creed Bratton',
      region: Region.SCRANTON,
      county: 'Scranton',
      body: 'Quality Assurance',
      intent: Intent.NEW
    });

    // Create Run Club members
    const steve = await Person.create({
      name: 'Steve Prefontaine',
      region: Region.UNCATEGORIZED,
      county: 'Eugene',
      body: 'Legendary Runner',
      intent: Intent.NEW
    });

    const eliud = await Person.create({
      name: 'Eliud Kipchoge',
      region: Region.UNCATEGORIZED,
      county: 'Nairobi',
      body: 'Marathon World Record Holder',
      intent: Intent.NEW
    });

    const joan = await Person.create({
      name: 'Joan Benoit Samuelson',
      region: Region.UNCATEGORIZED,
      county: 'Portland',
      body: 'First Women\'s Olympic Marathon Champion',
      intent: Intent.NEW
    });

    // Create additional people
    const jan = await Person.create({
      name: 'Jan Levinson',
      region: Region.SCRANTON,
      county: 'Scranton',
      body: 'Former Dunder Mifflin VP',
      intent: Intent.ASSOCIATE
    });

    const edTruck = await Person.create({
      name: 'Ed Truck',
      region: Region.SCRANTON,
      county: 'Scranton',
      body: 'Former Regional Manager',
      intent: Intent.ARCHIVE
    });

    const jim = await Person.create({
      name: 'Jim Halpert',
      region: Region.SCRANTON,
      county: 'Scranton',
      body: 'Sales Representative',
      intent: Intent.CORE
    });

    // Associate Work group members
    await (michael as any).addGroup(workGroup);
    await (pam as any).addGroup(workGroup);
    await (creed as any).addGroup(workGroup);
    await (jim as any).addGroup(workGroup);

    // Associate Run Club members
    await (steve as any).addGroup(runClubGroup);
    await (eliud as any).addGroup(runClubGroup);
    await (joan as any).addGroup(runClubGroup);

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