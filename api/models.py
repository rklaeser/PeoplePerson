from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import datetime
from uuid import UUID, uuid4
from enum import Enum
from pydantic import field_validator


class IntentChoices(str, Enum):
    CORE = "core"
    ARCHIVE = "archive"
    NEW = "new"
    DEVELOP = "develop"      # Was "invest" - clearer action
    CASUAL = "casual"        # Was "associate" - clearer meaning


class ChangeTypeChoices(str, Enum):
    PROMPT = "prompt"
    MANUAL = "manual"


class ProcessingStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class UserBase(SQLModel):
    firebase_uid: str = Field(unique=True, index=True)
    name: Optional[str] = None
    email: Optional[str] = Field(default=None, unique=True, index=True)
    email_verified: Optional[datetime] = None
    image: Optional[str] = None


class User(UserBase, table=True):
    __tablename__ = "users"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow, sa_column_kwargs={"name": "createdAt"})
    updated_at: datetime = Field(default_factory=datetime.utcnow, sa_column_kwargs={"name": "updatedAt"})
    
    people: List["Person"] = Relationship(back_populates="user", cascade_delete=True)
    tags: List["Tag"] = Relationship(back_populates="user", cascade_delete=True)
    history_entries: List["History"] = Relationship(back_populates="user", cascade_delete=True)
    entries: List["Entry"] = Relationship(back_populates="user", cascade_delete=True)
    messages: List["Message"] = Relationship(back_populates="user", cascade_delete=True)
    notebook_entries: List["NotebookEntry"] = Relationship(back_populates="user", cascade_delete=True)


class PersonBase(SQLModel):
    name: str
    body: str = Field(default="Add a description")
    birthday: Optional[str] = None
    mnemonic: Optional[str] = None
    zip: Optional[str] = None
    profile_pic_index: int = Field(default=0)
    email: Optional[str] = None
    phone_number: Optional[str] = None
    last_contact_date: datetime = Field(default_factory=datetime.utcnow)

    # Location fields
    street_address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class Person(PersonBase, table=True):
    __tablename__ = "people"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="users.id", sa_column_kwargs={"name": "userId"})
    created_at: datetime = Field(default_factory=datetime.utcnow, sa_column_kwargs={"name": "createdAt"})
    updated_at: datetime = Field(default_factory=datetime.utcnow, sa_column_kwargs={"name": "updatedAt"})
    
    user: User = Relationship(back_populates="people")
    history_entries: List["History"] = Relationship(back_populates="person", cascade_delete=True)
    person_tags: List["PersonTag"] = Relationship(back_populates="person", cascade_delete=True)
    person_associations_from: List["PersonAssociation"] = Relationship(
        back_populates="person",
        cascade_delete=True,
        sa_relationship_kwargs={"foreign_keys": "[PersonAssociation.person_id]"}
    )
    person_associations_to: List["PersonAssociation"] = Relationship(
        back_populates="associate",
        cascade_delete=True,
        sa_relationship_kwargs={"foreign_keys": "[PersonAssociation.associate_id]"}
    )
    entry_associations: List["EntryPerson"] = Relationship(back_populates="person", cascade_delete=True)
    messages: List["Message"] = Relationship(back_populates="person", cascade_delete=True)
    notebook_entries: List["NotebookEntry"] = Relationship(back_populates="person", cascade_delete=True)


class TagBase(SQLModel):
    name: str = Field(min_length=1)
    category: str = Field(default="general")
    color: Optional[str] = None
    description: Optional[str] = None

    # Location fields
    street_address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    @field_validator('name')
    @classmethod
    def validate_name(cls, v):
        if not v or not v.strip():
            raise ValueError('Tag name cannot be empty or whitespace only')
        return v.strip()


