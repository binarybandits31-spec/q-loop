# Q-Loop: Setup Guide

Q-Loop is a quantum-computing learning/simulation platform.

- **Frontend:** React + TypeScript + Vite
- **Backend:** Python + FastAPI + Uvicorn
- **Simulators:** Qiskit Aer (default), PennyLane, Cirq
- **Database:** PostgreSQL (local)

All commands below are for **Windows PowerShell**.

## 0. Prerequisites

| Tool | Version we use |
|---|---|
| Git | any recent |
| Python | **3.12** (newer versions such as 3.14 may fail to install the quantum packages) |
| Node.js | v24.21.0 |
| PostgreSQL | any recent, with a `postgres` user |

## 1. Clone the repo

```powershell
git clone https://github.com/binarybandits31-spec/q-loop.git
cd q-loop
git config user.name "Your Name"
git config user.email "your-email@example.com"
```

Use your own name in Git so we can tell who made which commit.

## 2. Create your `.env`

```powershell
Copy-Item .env.example .env
```

Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Get them from Joy **privately**,
not through the repo or a public chat.

## 3. Create the database

The backend expects a PostgreSQL database named `qloop`. By default it connects as user
`postgres` with password `password` on `localhost:5432` (see `backend/app/core/config.py`).

```powershell
psql -U postgres -c "CREATE DATABASE qloop;"
```

If `psql` is not recognized, create a database named `qloop` in pgAdmin instead.
If your `postgres` password is not `password`, set `DATABASE_URL` and `SYNC_DATABASE_URL`
in `.env` (see the commented lines in `.env.example`).

## 4. Backend setup (from the project root)

```powershell
py -3.12 -m venv backend\.venv
.\backend\.venv\Scripts\python.exe -m pip install --upgrade pip
.\backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
```

Create the tables:

```powershell
cd backend
..\backend\.venv\Scripts\python.exe -m alembic upgrade head
cd ..
```

## 5. Frontend setup (from the project root)

```powershell
npm install
```

## 6. Starter data (automatic)

No seed command is needed. When the backend starts and the `modules` table is empty, it
loads the 13-module curriculum automatically (see `backend/app/scripts/seed.py`).

## 7. Run the app (two terminals, keep both open)

**Terminal 1: backend** (from the project root):

```powershell
.\backend\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --app-dir backend
```

Wait for `Application startup complete`.

**Terminal 2: frontend** (from the project root):

```powershell
npm run dev
```

Open the `Local:` URL it prints (usually `http://localhost:5173`) and go to `/simulate`.

## 8. Check that it works

Open `http://localhost:8000/api/simulator/backends`. You should see `qiskit_aer`,
`pennylane` and `cirq`, all with `"is_operational": true`.

On the Simulator page, run the **Bell State** example. You should get roughly 50% `00`
and 50% `11`. If you see an orange "Backend Error: Failed to fetch" box, the backend is
not running.

## Working together (shared GitHub account)

- Run `git pull origin main` **before you start work** and **before every push**.
- Do not use `git push --force`.
- Never commit `.env`, `.venv/`, or `node_modules/`.
- If Git reports a conflict, stop and ask before resolving it.

## Known issues

- The local fallback simulator (used when the backend is down) shows |00> 100% for the
  Bell State. This is a bug in `src/lib/quantum/simulator.ts`; backend results are correct.
- The AI Tutor rewrite removed the old `process()` method from
  `backend/app/services/ai/tutor.py`. If an API route still calls it, the AI Tutor page
  will error.
- The Simulator page does not yet show which framework produced a result. Check the
  `framework` field in the Network tab of the browser dev tools.