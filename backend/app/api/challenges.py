import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List
from ..core.database import get_db
from ..core.deps import get_current_user
from ..models.user import User
from ..models.challenge import Challenge, ChallengeSubmission
from ..models.module import Lesson
from ..schemas.challenge import (
    ChallengeResponse, SubmitQuizRequest, SubmitCircuitRequest,
    SubmitCodeRequest, SubmissionResponse,
)
from ..services.assessment import AssessmentGrader
from ..services.quantum.backend import get_backend
from ..services.quantum import CircuitAnalyzer

router = APIRouter(prefix="/api/challenges", tags=["Challenges & Assessment"])
grader = AssessmentGrader()
analyzer = CircuitAnalyzer()


@router.get("", response_model=List[ChallengeResponse])
async def list_challenges(db: AsyncSession = Depends(get_db)):
    """List all active challenges."""
    result = await db.execute(select(Challenge).where(Challenge.is_active).order_by(Challenge.difficulty))
    challenges = result.scalars().all()
    return [ChallengeResponse.model_validate(c) for c in challenges]


@router.get("/{challenge_id}", response_model=ChallengeResponse)
async def get_challenge(challenge_id: str, db: AsyncSession = Depends(get_db)):
    """Get a single challenge by ID."""
    result = await db.execute(select(Challenge).where(Challenge.id == challenge_id))
    challenge = result.scalar_one_or_none()
    if not challenge:
        raise HTTPException(status_code=404, detail=f"Challenge '{challenge_id}' not found.")
    return ChallengeResponse.model_validate(challenge)


@router.post("/quiz/submit", response_model=SubmissionResponse)
async def submit_quiz(
    body: SubmitQuizRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Submit quiz answers and receive automated grading."""
    lesson_result = await db.execute(select(Lesson).where(Lesson.id == body.lesson_id))
    lesson = lesson_result.scalar_one_or_none()
    if not lesson:
        raise HTTPException(status_code=404, detail=f"Lesson '{body.lesson_id}' not found.")

    quiz = lesson.quiz or []
    correct_answers = {q["id"]: q["correctIndex"] for q in quiz}

    score, max_score, feedback, passed = grader.grade_quiz(correct_answers, body.answers)

    attempt_result = await db.execute(
        select(func.count(ChallengeSubmission.id)).where(
            ChallengeSubmission.user_id == user.id,
            ChallengeSubmission.challenge_id == body.lesson_id,
        )
    )
    attempt_number = (attempt_result.scalar() or 0) + 1

    submission = ChallengeSubmission(
        id=str(uuid.uuid4()),
        user_id=user.id,
        challenge_id=body.lesson_id,
        submission_data=body.model_dump(),
        score=score,
        max_score=max_score,
        passed=passed,
        feedback=feedback,
        attempt_number=attempt_number,
    )
    db.add(submission)

    return SubmissionResponse(
        id=submission.id,
        challenge_id=body.lesson_id,
        score=score,
        max_score=max_score,
        passed=passed,
        feedback=feedback,
        attempt_number=attempt_number,
        created_at=submission.created_at,
    )


@router.post("/{challenge_id}/submit/circuit", response_model=SubmissionResponse)
async def submit_circuit_challenge(
    challenge_id: str,
    body: SubmitCircuitRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Submit a circuit challenge — validates, executes, and grades."""
    result = await db.execute(select(Challenge).where(Challenge.id == challenge_id))
    challenge = result.scalar_one_or_none()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found.")

    circuit_dict = body.circuit_data
    execution_result = body.execution_result

    # Execute if no result provided
    if not execution_result:
        findings = analyzer.analyze(circuit_dict)
        errors = [f for f in findings if f.severity == "error"]
        if not errors:
            try:
                backend = get_backend("qiskit_aer")
                sim_result = backend.execute(circuit_dict, shots=1024)
                execution_result = {
                    "status": sim_result.status,
                    "counts": sim_result.counts,
                    "probabilities": sim_result.probabilities,
                    "error": sim_result.error,
                }
            except Exception as e:
                execution_result = {"status": "error", "error": str(e)}

    score, max_score, passed, feedback = grader.grade_circuit_challenge(
        challenge.data, circuit_dict, execution_result
    )

    attempt_count_result = await db.execute(
        select(func.count(ChallengeSubmission.id)).where(
            ChallengeSubmission.user_id == user.id,
            ChallengeSubmission.challenge_id == challenge_id,
        )
    )
    attempt_number = (attempt_count_result.scalar() or 0) + 1

    submission = ChallengeSubmission(
        id=str(uuid.uuid4()),
        user_id=user.id,
        challenge_id=challenge_id,
        submission_data=body.model_dump(),
        execution_result=execution_result,
        score=score,
        max_score=max_score,
        passed=passed,
        feedback=feedback,
        attempt_number=attempt_number,
    )
    db.add(submission)

    return SubmissionResponse(
        id=submission.id,
        challenge_id=challenge_id,
        score=score,
        max_score=max_score,
        passed=passed,
        feedback=feedback,
        attempt_number=attempt_number,
        execution_result=execution_result,
        created_at=submission.created_at,
    )


@router.post("/{challenge_id}/submit/code", response_model=SubmissionResponse)
async def submit_code_challenge(
    challenge_id: str,
    body: SubmitCodeRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Submit a coding challenge — validates and grades the submitted code."""
    result = await db.execute(select(Challenge).where(Challenge.id == challenge_id))
    challenge = result.scalar_one_or_none()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found.")

    score, max_score, passed, feedback = grader.grade_code_challenge(
        challenge.data, body.code, None
    )

    attempt_count_result = await db.execute(
        select(func.count(ChallengeSubmission.id)).where(
            ChallengeSubmission.user_id == user.id,
            ChallengeSubmission.challenge_id == challenge_id,
        )
    )
    attempt_number = (attempt_count_result.scalar() or 0) + 1

    submission = ChallengeSubmission(
        id=str(uuid.uuid4()),
        user_id=user.id,
        challenge_id=challenge_id,
        submission_data={"code": body.code, "language": body.language},
        score=score,
        max_score=max_score,
        passed=passed,
        feedback=feedback,
        attempt_number=attempt_number,
    )
    db.add(submission)

    return SubmissionResponse(
        id=submission.id,
        challenge_id=challenge_id,
        score=score,
        max_score=max_score,
        passed=passed,
        feedback=feedback,
        attempt_number=attempt_number,
        created_at=submission.created_at,
    )
