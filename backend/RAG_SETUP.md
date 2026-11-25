# Q-Loop AI Tutor: GPT-4o-mini + RAG setup

The AI Tutor uses the existing FastAPI backend, OpenAI GPT-4o-mini for answer generation, OpenAI `text-embedding-3-small` for embeddings, and the existing PostgreSQL database with pgvector for semantic retrieval. Jarvis is not part of this flow.

## 1. Configure backend environment

Set these variables in the backend environment (local `backend/.env` and your hosting provider):

```env
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
RAG_TOP_K=5
```

Keep the API key on the server. Never add it to a `VITE_*` frontend variable or commit it.

## 2. Install dependencies

From the `backend` directory:

```powershell
pip install -r requirements.txt
```

## 3. Apply the database migration

The database must support the PostgreSQL pgvector extension. The configured Supabase PostgreSQL project supports enabling pgvector from its database extensions panel if it is not already enabled.

Run:

```powershell
alembic upgrade head
```

Migration `0003_rag_documents` creates the vector table and cosine-similarity index.

## 4. Add knowledge sources

The indexer reads:
- Module 1 source: `src/lib/quantum/lessons.ts`
- Module 2 source: `src/lib/quantum/module2.ts`
- Module 3 source: `src/lib/quantum/module3.md`
- Curriculum lessons stored in the Q-Loop PostgreSQL database
- PDF, Markdown, and text files under `backend/knowledge_base/textbooks/`, `faqs/`, and `references/`

Add textbooks only when you have permission to process them. Text-based PDFs work best; scanned PDFs need OCR before indexing.

## 5. Build or refresh the vector index

From the `backend` directory:

```powershell
python -m app.scripts.ingest_knowledge
```

The script chunks the sources, creates embeddings, and replaces the existing RAG index. Re-run it whenever curriculum content, textbooks, or FAQs change.

## 6. Verify

Start the backend and open `/docs`. Test `POST /api/ai/explain` with a quantum question. The response includes `sources`; the AI Tutor UI displays those references below the answer.

If the vector table is empty, the tutor can still answer with GPT-4o-mini general knowledge, but its confidence is marked medium and the response does not claim to be grounded in indexed Q-Loop sources.
