from pydantic import BaseModel, field_validator, model_validator
from typing import Optional, List, Dict, Any
from ..core.config import settings

VALID_GATES = {
    "H", "X", "Y", "Z", "S", "T", "SDG", "TDG",
    "CX", "CNOT", "CZ", "CY", "CH",
    "RX", "RY", "RZ", "P", "U",
    "SWAP", "TOFFOLI", "CCX",
    "M", "MEASURE",
}


class CircuitOperation(BaseModel):
    gate: str
    target: int
    control: Optional[int] = None
    control2: Optional[int] = None
    parameter: Optional[float] = None
    condition_bit: Optional[int] = None
    condition_value: Optional[int] = None

    @field_validator("gate")
    @classmethod
    def validate_gate(cls, v: str) -> str:
        if v.upper() not in VALID_GATES:
            raise ValueError(f"Unknown gate '{v}'. Valid gates: {sorted(VALID_GATES)}")
        return v.upper()


class CircuitRequest(BaseModel):
    qubits: int
    classical_bits: int = 0
    operations: List[CircuitOperation]
    shots: int = 1024
    framework: str = "qiskit_aer"
    include_statevector: bool = False

    @field_validator("qubits")
    @classmethod
    def valid_qubits(cls, v: int) -> int:
        if v < 1:
            raise ValueError("At least 1 qubit required")
        if v > settings.MAX_CIRCUIT_QUBITS:
            raise ValueError(f"Maximum {settings.MAX_CIRCUIT_QUBITS} qubits allowed")
        return v

    @field_validator("shots")
    @classmethod
    def valid_shots(cls, v: int) -> int:
        if v < 1:
            raise ValueError("shots must be >= 1")
        if v > settings.MAX_SHOTS:
            raise ValueError(f"Maximum {settings.MAX_SHOTS} shots allowed")
        return v

    @field_validator("framework")
    @classmethod
    def valid_framework(cls, v: str) -> str:
        allowed = {"qiskit_aer", "pennylane", "cirq"}
        if v not in allowed:
            raise ValueError(f"Framework must be one of {allowed}")
        return v


class ValidationFinding(BaseModel):
    severity: str  # error | warning | optimization | info
    type: str
    message: str
    suggestion: Optional[str] = None
    gate_indices: Optional[List[int]] = None


class ValidationResponse(BaseModel):
    is_valid: bool
    findings: List[ValidationFinding]
    gate_count: int
    qubit_count: int
    depth: Optional[int] = None


class SimulationResponse(BaseModel):
    status: str  # success | error
    framework: str
    shots: int
    counts: Dict[str, int]
    probabilities: Dict[str, float]
    statevector: Optional[List[List[float]]] = None  # [[re, im], ...]
    execution_time_ms: float
    circuit_depth: Optional[int] = None
    gate_count: int
    error: Optional[str] = None
    validation_findings: List[ValidationFinding] = []
    run_id: Optional[str] = None


class CircuitExecuteOperation(BaseModel):
    gate: str
    target: int
    control: Optional[int] = None
    control2: Optional[int] = None
    parameter: Optional[float] = None
    condition_bit: Optional[int] = None
    condition_value: Optional[int] = None


class CircuitExecuteRequest(BaseModel):
    qubits: int
    classical_bits: int = 0
    operations: List[CircuitExecuteOperation]
    shots: int = 1024


class OptimizationResponse(BaseModel):
    original_gate_count: int
    optimized_gate_count: int
    original_depth: int
    optimized_depth: int
    optimizations_applied: List[Dict[str, Any]]
    original_circuit: Dict[str, Any]
    optimized_circuit: Dict[str, Any]