import { Link } from 'react-router-dom';
import {
  BookOpen,
  CircuitBoard,
  Play,
  Eye,
  Brain,
  ClipboardCheck,
  TrendingUp,
  Atom,
  Sigma,
  Radio,
  Binary,
  Cpu,
  Gauge,
  ShieldCheck,
  HardDrive,
  Code2,
  FlaskConical,
  Telescope,
  Sparkles,
  ArrowRight,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MODULES, getLessonCount, getTotalDuration } from '@/lib/quantum/lessons';
import { cn } from '@/lib/utils';

/* -------------------------------------------------------------------------- */
/*  Icon mapping — module.icon is a string, map it to a lucide component.     */
/* -------------------------------------------------------------------------- */

const MODULE_ICONS: Record<string, LucideIcon> = {
  Sigma,
  Atom,
  CircuitBoard,
  Radio,
  Binary,
  Cpu,
  Gauge,
  ShieldCheck,
  HardDrive,
  Code2,
  Brain,
  FlaskConical,
  Telescope,
};

function getModuleIcon(name: string): LucideIcon {
  return MODULE_ICONS[name] ?? Atom;
}

/* -------------------------------------------------------------------------- */
/*  Static section data                                                        */
/* -------------------------------------------------------------------------- */

const CYCLE_STEPS = [
  { label: 'LEARN', icon: BookOpen, description: 'Build intuition with structured lessons.' },
  { label: 'BUILD', icon: CircuitBoard, description: 'Compose circuits gate by gate.' },
  { label: 'SIMULATE', icon: Play, description: 'Run on a real state-vector engine.' },
  { label: 'VISUALIZE', icon: Eye, description: 'See states on the Bloch sphere.' },
  { label: 'UNDERSTAND', icon: Brain, description: 'Get AI-guided explanations.' },
  { label: 'PRACTICE', icon: ClipboardCheck, description: 'Test yourself with assessments.' },
  { label: 'IMPROVE', icon: TrendingUp, description: 'Track progress and refine.' },
] as const;

const FEATURES = [
  {
    icon: BookOpen,
    title: 'Structured Learning',
    description:
      'A guided curriculum from linear algebra to Shor’s algorithm — every concept builds on the last.',
  },
  {
    icon: CircuitBoard,
    title: 'Circuit Builder',
    description:
      'Drag, drop, and wire qubits with a visual editor backed by a real quantum gate library.',
  },
  {
    icon: Play,
    title: 'Real Simulation',
    description:
      'A built-in state-vector simulator computes amplitudes and measurement probabilities live.',
  },
  {
    icon: Eye,
    title: 'Bloch Sphere Visualization',
    description:
      'Rotate and inspect single-qubit states in 3D — watch superposition and phase come alive.',
  },
  {
    icon: Brain,
    title: 'AI Tutor',
    description:
      'Ask questions in plain language and get context-aware explanations tuned to your level.',
  },
  {
    icon: ClipboardCheck,
    title: 'Assessment',
    description:
      'Quizzes after every lesson reinforce understanding and surface gaps before they compound.',
  },
] as const;

/* -------------------------------------------------------------------------- */
/*  Small presentational helpers                                              */
/* -------------------------------------------------------------------------- */

