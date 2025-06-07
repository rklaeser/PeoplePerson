import { Person } from '$lib/db/models/Person';
import type { Friend } from '$lib/types';

interface PersonWithAssociates extends Person {
  AssociatedPeople?: PersonWithAssociates[];
}

export class PersonQueryHelper {
  /**
   * Get all people with their associates formatted for LangChain processing
   * This complements the existing PersonService by providing data in the format
   * needed for search and update operations
   */
  static async getAllPeopleWithAssociates(): Promise<Friend[]> {
    const people = await Person.findAll({
      include: [
        {
          model: Person,
          as: 'AssociatedPeople',
          through: { attributes: [] }
        }
      ]
    }) as PersonWithAssociates[];

    return people.map(person => ({
      ...person.toJSON(),
      birthday: person.birthday ? person.birthday.toISOString().split('T')[0] : null,
      associates: person.AssociatedPeople?.map(associate => ({
        ...associate.toJSON(),
        birthday: associate.birthday ? associate.birthday.toISOString().split('T')[0] : null
      }))
    }));
  }
}