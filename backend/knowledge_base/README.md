# Q-Loop RAG knowledge sources

Place source files in these folders before running the knowledge indexer:

- `textbooks/`: quantum computing textbook PDFs (text-based PDFs work best).
- `faqs/`: FAQ files in Markdown or plain text.
- `references/`: other approved quantum-computing references in Markdown, text, or PDF.

The indexer also reads the existing Module 1, Module 2, and Module 3 source files under `src/lib/quantum/`, plus the curriculum lessons stored in the Q-Loop database.

After adding or changing sources, run from the `backend` directory:

```powershell
alembic upgrade head
python -m app.scripts.ingest_knowledge
```

The index is stored in the existing PostgreSQL database using the pgvector extension. Do not commit copyrighted textbooks unless you have permission to redistribute them.
