import {
  Complex,
  c,
  cAdd,
  cMul,
  cScale,
  cAbs2,
  cArg,
  cConj,
} from './complex'

import { GateType, getGateMatrix } from './gates'

export interface CircuitGate {
  id: string
  type: GateType
  qubit: number
  targetQubit?: number
  controlQubit?: number
  control2Qubit?: number
  parameter?: number
  condition_bit?: number
  condition_value?: number
}

export interface StateVector {
  amplitudes: Complex[]
  numQubits: number
}

export interface MeasurementResult {
  outcome: string | number
  probability: number
  counts: Record<string, number>
}

export interface SimulationResult {
  stateVector: StateVector
  probabilities: number[]
  measurements: MeasurementResult[]
  measuredQubits: Set<number>
  histogram: {
    state: string
    count: number
    probability: number
  }[]
}

export function initStateVector(numQubits: number): StateVector {
  const dim = 2 ** numQubits

  const amplitudes: Complex[] = Array(dim)
    .fill(null)
    .map(() => c(0))

  amplitudes[0] = c(1)

  return {
    amplitudes,
    numQubits,
  }
}

export function getProbabilities(state: StateVector): number[] {
  return state.amplitudes.map((a) => cAbs2(a))
}

export function applySingleQubitGate(
  state: StateVector,
  gateType: GateType,
  qubit: number,
  param?: number
): StateVector {
  const { numQubits, amplitudes } = state
  const dim = 2 ** numQubits
  const m = getGateMatrix(gateType, param)

  const newAmp: Complex[] = Array(dim)
    .fill(null)
    .map(() => c(0))

  for (let i = 0; i < dim; i++) {
    const bv = (i >> qubit) & 1

    const i0 = i & ~(1 << qubit)
    const i1 = i0 | (1 << qubit)

    newAmp[i] = cAdd(
      cMul(m[bv][0], amplitudes[i0]),
      cMul(m[bv][1], amplitudes[i1])
    )
  }

  return {
    amplitudes: newAmp,
    numQubits,
  }
}

export function applyControlledGate(
  state: StateVector,
  gateType: GateType,
  ctrl: number,
  tgt: number,
  param?: number
): StateVector {
  const { numQubits, amplitudes } = state
  const dim = 2 ** numQubits

  let targetGateType: GateType

  switch (gateType) {
    case 'CX':
      targetGateType = 'X'
      break

    case 'CZ':
      targetGateType = 'Z'
      break

    case 'CY':
      targetGateType = 'Y'
      break

    case 'CH':
      targetGateType = 'H'
      break

    default:
      return state
  }

  const m = getGateMatrix(targetGateType, param)

  const newAmp: Complex[] = [...amplitudes]

  for (let i = 0; i < dim; i++) {
    const controlBit = (i >> ctrl) & 1
    const targetBit = (i >> tgt) & 1

    if (controlBit !== 1) {
      continue
    }

    if (targetBit !== 0) {
      continue
    }

    const i0 = i
    const i1 = i ^ (1 << tgt)

    newAmp[i0] = cAdd(
      cMul(m[0][0], amplitudes[i0]),
      cMul(m[0][1], amplitudes[i1])
    )

    newAmp[i1] = cAdd(
      cMul(m[1][0], amplitudes[i0]),
      cMul(m[1][1], amplitudes[i1])
    )
  }

  return {
    amplitudes: newAmp,
    numQubits,
  }
}

export function applySWAPGate(
  state: StateVector,
  q1: number,
  q2: number
): StateVector {
  const { numQubits, amplitudes } = state
  const dim = 2 ** numQubits

  const newAmp: Complex[] = Array(dim)
    .fill(null)
    .map(() => c(0))

  for (let i = 0; i < dim; i++) {
    const b1 = (i >> q1) & 1
    const b2 = (i >> q2) & 1

    let j = i

    j = (b2 << q1) | (j & ~(1 << q1))
    j = (b1 << q2) | (j & ~(1 << q2))

    newAmp[j] = amplitudes[i]
  }

  return {
    amplitudes: newAmp,
    numQubits,
  }
}

