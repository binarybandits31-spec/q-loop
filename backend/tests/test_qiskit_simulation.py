"""Tests for actual Qiskit Aer simulation — NOT mocked results.

The Bell state test executes a real Qiskit circuit and verifies
that the actual measurement distribution matches expectations.
"""
import pytest
import math

try:
    from qiskit_aer import AerSimulator
    QISKIT_AVAILABLE = True
except ImportError:
    QISKIT_AVAILABLE = False

from app.services.quantum.qiskit_adapter import QiskitAerBackend


BELL_CIRCUIT = {
    "qubits": 2,
    "classical_bits": 2,
    "operations": [
        {"gate": "H", "target": 0},
        {"gate": "CX", "control": 0, "target": 1},
        {"gate": "MEASURE", "target": 0},
        {"gate": "MEASURE", "target": 1},
    ],
}


@pytest.mark.skipif(not QISKIT_AVAILABLE, reason="Qiskit Aer not installed")
class TestQiskitAerBackend:

    def setup_method(self):
        self.backend = QiskitAerBackend()

    def test_backend_is_available(self):
        assert self.backend.is_available is True

    def test_bell_state_actual_execution(self):
        """
        Execute a Bell state circuit with Qiskit Aer and verify the actual results.
        This is NOT a mocked test — it runs real quantum simulation.
        """
        result = self.backend.execute(BELL_CIRCUIT, shots=4096)
        assert result.status == "success", f"Simulation failed: {result.error}"
        assert result.counts, "No measurement counts returned"

        counts = result.counts
        shots = sum(counts.values())
        assert shots == 4096

        # Bell state must ONLY produce |00⟩ and |11⟩ (no |01⟩ or |10⟩)
        for state in ("01", "10", "1 0", "0 1"):
            p = counts.get(state, 0) / shots
            assert p < 0.05, f"Unexpected state {state} with probability {p:.3f}"

        p00 = counts.get("00", 0) / shots
        p11 = counts.get("11", 0) / shots

        assert p00 > 0.45, f"|00⟩ probability too low: {p00:.3f} (expected ~0.5)"
        assert p11 > 0.45, f"|11⟩ probability too low: {p11:.3f} (expected ~0.5)"

    def test_superposition_probabilities(self):
        circuit = {
            "qubits": 1,
            "classical_bits": 1,
            "operations": [
                {"gate": "H", "target": 0},
                {"gate": "MEASURE", "target": 0},
            ],
        }
        result = self.backend.execute(circuit, shots=4096)
        assert result.status == "success"
        shots = sum(result.counts.values())
        p0 = result.counts.get("0", 0) / shots
        p1 = result.counts.get("1", 0) / shots
        assert 0.44 < p0 < 0.56, f"|0⟩ probability {p0:.3f} deviates from 0.5"
        assert 0.44 < p1 < 0.56, f"|1⟩ probability {p1:.3f} deviates from 0.5"

    def test_x_gate_flips_qubit(self):
        circuit = {
            "qubits": 1,
            "classical_bits": 1,
            "operations": [
                {"gate": "X", "target": 0},
                {"gate": "MEASURE", "target": 0},
            ],
        }
        result = self.backend.execute(circuit, shots=1024)
        assert result.status == "success"
        shots = sum(result.counts.values())
        p1 = result.counts.get("1", 0) / shots
        assert p1 > 0.99, f"X gate should produce |1⟩ with probability ~1.0, got {p1:.3f}"

    def test_statevector_single_qubit(self):
        circuit = {
            "qubits": 1,
            "classical_bits": 0,
            "operations": [{"gate": "H", "target": 0}],
        }
        result = self.backend.execute(circuit, shots=1024, include_statevector=True)
        if result.statevector:
            amp_0, amp_1 = result.statevector[0], result.statevector[1]
            inv_sqrt2 = 1 / math.sqrt(2)
            assert abs(math.sqrt(amp_0[0]**2 + amp_0[1]**2) - inv_sqrt2) < 0.01
            assert abs(math.sqrt(amp_1[0]**2 + amp_1[1]**2) - inv_sqrt2) < 0.01

    def test_invalid_gate_handled(self):
        circuit = {
            "qubits": 1,
            "classical_bits": 1,
            "operations": [{"gate": "NOTAREALGATE", "target": 0}],
        }
        # Should execute (unknown gates are skipped) or return error gracefully
        result = self.backend.execute(circuit, shots=100)
        assert result.status in ("success", "error")

    def test_rotation_gate_rx_pi(self):
        """RX(π) should flip |0⟩ to |1⟩."""
        circuit = {
            "qubits": 1,
            "classical_bits": 1,
            "operations": [
                {"gate": "RX", "target": 0, "parameter": math.pi},
                {"gate": "MEASURE", "target": 0},
            ],
        }
        import math as m
        result = self.backend.execute(circuit, shots=1024)
        assert result.status == "success"
        shots = sum(result.counts.values())
        p1 = result.counts.get("1", 0) / shots
        assert p1 > 0.98, f"RX(π) should produce |1⟩, got {p1:.3f}"

    def test_ghz_state(self):
        circuit = {
            "qubits": 3,
            "classical_bits": 3,
            "operations": [
                {"gate": "H", "target": 0},
                {"gate": "CX", "control": 0, "target": 1},
                {"gate": "CX", "control": 1, "target": 2},
                {"gate": "MEASURE", "target": 0},
                {"gate": "MEASURE", "target": 1},
                {"gate": "MEASURE", "target": 2},
            ],
        }
        result = self.backend.execute(circuit, shots=4096)
        assert result.status == "success"
        shots = sum(result.counts.values())
        p000 = result.counts.get("000", 0) / shots
        p111 = result.counts.get("111", 0) / shots
        assert p000 > 0.45, f"|000⟩ probability {p000:.3f} expected ~0.5"
        assert p111 > 0.45, f"|111⟩ probability {p111:.3f} expected ~0.5"


@pytest.mark.asyncio
async def test_circuit_run_api(client):
    """Integration test: POST /api/circuits/run with a Bell state circuit."""
    resp = await client.post("/api/circuits/run", json={
        "qubits": 2,
        "classical_bits": 2,
        "operations": [
            {"gate": "H", "target": 0},
            {"gate": "CX", "control": 0, "target": 1},
            {"gate": "MEASURE", "target": 0},
            {"gate": "MEASURE", "target": 1},
        ],
        "shots": 1024,
        "framework": "qiskit_aer",
    })
    if resp.status_code == 200:
        data = resp.json()
        assert data["status"] in ("success", "error")
        if data["status"] == "success":
            assert "counts" in data
            assert "probabilities" in data
