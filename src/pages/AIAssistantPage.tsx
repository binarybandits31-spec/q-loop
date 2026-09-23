import { useState, useRef, useEffect } from 'react'
import {
  Brain,
  Send,
  Sparkles,
  User,
  Bot,
  Code2,
  BookOpen,
  CircuitBoard,
  Lightbulb,
  Zap,
  Atom,
  Info,
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
  code?: string
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
      'A **qubit** is the fundamental unit of quantum information. Unlike a classical bit (0 or 1), a qubit can exist in a superposition of both states simultaneously, described by |ψ⟩ = α|0⟩ + β|1⟩ where |α|² + |β|² = 1.',
  },
  {
    keywords: ['superposition', 'superpose'],
    response:
      '**Superposition** is the principle that a quantum system can exist in a linear combination of multiple states at once. For a qubit, this means being partially in |0⟩ and |1⟩ at the same time.',
  },
  {
    keywords: ['hadamard', 'h gate', 'h-gate'],
    response:
      'The **Hadamard gate (H)** creates superposition. It maps |0⟩ → (|0⟩ + |1⟩)/√2 and |1⟩ → (|0⟩ − |1⟩)/√2. Applying H to |0⟩ puts the qubit into the |+⟩ state.',
  },
  {
    keywords: ['entanglement', 'entangle', 'entangled'],
    response:
      '**Entanglement** is a uniquely quantum correlation where two or more qubits share a state that cannot be described independently. It is a key resource behind quantum teleportation and many quantum algorithms.',
  },
  {
    keywords: ['bell state', 'bell states', 'bell pair', 'epr pair'],
    response:
      '**Bell states** are the four maximally entangled two-qubit states:\n\n• |Φ⁺⟩ = (|00⟩ + |11⟩)/√2\n• |Φ⁻⟩ = (|00⟩ − |11⟩)/√2\n• |Ψ⁺⟩ = (|01⟩ + |10⟩)/√2\n• |Ψ⁻⟩ = (|01⟩ − |10⟩)/√2',
  },
  {
    keywords: ['cnot', 'controlled not', 'cx gate', 'controlled-not'],
    response:
      'The **CNOT (Controlled-NOT) gate** is a two-qubit gate that flips the target qubit only when the control qubit is |1⟩. CNOT is commonly used to create entanglement.',
  },
  {
    keywords: [
      'pauli',
      'pauli gate',
      'x gate',
      'y gate',
      'z gate',
      'x-gate',
      'y-gate',
      'z-gate',
    ],
    response:
      'The **Pauli gates** are single-qubit operations:\n\n• **X** — bit flip\n• **Y** — combined bit and phase flip\n• **Z** — phase flip',
  },
  {
    keywords: ['measurement', 'measure', 'collapse', 'observable'],
    response:
      '**Measurement** collapses a qubit state into a definite classical state. For |ψ⟩ = α|0⟩ + β|1⟩, measuring in the computational basis yields |0⟩ with probability |α|² and |1⟩ with probability |β|².',
  },
  {
    keywords: ['grover', "grover's", 'search', 'amplitude amplification'],
    response:
      "**Grover's algorithm** searches an unsorted database using amplitude amplification and provides a quadratic speedup over classical brute-force search.",
  },
  {
    keywords: ['shor', "shor's", 'factoring', 'integer factorization'],
    response:
      "**Shor's algorithm** is a quantum algorithm for integer factorization. It uses quantum period finding and is important in the study of public-key cryptography.",
  },
  {
    keywords: ['deutsch', 'deutsch-jozsa', 'deutsch jozsa'],
    response:
      'The **Deutsch-Jozsa algorithm** determines whether a Boolean function is constant or balanced using quantum parallelism.',
  },
  {
    keywords: ['error correction', 'qec', 'surface code', 'shor code', 'steane code'],
    response:
      '**Quantum error correction (QEC)** protects quantum information from errors and decoherence using encoded logical qubits and syndrome measurements.',
  },
  {
    keywords: ['variational', 'vqe', 'qaoa', 'variational algorithm', 'hybrid'],
    response:
      '**Variational algorithms** such as VQE and QAOA combine quantum circuits with classical optimization.',
  },
  {
    keywords: ['teleportation', 'teleport', 'quantum teleportation'],
    response:
      '**Quantum teleportation** transfers an unknown quantum state using an entangled pair and classical communication.',
  },
  {
    keywords: ['phase estimation', 'qpe', 'quantum phase estimation'],
    response:
      '**Quantum Phase Estimation (QPE)** estimates the phase associated with an eigenvalue of a unitary operator.',
  },
  {
    keywords: ['qft', 'quantum fourier transform', 'fourier'],
    response:
      'The **Quantum Fourier Transform (QFT)** is the quantum analogue of the discrete Fourier transform and is an important component of several quantum algorithms.',
  },
]

