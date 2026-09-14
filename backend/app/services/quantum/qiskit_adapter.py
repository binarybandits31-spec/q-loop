"""Qiskit Aer quantum execution backend.

Translates the Q-loop circuit JSON into a Qiskit QuantumCircuit,
executes it using Aer's AerSimulator, and returns structured results.
"""
import time
from typing import Dict, List, Optional
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
                "severity": "error", "type": "invalid_qubit_count",
                "message": "Circuit must have at least 1 qubit.", "suggestion": "Set qubits >= 1.",
            })
            return findings

        measured = set()
        for i, op in enumerate(ops):
            gate = op.get("gate", "").upper()
            target = op.get("target")
            control = op.get("control")
            control2 = op.get("control2")

            # qubit range checks
            if target is None or not (0 <= target < n):
                findings.append({
                    "severity": "error", "type": "invalid_target",
                    "message": f"Operation {i+1} ({gate}): target qubit {target} is out of range [0,{n-1}].",
                    "suggestion": f"Use a target in [0,{n-1}].", "gate_indices": [i],
                })
            if control is not None and not (0 <= control < n):
                findings.append({
                    "severity": "error", "type": "invalid_control",
                    "message": f"Operation {i+1} ({gate}): control qubit {control} is out of range.",
                    "suggestion": f"Use a control in [0,{n-1}].", "gate_indices": [i],
                })
            if control2 is not None and not (0 <= control2 < n):
                findings.append({
                    "severity": "error", "type": "invalid_control2",
                    "message": f"Operation {i+1} ({gate}): second control {control2} is out of range.",
                    "suggestion": f"Use a control2 in [0,{n-1}].", "gate_indices": [i],
                })
            if control is not None and target is not None and control == target:
                findings.append({
                    "severity": "error", "type": "control_equals_target",
                    "message": f"Operation {i+1} ({gate}): control and target are the same qubit ({control}).",
                    "suggestion": "Use different qubits for control and target.", "gate_indices": [i],
                })

            # gate after measurement
            if gate not in MEASURE_GATES and target is not None and target in measured:
                findings.append({
                    "severity": "warning", "type": "gate_after_measurement",
                    "message": f"Operation {i+1} ({gate}): gate applied to qubit {target} after it was measured.",
                    "suggestion": "Move this gate before the measurement gate.", "gate_indices": [i],
                })
            if gate in MEASURE_GATES and target is not None:
                measured.add(target)

            # parametric gates missing parameter
            if gate in PARAMETRIC_GATES and op.get("parameter") is None:
                findings.append({
                    "severity": "warning", "type": "missing_parameter",
                    "message": f"Operation {i+1} ({gate}): rotation gate has no parameter. Defaulting to π/2.",
                    "suggestion": "Provide an explicit parameter value.", "gate_indices": [i],
                })

        # redundant consecutive pairs
        for i in range(len(ops) - 1):
            g1, g2 = ops[i], ops[i + 1]
            if (g1.get("gate", "").upper() == g2.get("gate", "").upper()
                    and g1.get("target") == g2.get("target")
                    and g1.get("gate", "").upper() in {"X", "Y", "Z", "H", "CZ", "SWAP"}):
                findings.append({
                    "severity": "optimization", "type": "redundant_pair",
                    "message": f"Operations {i+1}–{i+2}: two consecutive {g1['gate'].upper()} gates on qubit {g1['target']} cancel each other (= Identity).",
                    "suggestion": f"Remove both {g1['gate'].upper()} gates to simplify the circuit.",
                    "gate_indices": [i, i + 1],
                })

        if not any(op.get("gate", "").upper() in MEASURE_GATES for op in ops) and ops:
            findings.append({
                "severity": "warning", "type": "no_measurement",
                "message": "Circuit has no measurement gates — classical output will be empty.",
                "suggestion": "Add MEASURE operations to obtain classical results.",
            })

        return findings

    def execute(
        self,
        circuit_data: dict,
        shots: int = 1024,
        include_statevector: bool = False,
    ) -> ExecutionResult:
        import math

        try:
            from qiskit import QuantumCircuit, QuantumRegister, ClassicalRegister
            from qiskit_aer import AerSimulator
        except ImportError as e:
            return ExecutionResult(
                status="error", framework=self.name, shots=shots,
                error=f"Qiskit Aer is not installed: {e}",
            )

        t0 = time.perf_counter()
        n = circuit_data["qubits"]
        cb = circuit_data.get("classical_bits", n)
        ops = circuit_data.get("operations", [])

        try:
            qr = QuantumRegister(n, "q")
            cr = ClassicalRegister(cb, "c")
            qc = QuantumCircuit(qr, cr)

            clbit = 0  # classical bit counter for measurements

            for op in ops:
                gate = op.get("gate", "").upper()
                tgt = op.get("target", 0)
                ctrl = op.get("control")
                ctrl2 = op.get("control2")
                param = op.get("parameter", math.pi / 2)

                if gate == "H":
                    qc.h(tgt)
                elif gate == "X":
                    qc.x(tgt)
                elif gate == "Y":
                    qc.y(tgt)
                elif gate == "Z":
                    qc.z(tgt)
                elif gate == "S":
                    qc.s(tgt)
                elif gate == "T":
                    qc.t(tgt)
                elif gate in ("SDG", "SDAGGER"):
                    qc.sdg(tgt)
                elif gate in ("TDG", "TDAGGER"):
                    qc.tdg(tgt)
                elif gate == "RX":
                    qc.rx(param, tgt)
                elif gate == "RY":
                    qc.ry(param, tgt)
                elif gate == "RZ":
                    qc.rz(param, tgt)
                elif gate == "P":
                    qc.p(param, tgt)
                elif gate == "U":
                    # U gate: parameter encodes theta; phi and lam default to 0
                    qc.u(param, 0, 0, tgt)
                elif gate in ("CX", "CNOT"):
                    if ctrl is not None:
                        qc.cx(ctrl, tgt)
                elif gate == "CZ":
                    if ctrl is not None:
                        qc.cz(ctrl, tgt)
                elif gate == "CY":
                    if ctrl is not None:
                        qc.cy(ctrl, tgt)
                elif gate == "CH":
                    if ctrl is not None:
                        qc.ch(ctrl, tgt)
                elif gate == "SWAP":
                    if ctrl is not None:
                        qc.swap(ctrl, tgt)
                elif gate in ("TOFFOLI", "CCX"):
                    if ctrl is not None and ctrl2 is not None:
                        qc.ccx(ctrl, ctrl2, tgt)
                elif gate in ("M", "MEASURE"):
                    if clbit < cb:
                        qc.measure(tgt, clbit)
                        clbit += 1

            # choose simulator
            if include_statevector and not any(
                op.get("gate", "").upper() in MEASURE_GATES for op in ops
            ):
                sim = AerSimulator(method="statevector")
                qc.save_statevector()
            else:
                sim = AerSimulator()

            job = sim.run(qc, shots=shots)
            result = job.result()
            counts: Dict[str, int] = dict(result.get_counts())

            # normalise bitstring keys (Qiskit puts space between registers)
            counts = {k.replace(" ", ""): v for k, v in counts.items()}

            probabilities = self.get_probabilities(counts, shots)

            statevector_data = None
            if include_statevector:
                try:
                    sv = result.get_statevector()
                    statevector_data = [[float(amp.real), float(amp.imag)] for amp in sv]
                except Exception:
                    pass

            depth = qc.depth()
            gate_count = sum(1 for inst in qc.data if inst.operation.name not in ("measure", "barrier"))
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
