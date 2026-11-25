"""PostgreSQL/pgvector retrieval for the Q-Loop AI Tutor."""
from typing import Any

from openai import AsyncOpenAI
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import settings
from app.core.database import AsyncSessionLocal


async def retrieve_relevant_chunks(question: str, limit: int | None = None) -> list[dict[str, Any]]:
    """Embed a learner question and retrieve the closest indexed knowledge chunks."""
    if not settings.OPENAI_API_KEY or not question.strip():
        return []

    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    embedding_response = await client.embeddings.create(
        model=settings.OPENAI_EMBEDDING_MODEL,
        input=question.strip(),
    )
    vector = embedding_response.data[0].embedding
    vector_literal = "[" + ",".join(str(value) for value in vector) + "]"

    query = text("""
        SELECT content, source_type, source_name, module_id, chapter, section, page,
               1 - (embedding <=> CAST(:embedding AS vector)) AS similarity
        FROM rag_documents
        WHERE 1 - (embedding <=> CAST(:embedding AS vector)) >= :min_similarity
        ORDER BY embedding <=> CAST(:embedding AS vector)
        LIMIT :limit
    """)

    try:
        async with AsyncSessionLocal() as session:
            result = await session.execute(
                query,
                {"embedding": vector_literal, "limit": limit or settings.RAG_TOP_K, "min_similarity": settings.RAG_MIN_SIMILARITY},
            )
            return [dict(row) for row in result.mappings().all()]
    except SQLAlchemyError as exc:
        # A missing migration or unavailable pgvector extension should not crash
        # the entire API. The tutor will clearly fall back to model knowledge.
        print(f"[rag] Retrieval unavailable: {exc}")
        return []
