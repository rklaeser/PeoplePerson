// 1. Updated Person Model (models/Person.ts)
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
	declare zip: string | null;
	declare profile_pic_index: number;
	declare userId: string;
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
		},
		zip: {
			type: DataTypes.STRING,
			allowNull: true
		},
		profile_pic_index: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: () => Math.floor(Math.random() * 25), // Random index 0-24
			validate: {
				min: 0,
				max: 24
			}
		},
		userId: {
			type: DataTypes.UUID,
			allowNull: false
		}
	},
	{
		sequelize,
		modelName: 'Person',
		tableName: 'people',
		timestamps: true
	}
);
