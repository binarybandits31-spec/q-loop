import { CircuitGate } from './simulator'
import { GateType } from './gates'

export type AnalysisSeverity = 'error' | 'warning' | 'info' | 'optimization'
export interface AnalysisFinding {
  severity: AnalysisSeverity; title: string; description: string
  gateIndices?: number[]; suggestion?: string
}

const SELF_INVERSE: GateType[] = ['X', 'Y', 'Z', 'H', 'CZ', 'SWAP']

export function analyzeCircuit(gates: CircuitGate[], numQubits: number): AnalysisFinding[] {
  const findings: AnalysisFinding[] = []
  gates.forEach((gate, i) => {
    if (gate.qubit < 0 || gate.qubit >= numQubits)
      findings.push({ severity: 'error', title: 'Invalid qubit reference', description: `Gate ${gate.type} at position ${i+1} references qubit ${gate.qubit}, but only ${numQubits} qubit(s) exist.`, gateIndices: [i], suggestion: `Use qubit 0–${numQubits-1}.` })
    if (gate.targetQubit !== undefined && (gate.targetQubit < 0 || gate.targetQubit >= numQubits))
      findings.push({ severity: 'error', title: 'Invalid target qubit', description: `Gate ${gate.type} at position ${i+1} has target qubit ${gate.targetQubit} out of range.`, gateIndices: [i], suggestion: `Use qubit 0–${numQubits-1}.` })
    if (gate.controlQubit !== undefined && (gate.controlQubit < 0 || gate.controlQubit >= numQubits))
      findings.push({ severity: 'error', title: 'Invalid control qubit', description: `Gate ${gate.type} at position ${i+1} has control qubit ${gate.controlQubit} out of range.`, gateIndices: [i], suggestion: `Use qubit 0–${numQubits-1}.` })
    if (gate.controlQubit !== undefined && gate.targetQubit !== undefined && gate.controlQubit === gate.targetQubit)
      findings.push({ severity: 'error', title: 'Control equals target', description: `Gate ${gate.type} at position ${i+1} has control and target on the same qubit.`, gateIndices: [i], suggestion: 'Use different qubits.' })
  })
  if (!gates.some((g) => g.type === 'M') && gates.length > 0)
    findings.push({ severity: 'warning', title: 'No measurement gates', description: 'No measurement gates found — you will not get classical output.', suggestion: 'Add M gates to measure qubits.' })
  for (let i = 0; i < gates.length - 1; i++) {
    const g1 = gates[i], g2 = gates[i + 1]
    if (g1.type === g2.type && SELF_INVERSE.includes(g1.type) && g1.qubit === g2.qubit && g1.targetQubit === g2.targetQubit && g1.controlQubit === g2.controlQubit)
      findings.push({ severity: 'optimization', title: 'Redundant gate pair', description: `Two consecutive ${g1.type} gates on qubit ${g1.qubit} cancel out.`, gateIndices: [i, i+1], suggestion: `Remove both ${g1.type} gates.` })
    if (g1.qubit === g2.qubit && !g1.controlQubit && !g2.controlQubit) {
      if ((g1.type === 'S' && g2.type === 'Sdg') || (g1.type === 'Sdg' && g2.type === 'S'))
        findings.push({ severity: 'optimization', title: 'S and S† cancel', description: `S followed by S† on qubit ${g1.qubit} is identity.`, gateIndices: [i, i+1], suggestion: 'Remove both gates.' })
      if ((g1.type === 'T' && g2.type === 'Tdg') || (g1.type === 'Tdg' && g2.type === 'T'))
        findings.push({ severity: 'optimization', title: 'T and T† cancel', description: `T followed by T† on qubit ${g1.qubit} is identity.`, gateIndices: [i, i+1], suggestion: 'Remove both gates.' })
    }
    if (g1.type === 'CX' && g2.type === 'CX' && g1.controlQubit === g2.controlQubit && g1.targetQubit === g2.targetQubit)
      findings.push({ severity: 'optimization', title: 'Double CNOT cancels', description: `Two CNOT gates with same control (${g1.controlQubit}) and target (${g1.targetQubit}) cancel out.`, gateIndices: [i, i+1], suggestion: 'Remove both CNOT gates.' })
  }
  const measured = new Set<number>()
  gates.forEach((gate, i) => { if (gate.type === 'M') measured.add(gate.qubit); else if (measured.has(gate.qubit)) findings.push({ severity: 'warning', title: 'Gate after measurement', description: `Gate ${gate.type} on qubit ${gate.qubit} at position ${i+1} comes after measurement.`, gateIndices: [i], suggestion: 'Move gate before measurement.' }) })
  return findings
}

export function getCircuitStats(gates: CircuitGate[], numQubits: number) {
  const gateCounts: Record<string, number> = {}
  const qubitDepths: number[] = Array(numQubits).fill(0)
  gates.forEach((gate) => {
    gateCounts[gate.type] = (gateCounts[gate.type] || 0) + 1
    const md = Math.max(qubitDepths[gate.qubit], gate.targetQubit !== undefined ? qubitDepths[gate.targetQubit] : 0, gate.controlQubit !== undefined ? qubitDepths[gate.controlQubit] : 0)
    qubitDepths[gate.qubit] = md + 1
    if (gate.targetQubit !== undefined) qubitDepths[gate.targetQubit] = md + 1
    if (gate.controlQubit !== undefined) qubitDepths[gate.controlQubit] = md + 1
  })
  return { gateCount: gates.length, depth: Math.max(...qubitDepths, 0), gateCounts }
}
