import { MODULES, getAllLessons } from './lessons'

export interface Recommendation {
  type: 'lesson' | 'practice' | 'review' | 'challenge'
  title: string; description: string; targetId: string
  priority: 'low' | 'medium' | 'high'
}

export interface ProgressData {
  completedLessons: string[]
  quizScores: Record<string, { score: number; total: number }>
  challengeScores: Record<string, { score: number; maxScore: number }>
  mistakes: { module: string; type: string; count: number }[]
}

export function generateRecommendations(progress: ProgressData): Recommendation[] {
  const recs: Recommendation[] = []
  const allLessons = getAllLessons()

  const nextLesson = allLessons.find((l) => !progress.completedLessons.includes(l.id))
  if (nextLesson) {
    const module = MODULES.find((m) => m.id === nextLesson.moduleId)
    recs.push({ type: 'lesson', title: `Continue: ${nextLesson.title}`, description: `Pick up where you left off in ${module?.title}. ~${nextLesson.duration} min.`, targetId: nextLesson.id, priority: 'high' })
  }

  Object.entries(progress.quizScores).forEach(([lessonId, { score, total }]) => {
    const pct = (score / total) * 100
    if (pct < 60 && pct > 0) {
      const lesson = allLessons.find((l) => l.id === lessonId)
      if (lesson) recs.push({ type: 'review', title: `Review: ${lesson.title}`, description: `Your quiz score was ${score}/${total}. Review to strengthen understanding.`, targetId: lessonId, priority: 'high' })
    }
  })

  const mistakeByModule: Record<string, number> = {}
  progress.mistakes.forEach((m) => { mistakeByModule[m.module] = (mistakeByModule[m.module] || 0) + m.count })
  Object.entries(mistakeByModule).forEach(([moduleId, count]) => {
    if (count >= 3) {
      const module = MODULES.find((m) => m.id === moduleId)
      if (module) recs.push({ type: 'practice', title: `Practice: ${module.title}`, description: `You've made ${count} mistakes in this area. Practice with challenges to improve.`, targetId: moduleId, priority: 'medium' })
    }
  })

  if (Object.keys(progress.challengeScores).length < 3 && progress.completedLessons.length > 0)
    recs.push({ type: 'challenge', title: 'Try a Circuit Challenge', description: 'Put your knowledge to the test with a hands-on challenge.', targetId: 'circuit-challenge', priority: 'medium' })

  const avgQuiz = Object.values(progress.quizScores).reduce((a, { score, total }) => a + (score / total), 0) / Math.max(Object.keys(progress.quizScores).length, 1)
  if (avgQuiz > 0.85) {
    const advanced = allLessons.find((l) => l.difficulty === 'Advanced' && !progress.completedLessons.includes(l.id))
    if (advanced) recs.push({ type: 'lesson', title: `Ready for Advanced: ${advanced.title}`, description: 'Your quiz performance is excellent! Try advanced topics.', targetId: advanced.id, priority: 'low' })
  }

  const order = { high: 0, medium: 1, low: 2 }
  recs.sort((a, b) => order[a.priority] - order[b.priority])
  return recs.slice(0, 5)
}