export function applyToffoliGate(
  state: StateVector,
  c1: number,
  c2: number,
  tgt: number
): StateVector {
  const { numQubits, amplitudes } = state
  const dim = 2 ** numQubits

  const newAmp: Complex[] = [...amplitudes]

  for (let i = 0; i < dim; i++) {
    if (
      ((i >> c1) & 1) === 1 &&
      ((i >> c2) & 1) === 1
    ) {
      const partner = i ^ (1 << tgt)

      if (i < partner) {
        const tmp = newAmp[i]

        newAmp[i] = newAmp[partner]
        newAmp[partner] = tmp
      }
    }
  }

  return {
    amplitudes: newAmp,
    numQubits,
  }
}

export function measureQubit(
  state: StateVector,
  qubit: number
): {
  state: StateVector
  outcome: number
} {
  const probs = getProbabilities(state)
  const dim = 2 ** state.numQubits

  let prob0 = 0

  for (let i = 0; i < dim; i++) {
    if (((i >> qubit) & 1) === 0) {
      prob0 += probs[i]
    }
  }

  const outcome = Math.random() < prob0 ? 0 : 1

  const newAmp: Complex[] = Array(dim)
    .fill(null)
    .map(() => c(0))

  let norm = 0

  for (let i = 0; i < dim; i++) {
    if (((i >> qubit) & 1) === outcome) {
      newAmp[i] = state.amplitudes[i]
      norm += cAbs2(state.amplitudes[i])
    }
  }

  if (norm > 0) {
    const nf = 1 / Math.sqrt(norm)

    for (let i = 0; i < dim; i++) {
      newAmp[i] = cScale(newAmp[i], nf)
    }
  }

  return {
    state: {
      amplitudes: newAmp,
      numQubits: state.numQubits,
    },
    outcome,
  }
}

export function simulateCircuit(
  gates: CircuitGate[],
  numQubits: number,
  shots: number = 1024
): SimulationResult {
  let state = initStateVector(numQubits)

  const measuredQubits = new Set<number>()
  const measurements: MeasurementResult[] = []

  // Classical register used by conditional operations.
  // Key = classical bit index
  // Value = measurement result (0 or 1)
  const classicalBits: Record<number, number> = {}

  // Measurements are assigned classical bits in measurement order.
  let nextClassicalBit = 0

  for (const gate of gates) {
    /*
     * Check classical condition before executing the gate.
     *
     * Example:
     * condition_bit = 0
     * condition_value = 1
     *
     * means:
     * "Execute this gate only when classical bit 0 == 1."
     */
    if (gate.condition_bit !== undefined) {
      const actualValue = classicalBits[gate.condition_bit] ?? 0
      const expectedValue = gate.condition_value ?? 1

      if (actualValue !== expectedValue) {
        continue
      }
    }

    switch (gate.type) {
      case 'M': {
        const {
          state: nextState,
          outcome,
        } = measureQubit(state, gate.qubit)

        state = nextState

        measuredQubits.add(gate.qubit)

        // Store the measurement result in the next classical bit.
        classicalBits[nextClassicalBit] = outcome

        nextClassicalBit += 1

        measurements.push({
          outcome,
          probability: 1,
          counts: {},
        })

        break
      }

      case 'CX':
      case 'CZ':
      case 'CY':
      case 'CH':
        if (
          gate.controlQubit !== undefined &&
          gate.targetQubit !== undefined
        ) {
          state = applyControlledGate(
            state,
            gate.type,
            gate.controlQubit,
            gate.targetQubit,
            gate.parameter
          )
        }

        break

      case 'SWAP':
        if (gate.targetQubit !== undefined) {
          state = applySWAPGate(
            state,
            gate.qubit,
            gate.targetQubit
          )
        }

        break

      case 'TOFFOLI':
        if (
          gate.controlQubit !== undefined &&
          gate.control2Qubit !== undefined &&
          gate.targetQubit !== undefined
        ) {
          state = applyToffoliGate(
            state,
            gate.controlQubit,
            gate.control2Qubit,
            gate.targetQubit
          )
        }

        break

      default:
        state = applySingleQubitGate(
          state,
          gate.type,
          gate.qubit,
          gate.parameter
        )
    }
  }

  const probabilities = getProbabilities(state)

  let histogram: {
    state: string
    count: number
    probability: number
  }[] = []

  if (shots > 0) {
    const counts: Record<string, number> = {}

    for (let s = 0; s < shots; s++) {
      // Select one complete basis state using its probability.
      const random = Math.random()

      let cumulative = 0
      let selectedIndex = 0

      for (let i = 0; i < probabilities.length; i++) {
        cumulative += probabilities[i]

        if (random < cumulative) {
          selectedIndex = i
          break
        }
      }

      // Convert the selected state index into a binary string.
      const bits = selectedIndex
        .toString(2)
        .padStart(numQubits, '0')

      counts[bits] = (counts[bits] || 0) + 1
    }

    measurements.push({
      outcome: '',
      probability: 1,
      counts,
    })

    histogram = Object.entries(counts)
      .map(([st, ct]) => ({
        state: st,
        count: ct,
        probability: ct / shots,
      }))
      .sort((a, b) => b.count - a.count)
  }

  return {
    stateVector: state,
    probabilities,
    measurements,
    measuredQubits,
    histogram,
  }
}

