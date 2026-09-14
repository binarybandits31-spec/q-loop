"""Instructor dashboard API — all routes require instructor role."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, distinct
from typing import List, Dict, Any
from ..core.database import get_db
from ..core.deps import require_instructor
from ..models.user import User
from ..models.progress import Progress, MistakeLog
from ..models.challenge import ChallengeSubmission
from ..models.module import Module, Lesson

router = APIRouter(prefix="/api/instructor", tags=["Instructor Dashboard"])


@router.get("/overview")
async def instructor_overview(
    _: User = Depends(require_instructor),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """High-level platform statistics for instructors."""
    total_students_result = await db.execute(select(func.count(User.id)).where(User.role == "student"))
    total_students = total_students_result.scalar() or 0

    total_completions_result = await db.execute(select(func.count(Progress.id)).where(Progress.status == "completed"))
    total_completions = total_completions_result.scalar() or 0

    avg_quiz_result = await db.execute(
        select(func.avg(Progress.quiz_score)).where(Progress.quiz_score.isnot(None))
    )
    avg_quiz = round(avg_quiz_result.scalar() or 0, 1)

    total_challenges_result = await db.execute(select(func.count(ChallengeSubmission.id)))
    total_challenges = total_challenges_result.scalar() or 0

    total_mistakes_result = await db.execute(select(func.count(MistakeLog.id)))
    total_mistakes = total_mistakes_result.scalar() or 0

    return {
        "total_students": total_students,
        "total_lesson_completions": total_completions,
        "average_quiz_score": avg_quiz,
        "total_challenge_submissions": total_challenges,
        "total_mistakes_logged": total_mistakes,
    }


@router.get("/students")
async def list_students(
    _: User = Depends(require_instructor),
    db: AsyncSession = Depends(get_db),
) -> List[Dict[str, Any]]:
    """List all student accounts with summary progress."""
    students_result = await db.execute(select(User).where(User.role == "student", User.is_active))
    students = students_result.scalars().all()

    result = []
    for student in students:
        completions_result = await db.execute(
            select(func.count(Progress.id)).where(
                Progress.user_id == student.id, Progress.status == "completed"
            )
        )
        completions = completions_result.scalar() or 0

        avg_quiz_result = await db.execute(
            select(func.avg(Progress.quiz_score)).where(
                Progress.user_id == student.id, Progress.quiz_score.isnot(None)
            )
        )
        avg_quiz = round(avg_quiz_result.scalar() or 0, 1)

        challenges_result = await db.execute(
            select(func.count(ChallengeSubmission.id)).where(ChallengeSubmission.user_id == student.id)
        )
        challenges = challenges_result.scalar() or 0

        result.append({
            "id": student.id,
            "email": student.email,
            "display_name": student.display_name,
            "learning_level": student.learning_level,
            "lessons_completed": completions,
            "quiz_average": avg_quiz,
            "challenges_attempted": challenges,
            "streak_days": student.streak_days,
            "total_study_minutes": student.total_study_minutes,
            "created_at": student.created_at.isoformat(),
        })

    return result


@router.get("/students/{student_id}")
async def get_student(
    student_id: str,
    _: User = Depends(require_instructor),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """Detailed progress for a single student."""
    student_result = await db.execute(select(User).where(User.id == student_id))
    student = student_result.scalar_one_or_none()
    if not student or student.role != "student":
        raise HTTPException(status_code=404, detail="Student not found.")

    progress_result = await db.execute(select(Progress).where(Progress.user_id == student_id))
    progress_records = progress_result.scalars().all()

    challenges_result = await db.execute(
        select(ChallengeSubmission).where(ChallengeSubmission.user_id == student_id)
    )
    challenges = challenges_result.scalars().all()

    mistakes_result = await db.execute(select(MistakeLog).where(MistakeLog.user_id == student_id))
    mistakes = mistakes_result.scalars().all()

    return {
        "student": {
            "id": student.id,
            "email": student.email,
            "display_name": student.display_name,
            "learning_level": student.learning_level,
            "streak_days": student.streak_days,
            "total_study_minutes": student.total_study_minutes,
        },
        "progress": [
            {"lesson_id": p.lesson_id, "module_id": p.module_id, "status": p.status, "quiz_score": p.quiz_score}
            for p in progress_records
        ],
        "challenge_submissions": [
            {"challenge_id": c.challenge_id, "score": c.score, "passed": c.passed, "attempt_number": c.attempt_number}
            for c in challenges
        ],
        "mistakes": [
            {"type": m.mistake_type, "module_id": m.module_id, "description": m.description}
            for m in mistakes
        ],
    }


@router.get("/mistakes")
async def common_mistakes(
    _: User = Depends(require_instructor),
    db: AsyncSession = Depends(get_db),
) -> List[Dict[str, Any]]:
    """Aggregate common mistakes across all learners."""
    result = await db.execute(
        select(MistakeLog.mistake_type, MistakeLog.module_id, func.count(MistakeLog.id).label("count"))
        .group_by(MistakeLog.mistake_type, MistakeLog.module_id)
        .order_by(func.count(MistakeLog.id).desc())
        .limit(20)
    )
    rows = result.all()
    return [
        {"mistake_type": r.mistake_type, "module_id": r.module_id, "count": r.count}
        for r in rows
    ]


@router.get("/performance")
async def module_performance(
    _: User = Depends(require_instructor),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """Average quiz scores and completion rates by module."""
    modules_result = await db.execute(select(Module).where(Module.is_active).order_by(Module.order_index))
    modules = modules_result.scalars().all()

    lessons_result = await db.execute(select(Lesson).where(Lesson.is_active))
    all_lessons = lessons_result.scalars().all()
    lessons_by_module: dict = {}
    for l in all_lessons:
        lessons_by_module.setdefault(l.module_id, []).append(l)

    module_stats = []
    for mod in modules:
        mod_lesson_ids = [l.id for l in lessons_by_module.get(mod.id, [])]
        if not mod_lesson_ids:
            continue

        avg_quiz_result = await db.execute(
            select(func.avg(Progress.quiz_score)).where(
                Progress.module_id == mod.id, Progress.quiz_score.isnot(None)
            )
        )
        avg_quiz = round(avg_quiz_result.scalar() or 0, 1)

        completions_result = await db.execute(
            select(func.count(distinct(Progress.user_id))).where(
                Progress.module_id == mod.id, Progress.status == "completed"
            )
        )
        learners_completed = completions_result.scalar() or 0

        module_stats.append({
            "module_id": mod.id,
            "title": mod.title,
            "lesson_count": len(mod_lesson_ids),
            "avg_quiz_score": avg_quiz,
            "learners_completed": learners_completed,
        })

    return {"modules": module_stats}
