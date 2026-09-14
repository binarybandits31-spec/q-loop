"""Deterministic circuit analysis — independent of any quantum runtime.

Detects structural errors, warnings, and optimisation opportunities.
"""
from dataclasses import dataclass, field
from typing import List, Optional, Dict


@dataclass
class AnalysisFinding:
    severity: str  # error | warning | optimization | info
    type: str
    message: str
    suggestion: Optional[str] = None
    gate_indices: List[int] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "severity": self.severity,
            "type": self.type,
            "message": self.message,
            "suggestion": self.suggestion,
            "gate_indices": self.gate_indices,
        }


SELF_INVERSE = {"X", "Y", "Z", "H", "CZ", "SWAP"}
PARAMETRIC = {"RX", "RY", "RZ", "P", "U"}
MEASURE = {"M", "MEASURE"}
TWO_QUBIT = {"CX", "CNOT", "CZ", "CY", "CH", "SWAP"}


class CircuitAnalyzer:
    """Stateless deterministic circuit analyser."""

    def analyze(self, circuit_data: dict) -> List[AnalysisFinding]:
        findings: List[AnalysisFinding] = []
        n: int = circuit_data.get("qubits", 0)
        ops: List[dict] = circuit_data.get("operations", [])

        # 1. Qubit count
        if n < 1:
            findings.append(AnalysisFinding(
                "error", "invalid_qubit_count",
                "Circuit must have at least 1 qubit.",
                "Set qubits >= 1.",
            ))
            return findings

        # 2. Per-gate checks
        measured: set = set()
        for i, op in enumerate(ops):
            gate = op.get("gate", "").upper()
            tgt = op.get("target")
            ctrl = op.get("control")
            ctrl2 = op.get("control2")

            for qubit_name, q in [("target", tgt), ("control", ctrl), ("control2", ctrl2)]:
                if q is not None and not (0 <= q < n):
                    findings.append(AnalysisFinding(
                        "error", f"invalid_{qubit_name}",
                        f"Gate {gate} at position {i+1}: {qubit_name} qubit {q} is out of range [0,{n-1}].",
                        f"Use a qubit index in [0,{n-1}].", [i],
                    ))

            if ctrl is not None and tgt is not None and ctrl == tgt:
                findings.append(AnalysisFinding(
                    "error", "control_equals_target",
                    f"Gate {gate} at position {i+1}: control and target are the same qubit ({ctrl}).",
                    "Use different qubits for control and target.", [i],
                ))
            if ctrl2 is not None and tgt is not None and ctrl2 == tgt:
                findings.append(AnalysisFinding(
                    "error", "control2_equals_target",
                    f"Gate {gate} at position {i+1}: second control and target are the same qubit ({ctrl2}).",
                    "Use different qubits.", [i],
                ))

            if gate not in MEASURE and tgt is not None and tgt in measured:
                findings.append(AnalysisFinding(
                    "warning", "gate_after_measurement",
                    f"Gate {gate} at position {i+1}: applied to qubit {tgt} after it was measured.",
                    "Move this gate before the measurement.", [i],
                ))
            if gate in MEASURE and tgt is not None:
                measured.add(tgt)

            if gate in PARAMETRIC and op.get("parameter") is None:
                findings.append(AnalysisFinding(
                    "warning", "missing_parameter",
                    f"Gate {gate} at position {i+1}: rotation gate has no parameter. Defaulting to π/2.",
                    "Provide an explicit angle in radians.", [i],
                ))

        # 3. No measurement gates
        if ops and not any(op.get("gate", "").upper() in MEASURE for op in ops):
            findings.append(AnalysisFinding(
                "warning", "no_measurement",
                "Circuit has no measurement gates — classical output will be empty.",
                "Add MEASURE operations to obtain classical results.",
            ))

        # 4. Redundant consecutive gate pairs (self-inverse)
        for i in range(len(ops) - 1):
            g1, g2 = ops[i], ops[i + 1]
            gate = g1.get("gate", "").upper()
            if (gate == g2.get("gate", "").upper()
                    and gate in SELF_INVERSE
                    and g1.get("target") == g2.get("target")
                    and g1.get("control") == g2.get("control")):
                findings.append(AnalysisFinding(
                    "optimization", "redundant_pair",
                    f"Positions {i+1}–{i+2}: two consecutive {gate} gates on qubit {g1['target']} cancel (= Identity).",
                    f"Remove both {gate} gates to simplify the circuit.", [i, i + 1],
                ))

        # 5. Inverse phase gate pairs
        phase_pairs = [("S", "SDG"), ("T", "TDG")]
        for i in range(len(ops) - 1):
            g1, g2 = ops[i], ops[i + 1]
            g1u, g2u = g1.get("gate", "").upper(), g2.get("gate", "").upper()
            for a, b in phase_pairs:
                if ({g1u, g2u} == {a, b} and g1.get("target") == g2.get("target")):
                    findings.append(AnalysisFinding(
                        "optimization", "inverse_phase_pair",
                        f"Positions {i+1}–{i+2}: {g1u} followed by {g2u} on qubit {g1['target']} cancel out.",
                        "Remove both gates.", [i, i + 1],
                    ))

        # 6. Double CNOT
        for i in range(len(ops) - 1):
            g1, g2 = ops[i], ops[i + 1]
            if (g1.get("gate", "").upper() in ("CX", "CNOT")
                    and g2.get("gate", "").upper() in ("CX", "CNOT")
                    and g1.get("target") == g2.get("target")
                    and g1.get("control") == g2.get("control")):
                findings.append(AnalysisFinding(
                    "optimization", "double_cnot",
                    f"Positions {i+1}–{i+2}: two CNOT gates with same control ({g1.get('control')}) and target ({g1.get('target')}) cancel out.",
                    "Remove both CNOT gates.", [i, i + 1],
                ))

        return findings

    def get_stats(self, circuit_data: dict) -> Dict:
        ops = circuit_data.get("operations", [])
        gate_counts: Dict[str, int] = {}
        for op in ops:
            g = op.get("gate", "UNKNOWN").upper()
            gate_counts[g] = gate_counts.get(g, 0) + 1
        return {"gate_count": len(ops), "gate_counts": gate_counts}
