"""Q-loop FastAPI application entry point.

Registers all routers, configures CORS, and provides startup events.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from .core.config import settings
from .api import auth, modules, lessons, circuits, simulator, code, ai, challenges, progress, instructor
from .schemas.circuit import CircuitExecuteRequest


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: verify DB connection and seed curriculum if empty
    try:
        from .core.database import engine, AsyncSessionLocal
        from sqlalchemy import text
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))

        from .scripts.seed import seed_curriculum
        async with AsyncSessionLocal() as session:
            await seed_curriculum(session)
    except Exception as e:
        print(f"[startup] Warning: {e}")

    yield
    # Shutdown


def create_app() -> FastAPI:
    app = FastAPI(
        title="Q-loop API",
        description=(
            "Backend for Q-loop — AI-Based Interactive Quantum Algorithm Learning Platform. "
            "Provides quantum circuit execution, AI tutoring, progress tracking, and assessment."
        ),
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Register all routers
    for router in [
        auth.router,
        modules.router,
        lessons.router,
        circuits.router,
        simulator.router,
        code.router,
        ai.router,
        challenges.router,
        progress.router,
        instructor.router,
    ]:
        app.include_router(router)

    @app.get("/health", tags=["Health"])
    async def health():
        """Liveness probe."""
        return {"status": "ok", "service": "q-loop-api"}

    @app.get("/api/health", tags=["Health"])
    async def api_health():
        """Health check for the Q-loop backend service."""
        return {"status": "ok", "service": "q-loop-backend"}

    @app.get("/api/status", tags=["Health"])
    async def api_status():
        """Dependency status including quantum backend availability."""
        qiskit_ok = False
        try:
            from qiskit_aer import AerSimulator
            qiskit_ok = True
        except ImportError:
            pass

        openai_configured = bool(settings.OPENAI_API_KEY)

        return {
            "api": "operational",
            "quantum_backend": "qiskit_aer" if qiskit_ok else "unavailable",
            "ai_service": "openai" if openai_configured else "knowledge_base_fallback",
            "environment": settings.ENVIRONMENT,
        }

    @app.post("/api/execute", tags=["Circuit Execution"])
    async def execute_circuit(body: CircuitExecuteRequest):
        """Clean endpoint: accept a circuit JSON, execute via Qiskit Aer, return results."""
        from .services.quantum.backend import get_backend
        from .services.quantum import CircuitAnalyzer

        analyzer = CircuitAnalyzer()
        circuit_dict = {
            "qubits": body.qubits,
            "classical_bits": body.classical_bits,
            "operations": [op.model_dump() for op in body.operations],
        }

        findings = analyzer.analyze(circuit_dict)
        errors = [f for f in findings if f.severity == "error"]
        if errors:
            return {
                "success": False,
                "counts": {},
                "probabilities": {},
                "num_qubits": body.qubits,
                "shots": body.shots,
                "simulator": "qiskit_aer",
                "error": "; ".join(f.message for f in errors),
            }

        try:
            backend = get_backend("qiskit_aer")
        except (ValueError, RuntimeError) as e:
            return {
                "success": False,
                "counts": {},
                "probabilities": {},
                "num_qubits": body.qubits,
                "shots": body.shots,
                "simulator": "qiskit_aer",
                "error": str(e),
            }

        result = backend.execute(circuit_dict, shots=body.shots, include_statevector=False)

        return {
            "success": result.status == "success",
            "counts": result.counts,
            "probabilities": result.probabilities,
            "num_qubits": body.qubits,
            "shots": result.shots,
            "simulator": result.framework,
            "error": result.error,
        }

    return app


app = create_app()