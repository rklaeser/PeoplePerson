from fastapi import APIRouter, HTTPException, Depends
from app.auth import get_current_user_no_test_bypass
from fastapi.responses import StreamingResponse
from sse_starlette.sse import EventSourceResponse
import json
import asyncio
from typing import AsyncGenerator

from app.schemas.ai import ChatRequest, ChatMessage
from app.workflows.graph import create_person_workflow
from app.services.person_service import get_all_friends

router = APIRouter()

async def event_generator(text: str, user_id: str) -> AsyncGenerator[str, None]:
    """Generate SSE events from the workflow execution"""
    workflow = create_person_workflow()
    
    # Initialize state
    initial_state = {
        "text": text,
        "user_id": user_id,
        "all_friends": await get_all_friends(user_id),
        "annotations": [],
        "result_people": [],
        "success": False
    }
    
    # Run the workflow
    try:
        # Execute workflow with streaming
        async for event in workflow.astream(initial_state):
            # Stream annotations as they're added
            if "annotations" in event:
                for annotation in event.get("annotations", []):
                    yield json.dumps(annotation)
                    await asyncio.sleep(0.01)  # Small delay for streaming effect
        
        # Get final state
        final_state = await workflow.ainvoke(initial_state)
        
        # Send final result
        result = {
            "type": "result",
            "data": {
                "role": "system",
                "success": final_state.get("success", False),
                "action": final_state.get("final_action", "error"),
                "message": final_state.get("result_message", ""),
                "people": final_state.get("result_people", [])
            }
        }
        yield json.dumps(result)
        
    except Exception as e:
        print(f"Workflow error: {e}")
        error_result = {
            "type": "result",
            "data": {
                "role": "system",
                "success": False,
                "action": "error",
                "message": "I failed to process your request",
                "people": []
            }
        }
        yield json.dumps(error_result)

@router.post("/route")
async def process_chat(
    request: ChatRequest,
    user: dict = Depends(get_current_user_no_test_bypass)
):
    """
    Process chat messages using LangGraph workflow with SSE streaming
    
    This endpoint mimics the behavior of the SvelteKit endpoint but uses
    LangGraph for orchestration instead of direct function calls.
    """
    return EventSourceResponse(
        event_generator(request.text, user["id"]),
        media_type="text/event-stream"
    )

@router.post("/chat")
async def simple_chat(
    request: ChatRequest,
    user: dict = Depends(get_current_user_no_test_bypass)
):
    """
    Simple non-streaming version for testing
    """
    workflow = create_person_workflow()
    
    initial_state = {
        "text": request.text,
        "user_id": user["id"],
        "all_friends": await get_all_friends(user["id"]),
        "annotations": [],
        "result_people": [],
        "success": False
    }
    
    try:
        final_state = await workflow.ainvoke(initial_state)
        
        return ChatMessage(
            role="system",
            success=final_state.get("success", False),
            action=final_state.get("final_action", "error"),
            message=final_state.get("result_message", ""),
            people=final_state.get("result_people", [])
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))