from pydantic import BaseModel, Field
from typing import Optional, List, Any


class IntentDetection(BaseModel):
    """Schema for intent detection results"""
    action: str = Field(description="The detected action: create, search, update, or clarify")
    confidence: float = Field(description="Confidence level of the detection (0-1)")
    reasoning: Optional[str] = Field(description="Reasoning behind the detection")


class PersonIdentification(BaseModel):
    """Schema for person identification results"""
    person_name: Optional[str] = Field(description="Identified person's name")
    person_id: Optional[str] = Field(description="Person's ID if found in database")
    confidence: float = Field(description="Confidence level of the identification (0-1)")
    is_new_person: bool = Field(description="Whether this is a new person to create")


class CreatePersonData(BaseModel):
    """Schema for creating a new person"""
    name: str = Field(description="Person's full name")
    body: Optional[str] = Field(default="Add a description", description="Description or notes about the person")
    intent: Optional[str] = Field(default="new", description="Intent category")
    birthday: Optional[str] = Field(description="Person's birthday")
    mnemonic: Optional[str] = Field(description="Memory aid for the person")
    zip: Optional[str] = Field(description="Person's zip code")
    groups: List[str] = Field(default_factory=list, description="Groups to add the person to")
    associates: List[str] = Field(default_factory=list, description="Associated people")


class UpdatePersonData(BaseModel):
    """Schema for updating a person"""
    person_id: str = Field(description="ID of the person to update")
    name: Optional[str] = Field(description="Updated name")
    body: Optional[str] = Field(description="Updated description")
    intent: Optional[str] = Field(description="Updated intent")
    birthday: Optional[str] = Field(description="Updated birthday")
    mnemonic: Optional[str] = Field(description="Updated mnemonic")
    zip: Optional[str] = Field(description="Updated zip code")
    add_groups: List[str] = Field(default_factory=list, description="Groups to add")
    remove_groups: List[str] = Field(default_factory=list, description="Groups to remove")
    add_associates: List[str] = Field(default_factory=list, description="Associates to add")
    remove_associates: List[str] = Field(default_factory=list, description="Associates to remove")


class SearchCriteria(BaseModel):
    """Schema for search criteria"""
    query: str = Field(description="Search query text")
    filters: dict = Field(default_factory=dict, description="Additional filters")
    limit: int = Field(default=10, description="Maximum results to return")


class AIResponse(BaseModel):
    """Schema for AI processing response"""
    success: bool = Field(description="Whether the operation was successful")
    action_taken: str = Field(description="The action that was performed")
    message: str = Field(description="Human-readable response message")
    data: Optional[Any] = Field(description="Additional data from the operation")
    error: Optional[str] = Field(description="Error message if operation failed")