import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config';

export enum Intent {
  ROMANTIC = 'romantic',
  CORE = 'core',
  ARCHIVE = 'archive',
  NEW = 'new',
  INVEST = 'invest',
  ASSOCIATE = 'associate'
}

export class Person extends Model {
  declare id: string;
  declare name: string;
  declare body: string;
  declare intent: Intent;
  declare birthday: Date | null;
  declare mnemonic: string | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

Person.init(
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
    body: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: 'Add a description'
    },
    intent: {
      type: DataTypes.ENUM(...Object.values(Intent)),
      allowNull: false,
      defaultValue: Intent.NEW
    },
    birthday: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    mnemonic: {
      type: DataTypes.STRING,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'Person',
    tableName: 'people',
    timestamps: true
  }
); 