import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'
import {
  Users, GraduationCap, TrendingUp, Award, AlertTriangle, Brain,
  Activity, Target, Clock, ChevronRight,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { MODULES } from '@/lib/quantum/lessons'

// ─── Types ────────────────────────────────────────────────────────────
interface LearnerProfile {
  id: string
  email: string
  display_name: string | null
  role: string
  learning_level: string
  streak_days: number
  total_study_minutes: number
  created_at?: string
}

interface LessonProgress {
  user_id: string
  lesson_id: string
  module_id: string
  completed: boolean
  completed_at: string | null
}

interface QuizAttempt {
  user_id: string
  lesson_id: string
  score: number
  total: number
  passed: boolean
  created_at: string
}

interface CircuitAttempt {
  user_id: string
  challenge_id: string
  score: number
  max_score: number
  created_at: string
}

interface MistakeRecord {
  user_id: string
  module: string
  type: string
  count: number
  created_at: string
}

interface LearnerRow {
  id: string
  name: string
  email: string
  lessonsCompleted: number
  quizAvg: number
  challengesCompleted: number
  lastActive: string | null
}

interface ActivityItem {
  learnerId: string
  learnerName: string
  action: string
  detail: string
  timestamp: string
}

// ─── Mock fallback data ────────────────────────────────────────────────
const MOCK_LEARNERS: LearnerProfile[] = [
  { id: 'u1', email: 'alice@q.edu', display_name: 'Alice Chen', role: 'student', learning_level: 'intermediate', streak_days: 7, total_study_minutes: 320 },
  { id: 'u2', email: 'bob@q.edu', display_name: 'Bob Patel', role: 'student', learning_level: 'beginner', streak_days: 3, total_study_minutes: 145 },
  { id: 'u3', email: 'carol@q.edu', display_name: 'Carol Jones', role: 'student', learning_level: 'advanced', streak_days: 12, total_study_minutes: 510 },
  { id: 'u4', email: 'dan@q.edu', display_name: 'Dan Lee', role: 'student', learning_level: 'beginner', streak_days: 1, total_study_minutes: 60 },
  { id: 'u5', email: 'eve@q.edu', display_name: 'Eve Garcia', role: 'student', learning_level: 'intermediate', streak_days: 5, total_study_minutes: 230 },
]

const MOCK_LESSON_PROGRESS: LessonProgress[] = [
  { user_id: 'u1', lesson_id: 'linear-algebra', module_id: 'math-foundations', completed: true, completed_at: '2024-06-01' },
  { user_id: 'u1', lesson_id: 'complex-numbers', module_id: 'math-foundations', completed: true, completed_at: '2024-06-02' },
  { user_id: 'u1', lesson_id: 'what-is-quantum', module_id: 'quantum-foundations', completed: true, completed_at: '2024-06-03' },
  { user_id: 'u1', lesson_id: 'superposition', module_id: 'quantum-foundations', completed: true, completed_at: '2024-06-04' },
  { user_id: 'u1', lesson_id: 'measurement', module_id: 'quantum-foundations', completed: true, completed_at: '2024-06-05' },
  { user_id: 'u2', lesson_id: 'linear-algebra', module_id: 'math-foundations', completed: true, completed_at: '2024-06-03' },
  { user_id: 'u2', lesson_id: 'what-is-quantum', module_id: 'quantum-foundations', completed: true, completed_at: '2024-06-06' },
  { user_id: 'u3', lesson_id: 'linear-algebra', module_id: 'math-foundations', completed: true, completed_at: '2024-05-20' },
  { user_id: 'u3', lesson_id: 'complex-numbers', module_id: 'math-foundations', completed: true, completed_at: '2024-05-21' },
  { user_id: 'u3', lesson_id: 'what-is-quantum', module_id: 'quantum-foundations', completed: true, completed_at: '2024-05-22' },
  { user_id: 'u3', lesson_id: 'superposition', module_id: 'quantum-foundations', completed: true, completed_at: '2024-05-23' },
  { user_id: 'u3', lesson_id: 'single-qubit-gates', module_id: 'quantum-circuits', completed: true, completed_at: '2024-05-24' },
  { user_id: 'u3', lesson_id: 'multi-qubit-gates', module_id: 'quantum-circuits', completed: true, completed_at: '2024-05-25' },
  { user_id: 'u3', lesson_id: 'deutsch-jozsa', module_id: 'core-algorithms', completed: true, completed_at: '2024-05-26' },
  { user_id: 'u4', lesson_id: 'what-is-quantum', module_id: 'quantum-foundations', completed: true, completed_at: '2024-06-08' },
  { user_id: 'u5', lesson_id: 'linear-algebra', module_id: 'math-foundations', completed: true, completed_at: '2024-06-04' },
  { user_id: 'u5', lesson_id: 'complex-numbers', module_id: 'math-foundations', completed: true, completed_at: '2024-06-05' },
  { user_id: 'u5', lesson_id: 'what-is-quantum', module_id: 'quantum-foundations', completed: true, completed_at: '2024-06-07' },
  { user_id: 'u5', lesson_id: 'superposition', module_id: 'quantum-foundations', completed: true, completed_at: '2024-06-08' },
]

const MOCK_QUIZ_ATTEMPTS: QuizAttempt[] = [
  { user_id: 'u1', lesson_id: 'linear-algebra', score: 2, total: 2, passed: true, created_at: '2024-06-01' },
  { user_id: 'u1', lesson_id: 'what-is-quantum', score: 2, total: 2, passed: true, created_at: '2024-06-03' },
  { user_id: 'u1', lesson_id: 'superposition', score: 1, total: 2, passed: false, created_at: '2024-06-04' },
  { user_id: 'u2', lesson_id: 'linear-algebra', score: 1, total: 2, passed: false, created_at: '2024-06-03' },
  { user_id: 'u3', lesson_id: 'linear-algebra', score: 2, total: 2, passed: true, created_at: '2024-05-20' },
  { user_id: 'u3', lesson_id: 'what-is-quantum', score: 2, total: 2, passed: true, created_at: '2024-05-22' },
  { user_id: 'u3', lesson_id: 'superposition', score: 2, total: 2, passed: true, created_at: '2024-05-23' },
  { user_id: 'u3', lesson_id: 'single-qubit-gates', score: 2, total: 2, passed: true, created_at: '2024-05-24' },
  { user_id: 'u5', lesson_id: 'linear-algebra', score: 2, total: 2, passed: true, created_at: '2024-06-04' },
  { user_id: 'u5', lesson_id: 'what-is-quantum', score: 1, total: 2, passed: false, created_at: '2024-06-07' },
]

const MOCK_CIRCUIT_ATTEMPTS: CircuitAttempt[] = [
  { user_id: 'u1', challenge_id: 'bell-state', score: 90, max_score: 100, created_at: '2024-06-05' },
  { user_id: 'u3', challenge_id: 'bell-state', score: 100, max_score: 100, created_at: '2024-05-25' },
  { user_id: 'u3', challenge_id: 'ghz-state', score: 85, max_score: 100, created_at: '2024-05-26' },
  { user_id: 'u5', challenge_id: 'bell-state', score: 70, max_score: 100, created_at: '2024-06-08' },
]

const MOCK_MISTAKES: MistakeRecord[] = [
  { user_id: 'u1', module: 'quantum-foundations', type: 'measurement-collapse', count: 3, created_at: '2024-06-04' },
  { user_id: 'u2', module: 'math-foundations', type: 'tensor-product', count: 2, created_at: '2024-06-03' },
  { user_id: 'u2', module: 'quantum-foundations', type: 'superposition', count: 2, created_at: '2024-06-06' },
  { user_id: 'u3', module: 'quantum-circuits', type: 'gate-application', count: 1, created_at: '2024-05-24' },
  { user_id: 'u5', module: 'math-foundations', type: 'complex-arithmetic', count: 2, created_at: '2024-06-04' },
  { user_id: 'u5', module: 'quantum-foundations', type: 'measurement-collapse', count: 1, created_at: '2024-06-07' },
]

// ─── Helpers ──────────────────────────────────────────────────────────
function timeAgo(iso: string | null): string {
  if (!iso) return 'Never'
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

function isToday(iso: string | null): boolean {
  if (!iso) return false
  const d = new Date(iso)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
}

export default function InstructorPage() {
  const { user, profile, loading: authLoading } = useAuth()

  const [loading, setLoading] = useState(true)
  const [learners, setLearners] = useState<LearnerProfile[]>([])
  const [lessonProgress, setLessonProgress] = useState<LessonProgress[]>([])
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([])
  const [circuitAttempts, setCircuitAttempts] = useState<CircuitAttempt[]>([])
  const [mistakes, setMistakes] = useState<MistakeRecord[]>([])

  useEffect(() => {
    if (!user) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const [pRes, lpRes, qaRes, caRes, mhRes] = await Promise.all([
          supabase.from('profiles').select('*').eq('role', 'student'),
          supabase.from('lesson_progress').select('*'),
          supabase.from('quiz_attempts').select('*').order('created_at', { ascending: false }),
          supabase.from('circuit_attempts').select('*').order('created_at', { ascending: false }),
          supabase.from('mistake_history').select('*').order('created_at', { ascending: false }),
        ])

        if (cancelled) return

        setLearners((pRes.data ?? []) as LearnerProfile[])
        setLessonProgress((lpRes.data ?? []) as LessonProgress[])
        setQuizAttempts((qaRes.data ?? []) as QuizAttempt[])
        setCircuitAttempts((caRes.data ?? []) as CircuitAttempt[])
        setMistakes((mhRes.data ?? []) as MistakeRecord[])
      } catch {
        if (cancelled) return
        // Fall back to mock data on error
        setLearners(MOCK_LEARNERS)
        setLessonProgress(MOCK_LESSON_PROGRESS)
        setQuizAttempts(MOCK_QUIZ_ATTEMPTS)
        setCircuitAttempts(MOCK_CIRCUIT_ATTEMPTS)
        setMistakes(MOCK_MISTAKES)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [user])

  // ─── Access control ──────────────────────────────────────────────────
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
        <Card className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border-cyan-500/20">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/10 ring-1 ring-cyan-500/30">
              <Brain className="h-8 w-8 text-cyan-400" />
            </div>
            <CardTitle className="text-2xl text-white">Instructor Access Required</CardTitle>
            <p className="text-sm text-slate-400 mt-2">
              Sign in with an instructor account to view the teaching dashboard.
            </p>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-semibold">
              <Link to="/auth">Sign in to continue</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!authLoading && user && profile?.role !== 'instructor') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
        <Card className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border-red-500/20">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 ring-1 ring-red-500/30">
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>
            <CardTitle className="text-2xl text-white">Access Denied</CardTitle>
            <p className="text-sm text-slate-400 mt-2">
              This dashboard is restricted to instructors. Your account
              {profile?.email ? ` (${profile.email})` : ''} does not have instructor privileges.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-semibold">
              <Link to="/dashboard">Back to your dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ─── Loading state ───────────────────────────────────────────────────
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
          <p className="text-sm text-slate-400">Loading instructor dashboard…</p>
        </div>
      </div>
    )
  }

  // ─── Derived data ────────────────────────────────────────────────────
  const totalLessonsAvailable = MODULES.reduce((s, m) => s + m.lessons.length, 0)

  // Build per-learner rows
  const learnerRows: LearnerRow[] = learners.map((l) => {
    const lp = lessonProgress.filter((p) => p.user_id === l.id && p.completed)
    const qa = quizAttempts.filter((q) => q.user_id === l.id)
    const ca = circuitAttempts.filter((c) => c.user_id === l.id)
    const quizAvg = qa.length > 0
      ? Math.round((qa.reduce((s, q) => s + (q.score / q.total) * 100, 0) / qa.length))
      : 0
    const allDates = [
      ...qa.map((q) => q.created_at),
      ...ca.map((c) => c.created_at),
      ...lp.map((p) => p.completed_at).filter(Boolean) as string[],
    ].sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
    return {
      id: l.id,
      name: l.display_name ?? l.email,
      email: l.email,
      lessonsCompleted: lp.length,
      quizAvg,
      challengesCompleted: ca.length,
      lastActive: allDates[0] ?? null,
    }
  })

  // ─── Stats ───────────────────────────────────────────────────────────
  const totalLearners = learners.length
  const allQuizScores = quizAttempts.map((q) => (q.score / q.total) * 100)
  const avgQuizScore = allQuizScores.length > 0
    ? Math.round(allQuizScores.reduce((s, v) => s + v, 0) / allQuizScores.length)
    : 0
  const avgModulesCompleted = totalLearners > 0
    ? (learnerRows.reduce((s, r) => s + r.lessonsCompleted, 0) / totalLearners / totalLessonsAvailable) * 100
    : 0
  const activeToday = learnerRows.filter((r) => isToday(r.lastActive)).length

  const statCards = [
    { label: 'Total Learners', value: totalLearners, icon: Users, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { label: 'Avg Quiz Score', value: `${avgQuizScore}%`, icon: Award, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Modules Completed', value: `${avgModulesCompleted.toFixed(0)}%`, icon: GraduationCap, color: 'text-violet-400', bg: 'bg-violet-500/10' },
    { label: 'Active Today', value: activeToday, icon: Activity, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ]

  // ─── Common mistakes ─────────────────────────────────────────────────
  const mistakeAgg = new Map<string, { type: string; module: string; count: number }>()
  mistakes.forEach((m) => {
    const key = `${m.module}:${m.type}`
    const existing = mistakeAgg.get(key)
    if (existing) existing.count += m.count
    else mistakeAgg.set(key, { type: m.type, module: m.module, count: m.count })
  })
  const commonMistakes = Array.from(mistakeAgg.values()).sort((a, b) => b.count - a.count).slice(0, 6)
  const maxMistakeCount = Math.max(...commonMistakes.map((m) => m.count), 1)

  // ─── Weak concepts (lowest completion modules) ───────────────────────
  const moduleCompletion = MODULES.map((mod) => {
    const lessonsInModule = mod.lessons.map((l) => l.id)
    const relevant = lessonProgress.filter(
      (p) => p.module_id === mod.id && p.completed
    )
    const uniqueCompleted = new Set(relevant.map((p) => p.lesson_id)).size
    const learnerCount = Math.max(learners.length, 1)
    const completionRate = (uniqueCompleted / (lessonsInModule.length * learnerCount)) * 100
    return {
      id: mod.id,
      title: mod.title,
      color: mod.color,
      lessonsInModule: lessonsInModule.length,
      uniqueCompleted,
      completionRate: Math.min(completionRate, 100),
    }
  })
  const weakConcepts = [...moduleCompletion]
    .sort((a, b) => a.completionRate - b.completionRate)
    .slice(0, 5)

  // ─── Module completion overview ─────────────────────────────────────
  const moduleOverview = moduleCompletion.sort((a, b) => b.completionRate - a.completionRate)

  // ─── Recent activity feed ────────────────────────────────────────────
  const learnerNameMap = new Map(learners.map((l) => [l.id, l.display_name ?? l.email]))
  const activityItems: ActivityItem[] = []
  quizAttempts.slice(0, 20).forEach((q) => {
    activityItems.push({
      learnerId: q.user_id,
      learnerName: learnerNameMap.get(q.user_id) ?? 'Unknown',
      action: q.passed ? 'Passed quiz' : 'Failed quiz',
      detail: q.lesson_id,
      timestamp: q.created_at,
    })
  })
  circuitAttempts.slice(0, 20).forEach((c) => {
    activityItems.push({
      learnerId: c.user_id,
      learnerName: learnerNameMap.get(c.user_id) ?? 'Unknown',
      action: 'Completed challenge',
      detail: c.challenge_id,
      timestamp: c.created_at,
    })
  })
  activityItems.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  const recentActivity = activityItems.slice(0, 10)

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* ─── Header ─────────────────────────────────────────────── */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Instructor Dashboard
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              {totalLearners} learners · {totalLessonsAvailable} lessons across {MODULES.length} modules
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-2.5 backdrop-blur-sm">
            <GraduationCap className="h-5 w-5 text-cyan-400" />
            <span className="text-sm font-medium text-cyan-300">
              {profile?.display_name ?? profile?.email ?? 'Instructor'}
            </span>
          </div>
        </div>

        {/* ─── Stat cards ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((s) => (
            <Card key={s.label} className="bg-slate-900/60 backdrop-blur-xl border-slate-700/50">
              <CardContent className="flex items-center gap-4 pt-6">
                <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', s.bg)}>
                  <s.icon className={cn('h-6 w-6', s.color)} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{s.value}</p>
                  <p className="text-xs text-slate-400">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ─── Learner progress table ───────────────────────────── */}
        <Card className="mt-8 bg-slate-900/60 backdrop-blur-xl border-slate-700/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Users className="h-5 w-5 text-cyan-400" />
              Learner Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            {learnerRows.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">No learners enrolled yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700/50 text-left text-xs uppercase tracking-wider text-slate-400">
                      <th className="pb-3 pr-4 font-medium">Name</th>
                      <th className="pb-3 pr-4 font-medium">Email</th>
                      <th className="pb-3 pr-4 font-medium">Lessons</th>
                      <th className="pb-3 pr-4 font-medium">Quiz Avg</th>
                      <th className="pb-3 pr-4 font-medium">Challenges</th>
                      <th className="pb-3 pr-4 font-medium">Last Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {learnerRows.map((r) => (
                      <tr key={r.id} className="border-b border-slate-800/50 transition-colors hover:bg-slate-800/30">
                        <td className="py-3 pr-4 font-medium text-white">{r.name}</td>
                        <td className="py-3 pr-4 text-slate-400">{r.email}</td>
                        <td className="py-3 pr-4">
                          <span className="text-cyan-400">{r.lessonsCompleted}</span>
                          <span className="text-slate-500"> / {totalLessonsAvailable}</span>
                        </td>
                        <td className="py-3 pr-4">
                          <span className={cn(
                            'font-medium',
                            r.quizAvg >= 80 ? 'text-emerald-400' : r.quizAvg >= 50 ? 'text-amber-400' : 'text-red-400'
                          )}>
                            {r.quizAvg}%
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-slate-300">{r.challengesCompleted}</td>
                        <td className="py-3 pr-4 text-slate-400">{timeAgo(r.lastActive)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ─── Common mistakes + Weak concepts ───────────────────── */}
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Common mistakes */}
          <Card className="bg-slate-900/60 backdrop-blur-xl border-slate-700/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
                Common Mistakes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {commonMistakes.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-400">No mistakes recorded yet.</p>
              ) : (
                commonMistakes.map((m, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-200">{m.type}</span>
                        <span className="text-xs text-slate-500">· {m.module}</span>
                      </div>
                      <span className="text-xs font-semibold text-amber-400">{m.count}×</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                        style={{ width: `${(m.count / maxMistakeCount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Weak concepts */}
          <Card className="bg-slate-900/60 backdrop-blur-xl border-slate-700/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Brain className="h-5 w-5 text-red-400" />
                Weak Concepts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {weakConcepts.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-400">No module data available.</p>
              ) : (
                weakConcepts.map((c) => (
                  <div key={c.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-200">{c.title}</span>
                      <span className="text-xs font-semibold text-red-400">{c.completionRate.toFixed(0)}%</span>
                    </div>
                    <Progress value={c.completionRate} className="h-2 bg-slate-800" />
                    <p className="text-xs text-slate-500">
                      {c.uniqueCompleted} completions across {c.lessonsInModule} lessons
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* ─── Module completion overview ──────────────────────── */}
        <Card className="mt-8 bg-slate-900/60 backdrop-blur-xl border-slate-700/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Target className="h-5 w-5 text-cyan-400" />
              Module Completion Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {moduleOverview.map((m) => (
                <div key={m.id} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: m.color }}
                      />
                      <span className="font-medium text-slate-200">{m.title}</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-300">{m.completionRate.toFixed(0)}%</span>
                  </div>
                  <Progress value={m.completionRate} className="h-2 bg-slate-800" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ─── Recent activity feed ─────────────────────────────── */}
        <Card className="mt-8 bg-slate-900/60 backdrop-blur-xl border-slate-700/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Activity className="h-5 w-5 text-cyan-400" />
              Recent Learner Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">No recent activity.</p>
            ) : (
              <ul className="space-y-2">
                {recentActivity.map((a, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between rounded-lg border border-slate-800/50 bg-slate-800/20 px-4 py-3 transition-colors hover:bg-slate-800/40"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/10">
                        <Clock className="h-4 w-4 text-cyan-400" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-200">
                          <span className="font-medium">{a.learnerName}</span>{' '}
                          <span className="text-slate-400">{a.action}</span>
                        </p>
                        <p className="text-xs text-slate-500">{a.detail}</p>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400">{timeAgo(a.timestamp)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* ─── Footer link ──────────────────────────────────────── */}
        <div className="mt-8 flex justify-center">
          <Button asChild variant="ghost" className="text-slate-400 hover:text-cyan-400">
            <Link to="/dashboard">
              Back to your dashboard
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
