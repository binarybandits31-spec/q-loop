"""
Q-Loop AI Tutor

Provides explanations for quantum-algorithm learning questions,
using Q-Loop circuit context and the QLoopAgent when simulation
is required.
"""

from typing import Any, Dict, Optional

from app.services.ai.agent import agent


# ---------------------------------------------------------------------------
# Knowledge base
# ---------------------------------------------------------------------------

KNOWLEDGE_BASE = {
    "qubit": (
        "A qubit is the basic unit of quantum information. "
        "Unlike a classical bit, which is either 0 or 1, a qubit can "
        "exist in a quantum state involving both |0> and |1>."
    ),

    "superposition": (
        "Superposition means that a qubit can be represented as a "
        "combination of |0> and |1> until measurement. "
        "For example, applying a Hadamard gate to |0> creates "
        "an equal superposition of |0> and |1>."
    ),

    "entanglement": (
        "Quantum entanglement is a quantum relationship between qubits "
        "where their measurement outcomes can be strongly correlated. "
        "The Bell state is a common example."
    ),

    "measurement": (
        "Measurement converts the quantum state into a classical result. "
        "When a superposition is measured, one of the possible basis "
        "states is observed according to its probability."
    ),

    "hadamard": (
        "The Hadamard gate, H, creates or removes equal superposition. "
        "When applied to |0>, it produces an equal combination of |0> "
        "and |1>."
    ),

    "cnot": (
        "The controlled-NOT gate, or CNOT, uses one qubit as a control "
        "and another as a target. The target is flipped when the control "
        "qubit is |1>."
    ),

    "bell": (
        "A common Bell-state circuit applies H to the first qubit and "
        "then CNOT with the first qubit as control and the second as "
        "target. Starting from |00>, this creates an entangled state "
        "whose ideal measurement outcomes are |00> and |11>."
    ),
}


# ---------------------------------------------------------------------------
# AI Tutor
# ---------------------------------------------------------------------------

