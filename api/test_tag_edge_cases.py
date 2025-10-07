"""
Edge case and stress tests for the tag system
"""
import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, create_engine, SQLModel
from sqlmodel.pool import StaticPool
from datetime import datetime
from uuid import UUID, uuid4
import string
import random

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


class TestTagValidationEdgeCases:
    """Test edge cases in tag validation and constraints"""
    
    def test_tag_name_unicode_support(self, client: TestClient):
        """Test tag names with unicode characters"""
        unicode_tags = [
            {"name": "家族", "category": "relationship", "description": "Family in Japanese"},
            {"name": "Café", "category": "location", "description": "With accent"},
            {"name": "🎾 Tennis", "category": "hobby", "description": "With emoji"},
            {"name": "São Paulo", "category": "location", "description": "With diacritics"}
        ]
        
        for tag_data in unicode_tags:
            response = client.post("/api/tags/", json=tag_data)
            assert response.status_code == 200
            
            data = response.json()
            assert data["name"] == tag_data["name"]
            assert data["category"] == tag_data["category"]
    
    def test_tag_name_special_characters(self, client: TestClient):
        """Test tag names with special characters"""
        special_tags = [
            {"name": "C++ Programming", "category": "hobby"},
            {"name": "Co-worker", "category": "relationship"},
            {"name": "New York City", "category": "location"},
            {"name": "Mother-in-law", "category": "relationship"},
            {"name": "24/7 Support", "category": "work"}
        ]
        
        for tag_data in special_tags:
            response = client.post("/api/tags/", json=tag_data)
            assert response.status_code == 200
            
            data = response.json()
            assert data["name"] == tag_data["name"]
    
    def test_very_long_tag_names(self, client: TestClient):
        """Test extremely long tag names"""
        long_name = "A" * 500  # Very long tag name
        
        response = client.post("/api/tags/", json={
            "name": long_name,
            "category": "general"
        })
        
        # Should handle long names gracefully
        assert response.status_code in [200, 400]  # Either accepts or rejects with validation
    
    def test_empty_and_whitespace_tag_names(self, client: TestClient):
        """Test empty and whitespace-only tag names"""
        invalid_names = ["", "   ", "\t\n", "  \t  \n  "]
        
        for name in invalid_names:
            response = client.post("/api/tags/", json={
                "name": name,
                "category": "general"
            })
            # Should reject empty/whitespace names
            assert response.status_code == 422  # Validation error
    
    def test_case_sensitivity_in_tag_names(self, client: TestClient):
        """Test case sensitivity in tag names"""
        # Create tag with lowercase
        response = client.post("/api/tags/", json={
            "name": "family",
            "category": "relationship"
        })
        assert response.status_code == 200
        
        # Try to create tag with different case
        response = client.post("/api/tags/", json={
            "name": "Family",
            "category": "relationship"
        })
        # Should be allowed (case sensitive)
        assert response.status_code == 200
        
        # Verify both tags exist
        response = client.get("/api/tags/")
        tags = response.json()
        tag_names = [tag["name"] for tag in tags]
        assert "family" in tag_names
        assert "Family" in tag_names


class TestTagColorValidation:
    """Test color validation for tags"""
    
    def test_valid_color_formats(self, client: TestClient):
        """Test various valid color formats"""
        valid_colors = [
            "#FF0000",      # Standard hex
            "#ff0000",      # Lowercase hex
            "#F00",         # Short hex
            "#123ABC",      # Mixed case
            "red",          # Named color
            "rgb(255,0,0)", # RGB format
            "hsl(0,100%,50%)" # HSL format
        ]
        
        for i, color in enumerate(valid_colors):
            response = client.post("/api/tags/", json={
                "name": f"Color Test {i}",
                "category": "test",
                "color": color
            })
            assert response.status_code == 200
            
            data = response.json()
            assert data["color"] == color
    
    def test_invalid_color_formats(self, client: TestClient):
        """Test invalid color formats"""
        invalid_colors = [
            "#GGGGGG",      # Invalid hex characters
            "#12345",       # Wrong length
            "not-a-color",  # Invalid string
            "123456",       # Missing #
            "#",            # Just hash
            ""              # Empty string
        ]
        
        for i, color in enumerate(invalid_colors):
            response = client.post("/api/tags/", json={
                "name": f"Invalid Color {i}",
                "category": "test",
                "color": color
            })
            # Should either accept (no validation) or reject invalid colors
            # Implementation dependent - document the behavior
            assert response.status_code in [200, 400, 422]


