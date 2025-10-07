from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from typing import List, Optional
from uuid import UUID

from database import get_db
from models import History, HistoryCreate, HistoryRead, ChangeTypeChoices
from routers.auth import get_current_user_id

router = APIRouter()


@router.get("/", response_model=List[HistoryRead])
async def get_history(
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
    person_id: Optional[UUID] = Query(None),
    change_type: Optional[ChangeTypeChoices] = Query(None),
    field: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 100
):
    query = select(History).where(History.user_id == user_id)
    
    if person_id:
        query = query.where(History.person_id == person_id)
    if change_type:
        query = query.where(History.change_type == change_type)
    if field:
        query = query.where(History.field == field)
    
    query = query.offset(skip).limit(limit).order_by(History.created_at.desc())
    history = db.exec(query).all()
    return history


@router.post("/", response_model=HistoryRead)
async def create_history(
    history: HistoryCreate,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id)
):
    db_history = History.from_orm(history)
    db_history.user_id = user_id
    db.add(db_history)
    db.commit()
    db.refresh(db_history)
    return db_history


@router.get("/{history_id}", response_model=HistoryRead)
async def get_history_entry(
    history_id: UUID,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id)
):
    history = db.get(History, history_id)
    if not history or history.user_id != user_id:
        raise HTTPException(status_code=404, detail="History entry not found")
    return history


@router.delete("/{history_id}")
async def delete_history_entry(
    history_id: UUID,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id)
):
    history = db.get(History, history_id)
    if not history or history.user_id != user_id:
        raise HTTPException(status_code=404, detail="History entry not found")
    
    db.delete(history)
    db.commit()
    return {"detail": "History entry deleted successfully"}