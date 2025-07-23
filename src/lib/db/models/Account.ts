import { Model, DataTypes, Sequelize } from 'sequelize';
import { sequelize } from '../config';
import { User } from './User';

export class Account extends Model {
	declare id: string;
	declare userId: string;
	declare type: string;
	declare provider: string;
	declare providerAccountId: string;
	declare refresh_token?: string;
	declare access_token?: string;
	declare expires_at?: number;
	declare token_type?: string;
	declare scope?: string;
	declare id_token?: string;
	declare session_state?: string;
	declare createdAt: Date;
	declare updatedAt: Date;
}

Account.init(
	{
		id: {
			type: DataTypes.UUID,
			defaultValue: Sequelize.fn('gen_random_uuid'),
			primaryKey: true,
			allowNull: false
		},
		userId: {
			type: DataTypes.UUID,
			allowNull: false,
			references: {
				model: User,
				key: 'id'
			}
		},
		type: {
			type: DataTypes.STRING,
			allowNull: false
		},
		provider: {
			type: DataTypes.STRING,
			allowNull: false
		},
		providerAccountId: {
			type: DataTypes.STRING,
			allowNull: false
		},
		refresh_token: {
			type: DataTypes.TEXT,
			allowNull: true
		},
		access_token: {
			type: DataTypes.TEXT,
			allowNull: true
		},
		expires_at: {
			type: DataTypes.BIGINT,
			allowNull: true
		},
		token_type: {
			type: DataTypes.STRING,
			allowNull: true
		},
		scope: {
			type: DataTypes.STRING,
			allowNull: true
		},
		id_token: {
			type: DataTypes.TEXT,
			allowNull: true
		},
		session_state: {
			type: DataTypes.STRING,
			allowNull: true
		},
		createdAt: {
			type: DataTypes.DATE,
			defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
			allowNull: false
		},
		updatedAt: {
			type: DataTypes.DATE,
			defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
			allowNull: false
		}
	},
	{
		sequelize,
		modelName: 'Account',
		tableName: 'accounts',
		timestamps: true,
		indexes: [
			{
				unique: true,
				fields: ['provider', 'providerAccountId']
			}
		]
	}
);
