import { Model, DataTypes, Sequelize } from 'sequelize';
import { sequelize } from '../config';
import { User } from './User';

export class Session extends Model {
	declare id: string;
	declare sessionToken: string;
	declare userId: string;
	declare expires: Date;
	declare createdAt: Date;
	declare updatedAt: Date;
}

Session.init(
	{
		id: {
			type: DataTypes.UUID,
			defaultValue: Sequelize.fn('gen_random_uuid'),
			primaryKey: true,
			allowNull: false
		},
		sessionToken: {
			type: DataTypes.STRING,
			allowNull: false,
			unique: true
		},
		userId: {
			type: DataTypes.UUID,
			allowNull: false,
			references: {
				model: User,
				key: 'id'
			}
		},
		expires: {
			type: DataTypes.DATE,
			allowNull: false
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
		modelName: 'Session',
		tableName: 'sessions',
		timestamps: true,
		indexes: [
			{
				unique: true,
				fields: ['sessionToken']
			}
		]
	}
);
