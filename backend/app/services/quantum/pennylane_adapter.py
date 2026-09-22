"""PennyLane quantum backend adapter for Q-Loop."""

import time
from typing import List

from .backend import ExecutionResult, QuantumBackend


class PennyLaneBackend(QuantumBackend):
    """PennyLane simulator backend."""

    @property
    def name(self) -> str:
        return "PennyLane"

    @property
    def is_available(self) -> bool:
        try:
            import pennylane as qml

            qml.device("default.qubit", wires=1)
            return True
        except Exception as exc:
            import traceback
            print(f"PennyLane is_available check failed: {exc}")
            traceback.print_exc()
            return False

    def validate(self, circuit_data: dict) -> List[dict]:
        """Validate a Q-Loop circuit for PennyLane execution."""
        findings = []

        num_qubits = circuit_data.get("num_qubits", circuit_data.get("qubits", 0))
        operations = circuit_data.get("operations", [])

        if num_qubits <= 0:
            findings.append({
                "severity": "error",
                "type": "invalid_qubit_count",
                "message": "Circuit must contain at least one qubit.",
                "suggestion": "Set num_qubits to a positive integer.",
                "gate_indices": [],
            })

        for index, operation in enumerate(operations):
            target = operation.get("target")

            if target is not None and (
                target < 0 or target >= num_qubits
            ):
                findings.append({
                    "severity": "error",
                    "type": "invalid_target",
                    "message": f"Target qubit {target} is out of range.",
                    "suggestion": f"Use a qubit between 0 and {num_qubits - 1}.",
                    "gate_indices": [index],
                })

            for key in ("control", "control2"):
                control = operation.get(key)

                if control is not None and (
                    control < 0 or control >= num_qubits
                ):
                    findings.append({
                        "severity": "error",
                        "type": "invalid_control",
                        "message": f"Control qubit {control} is out of range.",
                        "suggestion": f"Use a qubit between 0 and {num_qubits - 1}.",
                        "gate_indices": [index],
                    })

        return findings

    def execute(
        self,
        circuit_data: dict,
        shots: int = 1024,
        include_statevector: bool = False,
    ) -> ExecutionResult:
        """Execute a Q-Loop circuit using PennyLane."""
        start_time = time.perf_counter()

        try:
            import pennylane as qml

            num_qubits = circuit_data.get("num_qubits", circuit_data.get("qubits", 0))
            operations = circuit_data.get("operations", [])

            if num_qubits <= 0:
                raise ValueError("Circuit must contain at least one qubit.")

            dev = qml.device(
                "default.qubit",
                wires=num_qubits,
                shots=shots if not include_statevector else None,
            )

            def apply_operation(operation):
                gate = operation.get("gate", "").upper()
                target = operation.get("target")
                control = operation.get("control")
                control2 = operation.get("control2")
                parameter = operation.get("parameter", 0.0)

                if gate == "H":
                    qml.Hadamard(wires=target)

                elif gate == "X":
                    qml.PauliX(wires=target)

                elif gate == "Y":
                    qml.PauliY(wires=target)

                elif gate == "Z":
                    qml.PauliZ(wires=target)

                elif gate == "S":
                    qml.S(wires=target)

                elif gate in ("SDG", "S_DAGGER"):
                    qml.adjoint(qml.S)(wires=target)

                elif gate == "T":
                    qml.T(wires=target)

                elif gate in ("TDG", "T_DAGGER"):
                    qml.adjoint(qml.T)(wires=target)

                elif gate == "RX":
                    qml.RX(parameter, wires=target)

                elif gate == "RY":
                    qml.RY(parameter, wires=target)

                elif gate == "RZ":
                    qml.RZ(parameter, wires=target)

                elif gate == "U":
                    qml.Rot(0.0, parameter, 0.0, wires=target)

                elif gate == "P":
                    qml.PhaseShift(parameter, wires=target)

                elif gate in ("CX", "CNOT"):
                    qml.CNOT(wires=[control, target])

                elif gate == "CY":
                    qml.CY(wires=[control, target])

                elif gate == "CH":
                    qml.CH(wires=[control, target])

                elif gate == "SWAP":
                    qml.SWAP(wires=[control, target])

                elif gate in ("TOFFOLI", "CCX"):
                    qml.Toffoli(wires=[control, control2, target])
                else:
                    raise ValueError(
                        f"Unsupported PennyLane gate: {gate}"
                    )

            measurement_ops = [
                op for op in operations
                if op.get("gate", "").upper() in ("M", "MEASURE")
            ]

            quantum_ops = [
                op for op in operations
                if op.get("gate", "").upper() not in ("M", "MEASURE")
            ]

            @qml.qnode(dev)
            def circuit():
                for operation in quantum_ops:
                    apply_operation(operation)

                if include_statevector and not measurement_ops:
                    return qml.state()

                return qml.counts()

            result = circuit()

            execution_time_ms = (
                time.perf_counter() - start_time
            ) * 1000

            statevector = None
            counts = {}
            probabilities = {}

            if include_statevector and not measurement_ops:
                statevector = [
                    [float(value.real), float(value.imag)]
                    for value in result
                ]
            else:
                counts = {
                    str(state): int(count)
                    for state, count in result.items()
                }

                probabilities = self.get_probabilities(
                    counts,
                    shots,
                )

            return ExecutionResult(
                status="success",
                framework=self.name,
                shots=shots,
                counts=counts,
                probabilities=probabilities,
                statevector=statevector,
                execution_time_ms=execution_time_ms,
                gate_count=len(quantum_ops),
            )

        except Exception as exc:
            execution_time_ms = (
                time.perf_counter() - start_time
            ) * 1000

            return ExecutionResult(
                status="error",
                framework=self.name,
                shots=shots,
                execution_time_ms=execution_time_ms,
                error=str(exc),
            )