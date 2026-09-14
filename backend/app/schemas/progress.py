from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class ProgressResponse(BaseModel):
    id: str
    user_id: str
    lesson_id: str
    module_id: str
    status: str
    quiz_score: Optional[int] = None
    time_spent_minutes: int
    completed_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class UpdateProgressRequest(BaseModel):
    lesson_id: str
    module_id: str
    status: str = "in_progress"
    quiz_score: Optional[int] = None
    time_spent_minutes: int = 0


class OverallProgressResponse(BaseModel):
    user_id: str
    total_lessons: int
    completed_lessons: int
    in_progress_lessons: int
    completion_percentage: float
    total_study_minutes: int
    module_completion: Dict[str, Dict[str, Any]]
    quiz_averages: Dict[str, float]
    recent_activity: List[Dict[str, Any]]
    weak_concepts: List[str]
    recommendations: List[Dict[str, Any]]
