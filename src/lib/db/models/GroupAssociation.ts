import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config';
import { Person } from './Person';
import { Group } from './Group';

export class GroupAssociation extends Model {
  declare groupId: string;
  declare personId: string;
  declare createdAt: Date;
  declare updatedAt: Date;
}

GroupAssociation.init(
  {
    groupId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Group,
        key: 'id'
      }
    },
    personId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Person,
        key: 'id'
      }
    }
  },
  {
    sequelize,
    modelName: 'GroupAssociation',
    tableName: 'groupAssociations',
    timestamps: true
  }
); 