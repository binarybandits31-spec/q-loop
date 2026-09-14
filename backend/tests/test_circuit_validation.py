"""Tests for deterministic circuit validation and analysis."""
import pytest
from app.services.quantum.analyzer import CircuitAnalyzer
from app.services.quantum.optimizer import CircuitOptimizer


def make_circuit(qubits, ops):
    return {"qubits": qubits, "classical_bits": qubits, "operations": ops}


class TestCircuitAnalyzer:
    def setup_method(self):
        self.a = CircuitAnalyzer()

    def test_valid_bell_circuit_no_errors(self):
        circuit = make_circuit(2, [
            {"gate": "H", "target": 0},
            {"gate": "CX", "control": 0, "target": 1},
            {"gate": "MEASURE", "target": 0},
            {"gate": "MEASURE", "target": 1},
        ])
        findings = self.a.analyze(circuit)
        errors = [f for f in findings if f.severity == "error"]
        assert errors == [], f"Unexpected errors: {errors}"

    def test_invalid_qubit_reference(self):
        circuit = make_circuit(2, [{"gate": "X", "target": 5}])
        findings = self.a.analyze(circuit)
        assert any(f.severity == "error" and "target" in f.type for f in findings)

    def test_control_equals_target(self):
        circuit = make_circuit(2, [{"gate": "CX", "control": 0, "target": 0}])
        findings = self.a.analyze(circuit)
        assert any(f.severity == "error" and "control_equals_target" in f.type for f in findings)

    def test_no_measurement_warning(self):
        circuit = make_circuit(1, [{"gate": "H", "target": 0}])
        findings = self.a.analyze(circuit)
        assert any(f.severity == "warning" and "measurement" in f.type for f in findings)

    def test_redundant_x_pair_optimization(self):
        circuit = make_circuit(1, [
            {"gate": "X", "target": 0}, {"gate": "X", "target": 0},
            {"gate": "MEASURE", "target": 0},
        ])
        findings = self.a.analyze(circuit)
        assert any(f.severity == "optimization" and "redundant" in f.type for f in findings)

    def test_redundant_h_pair_optimization(self):
        circuit = make_circuit(1, [
            {"gate": "H", "target": 0}, {"gate": "H", "target": 0},
            {"gate": "MEASURE", "target": 0},
        ])
        findings = self.a.analyze(circuit)
        assert any(f.severity == "optimization" for f in findings)

    def test_double_cnot_optimization(self):
        circuit = make_circuit(2, [
            {"gate": "CX", "control": 0, "target": 1},
            {"gate": "CX", "control": 0, "target": 1},
            {"gate": "MEASURE", "target": 0},
            {"gate": "MEASURE", "target": 1},
        ])
        findings = self.a.analyze(circuit)
        assert any("double_cnot" in f.type for f in findings)

    def test_gate_after_measurement_warning(self):
        circuit = make_circuit(1, [
            {"gate": "MEASURE", "target": 0},
            {"gate": "X", "target": 0},
        ])
        findings = self.a.analyze(circuit)
        assert any(f.severity == "warning" and "after_measurement" in f.type for f in findings)

    def test_zero_qubit_circuit_error(self):
        circuit = make_circuit(0, [])
        findings = self.a.analyze(circuit)
        assert any(f.severity == "error" for f in findings)


class TestCircuitOptimizer:
    def setup_method(self):
        self.o = CircuitOptimizer()

    def test_remove_double_x(self):
        circuit = make_circuit(1, [
            {"gate": "X", "target": 0}, {"gate": "X", "target": 0},
            {"gate": "MEASURE", "target": 0},
        ])
        result = self.o.optimize(circuit)
        ops = result["optimized_circuit"]["operations"]
        assert not any(op["gate"] == "X" for op in ops)
        assert len(result["optimizations_applied"]) > 0

    def test_remove_double_cnot(self):
        circuit = make_circuit(2, [
            {"gate": "CX", "control": 0, "target": 1},
            {"gate": "CX", "control": 0, "target": 1},
            {"gate": "MEASURE", "target": 0},
        ])
        result = self.o.optimize(circuit)
        ops = result["optimized_circuit"]["operations"]
        assert not any(op["gate"] == "CX" for op in ops)

    def test_no_unnecessary_changes(self):
        circuit = make_circuit(2, [
            {"gate": "H", "target": 0},
            {"gate": "CX", "control": 0, "target": 1},
            {"gate": "MEASURE", "target": 0},
            {"gate": "MEASURE", "target": 1},
        ])
        result = self.o.optimize(circuit)
        assert result["optimizations_applied"] == []
        assert len(result["optimized_circuit"]["operations"]) == 4
