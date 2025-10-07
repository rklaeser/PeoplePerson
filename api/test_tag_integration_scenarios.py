"""
Integration tests for real-world tag usage scenarios
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


class TestRealWorldUsageScenarios:
    """Test realistic user workflows and scenarios"""
    
    def test_building_contact_network_scenario(self, client: TestClient, session: Session, test_user: User):
        """Test: User building their contact network with various relationship types"""
        
        # Scenario: User adding friends and colleagues with different relationships
        contacts = [
            {
                "person": {"name": "Sarah Chen", "body": "College roommate, now software engineer"},
                "tags": [
                    {"name": "College Friends", "category": "relationship", "color": "#4ecdc4"},
                    {"name": "Software Engineers", "category": "profession", "color": "#45b7d1"},
                    {"name": "San Francisco", "category": "location", "color": "#fab1a0"}
                ]
            },
            {
                "person": {"name": "Mike Johnson", "body": "Supervisor at current job"},
                "tags": [
                    {"name": "Work", "category": "relationship", "color": "#96ceb4"},
                    {"name": "Mentors", "category": "relationship", "color": "#74b9ff"},
                    {"name": "Seattle", "category": "location", "color": "#e17055"}
                ]
            },
            {
                "person": {"name": "Lisa Park", "body": "Tennis partner from local club"},
                "tags": [
                    {"name": "Tennis", "category": "hobby", "color": "#a29bfe"},
                    {"name": "Sports Buddies", "category": "relationship", "color": "#fd79a8"},
                    {"name": "Local", "category": "location", "color": "#fdcb6e"}
                ]
            }
        ]
        
        created_people = []
        
        for contact in contacts:
            # Create person
            response = client.post("/api/people/", json=contact["person"])
            assert response.status_code == 200
            person = response.json()
            created_people.append(person)
            
            # Add tags to person
            for tag_data in contact["tags"]:
                response = client.post(
                    f"/api/people/{person['id']}/tags",
                    json=tag_data
                )
                assert response.status_code == 200
        
        # Test: Find all software engineers
        response = client.get("/api/people/by-tags/?tags=Software Engineers")
        assert response.status_code == 200
        software_engineers = response.json()
        assert len(software_engineers) == 1
        assert software_engineers[0]["name"] == "Sarah Chen"
        
        # Test: Find people for tennis
        response = client.get("/api/people/by-tags/?tags=Tennis")
        assert response.status_code == 200
        tennis_players = response.json()
        assert len(tennis_players) == 1
        assert tennis_players[0]["name"] == "Lisa Park"
        
        # Test: Find all local contacts
        response = client.get("/api/people/by-tags/?tags=Local")
        assert response.status_code == 200
        local_contacts = response.json()
        assert len(local_contacts) == 1
        
        # Test: Get tag statistics to see network overview
        response = client.get("/api/tags/stats/")
        assert response.status_code == 200
        stats = response.json()
        
        # Should have tags across multiple categories
        assert "relationship" in stats["categories"]
        assert "profession" in stats["categories"]
        assert "location" in stats["categories"]
        assert "hobby" in stats["categories"]
    
    def test_event_planning_scenario(self, client: TestClient, session: Session, test_user: User):
        """Test: User planning an event and finding relevant contacts"""
        
        # Create a diverse group of people
        people_data = [
            {"name": "Alex Rivera", "body": "Chef and food blogger"},
            {"name": "Jamie Wong", "body": "Event photographer"},
            {"name": "Taylor Smith", "body": "DJ and music producer"},
            {"name": "Jordan Brown", "body": "Party planner"},
            {"name": "Casey Davis", "body": "Bartender at local pub"}
        ]
        
        people = []
        for person_data in people_data:
            response = client.post("/api/people/", json=person_data)
            assert response.status_code == 200
            people.append(response.json())
        
        # Tag people with relevant skills
        tagging_plan = [
            (people[0]["id"], [{"name": "Cooking", "category": "skill"}, {"name": "Food", "category": "interest"}]),
            (people[1]["id"], [{"name": "Photography", "category": "skill"}, {"name": "Events", "category": "interest"}]),
            (people[2]["id"], [{"name": "Music", "category": "skill"}, {"name": "DJ", "category": "profession"}]),
            (people[3]["id"], [{"name": "Event Planning", "category": "skill"}, {"name": "Organizing", "category": "skill"}]),
            (people[4]["id"], [{"name": "Bartending", "category": "skill"}, {"name": "Drinks", "category": "interest"}])
        ]
        
        for person_id, tags in tagging_plan:
            for tag_data in tags:
                response = client.post(f"/api/people/{person_id}/tags", json=tag_data)
                assert response.status_code == 200
        
        # Event planning queries
        # Find people with event-related skills
        response = client.get("/api/people/by-tags/?tags=Photography,Music,Event Planning,Bartending&category=skill&match_all=false")
        assert response.status_code == 200
        event_helpers = response.json()
        assert len(event_helpers) == 4  # All except Alex (who has Cooking skill)
        
        # Find food-related contacts
        response = client.get("/api/people/by-tags/?tags=Cooking,Food&match_all=false")
        assert response.status_code == 200
        food_contacts = response.json()
        assert len(food_contacts) == 1
        assert food_contacts[0]["name"] == "Alex Rivera"
        
        # Find people with multiple relevant skills
        response = client.get("/api/people/by-tags/?tags=Photography,Events&match_all=true")
        assert response.status_code == 200
        photo_event_people = response.json()
        assert len(photo_event_people) == 1
        assert photo_event_people[0]["name"] == "Jamie Wong"
    
    def test_job_networking_scenario(self, client: TestClient, session: Session, test_user: User):
        """Test: Professional networking and job search scenario"""
        
        # Create professional contacts
        contacts = [
            {
                "person": {"name": "Dr. Emily Watson", "body": "Senior Data Scientist at Google"},
                "tags": [
                    {"name": "Data Science", "category": "field"},
                    {"name": "Google", "category": "company"},
                    {"name": "Senior Level", "category": "level"},
                    {"name": "Machine Learning", "category": "skill"},
                    {"name": "Mentor", "category": "relationship"}
                ]
            },
            {
                "person": {"name": "Mark Thompson", "body": "Engineering Manager at Microsoft"},
                "tags": [
                    {"name": "Engineering Management", "category": "field"},
                    {"name": "Microsoft", "category": "company"},
                    {"name": "Management", "category": "level"},
                    {"name": "Leadership", "category": "skill"},
                    {"name": "Former Colleague", "category": "relationship"}
                ]
            },
            {
                "person": {"name": "Anna Kim", "body": "Product Manager at startup"},
                "tags": [
                    {"name": "Product Management", "category": "field"},
                    {"name": "Startup", "category": "company"},
                    {"name": "Mid Level", "category": "level"},
                    {"name": "Strategy", "category": "skill"},
                    {"name": "College Friend", "category": "relationship"}
                ]
            }
        ]
        
        for contact in contacts:
            # Create person
            response = client.post("/api/people/", json=contact["person"])
            assert response.status_code == 200
            person = response.json()
            
            # Add professional tags
            for tag_data in contact["tags"]:
                response = client.post(f"/api/people/{person['id']}/tags", json=tag_data)
                assert response.status_code == 200
        
        # Professional networking queries
        # Find people in tech companies
        response = client.get("/api/people/by-tags/?tags=Google,Microsoft&category=company&match_all=false")
        assert response.status_code == 200
        big_tech_contacts = response.json()
        assert len(big_tech_contacts) == 2
        
        # Find senior-level contacts for mentorship
        response = client.get("/api/people/by-tags/?tags=Senior Level,Management&category=level&match_all=false")
        assert response.status_code == 200
        senior_contacts = response.json()
        assert len(senior_contacts) == 2
        
        # Find people with specific skills
        response = client.get("/api/people/by-tags/?tags=Machine Learning,Leadership&category=skill&match_all=false")
        assert response.status_code == 200
        skilled_contacts = response.json()
        assert len(skilled_contacts) == 2
        
        # Get networking insights
        response = client.get("/api/tags/stats/")
        assert response.status_code == 200
        stats = response.json()
        assert "field" in stats["categories"]
        assert "company" in stats["categories"]
        assert "level" in stats["categories"]
    
    def test_personal_life_organization_scenario(self, client: TestClient, session: Session, test_user: User):
        """Test: Organizing personal relationships and social activities"""
        
        # Create personal contacts with lifestyle information
        personal_contacts = [
            {
                "person": {"name": "Rachel Green", "body": "Yoga instructor, health enthusiast"},
                "tags": [
                    {"name": "Close Friends", "category": "relationship"},
                    {"name": "Yoga", "category": "activity"},
                    {"name": "Health Focused", "category": "lifestyle"},
                    {"name": "Vegetarian", "category": "diet"},
                    {"name": "Morning Person", "category": "schedule"}
                ]
            },
            {
                "person": {"name": "Tom Wilson", "body": "Rock climbing partner"},
                "tags": [
                    {"name": "Adventure Buddies", "category": "relationship"},
                    {"name": "Rock Climbing", "category": "activity"},
                    {"name": "Outdoorsy", "category": "lifestyle"},
                    {"name": "Weekend Warrior", "category": "schedule"},
                    {"name": "Vegan", "category": "diet"}
                ]
            },
            {
                "person": {"name": "Sophie Martin", "body": "Book club friend"},
                "tags": [
                    {"name": "Book Club", "category": "activity"},
                    {"name": "Intellectual", "category": "lifestyle"},
                    {"name": "Evening Person", "category": "schedule"},
                    {"name": "Coffee Lover", "category": "interest"}
                ]
            }
        ]
        
        for contact in personal_contacts:
            # Create person
            response = client.post("/api/people/", json=contact["person"])
            assert response.status_code == 200
            person = response.json()
            
            # Add lifestyle tags
            for tag_data in contact["tags"]:
                response = client.post(f"/api/people/{person['id']}/tags", json=tag_data)
                assert response.status_code == 200
        
        # Lifestyle organization queries
        # Find morning activity partners
        response = client.get("/api/people/by-tags/?tags=Morning Person&category=schedule")
        assert response.status_code == 200
        morning_people = response.json()
        assert len(morning_people) == 1
        assert morning_people[0]["name"] == "Rachel Green"
        
        # Find vegetarian/vegan friends for restaurant planning
        response = client.get("/api/people/by-tags/?tags=Vegetarian,Vegan&category=diet&match_all=false")
        assert response.status_code == 200
        plant_based_friends = response.json()
        assert len(plant_based_friends) == 2
        
        # Find active lifestyle friends
        response = client.get("/api/people/by-tags/?tags=Health Focused,Outdoorsy&category=lifestyle&match_all=false")
        assert response.status_code == 200
        active_friends = response.json()
        assert len(active_friends) == 2
        
        # Find activity-specific partners
        response = client.get("/api/people/by-tags/?tags=Yoga,Rock Climbing&category=activity&match_all=false")
        assert response.status_code == 200
        activity_partners = response.json()
        assert len(activity_partners) == 2


class TestWorkflowIntegration:
    """Test complete workflows from start to finish"""
    
    def test_complete_person_tagging_workflow(self, client: TestClient):
        """Test the complete workflow of adding and managing a person with tags"""
        
        # Step 1: Create a new person
        person_data = {
            "name": "Jessica Adams",
            "body": "Met at tech conference, works in AI/ML",
            "intent": "develop"
        }
        
        response = client.post("/api/people/", json=person_data)
        assert response.status_code == 200
        person = response.json()
        person_id = person["id"]
        
        # Step 2: Add initial tags
        initial_tags = [
            {"name": "AI/ML", "category": "field", "color": "#6c5ce7"},
            {"name": "Tech Conferences", "category": "context", "color": "#a29bfe"},
            {"name": "Potential Collaborator", "category": "relationship", "color": "#fd79a8"}
        ]
        
        for tag_data in initial_tags:
            response = client.post(f"/api/people/{person_id}/tags", json=tag_data)
            assert response.status_code == 200
        
        # Step 3: Verify tags were added
        response = client.get(f"/api/people/{person_id}/tags")
        assert response.status_code == 200
        tags = response.json()
        assert len(tags) == 3
        tag_names = {tag["name"] for tag in tags}
        assert tag_names == {"AI/ML", "Tech Conferences", "Potential Collaborator"}
        
        # Step 4: Update person with more information
        update_data = {
            "body": "Met at tech conference, works in AI/ML at Stanford. Interested in collaboration on NLP projects."
        }
        response = client.patch(f"/api/people/{person_id}", json=update_data)
        assert response.status_code == 200
        
        # Step 5: Add more specific tags after learning more
        additional_tags = [
            {"name": "Stanford", "category": "affiliation", "color": "#e17055"},
            {"name": "NLP", "category": "specialization", "color": "#00b894"},
            {"name": "Research", "category": "interest", "color": "#00cec9"}
        ]
        
        for tag_data in additional_tags:
            response = client.post(f"/api/people/{person_id}/tags", json=tag_data)
            assert response.status_code == 200
        
        # Step 6: Use tags to find similar people (if any existed)
        response = client.get("/api/people/by-tags/?tags=AI/ML,Research&match_all=true")
        assert response.status_code == 200
        similar_people = response.json()
        assert len(similar_people) == 1
        assert similar_people[0]["name"] == "Jessica Adams"
        
        # Step 7: Get tag suggestions for future use
        response = client.get("/api/tags/suggest/?query=AI")
        assert response.status_code == 200
        suggestions = response.json()
        suggestion_names = [tag["name"] for tag in suggestions]
        assert "AI/ML" in suggestion_names
        
        # Step 8: Generate statistics
        response = client.get("/api/tags/stats/")
        assert response.status_code == 200
        stats = response.json()
        assert stats["total_tags"] == 6  # All unique tags created
        
        # Step 9: Remove a tag that's no longer relevant
        ai_ml_tag = next(tag for tag in tags if tag["name"] == "AI/ML")
        response = client.delete(f"/api/people/{person_id}/tags/{ai_ml_tag['id']}")
        assert response.status_code == 204
        
        # Step 10: Verify tag removal
        response = client.get(f"/api/people/{person_id}/tags")
        assert response.status_code == 200
        final_tags = response.json()
        final_tag_names = {tag["name"] for tag in final_tags}
        assert "AI/ML" not in final_tag_names
        assert len(final_tags) == 5  # One tag removed
    
    def test_tag_maintenance_workflow(self, client: TestClient, session: Session, test_user: User):
        """Test maintaining and organizing tags over time"""
        
        # Create some initial tags and people
        setup_data = [
            {"tag": {"name": "Work", "category": "relationship"}, "people": ["John Doe", "Jane Smith"]},
            {"tag": {"name": "Family", "category": "relationship"}, "people": ["Mom", "Dad", "Sister"]},
            {"tag": {"name": "Hobbies", "category": "interest"}, "people": ["Tennis Partner", "Book Club Friend"]}
        ]
        
        created_tags = {}
        created_people = {}
        
        for item in setup_data:
            # Create tag
            response = client.post("/api/tags/", json=item["tag"])
            assert response.status_code == 200
            tag = response.json()
            created_tags[tag["name"]] = tag
            
            # Create people and associate with tag
            for person_name in item["people"]:
                person_data = {"name": person_name, "body": f"Description for {person_name}"}
                response = client.post("/api/people/", json=person_data)
                assert response.status_code == 200
                person = response.json()
                created_people[person_name] = person
                
                # Associate person with tag
                response = client.post(
                    f"/api/people/{person['id']}/tags",
                    json={"name": tag["name"], "category": tag["category"]}
                )
                assert response.status_code == 200
        
        # Tag maintenance operations
        
        # 1. Update tag description
        work_tag = created_tags["Work"]
        response = client.patch(
            f"/api/tags/{work_tag['id']}",
            json={"description": "Professional contacts and colleagues"}
        )
        assert response.status_code == 200
        
        # 2. Check tag usage statistics
        response = client.get("/api/tags/stats/")
        assert response.status_code == 200
        stats = response.json()
        
        # Find most used tags
        popular_tags = stats["popular_tags"]
        family_usage = next(tag for tag in popular_tags if tag["name"] == "Family")
        assert family_usage["person_count"] == 3  # Mom, Dad, Sister
        
        # 3. Reorganize by creating more specific tags
        # Split "Family" into more specific categories
        specific_family_tags = [
            {"name": "Parents", "category": "family", "color": "#ff6b6b"},
            {"name": "Siblings", "category": "family", "color": "#4ecdc4"}
        ]
        
        for tag_data in specific_family_tags:
            response = client.post("/api/tags/", json=tag_data)
            assert response.status_code == 200
        
        # Move people to more specific tags
        parents = ["Mom", "Dad"]
        siblings = ["Sister"]
        
        for parent_name in parents:
            person = created_people[parent_name]
            response = client.post(
                f"/api/people/{person['id']}/tags",
                json={"name": "Parents", "category": "family"}
            )
            assert response.status_code == 200
        
        for sibling_name in siblings:
            person = created_people[sibling_name]
            response = client.post(
                f"/api/people/{person['id']}/tags",
                json={"name": "Siblings", "category": "family"}
            )
            assert response.status_code == 200
        
        # 4. Verify the reorganization
        response = client.get("/api/people/by-tags/?tags=Parents&category=family")
        assert response.status_code == 200
        parents_contacts = response.json()
        assert len(parents_contacts) == 2
        
        response = client.get("/api/people/by-tags/?tags=Siblings&category=family")
        assert response.status_code == 200
        siblings_contacts = response.json()
        assert len(siblings_contacts) == 1


if __name__ == "__main__":
    pytest.main([__file__, "-v"])