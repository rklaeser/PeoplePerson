"""
Tests for tag-related endpoints
"""
import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, create_engine, SQLModel
from sqlmodel.pool import StaticPool
from datetime import datetime
from uuid import UUID, uuid4

from main import app
from database import get_db
from models import User, Person, Tag, PersonTag
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


@pytest.fixture(name="test_tags")
def test_tags_fixture(session: Session, test_user: User):
    """Create test tags"""
    tags = [
        Tag(name="Family", category="relationship", color="#ff0000", user_id=test_user.id),
        Tag(name="Work", category="relationship", color="#00ff00", user_id=test_user.id),
        Tag(name="NYC", category="location", color="#0000ff", user_id=test_user.id),
        Tag(name="Tennis", category="hobby", user_id=test_user.id),
        Tag(name="Important", category="general", user_id=test_user.id)
    ]
    for tag in tags:
        session.add(tag)
    session.commit()
    for tag in tags:
        session.refresh(tag)
    return tags


class TestTagCRUD:
    """Test basic CRUD operations for tags"""
    
    def test_get_tags_empty(self, client: TestClient):
        """Test getting tags when none exist"""
        response = client.get("/api/tags/")
        assert response.status_code == 200
        assert response.json() == []
    
    def test_create_tag(self, client: TestClient):
        """Test creating a new tag"""
        tag_data = {
            "name": "Close Friends",
            "category": "relationship",
            "color": "#ff6b6b",
            "description": "People I'm very close to"
        }
        
        response = client.post("/api/tags/", json=tag_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["name"] == "Close Friends"
        assert data["category"] == "relationship"
        assert data["color"] == "#ff6b6b"
        assert data["description"] == "People I'm very close to"
        assert "id" in data
        assert "user_id" in data
    
    def test_create_duplicate_tag(self, client: TestClient):
        """Test creating a duplicate tag fails"""
        tag_data = {
            "name": "Friends",
            "category": "relationship"
        }
        
        # Create first tag
        response = client.post("/api/tags/", json=tag_data)
        assert response.status_code == 200
        
        # Try to create duplicate
        response = client.post("/api/tags/", json=tag_data)
        assert response.status_code == 400
        assert "already exists" in response.json()["detail"]
    
    def test_get_all_tags(self, client: TestClient, test_tags: list[Tag]):
        """Test getting all tags"""
        response = client.get("/api/tags/")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) == 5
        tag_names = {tag["name"] for tag in data}
        assert tag_names == {"Family", "Work", "NYC", "Tennis", "Important"}
    
    def test_get_tag_by_id(self, client: TestClient, test_tags: list[Tag]):
        """Test getting a specific tag by ID"""
        tag = test_tags[0]
        response = client.get(f"/api/tags/{tag.id}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["name"] == "Family"
        assert data["category"] == "relationship"
        assert data["color"] == "#ff0000"
    
    def test_update_tag(self, client: TestClient, test_tags: list[Tag]):
        """Test updating a tag"""
        tag = test_tags[0]
        update_data = {
            "description": "Close family members",
            "color": "#ff3333"
        }
        
        response = client.patch(f"/api/tags/{tag.id}", json=update_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["description"] == "Close family members"
        assert data["color"] == "#ff3333"
        assert data["name"] == "Family"  # Unchanged
    
    def test_delete_tag(self, client: TestClient, test_tags: list[Tag]):
        """Test deleting a tag"""
        tag = test_tags[0]
        response = client.delete(f"/api/tags/{tag.id}")
        assert response.status_code == 204
        
        # Verify tag is deleted
        response = client.get(f"/api/tags/{tag.id}")
        assert response.status_code == 404


class TestTagFiltering:
    """Test tag filtering and search functionality"""
    
    def test_filter_by_category(self, client: TestClient, test_tags: list[Tag]):
        """Test filtering tags by category"""
        response = client.get("/api/tags/?category=relationship")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) == 2
        tag_names = {tag["name"] for tag in data}
        assert tag_names == {"Family", "Work"}
    
    def test_search_tags(self, client: TestClient, test_tags: list[Tag]):
        """Test searching tags by name"""
        response = client.get("/api/tags/?search=ork")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == "Work"
    
    def test_tag_suggestions(self, client: TestClient, test_tags: list[Tag]):
        """Test tag suggestion endpoint"""
        response = client.get("/api/tags/suggest/?query=Fa")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == "Family"
    
    def test_tag_suggestions_by_category(self, client: TestClient, test_tags: list[Tag]):
        """Test tag suggestions filtered by category"""
        response = client.get("/api/tags/suggest/?query=o&category=location")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) == 0  # No location tags contain 'o'
        
        response = client.get("/api/tags/suggest/?query=o&category=relationship")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == "Work"


