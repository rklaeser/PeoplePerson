"""AI-powered contact extraction endpoints."""
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel

from database import get_db
from routers.auth import get_current_user_id
from ai.extractor import (
    PersonExtractor,
    PersonManager,
    PersonExtraction,
    ExtractionResponse,
    CRUDIntent,
    TagAssignmentMatch,
    MemoryUpdateMatch,
    parse_relative_date
)
from models import PersonRead, TagRead, NotebookEntryRead, Person

logger = logging.getLogger(__name__)
router = APIRouter()


class NarrativeRequest(BaseModel):
    """Request for extracting people from narrative."""
    narrative: str


class ConfirmPersonRequest(BaseModel):
    """Request for confirming person creation or linking."""
    extraction: PersonExtraction
    action: str  # "create_new" or "link_existing"
    existing_id: Optional[UUID] = None


@router.post("/extract-people", response_model=ExtractionResponse)
async def extract_people(
    request: NarrativeRequest,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id)
):
    """
    Extract people from narrative text.

    Process flow:
    1. Detect intent
    2. If intent != CREATE, return rejection message
    3. If intent == CREATE, extract people
    4. Check for duplicates
    5. Return results or duplicate warnings

    Args:
        request: Narrative text to extract from
        db: Database session
        user_id: Current user ID

    Returns:
        ExtractionResponse with intent, people, and/or duplicates
    """
    try:
        # Validate input length (prevent abuse)
        if len(request.narrative) > 1000:
            raise HTTPException(
                status_code=400,
                detail="Narrative too long. Please limit to 1000 characters."
            )

        if not request.narrative.strip():
            raise HTTPException(
                status_code=400,
                detail="Narrative cannot be empty."
            )

        # Initialize extractors
        extractor = PersonExtractor()
        manager = PersonManager(db)

        # Step 1: Detect intent
        intent_analysis = extractor.detect_intent(request.narrative)

        # Step 2: Handle UPDATE_TAG intent
        if intent_analysis.intent == CRUDIntent.UPDATE_TAG:
            try:
                assignments = extractor.extract_tag_assignments(request.narrative)
            except Exception as e:
                logger.error(f"Tag extraction failed: {str(e)}")
                return ExtractionResponse(
                    intent=intent_analysis.intent,
                    message=f"Sorry, I had trouble processing that. Error: {str(e)[:200]}"
                )

            if not assignments:
                return ExtractionResponse(
                    intent=intent_analysis.intent,
                    message="I didn't catch any tag assignments in that message. Try something like 'Add Jane to the Work tag.'"
                )

            # Match people names to existing people
            matched_assignments = []
            for assignment in assignments:
                logger.info(f"Tag assignment - people_names extracted: {assignment.people_names}")
                matched_people = [
                    manager.match_person(name, user_id)
                    for name in assignment.people_names
                ]
                for mp in matched_people:
                    logger.info(f"Match result for '{mp.extracted_name}': found {len(mp.matches)} matches, ambiguous={mp.is_ambiguous}")
                matched_assignments.append(TagAssignmentMatch(
                    tag_name=assignment.tag_name,
                    operation=assignment.operation,
                    matched_people=matched_people
                ))

            return ExtractionResponse(
                intent=intent_analysis.intent,
                tag_assignments=matched_assignments
            )

        # Step 3: Handle UPDATE_MEMORY intent
        if intent_analysis.intent == CRUDIntent.UPDATE_MEMORY:
            try:
                entries = extractor.extract_memory_entries(request.narrative)
            except Exception as e:
                logger.error(f"Memory extraction failed: {str(e)}")
                return ExtractionResponse(
                    intent=intent_analysis.intent,
                    message=f"Sorry, I had trouble processing that. Error: {str(e)[:200]}"
                )

            if not entries:
                return ExtractionResponse(
                    intent=intent_analysis.intent,
                    message="I didn't catch any memories in that message. Try something like 'I saw Sarah today. She mentioned her new job.'"
                )

            # Match people and parse dates
            matched_updates = []
            for entry in entries:
                matched_person = manager.match_person(entry.person_name, user_id)
                parsed_date = parse_relative_date(entry.date)

                matched_updates.append(MemoryUpdateMatch(
                    matched_person=matched_person,
                    entry_content=entry.entry_content,
                    parsed_date=parsed_date
                ))

            return ExtractionResponse(
                intent=intent_analysis.intent,
                memory_updates=matched_updates
            )

        # Step 4: If not CREATE intent, return rejection
        if not intent_analysis.is_create_request:
            return ExtractionResponse(
                intent=intent_analysis.intent,
                message="I'm not sure how to help with that. I can add friends, update tags, and record memories!"
            )

        # Step 5: Extract people
        try:
            people = extractor.extract(request.narrative)
        except Exception as e:
            logger.error(f"Person extraction failed: {str(e)}")
            return ExtractionResponse(
                intent=CRUDIntent.CREATE,
                message=f"Sorry, I had trouble processing that. Error: {str(e)[:200]}"
            )

        if not people:
            return ExtractionResponse(
                intent=CRUDIntent.NONE,
                message="I didn't find any people in that message. Try describing someone you met!"
            )

        # Step 4: Create all people immediately (no duplicate detection)
        created_people = []
        for person_extraction in people:
            person = manager.create_person(person_extraction, user_id)
            created_people.append(person)

        # Convert Person objects to dicts for JSON serialization
        created_persons_data = [
            {
                'id': str(p.id),
                'name': p.name,
                'body': p.body,
                'birthday': p.birthday,
                'mnemonic': p.mnemonic,
                'zip': p.zip,
                'profile_pic_index': p.profile_pic_index,
                'email': p.email,
                'phone_number': p.phone_number,
                'user_id': str(p.user_id),
                'created_at': p.created_at.isoformat(),
                'updated_at': p.updated_at.isoformat(),
            }
            for p in created_people
        ]

        contact_word = "contact" if len(created_people) == 1 else "contacts"
        return ExtractionResponse(
            intent=intent_analysis.intent,
            people=people,
            message=f"Great! I added {len(created_people)} new {contact_word} for you.",
            created_persons=created_persons_data
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error processing narrative: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error processing narrative: {str(e)}"
        )


