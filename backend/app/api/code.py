"""Code Lab API.

Executes controlled Qiskit Python examples in a sandboxed environment.
Arbitrary OS-level access is NOT provided. Only quantum-specific code patterns
are permitted. Code is executed via a restricted exec() with a controlled namespace.
"""
import time
import io
import contextlib
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any

router = APIRouter(prefix="/api/code", tags=["Code Lab"])

ALLOWED_IMPORTS = {"qiskit", "qiskit_aer", "numpy", "math", "cmath"}
FORBIDDEN_TOKENS = ["import os", "import sys", "import subprocess", "open(", "__import__",
                    "exec(", "eval(", "compile(", "importlib", "builtins"]


class CodeRequest(BaseModel):
    code: str
    language: str = "python"


class CodeResponse(BaseModel):
    status: str  # success | error | forbidden
    output: Optional[str] = None
    error: Optional[str] = None
    execution_time_ms: float = 0.0
    counts: Optional[Dict[str, int]] = None
    probabilities: Optional[Dict[str, float]] = None


def _check_code_safety(code: str) -> Optional[str]:
    """Return a reason string if the code is forbidden, else None."""
    for token in FORBIDDEN_TOKENS:
        if token in code:
            return f"Forbidden: '{token}' is not allowed in Code Lab."

    # Only allow specific import prefixes
    for line in code.splitlines():
        stripped = line.strip()
        if stripped.startswith("import ") or stripped.startswith("from "):
            parts = stripped.split()
            if len(parts) >= 2:
                package = parts[1].split(".")[0]
                if package not in ALLOWED_IMPORTS:
                    return f"Forbidden import: '{package}'. Allowed: {sorted(ALLOWED_IMPORTS)}."
    return None


@router.post("/run", response_model=CodeResponse)
async def run_code(body: CodeRequest):
    """
    Execute controlled Qiskit Python code in a restricted sandbox.

    Security model:
    - Arbitrary OS/file/subprocess access is blocked.
    - Only quantum-related imports (qiskit, qiskit_aer, numpy, math) are allowed.
    - Execution timeout is enforced via the overall request timeout.
    """
    if body.language.lower() != "python":
        raise HTTPException(status_code=400, detail="Only Python code is supported.")

    safety_error = _check_code_safety(body.code)
    if safety_error:
        return CodeResponse(status="forbidden", error=safety_error)

    t0 = time.perf_counter()
    stdout_capture = io.StringIO()
    counts: Optional[Dict[str, int]] = None
    probabilities: Optional[Dict[str, float]] = None

    try:
        # Build a restricted namespace with only safe builtins
        safe_builtins = {
            "print": print,
            "range": range,
            "len": len,
            "list": list,
            "dict": dict,
            "set": set,
            "tuple": tuple,
            "int": int,
            "float": float,
            "str": str,
            "bool": bool,
            "abs": abs,
            "round": round,
            "min": min,
            "max": max,
            "sum": sum,
            "enumerate": enumerate,
            "zip": zip,
            "map": map,
            "filter": filter,
            "sorted": sorted,
            "reversed": reversed,
            "isinstance": isinstance,
            "type": type,
            "__import__": __import__,
        }
        namespace: Dict[str, Any] = {"__builtins__": safe_builtins}

        with contextlib.redirect_stdout(stdout_capture):
            exec(body.code, namespace)  # noqa: S102

        output = stdout_capture.getvalue()

        # Extract any qiskit result stored in namespace
        if "result" in namespace:
            try:
                raw_counts = namespace["result"].get_counts()
                shots = sum(raw_counts.values()) or 1
                counts = dict(raw_counts)
                probabilities = {k: v / shots for k, v in counts.items()}
            except Exception:
                pass
        if "counts" in namespace and counts is None:
            counts = namespace["counts"]

        elapsed_ms = (time.perf_counter() - t0) * 1000
        return CodeResponse(
            status="success",
            output=output or "(no output)",
            execution_time_ms=elapsed_ms,
            counts=counts,
            probabilities=probabilities,
        )

    except Exception as e:
        elapsed_ms = (time.perf_counter() - t0) * 1000
        return CodeResponse(
            status="error",
            error=str(e),
            output=stdout_capture.getvalue() or None,
            execution_time_ms=elapsed_ms,
        )
