"""Entity extraction and person management for NLP-powered contact creation."""
import re
from datetime import datetime, timedelta
from enum import Enum
from typing import List, Optional, Tuple
from uuid import UUID
from pydantic import BaseModel, field_validator, EmailStr
from sqlmodel import Session, select

from models import Person, NotebookEntry, Tag, PersonTag
from ai.client import GeminiClient
from ai.prompts import (
    INTENT_DETECTION_PROMPT,
    ENTITY_EXTRACTION_PROMPT,
    TAG_ASSIGNMENT_EXTRACTION_PROMPT,
    JOURNAL_ENTRY_EXTRACTION_PROMPT
)


class CRUDIntent(str, Enum):
    """Intent classification for user messages."""
    CREATE = "create"
    READ = "read"
    UPDATE_TAG = "update_tag"
    UPDATE_MEMORY = "update_memory"
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


class TagAssignment(BaseModel):
    """Extracted tag assignment from text."""
    people_names: List[str]
    tag_name: str
    operation: str = "add"


class MemoryUpdate(BaseModel):
    """Extracted memory entry for existing person."""
    person_name: str
    entry_content: str
    date: Optional[str] = "today"


class PersonMatch(BaseModel):
    """Single matched person."""
    person_id: UUID
    person_name: str
    similarity: float = 1.0


class PersonMatchResult(BaseModel):
    """Result of matching extracted name to existing people."""
    extracted_name: str
    matches: List[PersonMatch] = []  # Empty if no matches found
    is_ambiguous: bool = False  # True if multiple matches found


class TagAssignmentMatch(BaseModel):
    """Matched tag assignment ready for confirmation."""
    tag_name: str
    operation: str
    matched_people: List[PersonMatchResult]


class MemoryUpdateMatch(BaseModel):
    """Matched memory update ready for confirmation."""
    matched_person: PersonMatchResult
    entry_content: str
    parsed_date: str  # ISO format date


class ExtractionResponse(BaseModel):
    """Response from extraction endpoint."""
    intent: CRUDIntent
    message: Optional[str] = None
    people: Optional[List[PersonExtraction]] = None
    created_persons: Optional[List[dict]] = None  # List of created Person objects as dicts

    # For tag operations
    tag_assignments: Optional[List[TagAssignmentMatch]] = None

    # For memory entries
    memory_updates: Optional[List[MemoryUpdateMatch]] = None


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

    def extract_tag_assignments(self, narrative: str) -> List[TagAssignment]:
        """
        Extract tag assignment operations from text.

        Args:
            narrative: Text containing tag assignments

        Returns:
            List of TagAssignment objects
        """
        prompt = TAG_ASSIGNMENT_EXTRACTION_PROMPT.format(narrative=narrative)

        class TagAssignmentResult(BaseModel):
            assignments: List[TagAssignment]

        result = self.client.generate_structured(prompt, TagAssignmentResult)
        return result.assignments

    def extract_memory_entries(self, narrative: str) -> List[MemoryUpdate]:
        """
        Extract memory entries about existing people.

        Args:
            narrative: Text containing memory updates

        Returns:
            List of MemoryUpdate objects
        """
        prompt = JOURNAL_ENTRY_EXTRACTION_PROMPT.format(narrative=narrative)

        class MemoryResult(BaseModel):
            entries: List[MemoryUpdate]

        result = self.client.generate_structured(prompt, MemoryResult)
        return result.entries


