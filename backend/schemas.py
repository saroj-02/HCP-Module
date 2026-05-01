from pydantic import BaseModel
from typing import Optional, List
import datetime

class ChatRequest(BaseModel):
    message: str
    user_id: Optional[str] = "default_user"
    thread_id: Optional[str] = "default_thread"

class FormRequest(BaseModel):
    hcp_name: str
    interaction_type: str
    notes: str
    sentiment: Optional[str] = None
    
class InteractionResponse(BaseModel):
    id: int
    hcp_name: str
    date: datetime.datetime
    interaction_type: str
    notes: str
    sentiment: Optional[str] = None
    summary: Optional[str] = None
