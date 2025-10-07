"""
Comprehensive tests for all new tag system features
"""
import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, create_engine, SQLModel
from sqlmodel.pool import StaticPool
from datetime import datetime
from uuid import UUID, uuid4

from main import app
from database import get_db
from models import User, Person, Tag, PersonTag, IntentChoices
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


@pytest.fixture(name="sample_tags")
def sample_tags_fixture(session: Session, test_user: User):
    """Create a comprehensive set of sample tags across categories"""
    tags_data = [
        # Relationship tags
        {"name": "Family", "category": "relationship", "color": "#ff6b6b", "description": "Close family members"},
        {"name": "Close Friends", "category": "relationship", "color": "#4ecdc4", "description": "Best friends"},
        {"name": "Work Colleagues", "category": "relationship", "color": "#45b7d1", "description": "People from work"},
        {"name": "Acquaintances", "category": "relationship", "color": "#96ceb4", "description": "People I know casually"},
        
        # Location tags
        {"name": "NYC", "category": "location", "color": "#ffeaa7", "description": "Lives in New York City"},
        {"name": "San Francisco", "category": "location", "color": "#fab1a0", "description": "Lives in SF Bay Area"},
        {"name": "Remote", "category": "location", "color": "#e17055", "description": "Works remotely"},
        
        # Hobby tags
        {"name": "Tennis", "category": "hobby", "color": "#a29bfe", "description": "Plays tennis"},
        {"name": "Photography", "category": "hobby", "color": "#fd79a8", "description": "Photography enthusiast"},
        {"name": "Cooking", "category": "hobby", "color": "#fdcb6e", "description": "Loves to cook"},
        {"name": "Tech", "category": "hobby", "color": "#6c5ce7", "description": "Technology enthusiast"},
        
        # Lifestyle tags
        {"name": "Vegetarian", "category": "lifestyle", "color": "#00b894", "description": "Follows vegetarian diet"},
        {"name": "Dog Owner", "category": "lifestyle", "color": "#e84393", "description": "Owns a dog"},
        {"name": "Early Riser", "category": "lifestyle", "color": "#00cec9", "description": "Wakes up early"},
        
        # General tags
        {"name": "Important", "category": "general", "color": "#ff7675", "description": "Important contact"},
        {"name": "Mentor", "category": "general", "color": "#74b9ff", "description": "Provides guidance"}
    ]
    
    tags = []
    for tag_data in tags_data:
        tag = Tag(**tag_data, user_id=test_user.id)
        session.add(tag)
        tags.append(tag)
    
    session.commit()
    for tag in tags:
        session.refresh(tag)
    
    return tags


@pytest.fixture(name="sample_people")
def sample_people_fixture(session: Session, test_user: User, sample_tags: list[Tag]):
    """Create sample people with various tag combinations"""
    people_data = [
        {
            "name": "Alice Johnson",
            "body": "Software engineer and tennis enthusiast",
            "intent": IntentChoices.CORE,
            "tag_names": ["Close Friends", "NYC", "Tech", "Tennis", "Vegetarian"]
        },
        {
            "name": "Bob Chen",
            "body": "Product manager who loves cooking",
            "intent": IntentChoices.INVEST,
            "tag_names": ["Work Colleagues", "San Francisco", "Tech", "Cooking", "Dog Owner"]
        },
        {
            "name": "Carol Williams",
            "body": "My sister, lives remotely",
            "intent": IntentChoices.CORE,
            "tag_names": ["Family", "Remote", "Early Riser", "Important"]
        },
        {
            "name": "David Rodriguez",
            "body": "Former colleague, now mentor",
            "intent": IntentChoices.INVEST,
            "tag_names": ["Mentor", "Work Colleagues", "NYC", "Tech", "Important"]
        },
        {
            "name": "Emma Thompson",
            "body": "Met at photography workshop",
            "intent": IntentChoices.NEW,
            "tag_names": ["Acquaintances", "Photography", "Early Riser"]
        }
    ]
    
    people = []
    tag_lookup = {tag.name: tag for tag in sample_tags}
    
    for person_data in people_data:
        tag_names = person_data.pop("tag_names")
        person = Person(**person_data, user_id=test_user.id)
        session.add(person)
        session.commit()
        session.refresh(person)
        
        # Add tags to person
        for tag_name in tag_names:
            tag = tag_lookup[tag_name]
            person_tag = PersonTag(person_id=person.id, tag_id=tag.id)
            session.add(person_tag)
        
        people.append(person)
    
    session.commit()
    return people


