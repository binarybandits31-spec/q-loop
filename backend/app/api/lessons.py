from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..core.database import get_db
from ..models.module import Lesson
from ..schemas.lesson import LessonResponse, LessonContentResponse, QuizQuestionResponse

router = APIRouter(prefix="/api/lessons", tags=["Lessons"])


@router.get("/{lesson_id}", response_model=LessonResponse)
async def get_lesson(lesson_id: str, db: AsyncSession = Depends(get_db)):
    """Get a single lesson with its content and quiz."""
    result = await db.execute(select(Lesson).where(Lesson.id == lesson_id, Lesson.is_active))
    lesson = result.scalar_one_or_none()
    if not lesson:
        raise HTTPException(status_code=404, detail=f"Lesson '{lesson_id}' not found.")

    quiz_data = lesson.quiz or []
    return LessonResponse(
        id=lesson.id,
        module_id=lesson.module_id,
        title=lesson.title,
        description=lesson.description,
        duration=lesson.duration,
        difficulty=lesson.difficulty,
        objectives=lesson.objectives or [],
        content=[LessonContentResponse(**c) for c in (lesson.content or [])],
        quiz=[QuizQuestionResponse(
            id=q["id"], question=q["question"], options=q["options"],
            correct_index=q["correctIndex"], explanation=q["explanation"],
        ) for q in quiz_data],
        circuit_example=lesson.circuit_example,
        order_index=lesson.order_index,
    )
