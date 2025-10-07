from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlmodel import Session, select, or_, func
from typing import List, Optional
from uuid import UUID

from database import get_db
from models import Tag, TagCreate, TagRead, TagUpdate, PersonTag, Person
from routers.auth import get_current_user_id

router = APIRouter()


@router.get("/", response_model=List[TagRead])
async def get_tags(
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 100
):
    """Get all tags for the authenticated user"""
    query = select(Tag).where(Tag.user_id == user_id)
    
    if category:
        query = query.where(Tag.category == category)
    
    if search:
        query = query.where(
            or_(
                Tag.name.contains(search),
                Tag.description.contains(search)
            )
        )
    
    query = query.offset(skip).limit(limit).order_by(Tag.name)
    tags = db.exec(query).all()
    return tags


@router.post("/", response_model=TagRead)
async def create_tag(
    tag: TagCreate,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id)
):
    """Create a new tag"""
    # Check if tag with same name and category already exists
    existing_query = select(Tag).where(
        Tag.user_id == user_id,
        Tag.name == tag.name,
        Tag.category == tag.category
    )
    existing_tag = db.exec(existing_query).first()
    
    if existing_tag:
        raise HTTPException(
            status_code=400, 
            detail=f"Tag '{tag.name}' already exists in category '{tag.category}'"
        )
    
    db_tag = Tag(**tag.model_dump(), user_id=user_id)
    db.add(db_tag)
    db.commit()
    db.refresh(db_tag)
    return db_tag


@router.get("/{tag_id}", response_model=TagRead)
async def get_tag(
    tag_id: UUID,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id)
):
    """Get a specific tag by ID"""
    tag = db.get(Tag, tag_id)
    if not tag or tag.user_id != user_id:
        raise HTTPException(status_code=404, detail="Tag not found")
    return tag


@router.patch("/{tag_id}", response_model=TagRead)
async def update_tag(
    tag_id: UUID,
    tag_update: TagUpdate,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id)
):
    """Update a tag"""
    tag = db.get(Tag, tag_id)
    if not tag or tag.user_id != user_id:
        raise HTTPException(status_code=404, detail="Tag not found")
    
    tag_data = tag_update.model_dump(exclude_unset=True)
    for key, value in tag_data.items():
        setattr(tag, key, value)
    
    db.add(tag)
    db.commit()
    db.refresh(tag)
    return tag


@router.delete("/{tag_id}")
async def delete_tag(
    tag_id: UUID,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id)
):
    """Delete a tag and all its associations"""
    tag = db.get(Tag, tag_id)
    if not tag or tag.user_id != user_id:
        raise HTTPException(status_code=404, detail="Tag not found")
    
    db.delete(tag)
    db.commit()
    return Response(status_code=204)


@router.get("/categories/", response_model=List[str])
async def get_tag_categories(
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id)
):
    """Get all unique tag categories for the user"""
    query = select(Tag.category).where(Tag.user_id == user_id).distinct()
    categories = db.exec(query).all()
    return categories


@router.get("/{tag_id}/people", response_model=List[dict])
async def get_tag_people(
    tag_id: UUID,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id)
):
    """Get all people associated with a tag"""
    tag = db.get(Tag, tag_id)
    if not tag or tag.user_id != user_id:
        raise HTTPException(status_code=404, detail="Tag not found")
    
    query = select(Person).join(PersonTag).where(
        PersonTag.tag_id == tag_id,
        Person.user_id == user_id
    )
    people = db.exec(query).all()
    return [person.model_dump() for person in people]


@router.get("/suggest/", response_model=List[TagRead])
async def suggest_tags(
    query: str = Query(..., description="Search query for tag suggestions"),
    category: Optional[str] = Query(None, description="Filter by category"),
    limit: int = Query(10, description="Maximum number of suggestions"),
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id)
):
    """Get tag suggestions based on partial name match"""
    if len(query.strip()) < 2:
        raise HTTPException(status_code=400, detail="Query must be at least 2 characters")
    
    search_query = select(Tag).where(
        Tag.user_id == user_id,
        Tag.name.contains(query)
    )
    
    if category:
        search_query = search_query.where(Tag.category == category)
    
    search_query = search_query.order_by(Tag.name).limit(limit)
    suggestions = db.exec(search_query).all()
    return suggestions


@router.get("/stats/", response_model=dict)
async def get_tag_stats(
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id)
):
    """Get statistics about tag usage"""
    # Count total tags
    total_tags_query = select(func.count(Tag.id)).where(Tag.user_id == user_id)
    total_tags = db.exec(total_tags_query).first()
    
    # Count tags by category
    category_stats_query = select(Tag.category, func.count(Tag.id)).where(
        Tag.user_id == user_id
    ).group_by(Tag.category)
    category_stats = db.exec(category_stats_query).all()
    
    # Count people per tag (most popular tags)
    popular_tags_query = select(
        Tag.name, 
        Tag.category,
        func.count(PersonTag.person_id).label("person_count")
    ).join(PersonTag, isouter=True).where(
        Tag.user_id == user_id
    ).group_by(Tag.id, Tag.name, Tag.category).order_by(
        func.count(PersonTag.person_id).desc()
    ).limit(10)
    popular_tags = db.exec(popular_tags_query).all()
    
    return {
        "total_tags": total_tags or 0,
        "categories": {category: count for category, count in category_stats},
        "popular_tags": [
            {
                "name": name, 
                "category": category, 
                "person_count": count
            } 
            for name, category, count in popular_tags
        ]
    }