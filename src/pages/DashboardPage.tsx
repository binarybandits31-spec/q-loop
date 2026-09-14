import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'
import {
  TrendingUp, BookOpen, ClipboardCheck, CircuitBoard, Clock,
  Flame, Award, Target, Activity, Brain, ChevronRight, Trophy, Zap,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { MODULES } from '@/lib/quantum/lessons'
import { generateRecommendations, type ProgressData } from '@/lib/quantum/recommendations'

interface LessonProgress {
  lesson_id: string
  module_id: string
  completed: boolean
  completed_at: string | null
}

interface QuizAttempt {
  lesson_id: string
  score: number
  total: number
  passed: boolean
  created_at: string
}

interface CircuitAttempt {
  challenge_id: string
  score: number
  max_score: number
  created_at: string
}

interface MistakeRecord {
  module: string
  type: string
  count: number
}

interface RecommendationRow {
  type: string
  title: string
  description: string
  target_id: string
  priority: 'low' | 'medium' | 'high'
}

interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  earned_at: string
}

// ─── Mock fallback data ────────────────────────────────────────────────
const MOCK_PROGRESS: LessonProgress[] = [
  { lesson_id: 'linear-algebra', module_id: 'math-foundations', completed: true, completed_at: '2024-01-15' },
  { lesson_id: 'complex-numbers', module_id: 'math-foundations', completed: true, completed_at: '2024-01-16' },
  { lesson_id: 'what-is-quantum', module_id: 'quantum-foundations', completed: true, completed_at: '2024-01-17' },
  { lesson_id: 'superposition', module_id: 'quantum-foundations', completed: true, completed_at: '2024-01-18' },
  { lesson_id: 'single-qubit-gates', module_id: 'quantum-circuits', completed: true, completed_at: '2024-01-19' },
]

const MOCK_QUIZZES: QuizAttempt[] = [
  { lesson_id: 'linear-algebra', score: 2, total: 2, passed: true, created_at: '2024-01-15' },
  { lesson_id: 'what-is-quantum', score: 2, total: 2, passed: true, created_at: '2024-01-17' },
  { lesson_id: 'superposition', score: 1, total: 2, passed: false, created_at: '2024-01-18' },
]

const MOCK_CIRCUITS: CircuitAttempt[] = [
  { challenge_id: 'bell-state', score: 90, max_score: 100, created_at: '2024-01-19' },
  { challenge_id: 'ghz-state', score: 75, max_score: 100, created_at: '2024-01-20' },
]

const MOCK_MISTAKES: MistakeRecord[] = [
  { module: 'quantum-circuits', type: 'gate-application', count: 4 },
  { module: 'quantum-foundations', type: 'measurement', count: 2 },
]

const MOCK_RECOMMENDATIONS: RecommendationRow[] = [
  { type: 'lesson', title: 'Continue: Multi-Qubit Gates & Entanglement', description: 'Pick up where you left off in Quantum Circuits. ~30 min.', target_id: 'multi-qubit-gates', priority: 'high' },
  { type: 'review', title: 'Review: Superposition', description: 'Your quiz score was 1/2. Review to strengthen understanding.', target_id: 'superposition', priority: 'high' },
  { type: 'challenge', title: 'Try a Circuit Challenge', description: 'Put your knowledge to the test with a hands-on challenge.', target_id: 'circuit-challenge', priority: 'medium' },
]

const MOCK_ACHIEVEMENTS: Achievement[] = [
  { id: 'first-lesson', title: 'First Steps', description: 'Completed your first lesson', icon: 'BookOpen', earned_at: '2024-01-15' },
  { id: 'streak-3', title: 'On Fire', description: '3-day study streak', icon: 'Flame', earned_at: '2024-01-17' },
  { id: 'first-quiz', title: 'Quiz Master', description: 'Passed your first quiz', icon: 'ClipboardCheck', earned_at: '2024-01-15' },
  { id: 'first-circuit', title: 'Circuit Builder', description: 'Built your first circuit', icon: 'CircuitBoard', earned_at: '2024-01-19' },
]

const MOCK_WEEKLY = [45, 60, 30, 90, 75, 120, 50] // minutes per day

