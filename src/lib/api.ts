const API_URL = import.meta.env.VITE_API_URL as string || 'http://localhost:8000'

export type QuantumFramework = 'qiskit_aer' | 'pennylane' | 'cirq'

export interface ExecuteRequest {
  qubits: number
  classical_bits?: number

  operations: {
    gate: string
    target: number

    // Multi-qubit gate support
    control?: number
    control2?: number

    // Parameterized gate support
    parameter?: number

    // Classical conditional operation support
    condition_bit?: number
    condition_value?: number
  }[]

  shots?: number
  framework?: QuantumFramework
}

export interface ExecuteResponse {
  success: boolean
  status: string
  framework: string
  shots: number
  counts: Record<string, number>
  probabilities: Record<string, number>
  statevector: [number, number][] | null
  execution_time_ms: number
  circuit_depth: number | null
  gate_count: number
  error: string | null
}

export async function executeCircuit(
  req: ExecuteRequest
): Promise<ExecuteResponse> {
  const res = await fetch(`${API_URL}/api/simulator/run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(req),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')

    throw new Error(
      `Backend returned ${res.status}: ${text || res.statusText}`
    )
  }

  const data = await res.json()

  return {
    success: data.success ?? data.status === 'success',
    status: data.status,
    framework: data.framework,
    shots: data.shots ?? req.shots ?? 1024,
    counts: data.counts ?? {},
    probabilities: data.probabilities ?? {},
    statevector: data.statevector ?? null,
    execution_time_ms: data.execution_time_ms ?? 0,
    circuit_depth: data.circuit_depth ?? null,
    gate_count: data.gate_count ?? 0,
    error: data.error ?? null,
  }
}

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/api/health`)
    return res.ok
  } catch {
    return false
  }
}