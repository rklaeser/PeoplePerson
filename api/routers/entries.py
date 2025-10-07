from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlmodel import Session, select
from typing import List, Optional
from uuid import UUID

from database import get_db
from models import Entry, EntryCreate, EntryRead, EntryPerson, Person, ProcessingStatus
from routers.auth import get_current_user_id

router = APIRouter()


async def process_entry_with_ai(entry_id: UUID, user_id: UUID, db: Session):
    """Background task to process entry with AI"""
    # Update status to processing
    entry = db.get(Entry, entry_id)
    if entry:
        entry.processing_status = ProcessingStatus.PROCESSING
        db.add(entry)
        db.commit()
        
        # TODO: Integrate with AI service for processing
        # For now, just mark as completed
        entry.processing_status = ProcessingStatus.COMPLETED
        entry.processing_result = "Processing completed"
        db.add(entry)
        db.commit()


@router.get("/", response_model=List[EntryRead])
async def get_entries(
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
    skip: int = 0,
    limit: int = 100
):
    query = select(Entry).where(Entry.user_id == user_id)
    query = query.offset(skip).limit(limit).order_by(Entry.created_at.desc())
    entries = db.exec(query).all()
    return entries


@router.post("/", response_model=EntryRead)
async def create_entry(
    entry: EntryCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id)
):
    db_entry = Entry.from_orm(entry)
    db_entry.user_id = user_id
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    
    # Queue background processing
    background_tasks.add_task(process_entry_with_ai, db_entry.id, user_id, db)
    
    return db_entry


@router.get("/{entry_id}", response_model=EntryRead)
async def get_entry(
    entry_id: UUID,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id)
):
    entry = db.get(Entry, entry_id)
    if not entry or entry.user_id != user_id:
        raise HTTPException(status_code=404, detail="Entry not found")
    return entry


@router.delete("/{entry_id}")
async def delete_entry(
    entry_id: UUID,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id)
):
    entry = db.get(Entry, entry_id)
    if not entry or entry.user_id != user_id:
        raise HTTPException(status_code=404, detail="Entry not found")
    
    db.delete(entry)
    db.commit()
    return {"detail": "Entry deleted successfully"}


@router.get("/{entry_id}/people")
async def get_entry_people(
    entry_id: UUID,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id)
):
    entry = db.get(Entry, entry_id)
    if not entry or entry.user_id != user_id:
        raise HTTPException(status_code=404, detail="Entry not found")
    
    query = select(Person).join(EntryPerson).where(EntryPerson.entry_id == entry_id)
    people = db.exec(query).all()
    return people


@router.post("/{entry_id}/people/{person_id}")
async def add_person_to_entry(
    entry_id: UUID,
    person_id: UUID,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id)
):
    # Verify entry and person exist and belong to user
    entry = db.get(Entry, entry_id)
    person = db.get(Person, person_id)
    
    if not entry or entry.user_id != user_id:
        raise HTTPException(status_code=404, detail="Entry not found")
    if not person or person.user_id != user_id:
        raise HTTPException(status_code=404, detail="Person not found")
    
    # Check if association already exists
    query = select(EntryPerson).where(
        EntryPerson.entry_id == entry_id,
        EntryPerson.person_id == person_id
    )
    existing = db.exec(query).first()
    
    if existing:
        return {"detail": f"{person.name} already associated with entry"}
    
    # Create association
    association = EntryPerson(entry_id=entry_id, person_id=person_id)
    db.add(association)
    db.commit()
    
    return {"detail": f"Added {person.name} to entry"}


@router.delete("/{entry_id}/people/{person_id}")
async def remove_person_from_entry(
    entry_id: UUID,
    person_id: UUID,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id)
):
    # Verify entry belongs to user
    entry = db.get(Entry, entry_id)
    if not entry or entry.user_id != user_id:
        raise HTTPException(status_code=404, detail="Entry not found")
    
    query = select(EntryPerson).where(
        EntryPerson.entry_id == entry_id,
        EntryPerson.person_id == person_id
    )
    association = db.exec(query).first()
    
    if not association:
        raise HTTPException(status_code=404, detail="Person not associated with this entry")
    
    db.delete(association)
    db.commit()
    return {"detail": "Person removed from entry"}


@router.post("/{entry_id}/process")
async def process_entry(
    entry_id: UUID,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id)
):
    entry = db.get(Entry, entry_id)
    if not entry or entry.user_id != user_id:
        raise HTTPException(status_code=404, detail="Entry not found")
    
    # Queue background processing
    background_tasks.add_task(process_entry_with_ai, entry_id, user_id, db)
    
    return {
        "detail": "Entry processing started",
        "entry_id": entry_id,
        "status": "processing"
    }