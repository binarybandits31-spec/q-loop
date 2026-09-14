import { useState, useRef, useEffect, useCallback } from 'react';
import * as d3 from 'd3';
import Plotly from 'plotly.js-dist-min';
import { Eye, RotateCcw, Atom, Activity, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  simulateCircuit,
  getBlochVector,
  type StateVector,
  type CircuitGate,
} from '@/lib/quantum/simulator';
import { GATE_INFO, type GateType } from '@/lib/quantum/gates';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const GATE_BUTTONS: GateType[] = ['H', 'X', 'Y', 'Z', 'S', 'T', 'RX', 'RY', 'RZ'];
const ROTATION_GATES: GateType[] = ['RX', 'RY', 'RZ'];
const SHOTS = 1024;

// Bloch sphere projection geometry
const SPHERE_R = 130; // 3D sphere radius
const SVG_SIZE = 360;
const CENTER = SVG_SIZE / 2;

// Iso projection: x right, y into-screen, z up.
// Screen: sx = x, sy = -z, depth (for stroke opacity) = y.
const project = (x: number, y: number, z: number) => ({
  sx: CENTER + x * SPHERE_R,
  sy: CENTER - z * SPHERE_R,
  depth: y, // -R (front) .. +R (back)
});

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function VisualizerPage() {
  /* ----- state ----- */
  const [numQubits, setNumQubits] = useState(1);
  const [targetQubit, setTargetQubit] = useState(0);
  const [gates, setGates] = useState<CircuitGate[]>([]);
  const [angle, setAngle] = useState(Math.PI / 2);
  const [stateVector, setStateVector] = useState<StateVector | null>(null);
  const [probabilities, setProbabilities] = useState<number[]>([]);
  const [histogram, setHistogram] = useState<{ state: string; count: number; probability: number }[]>([]);

  /* ----- refs ----- */
  const blochRef = useRef<SVGSVGElement | null>(null);
  const plotlyRef = useRef<HTMLDivElement | null>(null);

  /* ----- apply gates & recompute ----- */
  const recompute = useCallback((nextGates: CircuitGate[], n: number) => {
    // 0-shot run for the pure state vector + probabilities
    const stateSim = simulateCircuit(nextGates, n, 0);
    setStateVector(stateSim.stateVector);
    setProbabilities(stateSim.probabilities);

    // shot run for the measurement histogram
    const shotSim = simulateCircuit(nextGates, n, SHOTS);
    setHistogram(shotSim.histogram);
  }, []);

  // initial compute
  useEffect(() => {
    recompute([], 1);
  }, [recompute]);

  const applyGate = useCallback(
    (type: GateType) => {
      const gate: CircuitGate = {
        id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        type,
        qubit: targetQubit,
        parameter: ROTATION_GATES.includes(type) ? angle : undefined,
      };
      const next = [...gates, gate];
      setGates(next);
      recompute(next, numQubits);
    },
    [angle, gates, numQubits, recompute, targetQubit]
  );

  const handleReset = useCallback(() => {
    setGates([]);
    setTargetQubit(0);
    recompute([], numQubits);
  }, [numQubits, recompute]);

  const handleNumQubitsChange = useCallback(
    (n: number) => {
      setNumQubits(n);
      setTargetQubit(0);
      setGates([]);
      recompute([], n);
    },
    [recompute]
  );

  /* ----- Bloch vector ----- */
  const bloch =
    stateVector && numQubits >= 1
      ? getBlochVector(stateVector, Math.min(targetQubit, numQubits - 1))
      : { x: 0, y: 0, z: 1 };

  /* ---------------------------------------------------------------- */
  /*  D3 Bloch sphere                                                  */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    const svg = blochRef.current;
    if (!svg) return;

    const sel = d3.select(svg);
    sel.selectAll('*').remove();

    // defs: glow filter + gradients
    const defs = sel.append('defs');

    const glow = defs.append('filter').attr('id', 'bloch-glow').attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
    glow.append('feGaussianBlur').attr('stdDeviation', '3.5').attr('result', 'blur');
    const merge = glow.append('feMerge');
    merge.append('feMergeNode').attr('in', 'blur');
    merge.append('feMergeNode').attr('in', 'SourceGraphic');

    const sphereGrad = defs
      .append('radialGradient')
      .attr('id', 'sphere-grad')
      .attr('cx', '35%')
      .attr('cy', '30%')
      .attr('r', '75%');
    sphereGrad.append('stop').attr('offset', '0%').attr('stop-color', '#0e2a3a').attr('stop-opacity', '0.9');
    sphereGrad.append('stop').attr('offset', '70%').attr('offset', '70%').attr('stop-color', '#082030').attr('stop-opacity', '0.55');
    sphereGrad.append('stop').attr('offset', '100%').attr('stop-color', '#04101a').attr('stop-opacity', '0.35');

    // root group
    const g = sel.append('g');

    // ---- sphere fill ----
    g.append('circle')
      .attr('cx', CENTER)
      .attr('cy', CENTER)
      .attr('r', SPHERE_R)
      .attr('fill', 'url(#sphere-grad)')
      .attr('stroke', '#22d3ee')
      .attr('stroke-width', 1.2)
      .attr('opacity', 0.95);

    // ---- equator (ellipse, x-y plane -> projects to horizontal ellipse) ----
    g.append('ellipse')
      .attr('cx', CENTER)
      .attr('cy', CENTER)
      .attr('rx', SPHERE_R)
      .attr('ry', SPHERE_R * 0.28)
      .attr('fill', 'none')
      .attr('stroke', '#22d3ee')
      .attr('stroke-width', 0.8)
      .attr('opacity', 0.45)
      .attr('stroke-dasharray', '3 3');

    // ---- meridian ellipses (x-z and y-z great circles) ----
    // x-z plane: vertical ellipse (rx small, ry = R)
    g.append('ellipse')
      .attr('cx', CENTER)
      .attr('cy', CENTER)
      .attr('rx', SPHERE_R * 0.28)
      .attr('ry', SPHERE_R)
      .attr('fill', 'none')
      .attr('stroke', '#22d3ee')
      .attr('stroke-width', 0.8)
      .attr('opacity', 0.35)
      .attr('stroke-dasharray', '3 3');

    // y-z plane: full circle (viewed edge-on -> appears as vertical line + circle)
    g.append('circle')
      .attr('cx', CENTER)
      .attr('cy', CENTER)
      .attr('r', SPHERE_R)
      .attr('fill', 'none')
      .attr('stroke', '#22d3ee')
      .attr('stroke-width', 0.6)
      .attr('opacity', 0.25)
      .attr('stroke-dasharray', '2 4');

    // ---- axes ----
    const axisLine = (x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, color: string, op = 0.6) => {
      const p1 = project(x1, y1, z1);
      const p2 = project(x2, y2, z2);
      g.append('line')
        .attr('x1', p1.sx)
        .attr('y1', p1.sy)
        .attr('x2', p2.sx)
        .attr('y2', p2.sy)
        .attr('stroke', color)
        .attr('stroke-width', 1)
        .attr('opacity', op);
    };

    // X axis (red-ish), Y axis (green-ish), Z axis (cyan)
    axisLine(-1.15, 0, 0, 1.15, 0, 0, '#f43f5e', 0.55);
    axisLine(0, -1.15, 0, 0, 1.15, 0, '#34d399', 0.4);
    axisLine(0, 0, -1.15, 0, 0, 1.15, '#22d3ee', 0.7);

    // ---- axis labels ----
    const label = (x: number, y: number, z: number, text: string, color: string, dy = '0.35em') => {
      const p = project(x, y, z);
      g.append('text')
        .attr('x', p.sx)
        .attr('y', p.sy)
        .attr('dy', dy)
        .attr('text-anchor', 'middle')
        .attr('fill', color)
        .attr('font-size', '13')
        .attr('font-family', 'ui-monospace, monospace')
        .attr('font-weight', '600')
        .text(text);
    };
    label(0, 0, 1.22, '|0⟩', '#e0f7ff');
    label(0, 0, -1.22, '|1⟩', '#e0f7ff');
    label(1.28, 0, 0, 'X', '#f87171');
    label(0, 1.28, 0, 'Y', '#4ade80');
    label(-1.28, 0, 0, '-X', '#f87171');
    label(0, -1.28, 0, '-Y', '#4ade80');

    // ---- Bloch vector arrow ----
    const v = bloch;
    // clamp for drawing (keep inside sphere)
    const mag = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z) || 1;
    const nx = v.x / mag;
    const ny = v.y / mag;
    const nz = v.z / mag;
    const tip = project(nx, ny, nz);
    const base = project(0, 0, 0);

    // glow line
    g.append('line')
      .attr('x1', base.sx)
      .attr('y1', base.sy)
      .attr('x2', tip.sx)
      .attr('y2', tip.sy)
      .attr('stroke', '#22d3ee')
      .attr('stroke-width', 3.5)
      .attr('opacity', 0.4)
      .attr('filter', 'url(#bloch-glow)');

    // main vector line
    g.append('line')
      .attr('x1', base.sx)
      .attr('y1', base.sy)
      .attr('x2', tip.sx)
      .attr('y2', tip.sy)
      .attr('stroke', '#67e8f9')
      .attr('stroke-width', 2)
      .attr('opacity', 0.95);

    // arrowhead
    const ang = Math.atan2(tip.sy - base.sy, tip.sx - base.sx);
    const ah = 9;
    g.append('polygon')
      .attr(
        'points',
        [
          `${tip.sx},${tip.sy}`,
          `${tip.sx - ah * Math.cos(ang - Math.PI / 6)},${tip.sy - ah * Math.sin(ang - Math.PI / 6)}`,
          `${tip.sx - ah * Math.cos(ang + Math.PI / 6)},${tip.sy - ah * Math.sin(ang + Math.PI / 6)}`,
        ].join(' ')
      )
      .attr('fill', '#67e8f9')
      .attr('opacity', 0.95)
      .attr('filter', 'url(#bloch-glow)');

    // tip dot
    g.append('circle')
      .attr('cx', tip.sx)
      .attr('cy', tip.sy)
      .attr('r', 4)
      .attr('fill', '#a5f3fc')
      .attr('filter', 'url(#bloch-glow)');

    // center dot
    g.append('circle')
      .attr('cx', CENTER)
      .attr('cy', CENTER)
      .attr('r', 2.5)
      .attr('fill', '#22d3ee')
      .attr('opacity', 0.8);
  }, [bloch]);

  /* ---------------------------------------------------------------- */
  /*  Plotly histogram                                                 */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    const el = plotlyRef.current;
    if (!el) return;

    const states = histogram.map((h) => h.state);
    const counts = histogram.map((h) => h.count);

    const data: Plotly.Data[] = [
      {
        type: 'bar',
        x: states,
        y: counts,
        marker: {
          color: counts,
          colorscale: 'Electric',
          line: { color: '#22d3ee', width: 1 },
        },
        texttemplate: counts.map((c) => `${c} (${((c / SHOTS) * 100).toFixed(1)}%)`),
        textposition: 'outside',
        textfont: { color: '#67e8f9', size: 11 } as const,
      },
    ];

    const layout: Partial<Plotly.Layout> = {
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      font: { color: '#94a3b8', family: 'ui-sans-serif, system-ui', size: 12 },
      margin: { t: 20, r: 16, b: 48, l: 44 },
      xaxis: {
        title: { text: 'Basis state' },
        gridcolor: 'rgba(34,211,238,0.12)',
        zerolinecolor: 'rgba(34,211,238,0.2)',
        color: '#67e8f9',
      },
      yaxis: {
        title: { text: 'Counts' },
        gridcolor: 'rgba(34,211,238,0.12)',
        zerolinecolor: 'rgba(34,211,238,0.2)',
        color: '#67e8f9',
      },
      showlegend: false,
    };

    const config: Partial<Plotly.Config> = {
      responsive: true,
      displayModeBar: false,
      staticPlot: false,
    };

    Plotly.react(el, data, layout, config);
  }, [histogram]);

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */
  const basisLabels = Array.from({ length: 2 ** numQubits }, (_, i) =>
    i.toString(2).padStart(numQubits, '0')
  );

  return (
    <div className="min-h-screen bg-[#04101a] text-slate-100 p-4 md:p-6">
      {/* header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-xl bg-cyan-500/10 p-2 ring-1 ring-cyan-400/30">
          <Atom className="h-6 w-6 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-cyan-300 to-sky-400 bg-clip-text text-transparent">
            Quantum State Visualizer
          </h1>
          <p className="text-sm text-slate-400">Q-loop · Bloch sphere · probability · measurement</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4">
        {/* ============ LEFT PANEL ============ */}
        <div className="space-y-4">
          <Card className="bg-slate-900/40 backdrop-blur-md border-cyan-400/20 shadow-[0_0_30px_-10px_rgba(34,211,238,0.3)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-cyan-300">
                <Zap className="h-4 w-4" /> Gate Controls
              </CardTitle>
              <CardDescription className="text-slate-400">
                Apply quantum gates to build a circuit
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* qubit count */}
              <div>
                <label className="text-xs font-medium text-slate-400 mb-2 block">
                  Qubits: <span className="text-cyan-300">{numQubits}</span>
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3].map((n) => (
                    <Button
                      key={n}
                      size="sm"
                      variant={n === numQubits ? 'default' : 'outline'}
                      onClick={() => handleNumQubitsChange(n)}
                      className={cn(
                        'flex-1',
                        n === numQubits &&
                          'bg-cyan-500/20 border-cyan-400/40 text-cyan-200 hover:bg-cyan-500/30'
                      )}
                    >
                      {n}
                    </Button>
                  ))}
                </div>
              </div>

              {/* target qubit selector (only if >1 qubit) */}
              {numQubits > 1 && (
                <div>
                  <label className="text-xs font-medium text-slate-400 mb-2 block">
                    Target qubit: <span className="text-cyan-300">q{targetQubit}</span>
                  </label>
                  <div className="flex gap-2">
                    {Array.from({ length: numQubits }, (_, i) => (
                      <Button
                        key={i}
                        size="sm"
                        variant={i === targetQubit ? 'default' : 'outline'}
                        onClick={() => setTargetQubit(i)}
                        className={cn(
                          'flex-1',
                          i === targetQubit &&
                            'bg-cyan-500/20 border-cyan-400/40 text-cyan-200 hover:bg-cyan-500/30'
                        )}
                      >
                        q{i}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* rotation angle slider */}
              <div>
                <label className="text-xs font-medium text-slate-400 mb-2 flex justify-between">
                  <span>Rotation angle (RX/RY/RZ)</span>
                  <span className="text-cyan-300 font-mono">
                    {angle.toFixed(3)} rad
                  </span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={Math.PI * 2}
                  step={Math.PI / 32}
                  value={angle}
                  onChange={(e) => setAngle(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                  <span>0</span>
                  <span>π</span>
                  <span>2π</span>
                </div>
              </div>

              {/* gate buttons */}
              <div>
                <label className="text-xs font-medium text-slate-400 mb-2 block">
                  Gates
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {GATE_BUTTONS.map((gt) => {
                    const info = GATE_INFO[gt];
                    const isRotation = ROTATION_GATES.includes(gt);
                    return (
                      <Button
                        key={gt}
                        size="sm"
                        variant="outline"
                        onClick={() => applyGate(gt)}
                        title={info.description}
                        className={cn(
                          'font-mono font-semibold transition-all hover:scale-105',
                          'bg-slate-800/40 border-slate-600/50 hover:border-cyan-400/60',
                          'hover:shadow-[0_0_15px_-3px_rgba(34,211,238,0.5)]'
                        )}
                        style={{ color: info.color }}
                      >
                        {info.symbol}
                        {isRotation && (
                          <span className="ml-0.5 text-[9px] text-slate-500">
                            θ
                          </span>
                        )}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* reset */}
              <Button
                onClick={handleReset}
                variant="outline"
                className="w-full border-rose-400/40 text-rose-300 hover:bg-rose-500/10 hover:border-rose-400/70"
              >
                <RotateCcw className="h-4 w-4 mr-2" /> Reset Circuit
              </Button>

              {/* gate sequence */}
              <div>
                <label className="text-xs font-medium text-slate-400 mb-2 block">
                  Gate sequence ({gates.length})
                </label>
                <div className="min-h-[60px] max-h-[140px] overflow-y-auto rounded-lg bg-slate-950/50 border border-slate-700/40 p-2 flex flex-wrap gap-1.5">
                  {gates.length === 0 ? (
                    <span className="text-xs text-slate-600 italic self-center px-1">
                      No gates applied yet
                    </span>
                  ) : (
                    gates.map((g, idx) => {
                      const info = GATE_INFO[g.type];
                      return (
                        <span
                          key={g.id}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-mono bg-slate-800/60 border border-slate-600/40"
                          style={{ color: info.color }}
                          title={`${info.name} on q${g.qubit}${
                            g.parameter !== undefined ? ` (θ=${g.parameter.toFixed(2)})` : ''
                          }`}
                        >
                          <span className="text-slate-600">{idx + 1}.</span>
                          {info.symbol}
                          <span className="text-slate-500 text-[10px]">
                            q{g.qubit}
                          </span>
                          {g.parameter !== undefined && (
                            <span className="text-slate-500 text-[10px]">
                              {g.parameter.toFixed(2)}
                            </span>
                          )}
                        </span>
                      );
                    })
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ============ RIGHT PANEL ============ */}
        <div className="space-y-4">
          {/* Bloch sphere */}
          <Card className="bg-slate-900/40 backdrop-blur-md border-cyan-400/20 shadow-[0_0_30px_-10px_rgba(34,211,238,0.3)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-cyan-300">
                <Atom className="h-4 w-4" /> Bloch Sphere
                <span className="text-xs font-normal text-slate-500 ml-1">
                  q{Math.min(targetQubit, numQubits - 1)}
                </span>
              </CardTitle>
              <CardDescription className="text-slate-400">
                Single-qubit state on the Bloch sphere
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row items-center gap-6">
              <svg
                ref={blochRef}
                width={SVG_SIZE}
                height={SVG_SIZE}
                viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
                className="drop-shadow-[0_0_20px_rgba(34,211,238,0.15)]"
              />
              <div className="space-y-2 font-mono text-sm">
                <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">
                  Bloch vector
                </div>
                {(['x', 'y', 'z'] as const).map((k) => (
                  <div key={k} className="flex items-center gap-3">
                    <span className="text-slate-400 w-4">{k}</span>
                    <div className="relative w-32 h-2 rounded-full bg-slate-800/60 overflow-hidden">
                      <div
                        className="absolute top-0 left-1/2 h-full bg-gradient-to-r from-cyan-500/40 to-cyan-400"
                        style={{
                          width: `${(Math.abs(bloch[k]) / 2) * 50}%`,
                          transform:
                            bloch[k] >= 0
                              ? 'translateX(0)'
                              : `translateX(-100%)`,
                        }}
                      />
                      <div className="absolute top-0 left-1/2 w-px h-full bg-slate-500/60" />
                    </div>
                    <span className="text-cyan-300 w-16 text-right">
                      {bloch[k].toFixed(4)}
                    </span>
                  </div>
                ))}
                <div className="pt-2 mt-2 border-t border-slate-700/40 text-xs text-slate-500">
                  |r| = {Math.sqrt(bloch.x ** 2 + bloch.y ** 2 + bloch.z ** 2).toFixed(4)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Probability distribution */}
          <Card className="bg-slate-900/40 backdrop-blur-md border-cyan-400/20 shadow-[0_0_30px_-10px_rgba(34,211,238,0.3)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-cyan-300">
                <Activity className="h-4 w-4" /> Probability Distribution
              </CardTitle>
              <CardDescription className="text-slate-400">
                |amplitude|² for each computational basis state
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2.5">
                {basisLabels.map((label, i) => {
                  const p = probabilities[i] ?? 0;
                  return (
                    <div key={label} className="flex items-center gap-3">
                      <span className="font-mono text-xs text-slate-400 w-12">
                        |{label}⟩
                      </span>
                      <div className="flex-1 h-6 rounded-md bg-slate-800/40 overflow-hidden relative">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500/60 via-cyan-400 to-sky-400 transition-all duration-300 ease-out"
                          style={{ width: `${p * 100}%` }}
                        />
                        <div className="absolute inset-0 flex items-center justify-end pr-2">
                          <span className="text-xs font-mono text-cyan-100 drop-shadow">
                            {(p * 100).toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Plotly histogram */}
          <Card className="bg-slate-900/40 backdrop-blur-md border-cyan-400/20 shadow-[0_0_30px_-10px_rgba(34,211,238,0.3)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-cyan-300">
                <Eye className="h-4 w-4" /> Measurement Histogram
              </CardTitle>
              <CardDescription className="text-slate-400">
                {SHOTS} shots · sampled measurement outcomes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div ref={plotlyRef} className="w-full h-[300px]" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
