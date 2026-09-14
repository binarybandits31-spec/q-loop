import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

type UserRole = 'student' | 'instructor'

interface Profile {
  id: string; email: string; display_name: string | null
  role: UserRole; learning_level: string; streak_days: number; total_study_minutes: number
}

interface AuthContextType {
  user: User | null; session: Session | null; profile: Profile | null; loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, displayName: string, role: UserRole) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session); setUser(session?.user ?? null)
      if (session?.user) loadProfile(session.user.id); else setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session); setUser(session?.user ?? null)
      if (session?.user) { (async () => { await loadProfile(session.user.id) })() }
      else { setProfile(null); setLoading(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function loadProfile(userId: string) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
    if (data) setProfile(data as Profile)
    setLoading(false)
  }

  async function refreshProfile() { if (user) await loadProfile(user.id) }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }

  async function signUp(email: string, password: string, displayName: string, role: UserRole) {
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { display_name: displayName, role } } })
    if (error) return { error: error.message }
    if (data.user) await supabase.from('profiles').upsert({ id: data.user.id, email, display_name: displayName, role })
    return { error: null }
  }

  async function signOut() { await supabase.auth.signOut(); setProfile(null) }

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
