from fastapi import APIRouter, Depends, HTTPException, Request
from sqlmodel import Session, select
from typing import List
from uuid import UUID
from twilio.rest import Client
from twilio.twiml.messaging_response import MessagingResponse
from datetime import datetime
import os
import phonenumbers
from phonenumbers import NumberParseException

from database import get_db
from models import Message, MessageCreate, MessageRead, MessageDirection, Person, User, SMSSendRequest
from routers.auth import get_current_user

router = APIRouter(prefix="/sms", tags=["sms"])

# Initialize Twilio client
twilio_client = Client(
    os.getenv("TWILIO_ACCOUNT_SID"),
    os.getenv("TWILIO_AUTH_TOKEN")
)
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER")


def format_phone_number(phone_number: str) -> str:
    """Format phone number to E.164 format"""
    try:
        parsed = phonenumbers.parse(phone_number, "US")
        return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)
    except NumberParseException:
        raise HTTPException(status_code=400, detail="Invalid phone number format")


@router.post("/send", response_model=MessageRead)
async def send_sms(
    message_data: SMSSendRequest,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Send an SMS message to a person"""
    
    # Get the person and verify ownership
    person = session.get(Person, message_data.person_id)
    if not person or person.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Person not found")
    
    if not person.phone_number:
        raise HTTPException(status_code=400, detail="Person has no phone number")
    
    # Format phone number
    try:
        to_number = format_phone_number(person.phone_number)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid phone number: {str(e)}")
    
    # Check if Twilio is configured
    if not TWILIO_PHONE_NUMBER:
        print("WARNING: TWILIO_PHONE_NUMBER not configured, skipping SMS send")
        # For development, just save the message without sending
        message = Message(
            body=message_data.body,
            direction=MessageDirection.OUTBOUND,
            person_id=message_data.person_id,
            user_id=current_user.id
        )
        session.add(message)
        session.commit()
        session.refresh(message)
        return message
    
    # Send via Twilio
    try:
        twilio_message = twilio_client.messages.create(
            body=message_data.body,
            from_=TWILIO_PHONE_NUMBER,
            to=to_number
        )
    except Exception as e:
        print(f"Twilio error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to send message: {str(e)}")
    
    # Save to database
    message = Message(
        body=message_data.body,
        direction=MessageDirection.OUTBOUND,
        person_id=message_data.person_id,
        user_id=current_user.id
    )
    session.add(message)

    # Update person's last_contact_date
    person.last_contact_date = datetime.utcnow()
    session.add(person)

    session.commit()
    session.refresh(message)

    return message


@router.get("/messages/{person_id}", response_model=List[MessageRead])
async def get_messages(
    person_id: UUID,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all messages for a person"""
    
    # Verify person ownership
    person = session.get(Person, person_id)
    if not person or person.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Person not found")
    
    # Get messages
    statement = select(Message).where(
        Message.person_id == person_id
    ).order_by(Message.sent_at.asc())
    
    messages = session.exec(statement).all()
    return messages


@router.post("/webhook")
async def twilio_webhook(request: Request, session: Session = Depends(get_db)):
    """Handle incoming SMS from Twilio"""
    
    form_data = await request.form()
    from_number = form_data.get("From")
    body = form_data.get("Body")
    
    if not from_number or not body:
        raise HTTPException(status_code=400, detail="Missing required fields")
    
    # Format the incoming number
    formatted_number = format_phone_number(from_number)
    
    # Find person by phone number
    statement = select(Person).where(Person.phone_number == formatted_number)
    person = session.exec(statement).first()
    
    if person:
        # Save incoming message
        message = Message(
            body=body,
            direction=MessageDirection.INBOUND,
            person_id=person.id,
            user_id=person.user_id
        )
        session.add(message)

        # Update person's last_contact_date
        person.last_contact_date = datetime.utcnow()
        session.add(person)

        session.commit()

    # Return empty TwiML response
    resp = MessagingResponse()
    return str(resp)


@router.post("/validate-phone")
async def validate_phone_number(phone_number: str):
    """Validate and format a phone number"""
    try:
        formatted = format_phone_number(phone_number)
        return {"valid": True, "formatted": formatted}
    except HTTPException:
        return {"valid": False, "formatted": None}