from typing import Any, Dict

from app.services.quantum import CircuitAnalyzer
from app.services.quantum.backend import get_backend


class CircuitSimulationTool:
    """
    Safe Q-Loop AI tool for running quantum circuits.

    This tool reuses the existing Q-Loop quantum simulator
    instead of creating a second simulation system.
    """

    name = "simulate_circuit"
    description = (
        "Run a Q-Loop quantum circuit using the requested simulator "
        "backend and return verified measurement results, probabilities, "
        "statevector information, circuit depth, and gate count."
    )

    def __init__(self) -> None:
        self.analyzer = CircuitAnalyzer()

    def run(self, circuit: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute a Q-Loop circuit.

        Expected circuit format:

        {
            "qubits": 2,
            "classical_bits": 2,
            "operations": [
                {
                    "gate": "H",
                    "target": 0
                },
                {
                    "gate": "CX",
                    "target": 1,
                    "control": 0
                }
            ],
            "shots": 1024,
            "framework": "qiskit_aer",
            "include_statevector": false
        }
        """

        if not isinstance(circuit, dict):
            return {
                "status": "error",
                "error": "Circuit must be a JSON object.",
            }

        required_fields = {
            "qubits",
            "operations",
        }

        missing = [
            field
            for field in required_fields
            if field not in circuit
        ]

        if missing:
            return {
                "status": "error",
                "error": f"Missing required circuit fields: {missing}",
            }

        qubits = circuit["qubits"]
        operations = circuit["operations"]

        if not isinstance(qubits, int) or qubits < 1:
            return {
                "status": "error",
                "error": "qubits must be a positive integer.",
            }

        if not isinstance(operations, list):
            return {
                "status": "error",
                "error": "operations must be a list.",
            }

        framework = circuit.get(
            "framework",
            "qiskit_aer",
        )

        shots = circuit.get(
            "shots",
            1024,
        )

        include_statevector = circuit.get(
            "include_statevector",
            False,
        )

        circuit_data = {
            "qubits": qubits,
            "classical_bits": circuit.get(
                "classical_bits",
                0,
            ),
            "operations": operations,
        }

        # -----------------------------------------
        # Step 1: Analyze the circuit
        # -----------------------------------------

        findings = self.analyzer.analyze(
            circuit_data
        )

        errors = [
            finding
            for finding in findings
            if finding.severity == "error"
        ]

        if errors:
            return {
                "status": "error",
                "error": "Circuit validation failed.",
                "validation_findings": [
                    finding.to_dict()
                    for finding in errors
                ],
            }

        # -----------------------------------------
        # Step 2: Select the requested backend
        # -----------------------------------------

        try:
            backend = get_backend(framework)

        except (ValueError, RuntimeError) as exc:
            return {
                "status": "error",
                "error": str(exc),
            }

        # -----------------------------------------
        # Step 3: Execute the circuit
        # -----------------------------------------

        try:
            result = backend.execute(
                circuit_data,
                shots=shots,
                include_statevector=include_statevector,
            )

        except Exception as exc:
            return {
                "status": "error",
                "error": f"Simulation failed: {exc}",
            }

        # -----------------------------------------
        # Step 4: Return structured verified data
        # -----------------------------------------

        return {
            "status": result.status,
            "framework": result.framework,
            "shots": result.shots,
            "counts": result.counts,
            "probabilities": result.probabilities,
            "statevector": result.statevector,
            "execution_time_ms": result.execution_time_ms,
            "circuit_depth": result.circuit_depth,
            "gate_count": result.gate_count,
            "error": result.error,

            # Preserve the original circuit so the AI Tutor
            # can explain the actual gates that were simulated.
            "circuit": circuit_data,
    "validation_findings": [
        finding.to_dict()
        for finding in findings
    ],
}


simulate_circuit = CircuitSimulationTool()