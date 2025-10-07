import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, create_engine, SQLModel
from sqlmodel.pool import StaticPool
from datetime import datetime, timedelta
from uuid import uuid4
from unittest.mock import patch, MagicMock
import jwt

from main import app
from database import get_db
from models import User
# Note: These imports may need adjustment based on actual implementation
# from routers.auth import verify_firebase_token, get_current_user


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


@pytest.fixture(name="mock_firebase_token")
def mock_firebase_token_fixture():
    """Mock a valid Firebase ID token"""
    return {
        "uid": "firebase_test_uid_123",
        "email": "test@example.com",
        "email_verified": True,
        "name": "Test User",
        "picture": "https://example.com/photo.jpg",
        "iat": datetime.utcnow().timestamp(),
        "exp": (datetime.utcnow() + timedelta(hours=1)).timestamp()
    }


@pytest.fixture(name="auth_headers")
def auth_headers_fixture(mock_firebase_token):
    """Create authorization headers with mock token"""
    token = jwt.encode(mock_firebase_token, "secret", algorithm="HS256")
    return {"Authorization": f"Bearer {token}"}


class TestAuthenticationFlow:
    """Test cases for authentication flow"""
    
    @patch('routers.auth.firebase_admin.auth.verify_id_token')
    def test_login_new_user(self, mock_verify, client: TestClient, session: Session, mock_firebase_token):
        """Test login/registration for a new user"""
        mock_verify.return_value = mock_firebase_token
        
        response = client.post(
            "/api/auth/login",
            headers={"Authorization": f"Bearer fake_token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["firebase_uid"] == "firebase_test_uid_123"
        assert data["email"] == "test@example.com"
        assert data["name"] == "Test User"
        assert "id" in data
        
        # Verify user was created in database
        user = session.query(User).filter(User.firebase_uid == "firebase_test_uid_123").first()
        assert user is not None
        assert user.email == "test@example.com"
    
    @patch('routers.auth.firebase_admin.auth.verify_id_token')
    def test_login_existing_user(self, mock_verify, client: TestClient, session: Session, mock_firebase_token):
        """Test login for an existing user"""
        # Create existing user
        existing_user = User(
            firebase_uid="firebase_test_uid_123",
            email="old@example.com",
            name="Old Name"
        )
        session.add(existing_user)
        session.commit()
        
        mock_verify.return_value = mock_firebase_token
        
        response = client.post(
            "/api/auth/login",
            headers={"Authorization": f"Bearer fake_token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        # Should update with new data from token
        assert data["email"] == "test@example.com"
        assert data["name"] == "Test User"
    
    def test_login_without_token(self, client: TestClient):
        """Test login without authorization header"""
        response = client.post("/api/auth/login")
        
        assert response.status_code == 401
        assert response.json()["detail"] == "Authorization header missing"
    
    def test_login_invalid_token_format(self, client: TestClient):
        """Test login with invalid token format"""
        response = client.post(
            "/api/auth/login",
            headers={"Authorization": "InvalidFormat"}
        )
        
        assert response.status_code == 401
        assert response.json()["detail"] == "Invalid authorization header format"
    
    @patch('routers.auth.firebase_admin.auth.verify_id_token')
    def test_login_expired_token(self, mock_verify, client: TestClient):
        """Test login with expired Firebase token"""
        mock_verify.side_effect = Exception("Token expired")
        
        response = client.post(
            "/api/auth/login",
            headers={"Authorization": "Bearer expired_token"}
        )
        
        assert response.status_code == 401
        assert "Invalid token" in response.json()["detail"]


class TestProtectedEndpoints:
    """Test cases for protected endpoint access"""
    
    @patch('routers.auth.get_current_user')
    def test_access_protected_endpoint_authenticated(self, mock_get_user, client: TestClient, session: Session):
        """Test accessing protected endpoint with valid authentication"""
        # Create and mock authenticated user
        user = User(
            firebase_uid="test_uid",
            email="test@example.com",
            name="Test User"
        )
        session.add(user)
        session.commit()
        session.refresh(user)
        
        mock_get_user.return_value = user
        
        response = client.get("/api/auth/me")
        
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "test@example.com"
        assert data["firebase_uid"] == "test_uid"
    
    def test_access_protected_endpoint_unauthenticated(self, client: TestClient):
        """Test accessing protected endpoint without authentication"""
        response = client.get("/api/auth/me")
        
        assert response.status_code == 401
        assert response.json()["detail"] == "Authorization header missing"
    
    @patch('routers.auth.firebase_admin.auth.verify_id_token')
    def test_access_with_invalid_user(self, mock_verify, client: TestClient, mock_firebase_token):
        """Test accessing protected endpoint when user doesn't exist in DB"""
        mock_verify.return_value = mock_firebase_token
        
        response = client.get(
            "/api/auth/me",
            headers={"Authorization": "Bearer fake_token"}
        )
        
        assert response.status_code == 401
        assert response.json()["detail"] == "User not found"


class TestUserManagement:
    """Test cases for user management operations"""
    
    @patch('routers.auth.get_current_user')
    def test_update_user_profile(self, mock_get_user, client: TestClient, session: Session):
        """Test updating user profile"""
        user = User(
            firebase_uid="test_uid",
            email="test@example.com",
            name="Test User"
        )
        session.add(user)
        session.commit()
        session.refresh(user)
        
        mock_get_user.return_value = user
        
        update_data = {
            "name": "Updated Name",
            "image": "https://example.com/new-photo.jpg"
        }
        
        response = client.patch("/api/auth/me", json=update_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Name"
        assert data["image"] == "https://example.com/new-photo.jpg"
        assert data["email"] == "test@example.com"  # Unchanged
    
    @patch('routers.auth.get_current_user')
    def test_delete_user_account(self, mock_get_user, client: TestClient, session: Session):
        """Test deleting user account and all associated data"""
        from models import Person, Group
        
        # Create user with associated data
        user = User(
            firebase_uid="test_uid",
            email="test@example.com",
            name="Test User"
        )
        session.add(user)
        session.commit()
        session.refresh(user)
        
        # Add associated data
        person = Person(name="Friend", body="Description", user_id=user.id)
        group = Group(name="Friends", user_id=user.id)
        session.add(person)
        session.add(group)
        session.commit()
        
        mock_get_user.return_value = user
        
        response = client.delete("/api/auth/me")
        
        assert response.status_code == 204
        
        # Verify user and all associated data are deleted
        assert session.query(User).filter(User.id == user.id).first() is None
        assert session.query(Person).filter(Person.user_id == user.id).first() is None
        assert session.query(Group).filter(Group.user_id == user.id).first() is None


class TestTokenRefresh:
    """Test cases for token refresh functionality"""
    
    @patch('routers.auth.firebase_admin.auth.verify_id_token')
    @patch('routers.auth.firebase_admin.auth.create_custom_token')
    def test_refresh_token(self, mock_create_token, mock_verify, client: TestClient, session: Session, mock_firebase_token):
        """Test refreshing authentication token"""
        # Setup existing user
        user = User(
            firebase_uid="firebase_test_uid_123",
            email="test@example.com",
            name="Test User"
        )
        session.add(user)
        session.commit()
        
        mock_verify.return_value = mock_firebase_token
        mock_create_token.return_value = b"new_custom_token"
        
        response = client.post(
            "/api/auth/refresh",
            headers={"Authorization": "Bearer old_token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "custom_token" in data
        assert data["custom_token"] == "new_custom_token"
        assert data["user"]["firebase_uid"] == "firebase_test_uid_123"
    
    @patch('routers.auth.firebase_admin.auth.verify_id_token')
    def test_refresh_token_invalid(self, mock_verify, client: TestClient):
        """Test refreshing with invalid token"""
        mock_verify.side_effect = Exception("Invalid token")
        
        response = client.post(
            "/api/auth/refresh",
            headers={"Authorization": "Bearer invalid_token"}
        )
        
        assert response.status_code == 401
        assert "Invalid token" in response.json()["detail"]


class TestAuthorizationLevels:
    """Test cases for different authorization levels"""
    
    @patch('routers.auth.get_current_user')
    def test_user_can_only_access_own_data(self, mock_get_user, client: TestClient, session: Session):
        """Test that users can only access their own data"""
        # Create two users
        user1 = User(firebase_uid="uid1", email="user1@example.com")
        user2 = User(firebase_uid="uid2", email="user2@example.com")
        session.add(user1)
        session.add(user2)
        session.commit()
        session.refresh(user1)
        session.refresh(user2)
        
        # Create person for user2
        from models import Person
        person = Person(name="User2 Friend", body="Description", user_id=user2.id)
        session.add(person)
        session.commit()
        session.refresh(person)
        
        # Mock user1 as current user
        mock_get_user.return_value = user1
        
        # Try to access user2's person
        response = client.get(f"/api/people/{person.id}")
        
        assert response.status_code == 403
        assert response.json()["detail"] == "Access denied"
    
    @patch('routers.auth.get_current_user')
    def test_user_cannot_modify_others_data(self, mock_get_user, client: TestClient, session: Session):
        """Test that users cannot modify other users' data"""
        # Create two users
        user1 = User(firebase_uid="uid1", email="user1@example.com")
        user2 = User(firebase_uid="uid2", email="user2@example.com")
        session.add(user1)
        session.add(user2)
        session.commit()
        session.refresh(user1)
        session.refresh(user2)
        
        # Create person for user2
        from models import Person
        person = Person(name="User2 Friend", body="Description", user_id=user2.id)
        session.add(person)
        session.commit()
        session.refresh(person)
        
        # Mock user1 as current user
        mock_get_user.return_value = user1
        
        # Try to update user2's person
        response = client.patch(
            f"/api/people/{person.id}",
            json={"name": "Hacked Name"}
        )
        
        assert response.status_code == 403
        assert response.json()["detail"] == "Access denied"


class TestSessionManagement:
    """Test cases for session management"""
    
    @patch('routers.auth.get_current_user')
    def test_logout(self, mock_get_user, client: TestClient, session: Session):
        """Test logout functionality"""
        user = User(firebase_uid="test_uid", email="test@example.com")
        session.add(user)
        session.commit()
        session.refresh(user)
        
        mock_get_user.return_value = user
        
        response = client.post("/api/auth/logout")
        
        assert response.status_code == 200
        assert response.json()["message"] == "Logged out successfully"
    
    @patch('routers.auth.get_current_user')
    def test_get_active_sessions(self, mock_get_user, client: TestClient, session: Session):
        """Test getting user's active sessions"""
        user = User(firebase_uid="test_uid", email="test@example.com")
        session.add(user)
        session.commit()
        session.refresh(user)
        
        mock_get_user.return_value = user
        
        # In a real implementation, you'd have session tracking
        response = client.get("/api/auth/sessions")
        
        assert response.status_code == 200
        # Verify response structure (implementation-dependent)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])