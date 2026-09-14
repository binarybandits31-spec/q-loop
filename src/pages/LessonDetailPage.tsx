import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Clock, BookOpen, CheckCircle2, XCircle, ChevronRight, PlayCircle, CircuitBoard, Lightbulb, Target } from 'lucide-react'
import { getLessonById, getAllLessons, MODULES } from '@/lib/quantum/lessons'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

export default function LessonDetailPage() {
  const { lessonId } = useParams()
  const navigate = useNavigate()
  const lesson = lessonId ? getLessonById(lessonId) : undefined
  const [activeSection, setActiveSection] = useState(0)
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)

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
  const currentIdx = allLessons.findIndex((l) => l.id === lesson.id)
  const prevLesson = currentIdx > 0 ? allLessons[currentIdx - 1] : null
  const nextLesson = currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null
  const module = MODULES.find((m) => m.id === lesson.moduleId)
  const progress = ((activeSection + 1) / (lesson.content.length + 1)) * 100
  const quizScore = lesson.quiz.filter((q) => quizAnswers[q.id] === q.correctIndex).length
  const allAnswered = lesson.quiz.every((q) => quizAnswers[q.id] !== undefined)

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/learn" className="hover:text-primary transition-colors">Learn</Link>
          <ChevronRight className="w-4 h-4" />
          {module && <span className="text-muted-foreground/70">{module.title}</span>}
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground truncate">{lesson.title}</span>
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <span className={cn('text-xs px-2.5 py-1 rounded-full border font-medium',
              lesson.difficulty === 'Beginner' && 'text-success bg-success/10 border-success/20',
              lesson.difficulty === 'Intermediate' && 'text-warning bg-warning/10 border-warning/20',
              lesson.difficulty === 'Advanced' && 'text-error bg-error/10 border-error/20')}>{lesson.difficulty}</span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="w-3.5 h-3.5" />{lesson.duration} min</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">{lesson.title}</h1>
          <p className="text-muted-foreground text-lg">{lesson.description}</p>

          {lesson.objectives.length > 0 && (
            <div className="mt-4 p-4 rounded-lg glass border border-border/30">
              <div className="flex items-center gap-2 mb-2"><Target className="w-4 h-4 text-primary" /><span className="text-sm font-medium">Learning Objectives</span></div>
              <ul className="space-y-1">
                {lesson.objectives.map((obj, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-success mt-0.5 flex-shrink-0" />{obj}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">{activeSection < lesson.content.length ? `Section ${activeSection + 1} of ${lesson.content.length}` : 'Quiz'}</span>
            <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        {activeSection < lesson.content.length && (
          <div className="space-y-6 animate-fade-in-up">
            <Card className="p-8 glass">
              <div className="flex items-center gap-2 mb-4"><BookOpen className="w-5 h-5 text-primary" /><h2 className="text-xl font-semibold">{lesson.content[activeSection].heading}</h2></div>
              <p className="text-muted-foreground leading-relaxed text-base mb-6">{lesson.content[activeSection].body}</p>
              {lesson.content[activeSection].formula && (
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex items-center gap-2 mb-2"><Lightbulb className="w-4 h-4 text-primary" /><span className="text-xs font-medium text-primary">Key Formula</span></div>
                  <p className="font-mono text-sm text-foreground/90">{lesson.content[activeSection].formula}</p>
                </div>
              )}
            </Card>
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={() => setActiveSection(Math.max(0, activeSection - 1))} disabled={activeSection === 0} className="gap-2"><ArrowLeft className="w-4 h-4" /> Previous</Button>
              <Button onClick={() => setActiveSection(activeSection + 1)} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">{activeSection === lesson.content.length - 1 ? 'Take Quiz' : 'Next Section'} <ArrowRight className="w-4 h-4" /></Button>
            </div>
          </div>
        )}

        {activeSection === lesson.content.length && (
          <div className="space-y-6 animate-fade-in-up">
            <Card className="p-8 glass">
              <div className="flex items-center gap-2 mb-6"><PlayCircle className="w-5 h-5 text-primary" /><h2 className="text-xl font-semibold">Knowledge Check</h2></div>
              <div className="space-y-6">
                {lesson.quiz.map((q, qIdx) => (
                  <div key={q.id}>
                    <p className="font-medium mb-3"><span className="text-primary mr-2">{qIdx + 1}.</span>{q.question}</p>
                    <div className="space-y-2">
                      {q.options.map((option, optIdx) => {
                        const isSelected = quizAnswers[q.id] === optIdx
                        const isCorrect = optIdx === q.correctIndex
                        const showResult = quizSubmitted && isSelected
                        const showCorrect = quizSubmitted && isCorrect
                        return (
                          <button key={optIdx} onClick={() => !quizSubmitted && setQuizAnswers((p) => ({ ...p, [q.id]: optIdx }))} disabled={quizSubmitted}
                            className={cn('w-full text-left px-4 py-3 rounded-lg border transition-all flex items-center justify-between',
                              !quizSubmitted && isSelected && 'border-primary bg-primary/10',
                              !quizSubmitted && !isSelected && 'border-border hover:border-primary/40 hover:bg-muted/30',
                              showResult && isCorrect && 'border-success bg-success/10',
                              showResult && !isCorrect && 'border-error bg-error/10',
                              showCorrect && !isSelected && 'border-success/40 bg-success/5',
                              quizSubmitted && !isCorrect && !isSelected && 'border-border opacity-50')}>
                            <span className="text-sm">{option}</span>
                            {showResult && isCorrect && <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />}
                            {showResult && !isCorrect && <XCircle className="w-5 h-5 text-error flex-shrink-0" />}
                          </button>
                        )
                      })}
                    </div>
                    {quizSubmitted && <p className="text-sm text-muted-foreground mt-2 pl-1">{q.explanation}</p>}
                  </div>
                ))}
              </div>
              {quizSubmitted && (
                <div className="mt-6 p-4 rounded-lg bg-muted/30 border border-border">
                  <div className="flex items-center gap-3">
                    <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', quizScore === lesson.quiz.length ? 'bg-success/20' : 'bg-warning/20')}>
                      <span className={cn('font-bold', quizScore === lesson.quiz.length ? 'text-success' : 'text-warning')}>{quizScore}/{lesson.quiz.length}</span>
                    </div>
                    <p className="font-medium">{quizScore === lesson.quiz.length ? 'Perfect! You\'ve mastered this lesson.' : quizScore >= lesson.quiz.length / 2 ? 'Good progress! Review and try again.' : 'Keep learning! Review the lesson content.'}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between mt-6">
                <Button variant="outline" onClick={() => setActiveSection(activeSection - 1)} className="gap-2"><ArrowLeft className="w-4 h-4" /> Back to Lesson</Button>
                {!quizSubmitted ? (
                  <Button onClick={() => setQuizSubmitted(true)} disabled={!allAnswered} className="bg-primary text-primary-foreground hover:bg-primary/90">{allAnswered ? 'Submit Answers' : `Answer all (${Object.keys(quizAnswers).length}/${lesson.quiz.length})`}</Button>
                ) : (
                  <div className="flex gap-2">
                    {lesson.circuitExample && <Button asChild variant="outline" className="gap-2"><Link to="/circuit"><CircuitBoard className="w-4 h-4" /> Try Circuit</Link></Button>}
                    {nextLesson && <Button onClick={() => { setQuizSubmitted(false); setQuizAnswers({}); setActiveSection(0); navigate(`/learn/${nextLesson.id}`); }} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">Next Lesson <ArrowRight className="w-4 h-4" /></Button>}
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        <div className="flex items-center justify-between mt-8 pt-6 border-t border-border/30">
          {prevLesson ? (
            <Link to={`/learn/${prevLesson.id}`} className="flex items-center gap-3 group">
              <ArrowLeft className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              <div><p className="text-xs text-muted-foreground">Previous</p><p className="text-sm font-medium group-hover:text-primary transition-colors">{prevLesson.title}</p></div>
            </Link>
          ) : <div />}
          {nextLesson ? (
            <Link to={`/learn/${nextLesson.id}`} className="flex items-center gap-3 group text-right">
              <div><p className="text-xs text-muted-foreground">Next</p><p className="text-sm font-medium group-hover:text-primary transition-colors">{nextLesson.title}</p></div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>
          ) : <div />}
        </div>
      </div>
    </div>
  )
}
