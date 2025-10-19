from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlmodel import Session, select, or_, func
from typing import List, Optional
from uuid import UUID
from datetime import datetime

from database import get_db
from models import Person, PersonCreate, PersonRead, PersonUpdate, History, HistoryCreate, Tag, TagRead, PersonTag, NotebookEntry
from routers.auth import get_current_user_id
from services.health_score import calculate_health_score, get_health_status, get_health_emoji
from services.location import get_person_coordinates
from services.geocoding import geocode_address

router = APIRouter()


def enrich_person_with_health(person: Person, db: Session) -> PersonRead:
    """
    Enrich a Person object with computed health score fields
    """
    # Calculate health score
    health_score = calculate_health_score(person.last_contact_date)
    health_status = get_health_status(health_score)
    health_emoji = get_health_emoji(health_status)
    days_since_contact = (datetime.utcnow() - person.last_contact_date).days

    # Get latest notebook entry
    latest_entry_query = select(NotebookEntry).where(
        NotebookEntry.person_id == person.id
    ).order_by(NotebookEntry.created_at.desc()).limit(1)
    latest_entry = db.exec(latest_entry_query).first()

    # Build PersonRead dict
    person_dict = person.model_dump()
    person_dict['health_score'] = health_score
    person_dict['health_status'] = health_status
    person_dict['health_emoji'] = health_emoji
    person_dict['days_since_contact'] = days_since_contact

    if latest_entry:
        person_dict['latest_notebook_entry_content'] = latest_entry.content
        person_dict['latest_notebook_entry_time'] = latest_entry.created_at

    return PersonRead(**person_dict)


@router.get("/", response_model=List[PersonRead])
async def get_people(
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
    search: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 100
):
    print(f"DEBUG: get_people endpoint reached with user_id: {user_id}")
    query = select(Person).where(Person.user_id == user_id)

    if search:
        query = query.where(
            or_(
                Person.name.contains(search),
                Person.body.contains(search),
                Person.mnemonic.contains(search)
            )
        )

    query = query.offset(skip).limit(limit).order_by(Person.name)
    people = db.exec(query).all()

    # Enrich each person with health scores and notebook entries
    result = [enrich_person_with_health(person, db) for person in people]
    return result


@router.get("/map-data")
async def get_map_data(
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id)
) -> List[dict]:
    """
    Get all people with coordinates for map display.

    Returns:
        List of people with location data

    Example response:
        [
            {
                "id": "uuid",
                "name": "Alice",
                "latitude": 37.7749,
                "longitude": -122.4194,
                "location_source": "personal",
            },
            {
                "id": "uuid",
                "name": "Bob",
                "latitude": 37.7849,
                "longitude": -122.4094,
                "location_source": "tag:Climbing Gym",
            }
        ]
    """
    people = db.exec(
        select(Person).where(Person.user_id == user_id)
    ).all()

    map_data = []
    for person in people:
        coords = get_person_coordinates(db, person)
        if coords:
            latitude, longitude, location_source = coords

            map_data.append({
                "id": str(person.id),
                "name": person.name,
                "latitude": latitude,
                "longitude": longitude,
                "location_source": location_source,
            })

    return map_data


@router.post("/", response_model=PersonRead)
async def create_person(
    person: PersonCreate,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id)
):
    db_person = Person(**person.model_dump(), user_id=user_id)
    db.add(db_person)
    db.commit()
    db.refresh(db_person)
    return enrich_person_with_health(db_person, db)


@router.get("/{person_id}", response_model=PersonRead)
async def get_person(
    person_id: UUID,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id)
):
    person = db.get(Person, person_id)
    if not person or person.user_id != user_id:
        raise HTTPException(status_code=404, detail="Person not found")
    return enrich_person_with_health(person, db)


@router.patch("/{person_id}", response_model=PersonRead)
async def update_person(
    person_id: UUID,
    person_update: PersonUpdate,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id)
):
    person = db.get(Person, person_id)
    if not person or person.user_id != user_id:
        raise HTTPException(status_code=404, detail="Person not found")

    person_data = person_update.model_dump(exclude_unset=True)
    for key, value in person_data.items():
        setattr(person, key, value)

    # If address changed, re-geocode
    address_fields = ['street_address', 'city', 'state', 'zip']
    if any(key in person_data for key in address_fields):
        coords = geocode_address(
            street_address=person.street_address,
            city=person.city,
            state=person.state,
            zip_code=person.zip
        )
        if coords:
            person.latitude, person.longitude = coords
        else:
            # Clear coords if geocoding fails
            person.latitude = None
            person.longitude = None

    db.add(person)
    db.commit()
    db.refresh(person)
    return enrich_person_with_health(person, db)


@router.delete("/{person_id}")
async def delete_person(
    person_id: UUID,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id)
):
    person = db.get(Person, person_id)
    if not person or person.user_id != user_id:
        raise HTTPException(status_code=404, detail="Person not found")

    db.delete(person)
    db.commit()
    return Response(status_code=204)


@router.post("/{person_id}/contact")
async def mark_as_contacted(
    person_id: UUID,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id)
):
    """Manually mark that you contacted this person (updates health score)"""
    person = db.get(Person, person_id)
    if not person or person.user_id != user_id:
        raise HTTPException(status_code=404, detail="Person not found")

    # Update last contact date
    person.last_contact_date = datetime.utcnow()
    db.add(person)
    db.commit()
    db.refresh(person)

    # Calculate new health score
    health_score = calculate_health_score(person.last_contact_date)

    return {
        "message": "Contact logged",
        "health_score": health_score,
        "last_contact_date": person.last_contact_date
    }


