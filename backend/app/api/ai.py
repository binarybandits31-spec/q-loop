from fastapi import APIRouter, Depends
from ..core.deps import get_current_user_optional
from ..models.user import User
from ..schemas.ai import AIRequest, AIResponse
from ..services.ai import AITutor
from ..services.ai.agent import agent

router = APIRouter(prefix="/api/ai", tags=["AI Tutor"])
tutor = AITutor()


def _circuit_question(question: str) -> bool:
    text = (question or "").lower()
    intents = (
        "circuit", "these gates", "this gate", "my gates", "analyze",
        "analyse", "simulate", "predict", "measurement", "probability",
        "probabilities", "counts", "output", "result", "what happens",
        "what will happen", "explain this", "why does", "why did",
        "statevector", "state vector", "entangle",
    )
    return any(term in text for term in intents)


def _context(body: AIRequest, user: User | None) -> dict:
    ctx = body.context.model_dump() if body.context else {}
    if user:
        ctx["learner_level"] = user.learning_level
    return ctx


@router.post("/explain", response_model=AIResponse)
async def ai_explain(body: AIRequest, user: User | None = Depends(get_current_user_optional)):
    """Explain concepts; when asked about the live circuit, use actual simulator output."""
    question = body.question or ""
    ctx = _context(body, user)
    circuit = ctx.get("circuit")

    # Do not guess circuit outcomes. Run the actual Q-Loop backend for circuit questions.
    if isinstance(circuit, dict) and circuit.get("operations") and _circuit_question(question):
        try:
            result = agent.run_tool("simulate_circuit", {"circuit": circuit})
        except Exception as exc:
            result = {"status": "error", "error": str(exc)}

        if result and result.get("status") == "success":
            ctx["circuit"] = result.get("circuit") or circuit
            ctx["simulation_result"] = result
            # Prefer a language-model explanation grounded in the verified result.
            generated = tutor._ask_openai(question, ctx)
            if generated:
                return AIResponse(
                    action="explain",
                    response=generated,
                    suggestions=[
                        "Explain the gates step by step",
                        "Why do these measurement counts occur?",
                        "Compare observed counts with theoretical probabilities",
                    ],
                    code_example=None,
                    confidence="high",
                    sources=["Q-Loop quantum simulator", "AI Tutor"],
                )
            # Without an AI provider key, return transparent simulator-grounded analysis.
            return AIResponse(
                action="explain",
                response=tutor._build_simulation_explanation(result, ctx),
                suggestions=[
                    "Explain the gates step by step",
                    "Why do these measurement counts occur?",
                    "Compare observed counts with theoretical probabilities",
                ],
                code_example=None,
                confidence="high",
                sources=["Q-Loop quantum simulator"],
            )

        error = (result or {}).get("error", "The simulator did not return a successful result.")
        return AIResponse(
            action="explain",
            response="I could not verify a prediction because the circuit simulation failed. Please check the circuit and try again.\n\nSimulator detail: " + str(error),
            suggestions=["Check circuit validation", "Review the gate connections", "Try the simulation again"],
            code_example=None,
            confidence="low",
            sources=["Q-Loop quantum simulator"],
        )

    return AIResponse(action="explain", **tutor.explain(question, ctx))


@router.post("/hint", response_model=AIResponse)
async def ai_hint(body: AIRequest, user: User | None = Depends(get_current_user_optional)):
    ctx = _context(body, user)
    return AIResponse(action="hint", **tutor.hint(body.question or "", ctx))


@router.post("/debug", response_model=AIResponse)
async def ai_debug(body: AIRequest, user: User | None = Depends(get_current_user_optional)):
    ctx = _context(body, user)
    return AIResponse(action="debug", **tutor.debug(body.question or "", ctx))


@router.post("/optimize", response_model=AIResponse)
async def ai_optimize(body: AIRequest, user: User | None = Depends(get_current_user_optional)):
    ctx = _context(body, user)
    return AIResponse(action="optimize", **tutor.optimize(body.question or "", ctx))


@router.post("/generate-code", response_model=AIResponse)
async def ai_generate_code(body: AIRequest, user: User | None = Depends(get_current_user_optional)):
    ctx = _context(body, user)
    return AIResponse(action="generate_code", **tutor.generate_code(body.question or "", ctx))
