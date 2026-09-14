from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from ..core.database import get_db
from ..models.module import Module, Lesson
from ..schemas.lesson import ModuleResponse, LessonResponse

router = APIRouter(prefix="/api/modules", tags=["Learning Modules"])


def _build_module_response(module: Module, lessons: List[Lesson]) -> ModuleResponse:
    lesson_list = sorted(lessons, key=lambda l: l.order_index)
    return ModuleResponse(
        id=module.id,
        title=module.title,
        description=module.description,
        icon=module.icon,
        color=module.color,
        order_index=module.order_index,
        objectives=module.objectives or [],
        lessons=[_build_lesson_response(l) for l in lesson_list],
        lesson_count=len(lessons),
        total_duration=sum(l.duration for l in lessons),
    )


def _build_lesson_response(lesson: Lesson) -> LessonResponse:
    content = lesson.content or []
    quiz = lesson.quiz or []
    from ..schemas.lesson import LessonContentResponse, QuizQuestionResponse
    return LessonResponse(
        id=lesson.id,
        module_id=lesson.module_id,
        title=lesson.title,
        description=lesson.description,
        duration=lesson.duration,
        difficulty=lesson.difficulty,
        objectives=lesson.objectives or [],
        content=[LessonContentResponse(**c) for c in content],
        quiz=[QuizQuestionResponse(
            id=q["id"], question=q["question"], options=q["options"],
            correct_index=q["correctIndex"], explanation=q["explanation"],
        ) for q in quiz],
        circuit_example=lesson.circuit_example,
        order_index=lesson.order_index,
    )


@router.get("", response_model=List[ModuleResponse])
async def list_modules(db: AsyncSession = Depends(get_db)):
    """List all 13 curriculum modules with their lessons."""
    modules_result = await db.execute(select(Module).where(Module.is_active).order_by(Module.order_index))
    modules = modules_result.scalars().all()

    lessons_result = await db.execute(select(Lesson).where(Lesson.is_active))
    all_lessons = lessons_result.scalars().all()

    lessons_by_module: dict = {}
    for lesson in all_lessons:
        lessons_by_module.setdefault(lesson.module_id, []).append(lesson)

    return [_build_module_response(m, lessons_by_module.get(m.id, [])) for m in modules]


@router.get("/{module_id}", response_model=ModuleResponse)
async def get_module(module_id: str, db: AsyncSession = Depends(get_db)):
    """Get a single module with all its lessons."""
    result = await db.execute(select(Module).where(Module.id == module_id, Module.is_active))
    module = result.scalar_one_or_none()
    if not module:
        raise HTTPException(status_code=404, detail=f"Module '{module_id}' not found.")

    lessons_result = await db.execute(
        select(Lesson).where(Lesson.module_id == module_id, Lesson.is_active).order_by(Lesson.order_index)
    )
    lessons = lessons_result.scalars().all()
    return _build_module_response(module, list(lessons))
