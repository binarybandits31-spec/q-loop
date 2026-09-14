import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardCheck, CheckCircle2, XCircle, Award, RotateCcw, ChevronRight, Trophy, Target } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { MODULES, getAllLessons, type QuizQuestion } from '@/lib/quantum/lessons'

interface AssessmentState {
  currentQuestion: number; answers: Record<string, number>; submitted: boolean; activeModule: string | null
}

export default function AssessmentPage() {
  const allLessons = getAllLessons()
  const allQuestions: (QuizQuestion & { lessonTitle: string; moduleId: string })[] = allLessons.flatMap((l) => l.quiz.map((q) => ({ ...q, lessonTitle: l.title, moduleId: l.moduleId })))
  const [state, setState] = useState<AssessmentState>({ currentQuestion: 0, answers: {}, submitted: false, activeModule: null })

  const questions = state.activeModule ? allQuestions.filter((q) => q.moduleId === state.activeModule) : allQuestions
  const currentQ = questions[state.currentQuestion]
  const score = questions.filter((q) => state.answers[q.id] === q.correctIndex).length
  const allAnswered = questions.every((q) => state.answers[q.id] !== undefined)
  const progress = (Object.keys(state.answers).length / questions.length) * 100
  const scorePct = (score / questions.length) * 100

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass border border-primary/20 mb-3"><ClipboardCheck className="w-3.5 h-3.5 text-primary" /><span className="text-xs font-medium text-primary">Assessment</span></div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Test Your Quantum Knowledge</h1>
          <p className="text-muted-foreground">Choose a module or take the comprehensive assessment.</p>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <button onClick={() => setState({ currentQuestion: 0, answers: {}, submitted: false, activeModule: null })}
            className={cn('px-4 py-2 rounded-lg text-sm font-medium border transition-all', state.activeModule === null ? 'bg-primary/15 text-primary border-primary/30' : 'glass text-muted-foreground hover:text-foreground border-border')}>All Topics ({allQuestions.length})</button>
          {MODULES.map((m) => {
            const count = allQuestions.filter((q) => q.moduleId === m.id).length
            if (count === 0) return null
            return <button key={m.id} onClick={() => setState({ currentQuestion: 0, answers: {}, submitted: false, activeModule: m.id })}
              className={cn('px-4 py-2 rounded-lg text-sm font-medium border transition-all', state.activeModule === m.id ? 'bg-primary/15 text-primary border-primary/30' : 'glass text-muted-foreground hover:text-foreground border-border')}>{m.title} ({count})</button>
          })}
        </div>

        {!state.submitted ? (
          <>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2"><span className="text-sm text-muted-foreground">Question {state.currentQuestion + 1} of {questions.length}</span><span className="text-sm text-muted-foreground">{Math.round(progress)}% answered</span></div>
              <Progress value={progress} className="h-1.5" />
            </div>
            {currentQ && (
              <Card className="p-6 glass mb-4 animate-fade-in-up" key={state.currentQuestion}>
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted/30 text-muted-foreground mb-3 inline-block">{currentQ.lessonTitle}</span>
                <h3 className="text-lg font-semibold mb-4">{currentQ.question}</h3>
                <div className="space-y-2">
                  {currentQ.options.map((opt, idx) => {
                    const isSelected = state.answers[currentQ.id] === idx
                    return <button key={idx} onClick={() => !state.submitted && setState((p) => ({ ...p, answers: { ...p.answers, [currentQ.id]: idx } }))}
                      className={cn('w-full text-left px-4 py-3 rounded-lg border-2 transition-all', isSelected ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40 hover:bg-muted/30')}><span className="text-sm">{opt}</span></button>
                  })}
                </div>
              </Card>
            )}
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={() => setState((p) => ({ ...p, currentQuestion: Math.max(0, p.currentQuestion - 1) }))} disabled={state.currentQuestion === 0}>Previous</Button>
              <div className="flex items-center gap-1">
                {questions.map((_, i) => <button key={i} onClick={() => setState((p) => ({ ...p, currentQuestion: i }))} className={cn('w-2.5 h-2.5 rounded-full transition-all', i === state.currentQuestion ? 'bg-primary scale-125' : state.answers[questions[i].id] !== undefined ? 'bg-primary/40' : 'bg-muted/40')} />)}
              </div>
              {state.currentQuestion < questions.length - 1 ? (
                <Button onClick={() => setState((p) => ({ ...p, currentQuestion: p.currentQuestion + 1 }))} className="bg-primary text-primary-foreground hover:bg-primary/90">Next</Button>
              ) : (
                <Button onClick={() => setState((p) => ({ ...p, submitted: true }))} disabled={!allAnswered} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"><CheckCircle2 className="w-4 h-4" /> Submit</Button>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-6 animate-fade-in-up">
            <Card className="p-8 glass text-center">
              <div className={cn('w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border-2', scorePct >= 80 ? 'bg-success/10 border-success/30' : scorePct >= 50 ? 'bg-warning/10 border-warning/30' : 'bg-error/10 border-error/30')}>
                {scorePct >= 80 ? <Trophy className="w-10 h-10 text-success" /> : scorePct >= 50 ? <Target className="w-10 h-10 text-warning" /> : <RotateCcw className="w-10 h-10 text-error" />}
              </div>
              <h2 className="text-2xl font-bold mb-2">{score} / {questions.length}</h2>
              <p className="text-muted-foreground mb-6">{scorePct >= 80 ? 'Excellent! You\'ve mastered this material.' : scorePct >= 50 ? 'Good progress! Review and try again.' : 'Keep learning! Check the lessons and try again.'}</p>
              <div className="flex items-center justify-center gap-4">
                <Button onClick={() => setState({ currentQuestion: 0, answers: {}, submitted: false, activeModule: state.activeModule })} variant="outline" className="gap-2"><RotateCcw className="w-4 h-4" /> Retake</Button>
                <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"><Link to="/learn">Review Lessons <ChevronRight className="w-4 h-4" /></Link></Button>
              </div>
            </Card>
            <div className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2"><Award className="w-4 h-4 text-primary" /> Answer Review</h3>
              {questions.map((q, i) => {
                const ua = state.answers[q.id], correct = ua === q.correctIndex
                return (
                  <Card key={q.id} className="p-4 glass">
                    <div className="flex items-start gap-3">
                      {correct ? <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" /> : <XCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />}
                      <div className="flex-1">
                        <p className="text-sm font-medium mb-2">{i + 1}. {q.question}</p>
                        <div className="space-y-1 text-xs">
                          <p className={cn('text-muted-foreground', correct && 'text-success')}>Your answer: {q.options[ua]}</p>
                          {!correct && <p className="text-success">Correct: {q.options[q.correctIndex]}</p>}
                          <p className="text-muted-foreground mt-1">{q.explanation}</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
