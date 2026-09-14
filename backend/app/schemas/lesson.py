from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime


class LessonContentResponse(BaseModel):
    heading: str
    body: str
    formula: Optional[str] = None


class QuizQuestionResponse(BaseModel):
    id: str
    question: str
    options: List[str]
    correct_index: int
    explanation: str


class LessonResponse(BaseModel):
    id: str
    module_id: str
    title: str
    description: str
    duration: int
    difficulty: str
    objectives: List[str]
    content: List[LessonContentResponse]
    quiz: List[QuizQuestionResponse]
    circuit_example: Optional[str] = None
    order_index: int

    model_config = {"from_attributes": True}


class ModuleResponse(BaseModel):
    id: str
    title: str
    description: str
    icon: str
    color: str
    order_index: int
    objectives: List[str]
    lessons: List[LessonResponse] = []
    lesson_count: int = 0
    total_duration: int = 0

    model_config = {"from_attributes": True}
