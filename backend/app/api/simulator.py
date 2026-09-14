"""Simulator workspace API — accepts a CircuitRequest and returns full results
with statevector, probabilities, and histogram data ready for frontend charts."""
from fastapi import APIRouter, Depends, HTTPException
from ..core.deps import get_current_user_optional
from ..models.user import User
from ..schemas.circuit import CircuitRequest, SimulationResponse, ValidationFinding
from ..services.quantum import CircuitAnalyzer, CircuitOptimizer
from ..services.quantum.backend import get_backend

router = APIRouter(prefix="/api/simulator", tags=["Simulator"])
analyzer = CircuitAnalyzer()


@router.post("/run", response_model=SimulationResponse)
async def simulator_run(
    body: CircuitRequest,
    user: User | None = Depends(get_current_user_optional),
):
    """
    Full-featured simulator endpoint with statevector support.
    Equivalent to /api/circuits/run but always requests statevector
    when possible (single-qubit or unmeasured circuits).
    """
    circuit_dict = {
        "qubits": body.qubits,
        "classical_bits": body.classical_bits,
        "operations": [op.model_dump() for op in body.operations],
    }

    findings = analyzer.analyze(circuit_dict)
    errors = [f for f in findings if f.severity == "error"]
    if errors:
        raise HTTPException(
            status_code=422,
            detail={"message": "Circuit has errors.", "findings": [f.to_dict() for f in errors]},
        )

    try:
        backend = get_backend(body.framework)
    except (ValueError, RuntimeError) as e:
        raise HTTPException(status_code=400, detail=str(e))

    include_sv = body.include_statevector or (
        not any(op.gate in ("M", "MEASURE") for op in body.operations)
    )
    result = backend.execute(circuit_dict, shots=body.shots, include_statevector=include_sv)

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
        validation_findings=[
            ValidationFinding(
                severity=f.severity, type=f.type, message=f.message,
                suggestion=f.suggestion, gate_indices=f.gate_indices,
            )
            for f in findings
        ],
    )


@router.get("/backends")
async def list_backends():
    """List available quantum backends and their operational status."""
    backends_info = [
        {
            "id": "qiskit_aer",
            "name": "Qiskit Aer",
            "description": "High-performance statevector and shot-based simulator from IBM.",
            "is_operational": True,
            "is_default": True,
        },
        {
            "id": "pennylane",
            "name": "PennyLane",
            "description": "Differentiable quantum computing (planned integration).",
            "is_operational": False,
            "is_default": False,
        },
        {
            "id": "cirq",
            "name": "Cirq",
            "description": "Google's quantum circuit simulator (planned integration).",
            "is_operational": False,
            "is_default": False,
        },
    ]
    # Verify actual Qiskit availability
    try:
        from qiskit_aer import AerSimulator
        backends_info[0]["is_operational"] = True
    except ImportError:
        backends_info[0]["is_operational"] = False
        backends_info[0]["note"] = "Install qiskit-aer to enable."

    return {"backends": backends_info}
