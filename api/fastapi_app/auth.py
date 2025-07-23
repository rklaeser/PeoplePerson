from fastapi import Depends, HTTPException, status, Request
from typing import Optional, Dict
import os
import httpx
import asyncio
from .config import DJANGO_API_URL, ENVIRONMENT


async def get_current_user(request: Request) -> Dict[str, str]:
    """
    Validate Firebase ID token by calling Django API
    Returns user info if valid, raises 401 if not
    
    In development mode: returns demo user
    In production mode: validates via Django
    """
    # Development bypass
    if ENVIRONMENT == "development":
        return {
            "id": "00000000-0000-0000-0000-000000000001",
            "name": "Dwight Schrute",
            "email": "dwight@schrutefarms.com"
        }
    
    # Get Authorization header
    authorization = request.headers.get("Authorization")
    
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No Authorization header provided",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify token with Django
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{DJANGO_API_URL}/api/auth/verify/",
                headers={"Authorization": authorization},
                timeout=10.0
            )
            
            if response.status_code == 200:
                user_data = response.json()
                return {
                    "id": user_data["id"],
                    "name": user_data.get("name", "Unknown"),
                    "email": user_data.get("email", "unknown@example.com")
                }
            else:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid authentication token",
                    headers={"WWW-Authenticate": "Bearer"},
                )
                
        except httpx.RequestError as e:
            print(f"Error calling Django auth API: {e}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Authentication service unavailable"
            )


async def get_current_user_no_test_bypass(request: Request) -> Dict[str, str]:
    """
    Validate Firebase ID token via Django - NO development bypass
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
    
    # Use the same validation as get_current_user
    return await get_current_user(request)


async def get_current_user_optional(request: Request) -> Optional[Dict[str, str]]:
    """
    Optional auth - returns user if authenticated, None otherwise
    """
    try:
        return await get_current_user(request)
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


async def get_user_friends(user_id: str) -> list:
    """
    Get user's friends from Django API
    """
    async with httpx.AsyncClient() as client:
        try:
            # In development, we might not have auth, so we'll use a simple GET
            response = await client.get(
                f"{DJANGO_API_URL}/api/people/",
                headers={"X-User-ID": user_id},  # Custom header for internal service communication
                timeout=10.0
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Failed to get friends: {response.status_code}")
                return []
                
        except httpx.RequestError as e:
            print(f"Error calling Django API for friends: {e}")
            return []