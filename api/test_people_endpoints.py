import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, create_engine, SQLModel
from sqlmodel.pool import StaticPool
from datetime import datetime
from uuid import uuid4
import json

from main import app
from database import get_db
from models import User, Person, Group, History, GroupAssociation, PersonAssociation, Entry, IntentChoices, ChangeTypeChoices


@pytest.fixture(name="session")
def session_fixture():
    """Create a test database session with in-memory SQLite"""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session


@pytest.fixture(name="client")
def client_fixture(session: Session):
    """Create a test client with overridden database session"""
    def get_db_override():
        return session
    
    app.dependency_overrides[get_db] = get_db_override
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


@pytest.fixture(name="test_user")
def test_user_fixture(session: Session):
    """Create a test user"""
    user = User(
        firebase_uid="test_uid_123",
        name="Test User",
        email="test@example.com",
        email_verified=datetime.utcnow()
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@pytest.fixture(name="test_people")
def test_people_fixture(session: Session, test_user: User):
    """Create multiple test people for a user"""
    people = [
        Person(
            name="Alice Johnson",
            body="Best friend from college",
            intent=IntentChoices.CORE,
            birthday="1990-05-15",
            mnemonic="Always laughing",
            zip="10001",
            profile_pic_index=5,
            user_id=test_user.id
        ),
        Person(
            name="Bob Smith",
            body="Work colleague, great mentor",
            intent=IntentChoices.INVEST,
            birthday="1985-10-20",
            mnemonic="Basketball buddy",
            zip="10002",
            profile_pic_index=10,
            user_id=test_user.id
        ),
        Person(
            name="Charlie Davis",
            body="Old roommate",
            intent=IntentChoices.ARCHIVE,
            user_id=test_user.id
        )
    ]
    for person in people:
        session.add(person)
    session.commit()
    for person in people:
        session.refresh(person)
    return people


@pytest.fixture(name="test_groups")
def test_groups_fixture(session: Session, test_user: User):
    """Create test groups"""
    groups = [
        Group(name="Family", description="Close family members", user_id=test_user.id),
        Group(name="Work", description="Professional contacts", user_id=test_user.id),
        Group(name="Hobbies", description="People from hobby groups", user_id=test_user.id)
    ]
    for group in groups:
        session.add(group)
    session.commit()
    for group in groups:
        session.refresh(group)
    return groups


class TestPeopleEndpoints:
    """Test cases for people-related endpoints"""
    
    def test_get_all_people_for_user(self, client: TestClient, test_user: User, test_people: list[Person]):
        """Test getting all people associated with a user ID"""
        response = client.get(f"/api/people/user/{test_user.id}")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3
        assert {p["name"] for p in data} == {"Alice Johnson", "Bob Smith", "Charlie Davis"}
        assert all(p["user_id"] == str(test_user.id) for p in data)
    
    def test_get_all_people_empty(self, client: TestClient, test_user: User):
        """Test getting people when user has none"""
        response = client.get(f"/api/people/user/{test_user.id}")
        
        assert response.status_code == 200
        assert response.json() == []
    
    def test_get_all_people_nonexistent_user(self, client: TestClient):
        """Test getting people for non-existent user"""
        fake_id = uuid4()
        response = client.get(f"/api/people/user/{fake_id}")
        
        assert response.status_code == 200
        assert response.json() == []
    
    def test_create_person(self, client: TestClient, test_user: User):
        """Test creating a new person"""
        person_data = {
            "name": "Diana Prince",
            "body": "New friend from gym",
            "intent": "develop",
            "birthday": "1992-03-25",
            "mnemonic": "Wonder Woman fan",
            "zip": "10003",
            "profile_pic_index": 7
        }
        
        response = client.post(
            f"/api/people/user/{test_user.id}",
            json=person_data
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Diana Prince"
        assert data["intent"] == "develop"
        assert data["user_id"] == str(test_user.id)
        assert "id" in data
    
    def test_get_person_by_id(self, client: TestClient, test_user: User, test_people: list[Person]):
        """Test getting a specific person by ID"""
        person = test_people[0]
        response = client.get(f"/api/people/{person.id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Alice Johnson"
        assert data["intent"] == "core"
        assert data["user_id"] == str(test_user.id)
    
    def test_get_person_not_found(self, client: TestClient):
        """Test getting non-existent person"""
        fake_id = uuid4()
        response = client.get(f"/api/people/{fake_id}")
        
        assert response.status_code == 404
        assert response.json()["detail"] == "Person not found"
    
    def test_update_person(self, client: TestClient, test_user: User, test_people: list[Person], session: Session):
        """Test updating a person's details"""
        person = test_people[0]
        update_data = {
            "body": "Best friend from college, now living in SF",
            "intent": "romantic",
            "zip": "94102"
        }
        
        response = client.patch(f"/api/people/{person.id}", json=update_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["body"] == update_data["body"]
        assert data["intent"] == "romantic"
        assert data["zip"] == "94102"
        assert data["name"] == "Alice Johnson"  # Unchanged
        
        # Verify history was created
        history = session.query(History).filter(History.person_id == person.id).all()
        assert len(history) == 3  # One for each field updated
    
    def test_delete_person(self, client: TestClient, test_people: list[Person]):
        """Test deleting a person"""
        person = test_people[0]
        response = client.delete(f"/api/people/{person.id}")
        
        assert response.status_code == 204
        
        # Verify person is deleted
        response = client.get(f"/api/people/{person.id}")
        assert response.status_code == 404
    

class TestHistoryEndpoints:
    """Test cases for history-related endpoints"""
    
    def test_get_person_history(self, client: TestClient, test_user: User, test_people: list[Person], session: Session):
        """Test getting history for a person"""
        person = test_people[0]
        
        # Create some history entries
        history_entries = [
            History(
                person_id=person.id,
                user_id=test_user.id,
                change_type=ChangeTypeChoices.MANUAL,
                field="name",
                detail="Changed from 'Alice J.' to 'Alice Johnson'"
            ),
            History(
                person_id=person.id,
                user_id=test_user.id,
                change_type=ChangeTypeChoices.PROMPT,
                field="intent",
                detail="Updated intent from 'new' to 'core' based on AI suggestion"
            )
        ]
        for entry in history_entries:
            session.add(entry)
        session.commit()
        
        response = client.get(f"/api/people/{person.id}/history")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert data[0]["field"] == "name"
        assert data[1]["change_type"] == "prompt"
    
    def test_get_history_empty(self, client: TestClient, test_people: list[Person]):
        """Test getting history when none exists"""
        person = test_people[0]
        response = client.get(f"/api/people/{person.id}/history")
        
        assert response.status_code == 200
        assert response.json() == []
    

class TestPersonAssociationsEndpoints:
    """Test cases for person associations (relationships between people)"""
    
    def test_create_person_association(self, client: TestClient, test_people: list[Person]):
        """Test creating association between two people"""
        person1, person2 = test_people[0], test_people[1]
        
        response = client.post(f"/api/people/{person1.id}/associates/{person2.id}")
        
        assert response.status_code == 201
        data = response.json()
        assert data["message"] == "Association created"
    
    def test_get_person_associates(self, client: TestClient, test_people: list[Person], session: Session):
        """Test getting all associates of a person"""
        person1, person2, person3 = test_people
        
        # Create associations
        assoc1 = PersonAssociation(person_id=person1.id, associate_id=person2.id)
        assoc2 = PersonAssociation(person_id=person1.id, associate_id=person3.id)
        session.add(assoc1)
        session.add(assoc2)
        session.commit()
        
        response = client.get(f"/api/people/{person1.id}/associates")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert {p["name"] for p in data} == {"Bob Smith", "Charlie Davis"}
    
    def test_delete_person_association(self, client: TestClient, test_people: list[Person], session: Session):
        """Test removing association between people"""
        person1, person2 = test_people[0], test_people[1]
        
        # Create association first
        assoc = PersonAssociation(person_id=person1.id, associate_id=person2.id)
        session.add(assoc)
        session.commit()
        
        response = client.delete(f"/api/people/{person1.id}/associates/{person2.id}")
        
        assert response.status_code == 204
        
        # Verify association is removed
        response = client.get(f"/api/people/{person1.id}/associates")
        assert len(response.json()) == 0
    

class TestGroupEndpoints:
    """Test cases for group-related endpoints"""
    
    def test_add_person_to_group(self, client: TestClient, test_people: list[Person], test_groups: list[Group]):
        """Test adding a person to a group"""
        person = test_people[0]
        group = test_groups[0]
        
        response = client.post(f"/api/people/{person.id}/groups/{group.id}")
        
        assert response.status_code == 201
        assert response.json()["message"] == "Person added to group"
    
    def test_get_person_groups(self, client: TestClient, test_user: User, test_people: list[Person], test_groups: list[Group], session: Session):
        """Test getting all groups a person belongs to"""
        person = test_people[0]
        
        # Add person to multiple groups
        for group in test_groups[:2]:
            assoc = GroupAssociation(
                person_id=person.id,
                group_id=group.id,
                user_id=test_user.id
            )
            session.add(assoc)
        session.commit()
        
        response = client.get(f"/api/people/{person.id}/groups")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert {g["name"] for g in data} == {"Family", "Work"}
    
    def test_get_group_members(self, client: TestClient, test_user: User, test_people: list[Person], test_groups: list[Group], session: Session):
        """Test getting all people in a group"""
        group = test_groups[0]
        
        # Add multiple people to group
        for person in test_people[:2]:
            assoc = GroupAssociation(
                person_id=person.id,
                group_id=group.id,
                user_id=test_user.id
            )
            session.add(assoc)
        session.commit()
        
        response = client.get(f"/api/groups/{group.id}/people")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert {p["name"] for p in data} == {"Alice Johnson", "Bob Smith"}
    
    def test_remove_person_from_group(self, client: TestClient, test_user: User, test_people: list[Person], test_groups: list[Group], session: Session):
        """Test removing a person from a group"""
        person = test_people[0]
        group = test_groups[0]
        
        # Add person to group first
        assoc = GroupAssociation(
            person_id=person.id,
            group_id=group.id,
            user_id=test_user.id
        )
        session.add(assoc)
        session.commit()
        
        response = client.delete(f"/api/people/{person.id}/groups/{group.id}")
        
        assert response.status_code == 204
        
        # Verify person is removed from group
        response = client.get(f"/api/people/{person.id}/groups")
        assert len(response.json()) == 0


class TestBulkOperations:
    """Test cases for bulk operations"""
    
    def test_bulk_update_intent(self, client: TestClient, test_people: list[Person]):
        """Test updating intent for multiple people at once"""
        person_ids = [str(p.id) for p in test_people[:2]]
        
        response = client.patch(
            "/api/people/bulk/intent",
            json={
                "person_ids": person_ids,
                "intent": "core"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["updated_count"] == 2
        
        # Verify updates
        for person_id in person_ids:
            response = client.get(f"/api/people/{person_id}")
            assert response.json()["intent"] == "core"
    
    def test_bulk_add_to_group(self, client: TestClient, test_user: User, test_people: list[Person], test_groups: list[Group]):
        """Test adding multiple people to a group"""
        group = test_groups[0]
        person_ids = [str(p.id) for p in test_people]
        
        response = client.post(
            f"/api/groups/{group.id}/people/bulk",
            json={"person_ids": person_ids}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["added_count"] == 3
        
        # Verify all people are in group
        response = client.get(f"/api/groups/{group.id}/people")
        assert len(response.json()) == 3


class TestSearchAndFilter:
    """Test cases for search and filter operations"""
    
    def test_search_people_by_name(self, client: TestClient, test_user: User, test_people: list[Person]):
        """Test searching people by name"""
        response = client.get(f"/api/people/user/{test_user.id}/search?q=alice")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == "Alice Johnson"
    
    def test_filter_people_by_intent(self, client: TestClient, test_user: User, test_people: list[Person]):
        """Test filtering people by intent"""
        response = client.get(f"/api/people/user/{test_user.id}?intent=core")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == "Alice Johnson"
    
    def test_filter_people_by_multiple_intents(self, client: TestClient, test_user: User, test_people: list[Person]):
        """Test filtering people by multiple intents"""
        response = client.get(f"/api/people/user/{test_user.id}?intent=core&intent=develop")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert {p["name"] for p in data} == {"Alice Johnson", "Bob Smith"}
    
    def test_search_with_pagination(self, client: TestClient, test_user: User, test_people: list[Person]):
        """Test paginated search results"""
        response = client.get(f"/api/people/user/{test_user.id}?limit=2&offset=0")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["results"]) == 2
        assert data["total"] == 3
        assert data["limit"] == 2
        assert data["offset"] == 0
        
        # Get next page
        response = client.get(f"/api/people/user/{test_user.id}?limit=2&offset=2")
        data = response.json()
        assert len(data["results"]) == 1


class TestEntryEndpoints:
    """Test cases for entry/journal endpoints"""
    
    def test_create_entry(self, client: TestClient, test_user: User, test_people: list[Person]):
        """Test creating a journal entry linked to people"""
        entry_data = {
            "content": "Had lunch with Alice and Bob today. Great conversation about work.",
            "person_ids": [str(test_people[0].id), str(test_people[1].id)]
        }
        
        response = client.post(f"/api/entries/user/{test_user.id}", json=entry_data)
        
        assert response.status_code == 201
        data = response.json()
        assert data["content"] == entry_data["content"]
        assert data["processing_status"] == "pending"
        assert len(data["people"]) == 2
    
    def test_get_person_entries(self, client: TestClient, test_user: User, test_people: list[Person], session: Session):
        """Test getting all entries related to a person"""
        person = test_people[0]
        
        # Create an entry
        entry = Entry(
            content="Coffee meeting with Alice",
            user_id=test_user.id,
            processing_status="completed"
        )
        session.add(entry)
        session.commit()
        session.refresh(entry)
        
        # Link entry to person
        from models import EntryPerson
        entry_person = EntryPerson(entry_id=entry.id, person_id=person.id)
        session.add(entry_person)
        session.commit()
        
        response = client.get(f"/api/people/{person.id}/entries")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["content"] == "Coffee meeting with Alice"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])