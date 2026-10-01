import './App.css'
import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { QLoopCircuitProvider } from '@/context/QLoopCircuitContext'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import LandingPage from '@/pages/LandingPage'
import AuthPage from '@/pages/AuthPage'
import LearnPage from '@/pages/LearnPage'
import LessonDetailPage from '@/pages/LessonDetailPage'
import CircuitBuilderPage from '@/pages/CircuitBuilderPage'
import CodeLabPage from '@/pages/CodeLabPage'
import SimulatorPage from '@/pages/SimulatorPage'
import VisualizerPage from '@/pages/VisualizerPage'
import AIAssistantPage from '@/pages/AIAssistantPage'
import ChallengesPage from '@/pages/ChallengesPage'
import AssessmentPage from '@/pages/AssessmentPage'
import DashboardPage from '@/pages/DashboardPage'
import InstructorPage from '@/pages/InstructorPage'
import NotFoundPage from '@/pages/NotFoundPage'

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant',
    })
  }, [pathname])

  return null
}

function App() {
  return (
    <QLoopCircuitProvider>
      <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <ScrollToTop />

      <main className="pt-16">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/learn" element={<LearnPage />} />
          <Route path="/learn/:lessonId" element={<LessonDetailPage />} />
          <Route path="/circuit" element={<CircuitBuilderPage />} />
          <Route path="/code-lab" element={<CodeLabPage />} />
          <Route path="/simulate" element={<SimulatorPage />} />
          <Route path="/visualize" element={<VisualizerPage />} />
          <Route path="/ai-assistant" element={<AIAssistantPage />} />
          <Route path="/challenges" element={<ChallengesPage />} />
          <Route path="/assess" element={<AssessmentPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/instructor" element={<InstructorPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <Footer />
    </div>
  </QLoopCircuitProvider>
  )
}

export default App