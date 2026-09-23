"""Qiskit Aer quantum execution backend.

Translates the Q-loop circuit JSON into a Qiskit QuantumCircuit,
executes it using Aer's AerSimulator, and returns structured results.
"""

import math
import time
from typing import Dict, List

from .backend import QuantumBackend, ExecutionResult


PARAMETRIC_GATES = {"RX", "RY", "RZ", "P", "U"}
TWO_QUBIT_GATES = {"CX", "CNOT", "CZ", "CY", "CH", "SWAP"}
THREE_QUBIT_GATES = {"TOFFOLI", "CCX"}
MEASURE_GATES = {"M", "MEASURE"}


class QiskitAerBackend(QuantumBackend):
    @property
    def name(self) -> str:
        return "Qiskit Aer"

    @property
    def is_available(self) -> bool:
        try:
            from qiskit_aer import AerSimulator
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
            condition_bit = op.get("condition_bit")
            condition_value = op.get("condition_value")

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
                        f"control qubit {control} is out of range."
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
                        f"second control {control2} is out of range."
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

            # Validate classical condition.
            if condition_bit is not None:
                requested_classical_bits = circuit_data.get(
                    "classical_bits",
                    0,
                )

                if condition_bit < 0:
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

                elif condition_bit >= requested_classical_bits and requested_classical_bits > 0:
                    findings.append({
                        "severity": "warning",
                        "type": "condition_bit_out_of_requested_range",
                        "message": (
                            f"Operation {i + 1} ({gate}): "
                            f"condition bit {condition_bit} is outside the "
                            f"requested classical register size "
                            f"{requested_classical_bits}."
                        ),
                        "suggestion": (
                            "Increase classical_bits or use a valid "
                            "classical bit index."
                        ),
                        "gate_indices": [i],
                    })

            if condition_value is not None and condition_value not in (0, 1):
                findings.append({
                    "severity": "error",
                    "type": "invalid_condition_value",
                    "message": (
                        f"Operation {i + 1} ({gate}): "
                        f"condition value must be 0 or 1, got {condition_value}."
                    ),
                    "suggestion": "Use condition_value = 0 or 1.",
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
                        "rotation gate has no parameter. Defaulting to π/2."
                    ),
                    "suggestion": "Provide an explicit parameter value.",
                    "gate_indices": [i],
                })

        for i in range(len(ops) - 1):
            g1 = ops[i]
            g2 = ops[i + 1]

            if (
                g1.get("gate", "").upper()
                == g2.get("gate", "").upper()
                and g1.get("target") == g2.get("target")
                and g1.get("gate", "").upper()
                in {"X", "Y", "Z", "H", "CZ", "SWAP"}
            ):
                findings.append({
                    "severity": "optimization",
                    "type": "redundant_pair",
                    "message": (
                        f"Operations {i + 1}–{i + 2}: "
                        f"two consecutive {g1['gate'].upper()} gates "
                        f"on qubit {g1['target']} cancel each other "
                        "(= Identity)."
                    ),
                    "suggestion": (
                        f"Remove both {g1['gate'].upper()} gates "
                        "to simplify the circuit."
                    ),
                    "gate_indices": [i, i + 1],
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
                    "Circuit has no measurement gates — "
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
            from qiskit import QuantumCircuit, QuantumRegister, ClassicalRegister
            from qiskit_aer import AerSimulator
        except ImportError as e:
            return ExecutionResult(
                status="error",
                framework=self.name,
                shots=shots,
                error=f"Qiskit Aer is not installed: {e}",
            )

        t0 = time.perf_counter()

        try:
            n = circuit_data["qubits"]
            ops = circuit_data.get("operations", [])

            # Count measurement operations.
            measurement_ops = [
                op
                for op in ops
                if op.get("gate", "").upper() in MEASURE_GATES
            ]

            # We need at least one classical bit for every measurement
            # and every conditional operation.
            requested_classical_bits = circuit_data.get(
                "classical_bits",
                0,
            )

            max_condition_bit = max(
                (
                    op.get("condition_bit")
                    for op in ops
                    if op.get("condition_bit") is not None
                ),
                default=-1,
            )

            cb = max(
                n if measurement_ops else 0,
                requested_classical_bits,
                len(measurement_ops),
                max_condition_bit + 1,
            )

            # -----------------------------------------
            # Create quantum/classical registers
            # -----------------------------------------
            qr = QuantumRegister(n, "q")

            if cb > 0:
                cr = ClassicalRegister(cb, "c")
                qc = QuantumCircuit(qr, cr)
            else:
                qc = QuantumCircuit(qr)

            clbit = 0

            # -----------------------------------------
            # Translate Q-loop operations to Qiskit
            # -----------------------------------------
            for op in ops:
                gate = op.get("gate", "").upper()
                tgt = op.get("target", 0)
                ctrl = op.get("control")
                ctrl2 = op.get("control2")
                param = op.get("parameter", math.pi / 2)

                condition_bit = op.get("condition_bit")
                condition_value = op.get("condition_value")

                instruction = None

                if gate == "H":
                    instruction = qc.h(tgt)

                elif gate == "X":
                    instruction = qc.x(tgt)

                elif gate == "Y":
                    instruction = qc.y(tgt)

                elif gate == "Z":
                    instruction = qc.z(tgt)

                elif gate == "S":
                    instruction = qc.s(tgt)

                elif gate == "T":
                    instruction = qc.t(tgt)

                elif gate in ("SDG", "SDAGGER"):
                    instruction = qc.sdg(tgt)

                elif gate in ("TDG", "TDAGGER"):
                    instruction = qc.tdg(tgt)

                elif gate == "RX":
                    instruction = qc.rx(param, tgt)

                elif gate == "RY":
                    instruction = qc.ry(param, tgt)

                elif gate == "RZ":
                    instruction = qc.rz(param, tgt)

                elif gate == "P":
                    instruction = qc.p(param, tgt)

                elif gate == "U":
                    instruction = qc.u(param, 0, 0, tgt)

                elif gate in ("CX", "CNOT"):
                    if ctrl is not None:
                        instruction = qc.cx(ctrl, tgt)

                elif gate == "CZ":
                    if ctrl is not None:
                        instruction = qc.cz(ctrl, tgt)

                elif gate == "CY":
                    if ctrl is not None:
                        instruction = qc.cy(ctrl, tgt)

                elif gate == "CH":
                    if ctrl is not None:
                        instruction = qc.ch(ctrl, tgt)

                elif gate == "SWAP":
                    if ctrl is not None:
                        instruction = qc.swap(ctrl, tgt)

                elif gate in ("TOFFOLI", "CCX"):
                    if ctrl is not None and ctrl2 is not None:
                        instruction = qc.ccx(ctrl, ctrl2, tgt)

                # -----------------------------------------
                # Apply classical condition
                # -----------------------------------------
                if (
                    instruction is not None
                    and condition_bit is not None
                ):
                    if cb <= 0:
                        raise ValueError(
                            "A classical condition requires at least one classical bit."
                        )

                    if condition_value not in (0, 1):
                        raise ValueError(
                            "condition_value must be 0 or 1."
                        )

                    instruction.c_if(
                        qc.cregs[0],
                        condition_value << condition_bit,
                    )

                # -----------------------------------------
                # Measurement
                # -----------------------------------------
                elif gate in MEASURE_GATES:
                    if cb > 0 and clbit < cb:
                        qc.measure(tgt, clbit)
                        clbit += 1

            # -----------------------------------------
            # Detect measurements
            # -----------------------------------------
            has_measurements = len(measurement_ops) > 0

            # -----------------------------------------
            # Select simulator
            # -----------------------------------------
            if include_statevector and not has_measurements:
                sim = AerSimulator(method="statevector")
                qc.save_statevector()
            else:
                sim = AerSimulator()

            # -----------------------------------------
            # Execute
            # -----------------------------------------
            job = sim.run(qc, shots=shots)
            result = job.result()

            counts: Dict[str, int] = {}
            probabilities: Dict[str, float] = {}

            # -----------------------------------------
            # Statevector circuit
            # -----------------------------------------
            if include_statevector and not has_measurements:
                sv = result.get_statevector()

                probabilities = {
                    str(i): float(abs(amp) ** 2)
                    for i, amp in enumerate(sv)
                    if abs(amp) > 1e-12
                }

            # -----------------------------------------
            # Measured circuit
            # -----------------------------------------
            elif has_measurements:
                raw_counts = result.get_counts()

                if raw_counts:
                    counts = {
                        k.replace(" ", ""): int(v)
                        for k, v in dict(raw_counts).items()
                    }

                    probabilities = self.get_probabilities(
                        counts,
                        shots,
                    )

            # -----------------------------------------
            # Optional statevector
            # -----------------------------------------
            statevector_data = None

            if include_statevector:
                try:
                    sv = result.get_statevector()

                    statevector_data = [
                        [float(amp.real), float(amp.imag)]
                        for amp in sv
                    ]
                except Exception:
                    statevector_data = None

            # -----------------------------------------
            # Circuit statistics
            # -----------------------------------------
            depth = qc.depth()

            gate_count = sum(
                1
                for inst in qc.data
                if inst.operation.name
                not in (
                    "measure",
                    "barrier",
                    "save_statevector",
                )
            )

            elapsed_ms = (time.perf_counter() - t0) * 1000

            return ExecutionResult(
                status="success",
                framework=self.name,
                shots=shots,
                counts=counts,
                probabilities=probabilities,
                statevector=statevector_data,
                execution_time_ms=elapsed_ms,
                circuit_depth=depth,
                gate_count=gate_count,
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