export function formatStateVector(
  state: StateVector
): {
  basis: string
  amplitude: string
  probability: number
  phase: number
}[] {
  const { numQubits, amplitudes } = state
  const dim = 2 ** numQubits

  const result: {
    basis: string
    amplitude: string
    probability: number
    phase: number
  }[] = []

  for (let i = 0; i < dim; i++) {
    const basis = i.toString(2).padStart(numQubits, '0')

    const amp = amplitudes[i]
    const prob = cAbs2(amp)
    const phase = cArg(amp)

    if (prob > 1e-10) {
      const re = Math.abs(amp.re) < 1e-10 ? 0 : amp.re
      const im = Math.abs(amp.im) < 1e-10 ? 0 : amp.im

      const reStr = re.toFixed(4).replace(/\.?0+$/, '')
      const imStr = Math.abs(im)
        .toFixed(4)
        .replace(/\.?0+$/, '')

      let ampStr: string

      if (im === 0) {
        ampStr = reStr
      } else if (re === 0) {
        ampStr = im > 0 ? `${imStr}i` : `-${imStr}i`
      } else {
        ampStr =
          im > 0
            ? `${reStr}+${imStr}i`
            : `${reStr}-${imStr}i`
      }

      result.push({
        basis,
        amplitude: ampStr,
        probability: prob,
        phase,
      })
    }
  }

  return result
}

export function getBlochVector(
  state: StateVector,
  qubit: number
): {
  x: number
  y: number
  z: number
} {
  const { numQubits, amplitudes } = state
  const dim = 2 ** numQubits

  let x = 0
  let y = 0
  let z = 0

  for (let i = 0; i < dim; i++) {
    const bit = (i >> qubit) & 1

    for (let j = 0; j < dim; j++) {
      const bitj = (j >> qubit) & 1

      if (bit === 0 && bitj === 1) {
        const prod = cMul(
          amplitudes[i],
          cConj(amplitudes[j])
        )

        x += 2 * prod.re
        y += 2 * prod.im
      }
    }

    const prod = cMul(
      amplitudes[i],
      cConj(amplitudes[i])
    )

    if (bit === 0) {
      z += prod.re
    } else {
      z -= prod.re
    }
  }

  return {
    x,
    y,
    z,
  }
}

export function circuitToJson(
  gates: CircuitGate[],
  numQubits: number
): string {
  const ops = gates.map((g) => {
    const op: Record<string, unknown> = {
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

    if (g.condition_bit !== undefined) {
      op.condition_bit = g.condition_bit
    }

    if (g.condition_value !== undefined) {
      op.condition_value = g.condition_value
    }

    return op
  })

  return JSON.stringify(
    {
      qubits: numQubits,
      classical_bits: numQubits,
      operations: ops,
    },
    null,
    2
  )
}