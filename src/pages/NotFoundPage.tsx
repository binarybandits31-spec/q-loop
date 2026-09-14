import { Link } from 'react-router-dom'
import { Atom, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="p-10 glass text-center max-w-md">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-6">
          <Atom className="w-8 h-8 text-primary animate-spin-slow" />
        </div>
        <h1 className="text-4xl font-bold mb-2">404</h1>
        <p className="text-muted-foreground mb-6">This page collapsed into a different state. Let's get you back.</p>
        <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
          <Link to="/" className="flex items-center gap-2"><Home className="w-4 h-4" /> Back Home</Link>
        </Button>
      </Card>
    </div>
  )
}
