"""Abstract quantum backend interface.

All adapters (QiskitAer, PennyLane, Cirq, qBraid) must implement this interface.
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Dict, List, Optional


@dataclass
class ExecutionResult:
    status: str  # success | error
    framework: str
    shots: int
    counts: Dict[str, int] = field(default_factory=dict)
    probabilities: Dict[str, float] = field(default_factory=dict)
    statevector: Optional[List[List[float]]] = None  # [[re, im], ...]
    execution_time_ms: float = 0.0
    circuit_depth: Optional[int] = None
    gate_count: int = 0
    error: Optional[str] = None


class QuantumBackend(ABC):
    """Abstract base class for quantum execution backends."""

    @property
    @abstractmethod
    def name(self) -> str:
        """Human-readable backend name."""

    @property
    @abstractmethod
    def is_available(self) -> bool:
        """Whether this backend is currently operational."""

    @abstractmethod
    def validate(self, circuit_data: dict) -> List[dict]:
        """
        Validate a circuit JSON.
        Returns a list of findings dicts:
          { severity, type, message, suggestion, gate_indices }
        """

    @abstractmethod
    def execute(
        self,
        circuit_data: dict,
        shots: int = 1024,
        include_statevector: bool = False,
    ) -> ExecutionResult:
        """Execute a circuit and return measurement results."""

    def get_probabilities(self, counts: Dict[str, int], shots: int) -> Dict[str, float]:
        """Convert measurement counts to probabilities."""
        return {state: count / shots for state, count in counts.items()}


def get_backend(framework: str) -> QuantumBackend:
    """Factory: return the appropriate backend for the requested framework."""
    from .qiskit_adapter import QiskitAerBackend

    backends: Dict[str, QuantumBackend] = {
        "qiskit_aer": QiskitAerBackend(),
    }

    # PennyLane and Cirq adapters are architecturally planned but not yet operational.
    backend = backends.get(framework)
    if backend is None:
        raise ValueError(
            f"Backend '{framework}' is not available. "
            f"Available: {list(backends.keys())}"
        )
    if not backend.is_available:
        raise RuntimeError(
            f"Backend '{framework}' is installed but not operational. "
            "Check that all required packages are installed."
        )
    return backend
