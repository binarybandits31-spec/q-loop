# Q-loop Backend

FastAPI backend for Q-loop — AI-Based Interactive Quantum Algorithm Learning Platform.

## Architecture

```
backend/
├── app/
│   ├── main.py               # FastAPI app entry point, lifespan, CORS
│   ├── api/                  # Route handlers (thin — logic in services/)
│   │   ├── auth.py           # POST /register, /login, GET /me
│   │   ├── modules.py        # GET /modules, /modules/{id}
│   │   ├── lessons.py        # GET /lessons/{id}
│   │   ├── circuits.py       # POST /validate, /run, /optimize
│   │   ├── simulator.py      # POST /simulator/run, GET /backends
│   │   ├── code.py           # POST /code/run (sandboxed Python)
│   │   ├── ai.py             # POST /ai/explain, /hint, /debug, /optimize, /generate-code
│   │   ├── challenges.py     # GET/POST challenges and submissions
│   │   ├── progress.py       # GET/POST progress tracking
│   │   └── instructor.py     # Instructor-only analytics
│   ├── models/               # SQLAlchemy ORM models
│   ├── schemas/              # Pydantic request/response schemas
│   ├── services/
│   │   ├── quantum/          # QuantumBackend interface + QiskitAerBackend adapter
│   │   ├── ai/               # AI Tutor (OpenAI + knowledge base fallback)
│   │   ├── assessment/       # Automated grader
│   │   └── recommendation/   # Personalized recommendation engine
│   ├── core/                 # Config, DB, security, deps
│   └── scripts/seed.py       # Curriculum seeder (runs at startup)
├── alembic/                  # Database migrations
├── tests/                    # Pytest test suite
├── requirements.txt
└── .env.example
```

## Setup

### 1. Install dependencies

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env — set DATABASE_URL, SECRET_KEY, optionally OPENAI_API_KEY
```

**Database**: The backend uses the same Supabase PostgreSQL instance as the frontend.
Get the direct connection string from your Supabase project → Settings → Database → Connection string.

### 3. Run database migrations

```bash
alembic upgrade head
```

The curriculum (13 modules, lessons, challenges) is seeded automatically at first startup.

### 4. Start the server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API docs at: http://localhost:8000/docs

## Key Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/register | Register student or instructor |
| POST | /api/auth/login | Login, receive JWT |
| GET | /api/auth/me | Current user profile |
| GET | /api/modules | All 13 curriculum modules |
| GET | /api/modules/{id} | Single module with lessons |
| GET | /api/lessons/{id} | Single lesson with quiz |
| POST | /api/circuits/validate | Validate circuit JSON |
| POST | /api/circuits/run | Execute circuit (Qiskit Aer) |
| POST | /api/circuits/optimize | Apply safe circuit optimizations |
| POST | /api/simulator/run | Full simulator with statevector |
| GET | /api/simulator/backends | Available quantum backends |
| POST | /api/code/run | Execute Qiskit Python (sandboxed) |
| POST | /api/ai/explain | AI concept explanation |
| POST | /api/ai/hint | AI learning hint |
| POST | /api/ai/debug | AI debugging help |
| POST | /api/ai/optimize | AI optimization suggestions |
| POST | /api/ai/generate-code | AI code generation |
| GET | /api/challenges | List all challenges |
| POST | /api/challenges/quiz/submit | Submit quiz answers |
| POST | /api/challenges/{id}/submit/circuit | Submit circuit challenge |
| POST | /api/challenges/{id}/submit/code | Submit coding challenge |
| GET | /api/progress | User's full learning progress |
| POST | /api/progress/update | Update lesson progress |
| GET | /api/instructor/overview | Platform statistics (instructor) |
| GET | /api/instructor/students | All student progress (instructor) |
| GET | /api/instructor/mistakes | Common mistakes analytics (instructor) |

## Circuit API Format

```json
{
  "qubits": 2,
  "classical_bits": 2,
  "shots": 1024,
  "framework": "qiskit_aer",
  "operations": [
    {"gate": "H", "target": 0},
    {"gate": "CX", "control": 0, "target": 1},
    {"gate": "MEASURE", "target": 0},
    {"gate": "MEASURE", "target": 1}
  ]
}
```

Supported gates: H, X, Y, Z, S, T, SDG, TDG, RX, RY, RZ, P, U, CX/CNOT, CZ, CY, CH, SWAP, TOFFOLI/CCX, MEASURE/M

## Running Tests

```bash
pytest
```

The Bell state test (`test_qiskit_simulation.py`) executes a **real Qiskit Aer circuit** and verifies the actual measurement distribution. It is skipped automatically if Qiskit is not installed.

## Security

- Passwords are bcrypt-hashed — never stored in plaintext
- JWT (HS256) for API authentication
- Instructor routes protected by role check middleware
- Code Lab sandboxes execution — no OS/file/subprocess access
- CORS configured via `ALLOWED_ORIGINS` in `.env`
- All circuit inputs validated before execution

## AI Service

The AI Tutor uses OpenAI's API when `OPENAI_API_KEY` is configured. Without it, a curated 15-topic quantum computing knowledge base provides deterministic responses. The AI **always explains actual simulator results** — it never fabricates quantum measurements.
