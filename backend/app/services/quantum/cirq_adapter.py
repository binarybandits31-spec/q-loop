"""Cirq quantum execution backend.

Translates Q-Loop circuit JSON into a Cirq Circuit,
executes it using Cirq's Simulator, and returns structured results.
"""

import math
import time
from typing import Dict, List

from .backend import QuantumBackend, ExecutionResult


PARAMETRIC_GATES = {"RX", "RY", "RZ", "P", "U"}
MEASURE_GATES = {"M", "MEASURE"}


class CirqBackend(QuantumBackend):
    @property
    def name(self) -> str:
        return "Cirq"

    @property
    def is_available(self) -> bool:
        try:
            import cirq
            return True
        except ImportError:
            return False

    def validate(self, circuit_data: dict) -> List[dict]:
        findings = []

        n = circuit_data.get("qubits", 0)
        ops = circuit_data.get("operations", [])

        if n < 1:
            findings.append({
                "severity": "error",
                "type": "invalid_qubit_count",
                "message": "Circuit must have at least 1 qubit.",
                "suggestion": "Set qubits >= 1.",
            })
            return findings

        measured = set()

        for i, op in enumerate(ops):
            gate = op.get("gate", "").upper()
            target = op.get("target")
            control = op.get("control")
            control2 = op.get("control2")

            if target is None or not (0 <= target < n):
                findings.append({
                    "severity": "error",
                    "type": "invalid_target",
                    "message": (
                        f"Operation {i + 1} ({gate}): "
                        f"target qubit {target} is out of range [0,{n - 1}]."
                    ),
                    "suggestion": f"Use a target in [0,{n - 1}].",
                    "gate_indices": [i],
                })

            if control is not None and not (0 <= control < n):
                findings.append({
                    "severity": "error",
                    "type": "invalid_control",
                    "message": (
                        f"Operation {i + 1} ({gate}): "
                        f"control qubit {control} is out of range [0,{n - 1}]."
                    ),
                    "suggestion": f"Use a control in [0,{n - 1}].",
                    "gate_indices": [i],
                })

            if control2 is not None and not (0 <= control2 < n):
                findings.append({
                    "severity": "error",
                    "type": "invalid_control2",
                    "message": (
                        f"Operation {i + 1} ({gate}): "
                        f"second control {control2} is out of range [0,{n - 1}]."
                    ),
                    "suggestion": f"Use a control2 in [0,{n - 1}].",
                    "gate_indices": [i],
                })

            if (
                control is not None
                and target is not None
                and control == target
            ):
                findings.append({
                    "severity": "error",
                    "type": "control_equals_target",
                    "message": (
                        f"Operation {i + 1} ({gate}): "
                        f"control and target are the same qubit ({control})."
                    ),
                    "suggestion": "Use different qubits for control and target.",
                    "gate_indices": [i],
                })

            if (
                control2 is not None
                and target is not None
                and control2 == target
            ):
                findings.append({
                    "severity": "error",
                    "type": "control2_equals_target",
                    "message": (
                        f"Operation {i + 1} ({gate}): "
                        f"second control and target are the same qubit ({target})."
                    ),
                    "suggestion": "Use different qubits for control2 and target.",
                    "gate_indices": [i],
                })

            if (
                control is not None
                and control2 is not None
                and control == control2
            ):
                findings.append({
                    "severity": "error",
                    "type": "controls_equal",
                    "message": (
                        f"Operation {i + 1} ({gate}): "
                        f"both control qubits are the same ({control})."
                    ),
                    "suggestion": "Use different control qubits.",
                    "gate_indices": [i],
                })

            if (
                gate not in MEASURE_GATES
                and target is not None
                and target in measured
            ):
                findings.append({
                    "severity": "warning",
                    "type": "gate_after_measurement",
                    "message": (
                        f"Operation {i + 1} ({gate}): "
                        f"gate applied to qubit {target} after it was measured."
                    ),
                    "suggestion": "Move this gate before the measurement gate.",
                    "gate_indices": [i],
                })

            if gate in MEASURE_GATES and target is not None:
                measured.add(target)

            if gate in PARAMETRIC_GATES and op.get("parameter") is None:
                findings.append({
                    "severity": "warning",
                    "type": "missing_parameter",
                    "message": (
                        f"Operation {i + 1} ({gate}): "
                        "rotation gate has no parameter. Defaulting to pi/2."
                    ),
                    "suggestion": "Provide an explicit parameter value.",
                    "gate_indices": [i],
                })

            condition_bit = op.get("condition_bit")
            condition_value = op.get("condition_value")

            if condition_bit is not None and condition_bit < 0:
                findings.append({
                    "severity": "error",
                    "type": "invalid_condition_bit",
                    "message": (
                        f"Operation {i + 1} ({gate}): "
                        f"condition bit {condition_bit} cannot be negative."
                    ),
                    "suggestion": "Use a non-negative classical bit index.",
                    "gate_indices": [i],
                })

            if condition_value is not None and condition_value not in (0, 1):
                findings.append({
                    "severity": "error",
                    "type": "invalid_condition_value",
                    "message": (
                        f"Operation {i + 1} ({gate}): "
                        f"condition value {condition_value} must be 0 or 1."
                    ),
                    "suggestion": "Use condition_value 0 or 1.",
                    "gate_indices": [i],
                })

        if (
            not any(
                op.get("gate", "").upper() in MEASURE_GATES
                for op in ops
            )
            and ops
        ):
            findings.append({
                "severity": "warning",
                "type": "no_measurement",
                "message": (
                    "Circuit has no measurement gates - "
                    "classical output will be empty."
                ),
                "suggestion": (
                    "Add MEASURE operations to obtain classical results."
                ),
            })

        return findings

    def execute(
        self,
        circuit_data: dict,
        shots: int = 1024,
        include_statevector: bool = False,
    ) -> ExecutionResult:

        try:
            import cirq
        except ImportError as e:
            return ExecutionResult(
                status="error",
                framework=self.name,
                shots=shots,
                error=f"Cirq is not installed: {e}",
            )

        t0 = time.perf_counter()

        try:
            n = circuit_data["qubits"]
            ops = circuit_data.get("operations", [])

            qubits = cirq.LineQubit.range(n)
            circuit = cirq.Circuit()

            measurement_keys: Dict[int, str] = {}
            measurement_order: List[int] = []

            def add_condition(operation, condition_bit, condition_value):
                if condition_bit is None:
                    return operation

                if condition_bit < 0:
                    raise ValueError(
                        f"condition_bit must be >= 0, got {condition_bit}"
                    )

                if condition_value not in (0, 1, None):
                    raise ValueError(
                        f"condition_value must be 0 or 1, got {condition_value}"
                    )

                key = measurement_keys.get(condition_bit)

                if key is None:
                    raise ValueError(
                        f"condition_bit {condition_bit} has no preceding measurement"
                    )

                expected = 1 if condition_value is None else condition_value

                controlled = operation.with_classical_controls(key)

                if expected == 1:
                    return controlled

                # Cirq's classical control represents "key is non-zero".
                # For condition_value == 0, invert the classical predicate
                # using a temporary classical expression when supported.
                try:
                    return operation.with_classical_controls(
                        cirq.KeyCondition(key, value=0)
                    )
                except Exception:
                    raise ValueError(
                        "Cirq adapter currently supports condition_value=1 "
                        "for classical controls."
                    )

            for op_index, op in enumerate(ops):
                gate = op.get("gate", "").upper()
                tgt = op.get("target", 0)
                ctrl = op.get("control")
                ctrl2 = op.get("control2")
                param = op.get("parameter", math.pi / 2)

                q = qubits[tgt]

                condition_bit = op.get("condition_bit")
                condition_value = op.get("condition_value", 1)

                if gate in MEASURE_GATES:
                    key = f"m{len(measurement_order)}"

                    circuit.append(
                        cirq.measure(
                            q,
                            key=key,
                        )
                    )

                    measurement_keys[len(measurement_order)] = key
                    measurement_order.append(tgt)

                    continue

                operation = None

                if gate == "H":
                    operation = cirq.H(q)

                elif gate == "X":
                    operation = cirq.X(q)

                elif gate == "Y":
                    operation = cirq.Y(q)

                elif gate == "Z":
                    operation = cirq.Z(q)

                elif gate == "S":
                    operation = cirq.S(q)

                elif gate in ("SDG", "SDAGGER"):
                    operation = cirq.S(q) ** -1

                elif gate == "T":
                    operation = cirq.T(q)

                elif gate in ("TDG", "TDAGGER"):
                    operation = cirq.T(q) ** -1

                elif gate == "RX":
                    operation = cirq.rx(param)(q)

                elif gate == "RY":
                    operation = cirq.ry(param)(q)

                elif gate == "RZ":
                    operation = cirq.rz(param)(q)

                elif gate == "P":
                    operation = cirq.ZPowGate(
                        exponent=param / math.pi
                    )(q)

                elif gate == "U":
                    operation = cirq.PhasedXPowGate(
                        exponent=param / math.pi
                    )(q)

                elif gate in ("CX", "CNOT"):
                    if ctrl is not None:
                        operation = cirq.CNOT(
                            qubits[ctrl],
                            q,
                        )

                elif gate == "CZ":
                    if ctrl is not None:
                        operation = cirq.CZ(
                            qubits[ctrl],
                            q,
                        )

                elif gate == "CY":
                    if ctrl is not None:
                        operation = cirq.ControlledGate(
                            cirq.Y
                        )(qubits[ctrl], q)

                elif gate == "CH":
                    if ctrl is not None:
                        operation = cirq.ControlledGate(
                            cirq.H
                        )(qubits[ctrl], q)

                elif gate == "SWAP":
                    if ctrl is not None:
                        operation = cirq.SWAP(
                            qubits[ctrl],
                            q,
                        )

                elif gate in ("TOFFOLI", "CCX"):
                    if ctrl is not None and ctrl2 is not None:
                        operation = cirq.TOFFOLI(
                            qubits[ctrl],
                            qubits[ctrl2],
                            q,
                        )

                if operation is not None:
                    operation = add_condition(
                        operation,
                        condition_bit,
                        condition_value,
                    )

                    circuit.append(operation)

            simulator = cirq.Simulator()

            has_measurements = bool(measurement_order)

            if has_measurements:
                result = simulator.run(
                    circuit,
                    repetitions=shots,
                )

                counts: Dict[str, int] = {}

                for row in result.data.itertuples(index=False):
                    bits = "".join(
                        str(getattr(row, measurement_keys[i]))
                        for i in range(len(measurement_order))
                    )

                    counts[bits] = counts.get(bits, 0) + 1

                probabilities = self.get_probabilities(
                    counts,
                    shots,
                )

                statevector_data = None

            else:
                result = simulator.simulate(circuit)

                statevector = result.final_state_vector

                probabilities = {
                    str(i): float(abs(amplitude) ** 2)
                    for i, amplitude in enumerate(statevector)
                    if abs(amplitude) > 1e-12
                }

                counts = {}

                statevector_data = None

                if include_statevector:
                    statevector_data = [
                        [
                            float(amplitude.real),
                            float(amplitude.imag),
                        ]
                        for amplitude in statevector
                    ]

            elapsed_ms = (time.perf_counter() - t0) * 1000

            return ExecutionResult(
                status="success",
                framework=self.name,
                shots=shots,
                counts=counts,
                probabilities=probabilities,
                statevector=statevector_data,
                execution_time_ms=elapsed_ms,
                circuit_depth=len(circuit),
                gate_count=sum(
                    1 for _ in circuit.all_operations()
                ),
            )

        except Exception as e:
            elapsed_ms = (time.perf_counter() - t0) * 1000

            return ExecutionResult(
                status="error",
                framework=self.name,
                shots=shots,
                execution_time_ms=elapsed_ms,
                error=str(e),
            )