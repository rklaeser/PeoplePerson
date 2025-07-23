import { Model, DataTypes, Sequelize } from 'sequelize';
import { sequelize } from '../config';

export class VerificationToken extends Model {
	declare identifier: string;
	declare token: string;
	declare expires: Date;
	declare createdAt: Date;
	declare updatedAt: Date;
}

VerificationToken.init(
	{
		identifier: {
			type: DataTypes.STRING,
			allowNull: false,
			primaryKey: true
		},
		token: {
			type: DataTypes.STRING,
			allowNull: false,
			primaryKey: true
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
		modelName: 'VerificationToken',
		tableName: 'verification_token',
		timestamps: true
	}
);
