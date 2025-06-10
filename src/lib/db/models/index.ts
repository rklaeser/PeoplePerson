import { Person } from './Person';
import { Group } from './Group';
import { History } from './History';
import { GroupAssociation } from './GroupAssociation';
import { PersonAssociation } from './PersonAssociation';
import { User } from './User';
import { Account } from './Account';
import { Session } from './Session';
import { VerificationToken } from './VerificationToken';
import { sequelize } from '../config';

// Set up associations for existing models
Person.hasMany(History, { foreignKey: 'personId' });
History.belongsTo(Person, { foreignKey: 'personId' });

Person.belongsToMany(Group, { through: GroupAssociation, foreignKey: 'personId' });
Group.belongsToMany(Person, { through: GroupAssociation, foreignKey: 'groupId' });

// Set up Person-to-Person association for associates
if (!Person.associations.Associates) {
  Person.belongsToMany(Person, { 
    through: PersonAssociation,
    as: 'Associates',
    foreignKey: 'personId',
    otherKey: 'associateId'
  });
}

if (!Person.associations.AssociatedWith) {
  Person.belongsToMany(Person, {
    through: PersonAssociation,
    as: 'AssociatedWith',
    foreignKey: 'associateId',
    otherKey: 'personId'
  });
}

// Set up Auth.js model associations
User.hasMany(Account, { foreignKey: 'userId', onDelete: 'CASCADE' });
Account.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Session, { foreignKey: 'userId', onDelete: 'CASCADE' });
Session.belongsTo(User, { foreignKey: 'userId' });

// Optional: Link User to Person for data ownership
User.hasMany(Person, { foreignKey: 'userId', as: 'Friends' });
Person.belongsTo(User, { foreignKey: 'userId', as: 'Owner' });

export {
  sequelize,
  Person,
  Group,
  History,
  GroupAssociation,
  PersonAssociation,
  User,
  Account,
  Session,
  VerificationToken
};

export { ChangeType } from './History'; 