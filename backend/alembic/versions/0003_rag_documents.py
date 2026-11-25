"""Add pgvector-backed knowledge chunks for RAG.

Revision ID: 0003_rag_documents
Revises: 0002_chat_history
"""
from alembic import op
import sqlalchemy as sa

revision = "0003_rag_documents"
down_revision = "0002_chat_history"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")
    op.execute("""
        CREATE TABLE rag_documents (
            id BIGSERIAL PRIMARY KEY,
            content TEXT NOT NULL,
            source_type VARCHAR(40) NOT NULL,
            source_name TEXT NOT NULL,
            module_id VARCHAR(120),
            chapter TEXT,
            section TEXT,
            page INTEGER,
            metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
            embedding VECTOR(1536) NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    op.execute("""
        CREATE INDEX ix_rag_documents_embedding
        ON rag_documents USING hnsw (embedding vector_cosine_ops)
    """)
    op.execute("CREATE INDEX ix_rag_documents_module_id ON rag_documents (module_id)")
    op.execute("CREATE INDEX ix_rag_documents_source_type ON rag_documents (source_type)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS rag_documents")
