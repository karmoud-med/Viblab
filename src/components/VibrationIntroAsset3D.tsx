import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Activity, 
  Info, 
  Disc, 
  Sliders, 
  HelpCircle,
  Sparkles,
  Layers,
  BarChart3,
  Waves,
  Zap,
  CheckCircle2,
  AlertTriangle,
  ZoomIn
} from 'lucide-react';
import ThreeMachineStage, { GeneratorSource } from './ThreeMachineStage';
import { SourceId, H } from '../utils/machine3d';

const TAU = Math.PI * 2;
const FL = 50; // Fréquence réseau 50 Hz
const FRES = 2400; // Résonance palier 2.4 kHz
const TD = 0.0006;
const VANES = 7; // Roue à 7 aubes
const BPFO_X = 3.07; // SKF 6309

const hash = (j: number) => {
  const x = Math.sin(j * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

const fmtHz = (f: number) => (f < 10 ? f.toFixed(2) : f.toFixed(1)) + ' Hz';

interface VibrationIntroAsset3DProps {
  theme?: 'dark' | 'light' | 'mono';
}

export default function VibrationIntroAsset3D({ theme = 'dark' }: VibrationIntroAsset3DProps) {
  // 1. Operating State
  const [rpm, setRpm] = useState<number>(1800);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [isTransparent, setIsTransparent] = useState<boolean>(false);

  // 2. Generator Sources Configuration & State
  const [activeSources, setActiveSources] = useState<Record<SourceId, boolean>>({
    unb: true,
    mis: false,
    mag: false,
    vane: true,
    brg: false,
  });

  const [sourceAmplitudes, setSourceAmplitudes] = useState<Record<SourceId, number>>({
    unb: 2.0,
    mis: 1.2,
    mag: 0.7,
    vane: 0.9,
    brg: 1.6,
  });

  // Highlight states
  const [highlightedSource, setHighlightedSource] = useState<SourceId | null>(null);
  const [highlightedPart, setHighlightedPart] = useState<string | null>(null);

  // Spectral & Oscilloscope Controls
  const [showComponents, setShowComponents] = useState<boolean>(true);
  const [freqRange, setFreqRange] = useState<'low' | 'mid' | 'hf'>('low');
  const [zoomRange, setZoomRange] = useState<[number, number] | null>(null);

  // Nomenclature map received from 3D builder
  const [nomenclatureCats, setNomenclatureCats] = useState<Map<string, any>>(new Map());

  const specCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const scopeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const miniCanvasRefs = useRef<Record<SourceId, HTMLCanvasElement | null>>({
    unb: null,
    mis: null,
    mag: null,
    vane: null,
    brg: null,
  });

  const [hoveredPeak, setHoveredPeak] = useState<{
    freq: number;
    amp: number;
    ratio: number;
    org?: string;
    sourceCol?: string;
  } | null>(null);

  const isLight = theme === 'light';
  const isBW = theme === 'mono';

  const f1 = rpm / 60; // Fréquence de rotation 1x en Hz

  // Definition of the 5 individual mechanical vibration sources
  const sourcesList: GeneratorSource[] = useMemo(
    () => [
      {
        id: 'unb',
        col: '#2563eb',
        bg: '#eff6ff',
        on: activeSources.unb,
        a: sourceAmplitudes.unb,
        name: 'Arbre & Rotor (Vibration de rotation - 1x)',
        org: 'Ligne d’arbres, rotor du moteur',
        desc: (f: number) =>
          `Vibration fondamentale à ${f.toFixed(1)} Hz. Causée par le balourd résiduel du rotor (masse rouge sur le rotor) : la force centrifuge tourne avec l’arbre et produit une sinusoïde pure à 1x.`,
        sig: (t: number, f: number, A: number) => A * Math.sin(TAU * f * t),
        lines: (f: number, A: number) => [[f, A, '1x (Rotor/Balourd)']],
      },
      {
        id: 'mis',
        col: '#7c3aed',
        bg: '#f5f3ff',
        on: activeSources.mis,
        a: sourceAmplitudes.mis,
        name: 'Accouplement (Désalignement - 2x)',
        org: 'Accouplement à mâchoires & étoile élastomère',
        desc: (f: number) =>
          `Un désalignement angulaire ou parallèle des arbres fait fléchir l’étoile élastomère deux fois par tour : pic dominant à 2x = ${(2 * f).toFixed(1)} Hz, avec composantes 1x et 3x.`,
        sig: (t: number, f: number, A: number) =>
          A * (Math.sin(2 * TAU * f * t + 0.6) + 0.33 * Math.sin(TAU * f * t + 1.2) + 0.25 * Math.sin(3 * TAU * f * t + 2)),
        lines: (f: number, A: number) => [
          [2 * f, A, '2x (Désalignement)'],
          [f, 0.33 * A, ''],
          [3 * f, 0.25 * A, '3x'],
        ],
      },
      {
        id: 'mag',
        col: '#dc2626',
        bg: '#fef2f2',
        on: activeSources.mag,
        a: sourceAmplitudes.mag,
        name: 'Moteur électrique (Magnétique - 2×FL)',
        org: 'Stator et bobinage du moteur',
        desc: () =>
          `L’attraction magnétique entre stator et rotor pulse deux fois par période réseau : raie nette à 2×FL = ${2 * FL} Hz (100 Hz), indépendante de la vitesse de rotation.`,
        sig: (t: number, _f: number, A: number) =>
          A * (Math.sin(TAU * 2 * FL * t) + 0.15 * Math.sin(TAU * 4 * FL * t + 1)),
        lines: (_f: number, A: number) => [
          [2 * FL, A, '2×FL (Magnétique)'],
          [4 * FL, 0.15 * A, ''],
        ],
      },
      {
        id: 'vane',
        col: '#ea580c',
        bg: '#fff7ed',
        on: activeSources.vane,
        a: sourceAmplitudes.vane,
        name: `Turbine de pompe (Passage d’aubes - ${VANES}x)`,
        org: 'Roue fermée & volute de la pompe',
        desc: (f: number) =>
          `La roue possède ${VANES} aubes. Le passage de chaque aube devant le bec de volute crée une pulsation hydraulique périodique à ${(VANES * f).toFixed(1)} Hz (${VANES}x).`,
        sig: (t: number, f: number, A: number) =>
          A * (Math.sin(VANES * TAU * f * t + 0.3) + 0.3 * Math.sin(2 * VANES * TAU * f * t + 1.1)),
        lines: (f: number, A: number) => [
          [VANES * f, A, `${VANES}x (Aubes Pompe)`],
          [2 * VANES * f, 0.3 * A, `${2 * VANES}x`],
        ],
      },
      {
        id: 'brg',
        col: '#059669',
        bg: '#ecfdf5',
        on: activeSources.brg,
        a: sourceAmplitudes.brg,
        name: 'Roulement à billes (Chocs HF - BPFO)',
        org: 'Roulement 6309 côté roue du palier de pompe',
        desc: (f: number) =>
          `Un écaillage sur la bague extérieure est frappé par chaque bille à BPFO = ${(BPFO_X * f).toFixed(1)} Hz (${BPFO_X.toFixed(2)}x). Chaque impact excite la résonance structurelle à ${(FRES / 1000).toFixed(1)} kHz.`,
        sig: (t: number, f: number, A: number) => {
          const fb = BPFO_X * f;
          const u = t * fb;
          const j = Math.floor(u);
          const tau = (u - j) / fb;
          return A * (0.8 + 0.4 * hash(j)) * Math.exp(-tau / TD) * Math.sin(TAU * FRES * tau);
        },
        lines: (f: number, A: number) =>
          [1, 2, 3, 4].map((k) => [k * BPFO_X * f, (0.22 * A) / Math.sqrt(k), k === 1 ? 'BPFO (Roulement)' : ''] as [number, number, string]),
      },
    ],
    [activeSources, sourceAmplitudes]
  );

  // Total signal instantaneous function
  const totalSignal = useCallback(
    (t: number): number => {
      let x = 0;
      for (const s of sourcesList) {
        if (s.on) x += s.sig(t, f1, s.a);
      }
      return x;
    },
    [sourcesList, f1]
  );

  // Global signal statistics computed over 1 second
  const globalStats = useMemo(() => {
    let mn = 1e9;
    let mx = -1e9;
    let s2 = 0;
    const N = 30000;
    for (let i = 0; i < N; i++) {
      const v = totalSignal(i / N);
      if (v < mn) mn = v;
      if (v > mx) mx = v;
      s2 += v * v;
    }
    const pp = mx - mn;
    const rmsVal = Math.sqrt(s2 / N);
    const scale = Math.max(1, Math.max(mx, -mn) * 1.15);

    // ISO 10816-3 (Group 2, rigid foundation: < 1.4 A, < 2.8 B, < 4.5 C, > 4.5 D)
    const zone =
      rmsVal < 1.4
        ? { label: 'Zone A · Bon état', color: '#059669', bg: 'bg-emerald-500/10 border-emerald-500/30' }
        : rmsVal < 2.8
        ? { label: 'Zone B · Acceptable', color: '#65a30d', bg: 'bg-lime-500/10 border-lime-500/30' }
        : rmsVal < 4.5
        ? { label: 'Zone C · Alerte Tolérable', color: '#d97706', bg: 'bg-amber-500/10 border-amber-500/30' }
        : { label: 'Zone D · Inacceptable', color: '#dc2626', bg: 'bg-rose-500/10 border-rose-500/30' };

    return { pp, rms: rmsVal, scale, zone };
  }, [totalSignal]);

  // Full spectral window
  const fullSpecRange = useCallback((): [number, number] => {
    if (freqRange === 'hf') return [0, 4000];
    if (freqRange === 'mid') return [0, 1000];
    return [0, Math.max(16 * f1, 240)];
  }, [freqRange, f1]);

  // All active spectral lines
  const allSpectralLines = useMemo(() => {
    const lines: Array<{ f: number; a: number; lab: string; s: GeneratorSource }> = [];
    for (const s of sourcesList) {
      if (s.on) {
        for (const [fr, a, lab] of s.lines(f1, s.a)) {
          lines.push({ f: fr, a, lab, s });
        }
      }
    }
    return lines;
  }, [sourcesList, f1]);

  // 3. Draw Synchronized Oscilloscope Canvas
  useEffect(() => {
    const canvas = scopeCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let T = 0;
    let last = performance.now();

    const render = (now: number) => {
      animId = requestAnimationFrame(render);

      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (isRunning) T += dt * 0.035 * (rpm / 1800);

      const dpr = window.devicePixelRatio || 1;
      const W = canvas.clientWidth;
      const H = canvas.clientHeight;
      if (canvas.width !== Math.floor(W * dpr) || canvas.height !== Math.floor(H * dpr)) {
        canvas.width = Math.floor(W * dpr);
        canvas.height = Math.floor(H * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      const Tw = 2.5 / f1;
      const t0 = T - Tw;

      const L = 46;
      const R = W - 14;
      const topP = 30;
      const botP = H - 24;
      const mid = (topP + botP) / 2;
      const half = (botP - topP) / 2;
      const sc = globalStats.scale;

      // Grid
      ctx.font = '10px ui-monospace,Menlo,monospace';
      ctx.strokeStyle = isLight ? '#e2e8f0' : '#1e293b';
      ctx.fillStyle = isLight ? '#64748b' : '#94a3b8';
      ctx.lineWidth = 1;

      for (let i = 0; i <= 5; i++) {
        const X = L + (i * (R - L)) / 5;
        ctx.beginPath();
        ctx.moveTo(X, topP);
        ctx.lineTo(X, botP);
        ctx.stroke();
        ctx.textAlign = i === 5 ? 'right' : 'center';
        ctx.fillText(`${(-(Tw * (5 - i)) / 5 * 1000).toFixed(0)} ms`, X, botP + 15);
      }

      for (let i = -2; i <= 2; i++) {
        const Y = mid - (i / 2) * half;
        ctx.beginPath();
        ctx.moveTo(L, Y);
        ctx.lineTo(R, Y);
        ctx.stroke();
        ctx.textAlign = 'right';
        ctx.fillText(((i / 2) * sc).toFixed(1), L - 6, Y + 3);
      }

      ctx.save();
      ctx.translate(10, mid);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = 'center';
      ctx.fillText('mm/s', 0, 0);
      ctx.restore();

      // Shaft revolution markers (dashed lines)
      ctx.strokeStyle = isLight ? '#cbd5e1' : '#475569';
      ctx.setLineDash([2, 4]);
      for (let j = Math.ceil(t0 * f1); j <= T * f1; j++) {
        const X = L + ((j / f1 - t0) / Tw) * (R - L);
        ctx.beginPath();
        ctx.moveTo(X, topP);
        ctx.lineTo(X, botP);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      ctx.save();
      ctx.beginPath();
      ctx.rect(L, topP - 2, R - L, botP - topP + 4);
      ctx.clip();

      const cols = Math.max(1, Math.floor(R - L));

      // Individual sub-traces
      if (showComponents) {
        for (const s of sourcesList) {
          if (s.on) {
            ctx.strokeStyle = s.col;
            ctx.globalAlpha = highlightedSource && highlightedSource !== s.id ? 0.15 : 0.6;
            ctx.lineWidth = highlightedSource === s.id ? 2 : 1;
            ctx.beginPath();
            for (let c = 0; c < cols; c++) {
              const t = t0 + (c / cols) * Tw;
              const v = s.sig(t, f1, s.a);
              const Y = mid - (v / sc) * half;
              if (c === 0) ctx.moveTo(L + c, Y);
              else ctx.lineTo(L + c, Y);
            }
            ctx.stroke();
          }
        }
      }

      // Total sum trace
      ctx.globalAlpha = 1;
      ctx.strokeStyle = isLight ? '#0f3d66' : '#38bdf8';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      for (let c = 0; c < cols; c++) {
        const t = t0 + (c / cols) * Tw;
        const v = totalSignal(t);
        const Y = mid - (v / sc) * half;
        if (c === 0) ctx.moveTo(L + c, Y);
        else ctx.lineTo(L + c, Y);
      }
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = isLight ? '#0f172a' : '#f8fafc';
      ctx.font = 'bold 11px ui-monospace,Menlo,monospace';
      ctx.textAlign = 'left';
      ctx.fillText('Signal global mesuré (Somme accéléromètre)', L, 16);

      ctx.fillStyle = isLight ? '#64748b' : '#94a3b8';
      ctx.font = '10px ui-monospace,Menlo,monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${(Tw * 1000).toFixed(1)} ms · 2,5 tours d'arbre`, R, 16);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [isRunning, rpm, f1, showComponents, sourcesList, totalSignal, globalStats.scale, highlightedSource, isLight]);

  // 4. Draw Mini Waveform Canvases for Generator Cards
  useEffect(() => {
    const Tw = 2.5 / f1;
    for (const s of sourcesList) {
      const cv = miniCanvasRefs.current[s.id];
      if (!cv) continue;
      const ctx = cv.getContext('2d');
      if (!ctx) continue;

      const dpr = window.devicePixelRatio || 1;
      const W = cv.clientWidth;
      const H = cv.clientHeight;
      if (cv.width !== Math.floor(W * dpr) || cv.height !== Math.floor(H * dpr)) {
        cv.width = Math.floor(W * dpr);
        cv.height = Math.floor(H * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      const mid = H / 2;
      ctx.strokeStyle = isLight ? '#e2e8f0' : '#1e293b';
      ctx.beginPath();
      ctx.moveTo(0, mid);
      ctx.lineTo(W, mid);
      ctx.stroke();

      ctx.strokeStyle = s.on ? s.col : isLight ? '#cbd5e1' : '#475569';
      ctx.lineWidth = 1.6;

      const pk = s.id === 'brg' ? s.a * 1.2 : s.id === 'mis' ? s.a * 1.5 : s.a * 1.3;
      const maxSc = Math.max(pk, 0.01);
      const cols = Math.max(1, W - 4);

      ctx.beginPath();
      for (let c = 0; c < cols; c++) {
        const t = (c / cols) * Tw;
        const v = s.sig(t, f1, s.a);
        const Y = mid - (v / maxSc) * (mid - 3);
        if (c === 0) ctx.moveTo(c + 2, Y);
        else ctx.lineTo(c + 2, Y);
      }
      ctx.stroke();
    }
  }, [sourcesList, f1, isLight]);

  // 5. Draw FFT Spectrum Canvas
  const drawSpectrum = useCallback(() => {
    const canvas = specCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const W = canvas.clientWidth;
    const H = canvas.clientHeight;
    if (canvas.width !== Math.floor(W * dpr) || canvas.height !== Math.floor(H * dpr)) {
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const [f0, fE] = zoomRange || fullSpecRange();
    const Ls = allSpectralLines;

    const L = 46;
    const R = W - 14;
    const topP = 30;
    const botP = H - 26;
    const fx = (f: number) => L + ((f - f0) / (fE - f0)) * (R - L);

    const topA = Math.max(0.6, ...Ls.map((q) => q.a)) * 1.25;
    const fy = (a: number) => botP - (a / topA) * (botP - topP);

    // Grid
    ctx.font = '10px ui-monospace,Menlo,monospace';
    ctx.strokeStyle = isLight ? '#e2e8f0' : '#1e293b';
    ctx.fillStyle = isLight ? '#64748b' : '#94a3b8';
    ctx.lineWidth = 1;

    const nT = Math.max(4, Math.min(8, Math.floor((R - L) / 60)));
    for (let i = 0; i <= nT; i++) {
      const X = L + (i * (R - L)) / nT;
      const f = f0 + (i * (fE - f0)) / nT;
      ctx.beginPath();
      ctx.moveTo(X, topP);
      ctx.lineTo(X, botP);
      ctx.stroke();
      ctx.textAlign = i === 0 ? 'left' : i === nT ? 'right' : 'center';
      ctx.fillText(Math.round(f) + ' Hz', X, botP + 16);
    }

    for (let i = 0; i <= 4; i++) {
      const Y = topP + (i * (botP - topP)) / 4;
      ctx.beginPath();
      ctx.moveTo(L, Y);
      ctx.lineTo(R, Y);
      ctx.stroke();
      ctx.textAlign = 'right';
      ctx.fillText((topA * (1 - i / 4)).toFixed(1), L - 6, Y + 3);
    }

    ctx.save();
    ctx.beginPath();
    ctx.rect(L, 0, R - L, botP + 1);
    ctx.clip();

    // Noise floor
    ctx.strokeStyle = isLight ? '#cbd5e1' : '#334155';
    ctx.beginPath();
    for (let i = 0; i <= 300; i++) {
      const f = f0 + (i / 300) * (fE - f0);
      const nV = 0.03 + 0.015 * Math.abs(Math.sin(f * 0.21) * Math.cos(f * 0.057));
      const Y = fy(nV);
      if (i === 0) ctx.moveTo(fx(f), Y);
      else ctx.lineTo(fx(f), Y);
    }
    ctx.stroke();

    // High frequency bearing resonance hump
    const brgSource = sourcesList.find((s) => s.id === 'brg');
    if (brgSource && brgSource.on && fE > FRES - 600) {
      ctx.fillStyle = brgSource.col + '22';
      ctx.strokeStyle = brgSource.col;
      ctx.beginPath();
      ctx.moveTo(fx(FRES - 700), botP);
      for (let i = 0; i <= 80; i++) {
        const f = FRES - 700 + (i / 80) * 1400;
        const g = Math.exp(-(((f - FRES) / 280) ** 2));
        const comb = 0.6 + 0.4 * Math.cos((TAU * f) / (BPFO_X * f1));
        ctx.lineTo(fx(f), fy(brgSource.a * 0.3 * g * comb));
      }
      ctx.lineTo(fx(FRES + 700), botP);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = brgSource.col;
      ctx.textAlign = 'center';
      ctx.fillText('Résonance palier (chocs)', fx(FRES), fy(brgSource.a * 0.3) - 8);
    }
    ctx.restore();

    // Spectral Peaks with labels
    ctx.save();
    const placed: Array<[number, number, number]> = [];
    for (const q of Ls.filter((q) => q.f >= f0 && q.f <= fE).sort((a, b) => b.a - a.a)) {
      const X = fx(q.f);
      const Y = fy(q.a);
      const isDim = highlightedSource && highlightedSource !== q.s.id;
      ctx.globalAlpha = isDim ? 0.2 : 1;
      ctx.strokeStyle = q.s.col;
      ctx.fillStyle = q.s.col;
      ctx.lineWidth = highlightedSource === q.s.id ? 3 : 2;

      ctx.beginPath();
      ctx.moveTo(X, botP);
      ctx.lineTo(X, Y);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(X, Y, 3, 0, 7);
      ctx.fill();

      if (q.lab) {
        ctx.font = '10px ui-monospace,Menlo,monospace';
        const tw = ctx.measureText(q.lab).width / 2 + 4;
        let ly = Y - 8;
        while (placed.some((p) => Math.abs(p[0] - X) < p[2] + tw && Math.abs(p[1] - ly) < 12)) {
          ly -= 12;
        }
        placed.push([X, ly, tw]);
        ctx.fillStyle = isLight ? '#334155' : '#cbd5e1';
        ctx.textAlign = 'center';
        ctx.fillText(q.lab, Math.min(Math.max(X, L + tw), R - tw), Math.max(ly, topP - 4));
      }
    }
    ctx.restore();

    // Hover Cursor Indicator
    if (hoveredPeak) {
      const X = fx(hoveredPeak.freq);
      if (X >= L && X <= R) {
        ctx.strokeStyle = isLight ? '#475569' : '#94a3b8';
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(X, topP);
        ctx.lineTo(X, botP);
        ctx.stroke();
        ctx.setLineDash([]);

        const text = `${hoveredPeak.freq.toFixed(1)} Hz · ${hoveredPeak.ratio.toFixed(2)}x · ${hoveredPeak.amp.toFixed(2)} mm/s${
          hoveredPeak.org ? ` · ${hoveredPeak.org}` : ''
        }`;
        ctx.font = '11px ui-monospace,Menlo,monospace';
        const tw = ctx.measureText(text).width + 16;
        const bx = Math.min(Math.max(X - tw / 2, L), R - tw);
        ctx.fillStyle = isLight ? '#0f172a' : '#1e293b';
        ctx.fillRect(bx, 6, tw, 20);
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.fillText(text, bx + 8, 20);
      }
    }
  }, [zoomRange, fullSpecRange, allSpectralLines, highlightedSource, hoveredPeak, f1, sourcesList, isLight]);

  useEffect(() => {
    drawSpectrum();
  }, [drawSpectrum]);

  // Drag to Zoom on Spectrum
  const dragRef = useRef<{ x0: number; x1: number | null } | null>(null);

  const handleSpecMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = specCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    dragRef.current = { x0: e.clientX - rect.left, x1: null };
  };

  const handleSpecMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = specCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;

    const W = canvas.clientWidth;
    const L = 46;
    const R = W - 14;
    const [f0, fE] = zoomRange || fullSpecRange();

    if (dragRef.current) {
      dragRef.current.x1 = x;
      setHoveredPeak(null);
      drawSpectrum();
      return;
    }

    if (x < L || x > R) {
      setHoveredPeak(null);
      setHighlightedSource(null);
      return;
    }

    const curF = f0 + ((x - L) / (R - L)) * (fE - f0);
    let matchedPeak: (typeof allSpectralLines)[0] | null = null;
    let minDist = 8;

    for (const q of allSpectralLines) {
      const qX = L + ((q.f - f0) / (fE - f0)) * (R - L);
      const d = Math.abs(qX - x);
      if (q.f >= f0 && q.f <= fE && d < minDist) {
        minDist = d;
        matchedPeak = q;
      }
    }

    if (matchedPeak) {
      setHoveredPeak({
        freq: matchedPeak.f,
        amp: matchedPeak.a,
        ratio: matchedPeak.f / f1,
        org: matchedPeak.s.org,
        sourceCol: matchedPeak.s.col,
      });
      setHighlightedSource(matchedPeak.s.id);
    } else {
      setHoveredPeak({
        freq: curF,
        amp: 0,
        ratio: curF / f1,
      });
      setHighlightedSource(null);
    }
  };

  const handleSpecMouseUp = () => {
    const drag = dragRef.current;
    dragRef.current = null;
    const canvas = specCanvasRef.current;
    if (!drag || drag.x1 == null || !canvas) return;

    const W = canvas.clientWidth;
    const L = 46;
    const R = W - 14;
    const [f0, fE] = zoomRange || fullSpecRange();

    if (Math.abs(drag.x1 - drag.x0) > 8) {
      const xa = Math.min(drag.x0, drag.x1);
      const xb = Math.max(drag.x0, drag.x1);
      const na = Math.max(0, f0 + ((Math.max(xa, L) - L) / (R - L)) * (fE - f0));
      const nb = f0 + ((Math.min(xb, R) - L) / (R - L)) * (fE - f0);
      if (nb - na > 10) {
        setZoomRange([na, nb]);
      }
    }
  };

  const handleSpecDoubleClick = () => {
    setZoomRange(null);
  };

  // Group nomenclature items by main assembly
  const groupedNomenclature = useMemo(() => {
    const groups = new Map<string, Array<{ key: string; name: string; count: number }>>();
    for (const [k, list] of nomenclatureCats) {
      if (!k) continue;
      const [g, n] = k.split(' · ');
      if (!groups.has(g)) groups.set(g, []);
      groups.get(g)!.push({ key: k, name: n, count: list.length });
    }
    return groups;
  }, [nomenclatureCats]);

  return (
    <div className="space-y-6 max-w-[1550px] mx-auto pb-12">
      {/* Intro Header Banner */}
      <div className={`p-6 rounded-2xl border backdrop-blur-md shadow-sm ${
        isLight ? 'bg-white/80 border-slate-200' : isBW ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-900/80 border-slate-800'
      }`}>
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-blue-600/10 text-blue-500 border border-blue-500/20 flex-shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h1 className={`text-xl font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Origine des Vibrations & Modèle 3D Industriel du Groupe Motopompe
            </h1>
            <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              La <b>vibration mécanique</b> correspond au mouvement oscillatoire d'une machine autour de sa position d'équilibre. En milieu industriel, toute machine tournante vibre de manière inhérente en raison de forces de rotation, de désalignement ou d'écoulement hydraulique.
            </p>
            <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              L'accéléromètre mesure la <b>somme globale de ces vibrations</b>. L'analyse spectrale (FFT) permet de <b>décomposer ce signal</b> pour identifier et localiser avec certitude chaque défaut sans démonter la machine !
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: 3D Model Left & Generator Cards Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: 3D Stage & Speed Controls (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col">
          <div className={`p-4.5 rounded-2xl border shadow-sm flex flex-col justify-between h-full space-y-3 ${
            isLight ? 'bg-white border-slate-200' : isBW ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-900 border-slate-800'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`font-bold text-xs uppercase tracking-wider font-mono ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Groupe Motopompe Industriel 3D
              </span>
              <span className="text-[11px] font-mono text-blue-500">
                Axe X · Moteur 15 kW + Pompe EN 733
              </span>
            </div>

            {/* 3D Canvas Stage */}
            <ThreeMachineStage
              rpm={rpm}
              isRunning={isRunning}
              isTransparent={isTransparent}
              onToggleTransparent={() => setIsTransparent(!isTransparent)}
              activeSources={activeSources}
              sourceAmplitudes={sourceAmplitudes}
              sourcesList={sourcesList}
              highlightedSource={highlightedSource}
              onHoverSource={setHighlightedSource}
              highlightedPart={highlightedPart}
              onHoverPart={setHighlightedPart}
              totalSignalFn={totalSignal}
              scaleSignal={globalStats.scale}
              theme={theme}
              onNomenclatureReady={setNomenclatureCats}
            />

            {/* Speed Control & Run/Stop Button */}
            <div className={`flex flex-wrap items-center justify-between gap-4 pt-2 border-t ${
              isLight ? 'border-slate-200' : 'border-slate-800/60'
            }`}>
              <div className="flex-1 min-w-[200px] space-y-1">
                <div className="flex justify-between text-xs">
                  <span className={`font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Vitesse de rotation du rotor</span>
                  <span className="font-mono font-bold text-blue-500">{rpm} RPM ({f1.toFixed(1)} Hz)</span>
                </div>
                <input
                  type="range"
                  min="600"
                  max="3000"
                  step="10"
                  value={rpm}
                  onChange={(e) => {
                    setRpm(+e.target.value);
                    setZoomRange(null);
                  }}
                  className="w-full accent-blue-600"
                />
              </div>

              <button
                onClick={() => setIsRunning(!isRunning)}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 shadow-sm ${
                  isRunning
                    ? 'bg-rose-600 hover:bg-rose-500 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isRunning ? 'ARRÊTER' : 'DÉMARRER'}</span>
              </button>
            </div>

            {/* Machine Operational Status Bar */}
            <div className={`p-3.5 rounded-xl border text-xs font-mono grid grid-cols-2 sm:grid-cols-4 gap-3 ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-950/60 border-slate-800 text-slate-200'
            }`}>
              <div>
                <span className={`text-[10px] uppercase block font-sans font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Vitesse</span>
                <b className={`mt-0.5 block ${isLight ? 'text-slate-900' : 'text-white'}`}>{rpm} RPM</b>
              </div>
              <div>
                <span className={`text-[10px] uppercase block font-sans font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Sources</span>
                <b className={`mt-0.5 block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {Object.values(activeSources).filter(Boolean).length} / 5 actives
                </b>
              </div>
              <div>
                <span className={`text-[10px] uppercase block font-sans font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Fondamental 1x</span>
                <b className="text-blue-500 mt-0.5 block">{f1.toFixed(1)} Hz</b>
              </div>
              <div>
                <span className={`text-[10px] uppercase block font-sans font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Aubes Pompe</span>
                <b className="text-orange-500 mt-0.5 block">{(f1 * VANES).toFixed(1)} Hz</b>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: 5 Individual Generator Cards (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col">
          <div className={`p-4.5 rounded-2xl border shadow-sm flex flex-col justify-between h-full space-y-2.5 ${
            isLight ? 'bg-white border-slate-200' : isBW ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-900 border-slate-800'
          }`}>
            <div>
              <span className={`font-bold text-xs uppercase tracking-wider font-mono block ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Générateurs Individuels de Vibrations
              </span>
              <p className={`text-xs leading-relaxed mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Survolez une source pour la mettre en surbrillance. Activez ou ajustez chaque composante.
              </p>
            </div>

            <div className="space-y-2 flex-1 flex flex-col justify-between">
              {sourcesList.map((s, idx) => {
                const isActive = activeSources[s.id];
                const isHovered = highlightedSource === s.id;

                return (
                  <div
                    key={s.id}
                    onMouseEnter={() => setHighlightedSource(s.id)}
                    onMouseLeave={() => setHighlightedSource(null)}
                    className={`p-2.5 rounded-xl border transition-all ${
                      isHovered
                        ? 'ring-2 ring-blue-500/50 shadow-md'
                        : isLight
                        ? 'bg-slate-50 hover:bg-slate-100/80 border-slate-200'
                        : 'bg-slate-950/60 hover:bg-slate-950 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.col }} />
                        <b className={`text-xs truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          {idx + 1}. {s.name}
                        </b>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className={`font-mono font-bold text-xs ${
                          isLight ? 'text-slate-900' : 'text-white'
                        }`}>
                          {sourceAmplitudes[s.id].toFixed(2)} mm/s
                        </span>

                        {/* On/Off Switch */}
                        <button
                          onClick={() =>
                            setActiveSources((prev) => ({
                              ...prev,
                              [s.id]: !prev[s.id],
                            }))
                          }
                          className={`w-8 h-4.5 rounded-full transition-colors relative flex-shrink-0 ${
                            isActive ? 'bg-blue-600' : isLight ? 'bg-slate-300' : 'bg-slate-700'
                          }`}
                        >
                          <span
                            className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${
                              isActive ? 'left-4' : 'left-0.5'
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    <p className={`text-[10.5px] mt-1 leading-snug line-clamp-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      {s.desc(f1)}
                    </p>

                    {/* Amplitude slider & mini waveform inline */}
                    <div className="flex items-center gap-2.5 mt-1.5">
                      <input
                        type="range"
                        min="0"
                        max="400"
                        value={sourceAmplitudes[s.id] * 100}
                        onChange={(e) =>
                          setSourceAmplitudes((prev) => ({
                            ...prev,
                            [s.id]: +e.target.value / 100,
                          }))
                        }
                        className="flex-1 accent-blue-600 h-1.5"
                      />
                      <canvas
                        ref={(el) => {
                          miniCanvasRefs.current[s.id] = el;
                        }}
                        className={`w-28 sm:w-32 h-[24px] rounded border shrink-0 ${
                          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Second Row: Synchronized Oscilloscope & Spectral Analysis (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Global Synchronized Oscilloscope */}
        <div className={`p-5 rounded-2xl border shadow-sm space-y-4 ${
          isLight ? 'bg-white border-slate-200' : isBW ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className={`font-bold text-xs uppercase tracking-wider font-mono ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Signal Temporel Global (Somme Mesurée)
            </span>

            <button
              onClick={() => setShowComponents(!showComponents)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                showComponents
                  ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                  : isLight
                  ? 'text-slate-700 border-slate-300 bg-slate-100 hover:bg-slate-200'
                  : 'text-slate-400 border-slate-700 bg-slate-800 hover:text-white'
              }`}
            >
              {showComponents ? 'Masquer composantes' : 'Afficher composantes'}
            </button>
          </div>

          <canvas
            ref={scopeCanvasRef}
            className={`w-full h-[260px] rounded-xl border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
            }`}
          />

          {/* Key Metrics: PP, RMS, ISO 10816 Zone */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'}`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider block font-sans ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Crête-à-crête</span>
              <div className={`text-sm font-mono font-bold mt-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {globalStats.pp.toFixed(2)} mm/s
              </div>
            </div>

            <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'}`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider block font-sans ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Valeur RMS</span>
              <div className={`text-sm font-mono font-bold mt-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {globalStats.rms.toFixed(2)} mm/s
              </div>
            </div>

            <div className={`p-3 rounded-xl border ${globalStats.zone.bg}`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider block font-sans ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>ISO 10816-3</span>
              <div className="text-xs font-mono font-bold mt-1" style={{ color: globalStats.zone.color }}>
                {globalStats.zone.label}
              </div>
            </div>

            <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'}`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider block font-sans ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Sources Actives</span>
              <div className="flex items-center gap-1.5 mt-2">
                {sourcesList.filter((s) => s.on).map((s) => (
                  <span
                    key={s.id}
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: s.col }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Spectral Analysis FFT */}
        <div className={`p-5 rounded-2xl border shadow-sm space-y-4 ${
          isLight ? 'bg-white border-slate-200' : isBW ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className={`font-bold text-xs uppercase tracking-wider font-mono ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Analyse Spectrale FFT (Séparation des Fréquences)
            </span>

            {/* Bandwidth selector */}
            <div className={`flex items-center gap-1 p-1 rounded-xl border text-xs ${
              isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950/60 border-slate-800'
            }`}>
              {[
                { id: 'low', label: '0 – 16x' },
                { id: 'mid', label: '0 – 1 kHz' },
                { id: 'hf', label: '0 – 4 kHz' },
              ].map((b) => (
                <button
                  key={b.id}
                  onClick={() => {
                    setFreqRange(b.id as any);
                    setZoomRange(null);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                    freqRange === b.id
                      ? 'bg-blue-600 text-white font-bold shadow-sm'
                      : isLight
                      ? 'text-slate-600 hover:text-slate-900'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          <canvas
            ref={specCanvasRef}
            onMouseDown={handleSpecMouseDown}
            onMouseMove={handleSpecMouseMove}
            onMouseUp={handleSpecMouseUp}
            onDoubleClick={handleSpecDoubleClick}
            className={`w-full h-[260px] rounded-xl border cursor-crosshair ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
            }`}
          />

          <div className={`flex items-center justify-between text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            <span>Survolez une raie pour l'identifier · Glissez pour zoomer</span>
            {zoomRange && (
              <button
                onClick={handleSpecDoubleClick}
                className="text-blue-500 hover:underline flex items-center gap-1 font-semibold"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Réinitialiser zoom</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Third Section: Full Motopump Nomenclature */}
      <div className={`p-6 rounded-2xl border shadow-sm space-y-4 ${
        isLight ? 'bg-white border-slate-200' : isBW ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className={`font-bold text-xs uppercase tracking-wider font-mono ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Nomenclature Complète du Groupe Motopompe
            </span>
            <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Survolez un composant pour l'éclairer en cyan dans le modèle 3D interactif.
            </p>
          </div>

          <span className="px-3 py-1 rounded-xl text-xs font-mono bg-blue-500/10 text-blue-500 border border-blue-500/20 font-bold">
            {[...nomenclatureCats.values()].reduce((sum, list) => sum + list.length, 0)} pièces modélisées
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-2">
          {[...groupedNomenclature.entries()].map(([groupName, items]) => (
            <div
              key={groupName}
              className={`p-3.5 rounded-xl border space-y-2 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
              }`}
            >
              <div className={`font-bold text-xs text-blue-500 border-b pb-1.5 font-mono ${
                isLight ? 'border-slate-200' : 'border-slate-800/60'
              }`}>
                {groupName}
              </div>
              <div className="space-y-1">
                {items.map((it) => {
                  const isHl = highlightedPart === it.key;
                  return (
                    <div
                      key={it.key}
                      onMouseEnter={() => setHighlightedPart(it.key)}
                      onMouseLeave={() => setHighlightedPart(null)}
                      className={`px-2 py-1 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors ${
                        isHl
                          ? isLight
                            ? 'bg-sky-100 text-sky-800 font-semibold'
                            : 'bg-sky-500/20 text-sky-300 font-semibold'
                          : isLight
                          ? 'text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                          : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <span className="truncate pr-2">{it.name}</span>
                      <span className="text-[10px] font-mono text-slate-500">×{it.count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
