import { Complex, c } from './complex'

export type GateType =
  | 'H' | 'X' | 'Y' | 'Z' | 'S' | 'T' | 'Sdg' | 'Tdg'
  | 'CX' | 'CZ' | 'CY' | 'CH'
  | 'RX' | 'RY' | 'RZ' | 'P'
  | 'SWAP' | 'TOFFOLI' | 'M'

export interface GateInfo {
  type: GateType; name: string; symbol: string; description: string
  isControlled: boolean; isMultiQubit: boolean; hasParameter: boolean
  color: string; category: 'single' | 'two' | 'three' | 'measure'
}

export const GATE_INFO: Record<GateType, GateInfo> = {
  H: { type: 'H', name: 'Hadamard', symbol: 'H', description: 'Creates superposition: |0⟩ → |+⟩, |1⟩ → |-⟩', isControlled: false, isMultiQubit: false, hasParameter: false, color: '#22d3ee', category: 'single' },
  X: { type: 'X', name: 'Pauli-X', symbol: 'X', description: 'Bit-flip gate (quantum NOT): |0⟩ ↔ |1⟩', isControlled: false, isMultiQubit: false, hasParameter: false, color: '#f43f5e', category: 'single' },
  Y: { type: 'Y', name: 'Pauli-Y', symbol: 'Y', description: 'Bit and phase flip combined', isControlled: false, isMultiQubit: false, hasParameter: false, color: '#f59e0b', category: 'single' },
  Z: { type: 'Z', name: 'Pauli-Z', symbol: 'Z', description: 'Phase-flip gate: |1⟩ → -|1⟩', isControlled: false, isMultiQubit: false, hasParameter: false, color: '#a78bfa', category: 'single' },
  S: { type: 'S', name: 'Phase S', symbol: 'S', description: 'π/2 phase gate: |1⟩ → i|1⟩', isControlled: false, isMultiQubit: false, hasParameter: false, color: '#34d399', category: 'single' },
  T: { type: 'T', name: 'Phase T', symbol: 'T', description: 'π/4 phase gate', isControlled: false, isMultiQubit: false, hasParameter: false, color: '#60a5fa', category: 'single' },
  Sdg: { type: 'Sdg', name: 'S Dagger', symbol: 'S†', description: 'Inverse S gate (-π/2 phase)', isControlled: false, isMultiQubit: false, hasParameter: false, color: '#10b981', category: 'single' },
  Tdg: { type: 'Tdg', name: 'T Dagger', symbol: 'T†', description: 'Inverse T gate (-π/4 phase)', isControlled: false, isMultiQubit: false, hasParameter: false, color: '#3b82f6', category: 'single' },
  CX: { type: 'CX', name: 'CNOT', symbol: '⊕', description: 'Controlled-NOT: flips target if control is |1⟩', isControlled: true, isMultiQubit: true, hasParameter: false, color: '#f43f5e', category: 'two' },
  CZ: { type: 'CZ', name: 'Controlled-Z', symbol: 'Z', description: 'Applies Z to target if control is |1⟩', isControlled: true, isMultiQubit: true, hasParameter: false, color: '#a78bfa', category: 'two' },
  CY: { type: 'CY', name: 'Controlled-Y', symbol: 'Y', description: 'Applies Y to target if control is |1⟩', isControlled: true, isMultiQubit: true, hasParameter: false, color: '#f59e0b', category: 'two' },
  CH: { type: 'CH', name: 'Controlled-H', symbol: 'H', description: 'Applies H to target if control is |1⟩', isControlled: true, isMultiQubit: true, hasParameter: false, color: '#22d3ee', category: 'two' },
  RX: { type: 'RX', name: 'Rotation X', symbol: 'Rx', description: 'Rotation around X axis by angle θ', isControlled: false, isMultiQubit: false, hasParameter: true, color: '#fb7185', category: 'single' },
  RY: { type: 'RY', name: 'Rotation Y', symbol: 'Ry', description: 'Rotation around Y axis by angle θ', isControlled: false, isMultiQubit: false, hasParameter: true, color: '#fbbf24', category: 'single' },
  RZ: { type: 'RZ', name: 'Rotation Z', symbol: 'Rz', description: 'Rotation around Z axis by angle θ', isControlled: false, isMultiQubit: false, hasParameter: true, color: '#c084fc', category: 'single' },
  P: { type: 'P', name: 'Phase Gate', symbol: 'P', description: 'Arbitrary phase rotation by angle θ', isControlled: false, isMultiQubit: false, hasParameter: true, color: '#2dd4bf', category: 'single' },
  SWAP: { type: 'SWAP', name: 'SWAP', symbol: '×', description: 'Swaps the states of two qubits', isControlled: false, isMultiQubit: true, hasParameter: false, color: '#818cf8', category: 'two' },
  TOFFOLI: { type: 'TOFFOLI', name: 'Toffoli', symbol: '⊕', description: 'CCNOT: flips target if both controls are |1⟩', isControlled: true, isMultiQubit: true, hasParameter: false, color: '#f43f5e', category: 'three' },
  M: { type: 'M', name: 'Measure', symbol: 'M', description: 'Measurement gate — collapses to |0⟩ or |1⟩', isControlled: false, isMultiQubit: false, hasParameter: false, color: '#94a3b8', category: 'measure' },
}

export const ALL_GATE_TYPES: GateType[] = ['H','X','Y','Z','S','T','Sdg','Tdg','RX','RY','RZ','P','M','CX','CZ','CY','CH','SWAP','TOFFOLI']

const I2: Complex[][] = [[c(1,0),c(0,0)],[c(0,0),c(1,0)]]
const invSqrt2 = 1 / Math.sqrt(2)

export function getGateMatrix(type: GateType, param?: number): Complex[][] {
  switch (type) {
    case 'H': return [[c(invSqrt2),c(invSqrt2)],[c(invSqrt2),c(-invSqrt2)]]
    case 'X': return [[c(0),c(1)],[c(1),c(0)]]
    case 'Y': return [[c(0),c(0,-1)],[c(0,1),c(0)]]
    case 'Z': return [[c(1),c(0)],[c(0),c(-1)]]
    case 'S': return [[c(1),c(0)],[c(0),c(0,1)]]
    case 'Sdg': return [[c(1),c(0)],[c(0),c(0,-1)]]
    case 'T': return [[c(1),c(0)],[c(0),c(Math.cos(Math.PI/4),Math.sin(Math.PI/4))]]
    case 'Tdg': return [[c(1),c(0)],[c(0),c(Math.cos(-Math.PI/4),Math.sin(-Math.PI/4))]]
    case 'RX': { const t=param??Math.PI/2; const co=Math.cos(t/2),si=Math.sin(t/2); return [[c(co),c(0,-si)],[c(0,-si),c(co)]] }
    case 'RY': { const t=param??Math.PI/2; const co=Math.cos(t/2),si=Math.sin(t/2); return [[c(co),c(-si)],[c(si),c(co)]] }
    case 'RZ': { const t=param??Math.PI/2; return [[c(Math.cos(-t/2),Math.sin(-t/2)),c(0)],[c(0),c(Math.cos(t/2),Math.sin(t/2))]] }
    case 'P': { const p=param??Math.PI/2; return [[c(1),c(0)],[c(0),c(Math.cos(p),Math.sin(p))]] }
    case 'M': return I2
    default: return I2
  }
}

export function getGateTypeFromName(name: string): GateType | null {
  const u = name.toUpperCase()
  if (u in GATE_INFO) return u as GateType
  if (u === 'CNOT') return 'CX'
  if (u === 'CCNOT' || u === 'CCX') return 'TOFFOLI'
  return null
}
