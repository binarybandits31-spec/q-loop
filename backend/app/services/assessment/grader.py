"""Automated assessment grader.

Grades quiz, circuit, and coding challenge submissions deterministically.
Circuit challenges are graded against actual Qiskit Aer simulation results.
"""
from typing import Dict, Any, Tuple, Optional


class AssessmentGrader:

    def grade_quiz(
        self,
        correct_answers: Dict[str, int],
        submitted_answers: Dict[str, int],
    ) -> Tuple[int, int, str]:
        """Returns (score, max_score, feedback)."""
        if not correct_answers:
            return 0, 0, "No questions in this quiz."

        correct_count = sum(
            1 for qid, correct_idx in correct_answers.items()
            if submitted_answers.get(qid) == correct_idx
        )
        max_score = len(correct_answers) * 10
        score = correct_count * 10
        pct = (correct_count / len(correct_answers)) * 100

        if pct == 100:
            feedback = f"Perfect score! {correct_count}/{len(correct_answers)} correct."
        elif pct >= 70:
            feedback = f"Good work! {correct_count}/{len(correct_answers)} correct ({pct:.0f}%). Review the incorrect answers."
        elif pct >= 50:
            feedback = f"Passing grade. {correct_count}/{len(correct_answers)} correct ({pct:.0f}%). Consider reviewing the lesson material."
        else:
            feedback = f"Keep practising. {correct_count}/{len(correct_answers)} correct ({pct:.0f}%). Review the lesson and try again."

        passed = pct >= 60
        return score, max_score, feedback, passed

    def grade_circuit_challenge(
        self,
        challenge_data: Dict[str, Any],
        circuit_data: Dict[str, Any],
        simulation_result: Optional[Dict[str, Any]],
    ) -> Tuple[int, int, bool, str]:
        """Grade a circuit challenge submission.

        Uses the actual simulation result; never fabricates quantum results.
        Returns (score, max_score, passed, feedback).
        """
        challenge_type = challenge_data.get("id", "")
        max_score = 100

        if not simulation_result:
            return 0, max_score, False, "No simulation result provided. Run the circuit before submitting."

        if simulation_result.get("status") == "error":
            return 0, max_score, False, f"Simulation failed: {simulation_result.get('error', 'Unknown error')}"

        counts: Dict[str, int] = simulation_result.get("counts", {})
        shots: int = sum(counts.values()) or 1
        probabilities: Dict[str, float] = {k: v / shots for k, v in counts.items()}

        # Bell State: ~50% |00⟩ and ~50% |11⟩
        if "bell" in challenge_type:
            p00 = probabilities.get("00", 0.0)
            p11 = probabilities.get("11", 0.0)
            p01 = probabilities.get("01", 0.0)
            p10 = probabilities.get("10", 0.0)
            if p00 > 0.45 and p11 > 0.45 and p01 < 0.05 and p10 < 0.05:
                gate_count = len(circuit_data.get("operations", []))
                gate_bonus = max(0, 100 - max(0, gate_count - 2) * 10)
                score = gate_bonus
                return score, max_score, True, (
                    f"Bell state created successfully! "
                    f"|00⟩: {p00*100:.1f}%, |11⟩: {p11*100:.1f}%. "
                    f"{'Optimal — minimum gates used!' if gate_count <= 2 else f'Works, but can be done in fewer gates ({gate_count} used).'}"
                )
            cross = p01 + p10
            return int((p00 + p11) * 50), max_score, False, (
                f"Not a Bell state. |00⟩: {p00*100:.1f}%, |01⟩: {p01*100:.1f}%, "
                f"|10⟩: {p10*100:.1f}%, |11⟩: {p11*100:.1f}%. "
                "A Bell state needs ~50% |00⟩ and ~50% |11⟩ with no |01⟩ or |10⟩."
            )

        # Superposition: ~50% |0⟩ and ~50% |1⟩
        if "superposition" in challenge_type:
            p0 = probabilities.get("0", 0.0)
            p1 = probabilities.get("1", 0.0)
            if 0.4 < p0 < 0.6 and 0.4 < p1 < 0.6:
                gate_count = len(circuit_data.get("operations", []))
                score = max(60, 100 - max(0, gate_count - 1) * 15)
                return score, max_score, True, f"Superposition achieved! |0⟩: {p0*100:.1f}%, |1⟩: {p1*100:.1f}%."
            return int(min(p0, p1) * 100), max_score, False, f"Not equal superposition. |0⟩: {p0*100:.1f}%, |1⟩: {p1*100:.1f}%. Need ~50/50."

        # GHZ state: ~50% |000⟩ and ~50% |111⟩
        if "ghz" in challenge_type:
            p000 = probabilities.get("000", 0.0)
            p111 = probabilities.get("111", 0.0)
            if p000 > 0.45 and p111 > 0.45:
                gate_count = len(circuit_data.get("operations", []))
                score = max(50, 100 - max(0, gate_count - 3) * 10)
                return score, max_score, True, f"GHZ state created! |000⟩: {p000*100:.1f}%, |111⟩: {p111*100:.1f}%."
            return int((p000 + p111) * 50), max_score, False, f"Not a GHZ state. |000⟩: {p000*100:.1f}%, |111⟩: {p111*100:.1f}%."

        # Generic: check that circuit ran without errors
        if counts:
            return 70, max_score, True, "Circuit executed successfully. Review the simulation results."
        return 0, max_score, False, "Circuit produced no measurement results. Ensure measurement gates are present."

    def grade_code_challenge(
        self,
        challenge_data: Dict[str, Any],
        code: str,
        execution_result: Optional[Dict[str, Any]],
    ) -> Tuple[int, int, bool, str]:
        """Grade a coding challenge.

        Validates code structure and execution results.
        Returns (score, max_score, passed, feedback).
        """
        max_score = 100
        challenge_id = challenge_data.get("id", "")

        if execution_result and execution_result.get("error"):
            return 0, max_score, False, f"Code error: {execution_result['error']}"

        code_lower = code.lower()

        if "bell" in challenge_id:
            has_h = "circuit.h(" in code_lower or ".h(0)" in code_lower
            has_cx = any(x in code_lower for x in ["circuit.cx(", "circuit.cnot(", ".cx(0,"])
            has_measure = "measure" in code_lower

            score = (30 if has_h else 0) + (40 if has_cx else 0) + (30 if has_measure else 0)
            passed = score >= 70

            if passed:
                return score, max_score, True, "Correct structure for a Bell state circuit!"
            missing = [x for x, ok in [("H gate", has_h), ("CNOT gate", has_cx), ("measurement", has_measure)] if not ok]
            return score, max_score, False, f"Missing: {', '.join(missing)}."

        if "superposition" in challenge_id:
            has_h = "circuit.h(" in code_lower
            has_measure = "measure" in code_lower
            score = (60 if has_h else 0) + (40 if has_measure else 0)
            passed = has_h
            if passed:
                return score, max_score, True, "Correct! H gate creates superposition."
            return score, max_score, False, "Add circuit.h(0) to create superposition."

        if execution_result and not execution_result.get("error"):
            return 70, max_score, True, "Code executed successfully."
        return 40, max_score, False, "Code submitted. Ensure it runs without errors and includes measurement."