class TestAdvancedTagFiltering:
    """Test advanced tag filtering capabilities"""
    
    def test_filter_people_by_single_tag(self, client: TestClient, sample_people: list[Person], sample_tags: list[Tag]):
        """Test filtering people by a single tag"""
        tech_tag = next(tag for tag in sample_tags if tag.name == "Tech")
        
        response = client.get(f"/api/people/by-tag/{tech_tag.id}")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) == 3  # Alice, Bob, David
        names = {person["name"] for person in data}
        assert names == {"Alice Johnson", "Bob Chen", "David Rodriguez"}
    
    def test_filter_people_by_multiple_tags_or_logic(self, client: TestClient, sample_people: list[Person]):
        """Test OR logic: people with ANY of the specified tags"""
        response = client.get("/api/people/by-tags/?tags=Family,Mentor&match_all=false")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) == 2  # Carol (Family) and David (Mentor)
        names = {person["name"] for person in data}
        assert names == {"Carol Williams", "David Rodriguez"}
    
    def test_filter_people_by_multiple_tags_and_logic(self, client: TestClient, sample_people: list[Person]):
        """Test AND logic: people with ALL specified tags"""
        response = client.get("/api/people/by-tags/?tags=NYC,Tech&match_all=true")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) == 2  # Alice and David (both in NYC and Tech)
        names = {person["name"] for person in data}
        assert names == {"Alice Johnson", "David Rodriguez"}
    
    def test_filter_people_by_category(self, client: TestClient, sample_people: list[Person]):
        """Test filtering people by tag category"""
        response = client.get("/api/people/by-tags/?tags=NYC,San Francisco&category=location&match_all=false")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) == 3  # Alice, Bob, David
        names = {person["name"] for person in data}
        assert names == {"Alice Johnson", "Bob Chen", "David Rodriguez"}
    
    def test_complex_tag_filtering(self, client: TestClient, sample_people: list[Person]):
        """Test complex filtering scenarios"""
        # Find tech people who are also early risers
        response = client.get("/api/people/by-tags/?tags=Tech,Early Riser&match_all=true")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) == 0  # No one has both Tech and Early Riser
        
        # Find people with lifestyle tags
        response = client.get("/api/people/by-tags/?tags=Vegetarian,Dog Owner,Early Riser&category=lifestyle&match_all=false")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) == 4  # Alice (Vegetarian), Bob (Dog Owner), Carol (Early Riser), Emma (Early Riser)


class TestTagSuggestions:
    """Test tag suggestion and autocomplete features"""
    
    def test_tag_suggestions_basic(self, client: TestClient, sample_tags: list[Tag]):
        """Test basic tag suggestions"""
        response = client.get("/api/tags/suggest/?query=Te")
        assert response.status_code == 200
        
        data = response.json()
        tag_names = [tag["name"] for tag in data]
        assert "Tennis" in tag_names
        assert "Tech" in tag_names
    
    def test_tag_suggestions_by_category(self, client: TestClient, sample_tags: list[Tag]):
        """Test tag suggestions filtered by category"""
        response = client.get("/api/tags/suggest/?query=Co&category=hobby")
        assert response.status_code == 200
        
        data = response.json()
        tag_names = [tag["name"] for tag in data]
        assert "Cooking" in tag_names
        assert len([name for name in tag_names if not name.startswith("C")]) == 0
    
    def test_tag_suggestions_limit(self, client: TestClient, sample_tags: list[Tag]):
        """Test tag suggestion limits"""
        response = client.get("/api/tags/suggest/?query=Te&limit=2")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) <= 2
    
    def test_tag_suggestions_minimum_query_length(self, client: TestClient):
        """Test minimum query length validation"""
        response = client.get("/api/tags/suggest/?query=a")
        assert response.status_code == 400
        assert "at least 2 characters" in response.json()["detail"]


class TestTagStatistics:
    """Test tag statistics and analytics"""
    
    def test_basic_tag_stats(self, client: TestClient, sample_people: list[Person], sample_tags: list[Tag]):
        """Test basic tag usage statistics"""
        response = client.get("/api/tags/stats/")
        assert response.status_code == 200
        
        data = response.json()
        assert data["total_tags"] == len(sample_tags)
        assert "categories" in data
        assert "popular_tags" in data
        
        # Check category counts
        expected_categories = {
            "relationship": 4,
            "location": 3, 
            "hobby": 4,
            "lifestyle": 3,
            "general": 2
        }
        assert data["categories"] == expected_categories
    
    def test_popular_tags_ranking(self, client: TestClient, sample_people: list[Person]):
        """Test popular tags are ranked correctly"""
        response = client.get("/api/tags/stats/")
        assert response.status_code == 200
        
        data = response.json()
        popular_tags = data["popular_tags"]
        
        # Find specific tags and verify their usage
        tech_tag = next(tag for tag in popular_tags if tag["name"] == "Tech")
        assert tech_tag["person_count"] == 3  # Alice, Bob, David
        
        important_tag = next(tag for tag in popular_tags if tag["name"] == "Important")
        assert important_tag["person_count"] == 2  # Carol, David
        
        # Verify tags are sorted by popularity (descending)
        counts = [tag["person_count"] for tag in popular_tags]
        assert counts == sorted(counts, reverse=True)
    
    def test_tag_categories_endpoint(self, client: TestClient, sample_tags: list[Tag]):
        """Test getting all tag categories"""
        response = client.get("/api/tags/categories/")
        assert response.status_code == 200
        
        categories = response.json()
        expected_categories = {"relationship", "location", "hobby", "lifestyle", "general"}
        assert set(categories) == expected_categories


