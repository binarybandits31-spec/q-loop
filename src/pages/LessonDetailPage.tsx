import { useMemo, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, Clock, BookOpen, CheckCircle2, XCircle,
  ChevronRight, PlayCircle, CircuitBoard, Lightbulb, Target,
  ListChecks, GraduationCap, Sparkles, RotateCcw
} from 'lucide-react'
import { getLessonById, getAllLessons, MODULES, type QuizQuestion } from '@/lib/quantum/lessons'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

const starterQuiz: QuizQuestion[] = [
  {
    id: 'intro-q1',
    question: 'What is the basic unit of quantum information?',
    options: ['A classical byte', 'A qubit', 'A transistor', 'A logic register'],
    correctIndex: 1,
    explanation: 'A qubit is the quantum counterpart of a classical bit and is represented by a normalized quantum state.'
  },
  {
    id: 'intro-q2',
    question: 'A qubit is measured in the computational basis. What does the measurement return?',
    options: ['Both 0 and 1 at once', 'A complex amplitude', 'One classical outcome: 0 or 1', 'The phase angle only'],
    correctIndex: 2,
    explanation: 'A measurement returns one classical outcome. The probabilities are determined by the squared magnitudes of the state amplitudes.'
  },
  {
    id: 'intro-q3',
    question: 'For |ψ⟩ = α|0⟩ + β|1⟩, which condition makes the state normalized?',
    options: ['α + β = 1', '|α|² + |β|² = 1', 'αβ = 0', '|α| = |β|'],
    correctIndex: 1,
    explanation: 'The squared magnitudes of all computational-basis amplitudes must sum to one.'
  },
  {
    id: 'intro-q4',
    question: 'Why does relative phase matter in a quantum circuit?',
    options: ['It changes the number of qubits', 'It can affect interference and later measurement probabilities', 'It removes measurement', 'It makes every gate irreversible'],
    correctIndex: 1,
    explanation: 'Quantum gates manipulate amplitudes and phases. Interference can turn phase differences into observable probability differences.'
  },
  {
    id: 'intro-q5',
    question: 'Which statement about quantum computers is most accurate?',
    options: ['They are faster for every task', 'They replace all classical computers', 'They can offer advantages for particular problem structures', 'They always return exact answers in one run'],
    correctIndex: 2,
    explanation: 'Quantum advantage is problem-dependent and also depends on hardware quality, noise, and the resources required.'
  }
]

