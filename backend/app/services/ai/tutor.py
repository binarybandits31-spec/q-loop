"""AI Tutor service.

Uses the OpenAI API when configured; falls back to a curated deterministic
knowledge base otherwise. The simulator is always the source of quantum truth —
the AI explains results, never fabricates them.
"""
import json
from typing import Optional, List
from ...core.config import settings


KNOWLEDGE_BASE = {
    "qubit": """A qubit is the fundamental unit of quantum information. Unlike a classical bit (0 or 1), a qubit can exist in a *superposition* of both states simultaneously. Mathematically, |ψ⟩ = α|0⟩ + β|1⟩, where α and β are complex amplitudes satisfying |α|² + |β|² = 1. When measured, the qubit collapses to |0⟩ with probability |α|² or |1⟩ with probability |β|².""",

    "superposition": """Superposition allows a qubit to be in a combination of |0⟩ and |1⟩ at the same time. The Hadamard gate (H) creates equal superposition: H|0⟩ = (|0⟩ + |1⟩)/√2. After measurement, the superposition collapses — this is why quantum computing requires running circuits many times (shots) to build probability distributions.""",

    "entanglement": """Quantum entanglement occurs when two or more qubits become correlated such that measuring one instantly determines the state of the other, regardless of distance. To create a Bell state (maximally entangled): apply H to q0, then CNOT(q0, q1). The result is (|00⟩ + |11⟩)/√2 — measuring q0 as |0⟩ guarantees q1 is |0⟩, and vice versa.""",

    "measurement": """Quantum measurement is probabilistic and irreversible. Measuring |ψ⟩ = α|0⟩ + β|1⟩ yields 0 with probability |α|² and 1 with probability |β|², destroying the superposition (wave function collapse). The no-cloning theorem prevents copying unknown quantum states. Always measure at the end of a circuit.""",

    "hadamard": """The Hadamard gate (H) is the most fundamental gate for creating superposition. Its matrix is [[1,1],[1,-1]]/√2. H|0⟩ = |+⟩ = (|0⟩+|1⟩)/√2 and H|1⟩ = |-⟩ = (|0⟩-|1⟩)/√2. Applying H twice returns to the original state (H² = I). H on all n qubits creates an equal superposition of all 2^n computational basis states.""",

    "cnot": """The CNOT (Controlled-NOT, CX) gate operates on two qubits: a control and a target. If the control is |1⟩, it flips the target; otherwise nothing happens. Matrix (in {|00⟩,|01⟩,|10⟩,|11⟩} basis): [[1,0,0,0],[0,1,0,0],[0,0,0,1],[0,0,1,0]]. CNOT is the primary entangling gate and, combined with single-qubit gates, is universal for quantum computing.""",

    "grover": """Grover's algorithm searches an unstructured database of N items in O(√N) operations — a quadratic speedup over the classical O(N). Steps: 1) Create equal superposition with H⊗n. 2) Apply oracle (flips phase of marked item). 3) Apply Grover diffusion operator (reflects around average amplitude). 4) Repeat ~π√N/4 times. 5) Measure to find the marked item with high probability.""",

    "shor": """Shor's algorithm factors integers in polynomial time, threatening RSA encryption. It reduces factoring to period-finding: given f(x) = a^x mod N, find the period r such that f(x+r) = f(x). The quantum speedup comes from the Quantum Fourier Transform (QFT), which efficiently extracts the period from a superposition of function values.""",

    "deutsch_jozsa": """The Deutsch-Jozsa algorithm determines whether f:{0,1}^n → {0,1} is constant (all 0s or all 1s) or balanced (half 0s, half 1s) with a single query — exponentially faster than any classical algorithm. Circuit: H⊗n on input register, |−⟩ ancilla, oracle Uf, H⊗n again, then measure. All-zeros outcome → constant; any other outcome → balanced.""",

    "error_correction": """Quantum error correction protects fragile quantum states from decoherence. The Shor code encodes 1 logical qubit into 9 physical qubits, correcting any single-qubit error. Modern surface codes use a 2D lattice of qubits and are the leading approach for fault-tolerant quantum computing. Error correction requires measuring stabilizer operators without collapsing the logical state.""",

    "qft": """The Quantum Fourier Transform (QFT) is the quantum analogue of the discrete Fourier transform. It transforms n qubits from the computational basis to the Fourier basis in O(n²) gates — exponentially faster than the classical FFT for this state. QFT is a key subroutine in Shor's algorithm and quantum phase estimation.""",

    "vqe": """The Variational Quantum Eigensolver (VQE) finds the ground state energy of a molecule by combining a parameterized quantum circuit (ansatz) with classical optimization. VQE is a leading near-term (NISQ) application because it tolerates noise. The circuit prepares a trial state, measurements estimate the energy, and a classical optimizer updates the parameters to minimize it.""",

    "bloch_sphere": """The Bloch sphere is a geometric representation of a single-qubit state. Any state α|0⟩ + β|1⟩ maps to a point (x,y,z) on the unit sphere: x=2Re(αβ*), y=2Im(αβ*), z=|α|²−|β|². |0⟩ is the north pole, |1⟩ the south pole. Single-qubit gates are rotations on the Bloch sphere. Measurement collapses the state to one of the poles.""",

    "bell_state": """Bell states are the four maximally entangled two-qubit states: |Φ+⟩=(|00⟩+|11⟩)/√2, |Φ-⟩=(|00⟩-|11⟩)/√2, |Ψ+⟩=(|01⟩+|10⟩)/√2, |Ψ-⟩=(|01⟩-|10⟩)/√2. Create |Φ+⟩ with H(q0) → CNOT(q0,q1). Bell states are the resource for quantum teleportation and superdense coding.""",

    "teleportation": """Quantum teleportation transfers an unknown qubit state from Alice to Bob using a shared Bell pair and 2 classical bits. Protocol: 1) Create Bell pair (Alice has q1, Bob has q2). 2) Alice performs Bell measurement on her qubit and q1. 3) Alice sends 2 classical bits to Bob. 4) Bob applies X and/or Z correction based on the bits. No quantum channel after step 1.""",
}


