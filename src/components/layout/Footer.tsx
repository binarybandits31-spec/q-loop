import { Atom } from 'lucide-react'
import { Link } from 'react-router-dom'

export function Footer() {
  return (
    <footer className="border-t border-border/50 mt-20">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <Atom className="w-7 h-7 text-primary" />
              <span className="text-lg font-bold">Q<span className="text-primary">-</span>loop</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
              An AI-based interactive quantum algorithm learning platform. Master quantum computing through structured learning, circuit design, simulation, and visualization.
            </p>
            <p className="text-xs text-muted-foreground/60 mt-4">SIH26140 — Egreen Quanta — Smart Education</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3 text-foreground">Platform</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/learn" className="hover:text-primary transition-colors">Learn</Link></li>
              <li><Link to="/circuit" className="hover:text-primary transition-colors">Circuit Builder</Link></li>
              <li><Link to="/code-lab" className="hover:text-primary transition-colors">Code Lab</Link></li>
              <li><Link to="/simulate" className="hover:text-primary transition-colors">Simulator</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3 text-foreground">Resources</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/ai-assistant" className="hover:text-primary transition-colors">AI Tutor</Link></li>
              <li><Link to="/challenges" className="hover:text-primary transition-colors">Challenges</Link></li>
              <li><Link to="/assess" className="hover:text-primary transition-colors">Assessment</Link></li>
              <li><Link to="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-border/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground/60">© 2026 Q-loop. Built for Smart India Hackathon.</p>
        </div>
      </div>
    </footer>
  )
}
