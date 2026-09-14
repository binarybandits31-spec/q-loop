import uuid
from datetime import datetime
from sqlalchemy import String, Text, Integer, Boolean, JSON, DateTime, ForeignKey, Float
from sqlalchemy.orm import Mapped, mapped_column
from ..core.database import Base


class Challenge(Base):
    __tablename__ = "challenges"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    type: Mapped[str] = mapped_column(String(20), nullable=False)  # quiz | circuit | coding
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    difficulty: Mapped[str] = mapped_column(String(20), default="Beginner")
    module_id: Mapped[str | None] = mapped_column(String, nullable=True)
    objective: Mapped[str | None] = mapped_column(Text, nullable=True)
    hint: Mapped[str | None] = mapped_column(Text, nullable=True)
    data: Mapped[dict] = mapped_column(JSON, default=dict)  # type-specific data
    max_score: Mapped[int] = mapped_column(Integer, default=100)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class ChallengeSubmission(Base):
    __tablename__ = "challenge_submissions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    challenge_id: Mapped[str] = mapped_column(String, ForeignKey("challenges.id", ondelete="CASCADE"), nullable=False, index=True)
    submission_data: Mapped[dict] = mapped_column(JSON, nullable=False)
    execution_result: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    score: Mapped[int] = mapped_column(Integer, default=0)
    max_score: Mapped[int] = mapped_column(Integer, default=100)
    passed: Mapped[bool] = mapped_column(Boolean, default=False)
    feedback: Mapped[str | None] = mapped_column(Text, nullable=True)
    attempt_number: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts_backend"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    lesson_id: Mapped[str] = mapped_column(String, nullable=False)
    module_id: Mapped[str] = mapped_column(String, nullable=False)
    answers: Mapped[dict] = mapped_column(JSON, default=dict)
    score: Mapped[int] = mapped_column(Integer, default=0)
    total_questions: Mapped[int] = mapped_column(Integer, default=0)
    passed: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