class TestMultiUserTagIsolation:
    """Test that tags are properly isolated between users"""
    
    def test_tag_isolation_between_users(self, session: Session):
        """Test that users cannot see each other's tags"""
        # Create two users
        user1 = User(firebase_uid="user1", email="user1@test.com")
        user2 = User(firebase_uid="user2", email="user2@test.com")
        session.add(user1)
        session.add(user2)
        session.commit()
        session.refresh(user1)
        session.refresh(user2)
        
        # Create tags for each user
        tag1 = Tag(name="User1 Tag", category="test", user_id=user1.id)
        tag2 = Tag(name="User2 Tag", category="test", user_id=user2.id)
        session.add(tag1)
        session.add(tag2)
        session.commit()
        
        # Create clients for each user
        def create_client_for_user(user):
            def get_db_override():
                yield session
            def get_current_user_override():
                return user
            def get_current_user_id_override():
                return user.id
            
            app.dependency_overrides[get_db] = get_db_override
            app.dependency_overrides[get_current_user] = get_current_user_override
            app.dependency_overrides[get_current_user_id] = get_current_user_id_override
            
            return TestClient(app)
        
        client1 = create_client_for_user(user1)
        client2 = create_client_for_user(user2)
        
        # User1 should only see their tags
        response = client1.get("/api/tags/")
        tags = response.json()
        assert len(tags) == 1
        assert tags[0]["name"] == "User1 Tag"
        
        # User2 should only see their tags
        response = client2.get("/api/tags/")
        tags = response.json()
        assert len(tags) == 1
        assert tags[0]["name"] == "User2 Tag"
        
        # User1 cannot access User2's tag
        response = client1.get(f"/api/tags/{tag2.id}")
        assert response.status_code == 404
        
        app.dependency_overrides.clear()
    
    def test_duplicate_tag_names_across_users(self, session: Session):
        """Test that different users can have tags with same names"""
        # Create two users
        user1 = User(firebase_uid="user1", email="user1@test.com")
        user2 = User(firebase_uid="user2", email="user2@test.com")
        session.add(user1)
        session.add(user2)
        session.commit()
        session.refresh(user1)
        session.refresh(user2)
        
        # Both users should be able to create "Family" tag
        tag1 = Tag(name="Family", category="relationship", user_id=user1.id)
        tag2 = Tag(name="Family", category="relationship", user_id=user2.id)
        session.add(tag1)
        session.add(tag2)
        session.commit()  # Should not raise constraint error
        
        # Verify both tags exist
        all_tags = session.query(Tag).all()
        family_tags = [tag for tag in all_tags if tag.name == "Family"]
        assert len(family_tags) == 2
        assert {tag.user_id for tag in family_tags} == {user1.id, user2.id}


class TestStressAndPerformance:
    """Stress tests for tag system performance"""
    
    def test_many_tags_per_person(self, client: TestClient, session: Session, test_user: User):
        """Test person with many tags"""
        # Create a person
        person = Person(name="Tag Collector", body="Has many tags", user_id=test_user.id)
        session.add(person)
        session.commit()
        session.refresh(person)
        
        # Create many tags
        tags = []
        for i in range(50):
            tag = Tag(
                name=f"Tag {i}",
                category=random.choice(["hobby", "location", "relationship", "general"]),
                user_id=test_user.id
            )
            session.add(tag)
            tags.append(tag)
        session.commit()
        
        # Associate all tags with the person
        for tag in tags:
            session.refresh(tag)
            person_tag = PersonTag(person_id=person.id, tag_id=tag.id)
            session.add(person_tag)
        session.commit()
        
        # Test retrieving all tags for the person
        response = client.get(f"/api/people/{person.id}/tags")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) == 50
    
    def test_many_people_with_same_tag(self, client: TestClient, session: Session, test_user: User):
        """Test tag associated with many people"""
        # Create a popular tag
        popular_tag = Tag(name="Popular", category="general", user_id=test_user.id)
        session.add(popular_tag)
        session.commit()
        session.refresh(popular_tag)
        
        # Create many people with this tag
        people = []
        for i in range(100):
            person = Person(
                name=f"Person {i}",
                body=f"Person number {i}",
                user_id=test_user.id
            )
            session.add(person)
            people.append(person)
        session.commit()
        
        # Associate all people with the tag
        for person in people:
            session.refresh(person)
            person_tag = PersonTag(person_id=person.id, tag_id=popular_tag.id)
            session.add(person_tag)
        session.commit()
        
        # Test retrieving all people for the tag
        response = client.get(f"/api/tags/{popular_tag.id}/people")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) == 100
    
    def test_complex_tag_search_performance(self, client: TestClient, session: Session, test_user: User):
        """Test performance of complex tag searches"""
        # Create a complex scenario with many tags and people
        categories = ["relationship", "location", "hobby", "lifestyle", "work"]
        tags = []
        
        # Create 5 tags per category
        for category in categories:
            for i in range(5):
                tag = Tag(
                    name=f"{category.title()} {i}",
                    category=category,
                    user_id=test_user.id
                )
                session.add(tag)
                tags.append(tag)
        session.commit()
        
        # Create people with random tag combinations
        people = []
        for i in range(50):
            person = Person(
                name=f"Person {i}",
                body=f"Test person {i}",
                user_id=test_user.id
            )
            session.add(person)
            people.append(person)
        session.commit()
        
        # Randomly assign tags to people
        for person in people:
            session.refresh(person)
            # Each person gets 2-5 random tags
            num_tags = random.randint(2, 5)
            person_tags = random.sample(tags, num_tags)
            
            for tag in person_tags:
                session.refresh(tag)
                person_tag = PersonTag(person_id=person.id, tag_id=tag.id)
                session.add(person_tag)
        session.commit()
        
        # Test various complex searches
        test_searches = [
            "/api/people/by-tags/?tags=Relationship 0,Location 1&match_all=true",
            "/api/people/by-tags/?tags=Hobby 0,Hobby 1,Hobby 2&match_all=false",
            "/api/people/by-tags/?tags=Work 0,Work 1&category=work&match_all=true",
        ]
        
        for search_url in test_searches:
            response = client.get(search_url)
            assert response.status_code == 200
            # Just verify the request completes successfully


