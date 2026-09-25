"""qBraid cloud quantum backend adapter for Q-Loop."""

import math
import time
from typing import Dict, List

from .backend import QuantumBackend, ExecutionResult


MEASURE_GATES = {"M", "MEASURE"}

SUPPORTED_DEVICES = {
    "qbraid:qbraid:sim:qir-sv",
}


class QBraidBackend(QuantumBackend):
    """qBraid cloud backend using a qBraid gate-model simulator."""

    @property
    def name(self) -> str:
        return "qBraid"

    @property
    def is_available(self) -> bool:
        try:
            import qbraid

            provider = qbraid.QbraidProvider()

            device = provider.get_device(
                "qbraid:qbraid:sim:qir-sv"
            )

            return device.status().name == "ONLINE"

        except Exception:
            return False

    def validate(self, circuit_data: dict) -> List[dict]:
        """Validate a Q-Loop circuit for qBraid execution."""

        findings = []

        n = circuit_data.get("qubits", 0)
        operations = circuit_data.get("operations", [])

        if n < 1:
            findings.append({
                "severity": "error",
                "type": "invalid_qubit_count",
                "message": "Circuit must have at least 1 qubit.",
                "suggestion": "Set qubits >= 1.",
                "gate_indices": [],
            })
            return findings

        if n > 30:
            findings.append({
                "severity": "error",
                "type": "qubit_limit",
                "message": (
                    "The selected qBraid simulator supports "
                    "up to 30 qubits."
                ),
                "suggestion": "Use 30 or fewer qubits.",
                "gate_indices": [],
            })

        supported_gates = {
            "H",
            "X",
            "Y",
            "Z",
            "S",
            "T",
            "SDG",
            "SDAGGER",
            "TDG",
            "TDAGGER",
            "RX",
            "RY",
            "RZ",
            "P",
            "U",
            "CX",
            "CNOT",
            "CZ",
            "CY",
            "CH",
            "SWAP",
            "TOFFOLI",
            "CCX",
            "M",
            "MEASURE",
        }

        for index, operation in enumerate(operations):
            gate = operation.get("gate", "").upper()
            target = operation.get("target")
            control = operation.get("control")
            control2 = operation.get("control2")

            if gate not in supported_gates:
                findings.append({
                    "severity": "error",
                    "type": "unsupported_gate",
                    "message": (
                        f"Gate {gate} is not supported "
                        "by the qBraid adapter."
                    ),
                    "suggestion": "Use a supported Q-LOOP gate.",
                    "gate_indices": [index],
                })
                continue

            for label, value in (
                ("target", target),
                ("control", control),
                ("control2", control2),
            ):
                if value is not None and not (0 <= value < n):
                    findings.append({
                        "severity": "error",
                        "type": f"invalid_{label}",
                        "message": (
                            f"{label.capitalize()} qubit {value} "
                            f"is out of range [0,{n - 1}]."
                        ),
                        "suggestion": (
                            f"Use a qubit between 0 and {n - 1}."
                        ),
                        "gate_indices": [index],
                    })

            if gate in {
                "CX",
                "CNOT",
                "CZ",
                "CY",
                "CH",
                "SWAP",
            }:
                if control is None:
                    findings.append({
                        "severity": "error",
                        "type": "missing_control",
                        "message": (
                            f"Gate {gate} requires a control qubit."
                        ),
                        "suggestion": "Set the control qubit.",
                        "gate_indices": [index],
                    })

            if gate in {"TOFFOLI", "CCX"}:
                if control is None or control2 is None:
                    findings.append({
                        "severity": "error",
                        "type": "missing_control",
                        "message": (
                            f"Gate {gate} requires two control qubits."
                        ),
                        "suggestion": "Set both control qubits.",
                        "gate_indices": [index],
                    })

        return findings

    def execute(
        self,
        circuit_data: dict,
        shots: int = 1024,
        include_statevector: bool = False,
    ) -> ExecutionResult:
        """Execute a Q-LOOP circuit on qBraid's QIR simulator."""

        start_time = time.perf_counter()

        try:
            import qbraid
            from qiskit import (
                QuantumCircuit,
                QuantumRegister,
                ClassicalRegister,
            )
        except ImportError as exc:
            return ExecutionResult(
                status="error",
                framework=self.name,
                shots=shots,
                execution_time_ms=(
                    time.perf_counter() - start_time
                ) * 1000,
                error=(
                    f"qBraid/Qiskit is not installed: {exc}"
                ),
            )

        try:
            n = circuit_data.get("qubits", 0)
            operations = circuit_data.get("operations", [])

            if n < 1:
                raise ValueError(
                    "Circuit must contain at least one qubit."
                )

            if n > 30:
                raise ValueError(
                    "The selected qBraid simulator supports "
                    "a maximum of 30 qubits."
                )

            measurement_ops = [
                op
                for op in operations
                if op.get("gate", "").upper()
                in MEASURE_GATES
            ]

            requested_classical_bits = circuit_data.get(
                "classical_bits",
                0,
            )

            max_condition_bit = max(
                (
                    op.get("condition_bit")
                    for op in operations
                    if op.get("condition_bit") is not None
                ),
                default=-1,
            )

            classical_bits = max(
                n if measurement_ops else 0,
                requested_classical_bits,
                len(measurement_ops),
                max_condition_bit + 1,
            )

            qr = QuantumRegister(n, "q")

            if classical_bits > 0:
                cr = ClassicalRegister(
                    classical_bits,
                    "c",
                )
                qc = QuantumCircuit(qr, cr)
            else:
                qc = QuantumCircuit(qr)

            classical_index = 0

            # ---------------------------------------------------------
            # Convert Q-LOOP operations into a Qiskit circuit
            # ---------------------------------------------------------

            for operation in operations:
                gate = operation.get("gate", "").upper()
                target = operation.get("target", 0)
                control = operation.get("control")
                control2 = operation.get("control2")

                parameter = operation.get(
                    "parameter",
                    math.pi / 2,
                )

                instruction = None

                if gate == "H":
                    instruction = qc.h(target)

                elif gate == "X":
                    instruction = qc.x(target)

                elif gate == "Y":
                    instruction = qc.y(target)

                elif gate == "Z":
                    instruction = qc.z(target)

                elif gate == "S":
                    instruction = qc.s(target)

                elif gate in {"SDG", "SDAGGER"}:
                    instruction = qc.sdg(target)

                elif gate == "T":
                    instruction = qc.t(target)

                elif gate in {"TDG", "TDAGGER"}:
                    instruction = qc.tdg(target)

                elif gate == "RX":
                    instruction = qc.rx(
                        parameter,
                        target,
                    )

                elif gate == "RY":
                    instruction = qc.ry(
                        parameter,
                        target,
                    )

                elif gate == "RZ":
                    instruction = qc.rz(
                        parameter,
                        target,
                    )

                elif gate == "P":
                    instruction = qc.p(
                        parameter,
                        target,
                    )

                elif gate == "U":
                    instruction = qc.u(
                        parameter,
                        0,
                        0,
                        target,
                    )

                elif gate in {"CX", "CNOT"}:
                    instruction = qc.cx(
                        control,
                        target,
                    )

                elif gate == "CZ":
                    instruction = qc.cz(
                        control,
                        target,
                    )

                elif gate == "CY":
                    instruction = qc.cy(
                        control,
                        target,
                    )

                elif gate == "CH":
                    instruction = qc.ch(
                        control,
                        target,
                    )

                elif gate == "SWAP":
                    instruction = qc.swap(
                        control,
                        target,
                    )

                elif gate in {"TOFFOLI", "CCX"}:
                    instruction = qc.ccx(
                        control,
                        control2,
                        target,
                    )

                elif gate in MEASURE_GATES:
                    if classical_index >= classical_bits:
                        raise ValueError(
                            "Not enough classical bits "
                            "for measurement."
                        )

                    qc.measure(
                        target,
                        classical_index,
                    )

                    classical_index += 1
                    continue

                condition_bit = operation.get(
                    "condition_bit"
                )

                condition_value = operation.get(
                    "condition_value"
                )

                if (
                    instruction is not None
                    and condition_bit is not None
                ):
                    if condition_value not in (0, 1):
                        raise ValueError(
                            "condition_value must be 0 or 1."
                        )

                    instruction.c_if(
                        qc.cregs[0],
                        condition_value << condition_bit,
                    )

            # ---------------------------------------------------------
            # Connect to qBraid
            # ---------------------------------------------------------

            provider = qbraid.QbraidProvider()

            device = provider.get_device(
                "qbraid:qbraid:sim:qir-sv"
            )

            device_status = device.status().name

            if device_status != "ONLINE":
                raise RuntimeError(
                    "qBraid QIR statevector simulator "
                    f"is not online. Status: {device_status}"
                )

            # ---------------------------------------------------------
            # Submit cloud job
            # ---------------------------------------------------------

            job = device.run(
                qc,
                shots=shots,
            )

            job_id = job.id

            client = provider.client

            # ---------------------------------------------------------
            # Wait for qBraid job to finish
            # ---------------------------------------------------------

            timeout_seconds = 120
            poll_interval_seconds = 2

            deadline = (
                time.monotonic()
                + timeout_seconds
            )

            terminal_failure_statuses = {
                "FAILED",
                "CANCELLED",
                "ERROR",
            }

            final_status = None

            while True:
                current_job = client.get_job(job_id)

                status_object = current_job.status

                status_name = getattr(
                    status_object,
                    "name",
                    str(status_object),
                )

                final_status = str(status_name).upper()

                print(
                    f"[qBraid] Job {job_id} "
                    f"status: {final_status}"
                )

                if final_status == "COMPLETED":
                    break

                if final_status in terminal_failure_statuses:
                    raise RuntimeError(
                        "qBraid job failed: "
                        f"{final_status}"
                    )

                if time.monotonic() >= deadline:
                    raise TimeoutError(
                        "qBraid job timed out after "
                        f"{timeout_seconds} seconds. "
                        f"Last status: {final_status}"
                    )

                time.sleep(poll_interval_seconds)

            # ---------------------------------------------------------
            # Retrieve result
            # ---------------------------------------------------------

            result = None
            result_error = None

            for attempt in range(10):
                try:
                    result = client.get_job_result(job_id)

                    if result is not None:
                        break

                except Exception as exc:
                    result_error = exc

                    print(
                        "[qBraid] Result not ready "
                        f"(attempt {attempt + 1}/10): "
                        f"{exc}"
                    )

                    if attempt < 9:
                        time.sleep(2)

            if result is None:
                raise RuntimeError(
                    "qBraid job completed, but the result "
                    "could not be retrieved: "
                    f"{result_error}"
                )

            # ---------------------------------------------------------
            # Normalize qBraid measurement counts
            #
            # qBraid 0.12.2 returns:
            #
            # result.resultData = {
            #     "measurementCounts": {
            #         "00": 4,
            #         "11": 6
            #     },
            #     "seed": None
            # }
            # ---------------------------------------------------------

            result_data = getattr(
                result,
                "resultData",
                None,
            )

            if result_data is None:
                raise RuntimeError(
                    "qBraid returned a result without "
                    "resultData."
                )

            counts_data = result_data.get(
                "measurementCounts",
                {},
            )

            if not isinstance(counts_data, dict):
                raise RuntimeError(
                    "qBraid returned invalid measurementCounts."
                )

            counts: Dict[str, int] = {
                str(state).replace(" ", ""): int(count)
                for state, count in counts_data.items()
            }

            probabilities = self.get_probabilities(
                counts,
                shots,
            )

            elapsed_ms = (
                time.perf_counter()
                - start_time
            ) * 1000

            gate_count = sum(
                1
                for operation in operations
                if operation.get("gate", "").upper()
                not in MEASURE_GATES
            )

            return ExecutionResult(
                status="success",
                framework=self.name,
                shots=shots,
                counts=counts,
                probabilities=probabilities,
                statevector=None,
                execution_time_ms=elapsed_ms,
                circuit_depth=None,
                gate_count=gate_count,
            )

        except Exception as exc:

            elapsed_ms = (
                time.perf_counter()
                - start_time
            ) * 1000

            return ExecutionResult(
                status="error",
                framework=self.name,
                shots=shots,
                execution_time_ms=elapsed_ms,
                error=str(exc),
            )