class TestTagPersonAssociations:
    """Test tag-person association features"""
    
    def test_get_people_for_tag(self, client: TestClient, sample_people: list[Person], sample_tags: list[Tag]):
        """Test getting all people associated with a specific tag"""
        tech_tag = next(tag for tag in sample_tags if tag.name == "Tech")
        
        response = client.get(f"/api/tags/{tech_tag.id}/people")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) == 3
        names = {person["name"] for person in data}
        assert names == {"Alice Johnson", "Bob Chen", "David Rodriguez"}
    
    def test_get_tags_for_person(self, client: TestClient, sample_people: list[Person]):
        """Test getting all tags for a specific person"""
        alice = next(person for person in sample_people if person.name == "Alice Johnson")
        
        response = client.get(f"/api/people/{alice.id}/tags")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) == 5
        tag_names = {tag["name"] for tag in data}
        assert tag_names == {"Close Friends", "NYC", "Tech", "Tennis", "Vegetarian"}
    
    def test_add_existing_tag_to_person(self, client: TestClient, sample_people: list[Person], sample_tags: list[Tag]):
        """Test adding an existing tag to a person"""
        emma = next(person for person in sample_people if person.name == "Emma Thompson")
        cooking_tag = next(tag for tag in sample_tags if tag.name == "Cooking")
        
        # Emma doesn't have Cooking tag initially
        response = client.get(f"/api/people/{emma.id}/tags")
        initial_tags = response.json()
        tag_names = {tag["name"] for tag in initial_tags}
        assert "Cooking" not in tag_names
        
        # Add Cooking tag to Emma
        response = client.post(
            f"/api/people/{emma.id}/tags",
            json={"name": "Cooking", "category": "hobby"}
        )
        assert response.status_code == 200
        
        # Verify tag was added
        response = client.get(f"/api/people/{emma.id}/tags")
        updated_tags = response.json()
        tag_names = {tag["name"] for tag in updated_tags}
        assert "Cooking" in tag_names
        assert len(updated_tags) == len(initial_tags) + 1
    
    def test_add_new_tag_to_person(self, client: TestClient, sample_people: list[Person]):
        """Test adding a new tag to a person (auto-creation)"""
        alice = next(person for person in sample_people if person.name == "Alice Johnson")
        
        # Add a completely new tag
        response = client.post(
            f"/api/people/{alice.id}/tags",
            json={
                "name": "Rock Climbing", 
                "category": "hobby", 
                "color": "#e74c3c",
                "description": "Enjoys rock climbing"
            }
        )
        assert response.status_code == 200
        
        # Verify tag was created and added
        response = client.get(f"/api/people/{alice.id}/tags")
        tags = response.json()
        tag_names = {tag["name"] for tag in tags}
        assert "Rock Climbing" in tag_names
        
        # Verify the tag exists in the system
        response = client.get("/api/tags/?search=Rock Climbing")
        assert response.status_code == 200
        found_tags = response.json()
        assert len(found_tags) == 1
        assert found_tags[0]["name"] == "Rock Climbing"
        assert found_tags[0]["category"] == "hobby"
        assert found_tags[0]["color"] == "#e74c3c"
    
    def test_remove_tag_from_person(self, client: TestClient, sample_people: list[Person], sample_tags: list[Tag]):
        """Test removing a tag from a person"""
        alice = next(person for person in sample_people if person.name == "Alice Johnson")
        tennis_tag = next(tag for tag in sample_tags if tag.name == "Tennis")
        
        # Verify Alice has Tennis tag
        response = client.get(f"/api/people/{alice.id}/tags")
        initial_tags = response.json()
        tag_names = {tag["name"] for tag in initial_tags}
        assert "Tennis" in tag_names
        
        # Remove Tennis tag
        response = client.delete(f"/api/people/{alice.id}/tags/{tennis_tag.id}")
        assert response.status_code == 204
        
        # Verify tag was removed
        response = client.get(f"/api/people/{alice.id}/tags")
        updated_tags = response.json()
        tag_names = {tag["name"] for tag in updated_tags}
        assert "Tennis" not in tag_names
        assert len(updated_tags) == len(initial_tags) - 1


