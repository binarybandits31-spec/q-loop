import { useState, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import {
  Terminal,
  Play,
  Zap,
  BarChart3,
  Copy,
  Check,
  Code2,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  simulateCircuit,
  formatStateVector,
  type SimulationResult,
  type CircuitGate,
} from '@/lib/quantum/simulator';
import { GateType } from '@/lib/quantum/gates';
import { executeCircuit, type ExecuteRequest } from '@/lib/api';

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface ParseSuccess {
  name: string;
  numQubits: number;
  gates: CircuitGate[];
}

interface ParseFailure {
  error: string;
  line: number;
}

type ParseResult = ParseSuccess | ParseFailure;

/* ------------------------------------------------------------------ */
/*  Example circuits                                                  */
/* ------------------------------------------------------------------ */

const EXAMPLES: Record<string, string> = {
  'Bell State': `// Bell State — maximal entanglement of 2 qubits
circuit Bell {
  qubits: 2
  H q[0]        // put q0 into superposition
  CX q[0], q[1] // entangle: flip q1 when q0 is |1>
  measure q[0]
  measure q[1]
}`,

  Superposition: `// Uniform superposition over 3 qubits
circuit Superposition {
  qubits: 3
  H q[0]
  H q[1]
  H q[2]
  measure q[0]
  measure q[1]
  measure q[2]
}`,

  "Grover's": `// Grover's algorithm (2-qubit, single iteration)
// Finds the |11> marked state
circuit Grover {
  qubits: 2
  H q[0]
  H q[1]
  CZ q[0], q[1]   // oracle marks |11>
  H q[0]
  H q[1]
  X q[0]
  X q[1]
  CZ q[0], q[1]   // diffusion operator
  X q[0]
  X q[1]
  H q[0]
  H q[1]
  measure q[0]
  measure q[1]
}`,

  'Quantum Interference': `// Quantum interference via Hadamard + phase + Hadamard
circuit Interference {
  qubits: 1
  H q[0]
  Rz(3.14) q[0]   // rotate around Z by ~pi
  H q[0]
  measure q[0]
}`,
};

const SHOT_OPTIONS = [256, 1024, 4096, 16384];

/* ------------------------------------------------------------------ */
/*  DSL Parser                                                        */
/* ------------------------------------------------------------------ */

// Map of DSL gate names -> GateType.
// Controlled gates are recognized by their leading C and handled specially below.
const GATE_ALIASES: Record<string, GateType> = {
  H: 'H',
  X: 'X',
  Y: 'Y',
  Z: 'Z',
  S: 'S',
  T: 'T',
  SDG: 'Sdg',
  TDG: 'Tdg',
  RX: 'RX',
  RY: 'RY',
  RZ: 'RZ',
  P: 'P',
  PHASE: 'P',
  CX: 'CX',
  CNOT: 'CX',
  CY: 'CY',
  CZ: 'CZ',
  CH: 'CH',
  SWAP: 'SWAP',
  TOFFOLI: 'TOFFOLI',
  CCNOT: 'TOFFOLI',
  CCX: 'TOFFOLI',
  MEASURE: 'M',
  M: 'M',
};

const PARAM_GATES = new Set<GateType>(['RX', 'RY', 'RZ', 'P']);

function parseCircuit(code: string): ParseResult {
  const lines = code.split('\n');
  let name = 'circuit';
  let numQubits = 0;
  const gates: CircuitGate[] = [];
  let inCircuit = false;
  let foundBrace = false;

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;

    // Strip comments
    const commentIdx = lines[i].indexOf('//');
    const line = (
      commentIdx >= 0 ? lines[i].slice(0, commentIdx) : lines[i]
    ).trim();

    if (!line) continue;

    // Opening: circuit Name {
    if (!inCircuit) {
      const m = line.match(/^circuit\s+(\w+)\s*\{?$/i);

      if (!m) {
        return {
          error: `Expected "circuit Name {" at line ${lineNum}`,
          line: lineNum,
        };
      }

      name = m[1];
      inCircuit = true;

      // Allow "circuit Name {" on one line or "circuit Name" + "{" on next
      if (line.endsWith('{')) {
        foundBrace = true;
      }

      continue;
    }

    if (!foundBrace) {
      if (line === '{') {
        foundBrace = true;
        continue;
      }

      return {
        error: `Expected "{" after circuit declaration at line ${lineNum}`,
        line: lineNum,
      };
    }

    // Closing brace
    if (line === '}') {
      if (numQubits === 0) {
        return {
          error: 'No "qubits:" declaration found',
          line: lineNum,
        };
      }

      return {
        name,
        numQubits,
        gates,
      };
    }

    // qubits: N
    const qm = line.match(/^qubits\s*:\s*(\d+)\s*$/i);

    if (qm) {
      numQubits = parseInt(qm[1], 10);

      if (numQubits < 1) {
        return {
          error: `qubits must be >= 1 at line ${lineNum}`,
          line: lineNum,
        };
      }

      if (numQubits > 8) {
        return {
          error: `qubits must be <= 8 at line ${lineNum}`,
          line: lineNum,
        };
      }

      continue;
    }

    if (numQubits === 0) {
      return {
        error: `Gate before "qubits:" declaration at line ${lineNum}`,
        line: lineNum,
      };
    }

    // Gate line: NAME(args)? q[a], q[b], q[c]
    const gateMatch = line.match(
      /^([A-Za-z]+)\s*(?:\(\s*([^)]*)\s*\))?\s*(.*)$/
    );

    if (!gateMatch) {
      return {
        error: `Invalid syntax at line ${lineNum}: "${line}"`,
        line: lineNum,
      };
    }

    const rawName = gateMatch[1].toUpperCase();
    const paramStr = gateMatch[2];
    const operandsStr = (gateMatch[3] || '').trim();

    const gateType = GATE_ALIASES[rawName];

    if (!gateType) {
      return {
        error: `Unknown gate "${rawName}" at line ${lineNum}`,
        line: lineNum,
      };
    }

    // Parse operands: q[0], q[1], ...
    const operands = operandsStr
      ? operandsStr
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    const qubitIndices: number[] = [];

    for (const op of operands) {
      const qm2 = op.match(/^q\[(\d+)\]$/i);

      if (!qm2) {
        return {
          error: `Invalid qubit reference "${op}" at line ${lineNum}`,
          line: lineNum,
        };
      }

      const idx = parseInt(qm2[1], 10);

      if (idx < 0 || idx >= numQubits) {
        return {
          error: `Qubit index ${idx} out of range (0..${
            numQubits - 1
          }) at line ${lineNum}`,
          line: lineNum,
        };
      }

      qubitIndices.push(idx);
    }

    // Parameter handling
    let parameter: number | undefined;

    if (paramStr !== undefined && paramStr !== '') {
      const val = parseFloat(paramStr);

      if (Number.isNaN(val)) {
        return {
          error: `Invalid parameter "${paramStr}" at line ${lineNum}`,
          line: lineNum,
        };
      }

      parameter = val;
    }

    const id = `${gateType}-${i}-${Math.random()
      .toString(36)
      .slice(2, 7)}`;

    // Build CircuitGate according to gate type
    if (gateType === 'M') {
      if (qubitIndices.length !== 1) {
        return {
          error: `measure expects 1 qubit at line ${lineNum}`,
          line: lineNum,
        };
      }

      gates.push({
        id,
        type: 'M',
        qubit: qubitIndices[0],
      });
    } else if (gateType === 'SWAP') {
      if (qubitIndices.length !== 2) {
        return {
          error: `SWAP expects 2 qubits at line ${lineNum}`,
          line: lineNum,
        };
      }

      gates.push({
        id,
        type: 'SWAP',
        qubit: qubitIndices[0],
        targetQubit: qubitIndices[1],
      });
    } else if (gateType === 'TOFFOLI') {
      if (qubitIndices.length !== 3) {
        return {
          error: `Toffoli expects 3 qubits at line ${lineNum}`,
          line: lineNum,
        };
      }

      gates.push({
        id,
        type: 'TOFFOLI',
        qubit: qubitIndices[2],
        controlQubit: qubitIndices[0],
        control2Qubit: qubitIndices[1],
        targetQubit: qubitIndices[2],
      });
    } else if (
      gateType === 'CX' ||
      gateType === 'CY' ||
      gateType === 'CZ' ||
      gateType === 'CH'
    ) {
      if (qubitIndices.length !== 2) {
        return {
          error: `${rawName} expects 2 qubits at line ${lineNum}`,
          line: lineNum,
        };
      }

      gates.push({
        id,
        type: gateType,
        qubit: qubitIndices[1],
        controlQubit: qubitIndices[0],
        targetQubit: qubitIndices[1],
      });
    } else {
      // Single-qubit gate
      if (qubitIndices.length !== 1) {
        return {
          error: `${rawName} expects 1 qubit at line ${lineNum}`,
          line: lineNum,
        };
      }

      if (
        PARAM_GATES.has(gateType) &&
        parameter === undefined
      ) {
        return {
          error: `${rawName} requires a parameter, e.g. ${rawName}(3.14) at line ${lineNum}`,
          line: lineNum,
        };
      }

      gates.push({
        id,
        type: gateType,
        qubit: qubitIndices[0],
        parameter,
      });
    }
  }

  if (!foundBrace) {
    return {
      error: 'Missing opening brace "{"',
      line: lines.length,
    };
  }

  return {
    error: 'Missing closing brace "}"',
    line: lines.length,
  };
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export default function SimulatorPage() {
  const [code, setCode] = useState<string>(EXAMPLES['Bell State']);
  const [shots, setShots] = useState<number>(1024);
  const [result, setResult] = useState<SimulationResult | null>(null);

  const [framework, setFramework] = useState<
    'qiskit_aer' | 'pennylane' | 'cirq' | 'qbraid'
  >('qiskit_aer');

  const [parseError, setParseError] = useState<string | null>(null);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [circuitName, setCircuitName] = useState<string>('Bell');
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);

  const [stateVectorSource, setStateVectorSource] = useState<
    'backend' | 'local' | 'unavailable' | null
  >(null);

  const handleRun = useCallback(async () => {
    setIsRunning(true);
    setParseError(null);
    setBackendError(null);
    setStateVectorSource(null);

    try {
      const parsed = parseCircuit(code);

      if ('error' in parsed) {
        setParseError(`Line ${parsed.line}: ${parsed.error}`);
        setResult(null);
        return;
      }

      setCircuitName(parsed.name);

      // Build operations for the backend
      const operations = parsed.gates.map((g) => {
        const op: ExecuteRequest['operations'][number] = {
          gate: g.type,
          target: g.qubit,
        };

        if (g.controlQubit !== undefined) {
          op.control = g.controlQubit;
        }

        if (g.control2Qubit !== undefined) {
          op.control2 = g.control2Qubit;
        }

        if (g.targetQubit !== undefined) {
          op.target = g.targetQubit;
        }

        if (g.parameter !== undefined) {
          op.parameter = g.parameter;
        }

        return op;
      });

      try {
        const res = await executeCircuit({
          qubits: parsed.numQubits,
          classical_bits: parsed.numQubits,
          operations,
          shots,
          framework,
        });

        if (res.status !== 'success' || res.error) {
          setBackendError(res.error || 'Execution failed');

          // Fall back to local simulation
          const sim = simulateCircuit(
            parsed.gates,
            parsed.numQubits,
            shots
          );

          setStateVectorSource('local');
          setResult(sim);
        } else {
          // Map backend response to frontend SimulationResult shape
          const local = simulateCircuit(
            parsed.gates,
            parsed.numQubits,
            0
          );

          const backendStateVector = res.statevector
            ? {
                amplitudes: res.statevector.map(([re, im]) => ({
                  re,
                  im,
                })),
                numQubits: parsed.numQubits,
              }
            : null;

          /*
           * qBraid currently returns measurement counts but no
           * statevector.
           *
           * Never present the locally calculated statevector as if
           * it came from qBraid.
           */
          if (backendStateVector !== null) {
            setStateVectorSource('backend');
          } else if (framework === 'qbraid') {
            setStateVectorSource('unavailable');
          } else {
            setStateVectorSource('local');
          }

          const histogram = Object.entries(res.counts)
            .map(([state, count]) => ({
              state,
              count,
              probability:
                res.probabilities[state] ?? count / res.shots,
            }))
            .sort((a, b) => b.count - a.count);

          setResult({
            /*
             * qBraid has no statevector in its current result API,
             * so do not silently substitute the local statevector
             * for a qBraid result.
             */
            stateVector:
              backendStateVector ?? local.stateVector,

            probabilities: local.probabilities,

            measurements: [
              {
                outcome: '',
                probability: 1,
                counts: res.counts,
              },
            ],

            measuredQubits: new Set<number>(),

            histogram,
          });
        }
      } catch (err) {
        setBackendError(
          err instanceof Error
            ? err.message
            : 'Failed to connect to backend'
        );

        // Fall back to local simulation
        const sim = simulateCircuit(
          parsed.gates,
          parsed.numQubits,
          shots
        );

        setStateVectorSource('local');
        setResult(sim);
      }
    } catch (err) {
      setParseError(
        err instanceof Error ? err.message : 'Unknown error'
      );
      setResult(null);
    } finally {
      setIsRunning(false);
    }
  }, [code, shots, framework]);

  const handleExample = useCallback((key: string) => {
    setCode(EXAMPLES[key]);
    setParseError(null);
    setResult(null);
    setStateVectorSource(null);
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }, [code]);

  const formattedState = result
    ? formatStateVector(result.stateVector)
    : [];

  const maxProb = Math.max(
    ...formattedState.map((s) => s.probability),
    0.0001
  );

  const maxCount =
    result && result.histogram.length > 0
      ? Math.max(...result.histogram.map((h) => h.count))
      : 1;

  return (
    <div className="min-h-screen bg-[#05070d] text-cyan-50">
      {/* ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute top-1/3 -right-40 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-teal-500/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* header */}
        <header className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-cyan-400">
              <Code2 className="h-5 w-5" />
              <span className="text-xs font-mono uppercase tracking-[0.2em]">
                Q-Loop / Simulator
              </span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Quantum Circuit{' '}
              <span className="text-cyan-400">Code Simulator</span>
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-cyan-100/60">
              Write quantum circuits in a simple DSL, run them on the
              selected quantum backend, and inspect the resulting state
              information and measurement distribution.
            </p>
          </div>
        </header>

        {/* example buttons */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="mr-1 flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-cyan-300/70">
            <Zap className="h-3.5 w-3.5" /> Examples
          </span>

          {Object.keys(EXAMPLES).map((key) => (
            <Button
              key={key}
              variant="outline"
              size="sm"
              onClick={() => handleExample(key)}
              className={cn(
                'border-cyan-500/30 bg-cyan-500/5 font-mono text-xs text-cyan-100/80 hover:border-cyan-400/60 hover:bg-cyan-500/10 hover:text-cyan-50',
                code === EXAMPLES[key] &&
                  'border-cyan-400/60 bg-cyan-500/15 text-cyan-50'
              )}
            >
              {key}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* ---------- editor panel ---------- */}
          <Card className="overflow-hidden border-cyan-500/20 bg-slate-950/40 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between border-b border-cyan-500/10 bg-slate-950/60 py-3">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-cyan-400" />

                <CardTitle className="text-sm font-mono uppercase tracking-wider text-cyan-100">
                  circuit.qc
                </CardTitle>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="h-8 gap-1.5 px-2 text-xs text-cyan-100/70 hover:bg-cyan-500/10 hover:text-cyan-50"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}

                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="h-[420px]">
                <Editor
                  height="100%"
                  defaultLanguage="plaintext"
                  theme="vs-dark"
                  value={code}
                  onChange={(val) => setCode(val ?? '')}
                  options={{
                    fontFamily:
                      'JetBrains Mono, ui-monospace, monospace',
                    fontSize: 13,
                    minimap: { enabled: false },
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    smoothScrolling: true,
                    padding: {
                      top: 12,
                      bottom: 12,
                    },
                    renderLineHighlight: 'all',
                    cursorBlinking: 'smooth',
                    fontLigatures: true,
                    tabSize: 2,
                    automaticLayout: true,
                  }}
                  loading={
                    <div className="flex h-full items-center justify-center text-xs text-cyan-300/50">
                      Loading editor…
                    </div>
                  }
                />
              </div>

              {/* controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-cyan-500/10 bg-slate-950/60 px-4 py-3">
                <div className="flex flex-wrap items-center gap-4">
                  {/* quantum backend/framework selector */}
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="quantum-framework"
                      className="text-xs font-mono uppercase tracking-wider text-cyan-300/70"
                    >
                      Backend
                    </label>

                    <select
                      id="quantum-framework"
                      value={framework}
                      onChange={(e) =>
                        setFramework(
                          e.target.value as
                            | 'qiskit_aer'
                            | 'pennylane'
                            | 'cirq'
                            | 'qbraid'
                        )
                      }
                      disabled={isRunning}
                      className="h-8 rounded-md border border-cyan-500/20 bg-slate-900 px-2.5 font-mono text-xs text-cyan-50 outline-none transition-colors hover:border-cyan-400/50 focus:border-cyan-400/60 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="qiskit_aer">
                        Qiskit Aer
                      </option>

                      <option value="pennylane">
                        PennyLane
                      </option>

                      <option value="cirq">Cirq</option>

                      <option value="qbraid">qBraid</option>
                    </select>
                  </div>

                  {/* shots selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono uppercase tracking-wider text-cyan-300/70">
                      Shots
                    </span>

                    <div className="flex overflow-hidden rounded-md border border-cyan-500/20">
                      {SHOT_OPTIONS.map((s) => (
                        <button
                          key={s}
                          onClick={() => setShots(s)}
                          disabled={isRunning}
                          className={cn(
                            'px-3 py-1.5 font-mono text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                            shots === s
                              ? 'bg-cyan-500/20 text-cyan-50'
                              : 'bg-transparent text-cyan-100/60 hover:bg-cyan-500/10 hover:text-cyan-100'
                          )}
                        >
                          {s.toLocaleString()}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleRun}
                  disabled={isRunning}
                  className="gap-2 border border-cyan-400/40 bg-cyan-500/20 font-mono text-sm text-cyan-50 hover:bg-cyan-500/30"
                >
                  {isRunning ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}

                  {isRunning ? 'Running…' : 'Run Circuit'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* ---------- results panel ---------- */}
          <div className="flex flex-col gap-6">
            {/* parse error */}
            {parseError && (
              <Card className="border-rose-500/40 bg-rose-950/40 backdrop-blur-xl">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-500/20 text-rose-300">
                      !
                    </div>

                    <div>
                      <p className="text-sm font-mono font-semibold text-rose-300">
                        Parse Error
                      </p>

                      <p className="mt-1 font-mono text-xs text-rose-200/80">
                        {parseError}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* backend error */}
            {backendError && (
              <Card className="border-amber-500/40 bg-amber-950/40 backdrop-blur-xl">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />

                    <div>
                      <p className="text-sm font-mono font-semibold text-amber-300">
                        Backend Error
                      </p>

                      <p className="mt-1 font-mono text-xs text-amber-200/80">
                        {backendError}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Showing local simulation results as fallback.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* state vector */}
            <Card className="border-cyan-500/20 bg-slate-950/40 backdrop-blur-xl">
              <CardHeader className="border-b border-cyan-500/10 py-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-cyan-400" />

                  <CardTitle className="text-sm font-mono uppercase tracking-wider text-cyan-100">
                    State Vector
                  </CardTitle>

                  {result && (
                    <div className="ml-auto flex items-center gap-2">
                      <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-cyan-300">
                        {circuitName} · {result.stateVector.numQubits}{' '}
                        qubits
                      </span>

                      {stateVectorSource === 'local' &&
                        framework !== 'qbraid' && (
                          <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-cyan-300">
                            Local visualization
                          </span>
                        )}

                      {stateVectorSource === 'unavailable' &&
                        framework === 'qbraid' && (
                          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-amber-300">
                            Not returned by qBraid
                          </span>
                        )}
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-4">
                {!result || formattedState.length === 0 ? (
                  <p className="py-8 text-center font-mono text-xs text-cyan-100/40">
                    Run a circuit to view the state vector.
                  </p>
                ) : stateVectorSource === 'unavailable' &&
                  framework === 'qbraid' ? (
                  <div className="rounded-lg border border-amber-500/20 bg-amber-950/20 px-4 py-6 text-center">
                    <p className="font-mono text-sm text-amber-300">
                      State vector unavailable from qBraid
                    </p>

                    <p className="mx-auto mt-2 max-w-xl font-mono text-xs leading-5 text-amber-100/60">
                      qBraid returned the measurement counts
                      successfully, but its current API response does
                      not include the state vector. The measurement
                      distribution below is the actual qBraid result.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="grid grid-cols-[5rem_1fr_5rem] gap-2 px-1 pb-1 text-[10px] font-mono uppercase tracking-wider text-cyan-300/50">
                      <span>Basis</span>
                      <span>Amplitude</span>
                      <span className="text-right">Prob</span>
                    </div>

                    {formattedState.map((s) => (
                      <div
                        key={s.basis}
                        className="grid grid-cols-[5rem_1fr_5rem] items-center gap-2 rounded-md border border-cyan-500/10 bg-slate-900/40 px-2 py-1.5"
                      >
                        <span className="font-mono text-xs text-cyan-200">
                          |{s.basis}⟩
                        </span>

                        <div className="flex items-center gap-2">
                          <div className="h-2 min-w-[3rem] flex-1 overflow-hidden rounded-full bg-slate-800/60">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-cyan-500/70 to-cyan-300/90"
                              style={{
                                width: `${
                                  (s.probability / maxProb) * 100
                                }%`,
                              }}
                            />
                          </div>

                          <span className="font-mono text-[11px] text-cyan-100/70">
                            {s.amplitude}
                          </span>
                        </div>

                        <span className="text-right font-mono text-[11px] text-cyan-300">
                          {(s.probability * 100).toFixed(2)}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* measurement distribution */}
            <Card className="border-cyan-500/20 bg-slate-950/40 backdrop-blur-xl">
              <CardHeader className="border-b border-cyan-500/10 py-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-cyan-400" />

                  <CardTitle className="text-sm font-mono uppercase tracking-wider text-cyan-100">
                    Measurement Distribution
                  </CardTitle>

                  {result && result.histogram.length > 0 && (
                    <span className="ml-auto rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-cyan-300">
                      {shots.toLocaleString()} shots
                    </span>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-4">
                {!result || result.histogram.length === 0 ? (
                  <p className="py-8 text-center font-mono text-xs text-cyan-100/40">
                    Run a circuit to view measurement counts.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    <div className="grid grid-cols-[5rem_1fr_5rem] gap-2 px-1 pb-1 text-[10px] font-mono uppercase tracking-wider text-cyan-300/50">
                      <span>State</span>
                      <span>Counts</span>
                      <span className="text-right">P</span>
                    </div>

                    {result.histogram.map((h) => (
                      <div
                        key={h.state}
                        className="grid grid-cols-[5rem_1fr_5rem] items-center gap-2 rounded-md border border-cyan-500/10 bg-slate-900/40 px-2 py-1.5"
                      >
                        <span className="font-mono text-xs text-cyan-200">
                          |{h.state}⟩
                        </span>

                        <div className="flex items-center gap-2">
                          <div className="h-2 min-w-[3rem] flex-1 overflow-hidden rounded-full bg-slate-800/60">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-fuchsia-500/70 to-cyan-300/90"
                              style={{
                                width: `${
                                  (h.count / maxCount) * 100
                                }%`,
                              }}
                            />
                          </div>

                          <span className="font-mono text-[11px] text-cyan-100/70">
                            {h.count}
                          </span>
                        </div>

                        <span className="text-right font-mono text-[11px] text-cyan-300">
                          {(h.probability * 100).toFixed(2)}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}