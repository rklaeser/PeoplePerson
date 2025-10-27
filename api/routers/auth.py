from fastapi import APIRouter, Depends, HTTPException, Header, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlmodel import Session, select
from typing import Optional
from uuid import UUID
import firebase_admin
from firebase_admin import auth as firebase_auth, credentials
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta

from database import get_db
from models import User, UserCreate, UserRead, Person, NotebookEntry

load_dotenv()

router = APIRouter()
security = HTTPBearer()

# Initialize Firebase Admin SDK
if not firebase_admin._apps:
    # Check if using Firebase emulator
    emulator_host = os.getenv("FIREBASE_AUTH_EMULATOR_HOST")
    project_id = os.getenv("FIREBASE_PROJECT_ID", "peopleperson-app")

    if emulator_host:
        # For emulator, initialize with project ID
        print(f"Using Firebase Auth emulator at {emulator_host}")
        print(f"Project ID: {project_id}")
        os.environ["FIREBASE_AUTH_EMULATOR_HOST"] = emulator_host
        firebase_admin.initialize_app(options={'projectId': project_id})
    else:
        # For production/staging: try credentials file, then fall back to ADC
        firebase_creds_path = os.getenv("FIREBASE_CREDENTIALS_PATH")
        if firebase_creds_path and os.path.exists(firebase_creds_path):
            print("Using Firebase service account credentials from file")
            cred = credentials.Certificate(firebase_creds_path)
            firebase_admin.initialize_app(cred, options={'projectId': project_id})
        else:
            # Use Application Default Credentials (ADC) - works on Cloud Run
            print(f"Using Application Default Credentials for Firebase (project: {project_id})")
            firebase_admin.initialize_app(options={'projectId': project_id})