class AITutor:
    """
    Main Q-Loop AI Tutor.

    The tutor can:
    - answer basic quantum-algorithm questions
    - inspect the learner's circuit context
    - request simulation through QLoopAgent
    - explain actual simulation results
    - optionally use OpenAI when configured
    """

    def __init__(self) -> None:
        self.knowledge_base = KNOWLEDGE_BASE

    # -----------------------------------------------------------------------
    # Context formatting
    # -----------------------------------------------------------------------

    def _context_text(self, context: Optional[Dict[str, Any]]) -> str:
        """
        Convert Q-Loop learner/circuit context into readable text.
        """

        if not context:
            return "No additional Q-Loop context was provided."

        lines = []

        learner_level = context.get("learner_level")
        if learner_level:
            lines.append(f"Learner level: {learner_level}")

        lesson_id = context.get("lesson_id")
        if lesson_id:
            lines.append(f"Lesson: {lesson_id}")

        module_id = context.get("module_id")
        if module_id:
            lines.append(f"Module: {module_id}")

        detected_mistake = context.get("detected_mistake")
        if detected_mistake:
            lines.append(f"Detected mistake: {detected_mistake}")

        challenge_id = context.get("challenge_id")
        if challenge_id:
            lines.append(f"Challenge: {challenge_id}")

        # ---------------------------------------------------------------
        # Circuit context
        # ---------------------------------------------------------------

        circuit = context.get("circuit")

        if circuit:
            lines.append("")
            lines.append("Current circuit:")

            if isinstance(circuit, dict):
                qubits = circuit.get("qubits")
                if qubits is not None:
                    lines.append(f"- Qubits: {qubits}")

                operations = circuit.get("operations", [])

                if operations:
                    for index, operation in enumerate(operations, start=1):
                        if not isinstance(operation, dict):
                            lines.append(f"- Operation {index}: {operation}")
                            continue

                        gate = operation.get("gate", "?")
                        target = operation.get("target")

                        description = f"- {index}. {gate}"

                        if target is not None:
                            description += f" on q{target}"

                        control = operation.get("control")
                        if control is not None:
                            description += f", control q{control}"

                        control2 = operation.get("control2")
                        if control2 is not None:
                            description += f", control2 q{control2}"

                        parameter = operation.get("parameter")
                        if parameter is not None:
                            description += f", parameter={parameter}"

                        lines.append(description)

        # ---------------------------------------------------------------
        # Simulation result context
        # ---------------------------------------------------------------

        simulation_result = context.get("simulation_result")

        if simulation_result:
            lines.append("")
            lines.append("Latest simulation result:")

            if isinstance(simulation_result, dict):
                framework = simulation_result.get("framework")
                if framework:
                    lines.append(f"- Framework: {framework}")

                shots = simulation_result.get("shots")
                if shots is not None:
                    lines.append(f"- Shots: {shots}")

                depth = simulation_result.get("circuit_depth")
                if depth is not None:
                    lines.append(f"- Circuit depth: {depth}")

                gate_count = simulation_result.get("gate_count")
                if gate_count is not None:
                    lines.append(f"- Gate count: {gate_count}")

                counts = simulation_result.get("counts")

                if counts:
                    lines.append("- Measurement counts:")

                    for state, count in counts.items():
                        lines.append(f"  - |{state}>: {count}")

                probabilities = simulation_result.get("probabilities")

                if probabilities:
                    lines.append("- Probabilities:")

                    for state, probability in probabilities.items():
                        lines.append(
                            f"  - |{state}>: {float(probability) * 100:.2f}%"
                        )

        return "\n".join(lines)

    # -----------------------------------------------------------------------
    # Optional OpenAI support
    # -----------------------------------------------------------------------

    def _ask_openai(
        self,
        question: str,
        context: Optional[Dict[str, Any]] = None,
    ) -> Optional[str]:
        """
        Optional OpenAI fallback.

        If OpenAI is not configured or unavailable, return None so that
        the local Q-Loop tutor can continue working.
        """

        try:
            import os

            api_key = os.getenv("OPENAI_API_KEY")

            if not api_key:
                return None

            from openai import OpenAI

            client = OpenAI(api_key=api_key)

            system_prompt = """
You are the Q-Loop AI Tutor.

Q-Loop is an interactive platform for learning quantum algorithms.

Explain concepts clearly for students.

Rules:
- Prefer beginner-friendly explanations.
- Explain quantum algorithms rather than only quantum computing hardware.
- Use the learner's circuit and simulation result when supplied.
- Never invent simulation results.
- If actual simulator results are supplied, use those values.
- Explain gates step by step.
"""

            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": system_prompt,
                    },
                    {
                        "role": "user",
                        "content": (
                            f"Question:\n{question}\n\n"
                            f"Q-Loop context:\n"
                            f"{self._context_text(context)}"
                        ),
                    },
                ],
                temperature=0.2,
            )

            return response.choices[0].message.content

        except Exception:
            return None

    # -----------------------------------------------------------------------
    # Decide whether the agent should use a tool
    # -----------------------------------------------------------------------

    def _run_agent_if_needed(
        self,
        question: str,
        context: Optional[Dict[str, Any]] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Ask QLoopAgent whether a tool is required.

        Currently the approved tool is simulate_circuit.
        """

        try:
            analysis = agent.analyze_request(
                question,
                context,
            )

            if not analysis:
                return None

            if analysis.get("action") != "tool_required":
                return None

            tool_name = analysis.get("tool")

            if tool_name != "simulate_circuit":
                return None

            circuit = None

            if context:
                circuit = context.get("circuit")

            if not circuit:
                return None

            return agent.run_tool(
                tool_name,
                {
                    "circuit": circuit,
                },
            )

        except Exception:
            return None

    # -----------------------------------------------------------------------
    # Circuit simulation explanation
    # -----------------------------------------------------------------------

    def _build_simulation_explanation(
        self,
        simulation_result: Dict[str, Any],
        context: Optional[Dict[str, Any]] = None,
    ) -> str:
        """
        Build an explanation from the ACTUAL Q-Loop simulation result.

        This function explains:
        1. Which backend was used.
        2. How many shots were executed.
        3. Circuit depth and gate count.
        4. The actual gates in the circuit.
        5. The actual measurement counts.
        6. The actual probabilities.
        7. Bell-state behavior when the circuit matches H + CNOT.
        """

        if not simulation_result:
            return (
                "I could not obtain a simulation result from the "
                "Q-Loop simulator."
            )

        status = simulation_result.get("status", "unknown")

        if status != "success":
            error = simulation_result.get("error")

            if error:
                return (
                    "The Q-Loop simulator could not complete the simulation.\n\n"
                    f"Error: {error}"
                )

            return (
                "The Q-Loop simulator could not complete the simulation."
            )

        lines = []

        # -------------------------------------------------------------------
        # Basic simulation information
        # -------------------------------------------------------------------

        framework = simulation_result.get(
            "framework",
            "Q-Loop simulator",
        )

        shots = simulation_result.get("shots")

        circuit_depth = simulation_result.get("circuit_depth")

        gate_count = simulation_result.get("gate_count")

        lines.append(
            "I ran the circuit using the Q-Loop simulator."
        )

        lines.append(f"Backend: {framework}")

        if shots is not None:
            lines.append(f"Shots: {shots}")

        if circuit_depth is not None:
            lines.append(
                f"Circuit depth: {circuit_depth}"
            )

        if gate_count is not None:
            lines.append(
                f"Gate count: {gate_count}"
            )

        # -------------------------------------------------------------------
        # Get the circuit that was actually simulated
        # -------------------------------------------------------------------

        circuit = simulation_result.get("circuit")

        if not circuit and context:
            circuit = context.get("circuit")

        operations = []

        if isinstance(circuit, dict):
            operations = circuit.get("operations", []) or []

        if not operations:
            operations = simulation_result.get(
                "operations",
                [],
            ) or []

        # -------------------------------------------------------------------
        # Explain the circuit
        # -------------------------------------------------------------------

        if operations:
            lines.append("")
            lines.append("Circuit explanation:")

            gate_names = []

            for index, operation in enumerate(
                operations,
                start=1,
            ):
                if not isinstance(operation, dict):
                    continue

                gate = str(
                    operation.get("gate", "")
                ).upper()

                target = operation.get("target")

                control = operation.get("control")

                control2 = operation.get("control2")

                parameter = operation.get("parameter")

                gate_names.append(gate)

                if gate == "H":
                    if target is not None:
                        lines.append(
                            f"{index}. Hadamard gate on q{target}: "
                            "creates or changes superposition."
                        )
                    else:
                        lines.append(
                            f"{index}. Hadamard gate: "
                            "creates or changes superposition."
                        )

                elif gate in ("CX", "CNOT"):
                    if (
                        control is not None
                        and target is not None
                    ):
                        lines.append(
                            f"{index}. CNOT gate: q{control} "
                            f"is the control and q{target} "
                            "is the target. The target flips "
                            "when the control is |1>."
                        )
                    else:
                        lines.append(
                            f"{index}. CNOT gate: "
                            "the control qubit determines "
                            "whether the target qubit flips."
                        )

                elif gate == "X":
                    lines.append(
                        f"{index}. X gate on q{target}: "
                        "flips the computational-basis state "
                        "between |0> and |1>."
                    )

                elif gate == "Y":
                    lines.append(
                        f"{index}. Y gate on q{target}: "
                        "applies a quantum bit-flip with "
                        "a phase change."
                    )

                elif gate == "Z":
                    lines.append(
                        f"{index}. Z gate on q{target}: "
                        "changes the phase of the |1> component."
                    )

                elif gate == "S":
                    lines.append(
                        f"{index}. S gate on q{target}: "
                        "applies a phase rotation."
                    )

                elif gate == "T":
                    lines.append(
                        f"{index}. T gate on q{target}: "
                        "applies a smaller phase rotation."
                    )

                elif gate in ("SDG", "TDG"):
                    lines.append(
                        f"{index}. {gate} gate on q{target}: "
                        "applies the corresponding inverse "
                        "phase operation."
                    )

                elif gate == "SWAP":
                    lines.append(
                        f"{index}. SWAP gate: "
                        "exchanges the quantum states "
                        "of the configured qubits."
                    )

                elif gate in ("M", "MEASURE"):
                    lines.append(
                        f"{index}. Measurement on q{target}: "
                        "converts the quantum state into "
                        "a classical measurement result."
                    )

                elif gate in ("RX", "RY", "RZ"):
                    if parameter is not None:
                        lines.append(
                            f"{index}. {gate} rotation on q{target} "
                            f"with parameter {parameter}."
                        )
                    else:
                        lines.append(
                            f"{index}. {gate} rotation on q{target}."
                        )

                elif gate in ("P", "U"):
                    if parameter is not None:
                        lines.append(
                            f"{index}. {gate} gate on q{target} "
                            f"with parameter {parameter}."
                        )
                    else:
                        lines.append(
                            f"{index}. {gate} gate on q{target}."
                        )

                elif gate in ("TOFFOLI", "CCX"):
                    lines.append(
                        f"{index}. {gate} gate: "
                        "uses two control qubits and "
                        "one target qubit."
                    )

                elif gate:
                    lines.append(
                        f"{index}. {gate} gate "
                        f"on q{target}."
                    )

            # ---------------------------------------------------------------
            # Bell-state recognition
            # ---------------------------------------------------------------

            normalized_gates = [
                gate for gate in gate_names
                if gate
            ]

            if (
                len(normalized_gates) >= 2
                and normalized_gates[0] == "H"
                and normalized_gates[1] in ("CX", "CNOT")
            ):
                lines.append("")
                lines.append(
                    "This circuit has the structure of a "
                    "Bell-state circuit."
                )

                lines.append(
                    "The Hadamard gate first creates "
                    "superposition on the first qubit."
                )

                lines.append(
                    "The CNOT then correlates the two qubits, "
                    "creating entanglement."
                )

                lines.append(
                    "Ideally, measuring this state produces "
                    "correlated outcomes such as |00> and |11>."
                )

        # -------------------------------------------------------------------
        # Actual measurement results
        # -------------------------------------------------------------------

        counts = simulation_result.get("counts")

        if counts:
            lines.append("")
            lines.append("Actual measurement results:")

            total_counts = sum(
                int(value)
                for value in counts.values()
            )

            for state, count in counts.items():

                count_value = int(count)

                if total_counts > 0:
                    percentage = (
                        count_value
                        / total_counts
                        * 100
                    )
                else:
                    percentage = 0

                lines.append(
                    f"- |{state}>: "
                    f"{count_value} shots "
                    f"({percentage:.2f}%)"
                )

            lines.append("")
            lines.append(
                "These measurement values come from the "
                "actual Q-Loop simulator execution."
            )

        # -------------------------------------------------------------------
        # Probability results
        # -------------------------------------------------------------------

        probabilities = simulation_result.get(
            "probabilities"
        )

        if probabilities:
            lines.append("")
            lines.append("Calculated probabilities:")

            for state, probability in probabilities.items():

                try:
                    percentage = (
                        float(probability) * 100
                    )
                except (
                    TypeError,
                    ValueError,
                ):
                    continue

                lines.append(
                    f"- |{state}>: "
                    f"{percentage:.2f}%"
                )

        return "\n".join(lines)

    # -----------------------------------------------------------------------
    # Normal fallback explanation
    # -----------------------------------------------------------------------

    def _fallback_explanation(
        self,
        question: str,
        context: Optional[Dict[str, Any]] = None,
    ) -> str:
        """
        Answer common quantum-algorithm questions locally.
        """

        question_lower = question.lower()

        # ---------------------------------------------------------------
        # Direct knowledge-base matching
        # ---------------------------------------------------------------

        for topic, explanation in self.knowledge_base.items():

            if topic in question_lower:
                return explanation

        # ---------------------------------------------------------------
        # More specific keyword handling
        # ---------------------------------------------------------------

        if "what is a quantum algorithm" in question_lower:
            return (
                "A quantum algorithm is a step-by-step procedure "
                "designed to solve a problem using quantum operations "
                "such as superposition, interference, entanglement, "
                "quantum gates, and measurement."
            )

        if "quantum algorithm" in question_lower:
            return (
                "A quantum algorithm is a sequence of quantum "
                "operations designed to solve a computational problem. "
                "It can use concepts such as superposition, "
                "entanglement, interference, and measurement."
            )

        if "hadamard" in question_lower:
            return self.knowledge_base["hadamard"]

        if "cnot" in question_lower:
            return self.knowledge_base["cnot"]

        if "bell state" in question_lower:
            return self.knowledge_base["bell"]

        if "entangle" in question_lower:
            return self.knowledge_base["entanglement"]

        if "measure" in question_lower:
            return self.knowledge_base["measurement"]

        if "superposition" in question_lower:
            return self.knowledge_base["superposition"]

        if "qubit" in question_lower:
            return self.knowledge_base["qubit"]

        # ---------------------------------------------------------------
        # Circuit-aware generic response
        # ---------------------------------------------------------------

        if context and context.get("circuit"):
            circuit = context.get("circuit")

            if isinstance(circuit, dict):
                operations = circuit.get(
                    "operations",
                    [],
                )

                if operations:
                    return (
                        "I can analyze your current Q-Loop circuit. "
                        "Ask me to simulate it, explain the gates, "
                        "or explain why the measurement results occur."
                    )

        return (
            "I can help you learn quantum algorithms, quantum gates, "
            "circuits, superposition, entanglement, measurement, "
            "and simulation results. "
            "Try asking a specific question such as "
            "'What does the Hadamard gate do?'"
        )

    # -----------------------------------------------------------------------
    # Main explain function
    # -----------------------------------------------------------------------

    def explain(
        self,
        question: str,
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Main tutor entry point.

        Returns:
            response
            suggestions
            code_example
            confidence
            sources
        """

        question = (question or "").strip()

        if not question:
            return {
                "response": (
                    "Please ask me a quantum-algorithm question "
                    "or ask me to analyze your current circuit."
                ),
                "suggestions": [
                    "Explain this circuit",
                    "What is superposition?",
                    "What does the Hadamard gate do?",
                ],
                "code_example": None,
                "confidence": "high",
                "sources": ["Q-Loop AI Tutor"],
            }

        # -------------------------------------------------------------------
        # 1. Ask QLoopAgent whether simulation is required
        # -------------------------------------------------------------------

        simulation_result = self._run_agent_if_needed(
            question,
            context,
        )

        if simulation_result:
            response = self._build_simulation_explanation(
                simulation_result,
                context,
            )

            return {
                "response": response,
                "suggestions": [
                    "Explain the gates step by step",
                    "Why are these measurement results obtained?",
                    "Explain this circuit like a beginner",
                ],
                "code_example": None,
                "confidence": "high",
                "sources": [
                    "Q-Loop Simulator",
                    "QLoopAgent",
                ],
            }

        # -------------------------------------------------------------------
        # 2. Optional OpenAI answer
        # -------------------------------------------------------------------

        openai_response = self._ask_openai(
            question,
            context,
        )

        if openai_response:
            return {
                "response": openai_response,
                "suggestions": [
                    "Explain it more simply",
                    "Give me an example",
                    "Show the circuit idea",
                ],
                "code_example": None,
                "confidence": "medium",
                "sources": [
                    "OpenAI",
                    "Q-Loop AI Tutor",
                ],
            }

        # -------------------------------------------------------------------
        # 3. Local Q-Loop fallback
        # -------------------------------------------------------------------

        response = self._fallback_explanation(
            question,
            context,
        )

        return {
            "response": response,
            "suggestions": [
                "Explain this with an example",
                "Show me a quantum circuit",
                "Explain it step by step",
            ],
            "code_example": None,
            "confidence": "medium",
            "sources": [
                "Q-Loop AI Tutor",
            ],
        }


# ---------------------------------------------------------------------------
# Global tutor instance
# ---------------------------------------------------------------------------

tutor = AITutor()