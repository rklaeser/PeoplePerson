from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlmodel import Session, select, or_, func
from typing import List, Optional
from uuid import UUID

from database import get_db
from models import Person, PersonCreate, PersonRead, PersonUpdate, GroupAssociation, Group, GroupRead, History, HistoryCreate, Tag, TagRead, PersonTag
from routers.auth import get_current_user_id

router = APIRouter()


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
    return people


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
    return db_person


@router.get("/{person_id}", response_model=PersonRead)
async def get_person(
    person_id: UUID,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id)
):
    person = db.get(Person, person_id)
    if not person or person.user_id != user_id:
        raise HTTPException(status_code=404, detail="Person not found")
    return person


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
    
    db.add(person)
    db.commit()
    db.refresh(person)
    return person


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


@router.get("/{person_id}/groups", response_model=List[GroupRead])
async def get_person_groups(
    person_id: UUID,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id)
):
    person = db.get(Person, person_id)
    if not person or person.user_id != user_id:
        raise HTTPException(status_code=404, detail="Person not found")
    
    query = select(Group).join(GroupAssociation).where(
        GroupAssociation.person_id == person_id,
        GroupAssociation.user_id == user_id
    )
    groups = db.exec(query).all()
    return groups


@router.post("/{person_id}/groups")
async def add_person_to_group(
    person_id: UUID,
    request: dict,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id)
):
    person = db.get(Person, person_id)
    if not person or person.user_id != user_id:
        raise HTTPException(status_code=404, detail="Person not found")
    
    group_id = UUID(request["group_id"])
    group = db.get(Group, group_id)
    
    if not group or group.user_id != user_id:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Check if association already exists
    query = select(GroupAssociation).where(
        GroupAssociation.person_id == person_id,
        GroupAssociation.group_id == group_id
    )
    existing = db.exec(query).first()
    
    if existing:
        return {"message": f"{person.name} already in {group.name}"}
    
    # Create association
    association = GroupAssociation(
        person_id=person_id,
        group_id=group_id,
        user_id=user_id
    )
    db.add(association)
    db.commit()
    
    return {"message": "Person added to group"}


@router.delete("/{person_id}/groups/{group_id}")
async def remove_person_from_group(
    person_id: UUID,
    group_id: UUID,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id)
):
    person = db.get(Person, person_id)
    if not person or person.user_id != user_id:
        raise HTTPException(status_code=404, detail="Person not found")
    
    query = select(GroupAssociation).where(
        GroupAssociation.person_id == person_id,
        GroupAssociation.group_id == group_id,
        GroupAssociation.user_id == user_id
    )
    association = db.exec(query).first()
    
    if not association:
        raise HTTPException(status_code=404, detail="Association not found")
    
    db.delete(association)
    db.commit()
    
    return Response(status_code=204)


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
    return people


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
    return people


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
    return people