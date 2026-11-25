"""Index Q-Loop curriculum, reference files, textbooks and FAQs into pgvector.

Run from backend/: python -m app.scripts.ingest_knowledge
"""
import asyncio
import json
import re
from pathlib import Path
from typing import Any

from openai import AsyncOpenAI
from sqlalchemy import select, text

from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.models.module import Lesson, Module


REPO_ROOT = Path(__file__).resolve().parents[3]
KNOWLEDGE_DIR = REPO_ROOT / "backend" / "knowledge_base"
CURRICULUM_FILES = [
    (REPO_ROOT / "src" / "lib" / "quantum" / "lessons.ts", "module-1", "Module 1: Mathematical Foundations"),
    (REPO_ROOT / "src" / "lib" / "quantum" / "module2.ts", "module-2", "Module 2: Quantum Computing Fundamentals"),
    (REPO_ROOT / "src" / "lib" / "quantum" / "module3.md", "module-3", "Module 3: Quantum Algorithms"),
]


def chunk_text(text_value: str, size: int = 1400, overlap: int = 220) -> list[str]:
    clean = re.sub(r"\n{3,}", "\n\n", text_value).strip()
    if not clean:
        return []
    chunks = []
    start = 0
    while start < len(clean):
        end = min(start + size, len(clean))
        if end < len(clean):
            boundary = clean.rfind("\n", start + size // 2, end)
            if boundary > start:
                end = boundary
        piece = clean[start:end].strip()
        if piece:
            chunks.append(piece)
        if end >= len(clean):
            break
        start = max(end - overlap, start + 1)
    return chunks


def lesson_sections(module: Module, lesson: Lesson) -> list[dict[str, Any]]:
    base = f"Module: {module.title}\nLesson: {lesson.title}\n{lesson.description}"
    if lesson.objectives:
        base += "\nLearning objectives: " + "; ".join(lesson.objectives)
    sections = []
    for item in lesson.content or []:
        if not isinstance(item, dict):
            continue
        heading = str(item.get("heading") or lesson.title)
        body = str(item.get("body") or "")
        formula = str(item.get("formula") or "")
        sections.append({
            "text": f"{base}\nSection: {heading}\n{body}\n{formula}".strip(),
            "source_type": "curriculum",
            "source_name": "Q-Loop course curriculum",
            "module_id": module.id,
            "chapter": lesson.title,
            "section": heading,
            "page": None,
            "metadata": {"lesson_id": lesson.id},
        })
    for item in lesson.quiz or []:
        if isinstance(item, dict):
            q = item.get("question", "")
            options = item.get("options", [])
            explanation = item.get("explanation", "")
            sections.append({
                "text": f"{base}\nReview question: {q}\nOptions: {'; '.join(options)}\nExplanation: {explanation}",
                "source_type": "faq",
                "source_name": "Q-Loop lesson review questions",
                "module_id": module.id,
                "chapter": lesson.title,
                "section": "Review questions",
                "page": None,
                "metadata": {"lesson_id": lesson.id, "quiz_id": item.get("id")},
            })
    if not sections:
        sections.append({
            "text": base,
            "source_type": "curriculum",
            "source_name": "Q-Loop course curriculum",
            "module_id": module.id,
            "chapter": lesson.title,
            "section": None,
            "page": None,
            "metadata": {"lesson_id": lesson.id},
        })
    return sections


def extract_typescript_strings(source: str) -> str:
    """Extract human-readable string literals from lesson data TypeScript files."""
    matches = re.findall(r'"((?:\\.|[^"\\])*)"|\'((?:\\.|[^\'\\])*)\'|`([\s\S]*?)`', source)
    values = []
    for double, single, template in matches:
        value = double or single or template
        value = value.replace("\\n", "\n").replace("\\t", " ")
        if len(value.strip()) >= 24:
            values.append(value.strip())
    return "\n\n".join(values)


def read_reference_files() -> list[dict[str, Any]]:
    documents: list[dict[str, Any]] = []
    for path, module_id, label in CURRICULUM_FILES:
        if not path.exists():
            print(f"[ingest] Skipping missing curriculum source: {path}")
            continue
        raw = path.read_text(encoding="utf-8")
        content = raw if path.suffix.lower() == ".md" else extract_typescript_strings(raw)
        for index, chunk in enumerate(chunk_text(content)):
            documents.append({
                "text": f"{label}\nSource file: {path.name}\n{chunk}",
                "source_type": "curriculum",
                "source_name": path.name,
                "module_id": module_id,
                "chapter": label,
                "section": f"Content segment {index + 1}",
                "page": None,
                "metadata": {"source_path": str(path.relative_to(REPO_ROOT))},
            })

    if KNOWLEDGE_DIR.exists():
        try:
            from pypdf import PdfReader
        except ImportError:
            PdfReader = None

        for path in KNOWLEDGE_DIR.rglob("*"):
            if not path.is_file():
                continue
            suffix = path.suffix.lower()
            source_type = "textbook" if "textbook" in path.parts else ("faq" if "faq" in path.parts else "reference")
            if suffix == ".pdf":
                if PdfReader is None:
                    print("[ingest] Install pypdf to index PDF textbooks.")
                    continue
                reader = PdfReader(str(path))
                for page_number, page in enumerate(reader.pages, start=1):
                    page_text = page.extract_text() or ""
                    for index, chunk in enumerate(chunk_text(page_text)):
                        documents.append({
                            "text": chunk,
                            "source_type": source_type,
                            "source_name": path.name,
                            "module_id": None,
                            "chapter": None,
                            "section": f"Page {page_number}, segment {index + 1}",
                            "page": page_number,
                            "metadata": {"source_path": str(path.relative_to(REPO_ROOT))},
                        })
            elif suffix in {".md", ".txt"} and path.name.lower() != "readme.md":
                raw = path.read_text(encoding="utf-8", errors="ignore")
                for index, chunk in enumerate(chunk_text(raw)):
                    documents.append({
                        "text": chunk,
                        "source_type": source_type,
                        "source_name": path.name,
                        "module_id": None,
                        "chapter": None,
                        "section": f"Segment {index + 1}",
                        "page": None,
                        "metadata": {"source_path": str(path.relative_to(REPO_ROOT))},
                    })
    return documents


async def main() -> None:
    if not settings.OPENAI_API_KEY:
        raise RuntimeError("OPENAI_API_KEY is required to create embeddings.")
    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    documents = read_reference_files()

    async with AsyncSessionLocal() as session:
        rows = (await session.execute(
            select(Module, Lesson).join(Lesson, Lesson.module_id == Module.id)
        )).all()
        for module, lesson in rows:
            documents.extend(lesson_sections(module, lesson))

    expanded = []
    for document in documents:
        for index, chunk in enumerate(chunk_text(document["text"])):
            expanded.append({**document, "text": chunk, "metadata": {
                **document.get("metadata", {}), "chunk_index": index
            }})

    if not expanded:
        raise RuntimeError("No knowledge sources found to index.")

    insert_sql = text("""
        INSERT INTO rag_documents
            (content, source_type, source_name, module_id, chapter, section, page, metadata, embedding)
        VALUES
            (:content, :source_type, :source_name, :module_id, :chapter, :section, :page,
             CAST(:metadata AS jsonb), CAST(:embedding AS vector))
    """)

    # Build all embeddings before replacing the current index. If an OpenAI
    # request fails, the previously working index remains available.
    prepared_rows = []
    total = len(expanded)
    for start in range(0, total, 64):
        batch = expanded[start:start + 64]
        response = await client.embeddings.create(
            model=settings.OPENAI_EMBEDDING_MODEL,
            input=[item["text"] for item in batch],
        )
        for item, vector_item in zip(batch, response.data):
            vector = "[" + ",".join(str(value) for value in vector_item.embedding) + "]"
            prepared_rows.append({
                "content": item["text"],
                "source_type": item["source_type"],
                "source_name": item["source_name"],
                "module_id": item.get("module_id"),
                "chapter": item.get("chapter"),
                "section": item.get("section"),
                "page": item.get("page"),
                "metadata": json.dumps(item.get("metadata", {})),
                "embedding": vector,
            })
        print(f"[ingest] Prepared {len(prepared_rows)}/{total} chunks")

    async with AsyncSessionLocal() as session:
        async with session.begin():
            await session.execute(text("DELETE FROM rag_documents"))
            await session.execute(insert_sql, prepared_rows)

    print(f"[ingest] Completed. Indexed {total} knowledge chunks.")


if __name__ == "__main__":
    asyncio.run(main())
