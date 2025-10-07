from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlmodel import Session
from typing import AsyncGenerator
from uuid import UUID
import json
from pydantic import BaseModel

from database import get_db
from routers.auth import get_current_user_id
from ai_service.workflows.graph import create_person_workflow
from ai_service.workflows.state import PersonState

router = APIRouter()


class AIRequest(BaseModel):
    content: str
    context: dict = {}


async def process_ai_stream(
    content: str,
    context: dict,
    user_id: UUID,
    db: Session
) -> AsyncGenerator[str, None]:
    """Process AI request and stream results"""
    try:
        # Create the workflow
        workflow = create_person_workflow()
        
        # Initialize state
        initial_state = PersonState(
            user_input=content,
            user_id=str(user_id),
            context=context
        )
        
        # Process through workflow
        result = workflow.invoke(initial_state)
        
        # Stream results as SSE
        yield f"data: {json.dumps({'type': 'start', 'message': 'Processing request...'})}\n\n"
        
        if result.get("intent"):
            yield f"data: {json.dumps({'type': 'intent', 'intent': result['intent']})}\n\n"
        
        if result.get("confidence"):
            yield f"data: {json.dumps({'type': 'confidence', 'confidence': result['confidence']})}\n\n"
        
        if result.get("identified_person"):
            yield f"data: {json.dumps({'type': 'person', 'person': result['identified_person']})}\n\n"
        
        if result.get("final_action"):
            yield f"data: {json.dumps({'type': 'action', 'action': result['final_action']})}\n\n"
        
        if result.get("response"):
            yield f"data: {json.dumps({'type': 'response', 'response': result['response']})}\n\n"
        
        yield f"data: {json.dumps({'type': 'complete', 'message': 'Processing complete'})}\n\n"
        
    except Exception as e:
        yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"


@router.post("/process")
async def process_ai_request(
    request: AIRequest,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id)
):
    """Process AI request and return streaming response"""
    return StreamingResponse(
        process_ai_stream(request.content, request.context, user_id, db),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )


@router.post("/process-sync")
async def process_ai_request_sync(
    request: AIRequest,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id)
):
    """Process AI request synchronously"""
    try:
        # Create the workflow
        workflow = create_person_workflow()
        
        # Initialize state
        initial_state = PersonState(
            user_input=request.content,
            user_id=str(user_id),
            context=request.context
        )
        
        # Process through workflow
        result = workflow.invoke(initial_state)
        
        return {
            "success": True,
            "intent": result.get("intent"),
            "confidence": result.get("confidence"),
            "identified_person": result.get("identified_person"),
            "final_action": result.get("final_action"),
            "response": result.get("response")
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))