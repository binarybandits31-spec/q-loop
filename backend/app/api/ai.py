from fastapi import APIRouter, Depends
from ..core.deps import get_current_user_optional
from ..models.user import User
from ..schemas.ai import AIRequest, AIResponse
from ..services.ai import AITutor

router = APIRouter(prefix="/api/ai", tags=["AI Tutor"])
tutor = AITutor()


@router.post("/explain", response_model=AIResponse)
async def ai_explain(body: AIRequest, user: User | None = Depends(get_current_user_optional)):
    """Explain a quantum concept or simulation result."""
    ctx = body.context.model_dump() if body.context else {}
    if user:
        ctx["learner_level"] = user.learning_level
    result = tutor.explain(body.question or "", ctx)
    return AIResponse(action="explain", **result)


@router.post("/hint", response_model=AIResponse)
async def ai_hint(body: AIRequest, user: User | None = Depends(get_current_user_optional)):
    """Get a hint without revealing the full answer."""
    ctx = body.context.model_dump() if body.context else {}
    if user:
        ctx["learner_level"] = user.learning_level
    result = tutor.hint(body.question or "", ctx)
    return AIResponse(action="hint", **result)


@router.post("/debug", response_model=AIResponse)
async def ai_debug(body: AIRequest, user: User | None = Depends(get_current_user_optional)):
    """Debug a circuit error or unexpected simulation result."""
    ctx = body.context.model_dump() if body.context else {}
    if user:
        ctx["learner_level"] = user.learning_level
    result = tutor.debug(body.question or "", ctx)
    return AIResponse(action="debug", **result)


@router.post("/optimize", response_model=AIResponse)
async def ai_optimize(body: AIRequest, user: User | None = Depends(get_current_user_optional)):
    """Suggest circuit or code optimizations."""
    ctx = body.context.model_dump() if body.context else {}
    result = tutor.optimize(body.question or "", ctx)
    return AIResponse(action="optimize", **result)


@router.post("/generate-code", response_model=AIResponse)
async def ai_generate_code(body: AIRequest, user: User | None = Depends(get_current_user_optional)):
    """Generate example quantum code for a given topic."""
    ctx = body.context.model_dump() if body.context else {}
    result = tutor.generate_code(body.question or "", ctx)
    return AIResponse(action="generate_code", **result)
