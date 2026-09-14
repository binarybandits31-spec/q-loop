from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class ChallengeResponse(BaseModel):
    id: str
    type: str
    title: str
    description: str
    difficulty: str
    module_id: Optional[str] = None
    objective: Optional[str] = None
    hint: Optional[str] = None
    data: Dict[str, Any] = {}
    max_score: int

    model_config = {"from_attributes": True}


class SubmitQuizRequest(BaseModel):
    lesson_id: str
    module_id: str
    answers: Dict[str, int]


class SubmitCircuitRequest(BaseModel):
    circuit_data: Dict[str, Any]
    execution_result: Optional[Dict[str, Any]] = None


class SubmitCodeRequest(BaseModel):
    code: str
    language: str = "python"


class SubmissionResponse(BaseModel):
    id: str
    challenge_id: str
    score: int
    max_score: int
    passed: bool
    feedback: Optional[str]
    attempt_number: int
    execution_result: Optional[Dict[str, Any]] = None
    created_at: datetime

    model_config = {"from_attributes": True}
