from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from typing import List, Optional
from uuid import UUID

from database import get_db
from models import Group, GroupCreate, GroupRead, Person, GroupAssociation
from routers.auth import get_current_user_id

router = APIRouter()


@router.get("/", response_model=List[GroupRead])
async def get_groups(
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
    search: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 100
):
    query = select(Group).where(Group.user_id == user_id)
    
    if search:
        query = query.where(
            Group.name.contains(search) | Group.description.contains(search)
        )
    
    query = query.offset(skip).limit(limit).order_by(Group.name)
    groups = db.exec(query).all()
    return groups


@router.post("/", response_model=GroupRead)
async def create_group(
    group: GroupCreate,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id)
):
    db_group = Group.from_orm(group)
    db_group.user_id = user_id
    db.add(db_group)
    db.commit()
    db.refresh(db_group)
    return db_group


@router.get("/{group_id}", response_model=GroupRead)
async def get_group(
    group_id: UUID,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id)
):
    group = db.get(Group, group_id)
    if not group or group.user_id != user_id:
        raise HTTPException(status_code=404, detail="Group not found")
    return group


@router.patch("/{group_id}", response_model=GroupRead)
async def update_group(
    group_id: UUID,
    group_update: GroupCreate,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id)
):
    group = db.get(Group, group_id)
    if not group or group.user_id != user_id:
        raise HTTPException(status_code=404, detail="Group not found")
    
    group_data = group_update.dict(exclude_unset=True)
    for key, value in group_data.items():
        setattr(group, key, value)
    
    db.add(group)
    db.commit()
    db.refresh(group)
    return group


@router.delete("/{group_id}")
async def delete_group(
    group_id: UUID,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id)
):
    group = db.get(Group, group_id)
    if not group or group.user_id != user_id:
        raise HTTPException(status_code=404, detail="Group not found")
    
    db.delete(group)
    db.commit()
    return {"detail": "Group deleted successfully"}


@router.get("/{group_id}/people", response_model=List[dict])
async def get_group_people(
    group_id: UUID,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id)
):
    group = db.get(Group, group_id)
    if not group or group.user_id != user_id:
        raise HTTPException(status_code=404, detail="Group not found")
    
    query = select(Person).join(GroupAssociation).where(
        GroupAssociation.group_id == group_id,
        GroupAssociation.user_id == user_id
    )
    people = db.exec(query).all()
    return people