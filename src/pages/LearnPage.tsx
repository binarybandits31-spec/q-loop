import { Link } from 'react-router-dom'
import {
  BookOpen, Clock, ChevronRight, PlayCircle, Sigma, Atom, CircuitBoard,
  Radio, Binary, Cpu, Gauge, ShieldCheck, HardDrive, Code2, Brain,
  FlaskConical, Telescope, Layers, CheckCircle2, Circle,
} from 'lucide-react'
import { MODULES } from '@/lib/quantum/lessons'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Sigma, Atom, CircuitBoard, Radio, Binary, Cpu, Gauge, ShieldCheck,
  HardDrive, Code2, Brain, FlaskConical, Telescope,
}

const DIFFICULTY_STYLES: Record<string, string> = {
  Beginner: 'text-success bg-success/10 border-success/20',
  Intermediate: 'text-warning bg-warning/10 border-warning/20',
  Advanced: 'text-error bg-error/10 border-error/20',
}

export default function LearnPage() {
  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-[1400px] mx-auto">
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass border border-primary/20 mb-4">
            <BookOpen className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">Learning Hub</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Quantum Computing Curriculum</h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Progress through 13 structured modules — from mathematical foundations to research frontiers. Each lesson includes interactive content, quizzes, and circuit examples.
          </p>
        </div>

        <div className="space-y-8">
          {MODULES.map((module, moduleIdx) => {
            const Icon = ICON_MAP[module.icon] || Layers
            return (
              <div key={module.id} id={module.id} className="scroll-mt-24 animate-fade-in-up" style={{ animationDelay: `${moduleIdx * 0.05}s` }}>
                <Card className="glass overflow-hidden">
                  <div className="p-6 border-b border-border/30">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${module.color}15`, border: `1px solid ${module.color}30` }}>
                        <Icon className="w-7 h-7" style={{ color: module.color }} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-xs font-medium text-muted-foreground">Module {moduleIdx + 1}</span>
                        </div>
                        <h2 className="text-xl font-bold mb-1">{module.title}</h2>
                        <p className="text-sm text-muted-foreground">{module.description}</p>
                        <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground mt-3">
                          <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" />{module.lessons.length} lessons</span>
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{module.lessons.reduce((s, l) => s + l.duration, 0)} min</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="divide-y divide-border/20">
                    {module.lessons.map((lesson, lessonIdx) => (
                      <Link key={lesson.id} to={`/learn/${lesson.id}`} className="flex items-center gap-4 p-5 hover:bg-muted/30 transition-colors group">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted/50 flex-shrink-0">
                          <span className="text-sm font-medium text-muted-foreground">{lessonIdx + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-semibold truncate group-hover:text-primary transition-colors">{lesson.title}</h3>
                            <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium flex-shrink-0', DIFFICULTY_STYLES[lesson.difficulty])}>{lesson.difficulty}</span>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{lesson.description}</p>
                        </div>
                        <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground flex-shrink-0">
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{lesson.duration} min</span>
                          <span className="flex items-center gap-1"><PlayCircle className="w-3.5 h-3.5" />{lesson.quiz.length} quiz</span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground/40 group-hover:text-primary transition-colors flex-shrink-0" />
                      </Link>
                    ))}
                  </div>
                </Card>
              </div>
            )
          })}
        </div>

        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-4">Ready to put your knowledge into practice?</p>
          <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 quantum-glow">
            <Link to="/circuit" className="flex items-center gap-2"><CircuitBoard className="w-5 h-5" /> Open Circuit Builder</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
