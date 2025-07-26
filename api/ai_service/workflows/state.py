from typing import TypedDict, List, Optional, Literal
from langgraph.graph import MessagesState

class PersonState(TypedDict):
    """State for the person management workflow"""
    # Input
    text: str
    user_id: str
    
    # Intent detection
    intent: Optional[Literal["search", "create", "update"]]
    intent_confidence: Optional[float]
    
    # Person identification
    all_friends: List[dict]
    matched_ids: List[str]
    identification_confidence: Optional[Literal["certain", "uncertain", "no_matches", "multiple_matches"]]
    identification_reasoning: Optional[str]
    needs_clarification: bool
    
    # Routing decision
    final_action: Optional[Literal["search", "create", "update", "clarify", "error"]]
    
    # Results
    result_message: Optional[str]
    result_people: List[dict]
    success: bool
    
    # Annotations for real-time feedback
    annotations: List[dict]