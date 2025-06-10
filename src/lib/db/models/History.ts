import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config';
import { Person } from './Person';

export enum ChangeType {
  PROMPT = 'prompt',
  MANUAL = 'manual'
}

export class History extends Model {
  declare id: string;
  declare personId: string;
  declare changeType: ChangeType;
  declare field: string;
  declare detail: string;
  declare userId: string;
  declare createdAt: Date;
  declare updatedAt: Date;
}

History.init(
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
    changeType: {
      type: DataTypes.ENUM('prompt', 'manual'),
      allowNull: false
    },
    field: {
      type: DataTypes.STRING,
      allowNull: false
    },
    detail: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false
    }
  },
  {
    sequelize,
    modelName: 'History',
    tableName: 'history',
    timestamps: true
  }
); 
