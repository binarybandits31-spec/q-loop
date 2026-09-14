import uuid
from datetime import datetime
from sqlalchemy import String, Text, Integer, Boolean, JSON, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from ..core.database import Base


class Module(Base):
    __tablename__ = "modules"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    icon: Mapped[str] = mapped_column(String(50), default="BookOpen")
    color: Mapped[str] = mapped_column(String(20), default="#22d3ee")
    order_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    objectives: Mapped[list] = mapped_column(JSON, default=list)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Lesson(Base):
    __tablename__ = "lessons"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    module_id: Mapped[str] = mapped_column(String, ForeignKey("modules.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    duration: Mapped[int] = mapped_column(Integer, default=20)
    difficulty: Mapped[str] = mapped_column(String(20), default="Beginner")
    objectives: Mapped[list] = mapped_column(JSON, default=list)
    content: Mapped[list] = mapped_column(JSON, default=list)
    quiz: Mapped[list] = mapped_column(JSON, default=list)
    circuit_example: Mapped[str | None] = mapped_column(Text, nullable=True)
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