async def verify_firebase_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Verify Firebase ID token"""
    try:
        print(f"DEBUG: verify_firebase_token called!")
        print(f"DEBUG: credentials.scheme: {credentials.scheme}")
        print(f"DEBUG: token: {credentials.credentials[:50]}...")
        
        decoded_token = firebase_auth.verify_id_token(credentials.credentials)
        print(f"DEBUG: Token verified successfully for user: {decoded_token.get('uid')}")
        return decoded_token
    except Exception as e:
        print(f"DEBUG: Token verification failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(
    token: dict = Depends(verify_firebase_token),
    db: Session = Depends(get_db)
) -> User:
    """Get or create user from Firebase token"""
    firebase_uid = token.get("uid")
    email = token.get("email")
    name = token.get("name")

    # Check if user exists by firebase_uid
    query = select(User).where(User.firebase_uid == firebase_uid)
    user = db.exec(query).first()

    if not user:
        # Check if email is already registered with a different Firebase account
        if email:
            email_query = select(User).where(User.email == email)
            existing_user = db.exec(email_query).first()

            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"This email ({email}) is already registered. If you previously deleted your account, please contact support to resolve this issue."
                )

        # Create new user
        user = User(
            firebase_uid=firebase_uid,
            email=email,
            name=name
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        # Create default friends for new user
        create_default_friends(user.id, db)

    return user


async def get_current_user_id(user: User = Depends(get_current_user)) -> UUID:
    """Get current user ID"""
    return user.id


# Alternative authentication for internal services
async def get_user_from_header(
    x_user_id: Optional[str] = Header(None),
    x_internal_key: Optional[str] = Header(None)
) -> Optional[UUID]:
    """Get user ID from header for internal services"""
    internal_key = os.getenv("INTERNAL_API_KEY")
    
    if x_internal_key and x_user_id and x_internal_key == internal_key:
        try:
            return UUID(x_user_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid user ID format")
    
    return None


async def get_current_user_or_internal(
    firebase_user: Optional[User] = Depends(get_current_user),
    internal_user_id: Optional[UUID] = Depends(get_user_from_header)
) -> UUID:
    """Get user ID from Firebase auth or internal service header"""
    if internal_user_id:
        return internal_user_id
    if firebase_user:
        return firebase_user.id

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required"
    )


def create_default_friends(user_id: UUID, db: Session):
    """Create default friends (Tom, Nico, Scout) for new users"""
    now = datetime.utcnow()
    week_ago = now - timedelta(days=7)
    two_weeks_ago = now - timedelta(days=14)

    # Scout - the enthusiastic dog
    scout = Person(
        user_id=user_id,
        name="Scout",
        body="My guide! Always excited to help me remember people.",
        last_contact_date=now,
        created_at=two_weeks_ago
    )
    db.add(scout)
    db.flush()

    scout_memory = NotebookEntry(
        person_id=scout.id,
        user_id=user_id,
        entry_date=two_weeks_ago.strftime('%Y-%m-%d'),
        content="Scout helped me get started with PeoplePerson. Such a good dog! Reminds me to stay connected with everyone.\n\nRead more: https://peopleperson.klazr.com/blog/scout-care-for-humans",
        created_at=two_weeks_ago
    )
    db.add(scout_memory)

    # Nico - the strategic cat
    nico = Person(
        user_id=user_id,
        name="Nico",
        body="Strategic advisor. Helped me understand the power of remembering details about people.",
        last_contact_date=now,
        created_at=two_weeks_ago
    )
    db.add(nico)
    db.flush()

    nico_memory = NotebookEntry(
        person_id=nico.id,
        user_id=user_id,
        entry_date=week_ago.strftime('%Y-%m-%d'),
        content="Nico taught me that remembering people's details isn't manipulation—it's just being thoughtful at scale. World domination optional.\n\nRead more: https://peopleperson.klazr.com/blog/nico-one-trick",
        created_at=week_ago
    )
    db.add(nico_memory)

    # Tom - the Neanderthal
    tom = Person(
        user_id=user_id,
        name="Tom",
        body="Neanderthal trying to blend in with humans. Shows that anyone can master relationships with the right tools!",
        last_contact_date=now,
        created_at=two_weeks_ago
    )
    db.add(tom)
    db.flush()

    tom_memory = NotebookEntry(
        person_id=tom.id,
        user_id=user_id,
        entry_date=week_ago.strftime('%Y-%m-%d'),
        content="Tom proved that you can break past the Dunbar number (150 friends) with PeoplePerson. If a Neanderthal can do it, so can I!\n\nRead more: https://peopleperson.klazr.com/blog/tom-dunbar-number",
        created_at=week_ago
    )
    db.add(tom_memory)

    db.commit()


@router.post("/register", response_model=UserRead)
async def register(
    user_data: UserCreate,
    token: dict = Depends(verify_firebase_token),
    db: Session = Depends(get_db)
):
    """Register a new user"""
    firebase_uid = token.get("uid")

    # Check if user already exists
    query = select(User).where(User.firebase_uid == firebase_uid)
    existing_user = db.exec(query).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already registered"
        )

    # Create new user
    user = User(
        firebase_uid=firebase_uid,
        email=user_data.email,
        name=user_data.name
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Create default friends for new user
    create_default_friends(user.id, db)

    return user


@router.get("/me", response_model=UserRead)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """Get current user information"""
    return current_user


@router.patch("/me", response_model=UserRead)
async def update_current_user(
    user_update: UserCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user information"""
    if user_update.name:
        current_user.name = user_update.name
    if user_update.email:
        current_user.email = user_update.email

    db.add(current_user)
    db.commit()
    db.refresh(current_user)

    return current_user


@router.delete("/me")
async def delete_current_user(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete current user account and all associated data"""
    user_id = current_user.id

    # Delete user - cascading deletes will handle related records
    # Order: NotebookEntries, Messages, PersonTags, PersonAssociations,
    # EntryPersons, Entries, History, People, Tags, User
    db.delete(current_user)
    db.commit()

    return {"message": "User account deleted successfully", "user_id": str(user_id)}