// ─── Fallback responses ───────────────────────────────────────────────

const FALLBACK_RESPONSE =
  "I'm not sure I caught that, but I'd love to help! I can explain qubits, superposition, entanglement, Bell states, Hadamard and Pauli gates, CNOT, measurement, Grover's and Shor's algorithms, Deutsch-Jozsa, error correction, variational algorithms, teleportation, phase estimation, and the QFT."

const GREETING_RESPONSE =
  "Hi! I'm your Q-loop quantum tutor. Ask me about quantum computing concepts, or ask me to create Qiskit, PennyLane, or Cirq code."

// ─── Response logic ──────────────────────────────────────────────────

function getResponse(query: string): string {
  const normalized = query.toLowerCase().trim()

  if (!normalized) return FALLBACK_RESPONSE

  if (/^(hi|hello|hey|greetings|yo|sup)\b/.test(normalized)) {
    return GREETING_RESPONSE
  }

  let bestEntry: KnowledgeEntry | null = null
  let bestScore = 0

  for (const entry of KNOWLEDGE_BASE) {
    let score = 0

    for (const keyword of entry.keywords) {
      const kw = keyword.toLowerCase()

      if (normalized.includes(kw)) {
        score += 1
      }
    }

    if (score > bestScore) {
      bestScore = score
      bestEntry = entry
    }
  }

  return bestEntry && bestScore > 0
    ? bestEntry.response
    : FALLBACK_RESPONSE
}

// ─── Suggested prompts ────────────────────────────────────────────────

const SUGGESTED_PROMPTS = [
  { label: 'What is a qubit?', icon: Atom },
  { label: 'Explain superposition', icon: Sparkles },
  { label: 'How does entanglement work?', icon: Zap },
  { label: 'What is a Bell state?', icon: CircuitBoard },
  { label: "Explain Grover's algorithm", icon: Lightbulb },
  { label: "How does Shor's algorithm work?", icon: Brain },
  { label: 'What is the QFT?', icon: Code2 },
  { label: 'Explain error correction', icon: BookOpen },
]

// ─── Mock context ─────────────────────────────────────────────────────

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    })
  }, [messages, isTyping])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // ─── Send message ─────────────────────────────────────────────────

  const handleSend = async (text?: string) => {
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

    try {
      // Detect whether the user wants code.
      const wantsCode =
        /\b(create|write|generate|show|give|code|program|qiskit|pennylane|cirq)\b/i.test(
          content,
        )

      // Select the correct backend endpoint.
      const endpoint = wantsCode
        ? 'http://127.0.0.1:8000/api/ai/generate-code'
        : 'http://127.0.0.1:8000/api/ai/explain'

      const action = wantsCode ? 'generate_code' : 'explain'

      const response = await fetch(endpoint, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    action,
    question: content,
    context: {
      learner_level: 'beginner',
    },
  }),
})

