"""Entity extraction and person management for NLP-powered contact creation."""
import re
from datetime import datetime
from enum import Enum
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, field_validator, EmailStr
from sqlmodel import Session, select
from sentence_transformers import SentenceTransformer

from models import Person, NotebookEntry
from ai.client import GeminiClient
from ai.prompts import INTENT_DETECTION_PROMPT, ENTITY_EXTRACTION_PROMPT


class CRUDIntent(str, Enum):
    """Intent classification for user messages."""
    CREATE = "create"
    READ = "read"
    UPDATE = "update"
    NONE = "none"


class IntentAnalysis(BaseModel):
    """Result of intent detection."""
    intent: CRUDIntent
    is_create_request: bool

    @field_validator('is_create_request', mode='before')
    @classmethod
    def compute_is_create(cls, v, info):
        """Automatically compute is_create_request from intent."""
        if 'intent' in info.data:
            return info.data['intent'] == CRUDIntent.CREATE
        return v


class PersonExtraction(BaseModel):
    """Extracted person data from narrative."""
    name: str
    attributes: Optional[str] = None
    email: Optional[str] = None
    phone_number: Optional[str] = None

    @field_validator('name')
    @classmethod
    def validate_name(cls, v):
        """Validate name length."""
        if not v or len(v.strip()) < 2:
            raise ValueError("Name must be at least 2 characters")
        if len(v) > 100:
            raise ValueError("Name must be less than 100 characters")
        return v.strip()

    @field_validator('email')
    @classmethod
    def normalize_email(cls, v):
        """Normalize email to lowercase."""
        if v:
            return v.lower().strip()
        return v

    @field_validator('phone_number')
    @classmethod
    def validate_phone(cls, v):
        """Basic phone validation - just store as text for v1."""
        # For v1, we'll be lenient and just clean up the format
        # Accept common patterns like: 123-456-7890, (123) 456-7890, 123.456.7890, +1-123-456-7890
        if v:
            # Just validate it has some digits
            if not re.search(r'\d', v):
                raise ValueError("Phone number must contain digits")
            return v.strip()
        return v


class DuplicateWarning(BaseModel):
    """Warning about potential duplicate person."""
    extraction: PersonExtraction
    existing_id: UUID
    existing_name: str
    existing_notes: Optional[str] = None
    similarity: float


class ExtractionResponse(BaseModel):
    """Response from extraction endpoint."""
    intent: CRUDIntent
    message: Optional[str] = None
    people: Optional[List[PersonExtraction]] = None
    duplicates: Optional[List[DuplicateWarning]] = None
    created_persons: Optional[List[dict]] = None  # List of created Person objects as dicts


class PersonExtractor:
    """Extracts people and attributes from narrative text."""

    def __init__(self):
        self.client = GeminiClient()

    def detect_intent(self, narrative: str) -> IntentAnalysis:
        """
        Detect the intent of the user's message.

        Args:
            narrative: User's message

        Returns:
            IntentAnalysis with the classified intent
        """
        prompt = INTENT_DETECTION_PROMPT.format(user_message=narrative)
        return self.client.generate_structured(prompt, IntentAnalysis)

    def extract(self, narrative: str) -> List[PersonExtraction]:
        """
        Extract people from narrative text.

        Args:
            narrative: Text containing information about people

        Returns:
            List of PersonExtraction objects
        """
        prompt = ENTITY_EXTRACTION_PROMPT.format(narrative=narrative)

        # For extraction, we'll use a list response schema
        class ExtractionResult(BaseModel):
            people: List[PersonExtraction]

        result = self.client.generate_structured(prompt, ExtractionResult)
        return result.people


