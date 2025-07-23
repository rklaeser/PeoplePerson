import { Model, DataTypes, Sequelize } from 'sequelize';
import { sequelize } from '../config';

export class PersonAssociation extends Model {
	declare personId: string;
	declare associateId: string;
	declare userId: string;
	declare createdAt: Date;
	declare updatedAt: Date;
}

PersonAssociation.init(
	{
		personId: {
			type: DataTypes.UUID,
			allowNull: false,
			primaryKey: true,
			references: {
				model: 'people',
				key: 'id'
			}
		},
		associateId: {
			type: DataTypes.UUID,
			allowNull: false,
			primaryKey: true,
			references: {
				model: 'people',
				key: 'id'
			}
		},
		createdAt: {
			type: DataTypes.DATE,
			defaultValue: Sequelize.fn('NOW'),
			allowNull: false
		},
		updatedAt: {
			type: DataTypes.DATE,
			defaultValue: Sequelize.fn('NOW'),
			allowNull: false
		},
		userId: {
			type: DataTypes.UUID,
			allowNull: false
		}
	},
	{
		sequelize,
		modelName: 'PersonAssociation',
		tableName: 'person_associations',
		timestamps: true
	}
);