function TheoryBody({ body }: { body: string }) {
  const blocks = useMemo(() => {
    const lines = body.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
    const parsed: Array<{ type: 'paragraph' | 'list'; text: string }> = []
    let listItems: string[] = []
    const flushList = () => {
      if (listItems.length) {
        parsed.push({ type: 'list', text: listItems.join('\n') })
        listItems = []
      }
    }

    for (const line of lines) {
      const bullet = line.match(/^(?:•|▪|‣|\-\s+|\*\s+)(.*)$/)
      if (bullet) {
        listItems.push(bullet[1].trim())
      } else {
        flushList()
        parsed.push({ type: 'paragraph', text: line })
      }
    }
    flushList()
    return parsed
  }, [body])

  return (
    <div className="theory-content space-y-4">
      {blocks.map((block, index) => block.type === 'list' ? (
        <ul key={index} className="theory-list space-y-2.5">
          {block.text.split('\n').map((item, itemIndex) => (
            <li key={itemIndex} className="flex items-start gap-3 text-muted-foreground leading-7">
              <span className="mt-[11px] h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p key={index} className="text-muted-foreground leading-7">{block.text}</p>
      ))}
    </div>
  )
}

export default function LessonDetailPage() {
  const { lessonId } = useParams()
  const navigate = useNavigate()
  const lesson = lessonId ? getLessonById(lessonId) : undefined
  const [activeSection, setActiveSection] = useState(0)
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)

  const quiz = useMemo(() => {
    if (!lesson) return []
    return lesson.quiz.length ? lesson.quiz : (lesson.id === 'module-1-chapter-01' ? starterQuiz : [])
  }, [lesson])
  const objectives = lesson?.objectives.filter((item) => {
    const value = item.trim()
    return value && value !== '--' && !/^after studying this chapter/i.test(value) && !/^#/.test(value)
  }) ?? []

  if (!lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="p-8 glass text-center max-w-md">
          <h2 className="text-xl font-bold mb-2">Lesson Not Found</h2>
          <p className="text-muted-foreground mb-4">This lesson doesn't exist or has been moved.</p>
          <Button asChild><Link to="/learn">Back to Learn</Link></Button>
        </Card>
      </div>
    )
  }

  const allLessons = getAllLessons()
  const currentIdx = allLessons.findIndex((item) => item.id === lesson.id)
  const prevLesson = currentIdx > 0 ? allLessons[currentIdx - 1] : null
  const nextLesson = currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null
  const module = MODULES.find((item) => item.id === lesson.moduleId)
  const totalSteps = lesson.content.length + 1
  const progress = ((activeSection + 1) / totalSteps) * 100
  const quizScore = quiz.filter((question) => quizAnswers[question.id] === question.correctIndex).length
  const allAnswered = quiz.length > 0 && quiz.every((question) => quizAnswers[question.id] !== undefined)
  const currentContent = lesson.content[activeSection]

  const goToSection = (index: number) => {
    setActiveSection(Math.min(lesson.content.length, Math.max(0, index)))
    setQuizSubmitted(false)
  }

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/learn" className="hover:text-primary transition-colors">Learn</Link>
          <ChevronRight className="w-4 h-4" />
          {module && <span className="text-muted-foreground/70">{module.title}</span>}
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground truncate">{lesson.title}</span>
        </div>

        <header className="mb-8">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <span className={cn('text-xs px-2.5 py-1 rounded-full border font-medium',
              lesson.difficulty === 'Beginner' && 'text-success bg-success/10 border-success/20',
              lesson.difficulty === 'Intermediate' && 'text-warning bg-warning/10 border-warning/20',
              lesson.difficulty === 'Advanced' && 'text-error bg-error/10 border-error/20')}>{lesson.difficulty}</span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="w-3.5 h-3.5" />{lesson.duration} min</span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground"><BookOpen className="w-3.5 h-3.5" />{lesson.content.length} learning sections</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">{lesson.title}</h1>
          <p className="text-muted-foreground text-lg max-w-3xl">{lesson.description}</p>
        </header>

        {objectives.length > 0 && (
          <Card className="p-5 sm:p-6 glass mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-primary" />
              <h2 className="font-semibold">What you’ll learn</h2>
              <span className="ml-auto text-xs text-muted-foreground">{objectives.length} objectives</span>
            </div>
            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
              {objectives.map((objective, index) => (
                <div key={index} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                  <span>{objective}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        <div className="grid lg:grid-cols-[260px_minmax(0,1fr)] gap-6 items-start">
          <aside className="lg:sticky lg:top-6">
            <Card className="p-4 glass">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold">Chapter contents</span>
                <span className="text-xs text-muted-foreground tabular-nums">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-1.5 mb-4" />
              <nav className="space-y-1 max-h-[55vh] overflow-y-auto scrollbar-thin pr-1" aria-label="Chapter sections">
                {lesson.content.map((section, index) => (
                  <button key={index} onClick={() => goToSection(index)}
                    className={cn('w-full text-left text-sm px-3 py-2.5 rounded-lg transition-colors flex items-start gap-2',
                      activeSection === index ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50')}>
                    <span className="text-xs opacity-70 mt-0.5 tabular-nums">{String(index + 1).padStart(2, '0')}</span>
                    <span className="line-clamp-2">{section.heading}</span>
                  </button>
                ))}
                <button onClick={() => goToSection(lesson.content.length)}
                  className={cn('w-full text-left text-sm px-3 py-2.5 rounded-lg transition-colors flex items-center gap-2',
                    activeSection === lesson.content.length ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50')}>
                  <ListChecks className="w-4 h-4" /> Knowledge check
                </button>
              </nav>
            </Card>
          </aside>

          <main className="min-w-0">
            {currentContent ? (
              <div className="space-y-5 animate-fade-in-up">
                <Card className="p-5 sm:p-8 glass">
                  <div className="flex flex-wrap items-center gap-2 mb-6">
                    <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10 text-primary"><BookOpen className="w-5 h-5" /></span>
                    <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Section {activeSection + 1}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{activeSection + 1} of {lesson.content.length}</span>
                  </div>
                  <h2 className="text-2xl font-semibold tracking-tight mb-6">{currentContent.heading}</h2>
                  <TheoryBody body={currentContent.body} />
                  {currentContent.formula && (
                    <div className="mt-7 rounded-xl border border-primary/20 bg-primary/[0.06] overflow-hidden">
                      <div className="flex items-center gap-2 px-4 py-3 border-b border-primary/15">
                        <Lightbulb className="w-4 h-4 text-primary" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-primary">Key formula / notation</span>
                      </div>
                      <pre className="formula-display overflow-x-auto whitespace-pre-wrap break-words p-4 sm:p-5 text-sm leading-7 text-foreground/90">{currentContent.formula}</pre>
                    </div>
                  )}
                </Card>
                <div className="flex items-center justify-between gap-3">
                  <Button variant="outline" onClick={() => goToSection(activeSection - 1)} disabled={activeSection === 0} className="gap-2"><ArrowLeft className="w-4 h-4" /> Previous</Button>
                  <Button onClick={() => goToSection(activeSection + 1)} className="gap-2">{activeSection === lesson.content.length - 1 ? 'Knowledge check' : 'Next section'} <ArrowRight className="w-4 h-4" /></Button>
                </div>
              </div>
            ) : (
              <div className="space-y-5 animate-fade-in-up">
                <Card className="p-5 sm:p-8 glass">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary"><GraduationCap className="w-5 h-5" /></span>
                    <div><p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Knowledge check</p><h2 className="text-2xl font-semibold">Test your understanding</h2></div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-7">Apply the concepts from this chapter. You’ll see explanations after submitting your answers.</p>
                  {quiz.length ? (
                    <div className="space-y-7">
                      {quiz.map((question, questionIndex) => (
                        <section key={question.id} className="border-b border-border/50 last:border-0 pb-6 last:pb-0">
                          <p className="font-medium mb-3"><span className="text-primary mr-2">{String(questionIndex + 1).padStart(2, '0')}.</span>{question.question}</p>
                          <div className="grid gap-2">
                            {question.options.map((option, optionIndex) => {
                              const selected = quizAnswers[question.id] === optionIndex
                              const correct = optionIndex === question.correctIndex
                              return (
                                <button key={optionIndex} onClick={() => !quizSubmitted && setQuizAnswers((previous) => ({ ...previous, [question.id]: optionIndex }))} disabled={quizSubmitted}
                                  className={cn('w-full text-left px-4 py-3 rounded-lg border transition-all flex items-center justify-between gap-3',
                                    !quizSubmitted && selected && 'border-primary bg-primary/10',
                                    !quizSubmitted && !selected && 'border-border hover:border-primary/40 hover:bg-muted/30',
                                    quizSubmitted && correct && 'border-success/60 bg-success/10',
                                    quizSubmitted && selected && !correct && 'border-error bg-error/10',
                                    quizSubmitted && !correct && !selected && 'border-border opacity-60')}>
                                  <span className="text-sm">{option}</span>
                                  {quizSubmitted && correct && <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />}
                                  {quizSubmitted && selected && !correct && <XCircle className="w-5 h-5 text-error flex-shrink-0" />}
                                </button>
                              )
                            })}
                          </div>
                          {quizSubmitted && <p className="mt-3 text-sm text-muted-foreground leading-6"><span className="font-semibold text-foreground">Explanation: </span>{question.explanation}</p>}
                        </section>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-border p-6 text-center">
                      <Sparkles className="w-7 h-7 text-primary mx-auto mb-3" />
                      <p className="font-medium mb-1">Practice questions coming soon</p>
                      <p className="text-sm text-muted-foreground">Review the chapter sections, then continue to another lesson.</p>
                    </div>
                  )}
                  {quiz.length > 0 && quizSubmitted && (
                    <div className="mt-7 rounded-xl bg-muted/40 border border-border p-4 flex items-center gap-3">
                      <div className={cn('w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm', quizScore === quiz.length ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning')}>{quizScore}/{quiz.length}</div>
                      <div><p className="font-semibold">{quizScore === quiz.length ? 'Excellent work!' : 'Good effort — keep practicing.'}</p><p className="text-xs text-muted-foreground">You answered {quizScore} out of {quiz.length} correctly.</p></div>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-3 mt-7">
                    <Button variant="outline" onClick={() => goToSection(lesson.content.length - 1)} className="gap-2"><ArrowLeft className="w-4 h-4" /> Back to lesson</Button>
                    <div className="flex gap-2">
                      {quiz.length > 0 && (quizSubmitted ? (
                        <Button variant="outline" onClick={() => { setQuizAnswers({}); setQuizSubmitted(false) }} className="gap-2"><RotateCcw className="w-4 h-4" /> Try again</Button>
                      ) : (
                        <Button onClick={() => setQuizSubmitted(true)} disabled={!allAnswered}>Submit answers</Button>
                      ))}
                      {lesson.circuitExample && <Button asChild variant="outline" className="gap-2"><Link to="/circuit"><CircuitBoard className="w-4 h-4" /> Try circuit</Link></Button>}
                      {nextLesson && <Button onClick={() => { setQuizSubmitted(false); setQuizAnswers({}); setActiveSection(0); navigate(`/learn/${nextLesson.id}`) }} className="gap-2">Next lesson <ArrowRight className="w-4 h-4" /></Button>}
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </main>
        </div>

        <footer className="flex items-center justify-between mt-10 pt-6 border-t border-border/30">
          {prevLesson ? <Link to={`/learn/${prevLesson.id}`} className="flex items-center gap-3 group"><ArrowLeft className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" /><div><p className="text-xs text-muted-foreground">Previous lesson</p><p className="text-sm font-medium group-hover:text-primary transition-colors">{prevLesson.title}</p></div></Link> : <div />}
          {nextLesson ? <Link to={`/learn/${nextLesson.id}`} className="flex items-center gap-3 group text-right"><div><p className="text-xs text-muted-foreground">Next lesson</p><p className="text-sm font-medium group-hover:text-primary transition-colors">{nextLesson.title}</p></div><ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" /></Link> : <div />}
        </footer>
      </div>
    </div>
  )
}
