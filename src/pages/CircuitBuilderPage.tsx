import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  CircuitBoard,
  Play,
  Trash2,
  Plus,
  Minus,
  Info,
  Zap,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Download,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { GATE_INFO, type GateType } from '@/lib/quantum/gates'
import {
  simulateCircuit,
  formatStateVector,
  circuitToJson,
  type SimulationResult,
  type CircuitGate,
} from '@/lib/quantum/simulator'
import { analyzeCircuit, type AnalysisFinding } from '@/lib/quantum/analyzer'
import { executeCircuit, type ExecuteRequest } from '@/lib/api'

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface PlacedGate {
  id: string
  type: GateType
  qubit: number
  targetQubit?: number
  controlQubit?: number
  control2Qubit?: number
  parameter?: number

  // Classical conditional execution.
  // Example:
  // condition_bit: 0
  // condition_value: 1
  condition_bit?: number
  condition_value?: number

  column: number
}

type PresetName =
  | 'Bell State'
  | 'GHZ State'
  | 'Quantum Teleportation'
  | "Grover's (2-qubit)"

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const MAX_QUBITS = 5
const MIN_QUBITS = 1
const MAX_COLUMNS = 20

type GateCategory = 'single' | 'two' | 'three' | 'measure'

const CATEGORY_ORDER: GateCategory[] = ['single', 'two', 'three', 'measure']

const CATEGORY_LABEL: Record<GateCategory, string> = {
  single: 'Single-Qubit',
  two: 'Two-Qubit',
  three: 'Three-Qubit',
  measure: 'Measurement',
}

const GATES_BY_CATEGORY: Record<GateCategory, GateType[]> =
  CATEGORY_ORDER.reduce(
    (acc, cat) => {
      acc[cat] = (Object.keys(GATE_INFO) as GateType[]).filter(
        (g) => GATE_INFO[g].category === cat
      )
      return acc
    },
    {} as Record<GateCategory, GateType[]>
  )

const SEVERITY_STYLE: Record<
  AnalysisFinding['severity'],
  {
    color: string
    bg: string
    border: string
    Icon: typeof AlertTriangle
    label: string
  }
