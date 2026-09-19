from typing import Any, Dict, List, Optional
import re

from openai import OpenAI

from app.core.config import settings


KNOWLEDGE_BASE = {
    "qubit": (
        "A qubit is the basic unit of quantum information. Unlike a classical bit, "
        "which is either 0 or 1, a qubit can exist in a superposition of both states."
    ),
    "superposition": (
        "Superposition means a qubit can be in a combination of |0> and |1> until "
        "a measurement is made."
    ),
    "entanglement": (
        "Entanglement is a quantum correlation between qubits where the state of one "
        "qubit is related to the state of another."
    ),
    "measurement": (
        "Measurement converts a quantum state into a classical result. For a single "
        "qubit, measurement commonly produces either 0 or 1."
    ),
    "hadamard": (
        "The Hadamard gate creates an equal superposition from |0>, producing "
        "(|0> + |1>) / sqrt(2)."
    ),
    "cnot": (
        "The CNOT gate flips the target qubit when the control qubit is |1>. "
        "It is commonly used to create entanglement."
    ),
    "bell": (
        "A Bell state is a maximally entangled two-qubit state. A common circuit "
        "creates it using an H gate followed by CNOT."
    ),
}


class AITutor:
    """AI tutor for quantum-computing explanations, debugging, optimization and code generation."""

    def __init__(self) -> None:
        self.client: Optional[OpenAI] = None

        if settings.OPENAI_API_KEY:
            self.client = OpenAI(api_key=settings.OPENAI_API_KEY)

    def _context_text(self, context: Dict[str, Any]) -> str:
        if not context:
            return "No additional circuit context was provided."

        parts = []

        learner_level = context.get("learner_level")
        if learner_level:
            parts.append(f"Learner level: {learner_level}")

        circuit = context.get("circuit")
        if circuit:
            parts.append(f"Circuit context: {circuit}")

        simulation_result = context.get("simulation_result")
        if simulation_result:
            parts.append(f"Simulation result: {simulation_result}")

        detected_mistake = context.get("detected_mistake")
        if detected_mistake:
            parts.append(f"Detected mistake: {detected_mistake}")

        lesson_id = context.get("lesson_id")
        if lesson_id:
            parts.append(f"Lesson ID: {lesson_id}")

        module_id = context.get("module_id")
        if module_id:
            parts.append(f"Module ID: {module_id}")

        return "\n".join(parts) if parts else "No additional circuit context was provided."

    def _ask_openai(
        self,
        system_prompt: str,
        user_prompt: str,
    ) -> Optional[str]:
        if not self.client:
            return None

        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": system_prompt,
                    },
                    {
                        "role": "user",
                        "content": user_prompt,
                    },
                ],
                temperature=0.2,
            )

            content = response.choices[0].message.content

            if content:
                return content.strip()

        except Exception as exc:
            print(f"OpenAI request failed: {exc}")

        return None

    def _fallback_explanation(self, question: str) -> str:
        question_lower = question.lower()

        for keyword, explanation in KNOWLEDGE_BASE.items():
            if keyword in question_lower:
                return explanation

        return (
            "I can help explain quantum-computing concepts such as qubits, "
            "superposition, entanglement, quantum gates, measurement, and Qiskit."
        )

    def explain(
        self,
        question: str,
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        context = context or {}

        system_prompt = """You are Q-Loop, an AI tutor for quantum computing.

Explain concepts clearly and accurately for the learner's level.

Rules:
- Use simple explanations first.
- Use quantum notation when useful.
- Give small examples.
- Do not invent experimental results.
- If the user asks for Qiskit code, provide actual executable Qiskit Python code.
"""

        user_prompt = f"""
Question:
{question}

Context:
{self._context_text(context)}
"""

        answer = self._ask_openai(system_prompt, user_prompt)

        if answer:
            return {
                "response": answer,
                "suggestions": [
                    "Show me a Qiskit example",
                    "Explain this step by step",
                    "Give me a visual intuition",
                ],
                "confidence": "high",
            }

        return {
            "response": self._fallback_explanation(question),
            "suggestions": [
                "Show me a Qiskit example",
                "Explain this step by step",
            ],
            "confidence": "medium",
        }

    def hint(
        self,
        question: str,
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        context = context or {}

        system_prompt = """You are a quantum-computing tutor.

Give a short hint rather than the complete answer.
Help the learner reason through the problem themselves.
If useful, mention the relevant quantum gate or Qiskit operation.
"""

        answer = self._ask_openai(
            system_prompt,
            f"Question:\n{question}\n\nContext:\n{self._context_text(context)}",
        )

        if answer:
            return {
                "response": answer,
                "confidence": "high",
            }

        return {
            "response": (
                "Start by identifying the initial state of each qubit, "
                "then determine which quantum gates are applied."
            ),
            "confidence": "medium",
        }

    def debug(
        self,
        question: str,
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        context = context or {}

        system_prompt = """You are an expert Qiskit debugging tutor.

Analyze the user's quantum-computing problem carefully.

When code is provided:
1. Identify the likely error.
2. Explain why it happens.
3. Provide corrected Qiskit code when appropriate.
4. Keep the explanation understandable to a learner.
"""

        answer = self._ask_openai(
            system_prompt,
            f"Problem:\n{question}\n\nContext:\n{self._context_text(context)}",
        )

        if answer:
            code = self._extract_code(answer)

            return {
                "response": self._extract_explanation(answer),
                "code_example": code,
                "confidence": "high",
            }

        return {
            "response": (
                "I could not access the AI debugger right now. "
                "Please provide the Qiskit code and the error message."
            ),
            "confidence": "low",
        }

    def optimize(
        self,
        question: str,
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        context = context or {}

        system_prompt = """You are a quantum-circuit optimization tutor.

Analyze the requested circuit and suggest ways to reduce:
- gate count
- circuit depth
- unnecessary operations

Explain every important optimization.
Provide Qiskit code when useful.
"""

        answer = self._ask_openai(
            system_prompt,
            f"Optimization request:\n{question}\n\nContext:\n{self._context_text(context)}",
        )

        if answer:
            return {
                "response": self._extract_explanation(answer),
                "code_example": self._extract_code(answer),
                "confidence": "high",
            }

        return {
            "response": (
                "I could not access the AI optimizer right now. "
                "Try providing the circuit or Qiskit code you want to optimize."
            ),
            "confidence": "low",
        }

    def generate_code(
        self,
        question: str,
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        context = context or {}

        system_prompt = """You are the Q-Loop quantum-computing code generator.

Your job is to convert the user's request into REAL, EXECUTABLE Qiskit Python code.

IMPORTANT:
- Always generate actual Python code when the user asks for code.
- Use Qiskit.
- The installed environment uses Qiskit 1.x.
- Prefer qiskit_aer.AerSimulator for simulation.
- Do not give pseudocode when executable code is possible.
- Put the complete Python program inside ONE markdown ```python code block.
- Include imports.
- Build the circuit.
- Add measurements when simulation results are requested.
- Run the simulator when appropriate.
- Print useful results.
- After the code block, briefly explain what the code does.
"""

        user_prompt = f"""
Generate Qiskit code for this request:

{question}

Learner/circuit context:

{self._context_text(context)}
"""

        answer = self._ask_openai(system_prompt, user_prompt)

        if answer:
            code = self._extract_code(answer)

            if code:
                return {
                    "response": self._extract_explanation(answer),
                    "code_example": code,
                    "confidence": "high",
                }

            return {
                "response": answer,
                "code_example": None,
                "confidence": "medium",
            }

        # Deterministic fallback examples if OpenAI is temporarily unavailable.
        question_lower = question.lower()

        if "bell" in question_lower or "entangle" in question_lower:
            code = """from qiskit import QuantumCircuit
from qiskit_aer import AerSimulator

# Create a 2-qubit Bell-state circuit
qc = QuantumCircuit(2, 2)

# Put qubit 0 into superposition
qc.h(0)

# Entangle qubit 1 with qubit 0
qc.cx(0, 1)

# Measure both qubits
qc.measure([0, 1], [0, 1])

print(qc)

# Simulate the circuit
simulator = AerSimulator()
result = simulator.run(qc, shots=1024).result()

print("Measurement results:")
print(result.get_counts())
"""

            return {
                "response": (
                    "Here is an executable Qiskit example that creates "
                    "a Bell state using a Hadamard gate and CNOT."
                ),
                "code_example": code,
                "confidence": "medium",
            }

        if "hadamard" in question_lower or "superposition" in question_lower:
            code = """from qiskit import QuantumCircuit
from qiskit_aer import AerSimulator

# Create a 1-qubit circuit
qc = QuantumCircuit(1, 1)

# Create an equal superposition
qc.h(0)

# Measure the qubit
qc.measure(0, 0)

print(qc)

# Simulate the circuit
simulator = AerSimulator()
result = simulator.run(qc, shots=1024).result()

print("Measurement results:")
print(result.get_counts())
"""

            return {
                "response": (
                    "Here is an executable Qiskit example that applies "
                    "a Hadamard gate to create a superposition."
                ),
                "code_example": code,
                "confidence": "medium",
            }

        return {
            "response": (
                "I can generate executable Qiskit code for this request, "
                "but the AI service is currently unavailable. "
                "Try asking for a Bell state, Hadamard superposition, "
                "measurement circuit, or another Qiskit circuit."
            ),
            "confidence": "low",
        }

    @staticmethod
    def _extract_code(text: str) -> Optional[str]:
        matches = re.findall(
            r"```(?:python|py)?\s*(.*?)```",
            text,
            flags=re.DOTALL | re.IGNORECASE,
        )

        if matches:
            return matches[0].strip()

        return None

    @staticmethod
    def _extract_explanation(text: str) -> str:
        cleaned = re.sub(
            r"```(?:python|py)?\s*.*?```",
            "",
            text,
            flags=re.DOTALL | re.IGNORECASE,
        )

        return cleaned.strip()