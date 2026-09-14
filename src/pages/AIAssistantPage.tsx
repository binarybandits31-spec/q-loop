import { useState, useRef, useEffect } from 'react'
import {
  Brain, Send, Sparkles, User, Bot, Code2, BookOpen, CircuitBoard,
  Lightbulb, Zap, Atom, Info,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────
interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

interface KnowledgeEntry {
  keywords: string[]
  response: string
}

interface ContextInfo {
  circuit?: string
  simulationResults?: string
  errors?: string
}

// ─── Knowledge Base ───────────────────────────────────────────────────
const KNOWLEDGE_BASE: KnowledgeEntry[] = [
  {
    keywords: ['qubit', 'qubits', 'quantum bit'],
    response:
      'A **qubit** is the fundamental unit of quantum information. Unlike a classical bit (0 or 1), a qubit can exist in a superposition of both states simultaneously, described by |ψ⟩ = α|0⟩ + β|1⟩ where |α|² + |β|² = 1. Qubits are typically realized using photon polarization, electron spin, or superconducting circuits.',
  },
  {
    keywords: ['superposition', 'superpose'],
    response:
      '**Superposition** is the principle that a quantum system can exist in a linear combination of multiple states at once. For a qubit, this means being partially in |0⟩ and |1⟩ at the same time. The Hadamard gate is the most common way to create superposition, placing a qubit into an equal blend of both basis states.',
  },
  {
    keywords: ['hadamard', 'h gate', 'h-gate'],
    response:
      'The **Hadamard gate (H)** creates superposition. It maps |0⟩ → (|0⟩ + |1⟩)/√2 and |1⟩ → (|0⟩ − |1⟩)/√2. Applying H to |0⟩ puts the qubit into the |+⟩ state. The Hadamard is its own inverse: H·H = I. It is essential for creating the uniform superposition used in many quantum algorithms like Grover\'s and Deutsch-Jozsa.',
  },
  {
    keywords: ['entanglement', 'entangle', 'entangled'],
    response:
      '**Entanglement** is a uniquely quantum correlation where two or more qubits share a state that cannot be described independently. Measuring one entangled qubit instantly determines the outcome of the other, regardless of distance. Entanglement is the key resource behind quantum teleportation, superdense coding, and many quantum algorithms.',
  },
  {
    keywords: ['bell state', 'bell states', 'bell pair', 'epr pair'],
    response:
      '**Bell states** are the four maximally entangled two-qubit states:\n\n• |Φ⁺⟩ = (|00⟩ + |11⟩)/√2\n• |Φ⁻⟩ = (|00⟩ − |11⟩)/√2\n• |Ψ⁺⟩ = (|01⟩ + |10⟩)/√2\n• |Ψ⁻⟩ = (|01⟩ − |10⟩)/√2\n\nThey are created by applying a Hadamard to the first qubit, then a CNOT with that qubit as control. Bell states are the foundation of quantum teleportation and superdense coding.',
  },
  {
    keywords: ['cnot', 'controlled not', 'cx gate', 'controlled-not'],
    response:
      'The **CNOT (Controlled-NOT) gate** is a two-qubit gate that flips the target qubit only when the control qubit is |1⟩. Its matrix flips |10⟩↔|11⟩ while leaving |00⟩ and |01⟩ unchanged. CNOT is the primary gate for creating entanglement and is universal for quantum computation when combined with single-qubit gates.',
  },
  {
    keywords: ['pauli', 'pauli gate', 'x gate', 'y gate', 'z gate', 'x-gate', 'y-gate', 'z-gate'],
    response:
      'The **Pauli gates** are single-qubit operations:\n\n• **X** (bit-flip): |0⟩↔|1⟩, the quantum NOT.\n• **Y**: |0⟩→i|1⟩, |1⟩→−i|0⟩.\n• **Z** (phase-flip): |0⟩→|0⟩, |1⟩→−|1⟩.\n\nAll three are Hermitian and unitary, with eigenvalues ±1. They form the basis of single-qubit rotations and appear throughout quantum error correction and algorithm design.',
  },
  {
    keywords: ['measurement', 'measure', 'collapse', 'observable'],
    response:
      '**Measurement** collapses a qubit\'s superposition into a definite classical state. For |ψ⟩ = α|0⟩ + β|1⟩, measuring in the computational basis yields |0⟩ with probability |α|² and |1⟩ with probability |β|². Measurement is irreversible and destroys superposition — once observed, the qubit is fixed in the measured state.',
  },
  {
    keywords: ['grover', 'grover\'s', 'search', 'amplitude amplification'],
    response:
      '**Grover\'s algorithm** searches an unsorted database of N items in O(√N) time, a quadratic speedup over classical O(N). It works by: (1) creating a uniform superposition, (2) marking the target with an oracle, and (3) amplifying the target\'s amplitude via the diffusion operator. After ~π/4·√N iterations, the target state is measured with high probability.',
  },
  {
    keywords: ['shor', 'shor\'s', 'factoring', 'integer factorization'],
    response:
      '**Shor\'s algorithm** factors integers in polynomial time — exponentially faster than the best known classical algorithms. It reduces factoring to order-finding, uses quantum phase estimation to find the period of a modular exponentiation function, and then extracts factors via classical post-processing. Shor\'s is the canonical example of a quantum advantage with real-world impact (it breaks RSA).',
  },
  {
    keywords: ['deutsch', 'deutsch-jozsa', 'deutsch jozsa'],
    response:
      'The **Deutsch-Jozsa algorithm** determines whether a function f: {0,1}ⁿ → {0,1} is constant (same output for all inputs) or balanced (0 for half, 1 for the other half) in a single query. Classically this could take up to 2ⁿ⁻¹+1 queries. It uses a uniform superposition, a phase oracle, and a final Hadamard transform — a clean demonstration of quantum parallelism.',
  },
  {
    keywords: ['error correction', 'qec', 'surface code', 'shor code', 'steane code'],
    response:
      '**Quantum error correction (QEC)** protects quantum information from decoherence. Unlike classical redundancy, the no-cloning theorem forbids simply copying qubits. Instead, QEC encodes logical qubits into many physical qubits using syndrome measurements that detect errors without collapsing the state. Key codes include the Shor code (9 qubits), Steane code (7 qubits), and the surface code — currently the most promising for scalable hardware.',
  },
  {
    keywords: ['variational', 'vqe', 'qaoa', 'variational algorithm', 'hybrid'],
    response:
      '**Variational algorithms** (VQE, QAOA) are hybrid quantum-classical methods ideal for near-term (NISQ) hardware. A parameterized quantum circuit prepares a trial state; a classical optimizer tunes the parameters to minimize a cost function measured on the quantum processor. VQE targets molecular ground states; QAOA tackles combinatorial optimization. They are resilient to noise because of their shallow circuits.',
  },
  {
    keywords: ['teleportation', 'teleport', 'quantum teleportation'],
    response:
      '**Quantum teleportation** transfers an unknown qubit state from one location to another using a shared Bell pair and two classical bits. Steps: (1) share an entangled pair, (2) perform a Bell measurement on the source qubit and one half of the pair, (3) send the 2-bit classical result, (4) apply a correction on the receiving qubit. No information travels faster than light — the classical channel enforces causality.',
  },
  {
    keywords: ['phase estimation', 'qpe', 'quantum phase estimation'],
    response:
      '**Quantum Phase Estimation (QPE)** estimates the eigenvalue (phase) of a unitary operator\'s eigenvector. It uses a register of qubits in superposition, controlled-U operations, and an inverse Quantum Fourier Transform to read out the phase. QPE is a core subroutine in Shor\'s algorithm, quantum chemistry simulations, and the HHL linear-systems algorithm.',
  },
  {
    keywords: ['qft', 'quantum fourier transform', 'fourier'],
    response:
      'The **Quantum Fourier Transform (QFT)** maps a quantum state to its frequency-domain representation. It is the quantum analog of the discrete Fourier transform, running in O(n²) gates for n qubits (exponentially faster than the classical FFT\'s O(N log N) on N=2ⁿ elements). The QFT is the final step in Shor\'s algorithm and the inverse step in phase estimation.',
  },
]

// ─── Fallback responses ───────────────────────────────────────────────
const FALLBACK_RESPONSE =
  "I'm not sure I caught that, but I'd love to help! I can explain qubits, superposition, entanglement, Bell states, Hadamard and Pauli gates, CNOT, measurement, Grover's and Shor's algorithms, Deutsch-Jozsa, error correction, variational algorithms, teleportation, phase estimation, and the QFT. Try asking about any of these topics!"

const GREETING_RESPONSE =
  "Hi! I'm your Q-loop quantum tutor. Ask me about any quantum computing concept — from qubits and superposition to Shor's algorithm and quantum error correction. You can also tap one of the suggested prompts below to get started."

// ─── Response logic ──────────────────────────────────────────────────
function getResponse(query: string): string {
  const normalized = query.toLowerCase().trim()
  if (!normalized) return FALLBACK_RESPONSE

  // Greeting detection
  if (/^(hi|hello|hey|greetings|yo|sup)\b/.test(normalized)) {
    return GREETING_RESPONSE
  }

  // Score each knowledge entry by keyword hits
  let bestEntry: KnowledgeEntry | null = null
  let bestScore = 0

  for (const entry of KNOWLEDGE_BASE) {
    let score = 0
    for (const keyword of entry.keywords) {
      const kw = keyword.toLowerCase()
      // Whole-word match scores higher than substring match
      const wordBoundary = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
      if (wordBoundary.test(normalized)) {
        score += 2
      } else if (normalized.includes(kw)) {
        score += 1
      }
    }
    if (score > bestScore) {
      bestScore = score
      bestEntry = entry
    }
  }

  return bestEntry && bestScore > 0 ? bestEntry.response : FALLBACK_RESPONSE
}

// ─── Suggested prompts ────────────────────────────────────────────────
const SUGGESTED_PROMPTS = [
  { label: 'What is a qubit?', icon: Atom },
  { label: 'Explain superposition', icon: Sparkles },
  { label: 'How does entanglement work?', icon: Zap },
  { label: 'What is a Bell state?', icon: CircuitBoard },
  { label: 'Explain Grover\'s algorithm', icon: Lightbulb },
  { label: 'How does Shor\'s algorithm work?', icon: Brain },
  { label: 'What is the QFT?', icon: Code2 },
  { label: 'Explain error correction', icon: BookOpen },
]

// ─── Mock context (would come from app state in a real integration) ──
const MOCK_CONTEXT: ContextInfo = {
  circuit: 'H(q0) → CNOT(q0, q1) → Measure(q0, q1)',
  simulationResults: '|00⟩: 50%  |11⟩: 50%',
  errors: undefined,
}

// ─── Component ────────────────────────────────────────────────────────
export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: GREETING_RESPONSE,
      timestamp: Date.now(),
    },
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showContext, setShowContext] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Auto-scroll to bottom whenever messages or typing state change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Cleanup any pending typing timer on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    }
  }, [])

  const handleSend = (text?: string) => {
    const content = (text ?? input).trim()
    if (!content || isTyping) return

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: Date.now(),
    }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    // Simulate AI "thinking" delay
    const response = getResponse(content)
    typingTimeoutRef.current = setTimeout(() => {
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, assistantMessage])
      setIsTyping(false)
    }, 700 + Math.random() * 600)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatContent = (content: string) => {
    // Render **bold** segments and preserve newlines
    return content.split('\n').map((line, lineIdx) => (
      <span key={lineIdx} className="block">
        {line.split(/(\*\*[^*]+\*\*)/g).map((segment, segIdx) => {
          if (segment.startsWith('**') && segment.endsWith('**')) {
            return (
              <strong key={segIdx} className="font-semibold text-cyan-300">
                {segment.slice(2, -2)}
              </strong>
            )
          }
          return <span key={segIdx}>{segment}</span>
        })}
      </span>
    ))
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Ambient background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute top-1/3 -right-20 h-80 w-80 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* ─── Header ─────────────────────────────────────────────── */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 ring-1 ring-cyan-500/30 backdrop-blur-sm">
              <Brain className="h-6 w-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Q-loop AI Tutor
              </h1>
              <p className="text-sm text-slate-400">
                Your quantum computing learning companion
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowContext((s) => !s)}
            className={cn(
              'border-cyan-500/20 bg-cyan-500/5 text-cyan-300 hover:bg-cyan-500/10 hover:text-cyan-200',
              showContext && 'border-cyan-500/40 bg-cyan-500/10',
            )}
          >
            <Info className="mr-1.5 h-4 w-4" />
            {showContext ? 'Hide Context' : 'Show Context'}
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* ─── Chat Column ──────────────────────────────────────── */}
          <div
            className={cn(
              'flex flex-col',
              showContext ? 'lg:col-span-2' : 'lg:col-span-3',
            )}
          >
            <Card className="flex h-[70vh] flex-col overflow-hidden border-cyan-500/20 bg-slate-900/60 backdrop-blur-xl">
              {/* Messages area */}
              <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      'flex items-start gap-3',
                      message.role === 'user' && 'flex-row-reverse',
                    )}
                  >
                    {/* Avatar */}
                    <div
                      className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 backdrop-blur-sm',
                        message.role === 'user'
                          ? 'bg-violet-500/10 ring-violet-500/30'
                          : 'bg-cyan-500/10 ring-cyan-500/30',
                      )}
                    >
                      {message.role === 'user' ? (
                        <User className="h-5 w-5 text-violet-300" />
                      ) : (
                        <Bot className="h-5 w-5 text-cyan-300" />
                      )}
                    </div>

                    {/* Bubble */}
                    <div
                      className={cn(
                        'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed backdrop-blur-sm',
                        message.role === 'user'
                          ? 'bg-violet-500/15 text-violet-50 ring-1 ring-violet-500/20'
                          : 'bg-slate-800/60 text-slate-200 ring-1 ring-cyan-500/10',
                      )}
                    >
                      <div className="space-y-1">
                        {formatContent(message.content)}
                      </div>
                      <span className="mt-1.5 block text-[10px] uppercase tracking-wider text-slate-500">
                        {new Date(message.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                {isTyping && (
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 ring-1 ring-cyan-500/30 backdrop-blur-sm">
                      <Bot className="h-5 w-5 text-cyan-300" />
                    </div>
                    <div className="rounded-2xl bg-slate-800/60 px-4 py-3 ring-1 ring-cyan-500/10 backdrop-blur-sm">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-400 [animation-delay:-0.3s]" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-400 [animation-delay:-0.15s]" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-400" />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Suggested prompts */}
              {messages.length <= 2 && !isTyping && (
                <div className="border-t border-cyan-500/10 bg-slate-900/40 p-3">
                  <p className="mb-2 px-1 text-xs font-medium uppercase tracking-wider text-slate-500">
                    Suggested questions
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTED_PROMPTS.map((prompt) => {
                      const Icon = prompt.icon
                      return (
                        <button
                          key={prompt.label}
                          onClick={() => handleSend(prompt.label)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/5 px-3 py-1.5 text-xs text-cyan-200 transition-colors hover:border-cyan-500/40 hover:bg-cyan-500/15 hover:text-cyan-100"
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {prompt.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Input area */}
              <div className="border-t border-cyan-500/10 bg-slate-900/40 p-3 sm:p-4">
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about quantum computing…"
                    disabled={isTyping}
                    className="flex-1 rounded-xl border border-cyan-500/20 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 backdrop-blur-sm transition-colors focus:border-cyan-500/40 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 disabled:opacity-50"
                  />
                  <Button
                    onClick={() => handleSend()}
                    disabled={!input.trim() || isTyping}
                    className="shrink-0 bg-cyan-500 text-slate-950 hover:bg-cyan-400 disabled:opacity-40"
                    size="icon"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="mt-1.5 px-1 text-[10px] text-slate-600">
                  Press Enter to send · Q-loop AI provides educational guidance on quantum concepts
                </p>
              </div>
            </Card>
          </div>

          {/* ─── Context Panel ────────────────────────────────────── */}
          {showContext && (
            <div className="lg:col-span-1">
              <Card className="h-[70vh] overflow-y-auto border-cyan-500/20 bg-slate-900/60 backdrop-blur-xl">
                <div className="border-b border-cyan-500/10 p-4">
                  <div className="flex items-center gap-2">
                    <CircuitBoard className="h-5 w-5 text-cyan-400" />
                    <h2 className="text-sm font-semibold text-white">
                      Context Awareness
                    </h2>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    Current state from your Q-loop workspace
                  </p>
                </div>

                <div className="space-y-4 p-4">
                  {/* Current circuit */}
                  <div>
                    <div className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-cyan-400">
                      <CircuitBoard className="h-3.5 w-3.5" />
                      Current Circuit
                    </div>
                    {MOCK_CONTEXT.circuit ? (
                      <div className="rounded-lg border border-cyan-500/15 bg-slate-950/50 p-3">
                        <code className="block font-mono text-xs leading-relaxed text-cyan-200">
                          {MOCK_CONTEXT.circuit}
                        </code>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">No circuit loaded.</p>
                    )}
                  </div>

                  {/* Simulation results */}
                  <div>
                    <div className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-emerald-400">
                      <Sparkles className="h-3.5 w-3.5" />
                      Simulation Results
                    </div>
                    {MOCK_CONTEXT.simulationResults ? (
                      <div className="rounded-lg border border-emerald-500/15 bg-slate-950/50 p-3">
                        <code className="block font-mono text-xs leading-relaxed text-emerald-200">
                          {MOCK_CONTEXT.simulationResults}
                        </code>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">No simulation run yet.</p>
                    )}
                  </div>

                  {/* Errors */}
                  <div>
                    <div className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-amber-400">
                      <Info className="h-3.5 w-3.5" />
                      Errors & Warnings
                    </div>
                    {MOCK_CONTEXT.errors ? (
                      <div className="rounded-lg border border-amber-500/15 bg-amber-500/5 p-3">
                        <p className="text-xs text-amber-200">
                          {MOCK_CONTEXT.errors}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">
                        No errors detected. Circuit looks good! ✓
                      </p>
                    )}
                  </div>

                  {/* Quick tips */}
                  <div className="rounded-lg border border-cyan-500/15 bg-cyan-500/5 p-3">
                    <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-cyan-300">
                      <Lightbulb className="h-3.5 w-3.5" />
                      Tutor Tip
                    </div>
                    <p className="text-xs leading-relaxed text-slate-300">
                      The circuit above creates a Bell state — a maximally entangled
                      pair. Ask me "What is a Bell state?" to learn why measuring one
                      qubit instantly determines the other.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
