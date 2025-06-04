import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config';
import { Person } from './Person';

export class Journal extends Model {
  declare id: string;
  declare personId: string;
  declare title: string;
  declare body: string;
  declare createdAt: Date;
  declare updatedAt: Date;
}

Journal.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    personId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Person,
        key: 'id'
      }
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Untitled'
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  },
  {
    sequelize,
    modelName: 'Journal',
    tableName: 'journal',
    timestamps: true
  }
); 