class PersonManager:
    """Manages person creation and name matching."""

    def __init__(self, session: Session):
        self.session = session

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

    def find_by_name(self, name: str, user_id: UUID) -> List[Person]:
        """
        Find people by name using simple case-insensitive matching.

        Args:
            name: Name to search for
            user_id: User ID to scope the search

        Returns:
            List of Person objects, sorted by match quality:
            1. Exact match (case-insensitive)
            2. Starts with the search term
            3. Contains the search term
        """
        # Get all people for this user
        statement = select(Person).where(Person.user_id == user_id)
        existing_people = self.session.exec(statement).all()

        if not existing_people:
            return []

        name_lower = name.lower().strip()

        # Categorize matches
        exact_matches = []
        starts_with_matches = []
        contains_matches = []

        for person in existing_people:
            person_name_lower = person.name.lower()

            if person_name_lower == name_lower:
                exact_matches.append(person)
            elif person_name_lower.startswith(name_lower):
                starts_with_matches.append(person)
            elif name_lower in person_name_lower:
                contains_matches.append(person)

        # Return matches in priority order
        return exact_matches + starts_with_matches + contains_matches

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

    def match_person(self, name: str, user_id: UUID) -> PersonMatchResult:
        """
        Match extracted name to existing people using case-insensitive search.

        Returns all matches so frontend can handle disambiguation when needed.

        Args:
            name: Name to match
            user_id: User ID to scope the search

        Returns:
            PersonMatchResult with all matches, or empty if none found
        """
        people = self.find_by_name(name, user_id)

        if not people:
            # No matches found
            return PersonMatchResult(
                extracted_name=name,
                matches=[],
                is_ambiguous=False
            )

        # Convert to PersonMatch objects
        matches = []
        for person in people:
            # Use 1.0 for exact match, 0.8 for partial matches
            similarity = 1.0 if person.name.lower() == name.lower() else 0.8
            matches.append(PersonMatch(
                person_id=person.id,
                person_name=person.name,
                similarity=similarity
            ))

        return PersonMatchResult(
            extracted_name=name,
            matches=matches,
            is_ambiguous=len(matches) > 1
        )

    def assign_tags(
        self,
        person_ids: List[UUID],
        tag_name: str,
        user_id: UUID
    ) -> Tuple[Tag, List[Person]]:
        """
        Assign tag to multiple people (creates tag if doesn't exist).

        Args:
            person_ids: List of person IDs
            tag_name: Name of tag to assign
            user_id: User ID

        Returns:
            Tuple of (Tag, List of updated Person objects)
        """
        # Get or create tag
        statement = select(Tag).where(
            Tag.user_id == user_id,
            Tag.name == tag_name
        )
        tag = self.session.exec(statement).first()

        if not tag:
            tag = Tag(
                name=tag_name,
                user_id=user_id,
                category="general"
            )
            self.session.add(tag)
            self.session.commit()
            self.session.refresh(tag)

        # Assign tag to each person
        updated_people = []
        for person_id in person_ids:
            # Check if PersonTag already exists
            pt_statement = select(PersonTag).where(
                PersonTag.person_id == person_id,
                PersonTag.tag_id == tag.id
            )
            existing_pt = self.session.exec(pt_statement).first()

            if not existing_pt:
                # Create PersonTag relationship
                person_tag = PersonTag(
                    person_id=person_id,
                    tag_id=tag.id
                )
                self.session.add(person_tag)

            # Get person to return
            person = self.session.get(Person, person_id)
            if person:
                updated_people.append(person)

        self.session.commit()

        return tag, updated_people

    def add_journal_entry(
        self,
        person_id: UUID,
        content: str,
        date: str  # ISO format
    ) -> NotebookEntry:
        """
        Add journal entry for a person on a specific date.

        Args:
            person_id: ID of the person
            content: Journal entry content
            date: Date in ISO format (YYYY-MM-DD)

        Returns:
            NotebookEntry object
        """
        # Get or create entry for date
        statement = select(NotebookEntry).where(
            NotebookEntry.person_id == person_id,
            NotebookEntry.entry_date == date
        )
        entry = self.session.exec(statement).first()

        person = self.session.get(Person, person_id)
        if not person:
            raise ValueError(f"Person with id {person_id} not found")

        if not entry:
            entry = NotebookEntry(
                person_id=person_id,
                user_id=person.user_id,
                entry_date=date,
                content=content
            )
        else:
            # Append to existing entry
            if entry.content:
                entry.content = f"{entry.content}\n{content}"
            else:
                entry.content = content

        entry.updated_at = datetime.utcnow()
        self.session.add(entry)

        # Update last_contact_date if entry is for today
        if date == datetime.utcnow().date().isoformat():
            person.last_contact_date = datetime.utcnow()
            self.session.add(person)

        self.session.commit()
        self.session.refresh(entry)

        return entry


def parse_relative_date(date_str: Optional[str]) -> str:
    """
    Parse relative dates to ISO format.

    Args:
        date_str: Date string ("today", "yesterday", or ISO date)

    Returns:
        ISO format date string (YYYY-MM-DD)
    """
    if not date_str or date_str.lower() == "today":
        return datetime.utcnow().date().isoformat()

    if date_str.lower() == "yesterday":
        return (datetime.utcnow().date() - timedelta(days=1)).isoformat()

    # Try to parse as ISO date
    try:
        return datetime.fromisoformat(date_str).date().isoformat()
    except Exception:
        # Default to today if can't parse
        return datetime.utcnow().date().isoformat()
