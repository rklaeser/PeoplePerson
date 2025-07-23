from pydantic import BaseModel
from typing import List, Optional, Literal
from enum import Enum

class IntentEnum(str, Enum):
    search = "search"
    create = "create"
    update = "update"

class PersonIntentEnum(str, Enum):
    romantic = "romantic"
    core = "core"
    archive = "archive"
    new = "new"
    invest = "invest"
    associate = "associate"

class IntentDetection(BaseModel):
    action: IntentEnum
    confidence: float

class PersonIdentification(BaseModel):
    action: Literal["search", "create", "update", "clarify"]
    matched_ids: List[str]
    confidence: Literal["certain", "uncertain", "no_matches", "multiple_matches"]
    reasoning: str
    needs_clarification: bool

class CreatePersonData(BaseModel):
    name: str
    body: Optional[str] = None
    intent: Optional[PersonIntentEnum] = None
    birthday: Optional[str] = None  # YYYY-MM-DD format
    mnemonic: Optional[str] = None

class UpdatePersonData(BaseModel):
    person_id: str
    name: Optional[str] = None
    body: Optional[str] = None
    intent: Optional[PersonIntentEnum] = None
    birthday: Optional[str] = None  # YYYY-MM-DD format
    mnemonic: Optional[str] = None

class ChatRequest(BaseModel):
    text: str

class ChatMessage(BaseModel):
    role: str
    success: bool
    action: str
    message: str
    people: List[dict] = []