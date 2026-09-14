"""Initial schema — all Q-loop tables.

Revision ID: 0001
Revises:
Create Date: 2026-09-12
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table("users",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("display_name", sa.String(100), nullable=True),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("role", sa.Enum("student", "instructor", name="user_role"), nullable=False, server_default="student"),
        sa.Column("learning_level", sa.Enum("beginner", "intermediate", "advanced", name="learning_level"), nullable=False, server_default="beginner"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("streak_days", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("total_study_minutes", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    op.create_index("ix_users_email", "users", ["email"])

    op.create_table("modules",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("icon", sa.String(50), nullable=False, server_default="BookOpen"),
        sa.Column("color", sa.String(20), nullable=False, server_default="#22d3ee"),
        sa.Column("order_index", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("objectives", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table("lessons",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("module_id", sa.String(), nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("duration", sa.Integer(), nullable=False, server_default="20"),
        sa.Column("difficulty", sa.String(20), nullable=False, server_default="Beginner"),
        sa.Column("objectives", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("content", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("quiz", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("circuit_example", sa.Text(), nullable=True),
        sa.Column("order_index", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["module_id"], ["modules.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_lessons_module_id", "lessons", ["module_id"])

    op.create_table("circuits",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("circuit_data", sa.JSON(), nullable=False),
        sa.Column("num_qubits", sa.Integer(), nullable=False),
        sa.Column("is_public", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table("circuit_runs",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("user_id", sa.String(), nullable=True),
        sa.Column("circuit_data", sa.JSON(), nullable=False),
        sa.Column("framework", sa.String(50), nullable=False, server_default="qiskit_aer"),
        sa.Column("shots", sa.Integer(), nullable=False, server_default="1024"),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("counts", sa.JSON(), nullable=True),
        sa.Column("probabilities", sa.JSON(), nullable=True),
        sa.Column("statevector", sa.JSON(), nullable=True),
        sa.Column("execution_time_ms", sa.Float(), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("validation_findings", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table("challenges",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("type", sa.String(20), nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("difficulty", sa.String(20), nullable=False, server_default="Beginner"),
        sa.Column("module_id", sa.String(), nullable=True),
        sa.Column("objective", sa.Text(), nullable=True),
        sa.Column("hint", sa.Text(), nullable=True),
        sa.Column("data", sa.JSON(), nullable=False, server_default="{}"),
        sa.Column("max_score", sa.Integer(), nullable=False, server_default="100"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table("challenge_submissions",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("challenge_id", sa.String(), nullable=False),
        sa.Column("submission_data", sa.JSON(), nullable=False),
        sa.Column("execution_result", sa.JSON(), nullable=True),
        sa.Column("score", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("max_score", sa.Integer(), nullable=False, server_default="100"),
        sa.Column("passed", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("feedback", sa.Text(), nullable=True),
        sa.Column("attempt_number", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["challenge_id"], ["challenges.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table("quiz_attempts_backend",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("lesson_id", sa.String(), nullable=False),
        sa.Column("module_id", sa.String(), nullable=False),
        sa.Column("answers", sa.JSON(), nullable=False, server_default="{}"),
        sa.Column("score", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("total_questions", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("passed", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table("progress",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("lesson_id", sa.String(), nullable=False),
        sa.Column("module_id", sa.String(), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="not_started"),
        sa.Column("quiz_score", sa.Integer(), nullable=True),
        sa.Column("time_spent_minutes", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_progress_user_id", "progress", ["user_id"])

    op.create_table("mistake_logs",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("mistake_type", sa.String(100), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("context", sa.JSON(), nullable=False, server_default="{}"),
        sa.Column("lesson_id", sa.String(), nullable=True),
        sa.Column("module_id", sa.String(), nullable=True),
        sa.Column("resolved", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table("recommendations_backend",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("type", sa.String(30), nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("target_id", sa.String(), nullable=True),
        sa.Column("priority", sa.String(10), nullable=False, server_default="medium"),
        sa.Column("dismissed", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    for tbl in ["recommendations_backend", "mistake_logs", "progress", "quiz_attempts_backend",
                "challenge_submissions", "challenges", "circuit_runs", "circuits", "lessons", "modules", "users"]:
        op.drop_table(tbl)
    op.execute("DROP TYPE IF EXISTS user_role")
    op.execute("DROP TYPE IF EXISTS learning_level")