class TestTagCategories:
    """Test tag category functionality"""
    
    def test_get_categories(self, client: TestClient, test_tags: list[Tag]):
        """Test getting all tag categories"""
        response = client.get("/api/tags/categories/")
        assert response.status_code == 200
        
        categories = response.json()
        assert set(categories) == {"relationship", "location", "hobby", "general"}


class TestTagStats:
    """Test tag statistics endpoint"""
    
    def test_tag_stats(self, client: TestClient, session: Session, test_user: User, test_tags: list[Tag]):
        """Test getting tag usage statistics"""
        # Create some people and tag associations
        people = [
            Person(name="Alice", body="Friend", user_id=test_user.id),
            Person(name="Bob", body="Friend", user_id=test_user.id)
        ]
        for person in people:
            session.add(person)
        session.commit()
        for person in people:
            session.refresh(person)
        
        # Create associations
        associations = [
            PersonTag(person_id=people[0].id, tag_id=test_tags[0].id),  # Alice - Family
            PersonTag(person_id=people[1].id, tag_id=test_tags[0].id),  # Bob - Family
            PersonTag(person_id=people[0].id, tag_id=test_tags[1].id),  # Alice - Work
        ]
        for assoc in associations:
            session.add(assoc)
        session.commit()
        
        response = client.get("/api/tags/stats/")
        assert response.status_code == 200
        
        data = response.json()
        assert data["total_tags"] == 5
        assert data["categories"]["relationship"] == 2
        assert data["categories"]["location"] == 1
        assert data["categories"]["hobby"] == 1
        assert data["categories"]["general"] == 1
        
        # Check popular tags
        popular_tags = data["popular_tags"]
        assert len(popular_tags) >= 2
        # Family should be most popular (2 people)
        family_tag = next(tag for tag in popular_tags if tag["name"] == "Family")
        assert family_tag["person_count"] == 2


class TestTagPeopleAssociations:
    """Test tag-people association endpoints"""
    
    def test_get_tag_people(self, client: TestClient, session: Session, test_user: User, test_tags: list[Tag]):
        """Test getting all people with a specific tag"""
        # Create people
        people = [
            Person(name="Alice", body="Friend", user_id=test_user.id),
            Person(name="Bob", body="Friend", user_id=test_user.id),
            Person(name="Charlie", body="Friend", user_id=test_user.id)
        ]
        for person in people:
            session.add(person)
        session.commit()
        for person in people:
            session.refresh(person)
        
        # Tag first two people with "Family" tag
        family_tag = test_tags[0]  # Family tag
        for person in people[:2]:
            assoc = PersonTag(person_id=person.id, tag_id=family_tag.id)
            session.add(assoc)
        session.commit()
        
        response = client.get(f"/api/tags/{family_tag.id}/people")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) == 2
        names = {person["name"] for person in data}
        assert names == {"Alice", "Bob"}


class TestTagAccessControl:
    """Test that users can only access their own tags"""
    
    def test_cannot_access_other_users_tags(self, client: TestClient, session: Session, test_user: User):
        """Test that users cannot access other users' tags"""
        # Create another user and their tag
        other_user = User(
            firebase_uid="other_uid",
            email="other@example.com"
        )
        session.add(other_user)
        session.commit()
        session.refresh(other_user)
        
        other_tag = Tag(
            name="Secret Tag",
            category="private",
            user_id=other_user.id
        )
        session.add(other_tag)
        session.commit()
        session.refresh(other_tag)
        
        # Try to access other user's tag (should fail)
        response = client.get(f"/api/tags/{other_tag.id}")
        assert response.status_code == 404
    
    def test_cannot_modify_other_users_tags(self, client: TestClient, session: Session, test_user: User):
        """Test that users cannot modify other users' tags"""
        # Create another user and their tag
        other_user = User(
            firebase_uid="other_uid",
            email="other@example.com"
        )
        session.add(other_user)
        session.commit()
        session.refresh(other_user)
        
        other_tag = Tag(
            name="Secret Tag",
            category="private",
            user_id=other_user.id
        )
        session.add(other_tag)
        session.commit()
        session.refresh(other_tag)
        
        # Try to update other user's tag (should fail)
        response = client.patch(
            f"/api/tags/{other_tag.id}",
            json={"name": "Hacked Tag"}
        )
        assert response.status_code == 404
        
        # Verify tag wasn't changed
        session.refresh(other_tag)
        assert other_tag.name == "Secret Tag"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])