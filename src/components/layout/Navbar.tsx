import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Atom, Menu, X, LogOut, User as UserIcon, GraduationCap } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'

const NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/learn', label: 'Learn' },
  { to: '/circuit', label: 'Circuit Builder' },
  { to: '/code-lab', label: 'Code Lab' },
  { to: '/simulate', label: 'Simulator' },
  { to: '/challenges', label: 'Challenges' },
  { to: '/visualize', label: 'Visualize' },
  { to: '/ai-assistant', label: 'AI Tutor' },
  { to: '/assess', label: 'Assess' },
]

export function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, profile, signOut } = useAuth()

  const links = profile?.role === 'instructor'
    ? [...NAV_LINKS, { to: '/instructor', label: 'Instructor' }]
    : NAV_LINKS

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-strong border-b border-border/50">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="relative w-9 h-9 flex items-center justify-center">
              <div className="absolute inset-0 bg-primary/20 rounded-lg blur-md group-hover:bg-primary/30 transition-colors" />
              <Atom className="w-7 h-7 text-primary relative z-10 group-hover:rotate-180 transition-transform duration-700" />
            </div>
            <span className="text-xl font-bold tracking-tight">Q<span className="text-primary">-</span>loop</span>
          </Link>

          <div className="hidden lg:flex items-center gap-0.5">
            {links.map((link) => {
              const isActive = location.pathname === link.to || (link.to !== '/' && location.pathname.startsWith(link.to))
              return (
                <Link key={link.to} to={link.to}
                  className={cn('px-2.5 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
                    isActive ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50')}>
                  {link.label}
                </Link>
              )
            })}
          </div>

          <div className="hidden lg:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                <Link to="/dashboard" className="flex items-center gap-2 px-3 py-1.5 rounded-lg glass hover:border-primary/30 transition-colors">
                  <UserIcon className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium max-w-[100px] truncate">{profile?.display_name || 'User'}</span>
                  {profile?.role === 'instructor' && <GraduationCap className="w-3.5 h-3.5 text-warning" />}
                </Link>
                <Button variant="ghost" size="sm" onClick={() => { signOut(); navigate('/') }} className="gap-1.5">
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 quantum-glow">
                <Link to="/auth">Sign In</Link>
              </Button>
            )}
          </div>

          <button className="lg:hidden p-2 text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="lg:hidden pb-4 flex flex-col gap-1 animate-fade-in-up max-h-[80vh] overflow-y-auto scrollbar-thin">
            {links.map((link) => (
              <Link key={link.to} to={link.to} onClick={() => setMobileOpen(false)}
                className={cn('px-4 py-2.5 rounded-lg text-sm font-medium',
                  location.pathname === link.to ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50')}>
                {link.label}
              </Link>
            ))}
            {user ? (
              <button onClick={() => { signOut(); setMobileOpen(false); navigate('/'); }}
                className="px-4 py-2.5 rounded-lg text-sm font-medium text-left text-muted-foreground hover:text-foreground hover:bg-muted/50 flex items-center gap-2">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            ) : (
              <Link to="/auth" onClick={() => setMobileOpen(false)} className="px-4 py-2.5 rounded-lg text-sm font-medium text-primary bg-primary/10">Sign In</Link>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
