import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import type { GateType } from '@/lib/quantum/gates'
import type {
  CircuitGate,
  SimulationResult,
} from '@/lib/quantum/simulator'

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export interface PlacedGate {
  id: string
  type: GateType
  qubit: number
  targetQubit?: number
  controlQubit?: number
  control2Qubit?: number
  parameter?: number

  condition_bit?: number
  condition_value?: number

  column: number
}

export interface QLoopOperation {
  gate: GateType
  target: number
  control?: number
  control2?: number
  parameter?: number
  condition_bit?: number
  condition_value?: number
}

export interface QLoopCircuitState {
  numQubits: number
  gates: PlacedGate[]
  operations: QLoopOperation[]
  simulationResult: SimulationResult | null

  setNumQubits: (numQubits: number) => void
  setGates: (
    gates:
      | PlacedGate[]
      | ((previous: PlacedGate[]) => PlacedGate[])
  ) => void
  setSimulationResult: (
    result: SimulationResult | null
  ) => void
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function toCircuitGates(
  placed: PlacedGate[]
): CircuitGate[] {
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
      condition_bit: g.condition_bit,
      condition_value: g.condition_value,
    }))
}

function toOperations(
  gates: PlacedGate[]
): QLoopOperation[] {
  return toCircuitGates(gates).map((g) => {
    const operation: QLoopOperation = {
      gate: g.type,
      target: g.qubit,
    }

    if (g.controlQubit !== undefined) {
      operation.control = g.controlQubit
    }

    if (g.control2Qubit !== undefined) {
      operation.control2 = g.control2Qubit
    }

    if (g.targetQubit !== undefined) {
      operation.target = g.targetQubit
    }

    if (g.parameter !== undefined) {
      operation.parameter = g.parameter
    }

    if (g.condition_bit !== undefined) {
      operation.condition_bit = g.condition_bit
    }

    if (g.condition_value !== undefined) {
      operation.condition_value = g.condition_value
    }

    return operation
  })
}

/* ------------------------------------------------------------------ */
/* Context                                                             */
/* ------------------------------------------------------------------ */

const QLoopCircuitContext =
  createContext<QLoopCircuitState | null>(null)

/* ------------------------------------------------------------------ */
/* Provider                                                             */
/* ------------------------------------------------------------------ */

export function QLoopCircuitProvider({
  children,
}: {
  children: ReactNode
}) {
  const [numQubits, setNumQubits] = useState(2)

  const [gates, setGatesState] = useState<PlacedGate[]>(
    []
  )

  const [
    simulationResult,
    setSimulationResult,
  ] = useState<SimulationResult | null>(null)

  const operations = useMemo(
    () => toOperations(gates),
    [gates]
  )

  const setGates = (
    value:
      | PlacedGate[]
      | ((previous: PlacedGate[]) => PlacedGate[])
  ) => {
    setGatesState(value)
  }

  const value = useMemo(
    () => ({
      numQubits,
      gates,
      operations,
      simulationResult,
      setNumQubits,
      setGates,
      setSimulationResult,
    }),
    [
      numQubits,
      gates,
      operations,
      simulationResult,
    ]
  )

  return (
    <QLoopCircuitContext.Provider value={value}>
      {children}
    </QLoopCircuitContext.Provider>
  )
}

/* ------------------------------------------------------------------ */
/* Hook                                                                */
/* ------------------------------------------------------------------ */

export function useQLoopCircuit() {
  const context = useContext(QLoopCircuitContext)

  if (!context) {
    throw new Error(
      'useQLoopCircuit must be used inside QLoopCircuitProvider'
    )
  }

  return context
}