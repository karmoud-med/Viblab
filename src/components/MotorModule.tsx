import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Settings, 
  Activity, 
  HelpCircle, 
  RotateCcw, 
  Zap, 
  Play, 
  Pause,
  AlertTriangle,
  Layers,
  Radio,
  Sliders,
  Sparkles
} from 'lucide-react';
import ThreeMotorStage, { MotorHousingMode, OrbitType, ORBIT_DEFINITIONS } from './ThreeMotorStage';
import * as THREE from 'three';

const TAU = Math.PI * 2;
const BLUE = '#2563eb';
const GREEN = '#059669';
const RED = '#dc2626';
const PURPLE = '#7c3aed';
const ORANGE = '#ea580c';

interface MotorModuleProps {
  theme?: 'dark' | 'light' | 'mono';
}

interface SpectralPeak {
  f: number;
  a: number;
  lab: string;
  c: string;
  k?: string;
  ph?: number;
}

export default function MotorModule({ theme = 'dark' }: MotorModuleProps) {
  // Electrical & mechanical parameters
  const [lineFreq, setLineFreq] = useState<number>(50); // 50 Hz Europe / 60 Hz USA
  const [poles, setPoles] = useState<number>(4); // 2, 4, 6, 8 poles
  const [rpm, setRpm] = useState<number>(1475);
  const [numRotorBars, setNumRotorBars] = useState<number>(28);
  const [isRunning, setIsRunning] = useState<boolean>(true);

  // Defect parameters
  const [hasRotorBarFault, setHasRotorBarFault] = useState<boolean>(false);
  const [brokenBarCount, setBrokenBarCount] = useState<number>(2);

  // 3D stage settings
  const [housingMode, setHousingMode] = useState<MotorHousingMode>('cut');
  const [orbitType, setOrbitType] = useState<OrbitType>('none');
  const [orbitScale, setOrbitScale] = useState<number>(4.0);
  const [casingVibration, setCasingVibration] = useState<number>(3.0);

  // FFT View range
  const [freqRange, setFreqRange] = useState<'low' | 'zoom' | 'hf'>('low');
  const [zoomRange, setZoomRange] = useState<[number, number] | null>(null);

  // Nomenclature hover
  const [nomenclatureCats, setNomenclatureCats] = useState<Map<string, THREE.Mesh[]>>(new Map());
  const [highlightedPart, setHighlightedPart] = useState<string | null>(null);

  // Canvases
  const scopeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const orbitCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const specCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Interaction refs for FFT
  const dragRef = useRef<{ x0: number; x1: number | null } | null>(null);
  const [hoverPeak, setHoverPeak] = useState<{ X: number; peak: SpectralPeak | null; f: number } | null>(null);

  const isLight = theme === 'light';
  const isBW = theme === 'mono';

  // Kinematic calculations
  const syncSpeedRpm = (120 * lineFreq) / poles;
  const fr = rpm / 60; // shaft rotating frequency (Hz)
  const fs = (syncSpeedRpm - rpm) / 60; // slip frequency (Hz)
  const fp = poles * fs; // pole pass frequency (Hz)
  const slipPercent = ((syncSpeedRpm - rpm) / syncSpeedRpm) * 100;
  const rbpf = numRotorBars * fr; // Rotor Bar Pass Frequency (Hz)
  const fl2 = 2 * lineFreq; // 2x Line frequency (Hz)

  // Modulation factor
  const modFactor = hasRotorBarFault ? Math.min(0.12 * brokenBarCount, 0.6) : 0;

  // Ensure RPM stays in physically realistic operating slip range
  useEffect(() => {
    const minRpm = Math.round(syncSpeedRpm * 0.94);
    const maxRpm = Math.round(syncSpeedRpm - 1);
    if (rpm >= syncSpeedRpm || rpm < minRpm) {
      setRpm(Math.round(syncSpeedRpm * (1 - 0.0167)));
      setZoomRange(null);
    }
  }, [lineFreq, poles, syncSpeedRpm]);

  // Compute spectral peaks
  const spectralLines = useMemo((): SpectralPeak[] => {
    const lines: SpectralPeak[] = [];
    const ph = (i: number) => (i * 2.399) % TAU;

    lines.push({ f: fr, a: 1.0, lab: `1x RPM (${fr.toFixed(1)}Hz)`, c: BLUE, k: '1x' });
    lines.push({ f: 2 * fr, a: orbitType === 'complex' ? 0.75 : 0.32, lab: `2x RPM (${(2 * fr).toFixed(1)}Hz)`, c: BLUE });
    lines.push({ f: 3 * fr, a: 0.1, lab: '', c: BLUE });
    lines.push({ f: fl2, a: 0.7, lab: `2x FL (${fl2.toFixed(1)}Hz)`, c: GREEN });
    lines.push({ f: 2 * fl2, a: 0.12, lab: '4x FL', c: GREEN });

    if (orbitType === 'whirl') {
      lines.push({ f: 0.43 * fr, a: 0.8, lab: `0,43x Whirl (${(0.43 * fr).toFixed(1)}Hz)`, c: PURPLE });
    }

    if (modFactor > 0) {
      for (const s of [-1, 1]) {
        lines.push({
          f: fr + s * fp,
          a: modFactor / 2,
          lab: s < 0 ? '1x − Fp' : '1x + Fp',
          c: RED,
          k: 'sb',
        });
        lines.push({
          f: fr + 2 * s * fp,
          a: (modFactor * modFactor) / 4,
          lab: '',
          c: RED,
          k: 'sb',
        });
      }
    }

    lines.push({ f: rbpf, a: 0.18, lab: 'RBPF', c: ORANGE });
    for (const s of [-1, 1]) {
      lines.push({
        f: rbpf + s * fl2,
        a: 0.05 + (hasRotorBarFault ? 0.05 * brokenBarCount : 0),
        lab: s < 0 ? 'RBPF − 2FL' : 'RBPF + 2FL',
        c: ORANGE,
      });
    }

    lines.forEach((q, i) => {
      q.ph = ph(i);
    });

    return lines;
  }, [fr, fl2, fp, rbpf, modFactor, orbitType, hasRotorBarFault, brokenBarCount]);

  // Synthetic time waveform signal
  const evalSignal = useCallback(
    (t: number): number => {
      let x = (1 + modFactor * Math.cos(TAU * fp * t)) * Math.sin(TAU * fr * t);
      for (const q of spectralLines) {
        if (q.k !== '1x' && q.k !== 'sb') {
          x += q.a * Math.sin(TAU * q.f * t + (q.ph || 0));
        }
      }
      return x;
    },
    [modFactor, fp, fr, spectralLines]
  );

  // Compute signal scale
  const sigScale = useMemo(() => {
    let mx = 0;
    for (let i = 0; i < 4000; i++) {
      mx = Math.max(mx, Math.abs(evalSignal(i / 2000)));
    }
    return Math.max(mx * 1.15, 1.2);
  }, [evalSignal]);

  // Grouped nomenclature items
  const groupedNomenclature = useMemo(() => {
    const groups = new Map<string, Array<{ key: string; name: string; count: number }>>();
    for (const [fullName, list] of nomenclatureCats.entries()) {
      const [g, n] = fullName.split(' · ');
      if (!groups.has(g)) groups.set(g, []);
      groups.get(g)!.push({ key: fullName, name: n || g, count: list.length });
    }
    return groups;
  }, [nomenclatureCats]);

  // Draw 2D Time Scope (DE Bearing)
  const drawScope = useCallback(() => {
    const canvas = scopeCanvasRef.current;
    if (!canvas || canvas.clientWidth < 60) return;

    const dpr = window.devicePixelRatio || 1;
    const W = canvas.clientWidth;
    const Hh = canvas.clientHeight || 220;

    if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(Hh * dpr)) {
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(Hh * dpr);
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, Hh);

    const Tw = hasRotorBarFault ? Math.max(2.2 / Math.max(fp, 0.1), 0.4) : 0.4;
    const L = 42,
      Rr = W - 12,
      T = 24,
      B = Hh - 22,
      mid = (T + B) / 2,
      half = (B - T) / 2;

    // Grid lines
    ctx.font = '10px ui-monospace, Menlo, monospace';
    ctx.strokeStyle = isLight ? 'rgba(15, 23, 42, 0.08)' : 'rgba(148, 163, 184, 0.12)';
    ctx.fillStyle = isLight ? '#64748b' : '#94a3b8';
    ctx.lineWidth = 1;

    for (let i = 0; i <= 4; i++) {
      const X = L + (i * (Rr - L)) / 4;
      ctx.beginPath();
      ctx.moveTo(X, T);
      ctx.lineTo(X, B);
      ctx.stroke();
      ctx.textAlign = i === 4 ? 'right' : 'center';
      ctx.fillText(`${((-Tw * (4 - i)) / 4 * 1000).toFixed(0)} ms`, X, B + 14);
    }

    ctx.beginPath();
    ctx.moveTo(L, mid);
    ctx.lineTo(Rr, mid);
    ctx.stroke();

    // Signal waveform
    ctx.save();
    ctx.beginPath();
    ctx.rect(L, T - 2, Rr - L, B - T + 4);
    ctx.clip();

    const cols = Math.max(1, Math.floor(Rr - L));
    const sub = 8;
    ctx.strokeStyle = isLight ? '#0369a1' : '#38bdf8';
    ctx.lineWidth = 1.4;
    ctx.beginPath();

    for (let c = 0; c < cols; c++) {
      let lo = 1e9,
        hi = -1e9;
      for (let j = 0; j < sub; j++) {
        const v = evalSignal(((c + j / sub) / cols) * Tw);
        lo = Math.min(lo, v);
        hi = Math.max(hi, v);
      }
      const X = L + c + 0.5;
      const Yh = mid - (hi / sigScale) * half;
      const Yl = mid - (lo / sigScale) * half;
      if (c === 0) {
        ctx.moveTo(X, Yh);
      } else {
        ctx.lineTo(X, Yh);
      }
      ctx.lineTo(X, Yl);
    }
    ctx.stroke();

    // Modulated beating envelope (Red dotted)
    if (modFactor > 0) {
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.6;
      ctx.setLineDash([5, 3]);

      for (const s of [1, -1]) {
        ctx.beginPath();
        for (let c = 0; c <= cols; c += 2) {
          const t = (c / cols) * Tw;
          const e = (1 + modFactor * Math.cos(TAU * fp * t)) * 1.35;
          const Y = mid - s * (e / sigScale) * half;
          if (c === 0) ctx.moveTo(L + c, Y);
          else ctx.lineTo(L + c, Y);
        }
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }
    ctx.restore();

    // Scope title & status
    ctx.fillStyle = isLight ? '#0f172a' : '#f8fafc';
    ctx.font = 'bold 10.5px ui-monospace, Menlo, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(
      hasRotorBarFault
        ? `Battement à Fp : période 1/Fp = ${(1000 / Math.max(fp, 0.01)).toFixed(0)} ms`
        : 'Signal stable : amplitude constante (Sain)',
      L,
      14
    );
  }, [evalSignal, hasRotorBarFault, fp, modFactor, sigScale, isLight]);

  // Draw 2D Precession Orbit
  const drawOrbit = useCallback(() => {
    const canvas = orbitCanvasRef.current;
    if (!canvas || canvas.clientWidth < 40) return;

    const dpr = window.devicePixelRatio || 1;
    const W = canvas.clientWidth;
    const Hh = canvas.clientHeight || 200;

    if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(Hh * dpr)) {
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(Hh * dpr);
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, Hh);

    const cx = W / 2;
    const cy = Hh / 2;
    const r = Math.max(4, Math.min(W, Hh) / 2 - 18);
    const o = ORBIT_DEFINITIONS[orbitType];

    // Reference axes and concentric circles
    ctx.strokeStyle = isLight ? 'rgba(15, 23, 42, 0.12)' : 'rgba(148, 163, 184, 0.2)';
    ctx.lineWidth = 1;
    for (const k of [0.5, 1]) {
      ctx.beginPath();
      ctx.arc(cx, cy, r * k, 0, TAU);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(cx - r - 6, cy);
    ctx.lineTo(cx + r + 6, cy);
    ctx.moveTo(cx, cy - r - 6);
    ctx.lineTo(cx, cy + r + 6);
    ctx.stroke();

    ctx.fillStyle = isLight ? '#64748b' : '#94a3b8';
    ctx.font = '10px ui-monospace, Menlo, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('X', cx + r + 10, cy + 3);
    ctx.fillText('Y', cx, cy - r - 8);

    ctx.textAlign = 'left';
    ctx.fillStyle = BLUE;
    ctx.fillText('↺ rotation', 4, 12);

    if (orbitType === 'none') {
      ctx.fillStyle = RED;
      ctx.beginPath();
      ctx.arc(cx, cy, 4.5, 0, TAU);
      ctx.fill();
      ctx.fillStyle = isLight ? '#334155' : '#cbd5e1';
      ctx.textAlign = 'center';
      ctx.fillText('Arbre centré', cx, cy + 18);
      return;
    }

    const env = (t: number) => 1 + modFactor * Math.cos(TAU * fp * (t / (TAU * fr)));
    const getP = (t: number): [number, number] => {
      const [a, b] = o.fn(t);
      const e = env(t);
      return [
        cx + (a * e * r * 0.85) / (o.max * (1 + modFactor)),
        cy - (b * e * r * 0.85) / (o.max * (1 + modFactor)),
      ];
    };

    const span = orbitType === 'whirl' ? (TAU / 0.43) * 1.2 : TAU * 1.6;
    const N = 220;
    ctx.lineWidth = 2;

    for (let i = 1; i <= N; i++) {
      const a = -span + (span * (i - 1)) / N;
      const b = -span + (span * i) / N;
      const [x0, y0] = getP(a);
      const [x1, y1] = getP(b);
      ctx.strokeStyle = `rgba(37, 99, 235, ${0.15 + 0.85 * (i / N)})`;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    }

    // Keyphasor dot
    const [px, py] = getP(0);
    ctx.fillStyle = RED;
    ctx.beginPath();
    ctx.arc(px, py, 4.5, 0, TAU);
    ctx.fill();

    ctx.fillStyle = isLight ? '#64748b' : '#94a3b8';
    ctx.textAlign = 'right';
    ctx.fillText('○ keyphasor', W - 6, Hh - 6);
  }, [orbitType, fr, fp, modFactor, isLight]);

  // Full FFT frequency range
  const fullRange = useCallback((): [number, number] => {
    if (freqRange === 'zoom') {
      const hw = Math.max(6 * Math.max(fp, 0.5), 3);
      return [Math.max(0, fr - hw), fr + hw];
    }
    if (freqRange === 'hf') {
      return [0, Math.ceil(((rbpf + fl2) * 1.15) / 100) * 100];
    }
    return [0, 140];
  }, [freqRange, fp, fr, rbpf, fl2]);

  // Draw FFT Spectrum
  const drawSpectrum = useCallback(() => {
    const canvas = specCanvasRef.current;
    if (!canvas || canvas.clientWidth < 60) return;

    const dpr = window.devicePixelRatio || 1;
    const W = canvas.clientWidth;
    const Hh = canvas.clientHeight || 300;

    if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(Hh * dpr)) {
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(Hh * dpr);
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, Hh);

    const [f0, fE] = zoomRange || fullRange();
    const vis = spectralLines.filter((q) => q.f >= f0 && q.f <= fE);

    const L = 44,
      Rr = W - 12,
      T = 26,
      B = Hh - 26;
    const fx = (f: number) => L + ((f - f0) / (fE - f0)) * (Rr - L);
    const top = Math.max(0.3, ...vis.map((q) => q.a)) * 1.3;
    const fy = (a: number) => B - (a / top) * (B - T);

    // Grid lines & labels
    ctx.font = '10px ui-monospace, Menlo, monospace';
    ctx.strokeStyle = isLight ? 'rgba(15, 23, 42, 0.08)' : 'rgba(148, 163, 184, 0.12)';
    ctx.fillStyle = isLight ? '#64748b' : '#94a3b8';
    ctx.lineWidth = 1;

    const nT = Math.max(4, Math.min(8, Math.floor((Rr - L) / 70)));
    for (let i = 0; i <= nT; i++) {
      const X = L + (i * (Rr - L)) / nT;
      const f = f0 + (i * (fE - f0)) / nT;
      ctx.beginPath();
      ctx.moveTo(X, T);
      ctx.lineTo(X, B);
      ctx.stroke();
      ctx.textAlign = i === 0 ? 'left' : i === nT ? 'right' : 'center';
      ctx.fillText(fE - f0 < 30 ? f.toFixed(1) + ' Hz' : Math.round(f) + ' Hz', X, B + 16);
    }

    for (let i = 0; i <= 4; i++) {
      const Y = T + (i * (B - T)) / 4;
      ctx.beginPath();
      ctx.moveTo(L, Y);
      ctx.lineTo(Rr, Y);
      ctx.stroke();
      ctx.textAlign = 'right';
      ctx.fillText((top * (1 - i / 4)).toFixed(2), L - 6, Y + 3);
    }

    ctx.save();
    ctx.translate(12, (T + B) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('mm/s', 0, 0);
    ctx.restore();

    // Noise floor
    ctx.strokeStyle = isLight ? '#cbd5e1' : '#334155';
    ctx.beginPath();
    for (let i = 0; i <= 300; i++) {
      const f = f0 + (i / 300) * (fE - f0);
      const Y = fy(0.012 + 0.008 * Math.abs(Math.sin(f * 0.9) * Math.cos(f * 0.23)));
      if (i === 0) ctx.moveTo(fx(f), Y);
      else ctx.lineTo(fx(f), Y);
    }
    ctx.stroke();

    // Delta Fp dimension line in zoom view
    if (freqRange === 'zoom' && hasRotorBarFault) {
      ctx.strokeStyle = RED;
      ctx.fillStyle = RED;
      ctx.setLineDash([3, 3]);
      const Y = T + 8;
      ctx.beginPath();
      ctx.moveTo(fx(fr), Y);
      ctx.lineTo(fx(fr + fp), Y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.textAlign = 'center';
      ctx.fillText(`Fp = ${fp.toFixed(2)} Hz`, fx(fr + fp / 2), Y - 4);
    }

    // Peaks
    const placed: Array<[number, number, number]> = [];
    for (const q of [...vis].sort((a, b) => b.a - a.a)) {
      const X = fx(q.f);
      const Y = fy(q.a);

      ctx.strokeStyle = q.c;
      ctx.fillStyle = q.c;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(X, B);
      ctx.lineTo(X, Y);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(X, Y, 3.5, 0, TAU);
      ctx.fill();

      if (!q.lab) continue;
      ctx.font = '10px ui-monospace, Menlo, monospace';
      const tw = ctx.measureText(q.lab).width / 2 + 4;
      let ly = Y - 9;
      while (placed.some((p) => Math.abs(p[0] - X) < p[2] + tw && Math.abs(p[1] - ly) < 12)) {
        ly -= 12;
      }
      placed.push([X, ly, tw]);
      ctx.fillStyle = isLight ? '#334155' : '#cbd5e1';
      ctx.textAlign = 'center';
      ctx.fillText(q.lab, Math.min(Math.max(X, L + tw), Rr - tw), Math.max(ly, T - 6));
    }
    ctx.lineWidth = 1;

    // Drag selection box
    if (dragRef.current && dragRef.current.x1 !== null) {
      ctx.fillStyle = 'rgba(37, 99, 235, 0.15)';
      const x0 = dragRef.current.x0;
      const x1 = dragRef.current.x1;
      ctx.fillRect(Math.min(x0, x1), T, Math.abs(x1 - x0), B - T);
    }

    // Hover cursor line & tooltip
    if (hoverPeak) {
      const { X, peak, f } = hoverPeak;
      ctx.strokeStyle = isLight ? '#64748b' : '#94a3b8';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(X, T);
      ctx.lineTo(X, B);
      ctx.stroke();
      ctx.setLineDash([]);

      const s = peak
        ? `${peak.lab || 'Bande latérale ±2Fp'} · ${peak.f.toFixed(2)} Hz · ${(peak.f / fr).toFixed(2)}x · ${peak.a.toFixed(2)} mm/s`
        : `${f.toFixed(2)} Hz · ${(f / fr).toFixed(2)}x`;

      ctx.font = '11px ui-monospace, Menlo, monospace';
      const tw = ctx.measureText(s).width + 12;
      const bx = Math.min(Math.max(X - tw / 2, L), Rr - tw);

      ctx.fillStyle = isLight ? '#0f172a' : '#1e293b';
      ctx.fillRect(bx, 4, tw, 18);
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.fillText(s, bx + 6, 17);
    }
  }, [zoomRange, fullRange, spectralLines, freqRange, hasRotorBarFault, fr, fp, hoverPeak, isLight]);

  // Redraw canvases
  useEffect(() => {
    drawScope();
    drawOrbit();
    drawSpectrum();
  }, [drawScope, drawOrbit, drawSpectrum]);

  // FFT Mouse interaction
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
    const X = e.clientX - rect.left;
    const [f0, fE] = zoomRange || fullRange();

    const L = 44,
      Rr = canvas.clientWidth - 12;
    if (dragRef.current) {
      dragRef.current.x1 = X;
      setHoverPeak(null);
      drawSpectrum();
      return;
    }

    if (X < L || X > Rr) {
      setHoverPeak(null);
      drawSpectrum();
      return;
    }

    const fx = (f: number) => L + ((f - f0) / (fE - f0)) * (Rr - L);
    let matchedPeak: SpectralPeak | null = null;
    let minDist = 8;

    for (const p of spectralLines) {
      const d = Math.abs(fx(p.f) - X);
      if (d < minDist) {
        minDist = d;
        matchedPeak = p;
      }
    }

    const fHover = f0 + ((X - L) / (Rr - L)) * (fE - f0);
    setHoverPeak({
      X: matchedPeak ? fx(matchedPeak.f) : X,
      peak: matchedPeak,
      f: fHover,
    });
    drawSpectrum();
  };

  const handleSpecMouseUp = () => {
    const d = dragRef.current;
    dragRef.current = null;
    if (d && d.x1 !== null && Math.abs(d.x1 - d.x0) > 6) {
      const canvas = specCanvasRef.current;
      if (!canvas) return;
      const [f0, fE] = zoomRange || fullRange();
      const L = 44,
        Rr = canvas.clientWidth - 12;
      const toFreq = (xPos: number) => f0 + ((Math.min(Math.max(xPos, L), Rr) - L) / (Rr - L)) * (fE - f0);
      const minX = Math.min(d.x0, d.x1);
      const maxX = Math.max(d.x0, d.x1);
      setZoomRange([toFreq(minX), toFreq(maxX)]);
    }
    drawSpectrum();
  };

  const handleSpecDoubleClick = () => {
    setZoomRange(null);
  };

  return (
    <div className="space-y-6 max-w-[1550px] mx-auto pb-12" id="induction-motor-vibrations">
      {/* Intro Header Banner */}
      <div
        className={`p-6 rounded-2xl border backdrop-blur-md shadow-sm ${
          isLight
            ? 'bg-white/80 border-slate-200'
            : isBW
            ? 'bg-zinc-950 border-zinc-800'
            : 'bg-slate-900/80 border-slate-800'
        }`}
      >
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-blue-600/10 text-blue-500 border border-blue-500/20 flex-shrink-0">
            <Zap className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h1 className={`text-xl font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Diagnostic Vibratoire des Moteurs Asynchrones & Modèle 3D Industriel
            </h1>
            <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              Les moteurs électriques asynchrones (à induction) vibrent sous l'effet combiné des <b>forces mécaniques de rotation (1x)</b> et des <b>forces magnétiques d'entrefer (2×FL)</b>.
            </p>
            <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Une rupture de barre de rotor brise la symétrie du champ tournant : elle induit un <b>battement temporel à la fréquence de passage de pôles (Fp)</b> et fait naître des <b>bandes latérales à 1x ± Fp</b> dans le spectre FFT.
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Parameters & Scope Left, 3D & Analysis Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Electrical Parameters, Computed Frequencies & Time Scope (5 cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          {/* Card 1: Electrical Parameters */}
          <div
            className={`p-5 rounded-2xl border shadow-sm space-y-4 ${
              isLight
                ? 'bg-white border-slate-200'
                : isBW
                ? 'bg-zinc-950 border-zinc-800'
                : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between border-b pb-2">
              <span className={`font-bold text-xs uppercase tracking-wider font-mono ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Paramètres Électriques & Mécaniques
              </span>
              <span className="text-[11px] font-mono text-blue-500 font-bold">
                Moteur 15 kW IE3
              </span>
            </div>

            {/* Line Frequency FL */}
            <div className="space-y-1.5">
              <span className={`text-[11px] font-semibold uppercase tracking-wider block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Fréquence Réseau (FL)
              </span>
              <div className="flex items-center gap-5 text-xs">
                <label className={`flex items-center gap-1.5 cursor-pointer ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  <input
                    type="radio"
                    name="lineFreq"
                    checked={lineFreq === 50}
                    onChange={() => {
                      setLineFreq(50);
                      setZoomRange(null);
                    }}
                    className="accent-blue-600"
                  />
                  50 Hz (Europe)
                </label>
                <label className={`flex items-center gap-1.5 cursor-pointer ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  <input
                    type="radio"
                    name="lineFreq"
                    checked={lineFreq === 60}
                    onChange={() => {
                      setLineFreq(60);
                      setZoomRange(null);
                    }}
                    className="accent-blue-600"
                  />
                  60 Hz (USA)
                </label>
              </div>
            </div>

            {/* Poles Selection */}
            <div className="space-y-1.5">
              <span className={`text-[11px] font-semibold uppercase tracking-wider block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Nombre de Pôles (P)
              </span>
              <select
                value={poles}
                onChange={(e) => {
                  setPoles(+e.target.value);
                  setZoomRange(null);
                }}
                className={`w-full text-xs rounded-xl px-3 py-2 border outline-none font-medium transition-all ${
                  isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500'
                    : 'bg-slate-950 border-slate-800 text-slate-200 focus:border-blue-500'
                }`}
              >
                {[2, 4, 6, 8].map((p) => (
                  <option key={p} value={p}>
                    {p} Pôles (Vitesse synchrone : {Math.round((120 * lineFreq) / p)} RPM)
                  </option>
                ))}
              </select>
            </div>

            {/* Operating Speed Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className={`font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Vitesse de rotation réelle</span>
                <span className="font-mono font-bold text-blue-500">
                  {rpm} RPM ({fr.toFixed(1)} Hz)
                </span>
              </div>
              <input
                type="range"
                min={Math.round(syncSpeedRpm * 0.94)}
                max={Math.round(syncSpeedRpm - 1)}
                step="1"
                value={rpm}
                onChange={(e) => {
                  setRpm(+e.target.value);
                  setZoomRange(null);
                }}
                className="w-full accent-blue-600"
              />
              <div className={`text-[10.5px] font-mono flex justify-between ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                <span>Sync : {Math.round(syncSpeedRpm)} RPM</span>
                <span className="text-orange-500 font-semibold">
                  Glissement : {Math.round(syncSpeedRpm - rpm)} RPM ({slipPercent.toFixed(1)} %)
                </span>
              </div>
            </div>

            {/* Rotor Bars Input */}
            <div className="space-y-1.5 pt-1">
              <span className={`text-[11px] font-semibold uppercase tracking-wider block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Nombre de barres de rotor (R)
              </span>
              <input
                type="number"
                min="12"
                max="60"
                value={numRotorBars}
                onChange={(e) => setNumRotorBars(Math.min(Math.max(+e.target.value || 28, 12), 60))}
                className={`w-full text-xs rounded-xl px-3 py-2 border font-mono font-bold outline-none ${
                  isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500'
                    : 'bg-slate-950 border-slate-800 text-white focus:border-blue-500'
                }`}
              />
            </div>
          </div>

          {/* Card 2: Calculated Induction Frequencies */}
          <div
            className={`p-5 rounded-2xl border shadow-sm space-y-3 font-mono text-xs ${
              isLight
                ? 'bg-white border-slate-200'
                : isBW
                ? 'bg-zinc-950 border-zinc-800'
                : 'bg-slate-900 border-slate-800'
            }`}
          >
            <span className={`font-bold text-xs uppercase tracking-wider block font-mono border-b pb-2 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Fréquences d'Induction Moteur Calculées
            </span>

            <div className="space-y-2">
              <div className={`flex items-center justify-between py-1 border-b ${isLight ? 'border-slate-100' : 'border-slate-800/80'}`}>
                <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Fréquence de glissement (Fs)</span>
                <b className={`font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                  {fs.toFixed(3)} Hz ({Math.round(fs * 60)} CPM)
                </b>
              </div>

              <div className={`flex items-center justify-between py-1 border-b ${isLight ? 'border-slate-100' : 'border-slate-800/80'}`}>
                <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Fréq. Passage de Pôles (Fp)</span>
                <b className="text-red-500 font-bold">
                  {fp < 10 ? fp.toFixed(3) : fp.toFixed(1)} Hz
                </b>
              </div>

              <div className={`flex items-center justify-between py-1 border-b ${isLight ? 'border-slate-100' : 'border-slate-800/80'}`}>
                <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Passage barres rotor (RBPF)</span>
                <b className="text-emerald-500 font-bold">{rbpf.toFixed(1)} Hz</b>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>2× Fréquence réseau (2FL)</span>
                <b className="text-emerald-500 font-bold">{fl2.toFixed(1)} Hz</b>
              </div>
            </div>

            <div
              className={`p-2.5 rounded-xl border text-[11px] font-mono mt-1 ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-950/60 border-slate-800 text-slate-300'
              }`}
            >
              Fp = P × Fs = {poles} × {fs.toFixed(3)} = <b>{fp.toFixed(3)} Hz</b>
            </div>
          </div>

          {/* Card 3: Time Waveform Scope (DE Bearing) */}
          <div
            className={`p-5 rounded-2xl border shadow-sm space-y-3 flex-1 flex flex-col justify-between ${
              isLight
                ? 'bg-white border-slate-200'
                : isBW
                ? 'bg-zinc-950 border-zinc-800'
                : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`font-bold text-xs uppercase tracking-wider font-mono ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Signal Temporel (Palier DE)
              </span>
              <button
                onClick={() => setIsRunning(!isRunning)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isRunning
                    ? 'bg-rose-600 hover:bg-rose-500 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isRunning ? 'Arrêt' : 'Démarrer'}</span>
              </button>
            </div>

            <canvas
              ref={scopeCanvasRef}
              className={`w-full h-[200px] rounded-xl border ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
              }`}
            />

            <p className={`text-[11px] leading-relaxed ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Une barre cassée module l'amplitude 1x au rythme de <b>Fp</b> : le signal « bat » (enveloppe rouge en pointillés). Sans rupture, l'amplitude demeure rigoureusement constante.
            </p>
          </div>
        </div>

        {/* Right Column: Defect Injector, 3D Stage, Orbit & FFT Spectrum (7 cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          {/* Defect Injector Card */}
          <div
            className={`p-4.5 rounded-2xl border shadow-sm space-y-3 ${
              isLight
                ? 'bg-white border-slate-200'
                : isBW
                ? 'bg-zinc-950 border-zinc-800'
                : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`font-bold text-xs uppercase tracking-wider font-mono ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Injecteur de Défaut de Rotor
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10.5px] font-mono font-bold ${
                      hasRotorBarFault ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'
                    }`}
                  >
                    {hasRotorBarFault ? `Rupture active (${brokenBarCount} barres)` : 'Sain (Nominal)'}
                  </span>
                </div>
                <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Modulation électromagnétique induite par la perte d'induction locale de la cage d'écureuil.
                </p>
              </div>

              <button
                onClick={() => setHasRotorBarFault(!hasRotorBarFault)}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-sm cursor-pointer ${
                  hasRotorBarFault
                    ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-500/20'
                    : isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
              >
                {hasRotorBarFault ? 'DÉSACTIVER DÉFAUT' : 'ACTIVER DÉFAUT'}
              </button>
            </div>

            {hasRotorBarFault && (
              <div className={`p-3 rounded-xl border flex flex-wrap items-center gap-4 ${
                isLight ? 'bg-red-50/50 border-red-200' : 'bg-red-950/20 border-red-900/40'
              }`}>
                <span className={`text-xs font-semibold ${isLight ? 'text-red-900' : 'text-red-300'}`}>
                  Barres cassées :
                </span>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={brokenBarCount}
                  onChange={(e) => setBrokenBarCount(+e.target.value)}
                  className="flex-1 accent-red-600"
                />
                <b className="font-mono font-bold text-xs text-red-500 min-w-[70px] text-right">
                  {brokenBarCount} {brokenBarCount > 1 ? 'barres' : 'barre'}
                </b>
              </div>
            )}
          </div>

          {/* 3D Physical Motor Stage */}
          <ThreeMotorStage
            rpm={rpm}
            isRunning={isRunning}
            poles={poles}
            numRotorBars={numRotorBars}
            hasRotorBarFault={hasRotorBarFault}
            brokenBarCount={brokenBarCount}
            lineFreq={lineFreq}
            housingMode={housingMode}
            onHousingModeChange={setHousingMode}
            orbitType={orbitType}
            orbitScale={orbitScale}
            casingVibration={casingVibration}
            theme={theme}
            onNomenclatureReady={setNomenclatureCats}
            highlightedPart={highlightedPart}
          />

          {/* Precession Orbit Section (3D & 2D) */}
          <div
            className={`p-5 rounded-2xl border shadow-sm space-y-4 ${
              isLight
                ? 'bg-white border-slate-200'
                : isBW
                ? 'bg-zinc-950 border-zinc-800'
                : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between border-b pb-2">
              <span className={`font-bold text-xs uppercase tracking-wider font-mono ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Dynamique Rotorique & Orbite de Précession
              </span>
              <span className="text-[11px] font-mono text-purple-500">
                Visualisation X-Y Palier DE
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
              {/* Left: Orbit Type Selector & Sliders (7 cols) */}
              <div className="md:col-span-7 space-y-3">
                <span className={`text-[11px] font-semibold uppercase tracking-wider block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Type d'orbite de précession (3D)
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(Object.keys(ORBIT_DEFINITIONS) as OrbitType[]).map((type) => {
                    const isSel = orbitType === type;
                    return (
                      <button
                        key={type}
                        onClick={() => setOrbitType(type)}
                        className={`p-2 rounded-xl text-xs font-semibold border text-left transition-all ${
                          isSel
                            ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                            : isLight
                            ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                            : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
                        }`}
                      >
                        {ORBIT_DEFINITIONS[type].name}
                      </button>
                    );
                  })}
                </div>

                {/* Orbit & Structure sliders */}
                <div className="space-y-2.5 pt-2">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-blue-500 font-medium">Amplification de l'orbite</span>
                      <b className="font-mono text-blue-500">{orbitScale.toFixed(1)}x</b>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="8"
                      step="0.1"
                      value={orbitScale}
                      onChange={(e) => setOrbitScale(+e.target.value)}
                      className="w-full accent-blue-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-emerald-500 font-medium">Vibration de la carcasse</span>
                      <b className="font-mono text-emerald-500">{casingVibration.toFixed(1)}x</b>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="6"
                      step="0.1"
                      value={casingVibration}
                      onChange={(e) => setCasingVibration(+e.target.value)}
                      className="w-full accent-emerald-600"
                    />
                  </div>
                </div>
              </div>

              {/* Right: 2D Lissajous Canvas & Description (5 cols) */}
              <div className="md:col-span-5 space-y-2.5">
                <canvas
                  ref={orbitCanvasRef}
                  className={`w-full h-[180px] rounded-xl border ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                  }`}
                />
                <p className={`text-[11px] leading-relaxed p-2.5 rounded-xl border ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-950/60 border-slate-800 text-slate-400'
                }`}>
                  {ORBIT_DEFINITIONS[orbitType].desc}
                  {hasRotorBarFault && (
                    <span className="text-red-400 block mt-1 font-semibold">
                      ⚠ Avec {brokenBarCount} barre{brokenBarCount > 1 ? 's' : ''} cassée{brokenBarCount > 1 ? 's' : ''}, l'amplitude respire au rythme de Fp ({fp.toFixed(2)} Hz).
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* High-Resolution Spectral Analysis FFT */}
          <div
            className={`p-5 rounded-2xl border shadow-sm space-y-4 ${
              isLight
                ? 'bg-white border-slate-200'
                : isBW
                ? 'bg-zinc-950 border-zinc-800'
                : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className={`font-bold text-xs uppercase tracking-wider font-mono ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                {freqRange === 'zoom'
                  ? 'Zoom FFT : 1x RPM ± Fp (Bandes Latérales)'
                  : freqRange === 'hf'
                  ? 'FFT : Passage des Barres de Rotor (RBPF)'
                  : 'Zoom FFT : Harmoniques Électriques & Mécaniques (0 – 140 Hz)'}
              </span>

              {/* Bandwidth selector */}
              <div className={`flex items-center gap-1 p-1 rounded-xl border text-xs ${
                isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950/60 border-slate-800'
              }`}>
                {[
                  { id: 'low', label: '0 – 140 Hz' },
                  { id: 'zoom', label: 'Zoom 1x ± Fp' },
                  { id: 'hf', label: 'RBPF' },
                ].map((b) => (
                  <button
                    key={b.id}
                    onClick={() => {
                      setFreqRange(b.id as any);
                      setZoomRange(null);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                      freqRange === b.id
                        ? 'bg-blue-600 text-white font-bold shadow-xs'
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
              className={`w-full h-[280px] rounded-xl border cursor-crosshair ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
              }`}
            />

            <div className={`flex items-center justify-between text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              <span>Survolez une raie pour l'identifier · Glissez pour zoomer</span>
              {zoomRange && (
                <button
                  onClick={handleSpecDoubleClick}
                  className="text-blue-500 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Réinitialiser zoom</span>
                </button>
              )}
            </div>

            {/* Diagnostic Guide */}
            <div
              className={`p-4 rounded-xl border text-[11.5px] space-y-2 leading-relaxed ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-950/60 border-slate-800 text-slate-300'
              }`}
            >
              <div className="font-bold text-xs text-blue-500 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4" />
                <span>Guide de Diagnostic Électromécanique ISO 18436 :</span>
              </div>
              <p>
                • <b>2× FL (deux fois la fréquence réseau = {fl2} Hz)</b> : Raie due à l'attraction magnétique dans l'entrefer. Si elle dépasse nettement le pic de rotation (1x RPM), suspecter un défaut d'entrefer inégal, un déséquilibre de phases ou un court-circuit entre spires statoriques.
              </p>
              <p>
                • <b>Fréquence de passage de pôles (Fp = {fp.toFixed(2)} Hz)</b> : Une barre cassée crée une asymétrie du champ rotorique tournant. L'amplitude 1x est modulée à Fp, produisant des <b>bandes latérales à 1x ± Fp</b> dans le spectre FFT et un battement périodique dans le signal temporel.
              </p>
              <p>
                • <b>RBPF (Rotor Bar Pass Frequency = {rbpf.toFixed(1)} Hz)</b> : Passage des barres rotoriques devant les encoches statoriques, entouré de bandes latérales à ±2FL qui s'intensifient lors d'une détérioration de la cage.
              </p>
              <p className="text-[11px] text-blue-500 font-mono">
                • <b>Règle d'échantillonnage CBM</b> : Pour séparer distinctement 1x et 1x ± Fp (écart {fp.toFixed(2)} Hz), la résolution FFT doit être ≤ {(fp / 4).toFixed(2)} Hz, imposant un temps d'acquisition minimale <b>T ≥ {(4 / Math.max(fp, 0.05)).toFixed(1)} s</b>.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Nomenclature Complète du Moteur Asynchrone */}
      <div
        className={`p-6 rounded-2xl border shadow-sm space-y-4 ${
          isLight
            ? 'bg-white border-slate-200'
            : isBW
            ? 'bg-zinc-950 border-zinc-800'
            : 'bg-slate-900 border-slate-800'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className={`font-bold text-xs uppercase tracking-wider font-mono ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Nomenclature Complète du Moteur Asynchrone 3D
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
              <div
                className={`font-bold text-xs text-blue-500 border-b pb-1.5 font-mono ${
                  isLight ? 'border-slate-200' : 'border-slate-800/60'
                }`}
              >
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
