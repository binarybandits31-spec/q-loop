import { CircuitGate, SimulationResult } from './simulator'

export interface CircuitChallenge {
  id: string; title: string; description: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  numQubits: number; objective: string; hint: string
  validator: (gates: CircuitGate[], result: SimulationResult) => { passed: boolean; score: number; feedback: string }
  targetGates?: number
}

export interface CodingChallenge {
  id: string; title: string; description: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  starterCode: string; hint: string
  validator: (code: string) => { passed: boolean; score: number; feedback: string }
}

export const CIRCUIT_CHALLENGES: CircuitChallenge[] = [
  { id: 'bell-state', title: 'Create a Bell State', description: 'Build a circuit that produces the maximally entangled Bell state |Φ+⟩ = (1/√2)(|00⟩ + |11⟩).', difficulty: 'Beginner', numQubits: 2, objective: 'Measurement histogram should show ~50% |00⟩ and ~50% |11⟩, with no |01⟩ or |10⟩.', hint: 'Apply H to qubit 0, then CNOT with q0 as control and q1 as target.', targetGates: 2,
    validator: (gates, result) => {
      if (!gates.some((g) => g.type === 'H') || !gates.some((g) => g.type === 'CX')) return { passed: false, score: 0, feedback: 'Your circuit needs a Hadamard gate and a CNOT gate. Try H on q0, then CX(q0, q1).' }
      const p = result.probabilities, p00 = p[0]||0, p11 = p[3]||0, p01 = p[1]||0, p10 = p[2]||0
      if (p00 > 0.45 && p11 > 0.45 && p01 < 0.05 && p10 < 0.05) { const s = gates.length <= 2 ? 100 : Math.max(50, 100-(gates.length-2)*10); return { passed: true, score: s, feedback: `Bell state created! |00⟩: ${(p00*100).toFixed(1)}%, |11⟩: ${(p11*100).toFixed(1)}%. ${gates.length<=2?'Optimal!':'Can be done with fewer gates.'}` } }
      return { passed: false, score: Math.round((p00+p11)*50), feedback: `Not a Bell state. |00⟩: ${(p00*100).toFixed(1)}%, |01⟩: ${(p01*100).toFixed(1)}%, |10⟩: ${(p10*100).toFixed(1)}%, |11⟩: ${(p11*100).toFixed(1)}%. Need ~50% |00⟩ and ~50% |11⟩.` }
    } },
  { id: 'superposition', title: 'Create Equal Superposition', description: 'Put a single qubit into an equal superposition of |0⟩ and |1⟩.', difficulty: 'Beginner', numQubits: 1, objective: 'Measurement should give ~50% |0⟩ and ~50% |1⟩.', hint: 'Apply the Hadamard gate (H) to the qubit.', targetGates: 1,
    validator: (gates, result) => {
      if (!gates.some((g) => g.type === 'H')) return { passed: false, score: 0, feedback: 'You need a Hadamard gate. Try applying H to q0.' }
      const p0 = result.probabilities[0]||0, p1 = result.probabilities[1]||0
      if (p0 > 0.4 && p1 > 0.4 && p0 < 0.6 && p1 < 0.6) { const s = gates.length <= 1 ? 100 : Math.max(60, 100-(gates.length-1)*15); return { passed: true, score: s, feedback: `Superposition achieved! |0⟩: ${(p0*100).toFixed(1)}%, |1⟩: ${(p1*100).toFixed(1)}%. ${gates.length===1?'Perfect!':'Can be done with just one H gate.'}` } }
      return { passed: false, score: Math.round(Math.min(p0, p1) * 100), feedback: `Not quite. |0⟩: ${(p0*100).toFixed(1)}%, |1⟩: ${(p1*100).toFixed(1)}%. Need ~50/50.` }
    } },
  { id: 'ghz-state', title: 'Create a GHZ State', description: 'Build a 3-qubit GHZ state: (1/√2)(|000⟩ + |111⟩).', difficulty: 'Intermediate', numQubits: 3, objective: 'Measurement should show ~50% |000⟩ and ~50% |111⟩.', hint: 'H on q0, then CNOT(q0,q1), then CNOT(q1,q2).', targetGates: 3,
    validator: (gates, result) => {
      const p000 = result.probabilities[0]||0, p111 = result.probabilities[7]||0
      if (p000 > 0.45 && p111 > 0.45) { const s = gates.length <= 3 ? 100 : Math.max(50, 100-(gates.length-3)*10); return { passed: true, score: s, feedback: `GHZ state created! |000⟩: ${(p000*100).toFixed(1)}%, |111⟩: ${(p111*100).toFixed(1)}%. ${gates.length<=3?'Optimal!':'Can be done with fewer gates.'}` } }
      return { passed: false, score: Math.round((p000+p111)*50), feedback: `Not a GHZ state. |000⟩: ${(p000*100).toFixed(1)}%, |111⟩: ${(p111*100).toFixed(1)}%. Need ~50/50.` }
    } },
  { id: 'flip-qubit', title: 'Flip a Qubit', description: 'Transform |0⟩ into |1⟩ using quantum gates.', difficulty: 'Beginner', numQubits: 1, objective: 'Measurement should give ~100% |1⟩.', hint: 'The Pauli-X gate is the quantum NOT — it flips |0⟩ to |1⟩.', targetGates: 1,
    validator: (gates, result) => {
      const p1 = result.probabilities[1]||0
      if (p1 > 0.95) { const s = gates.length <= 1 ? 100 : Math.max(60, 100-(gates.length-1)*15); return { passed: true, score: s, feedback: `Qubit flipped! |1⟩: ${(p1*100).toFixed(1)}%. ${gates.length===1?'Perfect — single X gate!':'One X gate is enough.'}` } }
      return { passed: false, score: Math.round(p1 * 100), feedback: `Not fully flipped. |1⟩: ${(p1*100).toFixed(1)}%. Need close to 100% |1⟩.` }
    } },
  { id: 'minus-state', title: 'Create the Minus State', description: 'Create the |-⟩ = (1/√2)(|0⟩ - |1⟩) state from |0⟩.', difficulty: 'Intermediate', numQubits: 1, objective: 'Measurement gives 50/50, but the phase must be negative. Use the visualizer to check.', hint: 'Apply X first to get |1⟩, then H to create |-⟩.', targetGates: 2,
    validator: (gates, result) => {
      if (!gates.some((g) => g.type === 'X') || !gates.some((g) => g.type === 'H')) return { passed: false, score: 0, feedback: 'You need both X and H gates. Apply X then H to get |-⟩.' }
      const p0 = result.probabilities[0]||0, p1 = result.probabilities[1]||0
      if (p0 > 0.4 && p1 > 0.4) { const s = gates.length <= 2 ? 100 : Math.max(50, 100-(gates.length-2)*10); return { passed: true, score: s, feedback: `|-⟩ state created! Measurement is 50/50 but phase is negative. ${gates.length<=2?'Optimal!':'Can be done with just X then H.'}` } }
      return { passed: false, score: Math.round(Math.min(p0, p1) * 100), feedback: `Measurement isn't 50/50. |0⟩: ${(p0*100).toFixed(1)}%, |1⟩: ${(p1*100).toFixed(1)}%.` }
    } },
]

