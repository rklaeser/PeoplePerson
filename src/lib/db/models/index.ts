import { Person } from './Person';
import { Group } from './Group';
import { Journal } from './Journal';
import { GroupAssociation } from './GroupAssociation';
import { sequelize } from '../config';

// Set up associations
Person.hasMany(Journal, { foreignKey: 'personId' });
Journal.belongsTo(Person, { foreignKey: 'personId' });

Person.belongsToMany(Group, { through: GroupAssociation, foreignKey: 'personId' });
Group.belongsToMany(Person, { through: GroupAssociation, foreignKey: 'groupId' });

// Set up Person-to-Person association for associates
Person.belongsToMany(Person, { 
  through: 'PersonAssociations',
  as: 'Associates',
  foreignKey: 'personId',
  otherKey: 'associateId'
});

Person.belongsToMany(Person, {
  through: 'PersonAssociations',
  as: 'AssociatedWith',
  foreignKey: 'associateId',
  otherKey: 'personId'
});

export {
  sequelize,
  Person,
  Group,
  Journal,
  GroupAssociation
}; 