function SectionHeading({
  eyebrow,
  title,
  subtitle,
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div className={cn('mx-auto max-w-3xl text-center', className)}>
      {eyebrow && (
        <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300 animate-fade-in-up">
          <Sparkles className="h-3.5 w-3.5" />
          {eyebrow}
        </span>
      )}
      <h2 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl animate-fade-in-up">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-base leading-relaxed text-slate-400 sm:text-lg animate-fade-in-up">
          {subtitle}
        </p>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function LandingPage() {
  const lessonCount = getLessonCount();
  const totalMinutes = getTotalDuration();
  const totalHours = Math.max(1, Math.round(totalMinutes / 60));

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#05070d] text-slate-100">
      {/* Ambient backgrounds ------------------------------------------------ */}
      <div className="pointer-events-none fixed inset-0 grid-bg opacity-40" aria-hidden />
      <div className="pointer-events-none fixed inset-0 starfield opacity-70" aria-hidden />
      <div
        className="pointer-events-none fixed inset-0"
        aria-hidden
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(34,211,238,0.18), transparent 60%), radial-gradient(ellipse 60% 50% at 90% 20%, rgba(34,211,238,0.08), transparent 50%)',
        }}
      />

      <main className="relative z-10">
        {/* ---------------------------------------------------------------- */}
        {/*  HERO                                                             */}
        {/* ---------------------------------------------------------------- */}
        <section className="relative mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-center px-6 py-24 text-center">
          {/* Animated atom decoration */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 animate-spin-slow opacity-30 sm:h-[42rem] sm:w-[42rem]" aria-hidden>
            <div className="absolute inset-0 rounded-full border border-cyan-400/20" />
            <div className="absolute inset-8 rounded-full border border-cyan-400/15" />
            <div className="absolute inset-16 rounded-full border border-cyan-400/10" />
            <div className="absolute inset-24 rounded-full border border-cyan-400/10" />
            {/* Orbiting electron */}
            <div className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 rounded-full bg-cyan-300 quantum-glow" />
          </div>

          <div className="animate-float">
            <Atom className="mx-auto h-16 w-16 text-cyan-400 quantum-glow" strokeWidth={1.25} />
          </div>

          <span className="mt-8 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300 animate-fade-in-up">
            <Zap className="h-3.5 w-3.5" />
            Q-loop · Quantum Learning Platform
          </span>

          <h1 className="mt-6 max-w-4xl text-4xl font-extrabold leading-[1.1] tracking-tight text-white text-glow sm:text-5xl md:text-6xl lg:text-7xl animate-fade-in-up">
            Master Quantum Algorithms
            <span className="block bg-gradient-to-r from-cyan-300 via-cyan-200 to-cyan-400 bg-clip-text text-transparent">
              From Theory to Practice
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-300 animate-fade-in-up sm:text-xl">
            Learn the fundamentals, build real quantum circuits, simulate them in your browser,
            and visualize states on the Bloch sphere — all in one immersive platform.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row animate-fade-in-up">
            <Button asChild size="lg" className="quantum-glow border border-cyan-400/40 bg-cyan-400/10 text-cyan-100 hover:bg-cyan-400/20">
              <Link to="/learn">
                Start Learning
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-cyan-400/30 bg-transparent text-cyan-100 hover:bg-cyan-400/10 hover:text-cyan-50">
              <Link to="/circuit">
                <CircuitBoard className="mr-2 h-4 w-4" />
                Open Circuit Builder
              </Link>
            </Button>
          </div>

          {/* Scroll cue */}
          <div className="mt-20 flex flex-col items-center gap-2 text-cyan-400/60 animate-pulse-glow">
            <span className="text-[0.65rem] uppercase tracking-[0.3em]">Explore</span>
            <div className="h-10 w-px bg-gradient-to-b from-cyan-400/60 to-transparent" />
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/*  LEARNING CYCLE                                                   */}
        {/* ---------------------------------------------------------------- */}
        <section className="relative mx-auto max-w-7xl px-6 py-24">
          <SectionHeading
            eyebrow="The Q-loop Method"
            title="A Complete Learning Cycle"
            subtitle="Q-loop isn’t a collection of videos — it’s a closed loop. Every step feeds the next, turning passive reading into active mastery."
          />

          <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-7">
            {CYCLE_STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.label}
                  className="group relative flex flex-col items-center text-center animate-fade-in-up"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  {/* Connector arrow (hidden on last item + small screens) */}
                  {i < CYCLE_STEPS.length - 1 && (
                    <div className="absolute -right-2 top-7 hidden h-px w-4 bg-gradient-to-r from-cyan-400/40 to-transparent lg:block" />
                  )}
                  <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/5 text-cyan-300 transition-all duration-300 group-hover:border-cyan-400/50 group-hover:bg-cyan-400/10 group-hover:quantum-glow">
                    <Icon className="h-6 w-6" />
                    <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full border border-cyan-400/30 bg-[#05070d] text-[0.6rem] font-bold text-cyan-300">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="mt-4 text-sm font-semibold uppercase tracking-wider text-white">
                    {step.label}
                  </h3>
                  <p className="mt-1 text-xs leading-snug text-slate-400">{step.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/*  FEATURES                                                         */}
        {/* ---------------------------------------------------------------- */}
        <section className="relative mx-auto max-w-7xl px-6 py-24">
          <SectionHeading
            eyebrow="Features"
            title="Everything You Need to Go Quantum"
            subtitle="Six tightly integrated tools that take you from your first qubit to running Grover’s algorithm."
          />

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={feature.title}
                  className="group glass relative overflow-hidden border-cyan-400/10 bg-white/[0.02] transition-all duration-300 hover:border-cyan-400/40 hover:bg-cyan-400/[0.04] animate-fade-in-up"
                >
                  <div
                    className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-cyan-400/10 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
                    aria-hidden
                  />
                  <CardHeader>
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/5 text-cyan-300 transition-colors group-hover:border-cyan-400/40 group-hover:text-cyan-200">
                      <Icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-lg font-semibold text-white">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm leading-relaxed text-slate-400">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                  <span className="sr-only" style={{ animationDelay: `${i * 60}ms` }} />
                </Card>
              );
            })}
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/*  MODULES PREVIEW                                                  */}
        {/* ---------------------------------------------------------------- */}
        <section className="relative mx-auto max-w-7xl px-6 py-24">
          <SectionHeading
            eyebrow="Curriculum"
            title="Modules From Foundations to Frontier"
            subtitle={`A structured path through ${MODULES.length} modules — each with focused lessons, worked circuits, and quizzes.`}
          />

          <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {MODULES.map((module, i) => {
              const Icon = getModuleIcon(module.icon);
              const lessonLen = module.lessons.length;
              return (
                <Card
                  key={module.id}
                  className="group glass-strong relative overflow-hidden border-cyan-400/10 bg-white/[0.03] transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/40 animate-fade-in-up"
                >
                  <div
                    className="absolute inset-x-0 top-0 h-px opacity-60"
                    style={{ background: `linear-gradient(90deg, transparent, ${module.color}, transparent)` }}
                    aria-hidden
                  />
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div
                        className="flex h-11 w-11 items-center justify-center rounded-xl border bg-white/[0.03] transition-all group-hover:scale-105"
                        style={{
                          borderColor: `${module.color}40`,
                          color: module.color,
                        }}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="rounded-full border border-cyan-400/20 bg-cyan-400/5 px-2.5 py-1 text-[0.65rem] font-medium uppercase tracking-wider text-cyan-300">
                        {lessonLen} {lessonLen === 1 ? 'lesson' : 'lessons'}
                      </span>
                    </div>
                    <CardTitle className="mt-4 text-base font-semibold text-white">
                      {module.title}
                    </CardTitle>
                    <CardDescription className="mt-1 text-sm leading-relaxed text-slate-400">
                      {module.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="px-0 text-cyan-300 hover:bg-transparent hover:text-cyan-200"
                    >
                      <Link to="/learn">
                        Explore module
                        <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </Button>
                  </CardContent>
                  <span className="sr-only" style={{ animationDelay: `${i * 50}ms` }} />
                </Card>
              );
            })}
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/*  STATS                                                            */}
        {/* ---------------------------------------------------------------- */}
        <section className="relative mx-auto max-w-7xl px-6 py-20">
          <div className="glass-strong relative overflow-hidden rounded-3xl border border-cyan-400/20 px-8 py-14 text-center">
            <div
              className="pointer-events-none absolute inset-0 opacity-40"
              aria-hidden
              style={{
                background:
                  'radial-gradient(ellipse 60% 80% at 50% 0%, rgba(34,211,238,0.15), transparent 70%)',
              }}
            />
            <div className="relative grid grid-cols-2 gap-8 md:grid-cols-4">
              {[
                { value: MODULES.length, label: 'Learning Modules' },
                { value: lessonCount, label: 'Interactive Lessons' },
                { value: `${totalHours}h`, label: 'Of Guided Content' },
                { value: '∞', label: 'Circuits to Build' },
              ].map((stat) => (
                <div key={stat.label} className="animate-fade-in-up">
                  <div className="text-4xl font-extrabold tracking-tight text-white text-glow sm:text-5xl">
                    {stat.value}
                  </div>
                  <div className="mt-2 text-xs font-medium uppercase tracking-[0.2em] text-cyan-300/80">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/*  CTA                                                              */}
        {/* ---------------------------------------------------------------- */}
        <section className="relative mx-auto max-w-5xl px-6 py-24">
          <div className="glass relative overflow-hidden rounded-3xl border border-cyan-400/30 px-8 py-16 text-center sm:px-16">
            <div
              className="pointer-events-none absolute inset-0"
              aria-hidden
              style={{
                background:
                  'radial-gradient(ellipse 70% 100% at 50% 50%, rgba(34,211,238,0.12), transparent 70%)',
              }}
            />
            <div className="relative">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/5 text-cyan-300 animate-pulse-glow">
                <Atom className="h-8 w-8" strokeWidth={1.25} />
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-white text-glow sm:text-4xl md:text-5xl animate-fade-in-up">
                Ready to Enter the Quantum Realm?
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg animate-fade-in-up">
                Start with the fundamentals or jump straight into the circuit builder.
                Your quantum journey begins with a single qubit.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row animate-fade-in-up">
                <Button asChild size="lg" className="quantum-glow border border-cyan-400/40 bg-cyan-400/10 text-cyan-100 hover:bg-cyan-400/20">
                  <Link to="/learn">
                    Begin Learning
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-cyan-400/30 bg-transparent text-cyan-100 hover:bg-cyan-400/10 hover:text-cyan-50">
                  <Link to="/circuit">
                    <CircuitBoard className="mr-2 h-4 w-4" />
                    Launch Circuit Lab
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          <p className="mt-12 text-center text-xs uppercase tracking-[0.3em] text-slate-600">
            Q-loop · Built for the curious
          </p>
        </section>
      </main>
    </div>
  );
}
