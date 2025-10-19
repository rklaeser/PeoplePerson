from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
from uuid import UUID
from datetime import datetime

from database import get_db
from models import NotebookEntry, NotebookEntryCreate, NotebookEntryUpdate, NotebookEntryRead, Person
from routers.auth import get_current_user_id

router = APIRouter()


@router.get("/api/people/{person_id}/notebook", response_model=List[NotebookEntryRead])
async def get_notebook_entries(
    person_id: UUID,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id)
):
    """Get all notebook entries for a person, ordered newest first"""
    # Verify person exists and belongs to user
    person = db.get(Person, person_id)
    if not person or person.user_id != user_id:
        raise HTTPException(status_code=404, detail="Person not found")

    # Get entries ordered by creation time descending (newest first)
    query = select(NotebookEntry).where(
        NotebookEntry.person_id == person_id,
        NotebookEntry.user_id == user_id
    ).order_by(NotebookEntry.created_at.desc())

    entries = db.exec(query).all()
    return entries


@router.post("/api/people/{person_id}/notebook", response_model=NotebookEntryRead)
async def create_notebook_entry(
    person_id: UUID,
    entry: NotebookEntryCreate,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id)
):
    """Create a new notebook entry for a person"""
    # Verify person exists and belongs to user
    person = db.get(Person, person_id)
    if not person or person.user_id != user_id:
        raise HTTPException(status_code=404, detail="Person not found")

    # Create the entry
    db_entry = NotebookEntry(
        person_id=person_id,
        user_id=user_id,
        entry_date=entry.entry_date,
        content=entry.content
    )

    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry


@router.put("/api/people/{person_id}/notebook/{entry_id}", response_model=NotebookEntryRead)
async def update_notebook_entry(
    person_id: UUID,
    entry_id: UUID,
    entry_update: NotebookEntryUpdate,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id)
):
    """Update a notebook entry (only content is editable)"""
    # Get the entry
    db_entry = db.get(NotebookEntry, entry_id)

    # Verify entry exists and belongs to the right person and user
    if not db_entry or db_entry.person_id != person_id or db_entry.user_id != user_id:
        raise HTTPException(status_code=404, detail="Notebook entry not found")

    # Update only the content field (date is immutable)
    if entry_update.content is not None:
        db_entry.content = entry_update.content
        db_entry.updated_at = datetime.utcnow()

    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry


@router.delete("/api/people/{person_id}/notebook/{entry_id}")
async def delete_notebook_entry(
    person_id: UUID,
    entry_id: UUID,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id)
):
    """Delete a notebook entry"""
    # Get the entry
    db_entry = db.get(NotebookEntry, entry_id)

    # Verify entry exists and belongs to the right person and user
    if not db_entry or db_entry.person_id != person_id or db_entry.user_id != user_id:
        raise HTTPException(status_code=404, detail="Notebook entry not found")

    db.delete(db_entry)
    db.commit()
    return {"detail": "Notebook entry deleted successfully"}
