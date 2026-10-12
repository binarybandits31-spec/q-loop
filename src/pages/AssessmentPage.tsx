
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Award,
  RotateCcw,
  ChevronRight,
  Trophy,
  Target,
  BookOpen,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import {
  MODULES,
  getAllLessons,
  type QuizQuestion,
} from '@/lib/quantum/lessons'

interface AssessmentState {
  currentQuestion: number
  answers: Record<string, number>
  submitted: boolean
  activeModule: string | null
}

export default function AssessmentPage() {
  const allLessons = getAllLessons()

  const allQuestions: (QuizQuestion & {
    lessonTitle: string
    moduleId: string
  })[] = allLessons.flatMap((lesson) =>
    lesson.quiz.map((question) => ({
      ...question,
      lessonTitle: lesson.title,
      moduleId: lesson.moduleId,
    }))
  )

  const [state, setState] = useState<AssessmentState>({
    currentQuestion: 0,
    answers: {},
    submitted: false,
    activeModule: null,
  })

  useEffect(() => {
    console.log('[Assessment Debug] Total lessons:', allLessons.length)
    console.table(
      allLessons.map((lesson) => ({
        lesson: lesson.title,
        moduleId: lesson.moduleId,
        questions: lesson.quiz.length,
      }))
    )
    console.log('[Assessment Debug] Total questions:', allQuestions.length)
  }, [allLessons.length, allQuestions.length])

  const questions = state.activeModule
    ? allQuestions.filter(
        (question) => question.moduleId === state.activeModule
      )
    : allQuestions

  const currentQ = questions[state.currentQuestion]

  const score = questions.filter(
    (question) =>
      state.answers[question.id] === question.correctIndex
  ).length

  const allAnswered = questions.every(
    (question) => state.answers[question.id] !== undefined
  )

  const progress =
    questions.length > 0
      ? (questions.filter(
          (question) => state.answers[question.id] !== undefined
        ).length /
          questions.length) *
        100
      : 0

  const scorePct =
    questions.length > 0 ? (score / questions.length) * 100 : 0

  const resetAssessment = (activeModule: string | null) => {
    setState({
      currentQuestion: 0,
      answers: {},
      submitted: false,
      activeModule,
    })
  }

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 px-3 py-1 glass">
            <ClipboardCheck className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">
              Assessment
            </span>
          </div>

          <h1 className="mb-2 text-2xl font-bold sm:text-3xl">
            Test Your Quantum Knowledge
          </h1>

          <p className="text-muted-foreground">
            Choose a module or take the comprehensive assessment.
          </p>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => resetAssessment(null)}
            className={cn(
              'rounded-lg border px-4 py-2 text-sm font-medium transition-all',
              state.activeModule === null
                ? 'border-primary/30 bg-primary/15 text-primary'
                : 'border-border text-muted-foreground glass hover:text-foreground'
            )}
          >
            All Topics ({allQuestions.length})
          </button>

          {MODULES.map((module) => {
            const count = allQuestions.filter(
              (question) => question.moduleId === module.id
            ).length

            if (count === 0) return null

            return (
              <button
                key={module.id}
                onClick={() => resetAssessment(module.id)}
                className={cn(
                  'rounded-lg border px-4 py-2 text-sm font-medium transition-all',
                  state.activeModule === module.id
                    ? 'border-primary/30 bg-primary/15 text-primary'
                    : 'border-border text-muted-foreground glass hover:text-foreground'
                )}
              >
                {module.title} ({count})
              </button>
            )
          })}
        </div>

        {questions.length === 0 ? (
          <Card className="p-8 text-center glass">
            <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />

            <h2 className="mb-2 text-xl font-semibold">
              No Assessment Questions Available
            </h2>

            <p className="mx-auto mb-5 max-w-lg text-sm text-muted-foreground">
              The assessment could not find any quiz questions in the
              available lessons. Add questions to the lesson quiz arrays
              in src/lib/quantum/lessons.ts, then save and refresh.
            </p>

            <p className="mb-5 text-xs text-muted-foreground">
              Lessons loaded: {allLessons.length} · Questions loaded:{' '}
              {allQuestions.length}
            </p>

            <div className="flex flex-wrap justify-center gap-3">
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Refresh
              </Button>

              <Button asChild>
                <Link to="/learn">
                  Open Lessons
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </Card>
        ) : !state.submitted ? (
          <>
            <div className="mb-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Question {state.currentQuestion + 1} of {questions.length}
                </span>

                <span className="text-sm text-muted-foreground">
                  {Math.round(progress)}% answered
                </span>
              </div>

              <Progress value={progress} className="h-1.5" />
            </div>

            {currentQ && (
              <Card
                className="mb-4 p-6 glass animate-fade-in-up"
                key={currentQ.id}
              >
                <span className="mb-3 inline-block rounded-full bg-muted/30 px-2 py-0.5 text-xs text-muted-foreground">
                  {currentQ.lessonTitle}
                </span>

                <h3 className="mb-4 text-lg font-semibold">
                  {currentQ.question}
                </h3>

                <div className="space-y-2">
                  {currentQ.options.map((option, index) => {
                    const isSelected =
                      state.answers[currentQ.id] === index

                    return (
                      <button
                        key={index}
                        onClick={() =>
                          setState((previous) => ({
                            ...previous,
                            answers: {
                              ...previous.answers,
                              [currentQ.id]: index,
                            },
                          }))
                        }
                        className={cn(
                          'w-full rounded-lg border-2 px-4 py-3 text-left transition-all',
                          isSelected
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/40 hover:bg-muted/30'
                        )}
                      >
                        <span className="text-sm">{option}</span>
                      </button>
                    )
                  })}
                </div>
              </Card>
            )}

            <div className="flex items-center justify-between gap-3">
              <Button
                variant="outline"
                onClick={() =>
                  setState((previous) => ({
                    ...previous,
                    currentQuestion: Math.max(
                      0,
                      previous.currentQuestion - 1
                    ),
                  }))
                }
                disabled={state.currentQuestion === 0}
              >
                Previous
              </Button>

              <div className="flex flex-wrap items-center justify-center gap-1">
                {questions.map((question, index) => (
                  <button
                    key={question.id}
                    aria-label={`Go to question ${index + 1}`}
                    title={`Question ${index + 1}`}
                    onClick={() =>
                      setState((previous) => ({
                        ...previous,
                        currentQuestion: index,
                      }))
                    }
                    className={cn(
                      'h-2.5 w-2.5 rounded-full transition-all',
                      index === state.currentQuestion
                        ? 'scale-125 bg-primary'
                        : state.answers[question.id] !== undefined
                          ? 'bg-primary/40'
                          : 'bg-muted/40'
                    )}
                  />
                ))}
              </div>

              {state.currentQuestion < questions.length - 1 ? (
                <Button
                  onClick={() =>
                    setState((previous) => ({
                      ...previous,
                      currentQuestion: previous.currentQuestion + 1,
                    }))
                  }
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={() =>
                    setState((previous) => ({
                      ...previous,
                      submitted: true,
                    }))
                  }
                  disabled={!allAnswered}
                  className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Submit
                </Button>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-6 animate-fade-in-up">
            <Card className="p-8 text-center glass">
              <div
                className={cn(
                  'mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border-2',
                  scorePct >= 80
                    ? 'border-success/30 bg-success/10'
                    : scorePct >= 50
                      ? 'border-warning/30 bg-warning/10'
                      : 'border-error/30 bg-error/10'
                )}
              >
                {scorePct >= 80 ? (
                  <Trophy className="h-10 w-10 text-success" />
                ) : scorePct >= 50 ? (
                  <Target className="h-10 w-10 text-warning" />
                ) : (
                  <RotateCcw className="h-10 w-10 text-error" />
                )}
              </div>

              <h2 className="mb-2 text-2xl font-bold">
                {score} / {questions.length}
              </h2>

              <p className="mb-6 text-muted-foreground">
                {scorePct >= 80
                  ? "Excellent! You've mastered this material."
                  : scorePct >= 50
                    ? 'Good progress! Review and try again.'
                    : 'Keep learning! Check the lessons and try again.'}
              </p>

              <div className="flex items-center justify-center gap-4">
                <Button
                  onClick={() => resetAssessment(state.activeModule)}
                  variant="outline"
                  className="gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Retake
                </Button>

                <Button
                  asChild
                  className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Link to="/learn">
                    Review Lessons
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </Card>

            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Award className="h-4 w-4 text-primary" />
                Answer Review
              </h3>

              {questions.map((question, index) => {
                const userAnswer = state.answers[question.id]
                const correct =
                  userAnswer === question.correctIndex

                return (
                  <Card key={question.id} className="p-4 glass">
                    <div className="flex items-start gap-3">
                      {correct ? (
                        <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-success" />
                      ) : (
                        <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-error" />
                      )}

                      <div className="flex-1">
                        <p className="mb-2 text-sm font-medium">
                          {index + 1}. {question.question}
                        </p>

                        <div className="space-y-1 text-xs">
                          <p
                            className={cn(
                              'text-muted-foreground',
                              correct && 'text-success'
                            )}
                          >
                            Your answer:{' '}
                            {userAnswer === undefined
                              ? 'Not answered'
                              : question.options[userAnswer]}
                          </p>

                          {!correct && (
                            <p className="text-success">
                              Correct:{' '}
                              {question.options[question.correctIndex]}
                            </p>
                          )}

                          <p className="mt-1 text-muted-foreground">
                            {question.explanation}
                          </p>
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