export const CODING_CHALLENGES: CodingChallenge[] = [
  { id: 'code-bell', title: 'Code a Bell State', description: 'Write Q-loop DSL code that creates a Bell state on 2 qubits.', difficulty: 'Beginner',
    starterCode: `// Create a Bell state\ncircuit BellState {\n  qubits: 2\n  \n  // Add your gates here\n  \n  measure q[0]\n  measure q[1]\n}`,
    hint: 'Apply H to q[0], then CX with q[0] as control and q[1] as target.',
    validator: (code) => {
      const hasH = /H\s+q\[0\]/.test(code), hasCX = /CX\s+q\[0\],\s*q\[1\]/.test(code) || /CNOT\s+q\[0\],\s*q\[1\]/.test(code)
      if (hasH && hasCX) return { passed: true, score: 100, feedback: 'Correct! H followed by CNOT creates the Bell state.' }
      if (hasH && !hasCX) return { passed: false, score: 50, feedback: 'You have H but are missing CNOT. Add: CX q[0], q[1]' }
      if (!hasH && hasCX) return { passed: false, score: 50, feedback: 'You have CNOT but are missing H. Add: H q[0]' }
      return { passed: false, score: 0, feedback: 'You need both H and CX gates. Try: H q[0] then CX q[0], q[1]' }
    } },
  { id: 'code-superposition', title: 'Code Superposition', description: 'Write Q-loop DSL code that puts a qubit into superposition.', difficulty: 'Beginner',
    starterCode: `// Create superposition\ncircuit Superposition {\n  qubits: 1\n  \n  // Add your gate here\n  \n  measure q[0]\n}`,
    hint: 'The Hadamard gate creates superposition.',
    validator: (code) => {
      if (/H\s+q\[0\]/.test(code)) return { passed: true, score: 100, feedback: 'Correct! H creates an equal superposition of |0⟩ and |1⟩.' }
      return { passed: false, score: 0, feedback: 'You need a Hadamard gate. Try: H q[0]' }
    } },
  { id: 'code-ghz', title: 'Code a GHZ State', description: 'Write Q-loop DSL code that creates a 3-qubit GHZ state.', difficulty: 'Intermediate',
    starterCode: `// Create a GHZ state on 3 qubits\ncircuit GHZ {\n  qubits: 3\n  \n  // Add your gates here\n  \n  measure q[0]\n  measure q[1]\n  measure q[2]\n}`,
    hint: 'H on q[0], then CX(q[0],q[1]), then CX(q[1],q[2]).',
    validator: (code) => {
      const hasH = /H\s+q\[0\]/.test(code), hasCX1 = /CX\s+q\[0\],\s*q\[1\]/.test(code), hasCX2 = /CX\s+q\[1\],\s*q\[2\]/.test(code)
      const score = (hasH?33:0)+(hasCX1?33:0)+(hasCX2?34:0)
      const missing: string[] = []
      if (!hasH) missing.push('H q[0]'); if (!hasCX1) missing.push('CX q[0], q[1]'); if (!hasCX2) missing.push('CX q[1], q[2]')
      if (score === 100) return { passed: true, score: 100, feedback: 'Correct! H then two CNOTs creates the GHZ state.' }
      return { passed: false, score, feedback: `Missing: ${missing.join(', ')}` }
    } },
]