if (!response.ok) {
  throw new Error(`AI request failed: ${response.status}`)
}

      if (!response.ok) {
        throw new Error(`AI request failed: ${response.status}`)
      }

      const data = await response.json()

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content:
          data.response ||
          'I generated a response, but no explanation was returned.',
        code: data.code_example || undefined,
        timestamp: Date.now(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error('AI Tutor request failed:', error)

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content:
          'I could not connect to the Q-loop AI Tutor. Please make sure the backend is running on http://127.0.0.1:8000.',
        timestamp: Date.now(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatContent = (content: string) => {
    return content.split('\n').map((line, lineIdx) => (
      <span key={lineIdx} className="block">
        {line.split(/(\*\*[^*]+\*\*)/g).map(
          (segment, segIdx) => {
            if (
              segment.startsWith('**') &&
              segment.endsWith('**')
            ) {
              return (
                <strong
                  key={segIdx}
                  className="font-semibold text-cyan-300"
                >
                  {segment.slice(2, -2)}
                </strong>
              )
            }

            return <span key={segIdx}>{segment}</span>
          },
        )}
      </span>
    ))
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute top-1/3 -right-20 h-80 w-80 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
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
              showContext &&
                'border-cyan-500/40 bg-cyan-500/10',
            )}
          >
            <Info className="mr-1.5 h-4 w-4" />
            {showContext ? 'Hide Context' : 'Show Context'}
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div
            className={cn(
              'flex flex-col',
              showContext
                ? 'lg:col-span-2'
                : 'lg:col-span-3',
            )}
          >
            <Card className="flex h-[70vh] flex-col overflow-hidden border-cyan-500/20 bg-slate-900/60 backdrop-blur-xl">
              <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      'flex items-start gap-3',
                      message.role === 'user' &&
                        'flex-row-reverse',
                    )}
                  >
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

                    <div
                      className={cn(
                        'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed backdrop-blur-sm',
                        message.role === 'user'
                          ? 'bg-violet-500/15 text-violet-50 ring-1 ring-violet-500/20'
                          : 'bg-slate-800/60 text-slate-200 ring-1 ring-cyan-500/10',
                      )}
                    >
                      <div className="space-y-3">
                        <div>
                          {formatContent(message.content)}
                        </div>

                        {message.code && (
                          <div className="overflow-hidden rounded-lg border border-cyan-500/20 bg-slate-950">
                            <div className="flex items-center gap-2 border-b border-cyan-500/10 bg-slate-900 px-3 py-2">
                              <Code2 className="h-4 w-4 text-cyan-400" />

                              <span className="text-xs font-medium text-cyan-300">
                                Qiskit Code
                              </span>
                            </div>

                            <pre className="overflow-x-auto p-4 text-xs leading-relaxed text-emerald-300">
                              <code>{message.code}</code>
                            </pre>
                          </div>
                        )}
                      </div>

                      <span className="mt-1.5 block text-[10px] uppercase tracking-wider text-slate-500">
                        {new Date(
                          message.timestamp,
                        ).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                ))}

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
                          onClick={() =>
                            handleSend(prompt.label)
                          }
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
                  Press Enter to send · Q-loop AI provides
                  educational guidance on quantum concepts
                </p>
              </div>
            </Card>
          </div>

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
                  <div>
                    <div className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-cyan-400">
                      <CircuitBoard className="h-3.5 w-3.5" />
                      Current Circuit
                    </div>

                    <div className="rounded-lg border border-cyan-500/15 bg-slate-950/50 p-3">
                      <code className="block font-mono text-xs leading-relaxed text-cyan-200">
                        {MOCK_CONTEXT.circuit}
                      </code>
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-emerald-400">
                      <Sparkles className="h-3.5 w-3.5" />
                      Simulation Results
                    </div>

                    <div className="rounded-lg border border-emerald-500/15 bg-slate-950/50 p-3">
                      <code className="block font-mono text-xs leading-relaxed text-emerald-200">
                        {MOCK_CONTEXT.simulationResults}
                      </code>
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-amber-400">
                      <Info className="h-3.5 w-3.5" />
                      Errors & Warnings
                    </div>

                    <p className="text-xs text-slate-500">
                      No errors detected. Circuit looks good! ✓
                    </p>
                  </div>

                  <div className="rounded-lg border border-cyan-500/15 bg-cyan-500/5 p-3">
                    <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-cyan-300">
                      <Lightbulb className="h-3.5 w-3.5" />
                      Tutor Tip
                    </div>

                    <p className="text-xs leading-relaxed text-slate-300">
                      The circuit above creates a Bell state — a
                      maximally entangled pair. Ask me "What is a
                      Bell state?" to learn more.
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