def _keyword_match(question: str) -> Optional[str]:
    q = question.lower()
    keyword_map = [
        (["bloch", "sphere", "visuali"], "bloch_sphere"),
        (["bell state", "bell pair", "phi+", "phi-"], "bell_state"),
        (["teleport", "teleportation"], "teleportation"),
        (["entangl", "entangle"], "entanglement"),
        (["superposition", "superpose"], "superposition"),
        (["hadamard", " h gate", "h gate"], "hadamard"),
        (["cnot", "cx gate", "controlled-not", "controlled not"], "cnot"),
        (["grover", "search algorithm"], "grover"),
        (["shor", "factoring", "rsa"], "shor"),
        (["deutsch", "jozsa", "constant", "balanced function"], "deutsch_jozsa"),
        (["error correct", "fault tolerant", "surface code", "shor code"], "error_correction"),
        (["quantum fourier", "qft"], "qft"),
        (["vqe", "variational", "eigensolver", "molecule"], "vqe"),
        (["qubit", "quantum bit"], "qubit"),
        (["measurement", "measure", "collapse", "observe"], "measurement"),
    ]
    for keywords, key in keyword_map:
        if any(kw in q for kw in keywords):
            return KNOWLEDGE_BASE.get(key)
    return None


class AITutor:

    def __init__(self):
        self._openai_available = bool(settings.OPENAI_API_KEY)

    def _build_system_prompt(self, context: Optional[dict] = None) -> str:
        parts = [
            "You are the Q-loop AI Tutor, a precise and educational assistant for quantum computing learners.",
            "You explain concepts clearly, at the appropriate level for the learner.",
            "CRITICAL RULE: You must NEVER fabricate or invent quantum simulation results.",
            "If simulation results are provided in the context, explain THOSE actual results.",
            "If no simulation results are provided, explain theory only — do not guess what a circuit would produce.",
        ]
        if context:
            if context.get("learner_level"):
                parts.append(f"The learner's level is: {context['learner_level']}.")
            if context.get("lesson_id"):
                parts.append(f"Current lesson: {context['lesson_id']}.")
            if context.get("circuit"):
                parts.append(f"Current circuit: {json.dumps(context['circuit'], indent=2)}")
            if context.get("simulation_result"):
                parts.append(
                    f"Actual simulation result (DO NOT invent any other results):\n"
                    f"{json.dumps(context['simulation_result'], indent=2)}"
                )
            if context.get("detected_mistake"):
                parts.append(f"Detected mistake: {context['detected_mistake']}")
        return "\n\n".join(parts)

    def _openai_request(self, action: str, question: str, context: Optional[dict]) -> Optional[str]:
        if not self._openai_available:
            return None
        try:
            from openai import OpenAI
            client = OpenAI(api_key=settings.OPENAI_API_KEY)
            messages = [
                {"role": "system", "content": self._build_system_prompt(context)},
                {"role": "user", "content": f"Action: {action}\n\n{question or ''}"},
            ]
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
                max_tokens=800,
                temperature=0.3,
            )
            return response.choices[0].message.content
        except Exception:
            return None

    def explain(self, question: str, context: Optional[dict] = None) -> dict:
        ai_response = self._openai_request("explain", question, context)
        if ai_response:
            return {"response": ai_response, "confidence": "high", "source": "openai"}

        kb_response = _keyword_match(question)
        if kb_response:
            return {"response": kb_response, "confidence": "high", "source": "knowledge_base"}

        return {
            "response": (
                "I can explain many quantum computing topics including: qubits, superposition, entanglement, "
                "measurement, the Hadamard gate, CNOT, Bell states, Grover's algorithm, Shor's algorithm, "
                "Deutsch-Jozsa, QFT, VQE, error correction, and the Bloch sphere. "
                "Try asking about one of these specifically."
            ),
            "confidence": "low",
            "source": "fallback",
        }

    def hint(self, question: str, context: Optional[dict] = None) -> dict:
        ai_response = self._openai_request("hint", f"Give a hint (not the full answer) for: {question}", context)
        if ai_response:
            return {"response": ai_response, "confidence": "high", "source": "openai"}

        circuit = context.get("circuit") if context else None
        if circuit:
            ops = circuit.get("operations", [])
            n = circuit.get("qubits", 0)
            has_measure = any(op.get("gate", "").upper() in ("M", "MEASURE") for op in ops)
            hints = []
            if not has_measure:
                hints.append("Hint: Your circuit has no measurement gates. Add a MEASURE operation at the end to observe results.")
            if n > 1 and not any(op.get("gate", "").upper() in ("CX", "CNOT", "CZ") for op in ops):
                hints.append("Hint: For multi-qubit entanglement, you need a controlled gate like CNOT between qubits.")
            if hints:
                return {"response": " ".join(hints), "confidence": "medium", "source": "deterministic"}

        return {
            "response": "Hint: Think about which gates create superposition (H), which create entanglement (CNOT), and whether you have a measurement at the end.",
            "confidence": "medium",
            "source": "fallback",
        }

    def debug(self, question: str, context: Optional[dict] = None) -> dict:
        ai_response = self._openai_request("debug", f"Debug this issue: {question}", context)
        if ai_response:
            return {"response": ai_response, "confidence": "high", "source": "openai"}

        suggestions = []
        if context and context.get("simulation_result"):
            result = context["simulation_result"]
            if result.get("error"):
                suggestions.append(f"Simulation error: {result['error']}")
            counts = result.get("counts", {})
            if not counts:
                suggestions.append("No measurement counts returned — check that your circuit has MEASURE gates.")
        if context and context.get("detected_mistake"):
            suggestions.append(f"Detected issue: {context['detected_mistake']}")

        if suggestions:
            return {"response": "\n".join(suggestions), "confidence": "medium", "source": "deterministic"}

        return {
            "response": "To debug your circuit: 1) Check that all qubit indices are valid (0 to n-1). 2) Ensure measurement gates are present. 3) Check that control and target qubits are different. 4) Verify rotation gate parameters are in radians.",
            "confidence": "low",
            "source": "fallback",
        }

    def optimize(self, question: str, context: Optional[dict] = None) -> dict:
        ai_response = self._openai_request("optimize", f"Suggest optimizations for: {question}", context)
        if ai_response:
            return {"response": ai_response, "confidence": "high", "source": "openai"}

        return {
            "response": (
                "Common circuit optimisations: "
                "1) Two consecutive X gates cancel (X·X = I) — remove both. "
                "2) Two consecutive H gates cancel (H·H = I) — remove both. "
                "3) Two CNOT gates with the same control and target cancel. "
                "4) S followed by S† cancels. "
                "5) T followed by T† cancels. "
                "Use the Circuit Analyzer to detect these automatically."
            ),
            "confidence": "medium",
            "source": "knowledge_base",
        }

    def generate_code(self, question: str, context: Optional[dict] = None) -> dict:
        ai_response = self._openai_request("generate_code", f"Generate Qiskit code for: {question}", context)
        if ai_response:
            return {"response": ai_response, "confidence": "high", "source": "openai"}

        if "bell" in question.lower():
            return {
                "response": "Here is Qiskit code to create and simulate a Bell state:",
                "code_example": (
                    "from qiskit import QuantumCircuit, transpile\n"
                    "from qiskit_aer import AerSimulator\n\n"
                    "circuit = QuantumCircuit(2, 2)\n"
                    "circuit.h(0)          # Create superposition\n"
                    "circuit.cx(0, 1)      # Entangle qubits\n"
                    "circuit.measure([0,1], [0,1])\n\n"
                    "simulator = AerSimulator()\n"
                    "compiled = transpile(circuit, simulator)\n"
                    "result = simulator.run(compiled, shots=1024).result()\n"
                    "print(result.get_counts())"
                ),
                "confidence": "high",
                "source": "knowledge_base",
            }

        return {
            "response": "Please ask me to generate code for a specific quantum circuit or algorithm, e.g. 'Generate code for a Bell state' or 'Generate code for Grover's 2-qubit search'.",
            "confidence": "low",
            "source": "fallback",
        }

    def process(self, action: str, question: str, context: Optional[dict] = None) -> dict:
        handlers = {
            "explain": self.explain,
            "hint": self.hint,
            "debug": self.debug,
            "optimize": self.optimize,
            "generate_code": self.generate_code,
        }
        handler = handlers.get(action, self.explain)
        result = handler(question, context)
        result["action"] = action
        return result
