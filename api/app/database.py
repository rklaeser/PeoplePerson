from sqlalchemy import create_engine, Column, String, DateTime, Text, Integer, ForeignKey, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from app.config import DATABASE_URL
import enum

# Create SQLAlchemy engine
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Enums matching Sequelize models
class IntentEnum(str, enum.Enum):
    ROMANTIC = 'romantic'
    CORE = 'core'
    ARCHIVE = 'archive'
    NEW = 'new'
    INVEST = 'invest'
    ASSOCIATE = 'associate'

class ChangeTypeEnum(str, enum.Enum):
    PROMPT = 'prompt'
    MANUAL = 'manual'

class Person(Base):
    __tablename__ = "people"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    body = Column(Text, nullable=False, default='Add a description')
    intent = Column(String, nullable=False, default='new')
    birthday = Column(String)  # DATEONLY stored as string
    mnemonic = Column(String)
    zip = Column(String)  # ZIP/postal code
    profile_pic_index = Column(Integer, nullable=False, default=0)
    userId = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", backref="people")
    history_entries = relationship("History", back_populates="person")
    groups = relationship("Group", secondary="groupAssociations", back_populates="people")

class Group(Base):
    __tablename__ = "groups"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    description = Column(Text)
    userId = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", backref="groups")
    people = relationship("Person", secondary="groupAssociations", back_populates="groups")

class History(Base):
    __tablename__ = "history"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    personId = Column(UUID(as_uuid=True), ForeignKey('people.id'), nullable=False)
    changeType = Column(String, nullable=False)
    field = Column(String, nullable=False)
    detail = Column(Text, nullable=False)
    userId = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", backref="history_entries")
    person = relationship("Person", back_populates="history_entries")

class GroupAssociation(Base):
    __tablename__ = "groupAssociations"
    
    personId = Column(UUID(as_uuid=True), ForeignKey('people.id'), primary_key=True)
    groupId = Column(UUID(as_uuid=True), ForeignKey('groups.id'), primary_key=True)
    userId = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User")

class PersonAssociation(Base):
    __tablename__ = "personAssociations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    personId = Column(UUID(as_uuid=True), ForeignKey('people.id'), nullable=False)
    associateId = Column(UUID(as_uuid=True), ForeignKey('people.id'), nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# User Model - Firebase auth only
class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    firebase_uid = Column(String(255), unique=True, nullable=False)  # Firebase UID
    name = Column(String(255))
    email = Column(String(255), unique=True)
    email_verified = Column(DateTime)  # Firebase email verification timestamp
    image = Column(Text)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()