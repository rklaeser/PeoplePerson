from fastapi import APIRouter
from datetime import datetime

router = APIRouter(tags=["health"])

@router.get("/")
async def root():
    """Root health check endpoint"""
    return {
        "status": "healthy",
        "service": "PeoplePerson API",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    }

@router.get("/health")
async def health_check():
    """Health check endpoint for Cloud Run"""
    return {
        "status": "healthy",
        "service": "PeoplePerson API",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    }