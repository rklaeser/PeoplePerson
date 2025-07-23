from typing import Dict, Any
# Removed RunnableSequence import - using pipe operator instead
from app.config import model
from app.schemas.ai import IntentDetection, PersonIdentification, CreatePersonData, UpdatePersonData
from app.workflows.prompts import (
    detect_intent_prompt,
    identify_person_prompt,
    extract_person_data_prompt,
    extract_update_data_prompt
)

async def detect_intent_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """Detect the user's intent from their text input"""
    state["annotations"].append({
        "type": "annotation",
        "data": {
            "role": "annotation",
            "success": True,
            "action": "route",
            "message": "Thinking...",
            "people": []
        }
    })
    
    structured_model = model.with_structured_output(IntentDetection)
    chain = detect_intent_prompt | structured_model
    
    result = await chain.ainvoke({"text": state["text"]})
    
    state["intent"] = result.action
    state["intent_confidence"] = result.confidence
    
    state["annotations"].append({
        "type": "annotation",
        "data": {
            "role": "annotation",
            "success": True,
            "action": "route",
            "message": f"Intent: {result.action} ({result.confidence:.2f})",
            "people": []
        }
    })
    
    return state

async def check_confidence_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """Check if confidence is high enough to proceed"""
    if state["intent_confidence"] < 0.5:
        state["annotations"].append({
            "type": "annotation",
            "data": {
                "role": "annotation",
                "success": True,
                "action": "route",
                "message": f"Low confidence ({state['intent_confidence']:.2f}) - skipping processing",
                "people": []
            }
        })
        state["final_action"] = "error"
        state["result_message"] = "I'm not sure I can help with that."
        state["success"] = False
    return state

async def identify_person_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """Identify which person(s) the user is referring to"""
    people_list = "\n---\n".join([
        f"ID: {p['id']}\nName: {p['name']}\nDescription: {p.get('body', '')}\nIntent: {p.get('intent', '')}\nMnemonic: {p.get('mnemonic', 'none')}"
        for p in state["all_friends"]
    ])
    
    structured_model = model.with_structured_output(PersonIdentification)
    chain = identify_person_prompt | structured_model
    
    result = await chain.ainvoke({
        "text": state["text"],
        "action": state["intent"],
        "people_list": people_list
    })
    
    state["matched_ids"] = result.matched_ids
    state["identification_confidence"] = result.confidence
    state["identification_reasoning"] = result.reasoning
    state["needs_clarification"] = result.needs_clarification
    
    # Store the final action based on identification
    if result.action == "clarify" and state["intent"] == "create":
        # If original intent was create, let create handler handle it
        state["final_action"] = "create"
    else:
        state["final_action"] = result.action
    
    state["annotations"].append({
        "type": "annotation",
        "data": {
            "role": "annotation",
            "success": True,
            "action": "identify",
            "message": f"{result.reasoning} ({len(result.matched_ids)} matches, {result.confidence})",
            "people": []
        }
    })
    
    return state

async def search_handler_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """Handle search requests"""
    matched_friends = [
        friend for friend in state["all_friends"] 
        if friend["id"] in state["matched_ids"]
    ]
    
    if matched_friends:
        state["result_message"] = f"Found {len(matched_friends)} matching {'person' if len(matched_friends) == 1 else 'people'}."
        state["result_people"] = matched_friends
        state["success"] = True
    else:
        state["result_message"] = "No matching people found."
        state["result_people"] = []
        state["success"] = False
    
    return state

async def create_handler_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """Handle create requests"""
    from app.services.person_service import create_person
    
    structured_model = model.with_structured_output(CreatePersonData)
    chain = extract_person_data_prompt | structured_model
    
    person_data = await chain.ainvoke({"text": state["text"]})
    
    # Create the person in the database
    new_person = await create_person(
        state["user_id"],
        {
            "name": person_data.name,
            "body": person_data.body,
            "intent": person_data.intent,
            "birthday": person_data.birthday,
            "mnemonic": person_data.mnemonic
        }
    )
    
    state["result_message"] = f"Created new person: {person_data.name}"
    state["result_people"] = [new_person]
    state["success"] = True
    
    return state

async def update_handler_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """Handle update requests"""
    from app.services.person_service import update_person
    
    if not state["matched_ids"]:
        state["result_message"] = "Could not find the person to update."
        state["result_people"] = []
        state["success"] = False
        return state
    
    people_list = "\n---\n".join([
        f"ID: {p['id']}\nName: {p['name']}\nDescription: {p.get('body', '')}\nIntent: {p.get('intent', '')}"
        for p in state["all_friends"]
    ])
    
    structured_model = model.with_structured_output(UpdatePersonData)
    chain = extract_update_data_prompt | structured_model
    
    update_data = await chain.ainvoke({
        "text": state["text"],
        "people": people_list
    })
    
    # Update the person in the database
    update_fields = {}
    if update_data.name:
        update_fields["name"] = update_data.name
    if update_data.body:
        update_fields["body"] = update_data.body
    if update_data.intent:
        update_fields["intent"] = update_data.intent
    if update_data.birthday:
        update_fields["birthday"] = update_data.birthday
    if update_data.mnemonic:
        update_fields["mnemonic"] = update_data.mnemonic
    
    updated_person = await update_person(update_data.person_id, update_fields)
    
    state["result_message"] = f"Updated person information."
    state["result_people"] = [updated_person]
    state["success"] = True
    
    return state

async def clarify_handler_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """Handle clarification requests"""
    matched_friends = [
        friend for friend in state["all_friends"] 
        if friend["id"] in state["matched_ids"]
    ]
    
    state["result_message"] = "I found multiple people with that name. Which one did you mean?"
    state["result_people"] = matched_friends
    state["success"] = True
    
    return state

async def error_handler_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """Handle error cases"""
    if not state.get("result_message"):
        state["result_message"] = "Hmm I'm not sure how to help you with that"
    state["result_people"] = []
    state["success"] = False
    
    return state