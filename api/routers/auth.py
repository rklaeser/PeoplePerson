from fastapi import APIRouter, Depends, HTTPException, Header, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlmodel import Session, select
from typing import Optional
from uuid import UUID
import firebase_admin
from firebase_admin import auth as firebase_auth, credentials
import os
from dotenv import load_dotenv

from database import get_db
from models import User, UserCreate, UserRead

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
        # For production, use service account credentials
        firebase_creds_path = os.getenv("FIREBASE_CREDENTIALS_PATH")
        if firebase_creds_path and os.path.exists(firebase_creds_path):
            print("Using Firebase service account credentials")
            cred = credentials.Certificate(firebase_creds_path)
            firebase_admin.initialize_app(cred, options={'projectId': project_id})
        else:
            print("Warning: Firebase credentials not found. Authentication will not work.")
            try:
                firebase_admin.initialize_app(options={'projectId': project_id})
            except:
                pass


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
    
    # Check if user exists
    query = select(User).where(User.firebase_uid == firebase_uid)
    user = db.exec(query).first()
    
    if not user:
        # Create new user
        user = User(
            firebase_uid=firebase_uid,
            email=email,
            name=name
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    
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