> = {
  error: {
    color: 'text-rose-300',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    Icon: AlertTriangle,
    label: 'Error',
  },
  warning: {
    color: 'text-amber-300',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    Icon: AlertTriangle,
    label: 'Warning',
  },
  info: {
    color: 'text-slate-300',
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/30',
    Icon: Info,
    label: 'Info',
  },
  optimization: {
    color: 'text-cyan-300',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    Icon: Lightbulb,
    label: 'Optimization',
  },
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const uid = () => Math.random().toString(36).slice(2, 10)

/** Convert PlacedGate[] into the column-ordered CircuitGate[] expected by the simulator. */
function toCircuitGates(placed: PlacedGate[]): CircuitGate[] {
  return [...placed]
    .sort((a, b) => a.column - b.column)
    .map((g) => ({
      id: g.id,
      type: g.type,
      qubit: g.qubit,
      targetQubit: g.targetQubit,
      controlQubit: g.controlQubit,
      control2Qubit: g.control2Qubit,
      parameter: g.parameter,

      // Preserve classical conditions.
      condition_bit: g.condition_bit,
      condition_value: g.condition_value,
    }))
}

/** How many distinct columns are currently in use? */
function usedColumns(gates: PlacedGate[]): number {
  return gates.reduce((m, g) => Math.max(m, g.column + 1), 0)
}

/** Find the next free column index. */
function nextFreeColumn(
  gates: PlacedGate[],
  qubit: number,
  from: number
): number {
  let col = from

  while (
    gates.some(
      (g) => g.column === col && occupiesQubit(g, qubit)
    )
  ) {
    col++
  }

  return col
}

function occupiesQubit(g: PlacedGate, q: number): boolean {
  return (
    g.qubit === q ||
    g.targetQubit === q ||
    g.controlQubit === q ||
    g.control2Qubit === q
  )
}

/** Does any gate already occupy this (qubit, column) cell? */
function cellOccupied(
  gates: PlacedGate[],
  qubit: number,
  column: number
): boolean {
  return gates.some(
    (g) => g.column === column && occupiesQubit(g, qubit)
  )
}

/** The PlacedGate sitting on a given (qubit, column) cell, if any. */
function gateAtCell(
  gates: PlacedGate[],
  qubit: number,
  column: number
): PlacedGate | undefined {
  return gates.find(
    (g) => g.column === column && occupiesQubit(g, qubit)
  )
}

/* ------------------------------------------------------------------ */
/* Presets                                                             */
/* ------------------------------------------------------------------ */

function makePreset(
  name: PresetName
): { numQubits: number; gates: PlacedGate[] } {
  const mk = (
    type: GateType,
    qubit: number,
    column: number,
    extra: Partial<PlacedGate> = {}
  ): PlacedGate => ({
    id: uid(),
    type,
    qubit,
    column,
    ...extra,
  })

  switch (name) {
    case 'Bell State':
      return {
        numQubits: 2,
        gates: [
          mk('H', 0, 0),
          mk('CX', 0, 1, {
            controlQubit: 0,
            targetQubit: 1,
          }),
          mk('M', 0, 2),
          mk('M', 1, 2),
        ],
      }

    case 'GHZ State':
      return {
        numQubits: 3,
        gates: [
          mk('H', 0, 0),
          mk('CX', 0, 1, {
            controlQubit: 0,
            targetQubit: 1,
          }),
          mk('CX', 1, 2, {
            controlQubit: 1,
            targetQubit: 2,
          }),
          mk('M', 0, 3),
          mk('M', 1, 3),
          mk('M', 2, 3),
        ],
      }

    case 'Quantum Teleportation':
      /*
       * Quantum Teleportation
       *
       * q0 = input state |+>
       * q1,q2 = Bell pair
       *
       * 1. Prepare |+> on q0.
       * 2. Create Bell pair between q1 and q2.
       * 3. Bell-basis interaction between q0 and q1.
       * 4. Measure q0 -> classical bit c0.
       * 5. Measure q1 -> classical bit c1.
       * 6. Apply Z(q2) only if c0 == 1.
       * 7. Apply X(q2) only if c1 == 1.
       *
       * The frontend/backend measurement mapping is:
       * first M -> c0
       * second M -> c1
       */

      return {
        numQubits: 3,
        gates: [
          // Prepare input state |+> on q0.
          mk('H', 0, 0),

          // Create Bell pair between q1 and q2.
          mk('H', 1, 0),
          mk('CX', 1, 1, {
            controlQubit: 1,
            targetQubit: 2,
          }),

          // Bell-basis operations on q0 and q1.
          mk('CX', 0, 2, {
            controlQubit: 0,
            targetQubit: 1,
          }),
          mk('H', 0, 3),

          // Measurements:
          // first measurement = c0
          // second measurement = c1
          mk('M', 0, 4),
          mk('M', 1, 4),

          // Conditional corrections on q2.
          // Z(q2) if c0 == 1.
          mk('Z', 2, 5, {
            condition_bit: 0,
            condition_value: 1,
          }),

          // X(q2) if c1 == 1.
          mk('X', 2, 6, {
            condition_bit: 1,
            condition_value: 1,
          }),
        ],
      }

    case "Grover's (2-qubit)": {
      // 2-qubit Grover: H⊗H, oracle (mark |11>), diffusion.
      return {
        numQubits: 2,
        gates: [
          mk('H', 0, 0),
          mk('H', 1, 0),

          // Oracle: mark |11⟩ via CZ
          mk('CZ', 0, 1, {
            controlQubit: 0,
            targetQubit: 1,
          }),

          // Diffusion operator
          mk('H', 0, 2),
          mk('H', 1, 2),

          mk('X', 0, 3),
          mk('X', 1, 3),

          mk('CZ', 0, 4, {
            controlQubit: 0,
            targetQubit: 1,
          }),

          mk('X', 0, 5),
          mk('X', 1, 5),

          mk('H', 0, 6),
          mk('H', 1, 6),

          mk('M', 0, 7),
          mk('M', 1, 7),
        ],
      }
    }
  }
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function CircuitBuilderPage() {
  const [numQubits, setNumQubits] = useState(2)
  const [gates, setGates] = useState<PlacedGate[]>([])
  const [selectedGate, setSelectedGate] = useState<GateType>('H')
  const [simResult, setSimResult] =
    useState<SimulationResult | null>(null)
  const [simulating, setSimulating] = useState(false)
  const [simError, setSimError] = useState<string | null>(null)

  const [pendingControl, setPendingControl] = useState<{
    qubit: number
    column: number
  } | null>(null)

  // Second pending slot used only for three-qubit Toffoli placement.
  const [pendingControl2, setPendingControl2] = useState<{
    qubit: number
    column: number
  } | null>(null)

  const [activeColumn, setActiveColumn] = useState(0)

  const findings = useMemo<AnalysisFinding[]>(
    () => analyzeCircuit(toCircuitGates(gates), numQubits),
    [gates, numQubits]
  )

  const columnCount = Math.max(
    usedColumns(gates) + 1,
    activeColumn + 1,
    8
  )

  const displayColumns = Math.min(columnCount, MAX_COLUMNS)

  /* --------------------------- handlers --------------------------- */

  const onCellClick = (qubit: number, column: number) => {
    setActiveColumn(column)

    const existing = gateAtCell(gates, qubit, column)

    if (existing) {
      setGates((gs) =>
        gs.filter((g) => g.id !== existing.id)
      )
      setPendingControl(null)
      setPendingControl2(null)
      return
    }

    const info = GATE_INFO[selectedGate]

    if (info.hasParameter) {
      setGates((gs) => [
        ...gs,
        {
          id: uid(),
          type: selectedGate,
          qubit,
          column,
          parameter: Math.PI / 2,
        },
      ])

      setPendingControl(null)
      setPendingControl2(null)
      return
    }

    if (!info.isMultiQubit) {
      setGates((gs) => [
        ...gs,
        {
          id: uid(),
          type: selectedGate,
          qubit,
          column,
        },
      ])

      setPendingControl(null)
      setPendingControl2(null)
      return
    }

    if (selectedGate === 'TOFFOLI') {
      if (!pendingControl) {
        setPendingControl({ qubit, column })
        return
      }

      if (pendingControl.qubit === qubit) {
        setPendingControl({ qubit, column })
        setPendingControl2(null)
        return
      }

      if (!pendingControl2) {
        setPendingControl2({ qubit, column })
        return
      }

      if (
        pendingControl2.qubit === qubit ||
        pendingControl.qubit === qubit
      ) {
        setPendingControl({ qubit, column })
        setPendingControl2(null)
        return
      }

      const col = nextFreeColumn(
        gates,
        qubit,
        Math.max(
          pendingControl.column,
          pendingControl2.column,
          column
        )
      )

      setGates((gs) => [
        ...gs,
        {
          id: uid(),
          type: 'TOFFOLI',
          qubit: pendingControl.qubit,
          controlQubit: pendingControl.qubit,
          control2Qubit: pendingControl2.qubit,
          targetQubit: qubit,
          column: col,
        },
      ])

      setPendingControl(null)
      setPendingControl2(null)
      return
    }

    // Two-qubit multi-qubit gates.
    if (!pendingControl) {
      setPendingControl({ qubit, column })
      return
    }

    if (pendingControl.qubit === qubit) {
      setPendingControl({ qubit, column })
      return
    }

    const col = nextFreeColumn(
      gates,
      qubit,
      Math.max(pendingControl.column, column)
    )

    if (selectedGate === 'SWAP') {
      setGates((gs) => [
        ...gs,
        {
          id: uid(),
          type: 'SWAP',
          qubit: pendingControl.qubit,
          targetQubit: qubit,
          column: col,
        },
      ])
    } else {
      setGates((gs) => [
        ...gs,
        {
          id: uid(),
          type: selectedGate,
          qubit: pendingControl.qubit,
          controlQubit: pendingControl.qubit,
          targetQubit: qubit,
          column: col,
        },
      ])
    }

    setPendingControl(null)
  }

  const handleSimulate = async () => {
    setSimulating(true)
    setSimError(null)

    const circuitGates = toCircuitGates(gates)

    // Keep measurement gates for backend execution.
    const stateVectorGates = circuitGates.filter(
      (gate) => gate.type !== 'M'
    )

    const operations = circuitGates.map((g) => {
      const op: ExecuteRequest['operations'][number] = {
        gate: g.type,
        target: g.qubit,
      }

      if (g.controlQubit !== undefined) {
        op.control = g.controlQubit
      }

      if (g.control2Qubit !== undefined) {
        op.control2 = g.control2Qubit
      }

      if (g.targetQubit !== undefined) {
        op.target = g.targetQubit
      }

      if (g.parameter !== undefined) {
        op.parameter = g.parameter
      }

      // Send classical conditional execution to the backend.
      if (g.condition_bit !== undefined) {
        op.condition_bit = g.condition_bit
      }

      if (g.condition_value !== undefined) {
        op.condition_value = g.condition_value
      }

      return op
    })

    try {
      const res = await executeCircuit({
        qubits: numQubits,
        classical_bits: numQubits,
        operations,
        shots: 1024,
      })

      if (!res.success || res.error) {
        setSimError(res.error || 'Execution failed')

        // Local fallback simulation.
        // Exclude measurement gates so the state vector
        // represents the state before measurement.
        const local = simulateCircuit(
          stateVectorGates,
          numQubits,
          1024
        )

        setSimResult(local)
      } else {
        // Convert backend measurement counts into
        // the frontend histogram format.
        const histogram = Object.entries(res.counts)
          .map(([state, count]) => ({
            state,
            count,
            probability:
              res.probabilities[state] ??
              count / res.shots,
          }))
          .sort((a, b) => b.count - a.count)

        // Calculate the pre-measurement state vector.
        // Measurement gates are intentionally excluded.
        const local = simulateCircuit(
          stateVectorGates,
          numQubits,
          0
        )

        setSimResult({
          stateVector: local.stateVector,
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
        })
      }
    } catch (err) {
      setSimError(
        err instanceof Error
          ? err.message
          : 'Failed to connect to backend'
      )

      // Local fallback when the backend connection fails.
      // Exclude measurement gates from the state-vector calculation.
      const local = simulateCircuit(
        stateVectorGates,
        numQubits,
        1024
      )

      setSimResult(local)
    } finally {
      setSimulating(false)
    }
  }

  const handleClear = () => {
    setGates([])
    setPendingControl(null)
    setPendingControl2(null)
    setSimResult(null)
    setActiveColumn(0)
  }

  const handlePreset = (name: PresetName) => {
    const { numQubits: n, gates: gs } =
      makePreset(name)

    setNumQubits(n)
    setGates(gs)
    setPendingControl(null)
    setPendingControl2(null)
    setSimResult(null)
    setActiveColumn(0)
  }

  const handleExport = () => {
    const json = circuitToJson(
      toCircuitGates(gates),
      numQubits
    )

    const blob = new Blob([json], {
      type: 'application/json',
    })

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')

    a.href = url
    a.download = 'circuit.json'
    a.click()

    URL.revokeObjectURL(url)
  }

  const adjustQubits = (delta: number) => {
    const next = Math.min(
      MAX_QUBITS,
      Math.max(MIN_QUBITS, numQubits + delta)
    )

    if (next === numQubits) return

    setNumQubits(next)

    // Drop gates that reference now-removed qubits.
    setGates((gs) =>
      gs.filter(
        (g) =>
          g.qubit < next &&
          (g.targetQubit === undefined ||
            g.targetQubit < next) &&
          (g.controlQubit === undefined ||
            g.controlQubit < next) &&
          (g.control2Qubit === undefined ||
            g.control2Qubit < next)
      )
    )

    setPendingControl(null)
    setPendingControl2(null)
  }

  /* --------------------------- derived ---------------------------- */

  const stateVectorRows = simResult
    ? formatStateVector(simResult.stateVector)
    : []

  const maxProb = simResult
    ? Math.max(
        ...simResult.histogram.map(
          (h) => h.probability
        ),
        0.0001
      )
    : 1

  const errorCount = findings.filter(
    (f) => f.severity === 'error'
  ).length

  const warnCount = findings.filter(
    (f) => f.severity === 'warning'
  ).length

  const optCount = findings.filter(
    (f) => f.severity === 'optimization'
  ).length

  const selectedInfo = GATE_INFO[selectedGate]

  /* --------------------------- render ----------------------------- */

  return (
    <div className="min-h-screen bg-[#05070d] text-slate-100">
      {/* ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute top-1/3 -right-40 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-fuchsia-500/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-cyan-400">
              <CircuitBoard className="h-6 w-6" />

              <span className="text-sm font-medium uppercase tracking-widest">
                Q-loop · Circuit Builder
              </span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              <span className="bg-gradient-to-r from-cyan-300 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
                Quantum Circuit Builder
              </span>
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Drag ideas into reality. Place gates on the canvas,
              run the simulator, and inspect the resulting state
              vector, measurement histogram, and circuit analysis.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={handleSimulate}
              disabled={simulating}
              className="bg-cyan-500 text-[#05070d] hover:bg-cyan-400"
            >
              {simulating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}

              {simulating ? 'Running…' : 'Simulate'}
            </Button>

            <Button
              variant="outline"
              onClick={handleExport}
              className="border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
            >
              <Download className="mr-2 h-4 w-4" />
              Export JSON
            </Button>

            <Button
              variant="outline"
              onClick={handleClear}
              className="border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
          {/* ---------------- Left sidebar ---------------- */}

          <aside className="space-y-4">
            {/* Gate palette */}
            <Card className="border-white/10 bg-white/[0.03] backdrop-blur-xl">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm text-slate-200">
                  <Zap className="h-4 w-4 text-cyan-400" />
                  Gate Palette
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                {CATEGORY_ORDER.map((cat) => (
                  <div key={cat}>
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      {CATEGORY_LABEL[cat]}
                    </p>

                    <div className="grid grid-cols-4 gap-1.5">
                      {GATES_BY_CATEGORY[cat].map((g) => {
                        const info = GATE_INFO[g]
                        const active = selectedGate === g

                        return (
                          <button
                            key={g}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData(
                                'application/x-qloop-gate',
                                g
                              )

                              e.dataTransfer.effectAllowed = 'copy'

                              setSelectedGate(g)
                              setPendingControl(null)
                              setPendingControl2(null)
                            }}
                            onClick={() => {
                              setSelectedGate(g)
                              setPendingControl(null)
                              setPendingControl2(null)
                            }}
                            title={`${info.name} — ${info.description}`}
                            className={cn(
                              'relative flex h-10 items-center justify-center rounded-lg border text-sm font-bold transition-all',
                              active
                                ? 'scale-105 border-white/40 shadow-lg'
                                : 'border-white/10 hover:border-white/25'
                            )}
                            style={{
                              color: info.color,
                              background: active
                                ? `${info.color}22`
                                : 'rgba(255,255,255,0.03)',
                              boxShadow: active
                                ? `0 0 16px ${info.color}55`
                                : undefined,
                            }}
                          >
                            {info.symbol}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Selected gate info */}
            <Card className="border-white/10 bg-white/[0.03] backdrop-blur-xl">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm text-slate-200">
                  <Info className="h-4 w-4 text-cyan-400" />
                  Selected Gate
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-lg border text-lg font-bold"
                    style={{
                      color: selectedInfo.color,
                      background: `${selectedInfo.color}1a`,
                      borderColor: `${selectedInfo.color}44`,
                    }}
                  >
                    {selectedInfo.symbol}
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-100">
                      {selectedInfo.name}
                    </p>

                    <p className="text-xs text-slate-400">
                      {selectedInfo.isMultiQubit
                        ? selectedGate === 'TOFFOLI'
                          ? '3-qubit · click 3 qubits'
                          : '2-qubit · click 2 qubits'
                        : selectedInfo.hasParameter
                        ? 'parametric · θ = π/2'
                        : 'single-qubit'}
                    </p>
                  </div>
                </div>

                <p className="mt-3 text-xs leading-relaxed text-slate-400">
                  {selectedInfo.description}
                </p>

                {pendingControl && (
                  <p className="mt-3 rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-1.5 text-xs text-cyan-200">
                    {selectedGate === 'TOFFOLI' &&
                    !pendingControl2
                      ? `Control 1 set on q[${pendingControl.qubit}] — pick control 2`
                      : selectedGate === 'TOFFOLI' &&
                        pendingControl2
                      ? `Controls on q[${pendingControl.qubit}] & q[${pendingControl2.qubit}] — pick target`
                      : `Control set on q[${pendingControl.qubit}] — pick target`}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Presets */}
            <Card className="border-white/10 bg-white/[0.03] backdrop-blur-xl">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm text-slate-200">
                  <CircuitBoard className="h-4 w-4 text-cyan-400" />
                  Preset Circuits
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-2">
                {(
                  [
                    'Bell State',
                    'GHZ State',
                    'Quantum Teleportation',
                    "Grover's (2-qubit)",
                  ] as PresetName[]
                ).map((name) => (
                  <Button
                    key={name}
                    variant="outline"
                    onClick={() => handlePreset(name)}
                    className="w-full justify-start border-white/10 bg-white/5 text-left text-xs text-slate-200 hover:bg-white/10"
                  >
                    {name}
                  </Button>
                ))}
              </CardContent>
            </Card>
          </aside>

          {/* ---------------- Main area ---------------- */}

          <main className="space-y-6">
            {/* Toolbar */}
            <Card className="border-white/10 bg-white/[0.03] backdrop-blur-xl">
              <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    Qubits
                  </span>

                  <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-black/30 p-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => adjustQubits(-1)}
                      disabled={numQubits <= MIN_QUBITS}
                      className="h-7 w-7 text-slate-300 hover:bg-white/10"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>

                    <span className="w-8 text-center text-sm font-semibold tabular-nums text-cyan-300">
                      {numQubits}
                    </span>

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => adjustQubits(1)}
                      disabled={numQubits >= MAX_QUBITS}
                      className="h-7 w-7 text-slate-300 hover:bg-white/10"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  <span className="text-xs text-slate-500">
                    ({MIN_QUBITS}–{MAX_QUBITS})
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span>
                    Gates:{' '}
                    <span className="font-semibold text-slate-200">
                      {gates.length}
                    </span>
                  </span>

                  <span>
                    Columns:{' '}
                    <span className="font-semibold text-slate-200">
                      {usedColumns(gates)}
                    </span>
                  </span>

                  <span className="flex items-center gap-1">
                    <span
                      className={cn(
                        'h-2 w-2 rounded-full',
                        errorCount > 0
                          ? 'bg-rose-400'
                          : warnCount > 0
                          ? 'bg-amber-400'
                          : 'bg-emerald-400'
                      )}
                    />

                    {errorCount > 0
                      ? `${errorCount} error${
                          errorCount > 1 ? 's' : ''
                        }`
                      : warnCount > 0
                      ? `${warnCount} warning${
                          warnCount > 1 ? 's' : ''
                        }`
                      : 'circuit OK'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Circuit canvas */}
            <Card className="border-white/10 bg-white/[0.03] backdrop-blur-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-200">
                  Circuit Canvas
                </CardTitle>
              </CardHeader>

              <CardContent className="overflow-x-auto">
                <div className="min-w-max">
                  {/* column header */}
                  <div className="flex">
                    <div className="w-16 shrink-0" />

                    {Array.from({
                      length: displayColumns,
                    }).map((_, c) => (
                      <div
                        key={c}
                        className={cn(
                          'flex h-6 w-16 items-center justify-center text-[10px] tabular-nums transition-colors',
                          activeColumn === c
                            ? 'font-semibold text-cyan-300'
                            : 'text-slate-600'
                        )}
                      >
                        {c}
                      </div>
                    ))}
                  </div>

                  {/* qubit rows */}
                  {Array.from({
                    length: numQubits,
                  }).map((_, q) => (
                    <div
                      key={q}
                      className="flex items-center"
                    >
                      <div className="flex w-16 shrink-0 items-center gap-1.5 pr-2">
                        <span className="text-xs font-medium text-slate-300">
                          q[{q}]
                        </span>

                        <span className="text-[10px] text-slate-600">
                          |0⟩
                        </span>
                      </div>

                      {Array.from({
                        length: displayColumns,
                      }).map((_, c) => {
                        const gate = gateAtCell(
                          gates,
                          q,
                          c
                        )

                        const occupied = !!gate

                        const isPending =
                          (pendingControl?.qubit === q &&
                            pendingControl?.column === c) ||
                          (pendingControl2?.qubit === q &&
                            pendingControl2?.column === c)

                        const isActive =
                          activeColumn === c

                        return (
                          <div
                            key={c}
                            onClick={() =>
                              onCellClick(q, c)
                            }
                            onDragOver={(e) => {
                              e.preventDefault()
                              e.dataTransfer.dropEffect =
                                'copy'
                            }}
                            onDrop={(e) => {
                              e.preventDefault()

                              const gate = e.dataTransfer.getData(
                                'application/x-qloop-gate'
                              ) as GateType

                              if (
                                !gate ||
                                !GATE_INFO[gate]
                              ) {
                                return
                              }

                              setSelectedGate(gate)
                              setPendingControl(null)
                              setPendingControl2(null)
                              onCellClick(q, c)
                            }}
                            className={cn(
                              'group relative flex h-14 w-16 cursor-pointer items-center justify-center transition-all',
                              'border-r border-t border-white/[0.04]',
                              isActive &&
                                !occupied &&
                                'bg-cyan-500/[0.06]',
                              isPending &&
                                'bg-cyan-500/20',
                              !occupied &&
                                !isPending &&
                                'hover:bg-white/[0.04]'
                            )}
                          >
                            {/* wire */}
                            <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-white/10" />

                            {gate && (
                              <GateChip
                                gate={gate}
                                numQubits={numQubits}
                                allGates={gates}
                                qubit={q}
                                column={c}
                              />
                            )}

                            {isPending && (
                              <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-md border border-cyan-400/60 bg-cyan-500/30 text-xs font-bold text-cyan-100">
                                •
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ))}

                  {/* hint */}
                  <p className="mt-3 text-xs text-slate-500">
                    Click a cell to place{' '}
                    <span
                      style={{
                        color: selectedInfo.color,
                      }}
                      className="font-semibold"
                    >
                      {selectedInfo.name}
                    </span>
                    .{' '}
                    {selectedInfo.isMultiQubit &&
                      'Click control first, then target.'}{' '}
                    Click a placed gate to remove it.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Results + analysis grid */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              {/* Backend error */}
              {simError && (
                <Card className="border-rose-500/30 bg-rose-500/[0.05] backdrop-blur-xl xl:col-span-2">
                  <CardContent className="flex items-start gap-3 p-4">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />

                    <div>
                      <p className="text-sm font-medium text-rose-300">
                        Backend Error
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {simError}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Showing local simulation results as fallback.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* State vector */}
              <Card className="border-white/10 bg-white/[0.03] backdrop-blur-xl">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm text-slate-200">
                    <Info className="h-4 w-4 text-cyan-400" />
                    State Vector
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  {!simResult ? (
                    <EmptyHint text="Run the simulator to see the quantum state vector." />
                  ) : stateVectorRows.length === 0 ? (
                    <p className="text-xs text-slate-500">
                      State vector is empty (all amplitudes ~0).
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {stateVectorRows.map((row) => (
                        <div
                          key={row.basis}
                          className="flex items-center justify-between rounded-md border border-white/5 bg-black/20 px-3 py-2"
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-sm font-semibold text-cyan-300">
                              |{row.basis}⟩
                            </span>

                            <span className="font-mono text-xs text-slate-300">
                              {row.amplitude}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/10">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500"
                                style={{
                                  width: `${Math.min(
                                    100,
                                    row.probability * 100
                                  )}%`,
                                }}
                              />
                            </div>

                            <span className="w-14 text-right font-mono text-xs tabular-nums text-slate-400">
                              {(
                                row.probability * 100
                              ).toFixed(2)}
                              %
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Histogram */}
              <Card className="border-white/10 bg-white/[0.03] backdrop-blur-xl">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm text-slate-200">
                    <Zap className="h-4 w-4 text-cyan-400" />
                    Measurement Histogram
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  {!simResult ? (
                    <EmptyHint text="Run the simulator to see measurement outcomes (1024 shots)." />
                  ) : simResult.histogram.length === 0 ? (
                    <p className="text-xs text-slate-500">
                      No measurement outcomes.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {simResult.histogram
                        .slice(0, 12)
                        .map((h) => (
                          <div
                            key={h.state}
                            className="flex items-center gap-3"
                          >
                            <span className="w-16 font-mono text-xs font-semibold text-cyan-300">
                              |{h.state}⟩
                            </span>

                            <div className="relative h-6 flex-1 overflow-hidden rounded-md bg-white/5">
                              <div
                                className="flex h-full items-center justify-end rounded-md bg-gradient-to-r from-cyan-500/70 to-indigo-500/70 pr-2 transition-all"
                                style={{
                                  width: `${
                                    (h.probability /
                                      maxProb) *
                                    100
                                  }%`,
                                }}
                              >
                                <span className="font-mono text-[10px] text-white/90">
                                  {h.count}
                                </span>
                              </div>
                            </div>

                            <span className="w-12 text-right font-mono text-xs tabular-nums text-slate-400">
                              {(
                                h.probability * 100
                              ).toFixed(1)}
                              %
                            </span>
                          </div>
                        ))}

                      {simResult.histogram.length > 12 && (
                        <p className="pt-1 text-center text-[10px] text-slate-600">
                          +
                          {simResult.histogram.length -
                            12}{' '}
                          more outcomes
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Analysis */}
              <Card className="border-white/10 bg-white/[0.03] backdrop-blur-xl xl:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm text-slate-200">
                    <AlertTriangle className="h-4 w-4 text-cyan-400" />
                    Circuit Analysis

                    <span className="ml-2 flex gap-2 text-[10px] font-normal">
                      {errorCount > 0 && (
                        <Badge color="rose">
                          {errorCount} error
                          {errorCount > 1 ? 's' : ''}
                        </Badge>
                      )}

                      {warnCount > 0 && (
                        <Badge color="amber">
                          {warnCount} warning
                          {warnCount > 1 ? 's' : ''}
                        </Badge>
                      )}

                      {optCount > 0 && (
                        <Badge color="cyan">
                          {optCount} optimization
                          {optCount > 1 ? 's' : ''}
                        </Badge>
                      )}

                      {findings.length === 0 && (
                        <Badge color="emerald">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          No issues
                        </Badge>
                      )}
                    </span>
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  {findings.length === 0 ? (
                    <div className="flex items-center gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/5 px-3 py-3 text-sm text-emerald-300">
                      <CheckCircle2 className="h-4 w-4" />
                      Circuit looks clean — no errors, warnings, or optimization
                      suggestions.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                      {findings.map((f, i) => {
                        const s = SEVERITY_STYLE[f.severity]
                        const Icon = s.Icon

                        return (
                          <div
                            key={i}
                            className={cn(
                              'flex gap-3 rounded-lg border px-3 py-2.5',
                              s.bg,
                              s.border
                            )}
                          >
                            <Icon
                              className={cn(
                                'mt-0.5 h-4 w-4 shrink-0',
                                s.color
                              )}
                            />

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span
                                  className={cn(
                                    'text-[10px] font-bold uppercase tracking-wider',
                                    s.color
                                  )}
                                >
                                  {s.label}
                                </span>

                                <span className="text-sm font-semibold text-slate-100">
                                  {f.title}
                                </span>
                              </div>

                              <p className="mt-0.5 text-xs leading-relaxed text-slate-400">
                                {f.description}
                              </p>

                              {f.suggestion && (
                                <p
                                  className={cn(
                                    'mt-1 text-xs',
                                    s.color
                                  )}
                                >
                                  → {f.suggestion}
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* footer link */}
            <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
              <span>
                Need a refresher?{' '}
                <Link
                  to="/learn"
                  className="text-cyan-400 hover:text-cyan-300"
                >
                  Open the lessons
                </Link>
                .
              </span>

              <span>
                Q-loop Circuit Builder · local state-vector simulation
              </span>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Subcomponents                                                       */
/* ------------------------------------------------------------------ */

function GateChip({
  gate,
  numQubits,
  allGates,
  qubit,
  column,
}: {
  gate: PlacedGate
  numQubits: number
  allGates: PlacedGate[]
  qubit: number
  column: number
}) {
  const info = GATE_INFO[gate.type]

  const partnerQubits: number[] = []

  if (gate.type === 'SWAP') {
    if (
      gate.qubit === qubit &&
      gate.targetQubit !== undefined
    ) {
      partnerQubits.push(gate.targetQubit)
    } else if (gate.targetQubit === qubit) {
      partnerQubits.push(gate.qubit)
    }
  } else if (gate.type === 'TOFFOLI') {
    if (gate.controlQubit === qubit) {
      if (gate.control2Qubit !== undefined) {
        partnerQubits.push(gate.control2Qubit)
      }

      if (gate.targetQubit !== undefined) {
        partnerQubits.push(gate.targetQubit)
      }
    } else if (gate.control2Qubit === qubit) {
      if (gate.targetQubit !== undefined) {
        partnerQubits.push(gate.targetQubit)
      }
    } else if (gate.targetQubit === qubit) {
      if (gate.controlQubit !== undefined) {
        partnerQubits.push(gate.controlQubit)
      }

      if (gate.control2Qubit !== undefined) {
        partnerQubits.push(gate.control2Qubit)
      }
    }
  } else {
    // Controlled two-qubit gate.
    if (
      gate.controlQubit === qubit &&
      gate.targetQubit !== undefined
    ) {
      partnerQubits.push(gate.targetQubit)
    } else if (
      gate.targetQubit === qubit &&
      gate.controlQubit !== undefined
    ) {
      partnerQubits.push(gate.controlQubit)
    }
  }

  const isControl =
    gate.controlQubit === qubit ||
    gate.control2Qubit === qubit

  const isTarget = gate.targetQubit === qubit
  const isSwap = gate.type === 'SWAP'

  const isConditional =
    gate.condition_bit !== undefined

  return (
    <div className="relative z-10 flex h-full w-full items-center justify-center">
      {/* vertical connector to partners */}
      {partnerQubits.map((p) => {
        const distance = Math.abs(p - qubit)
        const direction = p > qubit ? 1 : -1

        return (
          <div
            key={p}
            className="absolute left-1/2 w-px -translate-x-1/2 bg-white/25"
            style={{
              top:
                direction > 0
                  ? '50%'
                  : undefined,
              bottom:
                direction < 0
                  ? '50%'
                  : undefined,
              height: `${distance * 56}px`,
            }}
          />
        )
      })}

      {/* Conditional marker */}
      {isConditional && (
        <div
          className="absolute -right-1 -top-1 z-20 flex h-4 min-w-4 items-center justify-center rounded-full border border-amber-400/60 bg-amber-500/20 px-1 text-[8px] font-bold text-amber-200"
          title={`Conditional: c[${gate.condition_bit}] = ${
            gate.condition_value ?? 1
          }`}
        >
          c{gate.condition_bit}
        </div>
      )}

      {/* Gate chip */}
      <div
        className="relative flex h-9 w-9 items-center justify-center rounded-md border text-sm font-bold shadow-md transition-transform group-hover:scale-105"
        style={{
          color: info.color,
          background: `${info.color}22`,
          borderColor: `${info.color}66`,
          boxShadow: `0 0 10px ${info.color}33`,
        }}
        title={
          isConditional
            ? `${info.name} @ q[${qubit}], col ${column} — if c[${gate.condition_bit}] = ${
                gate.condition_value ?? 1
              }`
            : `${info.name} @ q[${qubit}], col ${column}`
        }
      >
        {isControl ? (
          <span
            className="absolute h-2.5 w-2.5 rounded-full"
            style={{
              background: info.color,
            }}
          />
        ) : isTarget &&
          (gate.type === 'CX' ||
            gate.type === 'TOFFOLI') ? (
          <span
            className="relative flex h-7 w-7 items-center justify-center rounded-full border-2"
            style={{
              borderColor: info.color,
            }}
          >
            <span
              className="absolute h-px w-4"
              style={{
                background: info.color,
              }}
            />

            <span
              className="absolute h-4 w-px"
              style={{
                background: info.color,
              }}
            />
          </span>
        ) : isSwap ? (
          <span
            className="relative text-lg leading-none"
            style={{
              color: info.color,
            }}
          >
            ×
          </span>
        ) : (
          <span>{info.symbol}</span>
        )}
      </div>
    </div>
  )
}

function Badge({
  children,
  color,
}: {
  children: React.ReactNode
  color: 'rose' | 'amber' | 'cyan' | 'emerald'
}) {
  const map = {
    rose: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
    amber: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
    cyan: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300',
    emerald:
      'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 font-medium',
        map[color]
      )}
    >
      {children}
    </span>
  )
}

function EmptyHint({ text }: { text: string }) {
  return (
    <div className="flex h-32 items-center justify-center rounded-md border border-dashed border-white/10 bg-black/20">
      <p className="px-6 text-center text-xs text-slate-500">
        {text}
      </p>
    </div>
  )
}