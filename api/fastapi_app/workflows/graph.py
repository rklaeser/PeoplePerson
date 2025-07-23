from langgraph.graph import StateGraph, END
from .state import PersonState
from .nodes import (
    detect_intent_node,
    check_confidence_node,
    identify_person_node,
    search_handler_node,
    create_handler_node,
    update_handler_node,
    clarify_handler_node,
    error_handler_node
)

def route_by_confidence(state: PersonState) -> str:
    """Route based on confidence check"""
    if state.get("final_action") == "error":
        return "error"
    return "identify"

def route_by_action(state: PersonState) -> str:
    """Route to appropriate handler based on final action"""
    action = state.get("final_action", "error")
    if action in ["search", "create", "update", "clarify", "error"]:
        return action
    return "error"

def create_person_workflow():
    """Create the person management workflow"""
    workflow = StateGraph(PersonState)
    
    # Add nodes
    workflow.add_node("detect_intent", detect_intent_node)
    workflow.add_node("check_confidence", check_confidence_node)
    workflow.add_node("identify", identify_person_node)
    workflow.add_node("search", search_handler_node)
    workflow.add_node("create", create_handler_node)
    workflow.add_node("update", update_handler_node)
    workflow.add_node("clarify", clarify_handler_node)
    workflow.add_node("error", error_handler_node)
    
    # Add edges
    workflow.set_entry_point("detect_intent")
    workflow.add_edge("detect_intent", "check_confidence")
    workflow.add_conditional_edges(
        "check_confidence",
        route_by_confidence,
        {
            "identify": "identify",
            "error": "error"
        }
    )
    workflow.add_conditional_edges(
        "identify",
        route_by_action,
        {
            "search": "search",
            "create": "create",
            "update": "update",
            "clarify": "clarify",
            "error": "error"
        }
    )
    
    # All handlers lead to END
    workflow.add_edge("search", END)
    workflow.add_edge("create", END)
    workflow.add_edge("update", END)
    workflow.add_edge("clarify", END)
    workflow.add_edge("error", END)
    
    return workflow.compile()