class Tag(TagBase, table=True):
    __tablename__ = "tags"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="users.id", sa_column_kwargs={"name": "userId"})
    created_at: datetime = Field(default_factory=datetime.utcnow, sa_column_kwargs={"name": "createdAt"})
    updated_at: datetime = Field(default_factory=datetime.utcnow, sa_column_kwargs={"name": "updatedAt"})
    
    user: User = Relationship(back_populates="tags")
    person_tags: List["PersonTag"] = Relationship(back_populates="tag", cascade_delete=True)


class HistoryBase(SQLModel):
    change_type: ChangeTypeChoices = Field(sa_column_kwargs={"name": "changeType"})
    field: str
    detail: str


class History(HistoryBase, table=True):
    __tablename__ = "history"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    person_id: UUID = Field(foreign_key="people.id", sa_column_kwargs={"name": "personId"})
    user_id: UUID = Field(foreign_key="users.id", sa_column_kwargs={"name": "userId"})
    created_at: datetime = Field(default_factory=datetime.utcnow, sa_column_kwargs={"name": "createdAt"})
    updated_at: datetime = Field(default_factory=datetime.utcnow, sa_column_kwargs={"name": "updatedAt"})
    
    person: Person = Relationship(back_populates="history_entries")
    user: User = Relationship(back_populates="history_entries")


class PersonTag(SQLModel, table=True):
    __tablename__ = "personTags"
    
    person_id: UUID = Field(foreign_key="people.id", primary_key=True, sa_column_kwargs={"name": "personId"})
    tag_id: UUID = Field(foreign_key="tags.id", primary_key=True, sa_column_kwargs={"name": "tagId"})
    created_at: datetime = Field(default_factory=datetime.utcnow, sa_column_kwargs={"name": "createdAt"})
    updated_at: datetime = Field(default_factory=datetime.utcnow, sa_column_kwargs={"name": "updatedAt"})
    
    person: Person = Relationship(back_populates="person_tags")
    tag: Tag = Relationship(back_populates="person_tags")


class PersonAssociation(SQLModel, table=True):
    __tablename__ = "personAssociations"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    person_id: UUID = Field(foreign_key="people.id", sa_column_kwargs={"name": "personId"})
    associate_id: UUID = Field(foreign_key="people.id", sa_column_kwargs={"name": "associateId"})
    created_at: datetime = Field(default_factory=datetime.utcnow, sa_column_kwargs={"name": "createdAt"})
    updated_at: datetime = Field(default_factory=datetime.utcnow, sa_column_kwargs={"name": "updatedAt"})
    
    person: Person = Relationship(
        back_populates="person_associations_from",
        sa_relationship_kwargs={"foreign_keys": "[PersonAssociation.person_id]"}
    )
    associate: Person = Relationship(
        back_populates="person_associations_to",
        sa_relationship_kwargs={"foreign_keys": "[PersonAssociation.associate_id]"}
    )


class EntryBase(SQLModel):
    content: str
    processing_status: ProcessingStatus = Field(default=ProcessingStatus.PENDING)
    processing_result: Optional[str] = None


class Entry(EntryBase, table=True):
    __tablename__ = "entries"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="users.id", sa_column_kwargs={"name": "userId"})
    created_at: datetime = Field(default_factory=datetime.utcnow, sa_column_kwargs={"name": "createdAt"})
    updated_at: datetime = Field(default_factory=datetime.utcnow, sa_column_kwargs={"name": "updatedAt"})
    
    user: User = Relationship(back_populates="entries")
    entry_people: List["EntryPerson"] = Relationship(back_populates="entry", cascade_delete=True)


class EntryPerson(SQLModel, table=True):
    __tablename__ = "entryPeople"
    
    entry_id: UUID = Field(foreign_key="entries.id", primary_key=True, sa_column_kwargs={"name": "entryId"})
    person_id: UUID = Field(foreign_key="people.id", primary_key=True, sa_column_kwargs={"name": "personId"})
    created_at: datetime = Field(default_factory=datetime.utcnow, sa_column_kwargs={"name": "createdAt"})
    updated_at: datetime = Field(default_factory=datetime.utcnow, sa_column_kwargs={"name": "updatedAt"})
    
    entry: Entry = Relationship(back_populates="entry_people")
    person: Person = Relationship(back_populates="entry_associations")