@router.get("/search", response_model=List[PersonRead])
async def search_people(
    query: str,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id)
):
    if not query:
        raise HTTPException(status_code=400, detail="Query parameter is required")

    statement = select(Person).where(
        Person.user_id == user_id,
        or_(
            Person.name.contains(query),
            Person.body.contains(query),
            Person.mnemonic.contains(query)
        )
    )
    people = db.exec(statement).all()
    return [enrich_person_with_health(person, db) for person in people]


# Tag-related endpoints for people
@router.get("/{person_id}/tags", response_model=List[TagRead])
async def get_person_tags(
    person_id: UUID,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id)
):
    """Get all tags associated with a person"""
    person = db.get(Person, person_id)
    if not person or person.user_id != user_id:
        raise HTTPException(status_code=404, detail="Person not found")
    
    query = select(Tag).join(PersonTag).where(
        PersonTag.person_id == person_id
    )
    tags = db.exec(query).all()
    return tags


@router.post("/{person_id}/tags")
async def add_tag_to_person(
    person_id: UUID,
    request: dict,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id)
):
    """Add a tag to a person (create tag if it doesn't exist)"""
    person = db.get(Person, person_id)
    if not person or person.user_id != user_id:
        raise HTTPException(status_code=404, detail="Person not found")
    
    tag_name = request.get("name")
    tag_category = request.get("category", "general")
    tag_color = request.get("color")
    
    if not tag_name:
        raise HTTPException(status_code=400, detail="Tag name is required")
    
    # Get or create tag
    tag_query = select(Tag).where(
        Tag.user_id == user_id,
        Tag.name == tag_name,
        Tag.category == tag_category
    )
    tag = db.exec(tag_query).first()
    
    if not tag:
        tag = Tag(
            name=tag_name,
            category=tag_category,
            color=tag_color,
            user_id=user_id
        )
        db.add(tag)
        db.commit()
        db.refresh(tag)
    
    # Check if association already exists
    existing_query = select(PersonTag).where(
        PersonTag.person_id == person_id,
        PersonTag.tag_id == tag.id
    )
    existing = db.exec(existing_query).first()
    
    if existing:
        return {"message": f"Person already has tag '{tag_name}'"}
    
    # Create association
    person_tag = PersonTag(person_id=person_id, tag_id=tag.id)
    db.add(person_tag)
    db.commit()
    
    return {"message": f"Added tag '{tag_name}' to person"}


@router.delete("/{person_id}/tags/{tag_id}")
async def remove_tag_from_person(
    person_id: UUID,
    tag_id: UUID,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id)
):
    """Remove a tag from a person"""
    person = db.get(Person, person_id)
    if not person or person.user_id != user_id:
        raise HTTPException(status_code=404, detail="Person not found")
    
    tag = db.get(Tag, tag_id)
    if not tag or tag.user_id != user_id:
        raise HTTPException(status_code=404, detail="Tag not found")
    
    # Find and remove the association
    query = select(PersonTag).where(
        PersonTag.person_id == person_id,
        PersonTag.tag_id == tag_id
    )
    association = db.exec(query).first()
    
    if not association:
        raise HTTPException(status_code=404, detail="Tag association not found")
    
    db.delete(association)
    db.commit()
    
    return Response(status_code=204)


@router.get("/by-tag/{tag_id}", response_model=List[PersonRead])
async def get_people_by_tag(
    tag_id: UUID,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id)
):
    """Get all people with a specific tag"""
    tag = db.get(Tag, tag_id)
    if not tag or tag.user_id != user_id:
        raise HTTPException(status_code=404, detail="Tag not found")

    query = select(Person).join(PersonTag).where(
        PersonTag.tag_id == tag_id,
        Person.user_id == user_id
    )
    people = db.exec(query).all()
    return [enrich_person_with_health(person, db) for person in people]


@router.get("/by-tags/", response_model=List[PersonRead])
async def get_people_by_tags(
    tags: str = Query(..., description="Comma-separated list of tag names"),
    category: Optional[str] = Query(None, description="Filter tags by category"),
    match_all: bool = Query(False, description="Require all tags (AND) vs any tag (OR)"),
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id)
):
    """Get people by multiple tags"""
    tag_names = [name.strip() for name in tags.split(",") if name.strip()]

    if not tag_names:
        raise HTTPException(status_code=400, detail="At least one tag name is required")

    # Get tag IDs
    tag_query = select(Tag.id).where(
        Tag.user_id == user_id,
        Tag.name.in_(tag_names)
    )

    if category:
        tag_query = tag_query.where(Tag.category == category)

    tag_ids = db.exec(tag_query).all()

    if not tag_ids:
        return []

    if match_all:
        # AND logic: person must have ALL specified tags
        query = select(Person).where(
            Person.user_id == user_id,
            Person.id.in_(
                select(PersonTag.person_id)
                .where(PersonTag.tag_id.in_(tag_ids))
                .group_by(PersonTag.person_id)
                .having(func.count(PersonTag.tag_id) == len(tag_ids))
            )
        )
    else:
        # OR logic: person must have ANY of the specified tags
        query = select(Person).join(PersonTag).where(
            PersonTag.tag_id.in_(tag_ids),
            Person.user_id == user_id
        ).distinct()

    people = db.exec(query).all()
    return [enrich_person_with_health(person, db) for person in people]