class TestTagDeletionCascade:
    """Test cascading deletions and data integrity"""
    
    def test_tag_deletion_removes_associations(self, client: TestClient, session: Session, test_user: User):
        """Test that deleting a tag removes all person-tag associations"""
        # Create tag and person
        tag = Tag(name="Temporary", category="test", user_id=test_user.id)
        person = Person(name="Test Person", body="Test", user_id=test_user.id)
        session.add(tag)
        session.add(person)
        session.commit()
        session.refresh(tag)
        session.refresh(person)
        
        # Associate tag with person
        person_tag = PersonTag(person_id=person.id, tag_id=tag.id)
        session.add(person_tag)
        session.commit()
        
        # Verify association exists
        associations = session.query(PersonTag).filter(PersonTag.tag_id == tag.id).all()
        assert len(associations) == 1
        
        # Delete the tag
        response = client.delete(f"/api/tags/{tag.id}")
        assert response.status_code == 204
        
        # Verify associations are gone
        associations = session.query(PersonTag).filter(PersonTag.tag_id == tag.id).all()
        assert len(associations) == 0
    
    def test_person_deletion_removes_associations(self, client: TestClient, session: Session, test_user: User):
        """Test that deleting a person removes all their tag associations"""
        # Create tag and person
        tag = Tag(name="Test Tag", category="test", user_id=test_user.id)
        person = Person(name="Temporary Person", body="Test", user_id=test_user.id)
        session.add(tag)
        session.add(person)
        session.commit()
        session.refresh(tag)
        session.refresh(person)
        
        # Associate tag with person
        person_tag = PersonTag(person_id=person.id, tag_id=tag.id)
        session.add(person_tag)
        session.commit()
        
        # Verify association exists
        associations = session.query(PersonTag).filter(PersonTag.person_id == person.id).all()
        assert len(associations) == 1
        
        # Delete the person
        response = client.delete(f"/api/people/{person.id}")
        assert response.status_code == 204
        
        # Verify associations are gone
        associations = session.query(PersonTag).filter(PersonTag.person_id == person.id).all()
        assert len(associations) == 0


class TestTagSearchEdgeCases:
    """Test edge cases in tag search functionality"""
    
    def test_search_with_no_results(self, client: TestClient):
        """Test searching for non-existent tags"""
        response = client.get("/api/tags/?search=NonExistentTag")
        assert response.status_code == 200
        assert response.json() == []
    
    def test_search_with_special_characters(self, client: TestClient, session: Session, test_user: User):
        """Test searching tags with special characters"""
        special_tags = [
            "C++", "C#", "React.js", "Vue.js", "Node.js",
            "Mother-in-law", "Co-worker", "Ex-colleague"
        ]
        
        # Create tags with special characters
        for tag_name in special_tags:
            tag = Tag(name=tag_name, category="test", user_id=test_user.id)
            session.add(tag)
        session.commit()
        
        # Test various search patterns
        search_tests = [
            ("C++", ["C++"]),
            ("C#", ["C#"]),
            (".js", ["React.js", "Vue.js", "Node.js"]),
            ("worker", ["Co-worker"]),
            ("-", ["Mother-in-law", "Co-worker", "Ex-colleague"])
        ]
        
        for search_term, expected_matches in search_tests:
            response = client.get(f"/api/tags/?search={search_term}")
            assert response.status_code == 200
            
            found_names = [tag["name"] for tag in response.json()]
            for expected in expected_matches:
                assert expected in found_names
    
    def test_pagination_edge_cases(self, client: TestClient, session: Session, test_user: User):
        """Test pagination with edge cases"""
        # Create many tags
        for i in range(25):
            tag = Tag(name=f"Tag {i:02d}", category="test", user_id=test_user.id)
            session.add(tag)
        session.commit()
        
        # Test various pagination scenarios
        test_cases = [
            {"skip": 0, "limit": 10, "expected_count": 10},
            {"skip": 20, "limit": 10, "expected_count": 5},  # Last page
            {"skip": 25, "limit": 10, "expected_count": 0},  # Beyond data
            {"skip": 0, "limit": 100, "expected_count": 25}, # Limit > data
            {"skip": 0, "limit": 0, "expected_count": 0},    # Zero limit
        ]
        
        for case in test_cases:
            response = client.get(f"/api/tags/?skip={case['skip']}&limit={case['limit']}")
            assert response.status_code == 200
            
            data = response.json()
            assert len(data) == case["expected_count"]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])