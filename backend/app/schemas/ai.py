from pydantic import BaseModel
from typing import Optional, Dict, Any, List


class AIContext(BaseModel):
    lesson_id: Optional[str] = None
    module_id: Optional[str] = None
    learner_level: str = "beginner"
    circuit: Optional[Dict[str, Any]] = None
    simulation_result: Optional[Dict[str, Any]] = None
    detected_mistake: Optional[str] = None
    challenge_id: Optional[str] = None


class AIRequest(BaseModel):
    action: str  # explain | hint | debug | optimize | generate_code
    question: Optional[str] = None
    context: Optional[AIContext] = None


class AIResponse(BaseModel):
    action: str
    response: str
    suggestions: Optional[List[str]] = None
    code_example: Optional[str] = None
    confidence: str = "medium"  # high | medium | low
    sources: Optional[List[str]] = None
