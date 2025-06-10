import { Group, Person } from '$lib/db/models';
import { Op } from 'sequelize';


export async function getPeopleNotAssociates(userId: string) {
    const people = await Person.findAll({
        where: {
            userId: userId,
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

export async function getArchivedPeople(userId: string) {
    const people = await Person.findAll({
        where: {
            userId: userId,
            intent: 'archive'
        }
    });
    return people;
}

export async function getGroups(userId: string) {
    const groups = await Group.findAll({
        where: {
            userId: userId
        },
        include: [
            {
                model: Person,
                through: { attributes: [] }
            }
        ]
    });
    return groups;
}   