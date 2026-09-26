import { useState } from 'react'
import { Editor } from '@monaco-editor/react'
import {
  Trophy,
  Target,
  Code2,
  CircuitBoard,
  Play,
  Lightbulb,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  RotateCcw,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CIRCUIT_CHALLENGES, CODING_CHALLENGES } from '@/lib/quantum/challenges'
import { simulateCircuit, type CircuitGate } from '@/lib/quantum/simulator'
import { GATE_INFO, type GateType } from '@/lib/quantum/gates'

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type Tab = 'circuit' | 'coding'
type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced'

interface ValidationResult {
  passed: boolean
  score: number
  feedback: string
}

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const DIFFICULTY_STYLES: Record<Difficulty, { color: string; bg: string; border: string }> = {
  Beginner: { color: 'text-emerald-300', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  Intermediate: { color: 'text-amber-300', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  Advanced: { color: 'text-rose-300', bg: 'bg-rose-500/10', border: 'border-rose-500/30' },
}

const PALETTE_GATES: GateType[] = ['H', 'X', 'Y', 'Z', 'S', 'T', 'CX', 'CZ', 'SWAP', 'M']

const MAX_COLUMNS = 12

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const uid = () => Math.random().toString(36).slice(2, 10)

/** A placed gate carries a column index for grid layout. */
interface PlacedGate extends CircuitGate {
  column: number
}

function toCircuitGates(placed: PlacedGate[]): CircuitGate[] {
  return [...placed].sort((a, b) => a.column - b.column).map((g) => ({
    id: g.id, type: g.type, qubit: g.qubit,
    targetQubit: g.targetQubit, controlQubit: g.controlQubit,
    control2Qubit: g.control2Qubit, parameter: g.parameter,
  }))
}

function occupiesQubit(g: PlacedGate, q: number): boolean {
  return g.qubit === q || g.targetQubit === q || g.controlQubit === q || g.control2Qubit === q
}

function cellOccupied(gates: PlacedGate[], qubit: number, column: number): boolean {
  return gates.some((g) => g.column === column && occupiesQubit(g, qubit))
}

function gateAtCell(gates: PlacedGate[], qubit: number, column: number): PlacedGate | undefined {
  return gates.find((g) => g.column === column && occupiesQubit(g, qubit))
}

function usedColumns(gates: PlacedGate[]): number {
  return gates.reduce((m, g) => Math.max(m, g.column + 1), 0)
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function ChallengesPage() {
  const [tab, setTab] = useState<Tab>('circuit')

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
        <header className="mb-8">
          <div className="mb-2 flex items-center gap-2 text-cyan-400">
            <Trophy className="h-6 w-6" />
            <span className="text-sm font-medium uppercase tracking-widest">Q-loop · Challenges</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            <span className="bg-gradient-to-r from-cyan-300 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
              Quantum Challenges
            </span>
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Test your quantum skills. Build circuits and write code to solve a
            series of progressively harder challenges.
          </p>
        </header>

        {/* Tab switcher */}
        <div className="mb-8 inline-flex rounded-xl border border-white/10 bg-white/[0.03] p-1 backdrop-blur-xl">
          {(
            [
              { id: 'circuit' as const, label: 'Circuit Challenges', Icon: CircuitBoard },
              { id: 'coding' as const, label: 'Coding Challenges', Icon: Code2 },
            ]
          ).map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-300',
                tab === id
                  ? 'bg-cyan-500 text-[#05070d] shadow-lg shadow-cyan-500/30'
                  : 'text-slate-300 hover:bg-white/5 hover:text-slate-100'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div key={tab} className="animate-in fade-in duration-500">
          {tab === 'circuit' ? <CircuitChallenges /> : <CodingChallenges />}
        </div>
      </div>
    </div>
  )
}

/* ================================================================== */
/* Circuit Challenges                                                  */
/* ================================================================== */

function CircuitChallenges() {
  const [activeId, setActiveId] = useState<string | null>(null)
  const active = CIRCUIT_CHALLENGES.find((c) => c.id === activeId) ?? null

  if (active) {
    return (
      <CircuitChallengeView
        challenge={active}
        onBack={() => setActiveId(null)}
      />
    )
  }

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      {CIRCUIT_CHALLENGES.map((c) => {
        const diff = DIFFICULTY_STYLES[c.difficulty]
        return (
          <Card
            key={c.id}
            className="group border-white/10 bg-white/[0.03] backdrop-blur-xl transition-all duration-300 hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/10"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <CardTitle className="text-base font-semibold text-slate-100">
                  {c.title}
                </CardTitle>
                <span
                  className={cn(
                    'shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
                    diff.color,
                    diff.bg,
                    diff.border
                  )}
                >
                  {c.difficulty}
                </span>
              </div>
              <p className="text-xs text-slate-400">{c.description}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2 rounded-lg border border-white/5 bg-black/20 p-2.5">
                <Target className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-400" />
                <p className="text-xs leading-relaxed text-slate-300">
                  <span className="font-semibold text-cyan-300">Objective: </span>
                  {c.objective}
                </p>
              </div>
              <CollapsibleHint hint={c.hint} />
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-500">
                  {c.numQubits} qubit{c.numQubits > 1 ? 's' : ''}
                  {c.targetGates ? ` · target ${c.targetGates} gates` : ''}
                </span>
                <Button
                  onClick={() => setActiveId(c.id)}
                  className="bg-cyan-500 text-[#05070d] hover:bg-cyan-400"
                >
                  <Play className="mr-1.5 h-3.5 w-3.5" /> Start Challenge
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function CircuitChallengeView({
  challenge,
  onBack,
}: {
  challenge: (typeof CIRCUIT_CHALLENGES)[number]
  onBack: () => void
}) {
  const [gates, setGates] = useState<PlacedGate[]>([])
  const [selectedGate, setSelectedGate] = useState<GateType>('H')
  const [pendingControl, setPendingControl] = useState<{ qubit: number; column: number } | null>(null)
  const [result, setResult] = useState<ValidationResult | null>(null)
  const [simulating, setSimulating] = useState(false)

  const numQubits = challenge.numQubits
  const columnCount = Math.max(usedColumns(gates) + 1, 8)
  const displayColumns = Math.min(columnCount, MAX_COLUMNS)

  const handleCellClick = (qubit: number, column: number) => {
    const existing = gateAtCell(gates, qubit, column)
    if (existing) {
      setGates((gs) => gs.filter((g) => g.id !== existing.id))
      setPendingControl(null)
      return
    }

    const info = GATE_INFO[selectedGate]

    if (info.hasParameter) {
      setGates((gs) => [
        ...gs,
        { id: uid(), type: selectedGate, qubit, column, parameter: Math.PI / 2 },
      ])
      setPendingControl(null)
      return
    }

    if (!info.isMultiQubit) {
      setGates((gs) => [...gs, { id: uid(), type: selectedGate, qubit, column }])
      setPendingControl(null)
      return
    }

    // Two-qubit controlled gate placement
    if (!pendingControl) {
      setPendingControl({ qubit, column })
      return
    }
    if (pendingControl.qubit === qubit) {
      // re-pick control on a different qubit
      setPendingControl({ qubit, column })
      return
    }
    // place the controlled gate: control on pendingControl, target on qubit
    setGates((gs) => [
      ...gs,
      {
        id: uid(),
        type: selectedGate,
        qubit: pendingControl.qubit,
        column,
        controlQubit: pendingControl.qubit,
        targetQubit: qubit,
      },
    ])
    setPendingControl(null)
  }

  const handleSimulate = () => {
    setSimulating(true)
    // defer to next tick so the spinner can paint for tight loops
    setTimeout(() => {
      const sim = simulateCircuit(toCircuitGates(gates), numQubits, 1024)
      const res = challenge.validator(toCircuitGates(gates), sim)
      setResult(res)
      setSimulating(false)
    }, 30)
  }

  const handleClear = () => {
    setGates([])
    setPendingControl(null)
    setResult(null)
  }

  const selectedInfo = GATE_INFO[selectedGate]

  return (
    <div className="space-y-5">
      {/* Back + title */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={onBack}
            className="border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
          </Button>
          <div>
            <h2 className="text-lg font-semibold text-slate-100">{challenge.title}</h2>
            <p className="text-xs text-slate-400">{challenge.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
              DIFFICULTY_STYLES[challenge.difficulty].color,
              DIFFICULTY_STYLES[challenge.difficulty].bg,
              DIFFICULTY_STYLES[challenge.difficulty].border
            )}
          >
            {challenge.difficulty}
          </span>
        </div>
      </div>

      {/* Objective banner */}
      <Card className="border-cyan-500/20 bg-cyan-500/[0.04] backdrop-blur-xl">
        <CardContent className="flex items-start gap-2.5 p-4">
          <Target className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
          <p className="text-sm leading-relaxed text-slate-200">
            <span className="font-semibold text-cyan-300">Objective: </span>
            {challenge.objective}
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[220px_1fr]">
        {/* Gate palette */}
        <Card className="border-white/10 bg-white/[0.03] backdrop-blur-xl">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm text-slate-200">
              <CircuitBoard className="h-4 w-4 text-cyan-400" /> Gate Palette
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-1.5">
              {PALETTE_GATES.map((g) => {
                const info = GATE_INFO[g]
                const active = selectedGate === g
                return (
                  <button
                    key={g}
                    onClick={() => {
                      setSelectedGate(g)
                      setPendingControl(null)
                    }}
                    title={`${info.name} — ${info.description}`}
                    className={cn(
                      'flex h-10 items-center justify-center rounded-lg border text-sm font-bold transition-all',
                      active
                        ? 'scale-105 border-white/40 shadow-lg'
                        : 'border-white/10 hover:border-white/25'
                    )}
                    style={{
                      color: info.color,
                      background: active ? `${info.color}22` : 'rgba(255,255,255,0.03)',
                      boxShadow: active ? `0 0 16px ${info.color}55` : undefined,
                    }}
                  >
                    {info.symbol}
                  </button>
                )
              })}
            </div>
            <div className="border-t border-white/5 pt-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Selected
              </p>
              <div className="mt-1.5 flex items-center gap-2">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-bold"
                  style={{
                    color: selectedInfo.color,
                    background: `${selectedInfo.color}1a`,
                    borderColor: `${selectedInfo.color}44`,
                  }}
                >
                  {selectedInfo.symbol}
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-100">{selectedInfo.name}</p>
                  <p className="text-[11px] text-slate-400">
                    {selectedInfo.isMultiQubit
                      ? '2-qubit · click 2 cells'
                      : selectedInfo.hasParameter
                      ? 'θ = π/2'
                      : 'single-qubit'}
                  </p>
                </div>
              </div>
            </div>
            {pendingControl && (
              <p className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-1.5 text-xs text-cyan-200">
                Control on q[{pendingControl.qubit}] — pick target
              </p>
            )}
          </CardContent>
        </Card>

        {/* Circuit grid + controls */}
        <div className="space-y-4">
          <Card className="border-white/10 bg-white/[0.03] backdrop-blur-xl">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-slate-200">Circuit Grid</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={handleClear}
                    className="border-white/10 bg-white/5 text-xs text-slate-200 hover:bg-white/10"
                  >
                    <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reset
                  </Button>
                  <Button
                    onClick={handleSimulate}
                    disabled={simulating}
                    className="bg-cyan-500 text-[#05070d] hover:bg-cyan-400"
                  >
                    <Play className="mr-1.5 h-4 w-4" />
                    {simulating ? 'Simulating…' : 'Simulate'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <div className="min-w-max">
                {/* column header */}
                <div className="flex">
                  <div className="w-14 shrink-0" />
                  {Array.from({ length: displayColumns }).map((_, c) => (
                    <div
                      key={c}
                      className="flex h-6 w-14 items-center justify-center text-[10px] tabular-nums text-slate-600"
                    >
                      {c}
                    </div>
                  ))}
                </div>

                {/* qubit rows */}
                {Array.from({ length: numQubits }).map((_, q) => (
                  <div key={q} className="flex items-center">
                    <div className="w-14 shrink-0 pr-2 text-right text-xs font-medium text-slate-400">
                      q[{q}]
                    </div>
                    {Array.from({ length: displayColumns }).map((_, c) => {
                      const g = gateAtCell(gates, q, c)
                      const occupied = cellOccupied(gates, q, c)
                      return (
                        <button
                          key={c}
                          onClick={() => handleCellClick(q, c)}
                          className={cn(
                            'flex h-12 w-14 items-center justify-center border-l border-white/5 transition-colors',
                            occupied
                              ? 'bg-white/[0.04]'
                              : 'hover:bg-cyan-500/5 hover:border-cyan-500/20'
                          )}
                        >
                          {g && <GateCell gate={g} qubit={q} />}
                        </button>
                      )
                    })}
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[11px] text-slate-500">
                Click a cell to place the selected gate. Click an existing gate
                to remove it. For two-qubit gates, click the control qubit first,
                then the target.
              </p>
            </CardContent>
          </Card>

          {/* Results panel */}
          {result && <ResultPanel result={result} />}
        </div>
      </div>
    </div>
  )
}

function GateCell({ gate, qubit }: { gate: PlacedGate; qubit: number }) {
  const info = GATE_INFO[gate.type]
  const isControl = gate.controlQubit === qubit
  const isTarget = gate.targetQubit === qubit

  if (isControl) {
    return (
      <span
        className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold"
        style={{ background: info.color, color: '#05070d' }}
      >
        •
      </span>
    )
  }
  if (isTarget) {
    return (
      <span
        className="flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-bold"
        style={{ borderColor: info.color, color: info.color, background: `${info.color}1a` }}
      >
        ⊕
      </span>
    )
  }
  return (
    <span
      className="flex h-8 w-8 items-center justify-center rounded-lg border text-sm font-bold"
      style={{ color: info.color, background: `${info.color}1a`, borderColor: `${info.color}44` }}
    >
      {info.symbol}
    </span>
  )
}

/* ================================================================== */
/* Coding Challenges                                                   */
/* ================================================================== */

function CodingChallenges() {
  const [activeId, setActiveId] = useState<string | null>(null)
  const active = CODING_CHALLENGES.find((c) => c.id === activeId) ?? null

  if (active) {
    return <CodingChallengeView challenge={active} onBack={() => setActiveId(null)} />
  }

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      {CODING_CHALLENGES.map((c) => {
        const diff = DIFFICULTY_STYLES[c.difficulty]
        return (
          <Card
            key={c.id}
            className="group border-white/10 bg-white/[0.03] backdrop-blur-xl transition-all duration-300 hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/10"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <CardTitle className="text-base font-semibold text-slate-100">
                  {c.title}
                </CardTitle>
                <span
                  className={cn(
                    'shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
                    diff.color,
                    diff.bg,
                    diff.border
                  )}
                >
                  {c.difficulty}
                </span>
              </div>
              <p className="text-xs text-slate-400">{c.description}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg border border-white/5 bg-black/30 p-2.5">
                <pre className="max-h-24 overflow-auto text-[11px] leading-relaxed text-slate-300">
                  <code>{c.starterCode}</code>
                </pre>
              </div>
              <CollapsibleHint hint={c.hint} />
              <div className="flex justify-end pt-1">
                <Button
                  onClick={() => setActiveId(c.id)}
                  className="bg-cyan-500 text-[#05070d] hover:bg-cyan-400"
                >
                  <Code2 className="mr-1.5 h-3.5 w-3.5" /> Start Coding
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function CodingChallengeView({
  challenge,
  onBack,
}: {
  challenge: (typeof CODING_CHALLENGES)[number]
  onBack: () => void
}) {
  const [code, setCode] = useState(challenge.starterCode)
  const [result, setResult] = useState<ValidationResult | null>(null)
  const [running, setRunning] = useState(false)

  const handleRun = () => {
    setRunning(true)
    setTimeout(() => {
      console.log('CODE SENT TO VALIDATOR:', JSON.stringify(code))
      const res = challenge.validator(code)
      setResult(res)
      setRunning(false)
    }, 30)
  }

  const handleReset = () => {
    setCode(challenge.starterCode)
    setResult(null)
  }

  return (
    <div className="space-y-5">
      {/* Back + title */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={onBack}
            className="border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
          </Button>
          <div>
            <h2 className="text-lg font-semibold text-slate-100">{challenge.title}</h2>
            <p className="text-xs text-slate-400">{challenge.description}</p>
          </div>
        </div>
        <span
          className={cn(
            'rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
            DIFFICULTY_STYLES[challenge.difficulty].color,
            DIFFICULTY_STYLES[challenge.difficulty].bg,
            DIFFICULTY_STYLES[challenge.difficulty].border
          )}
        >
          {challenge.difficulty}
        </span>
      </div>

      {/* Hint */}
      <Card className="border-amber-500/20 bg-amber-500/[0.04] backdrop-blur-xl">
        <CardContent className="flex items-start gap-2.5 p-4">
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <p className="text-sm leading-relaxed text-slate-200">
            <span className="font-semibold text-amber-300">Hint: </span>
            {challenge.hint}
          </p>
        </CardContent>
      </Card>

      {/* Editor + actions */}
      <Card className="border-white/10 bg-white/[0.03] backdrop-blur-xl">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm text-slate-200">
              <Code2 className="h-4 w-4 text-cyan-400" /> Q-loop DSL Editor
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleReset}
                className="border-white/10 bg-white/5 text-xs text-slate-200 hover:bg-white/10"
              >
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reset
              </Button>
              <Button
                onClick={handleRun}
                disabled={running}
                className="bg-cyan-500 text-[#05070d] hover:bg-cyan-400"
              >
                <Play className="mr-1.5 h-4 w-4" />
                {running ? 'Running…' : 'Run'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80 overflow-hidden rounded-lg border border-white/10">
            <Editor
              height="100%"
              defaultLanguage="plaintext"
              theme="vs-dark"
              value={code}
              onChange={(v) => setCode(v ?? '')}
              options={{
                fontSize: 13,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                lineNumbers: 'on',
                padding: { top: 12, bottom: 12 },
                smoothScrolling: true,
                cursorBlinking: 'smooth',
                renderLineHighlight: 'all',
                tabSize: 2,
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {result && <ResultPanel result={result} />}
    </div>
  )
}

/* ================================================================== */
/* Shared subcomponents                                                 */
/* ================================================================== */

function CollapsibleHint({ hint }: { hint: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-lg border border-white/5 bg-black/20">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs text-slate-300 transition-colors hover:text-slate-100"
      >
        <Lightbulb className={cn('h-3.5 w-3.5 text-amber-400', open && 'rotate-12')} />
        <span className="font-medium">Hint</span>
        <span className="ml-auto text-[10px] text-slate-500">{open ? 'hide' : 'show'}</span>
      </button>
      <div
        className={cn(
          'grid transition-all duration-300',
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        )}
      >
        <div className="overflow-hidden">
          <p className="px-2.5 pb-2.5 text-xs leading-relaxed text-slate-400">{hint}</p>
        </div>
      </div>
    </div>
  )
}

function ResultPanel({ result }: { result: ValidationResult }) {
  const { passed, score, feedback } = result
  return (
    <Card
      className={cn(
        'border backdrop-blur-xl transition-all duration-300',
        passed
          ? 'border-emerald-500/30 bg-emerald-500/[0.05]'
          : 'border-rose-500/30 bg-rose-500/[0.05]'
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          {passed ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          ) : (
            <XCircle className="h-5 w-5 text-rose-400" />
          )}
          <span className={passed ? 'text-emerald-300' : 'text-rose-300'}>
            {passed ? 'Challenge Passed!' : 'Not Quite — Try Again'}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Score bar */}
        <div>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-slate-400">Score</span>
            <span className={cn('font-semibold tabular-nums', passed ? 'text-emerald-300' : 'text-rose-300')}>
              {score}/100
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-black/40">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                passed
                  ? 'bg-gradient-to-r from-emerald-500 to-cyan-400'
                  : 'bg-gradient-to-r from-rose-500 to-amber-400'
              )}
              style={{ width: `${Math.max(2, Math.min(100, score))}%` }}
            />
          </div>
        </div>
        {/* Feedback */}
        <div className="rounded-lg border border-white/5 bg-black/20 p-3">
          <p className="text-sm leading-relaxed text-slate-200">{feedback}</p>
        </div>
      </CardContent>
    </Card>
  )
}
