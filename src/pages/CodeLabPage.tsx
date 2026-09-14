import { useState, useCallback } from 'react'
import Editor from '@monaco-editor/react'
import { Code2, Play, RotateCcw, Terminal, Zap, AlertCircle, Copy, Check, FileCode2, BarChart3 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { executeCircuit, type ExecuteResponse } from '@/lib/api'

const EXAMPLES: { name: string; code: string }[] = [
  { name: 'Bell State', code: `from qiskit import QuantumCircuit, transpile\nfrom qiskit_aer import AerSimulator\n\n# Create a 2-qubit circuit\ncircuit = QuantumCircuit(2, 2)\n\n# Create superposition\ncircuit.h(0)\n\n# Entangle qubits\ncircuit.cx(0, 1)\n\n# Measure\ncircuit.measure([0, 1], [0, 1])\n\n# Run on simulator\nsimulator = AerSimulator()\ncompiled = transpile(circuit, simulator)\nresult = simulator.run(compiled, shots=1024).result()\ncounts = result.get_counts()\nprint("Measurement counts:", counts)` },
  { name: 'Superposition', code: `from qiskit import QuantumCircuit, transpile\nfrom qiskit_aer import AerSimulator\n\n# Single qubit superposition\ncircuit = QuantumCircuit(1, 1)\ncircuit.h(0)\ncircuit.measure(0, 0)\n\nsimulator = AerSimulator()\ncompiled = transpile(circuit, simulator)\nresult = simulator.run(compiled, shots=1024).result()\nprint("Counts:", result.get_counts())` },
  { name: 'Grover\'s Algorithm', code: `from qiskit import QuantumCircuit, transpile\nfrom qiskit_aer import AerSimulator\n\n# Grover's on 2 qubits (mark |11>)\ncircuit = QuantumCircuit(2, 2)\n\n# Initialize superposition\ncircuit.h([0, 1])\n\n# Oracle: mark |11>\ncircuit.cz(0, 1)\n\n# Diffusion\ncircuit.h([0, 1])\ncircuit.z([0, 1])\ncircuit.cz(0, 1)\ncircuit.h([0, 1])\n\n# Measure\ncircuit.measure([0, 1], [0, 1])\n\nsimulator = AerSimulator()\ncompiled = transpile(circuit, simulator)\nresult = simulator.run(compiled, shots=1024).result()\nprint("Grover results:", result.get_counts())` },
  { name: 'Quantum Teleportation', code: `from qiskit import QuantumCircuit, transpile\nfrom qiskit_aer import AerSimulator\n\n# Quantum teleportation circuit\ncircuit = QuantumCircuit(3, 3)\n\n# Prepare state to teleport\ncircuit.x(0)\ncircuit.h(0)\n\n# Create Bell pair\ncircuit.h(1)\ncircuit.cx(1, 2)\n\n# Bell measurement\ncircuit.cx(0, 1)\ncircuit.h(0)\ncircuit.measure([0, 1], [0, 1])\n\n# Corrections\ncircuit.cx(1, 2)\ncircuit.cz(0, 2)\ncircuit.measure(2, 2)\n\nsimulator = AerSimulator()\ncompiled = transpile(circuit, simulator)\nresult = simulator.run(compiled, shots=1024).result()\nprint("Teleportation results:", result.get_counts())` },
]

const DEFAULT_CODE = EXAMPLES[0].code

export default function CodeLabPage() {
  const [code, setCode] = useState(DEFAULT_CODE)
  const [output, setOutput] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [copied, setCopied] = useState(false)
  const [execResult, setExecResult] = useState<ExecuteResponse | null>(null)

  const handleRun = useCallback(async () => {
    setIsRunning(true)
    setError(null)
    setOutput(null)
    setExecResult(null)

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/code/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language: 'python' }),
      })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(`Backend returned ${res.status}: ${text || res.statusText}`)
      }
      const data = await res.json()
      if (data.status === 'forbidden') {
        setError(data.error || 'Code was rejected by the backend safety check.')
      } else if (data.status === 'error') {
        setError(data.error || 'Execution failed.')
        if (data.output) setOutput(data.output)
      } else {
        setOutput(data.output || '(no output)')
        if (data.counts) {
          setExecResult({
            success: true,
            counts: data.counts,
            probabilities: data.probabilities || {},
            num_qubits: 0,
            shots: 0,
            simulator: 'qiskit_aer',
            error: null,
          })
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to the backend. Is it running?')
    } finally {
      setIsRunning(false)
    }
  }, [code])

  const handleReset = () => {
    setCode(DEFAULT_CODE)
    setOutput(null)
    setError(null)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-[1600px] mx-auto">
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass border border-primary/20 mb-3">
            <Code2 className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">Code Lab</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Quantum Code Lab</h1>
          <p className="text-muted-foreground">Write Qiskit-compatible Python code. Code is sent to the backend for execution with Qiskit Aer.</p>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {EXAMPLES.map((ex) => (
            <Button key={ex.name} variant="outline" size="sm" onClick={() => { setCode(ex.code); setOutput(null); setError(null); }} className="text-xs gap-1.5">
              <FileCode2 className="w-3.5 h-3.5" /> {ex.name}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="glass overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b border-border/30">
              <div className="flex items-center gap-2"><Terminal className="w-4 h-4 text-primary" /><span className="text-sm font-semibold">Python Editor</span></div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleCopy} className="gap-1.5">
                  {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
                <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1.5"><RotateCcw className="w-3.5 h-3.5" /> Reset</Button>
                <Button size="sm" onClick={handleRun} disabled={isRunning} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 quantum-glow">
                  <Play className="w-3.5 h-3.5" /> {isRunning ? 'Running...' : 'Run'}
                </Button>
              </div>
            </div>
            <div className="h-[500px]">
              <Editor value={code} onChange={(v) => setCode(v || '')} theme="vs-dark" language="python"
                options={{ fontFamily: 'JetBrains Mono, Fira Code, monospace', fontSize: 13, lineHeight: 22, minimap: { enabled: false }, scrollBeyondLastLine: false, padding: { top: 12, bottom: 12 }, lineNumbers: 'on', renderLineHighlight: 'all', smoothScrolling: true }} />
            </div>
          </Card>

          <div className="space-y-3">
            <Card className="glass">
              <div className="flex items-center gap-2 p-3 border-b border-border/30"><Terminal className="w-4 h-4 text-primary" /><span className="text-sm font-semibold">Output</span></div>
              <div className="p-4 min-h-[200px] max-h-[500px] overflow-y-auto scrollbar-thin">
                {isRunning && <div className="flex items-center gap-2 text-muted-foreground"><div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" /> Running code on backend...</div>}
                {error && (
                  <div className="p-3 rounded-lg bg-error/5 border border-error/20">
                    <div className="flex items-center gap-2 text-error mb-1"><AlertCircle className="w-4 h-4" /><span className="text-sm font-medium">Backend Required</span></div>
                    <p className="text-sm text-muted-foreground">{error}</p>
                  </div>
                )}
                {output && <pre className="text-sm font-mono text-foreground/90 whitespace-pre-wrap">{output}</pre>}
                {execResult && execResult.counts && Object.keys(execResult.counts).length > 0 && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-primary"><BarChart3 className="w-4 h-4" /> Measurement Counts</div>
                    <div className="space-y-1.5">
                      {Object.entries(execResult.counts).sort((a, b) => b[1] - a[1]).map(([state, count]) => (
                        <div key={state} className="flex items-center gap-2">
                          <span className="font-mono text-xs text-muted-foreground w-12">|{state}⟩</span>
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary/70 rounded-full" style={{ width: `${(count / Math.max(...Object.values(execResult.counts))) * 100}%` }} />
                          </div>
                          <span className="font-mono text-xs text-muted-foreground w-12 text-right">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {!isRunning && !error && !output && <div className="text-center py-12 text-muted-foreground"><Terminal className="w-8 h-8 mx-auto mb-3 opacity-40" /><p className="text-sm">Click "Run" to execute your code</p></div>}
              </div>
            </Card>

            <Card className="p-4 glass">
              <div className="flex items-center gap-2 mb-2"><Zap className="w-4 h-4 text-primary" /><span className="text-sm font-medium">How it works</span></div>
              <ol className="space-y-1.5 text-sm text-muted-foreground">
                <li>1. Write Qiskit-compatible Python code</li>
                <li>2. Click Run to send code to the backend</li>
                <li>3. Backend executes with Qiskit Aer simulator</li>
                <li>4. Results, counts, and errors are displayed</li>
              </ol>
              <p className="text-xs text-muted-foreground/60 mt-3">The frontend never executes Python directly. All code runs in a sandboxed backend environment.</p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
