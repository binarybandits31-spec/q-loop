from typing import Any, Dict, List, Optional
import re

from openai import OpenAI

from app.core.config import settings
from app.services.ai.agent import agent


# ---------------------------------------------------------------------------
# Q-Loop Knowledge Base
# ---------------------------------------------------------------------------

KNOWLEDGE_BASE = {
    "qubit": (
        "A qubit is the basic unit of quantum information. "
        "Unlike a classical bit, a qubit can exist in a quantum "
        "superposition of |0> and |1>."
    ),
    "superposition": (
        "Superposition means a quantum state can be represented "
        "as a combination of basis states. A single qubit can be "
        "written as alpha|0> + beta|1>, where "
        "|alpha|^2 + |beta|^2 = 1."
    ),
    "entanglement": (
        "Entanglement is a quantum correlation between qubits where "
        "the joint quantum state cannot be described independently "
        "for each qubit."
    ),
    "measurement": (
        "Measurement converts a quantum state into a classical "
        "outcome. The probabilities of the possible outcomes are "
        "determined by the amplitudes of the quantum state."
    ),
    "hadamard": (
        "The Hadamard gate creates an equal superposition from |0>: "
        "H|0> = (|0> + |1>) / sqrt(2)."
    ),
    "cnot": (
        "The controlled-NOT (CNOT) gate flips the target qubit when "
        "the control qubit is in state |1>."
    ),
    "bell": (
        "A Bell state can be created by applying H to the first "
        "qubit and then CNOT with the first qubit as control. "
        "Starting from |00>, this produces "
        "(|00> + |11>) / sqrt(2)."
    ),
}


