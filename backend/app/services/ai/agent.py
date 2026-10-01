from typing import Any, Dict, Optional

from app.services.ai.tools.simulator import simulate_circuit


class QLoopAgent:
    """
    Controlled AI-agent layer for Q-Loop.

    The agent can use approved Q-Loop tools instead of having
    unrestricted access to the computer or operating system.

    Current available tool:
        - simulate_circuit
    """

    def __init__(self) -> None:
        self.tools = {
            simulate_circuit.name: simulate_circuit,
        }

    def list_tools(self) -> list[Dict[str, str]]:
        """Return the tools available to the Q-Loop agent."""
        return [
            {
                "name": tool.name,
                "description": tool.description,
            }
            for tool in self.tools.values()
        ]

    def run_tool(
        self,
        tool_name: str,
        arguments: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Execute one approved Q-Loop tool.

        No arbitrary Python, shell, file, browser, or system
        operations are allowed through this interface.
        """

        tool = self.tools.get(tool_name)

        if tool is None:
            return {
                "status": "error",
                "error": (
                    f"Unknown tool '{tool_name}'. "
                    f"Available tools: {list(self.tools.keys())}"
                ),
            }

        try:
            if tool_name == "simulate_circuit":
                circuit = arguments.get("circuit")

                if circuit is None:
                    return {
                        "status": "error",
                        "error": "Missing 'circuit' argument.",
                    }

                return tool.run(circuit)

            return {
                "status": "error",
                "error": f"Tool '{tool_name}' is not implemented.",
            }

        except Exception as exc:
            return {
                "status": "error",
                "error": f"Tool execution failed: {exc}",
            }

    def should_simulate(
        self,
        question: str,
        context: Optional[Dict[str, Any]] = None,
    ) -> bool:
        """
        Basic deterministic routing decision.

        This is intentionally simple for the first version.
        A future open model can make the routing decision.
        """

        question_lower = question.lower()
        context = context or {}

        # If the frontend already supplied a circuit, simulation
        # may be useful for circuit-related questions.
        if context.get("circuit"):
            simulation_words = (
                "simulate",
                "run",
                "result",
                "output",
                "measurement",
                "probability",
                "probabilities",
                "counts",
                "statevector",
                "what happens",
                "what will happen",
            )

            if any(
                word in question_lower
                for word in simulation_words
            ):
                return True

        # Explicit simulation requests.
        explicit_words = (
            "simulate",
            "run this circuit",
            "run the circuit",
            "measurement result",
            "simulation result",
            "probability",
            "probabilities",
            "counts",
            "statevector",
        )

        return any(
            word in question_lower
            for word in explicit_words
        )

    def analyze_request(
        self,
        question: str,
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Analyze a learner request and determine whether
        a Q-Loop tool is required.

        The actual natural-language reasoning will later
        be handled by the open model.
        """

        context = context or {}

        if self.should_simulate(question, context):
            return {
                "type": "tool_required",
                "tool": "simulate_circuit",
                "reason": (
                    "The request appears to require "
                    "quantum circuit simulation."
                ),
            }

        return {
            "type": "direct_answer",
            "reason": "No Q-Loop tool is currently required.",
        }


agent = QLoopAgent()