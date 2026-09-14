"""Safe deterministic circuit optimizer.

Only applies mathematically proven optimizations. Never changes circuit semantics.
"""
import copy
from typing import List, Dict, Any, Tuple

SELF_INVERSE = {"X", "Y", "Z", "H", "CZ", "SWAP"}
INVERSE_PAIRS = {("S", "SDG"), ("SDG", "S"), ("T", "TDG"), ("TDG", "T")}
CNOT_GATES = {"CX", "CNOT"}


class CircuitOptimizer:

    def optimize(self, circuit_data: dict) -> dict:
        """
        Apply all safe optimizations in sequence.
        Returns the optimized circuit dict and a list of applied optimization descriptions.
        """
        result = copy.deepcopy(circuit_data)
        applied: List[Dict[str, Any]] = []

        result, new_applied = self._remove_self_inverse_pairs(result)
        applied.extend(new_applied)

        result, new_applied = self._remove_inverse_phase_pairs(result)
        applied.extend(new_applied)

        result, new_applied = self._remove_double_cnot(result)
        applied.extend(new_applied)

        return {"optimized_circuit": result, "optimizations_applied": applied}

    def _remove_self_inverse_pairs(self, circuit: dict) -> Tuple[dict, List[dict]]:
        """Remove consecutive identical self-inverse gate pairs."""
        applied = []
        changed = True
        while changed:
            changed = False
            ops = circuit["operations"]
            i = 0
            new_ops = []
            while i < len(ops):
                if i + 1 < len(ops):
                    g1, g2 = ops[i], ops[i + 1]
                    gate = g1.get("gate", "").upper()
                    if (gate == g2.get("gate", "").upper()
                            and gate in SELF_INVERSE
                            and g1.get("target") == g2.get("target")
                            and g1.get("control") == g2.get("control")):
                        applied.append({
                            "type": "self_inverse_cancellation",
                            "gate": gate,
                            "qubit": g1.get("target"),
                            "message": f"Two consecutive {gate} gates cancelled (= Identity).",
                            "positions": [i, i + 1],
                        })
                        i += 2
                        changed = True
                        continue
                new_ops.append(ops[i])
                i += 1
            circuit = {**circuit, "operations": new_ops}
        return circuit, applied

    def _remove_inverse_phase_pairs(self, circuit: dict) -> Tuple[dict, List[dict]]:
        """Remove consecutive S/S†, T/T† inverse gate pairs."""
        applied = []
        changed = True
        while changed:
            changed = False
            ops = circuit["operations"]
            i = 0
            new_ops = []
            while i < len(ops):
                if i + 1 < len(ops):
                    g1u = ops[i].get("gate", "").upper()
                    g2u = ops[i + 1].get("gate", "").upper()
                    if ((g1u, g2u) in INVERSE_PAIRS
                            and ops[i].get("target") == ops[i + 1].get("target")):
                        applied.append({
                            "type": "inverse_phase_cancellation",
                            "gate": f"{g1u}/{g2u}",
                            "qubit": ops[i].get("target"),
                            "message": f"{g1u} followed by {g2u} cancelled (= Identity).",
                            "positions": [i, i + 1],
                        })
                        i += 2
                        changed = True
                        continue
                new_ops.append(ops[i])
                i += 1
            circuit = {**circuit, "operations": new_ops}
        return circuit, applied

    def _remove_double_cnot(self, circuit: dict) -> Tuple[dict, List[dict]]:
        """Remove consecutive CNOT pairs with the same control/target."""
        applied = []
        changed = True
        while changed:
            changed = False
            ops = circuit["operations"]
            i = 0
            new_ops = []
            while i < len(ops):
                if i + 1 < len(ops):
                    g1u = ops[i].get("gate", "").upper()
                    g2u = ops[i + 1].get("gate", "").upper()
                    if (g1u in CNOT_GATES and g2u in CNOT_GATES
                            and ops[i].get("target") == ops[i + 1].get("target")
                            and ops[i].get("control") == ops[i + 1].get("control")):
                        applied.append({
                            "type": "double_cnot_cancellation",
                            "gate": "CNOT",
                            "control": ops[i].get("control"),
                            "target": ops[i].get("target"),
                            "message": f"Two CNOT gates with control={ops[i].get('control')}, target={ops[i].get('target')} cancelled.",
                            "positions": [i, i + 1],
                        })
                        i += 2
                        changed = True
                        continue
                new_ops.append(ops[i])
                i += 1
            circuit = {**circuit, "operations": new_ops}
        return circuit, applied
