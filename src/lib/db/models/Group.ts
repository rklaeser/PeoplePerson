import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config';

export class Group extends Model {
  declare id: string;
  declare name: string;
  declare description: string;
  declare userId: string;
  declare createdAt: Date;
  declare updatedAt: Date;
}

Group.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  }
},
  {
    sequelize,
    modelName: 'Group',
    tableName: 'groups',
    timestamps: true
  }
); 