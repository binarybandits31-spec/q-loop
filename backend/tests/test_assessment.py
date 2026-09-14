"""Tests for the automated assessment grader."""
import pytest
from app.services.assessment.grader import AssessmentGrader


class TestAssessmentGrader:
    def setup_method(self):
        self.g = AssessmentGrader()

    def test_quiz_perfect_score(self):
        correct = {"q1": 0, "q2": 1, "q3": 2}
        submitted = {"q1": 0, "q2": 1, "q3": 2}
        score, max_score, feedback, passed = self.g.grade_quiz(correct, submitted)
        assert score == max_score
        assert passed is True
        assert "Perfect" in feedback

    def test_quiz_partial_score(self):
        correct = {"q1": 0, "q2": 1}
        submitted = {"q1": 0, "q2": 0}  # one wrong
        score, max_score, feedback, passed = self.g.grade_quiz(correct, submitted)
        assert score == 10  # 1 out of 2 * 10 = 10
        assert max_score == 20

    def test_quiz_all_wrong_fails(self):
        correct = {"q1": 0, "q2": 1}
        submitted = {"q1": 1, "q2": 0}
        score, max_score, feedback, passed = self.g.grade_quiz(correct, submitted)
        assert score == 0
        assert passed is False

    def test_bell_state_challenge_correct(self):
        challenge = {"id": "bell-state-circuit"}
        circuit = {"qubits": 2, "operations": [{"gate": "H", "target": 0}, {"gate": "CX", "control": 0, "target": 1}]}
        sim_result = {"status": "success", "counts": {"00": 512, "11": 512}, "probabilities": {"00": 0.5, "11": 0.5}}
        score, max_score, passed, feedback = self.g.grade_circuit_challenge(challenge, circuit, sim_result)
        assert passed is True
        assert score > 0

    def test_bell_state_challenge_wrong_distribution(self):
        challenge = {"id": "bell-state-circuit"}
        circuit = {"qubits": 2, "operations": [{"gate": "X", "target": 0}]}
        sim_result = {"status": "success", "counts": {"10": 1024}, "probabilities": {"10": 1.0}}
        score, max_score, passed, feedback = self.g.grade_circuit_challenge(challenge, circuit, sim_result)
        assert passed is False

    def test_circuit_challenge_simulation_error(self):
        challenge = {"id": "bell-state-circuit"}
        circuit = {"qubits": 2, "operations": []}
        sim_result = {"status": "error", "error": "No gates"}
        score, max_score, passed, feedback = self.g.grade_circuit_challenge(challenge, circuit, sim_result)
        assert passed is False
        assert score == 0

    def test_code_challenge_bell_correct(self):
        challenge = {"id": "bell-state-code"}
        code = "circuit.h(0)\ncircuit.cx(0, 1)\ncircuit.measure([0,1],[0,1])"
        score, max_score, passed, feedback = self.g.grade_code_challenge(challenge, code, None)
        assert passed is True
        assert score == 100

    def test_code_challenge_missing_cx(self):
        challenge = {"id": "bell-state-code"}
        code = "circuit.h(0)\ncircuit.measure([0],[0])"
        score, max_score, passed, feedback = self.g.grade_code_challenge(challenge, code, None)
        assert passed is False
        assert "CNOT" in feedback or "cx" in feedback.lower()