# Pydantic models for API requests/responses
class UserCreate(UserBase):
    pass


class UserRead(UserBase):
    id: UUID
    created_at: datetime
    updated_at: datetime


class PersonCreate(PersonBase):
    pass


class PersonUpdate(SQLModel):
    name: Optional[str] = None
    body: Optional[str] = None
    birthday: Optional[str] = None
    mnemonic: Optional[str] = None
    zip: Optional[str] = None
    profile_pic_index: Optional[int] = None
    email: Optional[str] = None
    phone_number: Optional[str] = None
    last_contact_date: Optional[datetime] = None
    street_address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class PersonRead(PersonBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
    latest_notebook_entry_content: Optional[str] = None
    latest_notebook_entry_time: Optional[datetime] = None

    # Computed health score fields
    health_score: int = 0
    health_status: str = "healthy"
    health_emoji: str = "🌳"
    days_since_contact: int = 0

    # Tags
    tags: List["TagRead"] = []


class TagCreate(TagBase):
    pass


class TagUpdate(SQLModel):
    name: Optional[str] = None
    category: Optional[str] = None
    color: Optional[str] = None
    description: Optional[str] = None
    street_address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class TagRead(TagBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime


class HistoryCreate(HistoryBase):
    person_id: UUID


class HistoryRead(HistoryBase):
    id: UUID
    person_id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime


class EntryCreate(EntryBase):
    pass


class EntryRead(EntryBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime


class MessageDirection(str, Enum):
    INBOUND = "inbound"
    OUTBOUND = "outbound"


class MessageBase(SQLModel):
    body: str
    direction: MessageDirection


class Message(MessageBase, table=True):
    __tablename__ = "messages"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    person_id: UUID = Field(foreign_key="people.id", sa_column_kwargs={"name": "personId"})
    user_id: UUID = Field(foreign_key="users.id", sa_column_kwargs={"name": "userId"})
    created_at: datetime = Field(default_factory=datetime.utcnow, sa_column_kwargs={"name": "createdAt"})
    updated_at: datetime = Field(default_factory=datetime.utcnow, sa_column_kwargs={"name": "updatedAt"})
    sent_at: datetime = Field(default_factory=datetime.utcnow, sa_column_kwargs={"name": "sentAt"})
    
    person: Person = Relationship(back_populates="messages")
    user: User = Relationship(back_populates="messages")


class MessageCreate(MessageBase):
    person_id: UUID


class SMSSendRequest(SQLModel):
    person_id: UUID
    body: str


class MessageRead(MessageBase):
    id: UUID
    person_id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
    sent_at: datetime


# Notebook Entries
class NotebookEntryBase(SQLModel):
    entry_date: str  # YYYY-MM-DD format (immutable after creation)
    content: str


class NotebookEntry(NotebookEntryBase, table=True):
    __tablename__ = "notebookEntries"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    person_id: UUID = Field(foreign_key="people.id", sa_column_kwargs={"name": "personId"})
    user_id: UUID = Field(foreign_key="users.id", sa_column_kwargs={"name": "userId"})
    created_at: datetime = Field(default_factory=datetime.utcnow, sa_column_kwargs={"name": "createdAt"})
    updated_at: datetime = Field(default_factory=datetime.utcnow, sa_column_kwargs={"name": "updatedAt"})

    person: "Person" = Relationship(back_populates="notebook_entries")
    user: "User" = Relationship(back_populates="notebook_entries")


class NotebookEntryCreate(NotebookEntryBase):
    pass


class NotebookEntryUpdate(SQLModel):
    content: Optional[str] = None  # Only content is editable, date is immutable


class NotebookEntryRead(NotebookEntryBase):
    id: UUID
    person_id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime