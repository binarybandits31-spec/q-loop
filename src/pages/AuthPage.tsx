import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Atom, Mail, Lock, User, GraduationCap, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type Tab = 'signin' | 'signup';
type Role = 'student';

export default function AuthPage() {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();

  const [tab, setTab] = useState<Tab>('signin');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Sign-in fields
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Sign-up fields
  const [displayName, setDisplayName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [role] = useState<Role>('student');

  function resetError() {
    if (error) setError(null);
  }

  async function handleSignIn(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: signInError } = await signIn(
      signInEmail,
      signInPassword,
    );

    setLoading(false);

    if (signInError) {
      setError(signInError);
      return;
    }

    navigate('/dashboard');
  }

  async function handleSignUp(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: signUpError } = await signUp(
      signUpEmail,
      signUpPassword,
      displayName,
      role,
    );

    setLoading(false);

    if (signUpError) {
      setError(signUpError);
      return;
    }

    navigate('/dashboard');
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#05070d] text-slate-100">
      {/* Ambient backgrounds */}
      <div
        className="pointer-events-none fixed inset-0 grid-bg opacity-40"
        aria-hidden
      />

      <div
        className="pointer-events-none fixed inset-0"
        aria-hidden
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(34,211,238,0.18), transparent 60%), radial-gradient(ellipse 60% 50% at 90% 20%, rgba(34,211,238,0.08), transparent 50%)',
        }}
      />

      <main className="relative z-10 flex min-h-screen items-center justify-center px-6 py-16">
        <div className="w-full max-w-md animate-fade-in-up">

          {/* Brand */}
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="animate-float">
              <Atom
                className="h-12 w-12 text-cyan-400 quantum-glow"
                strokeWidth={1.25}
              />
            </div>

            <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">
              Q-loop · Quantum Learning Platform
            </span>
          </div>

          <Card className="glass relative overflow-hidden border-cyan-400/15 bg-white/[0.03] backdrop-blur-xl">

            {/* Glow accent */}
            <div
              className="pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-cyan-400/10 blur-3xl"
              aria-hidden
            />

            <CardHeader className="relative space-y-1.5 text-center">
              <CardTitle className="text-2xl font-bold tracking-tight text-white">
                {tab === 'signin' ? 'Welcome Back' : 'Join Q-loop'}
              </CardTitle>

              <CardDescription className="text-sm text-slate-400">
                {tab === 'signin'
                  ? 'Sign in to continue your quantum journey.'
                  : 'Create an account to start learning quantum computing.'}
              </CardDescription>
            </CardHeader>

            <CardContent className="relative">

              {/* Tab switcher */}
              <div className="mb-6 grid grid-cols-2 gap-1 rounded-lg border border-cyan-400/15 bg-cyan-400/[0.03] p-1">
                <button
                  type="button"
                  onClick={() => {
                    setTab('signin');
                    resetError();
                  }}
                  className={cn(
                    'rounded-md px-4 py-2 text-sm font-medium transition-all',
                    tab === 'signin'
                      ? 'bg-cyan-400/15 text-cyan-100 shadow-sm quantum-glow'
                      : 'text-slate-400 hover:text-slate-200',
                  )}
                >
                  Sign In
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTab('signup');
                    resetError();
                  }}
                  className={cn(
                    'rounded-md px-4 py-2 text-sm font-medium transition-all',
                    tab === 'signup'
                      ? 'bg-cyan-400/15 text-cyan-100 shadow-sm quantum-glow'
                      : 'text-slate-400 hover:text-slate-200',
                  )}
                >
                  Sign Up
                </button>
              </div>

              {/* Error alert */}
              {error && (
                <div
                  role="alert"
                  className="mb-5 flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                  <span className="leading-snug">{error}</span>
                </div>
              )}

              {/* Sign In form */}
              {tab === 'signin' && (
                <form onSubmit={handleSignIn} className="space-y-4">

                  <div className="space-y-2">
                    <Label
                      htmlFor="signin-email"
                      className="text-slate-200"
                    >
                      Email
                    </Label>

                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-400/60" />

                      <Input
                        id="signin-email"
                        type="email"
                        autoComplete="email"
                        required
                        placeholder="you@example.com"
                        value={signInEmail}
                        onChange={(e) => setSignInEmail(e.target.value)}
                        className="border-cyan-400/20 bg-white/[0.03] pl-9 text-slate-100 placeholder:text-slate-500 focus-visible:border-cyan-400/50 focus-visible:ring-cyan-400/30"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="signin-password"
                      className="text-slate-200"
                    >
                      Password
                    </Label>

                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-400/60" />

                      <Input
                        id="signin-password"
                        type="password"
                        autoComplete="current-password"
                        required
                        placeholder="••••••••"
                        value={signInPassword}
                        onChange={(e) => setSignInPassword(e.target.value)}
                        className="border-cyan-400/20 bg-white/[0.03] pl-9 text-slate-100 placeholder:text-slate-500 focus-visible:border-cyan-400/50 focus-visible:ring-cyan-400/30"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full border border-cyan-400/40 bg-cyan-400/10 text-cyan-100 hover:bg-cyan-400/20 quantum-glow"
                  >
                    {loading ? 'Signing in…' : 'Sign In'}
                  </Button>
                </form>
              )}

              {/* Sign Up form */}
              {tab === 'signup' && (
                <form onSubmit={handleSignUp} className="space-y-4">

                  {/* Display Name */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="signup-name"
                      className="text-slate-200"
                    >
                      Display Name
                    </Label>

                    <div className="relative">
                      <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-400/60" />

                      <Input
                        id="signup-name"
                        type="text"
                        autoComplete="name"
                        required
                        placeholder="Ada Lovelace"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="border-cyan-400/20 bg-white/[0.03] pl-9 text-slate-100 placeholder:text-slate-500 focus-visible:border-cyan-400/50 focus-visible:ring-cyan-400/30"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="signup-email"
                      className="text-slate-200"
                    >
                      Email
                    </Label>

                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-400/60" />

                      <Input
                        id="signup-email"
                        type="email"
                        autoComplete="email"
                        required
                        placeholder="you@example.com"
                        value={signUpEmail}
                        onChange={(e) => setSignUpEmail(e.target.value)}
                        className="border-cyan-400/20 bg-white/[0.03] pl-9 text-slate-100 placeholder:text-slate-500 focus-visible:border-cyan-400/50 focus-visible:ring-cyan-400/30"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="signup-password"
                      className="text-slate-200"
                    >
                      Password
                    </Label>

                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-400/60" />

                      <Input
                        id="signup-password"
                        type="password"
                        autoComplete="new-password"
                        required
                        placeholder="••••••••"
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                        className="border-cyan-400/20 bg-white/[0.03] pl-9 text-slate-100 placeholder:text-slate-500 focus-visible:border-cyan-400/50 focus-visible:ring-cyan-400/30"
                      />
                    </div>
                  </div>

                  {/* Role */}
                  <div className="space-y-2">
                    <Label className="text-slate-200">
                      Role
                    </Label>

                    <div className="flex items-center gap-3 rounded-lg border border-cyan-400/50 bg-cyan-400/10 px-4 py-3 text-cyan-100 quantum-glow">
                      <GraduationCap className="h-4 w-4 text-cyan-400" />
                      <span className="text-sm font-medium">
                        Student
                      </span>
                    </div>
                  </div>

                  {/* Create Account */}
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full border border-cyan-400/40 bg-cyan-400/10 text-cyan-100 hover:bg-cyan-400/20 quantum-glow"
                  >
                    {loading ? 'Creating account…' : 'Create Account'}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          <p className="mt-6 text-center text-xs text-slate-500">
            By continuing you agree to explore the quantum realm responsibly.
          </p>
        </div>
      </main>
    </div>
  );
}