@router.post("/confirm-person", response_model=PersonRead)
async def confirm_person(
    request: ConfirmPersonRequest,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id)
):
    """
    Confirm person creation or link to existing.

    Args:
        request: Confirmation request with extraction and action
        db: Database session
        user_id: Current user ID

    Returns:
        Created or updated Person
    """
    try:
        manager = PersonManager(db)

        if request.action == "create_new":
            # Create new person
            person = manager.create_person(request.extraction, user_id)
            return PersonRead.model_validate(person)

        elif request.action == "link_existing":
            # Link to existing person
            if not request.existing_id:
                raise HTTPException(
                    status_code=400,
                    detail="existing_id required for link_existing action"
                )

            person = manager.link_to_existing(request.extraction, request.existing_id)
            return PersonRead.model_validate(person)

        else:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid action: {request.action}. Must be 'create_new' or 'link_existing'"
            )

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error confirming person: {str(e)}"
        )


class ConfirmTagAssignmentRequest(BaseModel):
    """Request to confirm tag assignment."""
    tag_name: str
    operation: str  # "add"
    person_ids: List[UUID]


class ConfirmMemoryEntryRequest(BaseModel):
    """Request to confirm memory entry."""
    person_id: Optional[UUID] = None
    person_name: Optional[str] = None  # Used when creating new person
    content: str
    date: str  # ISO format


@router.post("/confirm-tag-assignment")
async def confirm_tag_assignment(
    request: ConfirmTagAssignmentRequest,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id)
):
    """
    Execute confirmed tag assignment.

    Args:
        request: Tag assignment confirmation
        db: Database session
        user_id: Current user ID

    Returns:
        Success message with tag and people data
    """
    try:
        manager = PersonManager(db)

        if request.operation == "add":
            tag, people = manager.assign_tags(
                request.person_ids,
                request.tag_name,
                user_id
            )

            people_word = "person" if len(people) == 1 else "people"
            return {
                "message": f"Done! I added the '{tag.name}' tag to {len(people)} {people_word}.",
                "tag": TagRead.model_validate(tag),
                "people": [PersonRead.model_validate(p) for p in people]
            }
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported operation: {request.operation}"
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error confirming tag assignment: {str(e)}"
        )


@router.post("/confirm-memory-entry")
async def confirm_memory_entry(
    request: ConfirmMemoryEntryRequest,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id)
):
    """
    Execute confirmed memory entry.

    Args:
        request: Memory entry confirmation
        db: Database session
        user_id: Current user ID

    Returns:
        Success message with entry data
    """
    try:
        manager = PersonManager(db)

        # If person_id not provided, create the person first
        if not request.person_id and request.person_name:
            # Create a PersonExtraction object for the new person
            extraction = PersonExtraction(
                name=request.person_name,
                attributes=None  # Journal entry will be added separately
            )
            person = manager.create_person(extraction, user_id)
            person_id = person.id
            created_new = True
        elif request.person_id:
            person_id = request.person_id
            created_new = False
        else:
            raise HTTPException(
                status_code=400,
                detail="Either person_id or person_name must be provided"
            )

        # Add journal entry
        entry = manager.add_journal_entry(
            person_id,
            request.content,
            request.date
        )

        # Get the person for the response
        person = db.get(Person, person_id)

        if created_new:
            message = f"Great! I created {person.name if person else 'person'} and added a memory."
        else:
            message = f"Got it! I added a memory for {person.name if person else 'person'}."

        return {
            "message": message,
            "entry": NotebookEntryRead.model_validate(entry)
        }

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error confirming journal entry: {str(e)}"
        )
