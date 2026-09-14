import uuid
from datetime import datetime
from sqlalchemy import String, Text, Integer, Boolean, JSON, DateTime, ForeignKey, Float
from sqlalchemy.orm import Mapped, mapped_column
from ..core.database import Base


class Circuit(Base):
    __tablename__ = "circuits"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    circuit_data: Mapped[dict] = mapped_column(JSON, nullable=False)
    num_qubits: Mapped[int] = mapped_column(Integer, nullable=False)
    is_public: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class CircuitRun(Base):
    __tablename__ = "circuit_runs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str | None] = mapped_column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    circuit_data: Mapped[dict] = mapped_column(JSON, nullable=False)
    framework: Mapped[str] = mapped_column(String(50), default="qiskit_aer")
    shots: Mapped[int] = mapped_column(Integer, default=1024)
    status: Mapped[str] = mapped_column(String(20), default="pending")
    counts: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    probabilities: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    statevector: Mapped[list | None] = mapped_column(JSON, nullable=True)
    execution_time_ms: Mapped[float | None] = mapped_column(Float, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    validation_findings: Mapped[list] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