class PersonManager:
    """Manages person creation and duplicate detection."""

    def __init__(self, session: Session):
        self.session = session
        # Initialize sentence transformer for similarity
        self.model = SentenceTransformer('all-mpnet-base-v2')
        self.duplicate_threshold = 0.85

    def get_or_create_today_entry(
        self,
        person_id: UUID,
        user_id: UUID
    ) -> NotebookEntry:
        """
        Get today's notebook entry or create if doesn't exist.

        Note: Uses UTC date. This means entries are created based on server time.

        Args:
            person_id: ID of the person
            user_id: ID of the user

        Returns:
            NotebookEntry for today
        """
        today = datetime.utcnow().date().isoformat()

        statement = select(NotebookEntry).where(
            NotebookEntry.person_id == person_id,
            NotebookEntry.entry_date == today
        )
        entry = self.session.exec(statement).first()

        if not entry:
            entry = NotebookEntry(
                person_id=person_id,
                user_id=user_id,
                entry_date=today,
                content=""
            )
            self.session.add(entry)
            self.session.commit()
            self.session.refresh(entry)

        return entry

    def find_similar(self, name: str, user_id: UUID) -> Optional[tuple[Person, float]]:
        """
        Find similar existing person for duplicate detection.

        Args:
            name: Name to search for
            user_id: User ID to scope the search

        Returns:
            Tuple of (Person, similarity_score) if similar person found, None otherwise
        """
        # Get all people for this user
        statement = select(Person).where(Person.user_id == user_id)
        existing_people = self.session.exec(statement).all()

        if not existing_people:
            return None

        # Encode the query name
        query_embedding = self.model.encode([name])[0]

        # Find most similar person
        best_match = None
        best_similarity = 0.0

        for person in existing_people:
            person_embedding = self.model.encode([person.name])[0]

            # Calculate cosine similarity
            similarity = float(
                query_embedding.dot(person_embedding) /
                (sum(query_embedding**2)**0.5 * sum(person_embedding**2)**0.5)
            )

            if similarity > best_similarity:
                best_similarity = similarity
                best_match = person

        # Return match if above threshold
        if best_match and best_similarity >= self.duplicate_threshold:
            return (best_match, best_similarity)

        return None

    def create_person(
        self,
        extraction: PersonExtraction,
        user_id: UUID
    ) -> Person:
        """
        Create a new Person from extraction and create initial notebook entry.

        Args:
            extraction: PersonExtraction data
            user_id: User ID

        Returns:
            Created Person object
        """
        person = Person(
            name=extraction.name,
            body="",  # Deprecated - use notebook_entries instead
            user_id=user_id,
            intent="new",  # All AI-created persons start with intent="new"
            email=extraction.email,
            phone_number=extraction.phone_number
        )

        self.session.add(person)
        self.session.commit()
        self.session.refresh(person)

        # Create first notebook entry if attributes exist
        if extraction.attributes:
            today = datetime.utcnow().date().isoformat()
            entry = NotebookEntry(
                person_id=person.id,
                user_id=user_id,
                entry_date=today,
                content=extraction.attributes
            )
            self.session.add(entry)
            self.session.commit()

        return person

    def link_to_existing(
        self,
        extraction: PersonExtraction,
        existing_id: UUID
    ) -> Person:
        """
        Link extraction to existing person by appending to today's notebook entry.

        Args:
            extraction: PersonExtraction data
            existing_id: ID of existing person to update

        Returns:
            Updated Person object
        """
        person = self.session.get(Person, existing_id)
        if not person:
            raise ValueError(f"Person with id {existing_id} not found")

        # Get or create today's entry and append new attributes
        if extraction.attributes:
            entry = self.get_or_create_today_entry(existing_id, person.user_id)

            # Append new attributes
            if entry.content:
                entry.content = f"{entry.content}\n{extraction.attributes}"
            else:
                entry.content = extraction.attributes

            entry.updated_at = datetime.utcnow()
            self.session.add(entry)

        # Update phone if provided and not already set
        if extraction.phone_number and not person.phone_number:
            person.phone_number = extraction.phone_number
            self.session.add(person)

        self.session.commit()
        self.session.refresh(person)

        return person
