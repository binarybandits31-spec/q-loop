import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..core.database import get_db
from ..core.deps import get_current_user, get_current_user_optional
from ..models.user import User
from ..models.circuit import Circuit, CircuitRun
from ..schemas.circuit import (
    CircuitRequest, ValidationResponse, ValidationFinding,
    SimulationResponse, OptimizationResponse,
)
from ..services.quantum import CircuitAnalyzer, QiskitAerBackend, CircuitOptimizer

router = APIRouter(prefix="/api/circuits", tags=["Circuit Execution"])
analyzer = CircuitAnalyzer()
optimizer = CircuitOptimizer()


def _to_schema_findings(raw_findings: list) -> list[ValidationFinding]:
    return [
        ValidationFinding(
            severity=f.get("severity", "info"),
            type=f.get("type", "unknown"),
            message=f.get("message", ""),
            suggestion=f.get("suggestion"),
            gate_indices=f.get("gate_indices", []),
        )
        for f in raw_findings
    ]


def _circuit_to_dict(req: CircuitRequest) -> dict:
    return {
        "qubits": req.qubits,
        "classical_bits": req.classical_bits,
        "operations": [op.model_dump() for op in req.operations],
    }


@router.post("/validate", response_model=ValidationResponse)
async def validate_circuit(body: CircuitRequest, user: User | None = Depends(get_current_user_optional)):
    """Validate a circuit JSON and return structured analysis findings."""
    circuit_dict = _circuit_to_dict(body)
    findings = analyzer.analyze(circuit_dict)
    stats = analyzer.get_stats(circuit_dict)
    errors = [f for f in findings if f.severity == "error"]

    return ValidationResponse(
        is_valid=len(errors) == 0,
        findings=_to_schema_findings([f.to_dict() for f in findings]),
        gate_count=stats["gate_count"],
        qubit_count=body.qubits,
    )


@router.post("/run", response_model=SimulationResponse)
async def run_circuit(
    body: CircuitRequest,
    db: AsyncSession = Depends(get_db),
    user: User | None = Depends(get_current_user_optional),
):
    """Execute a circuit using the selected quantum backend and return results."""
    from ..services.quantum.backend import get_backend

    circuit_dict = _circuit_to_dict(body)

    # Validate first
    analysis_findings = analyzer.analyze(circuit_dict)
    errors = [f for f in analysis_findings if f.severity == "error"]
    if errors:
        raise HTTPException(
            status_code=422,
            detail={
                "message": "Circuit has validation errors that prevent execution.",
                "findings": [f.to_dict() for f in errors],
            },
        )

    try:
        backend = get_backend(body.framework)
    except (ValueError, RuntimeError) as e:
        raise HTTPException(status_code=400, detail=str(e))

    result = backend.execute(circuit_dict, shots=body.shots, include_statevector=body.include_statevector)

    # Persist run
    run_id = str(uuid.uuid4())
    circuit_run = CircuitRun(
        id=run_id,
        user_id=user.id if user else None,
        circuit_data=circuit_dict,
        framework=body.framework,
        shots=body.shots,
        status=result.status,
        counts=result.counts,
        probabilities=result.probabilities,
        statevector=result.statevector,
        execution_time_ms=result.execution_time_ms,
        error_message=result.error,
        validation_findings=[f.to_dict() for f in analysis_findings],
    )
    db.add(circuit_run)

    return SimulationResponse(
        status=result.status,
        framework=result.framework,
        shots=result.shots,
        counts=result.counts,
        probabilities=result.probabilities,
        statevector=result.statevector,
        execution_time_ms=result.execution_time_ms,
        circuit_depth=result.circuit_depth,
        gate_count=result.gate_count,
        error=result.error,
        validation_findings=_to_schema_findings([f.to_dict() for f in analysis_findings]),
        run_id=run_id,
    )


@router.post("/optimize", response_model=OptimizationResponse)
async def optimize_circuit(body: CircuitRequest):
    """Apply safe deterministic optimizations to a circuit."""
    circuit_dict = _circuit_to_dict(body)
    result = optimizer.optimize(circuit_dict)
    original_stats = analyzer.get_stats(circuit_dict)
    optimized_stats = analyzer.get_stats(result["optimized_circuit"])

    return OptimizationResponse(
        original_gate_count=original_stats["gate_count"],
        optimized_gate_count=optimized_stats["gate_count"],
        original_depth=original_stats["gate_count"],  # simplified depth estimate
        optimized_depth=optimized_stats["gate_count"],
        optimizations_applied=result["optimizations_applied"],
        original_circuit=circuit_dict,
        optimized_circuit=result["optimized_circuit"],
    )
