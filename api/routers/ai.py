"""AI-powered contact extraction endpoints."""
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
    DuplicateWarning,
    CRUDIntent
)
from models import PersonRead

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

        # Step 2: If not CREATE intent, return rejection
        if not intent_analysis.is_create_request:
            return ExtractionResponse(
                intent=intent_analysis.intent,
                message="Hmm, I can't help with that."
            )

        # Step 3: Extract people
        people = extractor.extract(request.narrative)

        if not people:
            return ExtractionResponse(
                intent=CRUDIntent.NONE,
                message="I couldn't find any people in that message."
            )

        # Step 4: Check for duplicates
        duplicates: List[DuplicateWarning] = []

        for person_extraction in people:
            similar = manager.find_similar(person_extraction.name, user_id)
            if similar:
                existing_person, similarity = similar
                duplicates.append(DuplicateWarning(
                    extraction=person_extraction,
                    existing_id=existing_person.id,
                    existing_name=existing_person.name,
                    existing_notes=existing_person.body,
                    similarity=similarity
                ))

        # Step 5: Return results
        if duplicates:
            return ExtractionResponse(
                intent=intent_analysis.intent,
                people=people,
                duplicates=duplicates
            )
        else:
            # No duplicates - create all people immediately
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
                    'intent': p.intent,
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

            return ExtractionResponse(
                intent=intent_analysis.intent,
                people=people,
                message=f"Added {len(created_people)} new contact(s)",
                created_persons=created_persons_data
            )

    except HTTPException:
        raise
    except Exception as e:
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
