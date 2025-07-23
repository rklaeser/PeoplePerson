from fastapi import Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import Optional, Dict
import os
from app.firebase_config import verify_firebase_token, initialize_firebase
from app.database import get_db
from app.services.user_service import get_or_create_user
import firebase_admin.auth

# Initialize Firebase on module import
initialize_firebase()

async def get_current_user(request: Request, db: Session = Depends(get_db)) -> Dict[str, str]:
    """
    Validate Firebase ID token from Authorization header
    Returns user info if valid, raises 401 if not
    
    In development mode: bypasses auth and returns demo user
    In production mode: validates Firebase ID tokens
    """
    # Development bypass - allows testing without authentication
    environment = os.getenv("ENVIRONMENT", "development")
    
    if environment == "development":
        return {
            "id": "00000000-0000-0000-0000-000000000001",  # Demo user ID from seed data
            "name": "Dwight Schrute",
            "email": "dwight@schrutefarms.com"
        }
    
    # Production authentication - validate Firebase ID token
    
    # Get Authorization header
    authorization = request.headers.get("Authorization")
    
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No Authorization header provided",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Extract Bearer token
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication scheme. Expected Bearer token",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Authorization header format. Expected 'Bearer <token>'",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify Firebase token
    try:
        firebase_user_info = verify_firebase_token(token)
        
        # Get or create user in database
        user = await get_or_create_user(db, firebase_user_info)
        
        # Return user info for API consumption
        return {
            "id": str(user.id),  # Use database ID for consistency
            "firebase_uid": user.firebase_uid,
            "name": user.name or "Unknown",
            "email": user.email or "unknown@example.com"
        }
        
    except firebase_admin.auth.InvalidIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Firebase ID token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except firebase_admin.auth.ExpiredIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Firebase ID token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except firebase_admin.auth.RevokedIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Firebase ID token has been revoked",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        print(f"Auth error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_user_no_test_bypass(request: Request, db: Session = Depends(get_db)) -> Dict[str, str]:
    """
    Validate Firebase ID token from Authorization header - NO development bypass
    Used for AI endpoints to protect API keys even in development
    """
    # Only allow development environment bypass, NOT test query parameter
    environment = os.getenv("ENVIRONMENT", "development")
    if environment == "development":
        return {
            "id": "00000000-0000-0000-0000-000000000001",
            "name": "Dwight Schrute",
            "email": "dwight@schrutefarms.com"
        }
    
    # Use the same Firebase validation as get_current_user
    return await get_current_user(request, db)

async def get_current_user_optional(request: Request, db: Session = Depends(get_db)) -> Optional[Dict[str, str]]:
    """
    Optional auth - returns user if authenticated, None otherwise
    """
    try:
        return await get_current_user(request, db)
    except HTTPException:
        # In development, still return demo user for optional auth
        environment = os.getenv("ENVIRONMENT", "development")
        if environment == "development":
            return {
                "id": "00000000-0000-0000-0000-000000000001",
                "name": "Dwight Schrute", 
                "email": "dwight@schrutefarms.com"
            }
        return None