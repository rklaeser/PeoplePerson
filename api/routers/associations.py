from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
from uuid import UUID

from database import get_db
from models import PersonAssociation, GroupAssociation, Person
from routers.auth import get_current_user_id

router = APIRouter()


@router.get("/people/{person_id}/associates")
async def get_person_associates(
    person_id: UUID,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id)
):
    # Verify person exists and belongs to user
    person = db.get(Person, person_id)
    if not person or person.user_id != user_id:
        raise HTTPException(status_code=404, detail="Person not found")
    
    # Get all associates
    query = select(PersonAssociation).where(PersonAssociation.person_id == person_id)
    associations = db.exec(query).all()
    
    # Get associate details
    associates = []
    for assoc in associations:
        associate = db.get(Person, assoc.associate_id)
        if associate and associate.user_id == user_id:
            associates.append({
                "id": associate.id,
                "name": associate.name,
                "association_id": assoc.id,
                "created_at": assoc.created_at
            })
    
    return associates


@router.post("/people/{person_id}/associates/{associate_id}")
async def create_person_association(
    person_id: UUID,
    associate_id: UUID,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id)
):
    # Verify both people exist and belong to user
    person = db.get(Person, person_id)
    associate = db.get(Person, associate_id)
    
    if not person or person.user_id != user_id:
        raise HTTPException(status_code=404, detail="Person not found")
    if not associate or associate.user_id != user_id:
        raise HTTPException(status_code=404, detail="Associate not found")
    
    # Check if association already exists
    query = select(PersonAssociation).where(
        PersonAssociation.person_id == person_id,
        PersonAssociation.associate_id == associate_id
    )
    existing = db.exec(query).first()
    
    if existing:
        return {"detail": "Association already exists"}
    
    # Create association
    association = PersonAssociation(
        person_id=person_id,
        associate_id=associate_id
    )
    db.add(association)
    db.commit()
    
    return {"detail": f"Associated {person.name} with {associate.name}"}


@router.delete("/people/associations/{association_id}")
async def delete_person_association(
    association_id: UUID,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id)
):
    association = db.get(PersonAssociation, association_id)
    if not association:
        raise HTTPException(status_code=404, detail="Association not found")
    
    # Verify the association belongs to user's people
    person = db.get(Person, association.person_id)
    if not person or person.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db.delete(association)
    db.commit()
    return {"detail": "Association deleted successfully"}


@router.get("/groups/associations")
async def get_group_associations(
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
    skip: int = 0,
    limit: int = 100
):
    query = select(GroupAssociation).where(GroupAssociation.user_id == user_id)
    query = query.offset(skip).limit(limit)
    associations = db.exec(query).all()
    return associations