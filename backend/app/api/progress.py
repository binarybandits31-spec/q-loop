import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List
from ..core.database import get_db
from ..core.deps import get_current_user
from ..models.user import User
from ..models.progress import Progress, MistakeLog, Recommendation
from ..models.challenge import ChallengeSubmission, QuizAttempt
from ..models.module import Module, Lesson
from ..schemas.progress import ProgressResponse, UpdateProgressRequest, OverallProgressResponse
from ..services.recommendation import RecommendationEngine

router = APIRouter(prefix="/api/progress", tags=["Progress Tracking"])
rec_engine = RecommendationEngine()


@router.get("", response_model=OverallProgressResponse)
async def get_progress(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return the authenticated user's full learning progress."""
    # All lessons for context
    lessons_result = await db.execute(select(Lesson).where(Lesson.is_active).order_by(Lesson.module_id, Lesson.order_index))
    all_lessons = lessons_result.scalars().all()
    all_lesson_ids = {l.id for l in all_lessons}
    total_lessons = len(all_lessons)

    # User progress records
    progress_result = await db.execute(select(Progress).where(Progress.user_id == user.id))
    progress_records = progress_result.scalars().all()

    completed = [p for p in progress_records if p.status == "completed"]
    in_progress = [p for p in progress_records if p.status == "in_progress"]
    completed_ids = {p.lesson_id for p in completed}
    completion_pct = (len(completed) / total_lessons * 100) if total_lessons else 0.0

    # Module-level completion
    modules_result = await db.execute(select(Module).where(Module.is_active).order_by(Module.order_index))
    modules = modules_result.scalars().all()
    lessons_by_module: dict = {}
    for l in all_lessons:
        lessons_by_module.setdefault(l.module_id, []).append(l)

    module_completion = {}
    for mod in modules:
        mod_lessons = lessons_by_module.get(mod.id, [])
        mod_completed = sum(1 for l in mod_lessons if l.id in completed_ids)
        module_completion[mod.id] = {
            "title": mod.title,
            "total": len(mod_lessons),
            "completed": mod_completed,
            "percentage": (mod_completed / len(mod_lessons) * 100) if mod_lessons else 0.0,
        }

    # Quiz averages
    quiz_progress = [p for p in progress_records if p.quiz_score is not None]
    quiz_averages: dict = {}
    for p in quiz_progress:
        quiz_averages[p.lesson_id] = (quiz_averages.get(p.lesson_id, 0) + p.quiz_score) / 2 if p.lesson_id in quiz_averages else p.quiz_score

    # Recent activity (last 5 completions)
    recent = sorted(
        [p for p in progress_records if p.completed_at],
        key=lambda p: p.completed_at or datetime.min,
        reverse=True,
    )[:5]
    recent_activity = [
        {"lesson_id": p.lesson_id, "module_id": p.module_id, "completed_at": p.completed_at.isoformat(), "quiz_score": p.quiz_score}
        for p in recent
    ]

    # Mistakes
    mistakes_result = await db.execute(select(MistakeLog).where(MistakeLog.user_id == user.id))
    mistakes = mistakes_result.scalars().all()
    weak_concepts = list({m.module_id for m in mistakes if m.module_id and not m.resolved})[:5]

    # Generate recommendations
    quiz_scores_input = {p.lesson_id: {"score": p.quiz_score or 0, "total": 10} for p in quiz_progress}
    challenge_scores_input = {}
    recs = rec_engine.generate({
        "completed_lessons": list(completed_ids),
        "quiz_scores": quiz_scores_input,
        "challenge_scores": challenge_scores_input,
        "mistakes": [{"module_id": m.module_id, "type": m.mistake_type} for m in mistakes],
        "all_lessons": [{"id": l.id, "module_id": l.module_id, "title": l.title, "duration": l.duration, "difficulty": l.difficulty} for l in all_lessons],
    })

    return OverallProgressResponse(
        user_id=user.id,
        total_lessons=total_lessons,
        completed_lessons=len(completed),
        in_progress_lessons=len(in_progress),
        completion_percentage=completion_pct,
        total_study_minutes=user.total_study_minutes,
        module_completion=module_completion,
        quiz_averages=quiz_averages,
        recent_activity=recent_activity,
        weak_concepts=weak_concepts,
        recommendations=recs,
    )


@router.post("/update", response_model=ProgressResponse)
async def update_progress(
    body: UpdateProgressRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create or update a lesson progress record."""
    result = await db.execute(
        select(Progress).where(
            Progress.user_id == user.id,
            Progress.lesson_id == body.lesson_id,
        )
    )
    progress = result.scalar_one_or_none()

    if progress:
        progress.status = body.status
        if body.quiz_score is not None:
            progress.quiz_score = body.quiz_score
        progress.time_spent_minutes += body.time_spent_minutes
        if body.status == "completed" and not progress.completed_at:
            progress.completed_at = datetime.utcnow()
        progress.updated_at = datetime.utcnow()
    else:
        progress = Progress(
            id=str(uuid.uuid4()),
            user_id=user.id,
            lesson_id=body.lesson_id,
            module_id=body.module_id,
            status=body.status,
            quiz_score=body.quiz_score,
            time_spent_minutes=body.time_spent_minutes,
            completed_at=datetime.utcnow() if body.status == "completed" else None,
        )
        db.add(progress)

    # Update user study minutes
    if body.time_spent_minutes > 0:
        user.total_study_minutes += body.time_spent_minutes

    return ProgressResponse.model_validate(progress)