class AITutor:
    """
    Q-Loop AI Tutor.

    Responsibilities:
    - Explain quantum-algorithm concepts.
    - Provide hints.
    - Debug circuits.
    - Suggest optimizations.
    - Generate educational code.
    - Use the QLoopAgent when a verified simulator result is needed.

    The tutor does not have unrestricted computer access.
    """

    def __init__(self) -> None:
        self.client: Optional[OpenAI] = None

        if settings.OPENAI_API_KEY:
            self.client = OpenAI(
                api_key=settings.OPENAI_API_KEY
            )

    # -----------------------------------------------------------------------
    # Context
    # -----------------------------------------------------------------------

    def _context_text(self, context: Dict[str, Any]) -> str:
        """Convert Q-Loop context into a readable prompt section."""

        parts: List[str] = []

        if context.get("learner_level"):
            parts.append(
                f"Learner level: {context['learner_level']}"
            )

        if context.get("lesson_id"):
            parts.append(
                f"Lesson ID: {context['lesson_id']}"
            )

        if context.get("module_id"):
            parts.append(
                f"Module ID: {context['module_id']}"
            )

        if context.get("challenge_id"):
            parts.append(
                f"Challenge ID: {context['challenge_id']}"
            )

        if context.get("circuit"):
            parts.append(
                f"Circuit:\n{context['circuit']}"
            )

        if context.get("simulation_result"):
            parts.append(
                f"Simulation result:\n{context['simulation_result']}"
            )

        if context.get("detected_mistake"):
            parts.append(
                f"Detected mistake:\n{context['detected_mistake']}"
            )

        if not parts:
            return "No additional Q-Loop context was provided."

        return "\n\n".join(parts)

    # -----------------------------------------------------------------------
    # OpenAI helper
    # -----------------------------------------------------------------------

    def _ask_openai(
        self,
        system_prompt: str,
        user_prompt: str,
    ) -> Optional[str]:
        """
        Ask the currently configured OpenAI-compatible model.

        This remains optional. If no API key is configured,
        the tutor falls back to its local knowledge base.
        """

        if self.client is None:
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

            return response.choices[0].message.content

        except Exception:
            return None

    # -----------------------------------------------------------------------
    # Agent integration
    # -----------------------------------------------------------------------

    def _run_agent_if_needed(
        self,
        question: str,
        context: Dict[str, Any],
    ) -> Optional[Dict[str, Any]]:
        """
        Ask the QLoopAgent whether the question requires a Q-Loop tool.

        Currently the agent can use simulate_circuit.

        Returns:
            Tool result if a tool was executed.
            None if no tool is required.
        """

        decision = agent.analyze_request(
            question,
            context,
        )

        if decision.get("type") != "tool_required":
            return None

        tool_name = decision.get("tool")

        if tool_name != "simulate_circuit":
            return None

        circuit = context.get("circuit")

        if not circuit:
            return {
                "status": "error",
                "error": "A circuit is required for simulation.",
            }

        return agent.run_tool(
            tool_name,
            {
                "circuit": circuit,
            },
        )

    def _build_simulation_explanation(
        self,
        question: str,
        simulation_result: Dict[str, Any],
    ) -> str:
        """
        Build a factual explanation from a verified simulator result.

        This is intentionally deterministic for now.
        The future open model can turn this into a richer explanation.
        """

        if simulation_result.get("status") != "success":
            return (
                "I could not complete the circuit simulation.\n\n"
                f"Reason: {simulation_result.get('error', 'Unknown error')}"
            )

        counts = simulation_result.get("counts", {})
        probabilities = simulation_result.get("probabilities", {})

        framework = simulation_result.get(
            "framework",
            "unknown backend",
        )

        shots = simulation_result.get(
            "shots",
            0,
        )

        depth = simulation_result.get(
            "circuit_depth"
        )

        gate_count = simulation_result.get(
            "gate_count"
        )

        lines = [
            "I ran the circuit using the Q-Loop simulator.",
            "",
            f"Backend: {framework}",
            f"Shots: {shots}",
        ]

        if depth is not None:
            lines.append(
                f"Circuit depth: {depth}"
            )

        if gate_count is not None:
            lines.append(
                f"Gate count: {gate_count}"
            )

        lines.extend(
            [
                "",
                "Measurement results:",
            ]
        )

        for state, count in counts.items():
            probability = probabilities.get(state)

            if probability is not None:
                percentage = probability * 100

                lines.append(
                    f"- |{state}>: {count} shots "
                    f"({percentage:.2f}%)"
                )
            else:
                lines.append(
                    f"- |{state}>: {count} shots"
                )

        lines.extend(
            [
                "",
                "These values come from the actual Q-Loop "
                "simulation result rather than being estimated "
                "from the question.",
            ]
        )

        return "\n".join(lines)

    # -----------------------------------------------------------------------
    # Fallback explanation
    # -----------------------------------------------------------------------

    def _fallback_explanation(
        self,
        question: str,
    ) -> str:
        """Provide a simple explanation when no model is available."""

        question_lower = question.lower()

        if "bell" in question_lower:
            return (
                "A Bell state is a two-qubit entangled state. "
                "Starting with |00>, applying a Hadamard gate to "
                "the first qubit creates superposition. Applying "
                "CNOT then correlates the two qubits, producing "
                "(|00> + |11>) / sqrt(2)."
            )

        for keyword, explanation in KNOWLEDGE_BASE.items():
            if keyword in question_lower:
                return explanation

        return (
            "I can help you learn quantum algorithms step by step. "
            "Try asking about qubits, superposition, measurement, "
            "Hadamard gates, CNOT, entanglement, or Bell states."
        )

    # -----------------------------------------------------------------------
    # Explain
    # -----------------------------------------------------------------------

    def explain(
        self,
        question: str,
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:

        context = context or {}

        # ---------------------------------------------------------------
        # First: allow the QLoopAgent to use verified Q-Loop tools.
        # ---------------------------------------------------------------

        simulation_result = self._run_agent_if_needed(
            question,
            context,
        )

        if simulation_result is not None:

            if simulation_result.get("status") == "success":

                response = self._build_simulation_explanation(
                    question,
                    simulation_result,
                )

                return {
                    "response": response,
                    "suggestions": [
                        "Explain why these probabilities occur.",
                        "Explain the circuit step by step.",
                        "Show the mathematical derivation.",
                    ],
                    "code_example": None,
                    "confidence": "high",
                    "sources": [
                        "Q-Loop quantum simulator"
                    ],
                }

            # If simulation was requested but failed,
            # report the actual error instead of inventing a result.

            return {
                "response": self._build_simulation_explanation(
                    question,
                    simulation_result,
                ),
                "suggestions": [
                    "Check the circuit configuration.",
                    "Check the selected simulator backend.",
                ],
                "code_example": None,
                "confidence": "high",
                "sources": [
                    "Q-Loop quantum simulator"
                ],
            }

        # ---------------------------------------------------------------
        # Otherwise ask the configured model.
        # ---------------------------------------------------------------

        context_text = self._context_text(context)

        system_prompt = """
You are the Q-Loop AI Tutor.

Q-Loop is an interactive platform for learning quantum algorithms.

Your job is to teach quantum algorithm concepts clearly and accurately.

Teaching rules:
1. Start with a simple beginner-friendly explanation.
2. Then provide the technical explanation when useful.
3. Explain concepts step by step.
4. Use Dirac notation when appropriate.
5. Explain probabilities mathematically when relevant.
6. Never invent simulator results.
7. Clearly distinguish theoretical results from actual simulator results.
8. If explaining a circuit, describe each gate and its effect.
9. When appropriate, provide Qiskit-compatible examples.
10. Keep explanations focused on quantum algorithms and learning.
"""

        user_prompt = f"""
Learner question:

{question}

Q-Loop context:

{context_text}
"""

        response = self._ask_openai(
            system_prompt,
            user_prompt,
        )

        if response is None:
            response = self._fallback_explanation(
                question
            )

        return {
            "response": response,
            "suggestions": [
                "Explain this more simply.",
                "Show a mathematical example.",
                "Show a quantum circuit example.",
            ],
            "code_example": None,
            "confidence": "medium",
            "sources": [
                "Q-Loop knowledge base"
            ],
        }

    # -----------------------------------------------------------------------
    # Hint
    # -----------------------------------------------------------------------

    def hint(
        self,
        question: str,
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:

        context = context or {}

        prompt = f"""
Give the learner a short hint without directly giving
the complete answer.

Question:
{question}

Context:
{self._context_text(context)}
"""

        response = self._ask_openai(
            "You are a quantum algorithm tutor.",
            prompt,
        )

        if response is None:
            response = (
                "Start by identifying the quantum state, "
                "then determine which gate or algorithm step "
                "changes that state."
            )

        return {
            "response": response,
            "suggestions": [
                "Give me another hint.",
                "Explain the concept behind the hint.",
            ],
            "code_example": None,
            "confidence": "medium",
            "sources": [
                "Q-Loop AI Tutor"
            ],
        }

    # -----------------------------------------------------------------------
    # Debug
    # -----------------------------------------------------------------------

    def debug(
        self,
        question: str,
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:

        context = context or {}

        prompt = f"""
Analyze the learner's quantum circuit or algorithm problem.

Identify:
1. What appears to be wrong.
2. Why it is wrong.
3. How to fix it.
4. What result should be expected theoretically.

Do not invent simulator results.

Question:
{question}

Context:
{self._context_text(context)}
"""

        response = self._ask_openai(
            "You are a quantum circuit debugging tutor.",
            prompt,
        )

        if response is None:
            response = (
                "Check the gate order, target qubits, control qubits, "
                "measurement operations, and the expected quantum state."
            )

        return {
            "response": response,
            "suggestions": [
                "Show the corrected circuit.",
                "Explain the error step by step.",
            ],
            "code_example": None,
            "confidence": "medium",
            "sources": [
                "Q-Loop AI Tutor"
            ],
        }

    # -----------------------------------------------------------------------
    # Optimize
    # -----------------------------------------------------------------------

    def optimize(
        self,
        question: str,
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:

        context = context or {}

        prompt = f"""
Analyze this quantum circuit or algorithm and suggest
educational optimization opportunities.

Consider:
- unnecessary gates
- circuit depth
- repeated operations
- equivalent gate combinations
- clarity for a learner

Do not change the intended algorithm without explaining why.

Question:
{question}

Context:
{self._context_text(context)}
"""

        response = self._ask_openai(
            "You are a quantum circuit optimization tutor.",
            prompt,
        )

        if response is None:
            response = (
                "Look for repeated gates, unnecessary operations, "
                "and opportunities to reduce circuit depth while "
                "preserving the intended quantum operation."
            )

        return {
            "response": response,
            "suggestions": [
                "Show an optimized circuit.",
                "Compare the original and optimized depth.",
            ],
            "code_example": None,
            "confidence": "medium",
            "sources": [
                "Q-Loop AI Tutor"
            ],
        }

    # -----------------------------------------------------------------------
    # Generate code
    # -----------------------------------------------------------------------

    def generate_code(
        self,
        question: str,
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:

        context = context or {}

        prompt = f"""
Generate educational Qiskit code for the learner's
quantum algorithm or circuit question.

Requirements:
- Keep the code beginner-friendly.
- Explain important lines.
- Use standard Qiskit APIs.
- Do not invent simulator results.

Question:
{question}

Context:
{self._context_text(context)}
"""

        response = self._ask_openai(
            "You are a quantum programming tutor.",
            prompt,
        )

        if response is None:
            response = (
                "I need a more specific circuit or algorithm "
                "description before generating the code."
            )

        code = self._extract_code(
            response
        )

        explanation = self._extract_explanation(
            response
        )

        return {
            "response": explanation,
            "suggestions": [
                "Explain the generated code.",
                "Show the expected circuit.",
            ],
            "code_example": code,
            "confidence": "medium",
            "sources": [
                "Q-Loop AI Tutor"
            ],
        }

    # -----------------------------------------------------------------------
    # Code extraction helpers
    # -----------------------------------------------------------------------

    def _extract_code(
        self,
        text: str,
    ) -> Optional[str]:

        match = re.search(
            r"```(?:python|py)?\s*(.*?)```",
            text,
            re.DOTALL | re.IGNORECASE,
        )

        if match:
            return match.group(1).strip()

        return None

    def _extract_explanation(
        self,
        text: str,
    ) -> str:

        cleaned = re.sub(
            r"```(?:python|py)?\s*.*?```",
            "",
            text,
            flags=re.DOTALL | re.IGNORECASE,
        )

        return cleaned.strip()


# ---------------------------------------------------------------------------
# Shared tutor instance
# ---------------------------------------------------------------------------

tutor = AITutor()