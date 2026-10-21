import { useEffect, useMemo, useRef, useState } from 'react'
import { Brain, Bot, CircuitBoard, Plus, Send, Trash2, User, History } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useQLoopCircuit } from '@/context/QLoopCircuitContext'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'

type Message = { id: string; role: 'user' | 'assistant'; content: string; timestamp: number; code?: string }
type Chat = { id: string; title: string; updatedAt: number; messages: Message[] }
const PREFIX = 'qloop:ai-chats:v2:'
const WELCOME = 'Hi! I am your Q-Loop AI Tutor. I can explain quantum algorithms and analyze the circuit currently open in Circuit Builder. I will distinguish theoretical probabilities from finite-shot measurement counts and will not invent simulation results.'

function freshChat(): Chat {
  const now = Date.now()
  return { id: 'chat-' + now + '-' + Math.random().toString(36).slice(2, 7), title: 'New conversation', updatedAt: now, messages: [{ id: 'welcome-' + now, role: 'assistant', content: WELCOME, timestamp: now }] }
}
function readChats(key: string): Chat[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) || '[]')
    return Array.isArray(value) ? value.filter((c) => c && typeof c.id === 'string' && Array.isArray(c.messages)) as Chat[] : []
  } catch { return [] }
}

export default function AIAssistantPage() {
  const { user } = useAuth()
  const { numQubits, operations, simulationResult } = useQLoopCircuit()
  const storageKey = PREFIX + (user?.id || 'guest')
  const [chats, setChats] = useState<Chat[]>([])
  const [activeId, setActiveId] = useState('')
  const [loadedKey, setLoadedKey] = useState('')
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [showCircuit, setShowCircuit] = useState(true)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const stored = readChats(storageKey)
    const initial = stored.length ? stored : [freshChat()]
    setChats(initial)
    setActiveId(initial[0].id)
    setLoadedKey(storageKey)
  }, [storageKey])
  useEffect(() => {
    if (loadedKey !== storageKey) return
    try { localStorage.setItem(storageKey, JSON.stringify(chats)) } catch (error) { console.warn('Chat history could not be saved in this browser', error) }
  }, [chats, loadedKey, storageKey])
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chats, activeId, busy])

  const active = chats.find((chat) => chat.id === activeId) || null
  const circuit = useMemo(() => ({ qubits: numQubits, classical_bits: numQubits, operations: operations.map((op) => ({ ...op })), shots: 1024, framework: 'qiskit_aer' }), [numQubits, operations])
  const sim = useMemo(() => {
    if (!simulationResult) return null
    const counts = simulationResult.counts || Object.fromEntries((simulationResult.histogram || []).map((item) => [item.state, item.count]))
    const probabilities: Record<string, number> = {}
    ;(simulationResult.probabilities || []).forEach((p, i) => { if (p > 1e-10) probabilities[i.toString(2).padStart(numQubits, '0')] = p })
    return { status: simulationResult.status || 'local-result', framework: simulationResult.framework || 'Q-Loop local simulator', shots: simulationResult.shots || 1024, counts, probabilities, gate_count: simulationResult.gate_count ?? operations.length, circuit_depth: simulationResult.circuit_depth, error: simulationResult.error }
  }, [simulationResult, numQubits, operations.length])

  const patchChat = (id: string, fn: (messages: Message[]) => Message[]) => setChats((old) => old.map((chat) => chat.id === id ? { ...chat, messages: fn(chat.messages), updatedAt: Date.now() } : chat))
  const newChat = () => { const chat = freshChat(); setChats((old) => [chat, ...old]); setActiveId(chat.id); setInput('') }
  const deleteChat = (id: string) => {
    const left = chats.filter((chat) => chat.id !== id)
    if (left.length) { setChats(left); if (activeId === id) setActiveId(left[0].id) }
    else { const chat = freshChat(); setChats([chat]); setActiveId(chat.id) }
  }

  const send = async () => {
    const question = input.trim()
    if (!question || busy) return
    const chat = active || freshChat()
    if (!active) { setChats((old) => [chat, ...old]); setActiveId(chat.id) }
    const userMessage: Message = { id: 'user-' + Date.now(), role: 'user', content: question, timestamp: Date.now() }
    const title = chat.messages.every((m) => m.role !== 'user') ? question.slice(0, 48) : chat.title
    setChats((old) => old.map((c) => c.id === chat.id ? { ...c, title, updatedAt: Date.now(), messages: [...c.messages, userMessage] } : c))
    setInput('')
    setBusy(true)
    try {
      const base = import.meta.env.VITE_API_URL?.trim() || 'https://q-loop.onrender.com'
      const wantsCode = /\b(create|write|generate|code|program|qiskit|pennylane|cirq)\b/i.test(question)
      const response = await fetch(base + '/api/ai/' + (wantsCode ? 'generate-code' : 'explain'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: wantsCode ? 'generate_code' : 'explain', question, context: { learner_level: 'beginner', circuit, simulation_result: sim } }),
      })
      if (!response.ok) throw new Error('AI request failed (' + response.status + ')')
      const data = await response.json()
      patchChat(chat.id, (messages) => [...messages, { id: 'assistant-' + Date.now(), role: 'assistant', content: data.response || 'The AI service returned an empty response.', code: data.code_example || undefined, timestamp: Date.now() }])
    } catch (error) {
      console.error('AI Tutor request failed:', error)
      patchChat(chat.id, (messages) => [...messages, { id: 'assistant-' + Date.now(), role: 'assistant', content: 'I could not reach the Q-Loop AI service. Your question is saved in this browser. Please retry; I have not invented a simulation result.', timestamp: Date.now() }])
    } finally { setBusy(false) }
  }

  const circuitText = operations.length ? operations.map((op) => op.gate + (op.control === undefined ? '' : ' control q' + op.control) + ' target q' + op.target + (op.parameter === undefined ? '' : ' θ=' + op.parameter)).join(' → ') : 'No gates placed yet.'

  return <div className="min-h-[calc(100vh-4rem)] bg-slate-950 text-slate-100"><div className="mx-auto max-w-7xl px-3 py-6 sm:px-6">
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><div className="rounded-xl bg-cyan-500/10 p-3"><Brain className="h-6 w-6 text-cyan-300" /></div><div><h1 className="text-2xl font-bold">Q-Loop AI Tutor</h1><p className="text-sm text-slate-400">Circuit-aware, simulator-grounded quantum learning</p></div></div><Button onClick={newChat} className="bg-cyan-600 text-white hover:bg-cyan-500"><Plus className="mr-2 h-4 w-4" /> New chat</Button></div>
    <div className="grid gap-4 lg:grid-cols-[235px_minmax(0,1fr)]">
      <Card className="border-white/10 bg-slate-900/70 p-3"><div className="mb-3 flex items-center gap-2 text-sm font-semibold"><History className="h-4 w-4" /> Chat history</div><div className="max-h-[65vh] space-y-2 overflow-y-auto">{chats.slice().sort((a,b)=>b.updatedAt-a.updatedAt).map((chat)=><div key={chat.id} className={cn('flex items-center gap-1 rounded-lg border',activeId===chat.id?'border-cyan-500/40 bg-cyan-500/10':'border-white/5')}><button onClick={()=>setActiveId(chat.id)} className="min-w-0 flex-1 px-3 py-2 text-left"><span className="block truncate text-xs">{chat.title}</span><span className="text-[10px] text-slate-500">{new Date(chat.updatedAt).toLocaleDateString()} · {chat.messages.filter((m)=>m.role==='user').length} prompts</span></button><button onClick={()=>deleteChat(chat.id)} aria-label="Delete chat" className="p-2 text-slate-500 hover:text-rose-300"><Trash2 className="h-3.5 w-3.5" /></button></div>)}</div><p className="mt-4 text-[10px] leading-relaxed text-slate-500">Saved in this browser, separated by signed-in account. Not synced to other devices yet.</p></Card>
      <div className="min-w-0 space-y-4">
        <Card className="overflow-hidden border-cyan-500/20 bg-slate-900/70"><button onClick={()=>setShowCircuit((v)=>!v)} className="flex w-full items-center justify-between px-4 py-3 text-left"><span className="flex items-center gap-2 text-sm font-semibold text-cyan-200"><CircuitBoard className="h-4 w-4" /> Current circuit context</span><span className="text-xs text-slate-400">{showCircuit?'Hide':'Show'}</span></button>{showCircuit&&<div className="border-t border-white/10 px-4 py-3"><p className="text-sm">{numQubits} qubits · {operations.length} gates/operations</p><p className="mt-2 break-words text-xs text-slate-300">{circuitText}</p><details className="mt-2"><summary className="cursor-pointer text-xs text-slate-500">Inspect exact circuit JSON sent to AI</summary><pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-all text-[10px] text-slate-400">{JSON.stringify(circuit,null,2)}</pre></details>{sim?<div className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs"><p className="font-semibold text-emerald-300">Latest simulation context</p><p className="mt-1">Backend: {sim.framework} · Shots: {sim.shots}</p><p className="mt-1 break-words">Observed counts: {JSON.stringify(sim.counts)}</p><p className="mt-1 break-words">Probabilities: {JSON.stringify(sim.probabilities)}</p></div>:<p className="mt-2 text-xs text-amber-300">No completed simulation result is attached. Ask for a circuit analysis to request a backend simulation when supported.</p>}<p className="mt-2 text-[10px] text-slate-500">The live circuit-builder state is sent with each question. Re-run simulation after editing gates to refresh measured counts.</p></div>}</Card>
        <Card className="flex h-[65vh] min-h-[440px] flex-col overflow-hidden border-cyan-500/20 bg-slate-900/70"><div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">{(active?.messages||[]).map((m)=><div key={m.id} className={cn('flex items-start gap-3',m.role==='user'&&'flex-row-reverse')}><div className={cn('rounded-lg p-2',m.role==='user'?'bg-violet-500/10 text-violet-300':'bg-cyan-500/10 text-cyan-300')}>{m.role==='user'?<User className="h-5 w-5"/>:<Bot className="h-5 w-5"/>}</div><div className={cn('max-w-[88%] rounded-2xl px-4 py-3 text-sm',m.role==='user'?'bg-violet-500/15':'bg-slate-800')}><p className="whitespace-pre-wrap break-words">{m.content}</p>{m.code&&<pre className="mt-3 overflow-x-auto rounded-lg bg-slate-950 p-3 text-xs text-emerald-300"><code>{m.code}</code></pre>}<span className="mt-2 block text-[10px] text-slate-500">{new Date(m.timestamp).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</span></div></div>)}{busy&&<div className="flex items-center gap-2 text-sm text-cyan-300"><Bot className="h-4 w-4"/> Analyzing question and circuit data…</div>}<div ref={endRef}/></div><div className="border-t border-white/10 p-3 sm:p-4"><div className="flex gap-2"><input value={input} onChange={(e)=>setInput(e.target.value)} onKeyDown={(e)=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();void send()}}} placeholder="Ask about this circuit, its gates, or predicted measurements…" disabled={busy} className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-cyan-500/50"/><Button onClick={()=>void send()} disabled={busy||!input.trim()} className="bg-cyan-600 text-white hover:bg-cyan-500"><Send className="h-4 w-4"/></Button></div><p className="mt-2 text-[10px] text-slate-500">Finite-shot counts vary randomly. Theoretical probabilities and measured counts are reported separately.</p></div></Card>
      </div>
    </div>
  </div></div>
}
