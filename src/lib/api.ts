const API_URL = import.meta.env.VITE_API_URL as string || 'http://localhost:8000'

export interface ExecuteRequest {
  qubits: number
  classical_bits?: number
  operations: { gate: string; target: number; control?: number; control2?: number; parameter?: number }[]
  shots?: number
}

export interface ExecuteResponse {
  success: boolean
  counts: Record<string, number>
  probabilities: Record<string, number>
  num_qubits: number
  shots: number
  simulator: string
  error: string | null
}

export async function executeCircuit(req: ExecuteRequest): Promise<ExecuteResponse> {
  const res = await fetch(`${API_URL}/api/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Backend returned ${res.status}: ${text || res.statusText}`)
  }
  return res.json()
}

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/api/health`)
    return res.ok
  } catch {
    return false
  }
}