const ACHIEVEMENT_ICONS: Record<string, typeof BookOpen> = {
  BookOpen, Flame, ClipboardCheck, CircuitBoard, Award, Trophy, Zap, Target, Brain,
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function DashboardPage() {
  const { user, profile, loading: authLoading } = useAuth()

  const [loading, setLoading] = useState(true)
  const [lessonProgress, setLessonProgress] = useState<LessonProgress[]>([])
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([])
  const [circuitAttempts, setCircuitAttempts] = useState<CircuitAttempt[]>([])
  const [mistakes, setMistakes] = useState<MistakeRecord[]>([])
  const [recommendations, setRecommendations] = useState<RecommendationRow[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [weeklyActivity, setWeeklyActivity] = useState<number[]>([])

  useEffect(() => {
    if (!user) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const [lpRes, qaRes, caRes, mhRes, rcRes, acRes] = await Promise.all([
          supabase.from('lesson_progress').select('*').eq('user_id', user.id),
          supabase.from('quiz_attempts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
          supabase.from('circuit_attempts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
          supabase.from('mistake_history').select('*').eq('user_id', user.id),
          supabase.from('recommendations').select('*').eq('user_id', user.id).order('priority', { ascending: true }).limit(5),
          supabase.from('achievements').select('*').eq('user_id', user.id).order('earned_at', { ascending: false }).limit(6),
        ])

        if (cancelled) return

        const lp = (lpRes.data ?? []) as LessonProgress[]
        const qa = (qaRes.data ?? []) as QuizAttempt[]
        const ca = (caRes.data ?? []) as CircuitAttempt[]
        const mh = (mhRes.data ?? []) as MistakeRecord[]
        const rc = (rcRes.data ?? []) as RecommendationRow[]
        const ac = (acRes.data ?? []) as Achievement[]

        setLessonProgress(lp)
        setQuizAttempts(qa)
        setCircuitAttempts(ca)
        setMistakes(mh)
        setAchievements(ac)

        // Generate recommendations from progress if DB recommendations empty
        if (rc.length > 0) {
          setRecommendations(rc)
        } else {
          const progressData: ProgressData = {
            completedLessons: lp.filter((p) => p.completed).map((p) => p.lesson_id),
            quizScores: Object.fromEntries(
              qa.map((q) => [q.lesson_id, { score: q.score, total: q.total }])
            ),
            challengeScores: Object.fromEntries(
              ca.map((c) => [c.challenge_id, { score: c.score, maxScore: c.max_score }])
            ),
            mistakes: mh,
          }
          setRecommendations(generateRecommendations(progressData) as unknown as RecommendationRow[])
        }

        // Compute weekly activity from quiz/circuit timestamps (last 7 days)
        const now = new Date()
        const dayBuckets = Array(7).fill(0)
        const allActivity = [...qa, ...ca]
        allActivity.forEach((item) => {
          const d = new Date(item.created_at)
          const diff = Math.floor((now.getTime() - d.getTime()) / 86_400_000)
          if (diff >= 0 && diff < 7) dayBuckets[6 - diff] += 1
        })
        // Convert counts to pseudo-minutes (15 min per activity) or use mock if all zero
        const weekly = dayBuckets.some((v) => v > 0)
          ? dayBuckets.map((c) => c * 15)
          : MOCK_WEEKLY
        setWeeklyActivity(weekly)
      } catch {
        if (cancelled) return
        // Fall back to mock data on error
        setLessonProgress(MOCK_PROGRESS)
        setQuizAttempts(MOCK_QUIZZES)
        setCircuitAttempts(MOCK_CIRCUITS)
        setMistakes(MOCK_MISTAKES)
        setRecommendations(MOCK_RECOMMENDATIONS)
        setAchievements(MOCK_ACHIEVEMENTS)
        setWeeklyActivity(MOCK_WEEKLY)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [user])

  // ─── Not signed in ────────────────────────────────────────────────────
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
        <Card className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border-cyan-500/20">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/10 ring-1 ring-cyan-500/30">
              <Brain className="h-8 w-8 text-cyan-400" />
            </div>
            <CardTitle className="text-2xl text-white">Sign in to Q-loop</CardTitle>
            <p className="text-sm text-slate-400 mt-2">
              Track your quantum learning progress, streaks, and achievements.
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

  // ─── Loading state ────────────────────────────────────────────────────
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
          <p className="text-sm text-slate-400">Loading your dashboard…</p>
        </div>
      </div>
    )
  }

  // ─── Derived stats ────────────────────────────────────────────────────
  const lessonsCompleted = lessonProgress.filter((p) => p.completed).length
  const quizzesPassed = quizAttempts.filter((q) => q.passed).length
  const circuitsBuilt = circuitAttempts.length
  const studyMinutes = profile?.total_study_minutes ?? 0
  const streakDays = profile?.streak_days ?? 0

  // Per-module progress
  const moduleProgress = MODULES.map((mod) => {
    const totalLessons = mod.lessons.length
    const completed = mod.lessons.filter((l) =>
      lessonProgress.some((p) => p.lesson_id === l.id && p.completed)
    ).length
    const pct = totalLessons > 0 ? (completed / totalLessons) * 100 : 0
    return { ...mod, completed, totalLessons, pct }
  })

  const overallPct =
    moduleProgress.length > 0
      ? moduleProgress.reduce((s, m) => s + m.pct, 0) / moduleProgress.length
      : 0

  const maxWeekly = Math.max(...weeklyActivity, 1)

  const statCards = [
    { label: 'Lessons Completed', value: lessonsCompleted, icon: BookOpen, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { label: 'Quizzes Passed', value: quizzesPassed, icon: ClipboardCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Circuits Built', value: circuitsBuilt, icon: CircuitBoard, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Study Minutes', value: studyMinutes, icon: Clock, color: 'text-violet-400', bg: 'bg-violet-500/10' },
  ]

  const quickActions = [
    { to: '/learn', label: 'Continue Learning', icon: BookOpen, color: 'text-cyan-400' },
    { to: '/circuit', label: 'Build a Circuit', icon: CircuitBoard, color: 'text-amber-400' },
    { to: '/challenges', label: 'Take a Challenge', icon: Target, color: 'text-emerald-400' },
  ]

  const priorityStyles: Record<string, string> = {
    high: 'bg-red-500/10 text-red-400 border-red-500/20',
    medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    low: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  }

  const recIcons: Record<string, typeof BookOpen> = {
    lesson: BookOpen,
    practice: Zap,
    review: Brain,
    challenge: Target,
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* ─── Header ─────────────────────────────────────────────── */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Welcome back{profile?.display_name ? `, ${profile.display_name}` : ''}
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              {profile?.learning_level
                ? `${profile.learning_level} level · `
                : ''}
              {lessonsCompleted} lessons completed · {overallPct.toFixed(0)}% overall progress
            </p>
          </div>

          {/* Streak badge */}
          <div className="flex items-center gap-3 rounded-xl border border-orange-500/20 bg-orange-500/5 px-4 py-2.5 backdrop-blur-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
              <Flame className="h-5 w-5 text-orange-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-400 leading-none">{streakDays}</div>
              <div className="text-xs text-slate-400">day streak</div>
            </div>
          </div>
        </div>

        {/* ─── Stat cards ────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {statCards.map((s) => (
            <Card
              key={s.label}
              className="border-white/5 bg-slate-900/60 backdrop-blur-xl transition-colors hover:border-white/10"
            >
              <CardContent className="flex items-center gap-3 p-4">
                <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-lg', s.bg)}>
                  <s.icon className={cn('h-5 w-5', s.color)} />
                </div>
                <div className="min-w-0">
                  <div className="text-2xl font-bold text-white leading-none">{s.value}</div>
                  <div className="mt-1 truncate text-xs text-slate-400">{s.label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ─── Main grid ────────────────────────────────────────── */}
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* ── Left column: Overall progress + Weekly activity ── */}
          <div className="space-y-6 lg:col-span-2">
            {/* Overall progress */}
            <Card className="border-white/5 bg-slate-900/60 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <TrendingUp className="h-5 w-5 text-cyan-400" />
                  Overall Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Overall bar */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="text-slate-400">All modules</span>
                    <span className="font-semibold text-cyan-400">{overallPct.toFixed(0)}%</span>
                  </div>
                  <Progress value={overallPct} className="h-2.5 bg-slate-800" />
                </div>

                {/* Per-module bars */}
                <div className="space-y-3.5">
                  {moduleProgress.map((m) => (
                    <div key={m.id}>
                      <div className="mb-1.5 flex items-center justify-between text-sm">
                        <span className="text-slate-300">{m.title}</span>
                        <span className="text-slate-500">
                          {m.completed}/{m.totalLessons}
                        </span>
                      </div>
                      <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                          style={{ width: `${m.pct}%`, backgroundColor: m.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Weekly activity chart */}
            <Card className="border-white/5 bg-slate-900/60 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Activity className="h-5 w-5 text-cyan-400" />
                  Weekly Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex h-44 items-end justify-between gap-2">
                  {weeklyActivity.map((val, i) => (
                    <div key={i} className="flex flex-1 flex-col items-center gap-2">
                      <div className="flex w-full flex-1 items-end">
                        <div
                          className="w-full rounded-t-md bg-gradient-to-t from-cyan-500/40 to-cyan-400 transition-all duration-500"
                          style={{ height: `${(val / maxWeekly) * 100}%` }}
                          title={`${val} min`}
                        />
                      </div>
                      <span className="text-[11px] text-slate-500">{WEEKDAYS[i]}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                  <span>Total this week</span>
                  <span className="font-semibold text-cyan-400">
                    {weeklyActivity.reduce((a, b) => a + b, 0)} min
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Skill breakdown */}
            <Card className="border-white/5 bg-slate-900/60 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Brain className="h-5 w-5 text-cyan-400" />
                  Skill Breakdown by Module
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {moduleProgress.map((m) => (
                  <div key={m.id} className="flex items-center gap-3">
                    <div className="w-40 shrink-0">
                      <div className="truncate text-sm text-slate-300">{m.title}</div>
                    </div>
                    <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                        style={{ width: `${m.pct}%`, backgroundColor: m.color }}
                      />
                    </div>
                    <div className="w-12 shrink-0 text-right text-sm font-semibold" style={{ color: m.color }}>
                      {m.pct.toFixed(0)}%
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* ── Right column: Achievements + Recommendations + Quick actions ── */}
          <div className="space-y-6">
            {/* Recent achievements */}
            <Card className="border-white/5 bg-slate-900/60 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Award className="h-5 w-5 text-cyan-400" />
                  Recent Achievements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {achievements.length === 0 && (
                  <p className="text-sm text-slate-500">No achievements yet. Keep learning!</p>
                )}
                {achievements.map((a) => {
                  const Icon = ACHIEVEMENT_ICONS[a.icon] ?? Award
                  return (
                    <div
                      key={a.id}
                      className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-3"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10">
                        <Icon className="h-4 w-4 text-cyan-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-white">{a.title}</div>
                        <div className="truncate text-xs text-slate-500">{a.description}</div>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card className="border-white/5 bg-slate-900/60 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Target className="h-5 w-5 text-cyan-400" />
                  Recommended for You
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recommendations.length === 0 && (
                  <p className="text-sm text-slate-500">No recommendations yet.</p>
                )}
                {recommendations.map((r, i) => {
                  const Icon = recIcons[r.type] ?? BookOpen
                  return (
                    <Link
                      key={i}
                      to={r.type === 'challenge' ? '/challenges' : r.type === 'practice' ? '/circuit' : '/learn'}
                      className="block"
                    >
                      <div className="group flex items-start gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-3 transition-colors hover:border-cyan-500/20 hover:bg-cyan-500/5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10">
                          <Icon className="h-4 w-4 text-cyan-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-medium text-white">{r.title}</span>
                            <span
                              className={cn(
                                'shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase',
                                priorityStyles[r.priority] ?? priorityStyles.low
                              )}
                            >
                              {r.priority}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-slate-500">{r.description}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-slate-600 transition-colors group-hover:text-cyan-400" />
                      </div>
                    </Link>
                  )
                })}
              </CardContent>
            </Card>

            {/* Quick actions */}
            <Card className="border-white/5 bg-slate-900/60 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Zap className="h-5 w-5 text-cyan-400" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {quickActions.map((a) => (
                  <Button
                    key={a.to}
                    asChild
                    variant="ghost"
                    className="w-full justify-between border border-white/5 bg-white/[0.02] px-4 hover:bg-cyan-500/5 hover:border-cyan-500/20"
                  >
                    <Link to={a.to}>
                      <span className="flex items-center gap-3">
                        <a.icon className={cn('h-4 w-4', a.color)} />
                        <span className="text-sm font-medium text-slate-200">{a.label}</span>
                      </span>
                      <ChevronRight className="h-4 w-4 text-slate-600" />
                    </Link>
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