class TestTagErrorHandling:
    """Test error handling and edge cases"""
    
    def test_duplicate_tag_creation(self, client: TestClient, sample_tags: list[Tag]):
        """Test creating duplicate tags fails appropriately"""
        response = client.post(
            "/api/tags/",
            json={"name": "Family", "category": "relationship"}
        )
        assert response.status_code == 400
        assert "already exists" in response.json()["detail"]
    
    def test_access_nonexistent_tag(self, client: TestClient):
        """Test accessing non-existent tag returns 404"""
        fake_id = uuid4()
        response = client.get(f"/api/tags/{fake_id}")
        assert response.status_code == 404
    
    def test_add_tag_to_nonexistent_person(self, client: TestClient):
        """Test adding tag to non-existent person"""
        fake_id = uuid4()
        response = client.post(
            f"/api/people/{fake_id}/tags",
            json={"name": "Test Tag", "category": "general"}
        )
        assert response.status_code == 404
    
    def test_duplicate_person_tag_association(self, client: TestClient, sample_people: list[Person], sample_tags: list[Tag]):
        """Test adding the same tag twice to a person"""
        alice = next(person for person in sample_people if person.name == "Alice Johnson")
        
        # Alice already has "Tech" tag, try to add it again
        response = client.post(
            f"/api/people/{alice.id}/tags",
            json={"name": "Tech", "category": "hobby"}
        )
        assert response.status_code == 200
        assert "already has tag" in response.json()["message"]
    
    def test_remove_nonexistent_tag_association(self, client: TestClient, sample_people: list[Person], sample_tags: list[Tag]):
        """Test removing a tag that person doesn't have"""
        emma = next(person for person in sample_people if person.name == "Emma Thompson")
        tech_tag = next(tag for tag in sample_tags if tag.name == "Tech")
        
        # Emma doesn't have Tech tag, try to remove it
        response = client.delete(f"/api/people/{emma.id}/tags/{tech_tag.id}")
        assert response.status_code == 404
        assert "association not found" in response.json()["detail"].lower()
    
    def test_invalid_tag_search_parameters(self, client: TestClient):
        """Test various invalid search parameters"""
        # Empty tags parameter
        response = client.get("/api/people/by-tags/?tags=")
        assert response.status_code == 400
        
        # Non-existent category
        response = client.get("/api/people/by-tags/?tags=Test&category=nonexistent")
        assert response.status_code == 200
        assert response.json() == []  # No results for non-existent category
    
    def test_tag_name_validation(self, client: TestClient, sample_people: list[Person]):
        """Test tag name validation"""
        alice = next(person for person in sample_people if person.name == "Alice Johnson")
        
        # Missing tag name
        response = client.post(
            f"/api/people/{alice.id}/tags",
            json={"category": "general"}
        )
        assert response.status_code == 400
        assert "required" in response.json()["detail"].lower()


class TestTagPerformance:
    """Test performance-related tag operations"""
    
    def test_bulk_tag_operations(self, client: TestClient, session: Session, test_user: User):
        """Test performance with bulk tag operations"""
        # Create many people
        people = []
        for i in range(20):
            person = Person(
                name=f"Person {i}",
                body=f"Test person number {i}",
                user_id=test_user.id
            )
            session.add(person)
            people.append(person)
        session.commit()
        
        # Create a tag and associate with all people
        tag = Tag(name="Bulk Test", category="general", user_id=test_user.id)
        session.add(tag)
        session.commit()
        session.refresh(tag)
        
        # Add tag to all people
        for person in people:
            session.refresh(person)
            person_tag = PersonTag(person_id=person.id, tag_id=tag.id)
            session.add(person_tag)
        session.commit()
        
        # Test bulk retrieval
        response = client.get(f"/api/tags/{tag.id}/people")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) == 20
    
    def test_tag_search_with_many_results(self, client: TestClient, session: Session, test_user: User):
        """Test tag search with many matching results"""
        # Create many tags with similar names
        tags = []
        for i in range(15):
            tag = Tag(
                name=f"Test Tag {i}",
                category="general",
                user_id=test_user.id
            )
            session.add(tag)
            tags.append(tag)
        session.commit()
        
        # Search should find all matching tags
        response = client.get("/api/tags/?search=Test Tag")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) == 15
        
        # Test with limit
        response = client.get("/api/tags/?search=Test Tag&limit=5")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) == 5


if __name__ == "__main__":
    pytest.main([__file__, "-v"])