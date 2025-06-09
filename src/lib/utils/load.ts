import { Group, Person } from '$lib/db/models';
import { Op } from 'sequelize';


export async function getPeopleNotAssociates() {
    const people = await Person.findAll({
        where: {
            intent: {
                [Op.not]: ['associate', 'archive'] // exclude associates and archived
            }
        },
        include: [
            {
                model: Group,
                through: { attributes: [] }
            },
            {
                model: Person,
                as: 'Associates',
                through: { attributes: [] }
            }
        ]
    });
    return people;
}

export async function getArchivedPeople() {
    const people = await Person.findAll({
        where: {
            intent: 'archive'
        }
    });
    return people;
}

export async function getGroups() {
    const groups = await Group.findAll({
        include: [
            {
                model: Person,
                through: { attributes: [] }
            }
        ]
    });
    return groups;
}   