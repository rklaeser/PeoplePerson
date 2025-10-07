"""
Simple tests for people endpoints without authentication complexity.
These tests override the authentication dependency to test core functionality.
"""
import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, create_engine, SQLModel
from sqlmodel.pool import StaticPool
from datetime import datetime
from uuid import UUID, uuid4

from main import app
from database import get_db
from models import User, Person, Group, History, IntentChoices, ChangeTypeChoices, Tag, PersonTag
from routers.auth import get_current_user_id, get_current_user


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


@pytest.fixture(name="test_user")
def test_user_fixture(session: Session):
    """Create a test user"""
    user = User(
        firebase_uid="test_uid_123",
        name="Test User",
        email="test@example.com"
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@pytest.fixture(name="client")
def client_fixture(session: Session, test_user: User):
    """Create a test client with overridden dependencies"""
    def get_db_override():
        yield session
    
    def get_current_user_override():
        return test_user
    
    def get_current_user_id_override():
        return test_user.id
    
    app.dependency_overrides[get_db] = get_db_override
    app.dependency_overrides[get_current_user] = get_current_user_override
    app.dependency_overrides[get_current_user_id] = get_current_user_id_override
    
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


class TestPeopleBasicOperations:
    """Test basic CRUD operations for people"""
    
    def test_get_people_empty(self, client: TestClient):
        """Test getting people when none exist"""
        response = client.get("/api/people/")
        assert response.status_code == 200
        assert response.json() == []
    
    def test_create_person(self, client: TestClient):
        """Test creating a new person"""
        person_data = {
            "name": "Alice Johnson",
            "body": "Best friend from college",
            "intent": "core",
            "birthday": "1990-05-15",
            "mnemonic": "Always laughing",
            "zip": "10001",
            "profile_pic_index": 5
        }
        
        response = client.post("/api/people/", json=person_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["name"] == "Alice Johnson"
        assert data["body"] == "Best friend from college"
        assert data["intent"] == "core"
        assert "id" in data
        assert "user_id" in data
    
    def test_get_people_after_creation(self, client: TestClient, session: Session, test_user: User):
        """Test getting all people after creating some"""
        # Create test people directly in DB
        people = [
            Person(
                name="Alice Johnson",
                body="Friend",
                intent=IntentChoices.CORE,
                user_id=test_user.id
            ),
            Person(
                name="Bob Smith",
                body="Colleague",
                intent=IntentChoices.INVEST,
                user_id=test_user.id
            )
        ]
        for person in people:
            session.add(person)
        session.commit()
        
        response = client.get("/api/people/")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) == 2
        names = {p["name"] for p in data}
        assert names == {"Alice Johnson", "Bob Smith"}
    
    def test_get_person_by_id(self, client: TestClient, session: Session, test_user: User):
        """Test getting a specific person by ID"""
        person = Person(
            name="Charlie Davis",
            body="Old roommate",
            intent=IntentChoices.ARCHIVE,
            user_id=test_user.id
        )
        session.add(person)
        session.commit()
        session.refresh(person)
        
        response = client.get(f"/api/people/{person.id}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["name"] == "Charlie Davis"
        assert data["body"] == "Old roommate"
        assert data["intent"] == "archive"
    
    def test_update_person(self, client: TestClient, session: Session, test_user: User):
        """Test updating a person"""
        person = Person(
            name="Diana Prince",
            body="Gym friend",
            intent=IntentChoices.NEW,
            user_id=test_user.id
        )
        session.add(person)
        session.commit()
        session.refresh(person)
        
        update_data = {
            "body": "Gym friend who loves CrossFit",
            "intent": "develop"
        }
        
        response = client.patch(f"/api/people/{person.id}", json=update_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["body"] == "Gym friend who loves CrossFit"
        assert data["intent"] == "develop"
        assert data["name"] == "Diana Prince"  # Unchanged
    
    def test_delete_person(self, client: TestClient, session: Session, test_user: User):
        """Test deleting a person"""
        person = Person(
            name="Eve Adams",
            body="Neighbor",
            intent=IntentChoices.ASSOCIATE,
            user_id=test_user.id
        )
        session.add(person)
        session.commit()
        session.refresh(person)
        
        response = client.delete(f"/api/people/{person.id}")
        assert response.status_code == 204
        
        # Verify person is deleted
        response = client.get(f"/api/people/{person.id}")
        assert response.status_code == 404
    
    def test_search_people(self, client: TestClient, session: Session, test_user: User):
        """Test searching people by name"""
        people = [
            Person(name="Alice Johnson", body="Friend", user_id=test_user.id),
            Person(name="Bob Smith", body="Alice's husband", user_id=test_user.id),
            Person(name="Charlie Davis", body="Friend", user_id=test_user.id)
        ]
        for person in people:
            session.add(person)
        session.commit()
        
        # Search for "alice" in name or body
        response = client.get("/api/people/?search=alice")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) == 2  # Alice Johnson and Bob (has "Alice" in body)
    
    def test_pagination(self, client: TestClient, session: Session, test_user: User):
        """Test pagination of people list"""
        # Create 5 people
        for i in range(5):
            person = Person(
                name=f"Person {i}",
                body=f"Description {i}",
                user_id=test_user.id
            )
            session.add(person)
        session.commit()
        
        # Get first page
        response = client.get("/api/people/?limit=2&skip=0")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        
        # Get second page
        response = client.get("/api/people/?limit=2&skip=2")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        
        # Get third page (should have 1 item)
        response = client.get("/api/people/?limit=2&skip=4")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1


class TestPersonTags:
    """Test person-tag relationships"""
    
    def test_add_tag_to_person(self, client: TestClient, session: Session, test_user: User):
        """Test adding a tag to a person"""
        person = Person(name="Alice", body="Friend", user_id=test_user.id)
        session.add(person)
        session.commit()
        session.refresh(person)
        
        # Add tag to person (will create tag if it doesn't exist)
        response = client.post(
            f"/api/people/{person.id}/tags", 
            json={"name": "Close Friends", "category": "relationship", "color": "#ff0000"}
        )
        assert response.status_code == 200
        
        # Verify person has the tag
        response = client.get(f"/api/people/{person.id}/tags")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == "Close Friends"
        assert data[0]["category"] == "relationship"
        assert data[0]["color"] == "#ff0000"
    
    def test_remove_tag_from_person(self, client: TestClient, session: Session, test_user: User):
        """Test removing a tag from a person"""
        person = Person(name="Bob", body="Friend", user_id=test_user.id)
        tag = Tag(name="Work", category="relationship", user_id=test_user.id)
        session.add(person)
        session.add(tag)
        session.commit()
        session.refresh(person)
        session.refresh(tag)
        
        # Add person-tag association
        person_tag = PersonTag(person_id=person.id, tag_id=tag.id)
        session.add(person_tag)
        session.commit()
        
        # Remove tag from person
        response = client.delete(f"/api/people/{person.id}/tags/{tag.id}")
        assert response.status_code == 204
        
        # Verify person doesn't have the tag
        response = client.get(f"/api/people/{person.id}/tags")
        assert response.status_code == 200
        assert response.json() == []
    
    def test_get_people_by_tag(self, client: TestClient, session: Session, test_user: User):
        """Test getting all people with a specific tag"""
        # Create people and tag
        people = [
            Person(name="Alice", body="Friend", user_id=test_user.id),
            Person(name="Bob", body="Friend", user_id=test_user.id),
            Person(name="Charlie", body="Friend", user_id=test_user.id)
        ]
        tag = Tag(name="Close Friends", category="relationship", user_id=test_user.id)
        
        for person in people:
            session.add(person)
        session.add(tag)
        session.commit()
        
        for person in people:
            session.refresh(person)
        session.refresh(tag)
        
        # Tag first two people
        for person in people[:2]:
            person_tag = PersonTag(person_id=person.id, tag_id=tag.id)
            session.add(person_tag)
        session.commit()
        
        # Get people by tag
        response = client.get(f"/api/people/by-tag/{tag.id}")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        names = {p["name"] for p in data}
        assert names == {"Alice", "Bob"}
    
    def test_get_people_by_multiple_tags(self, client: TestClient, session: Session, test_user: User):
        """Test getting people by multiple tags"""
        # Create people and tags
        people = [
            Person(name="Alice", body="Friend", user_id=test_user.id),
            Person(name="Bob", body="Friend", user_id=test_user.id)
        ]
        tags = [
            Tag(name="Friends", category="relationship", user_id=test_user.id),
            Tag(name="NYC", category="location", user_id=test_user.id)
        ]
        
        for person in people:
            session.add(person)
        for tag in tags:
            session.add(tag)
        session.commit()
        
        for person in people:
            session.refresh(person)
        for tag in tags:
            session.refresh(tag)
        
        # Alice has both tags, Bob has only Friends tag
        PersonTag(person_id=people[0].id, tag_id=tags[0].id)  # Alice - Friends
        PersonTag(person_id=people[0].id, tag_id=tags[1].id)  # Alice - NYC
        PersonTag(person_id=people[1].id, tag_id=tags[0].id)  # Bob - Friends
        
        for pt in [
            PersonTag(person_id=people[0].id, tag_id=tags[0].id),
            PersonTag(person_id=people[0].id, tag_id=tags[1].id),
            PersonTag(person_id=people[1].id, tag_id=tags[0].id)
        ]:
            session.add(pt)
        session.commit()
        
        # Test OR logic (any tag)
        response = client.get("/api/people/by-tags/?tags=Friends,NYC&match_all=false")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2  # Both Alice and Bob
        
        # Test AND logic (all tags)
        response = client.get("/api/people/by-tags/?tags=Friends,NYC&match_all=true")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1  # Only Alice
        assert data[0]["name"] == "Alice"


class TestAccessControl:
    """Test that users can only access their own data"""
    
    def test_cannot_access_other_users_person(self, client: TestClient, session: Session, test_user: User):
        """Test that a user cannot access another user's person"""
        # Create another user and their person
        other_user = User(
            firebase_uid="other_uid",
            email="other@example.com"
        )
        session.add(other_user)
        session.commit()
        session.refresh(other_user)
        
        other_person = Person(
            name="Other Person",
            body="Not visible",
            user_id=other_user.id
        )
        session.add(other_person)
        session.commit()
        session.refresh(other_person)
        
        # Try to access with test_user's auth (should fail)
        response = client.get(f"/api/people/{other_person.id}")
        assert response.status_code == 404  # Should not be found
    
    def test_cannot_update_other_users_person(self, client: TestClient, session: Session, test_user: User):
        """Test that a user cannot update another user's person"""
        # Create another user and their person
        other_user = User(
            firebase_uid="other_uid",
            email="other@example.com"
        )
        session.add(other_user)
        session.commit()
        session.refresh(other_user)
        
        other_person = Person(
            name="Other Person",
            body="Original",
            user_id=other_user.id
        )
        session.add(other_person)
        session.commit()
        session.refresh(other_person)
        
        # Try to update with test_user's auth (should fail)
        response = client.patch(
            f"/api/people/{other_person.id}",
            json={"body": "Hacked!"}
        )
        assert response.status_code == 404  # Should not be found
        
        # Verify data wasn't changed
        session.refresh(other_person)
        assert other_person.body == "Original"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])