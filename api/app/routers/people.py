from fastapi import APIRouter, HTTPException, Depends, Request
from typing import List, Dict, Any
from pydantic import BaseModel, Field
from app.services.person_service import get_all_friends, create_person, update_person, search_people
from app.auth import get_current_user
import uuid
import os

router = APIRouter()

# Pydantic models for request/response
class PersonCreate(BaseModel):
    name: str
    body: str = "Add a description"
    intent: str = "new"
    birthday: str | None = None
    mnemonic: str | None = None
    zip: str | None = None

class PersonUpdate(BaseModel):
    name: str | None = None
    body: str | None = None
    intent: str | None = None
    birthday: str | None = None
    mnemonic: str | None = None
    zip: str | None = None

class PersonResponse(BaseModel):
    id: str
    name: str
    body: str
    intent: str
    birthday: str | None = None
    mnemonic: str | None = None
    zip: str | None = None

@router.get("/", response_model=List[PersonResponse])
async def get_people(user: Dict[str, str] = Depends(get_current_user)):
    """Get all people for authenticated user"""
    print(f"\n=== Authenticated User: {user['name']} (ID: {user['id']}) ===\n")
    
    try:
        people = await get_all_friends(user["id"])
        print(f"Returning {len(people)} people for user {user['id']}")
        return people
    except Exception as e:
        print(f"Error in get_people: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/debug-info")
async def get_debug_info(user: Dict[str, str] = Depends(get_current_user)):
    """Debug endpoint to see what's in the database"""
    from app.database import get_db, Person
    from sqlalchemy import text
    import os
    
    environment = os.getenv("ENVIRONMENT", "development")
    if environment != "development":
        raise HTTPException(status_code=404, detail="Not found")
    
    db_gen = get_db()
    db = next(db_gen)
    
    try:
        # Check total people count
        total_people = db.query(Person).count()
        
        # Get raw data from the table
        raw_result = db.execute(text("SELECT * FROM people LIMIT 5"))
        raw_people = raw_result.fetchall()
        
        # Check for specific user
        user_uuid = user["id"]
        raw_user_result = db.execute(text('SELECT * FROM people WHERE "userId" = :user_id'), {"user_id": user_uuid})
        raw_user_people = raw_user_result.fetchall()
        
        return {
            "user_id": user_uuid,
            "total_people": total_people,
            "raw_people": [dict(person._mapping) for person in raw_people],
            "user_people_count": len(raw_user_people),
            "user_people": [dict(person._mapping) for person in raw_user_people]
        }
    finally:
        db.close()

@router.get("/test/{user_id}")
async def get_people_test(user_id: str):
    """Test endpoint to get people without auth - for debugging (development only)"""
    # Security: Only allow in development environment
    environment = os.getenv("ENVIRONMENT", "development")
    if environment != "development":
        raise HTTPException(status_code=404, detail="Not found")
    
    try:
        print(f"Test endpoint called with user_id: {user_id}")
        people = await get_all_friends(user_id)
        print(f"get_all_friends returned {len(people)} people")
        return {"status": "success", "count": len(people), "people": people}
    except Exception as e:
        print(f"Exception in test endpoint: {e}")
        import traceback
        traceback.print_exc()
        return {"status": "error", "error": str(e), "type": str(type(e))}

@router.post("/", response_model=PersonResponse)
async def create_new_person(
    person: PersonCreate,
    user: Dict[str, str] = Depends(get_current_user)
):
    """Create a new person"""
    try:
        person_data = person.dict(exclude_unset=True)
        new_person = await create_person(user["id"], person_data)
        return new_person
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{person_id}", response_model=PersonResponse)
async def update_existing_person(
    person_id: str,
    person: PersonUpdate,
    user: Dict[str, str] = Depends(get_current_user)
):
    """Update an existing person"""
    try:
        person_data = person.dict(exclude_unset=True)
        # TODO: Add ownership check in update_person
        updated_person = await update_person(person_id, person_data)
        return updated_person
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/search", response_model=List[PersonResponse])
async def search_people_endpoint(
    query: str,
    user: Dict[str, str] = Depends(get_current_user)
):
    """Search people by name or description"""
    try:
        people = await search_people(user["id"], query)
        return people
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{person_id}", response_model=PersonResponse)
async def get_person_by_id(
    person_id: str,
    user: Dict[str, str] = Depends(get_current_user)
):
    """Get a specific person by ID"""
    try:
        # For now, get all people and filter by ID
        # TODO: Implement dedicated get_person_by_id function
        people = await get_all_friends(user["id"])
        person = next((p for p in people if p["id"] == person_id), None)
        if not person:
            raise HTTPException(status_code=404, detail=f"Person with id {person_id} not found")
        return person
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{person_id}")
async def delete_person(
    person_id: str,
    user: Dict[str, str] = Depends(get_current_user)
):
    """Delete a person"""
    # TODO: Implement delete_person function in person_service
    raise HTTPException(status_code=501, detail="Delete functionality not yet implemented")