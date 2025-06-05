import { Group, Person } from '$lib/db/models';
import { Op } from 'sequelize';


export async function getPeopleNotAssociates() {
    const people = await Person.findAll({
        where: {
            intent: {
                [Op.not]: 'associate' // exclude associates
            }
        },
        include: [
            {
                model: Group,
                through: { attributes: [] }
            },
            {
                model: Person,
                as: 'AssociatedPeople',
                through: { attributes: [] }
            }
        ]
    });
    return people;
}

export async function getGroups() {
    const groups = await Group.findAll();
    return groups;
}   