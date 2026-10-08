import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Settings, 
  HelpCircle, 
  Activity, 
  Disc, 
  Info,
  Maximize2,
  Minimize2,
  Eye,
  Sliders,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  BarChart3,
  TrendingUp,
  Cpu,
  Waves,
  ZoomIn
} from 'lucide-react';
import { 
  ReducerParams, 
  ReducerKinematics, 
  PRESET, 
  STAGE_COL, 
  kin, 
  gearOf, 
  toothU, 
  shockPhase, 
  synth, 
  peaks, 
  floorAt, 
  residual, 
  stats, 
  attenuation,
  PeakItem
} from '../utils/reducerModel';
import ThreeReducerStage from './ThreeReducerStage';

interface GearModuleProps {
  theme?: 'dark' | 'light' | 'mono';
}

const NS = [1, 2, 4, 8, 16, 32, 64, 128, 256];
const COL = {
  rpm: '#2563eb',
  sb: '#ef4444',
  sbd: '#f97316',
  htf: '#d97706',
  int: '#64748b'
};

const colOf = (q: PeakItem) => (q.kind === 'gmf' && q.st != null ? STAGE_COL[q.st] : COL[q.kind] || '#64748b');
const fmtHz = (f: number) => (f < 10 ? f.toFixed(2) : f.toFixed(1)) + ' Hz';

export default function GearModule({ theme = 'dark' }: GearModuleProps) {
  // 1. Reducer State
  const [params, setParams] = useState<ReducerParams>({
    rpm: 1500,
    st: PRESET[2].map(a => [...a]),
    ecc: 0.2,
    noise: 0.3,
    def: 'broken',
    dStage: 0,
    dW: 0,
    dTooth: 5,
  });

  const [nStages, setNStages] = useState<number>(2);
  const [housingMode, setHousingMode] = useState<'trans' | 'closed' | 'hidden'>('trans');
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [refShaft, setRefShaft] = useState<number | null>(null);
  const [numAvg, setNumAvg] = useState<number>(16);
  const [isDbScale, setIsDbScale] = useState<boolean>(false);
  const [zoomRange, setZoomRange] = useState<[number, number] | null>(null);

  // Active hover in spectrum
  const [hoverPeak, setHoverPeak] = useState<{ x: number; peak: PeakItem | null; freq: number } | null>(null);
  const [dragRange, setDragRange] = useState<{ x0: number; x1: number | null } | null>(null);

  // Canvases
  const scopeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const specCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const waveCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const isLight = theme === 'light';
  const isBW = theme === 'mono';

  // Kinematics
  const kinematics: ReducerKinematics = useMemo(() => {
    return kin(params);
  }, [params]);

  const nS = params.st.length;
  const shaftName = (s: number) => `A${s + 1}${s === 0 ? ' (entrée)' : s === nS ? ' (sortie)' : ''}`;
  const defShaft = params.def !== 'none' ? params.dStage + params.dW : 0;
  const activeRef = refShaft ?? defShaft;

  // Update teeth on stage change
  const handleStagePreset = (n: number) => {
    setNStages(n);
    const newSt = PRESET[n].map(a => [...a]) as [number, number][];
    const newDStage = params.dStage >= n ? n - 1 : params.dStage;
    setParams(prev => ({
      ...prev,
      st: newSt,
      dStage: newDStage,
      dTooth: Math.min(prev.dTooth, newSt[newDStage][prev.dW])
    }));
    setRefShaft(null);
    setZoomRange(null);
  };

  // Update tooth count for stage
  const handleToothChange = (stageIdx: number, wheelIdx: number, val: number) => {
    const valClamped = Math.max(8, Math.min(120, val || 8));
    setParams(prev => {
      const copy = prev.st.map(a => [...a]) as [number, number][];
      copy[stageIdx][wheelIdx] = valClamped;
      const maxTooth = copy[prev.dStage][prev.dW];
      return {
        ...prev,
        st: copy,
        dTooth: prev.dTooth > maxTooth ? maxTooth : prev.dTooth
      };
    });
  };

  // TSA Computation
  const tsaData = useMemo(() => {
    const p = params;
    const k = kinematics;
    const s = activeRef;
    const fr = k.f[s] || 1;
    const Ns = 1024;
    const N = numAvg;
    const n = p.st.length;
    
    const Zs: number[] = [];
    if (s > 0 && k.S[s - 1]) Zs.push(k.S[s - 1].z2);
    if (s < n && k.S[s]) Zs.push(k.S[s].z1);

    const avg = new Float64Array(Ns);
    const raw = new Float64Array(Ns);

    let sd = 12345;
    const rnd = () => (sd = (sd * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
    const gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-12)) * Math.cos(2 * Math.PI * rnd());

    for (let j = 0; j < N; j++) {
      for (let i = 0; i < Ns; i++) {
        const v = synth(p, k, (j + i / Ns) / fr) + 0.35 * gauss();
        avg[i] += v / N;
        if (!j) raw[i] = v;
      }
    }

    let tickZ = Zs[0] || 20;
    let u0: number | null = null;
    if (p.def !== 'none') {
      const g = gearOf(k, p.dStage, p.dW);
      if (g.s === s) {
        tickZ = g.z;
        u0 = toothU(p.dW, p.dTooth, g.z);
      }
    }

    const res = residual(avg, Zs);
    return {
      s,
      fr,
      Zs,
      tickZ,
      u0,
      avg,
      raw,
      res,
      sA: stats(avg),
      sB: stats(raw),
      sR: stats(res)
    };
  }, [params, kinematics, activeRef, numAvg]);

  // Spectrum peaks and ghost reference
  const specData = useMemo(() => {
    const allPeaks = peaks(params, kinematics);
    if (refShaft == null) {
      return { P: allPeaks, ghost: null };
    }
    const fr = kinematics.f[refShaft] || 1;
    return {
      ghost: allPeaks,
      P: allPeaks.map(q => ({
        ...q,
        raw: q.a,
        a: q.a * attenuation(q.f / fr, numAvg)
      }))
    };
  }, [params, kinematics, refShaft, numAvg]);

  // Default Zoom Range
  const fullZoom = useMemo<[number, number]>(() => {
    return [0, Math.max(kinematics.S[0]?.gmf * 3.3 || 500, 60)];
  }, [kinematics]);

  const activeZoom = zoomRange || fullZoom;

  // Draw Spectrum Canvas
  useEffect(() => {
    const canvas = specCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const W = canvas.clientWidth;
    const H = 240;
    if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.height = `${H}px`;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const [f0, f1] = activeZoom;
    const { P, ghost } = specData;
    const base = ghost || P;

    const L = 48;
    const R = W - 14;
    const T = 24;
    const B = H - 26;
    const fx = (f: number) => L + ((f - f0) / (f1 - f0)) * (R - L);
    const top = Math.max(...base.map(q => q.a), 0.1) * 1.2;

    const fy = (a: number) => {
      if (isDbScale) {
        const val = Math.min(Math.max((20 * Math.log10(Math.max(a, 1e-9) / top) + 60) / 60, 0), 1);
        return B - val * (B - T);
      }
      return B - (a / top) * (B - T);
    };

    // Grid X
    ctx.font = '10px IBM Plex Mono, monospace';
    ctx.lineWidth = 1;
    ctx.strokeStyle = isLight ? '#E2E8F0' : '#1E293B';
    ctx.fillStyle = isLight ? '#64748B' : '#94A3B8';

    for (let i = 0; i <= 10; i++) {
      const X = L + (i * (R - L)) / 10;
      const f = f0 + (i * (f1 - f0)) / 10;
      ctx.beginPath();
      ctx.moveTo(X, T);
      ctx.lineTo(X, B);
      ctx.stroke();
      ctx.textAlign = 'center';
      ctx.fillText((f1 - f0 < 50 ? f.toFixed(1) : Math.round(f)) + ' Hz', X, B + 16);
    }

    // Grid Y
    for (let i = 0; i <= 4; i++) {
      const Y = T + (i * (B - T)) / 4;
      ctx.beginPath();
      ctx.moveTo(L, Y);
      ctx.lineTo(R, Y);
      ctx.stroke();
      ctx.textAlign = 'right';
      ctx.fillText(isDbScale ? `${-15 * i}` : (top * (1 - i / 4)).toFixed(2), L - 6, Y + 3);
    }

    // Axis label
    ctx.save();
    ctx.translate(12, (T + B) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText(isDbScale ? 'dB' : 'Amplitude (g)', 0, 0);
    ctx.restore();

    // Noise floor
    const red = refShaft == null ? 1 : 1 / Math.sqrt(numAvg);
    const drawFloor = (kk: number, col: string) => {
      ctx.strokeStyle = col;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i <= 300; i++) {
        const f = f0 + (i / 300) * (f1 - f0);
        const Y = fy(floorAt(f, params) * kk);
        if (i === 0) ctx.moveTo(fx(f), Y);
        else ctx.lineTo(fx(f), Y);
      }
      ctx.stroke();
    };

    if (ghost) drawFloor(1, isLight ? '#E2E8F0' : '#1E2D42');
    drawFloor(red, isLight ? '#CBD5E1' : '#334155');

    // Clipping area for peaks
    ctx.save();
    ctx.beginPath();
    ctx.rect(L, 0, R - L, B + 1);
    ctx.clip();

    const vis = (q: PeakItem) => q.f >= f0 && q.f <= f1;

    // Draw ghost peaks
    if (ghost) {
      ctx.strokeStyle = isLight ? '#CBD5E1' : '#334155';
      ctx.lineWidth = 1.5;
      for (const q of ghost.filter(vis)) {
        ctx.beginPath();
        ctx.moveTo(fx(q.f), B);
        ctx.lineTo(fx(q.f), fy(q.a));
        ctx.stroke();
      }
    }

    // Draw current peaks
    const placed: [number, number, number][] = [];
    for (const q of P.filter(vis).sort((a, b) => b.a - a.a)) {
      const X = fx(q.f);
      const Y = fy(q.a);
      const c = colOf(q);

      ctx.strokeStyle = c;
      ctx.fillStyle = c;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(X, B);
      ctx.lineTo(X, Y);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(X, Y, 3, 0, Math.PI * 2);
      ctx.fill();

      // Peak label
      if (q.label && q.a >= top * 0.035) {
        const text = `${q.label} (${q.f.toFixed(1)}Hz)`;
        const tw = ctx.measureText(text).width / 2 + 4;
        let ly = Y - 9;
        while (placed.some(pp => Math.abs(pp[0] - X) < pp[2] + tw && Math.abs(pp[1] - ly) < 12)) {
          ly -= 12;
        }
        placed.push([X, ly, tw]);
        ctx.fillStyle = isLight ? '#0F172A' : '#F1F5F9';
        ctx.textAlign = 'center';
        ctx.fillText(text, X, Math.max(ly, T + 2));
      }
    }
    ctx.restore();

    // Draw drag selection box
    if (dragRange && dragRange.x1 != null) {
      ctx.fillStyle = 'rgba(37, 99, 235, 0.15)';
      ctx.fillRect(
        Math.min(dragRange.x0, dragRange.x1),
        T,
        Math.abs(dragRange.x1 - dragRange.x0),
        B - T
      );
    }

    // Draw hover cursor
    if (hoverPeak) {
      const { x: hx, peak: hpk, freq: hf } = hoverPeak;
      const fr = kinematics.f[activeRef] || 1;
      ctx.strokeStyle = '#94A3B8';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(hx, T);
      ctx.lineTo(hx, B);
      ctx.stroke();
      ctx.setLineDash([]);

      const kindN: Record<string, string> = {
        sb: 'Bande latérale ±1x',
        sbd: `Bande de choc (±n× A${defShaft + 1})`,
      };

      let infoText = hpk
        ? `${hpk.label || kindN[hpk.kind] || 'Harmonique'} • ${hpk.f.toFixed(2)} Hz • ordre A${activeRef + 1} ${(hpk.f / fr).toFixed(2)} • ${hpk.a.toFixed(3)} g`
        : `${hf.toFixed(1)} Hz • ordre A${activeRef + 1} ${(hf / fr).toFixed(2)}`;

      if (hpk && hpk.raw != null) {
        infoText += ` (brut: ${hpk.raw.toFixed(3)} g)`;
      }

      ctx.font = '11px IBM Plex Mono, monospace';
      const tw = ctx.measureText(infoText).width + 14;
      const bx = Math.min(Math.max(hx - tw / 2, L), R - tw);
      ctx.fillStyle = isLight ? '#0F172A' : '#0B1422';
      ctx.fillRect(bx, T - 20, tw, 18);
      ctx.strokeStyle = '#38BDF8';
      ctx.strokeRect(bx, T - 20, tw, 18);
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'left';
      ctx.fillText(infoText, bx + 7, T - 7);
    }
  }, [specData, activeZoom, isDbScale, hoverPeak, dragRange, isLight, params, kinematics, activeRef, numAvg]);

  // Draw TSA Waveform Canvas (Raw vs TSA vs Residual)
  useEffect(() => {
    const canvas = waveCanvasRef.current;
    if (!canvas || !tsaData) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const W = canvas.clientWidth;
    const H = 220;
    if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.height = `${H}px`;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const t = tsaData;
    const L = 95;
    const R = W - 14;
    const Ns = t.avg.length;
    const lanes: [string, Float64Array, string, number][] = [
      ['Brut (1 tour)', t.raw, isLight ? '#64748B' : '#94A3B8', 0],
      [`TSA (N = ${numAvg})`, t.avg, '#2563EB', 0],
      ['Résiduel', t.res, '#DC2626', 1],
    ];

    const sc0 = Math.max(t.sB.pk, t.sA.pk, 0.1) * 1.05;
    const sc1 = t.sR.pk * 1.1 || 1;
    const lh = (H - 46) / 3;
    const X = (i: number) => L + (i / Ns) * (R - L);

    ctx.font = '10px IBM Plex Mono, monospace';

    // Tooth ticks
    ctx.strokeStyle = isLight ? '#94A3B8' : '#475569';
    for (let k = 0; k < t.tickZ; k++) {
      const Xk = L + (k / t.tickZ) * (R - L);
      ctx.beginPath();
      ctx.moveTo(Xk, 6);
      ctx.lineTo(Xk, 12);
      ctx.stroke();
    }

    // Degree axis
    ctx.strokeStyle = isLight ? '#E2E8F0' : '#1E293B';
    ctx.fillStyle = isLight ? '#64748B' : '#94A3B8';
    ctx.textAlign = 'center';
    for (let d = 0; d <= 360; d += 45) {
      const Xd = L + (d / 360) * (R - L);
      ctx.beginPath();
      ctx.moveTo(Xd, 16);
      ctx.lineTo(Xd, H - 22);
      ctx.stroke();
      ctx.fillText(d + '°', Xd, H - 8);
    }

    // Highlight defect tooth location
    if (t.u0 != null) {
      const Xd = L + t.u0 * (R - L);
      ctx.fillStyle = 'rgba(245, 158, 11, 0.18)';
      ctx.fillRect(Xd - 6, 16, 26, H - 38);
      ctx.strokeStyle = '#F59E0B';
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(Xd, 16);
      ctx.lineTo(Xd, H - 22);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#D97706';
      ctx.font = 'bold 10px IBM Plex Mono, monospace';
      ctx.textAlign = Xd > R - 80 ? 'right' : 'left';
      ctx.fillText(`Dent n°${params.dTooth}`, Xd + (Xd > R - 80 ? -6 : 22), 26);
    }

    // Draw the 3 signals
    lanes.forEach(([name, data, color, isRes], j) => {
      const y0 = 18 + lh * j + lh / 2;
      const sc = isRes ? sc1 : sc0;

      ctx.fillStyle = color;
      ctx.textAlign = 'right';
      ctx.font = 'bold 10.5px IBM Plex Sans, sans-serif';
      ctx.fillText(name, L - 8, y0 + 3);

      ctx.strokeStyle = isLight ? '#E2E8F0' : '#1E293B';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(L, y0);
      ctx.lineTo(R, y0);
      ctx.stroke();

      ctx.strokeStyle = color;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      for (let i = 0; i < Ns; i++) {
        const Y = y0 - (data[i] / sc) * (lh / 2 - 3);
        if (i === 0) ctx.moveTo(X(i), Y);
        else ctx.lineTo(X(i), Y);
      }
      ctx.stroke();
    });
  }, [tsaData, numAvg, isLight, params.dTooth]);

  // Live Oscilloscope Loop
  useEffect(() => {
    let animId: number;
    let U = 0;
    let last = performance.now();

    const canvas = scopeCanvasRef.current;
    if (!canvas) return;

    const renderScope = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      const p = params;
      const k = kinematics;
      const sI = defShaft;
      const fI = k.f[sI] || 1;

      U += dt * speedMultiplier * Math.min((0.35 * k.f[0]) / fI, 3);

      const ctx = canvas.getContext('2d');
      if (ctx) {
        const dpr = window.devicePixelRatio || 1;
        const W = canvas.clientWidth;
        const H = 140;
        if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
          canvas.width = Math.round(W * dpr);
          canvas.height = Math.round(H * dpr);
          canvas.style.height = `${H}px`;
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, W, H);

        const Tw = 2.5 / fI;
        const tNow = U / k.f[0];
        const t0 = tNow - Tw;
        const L = 46;
        const R = W - 60;
        const T = 22;
        const B = H - 20;
        const mid = (T + B) / 2;
        const half = (B - T) / 2;
        const tx = (t: number) => L + ((t - t0) / Tw) * (R - L);

        ctx.font = '9.5px IBM Plex Mono, monospace';
        ctx.strokeStyle = isLight ? '#E2E8F0' : '#1E293B';
        ctx.fillStyle = isLight ? '#64748B' : '#94A3B8';
        ctx.lineWidth = 1;

        // Grid X (ms)
        for (let i = 0; i <= 5; i++) {
          const Xpos = L + (i * (R - L)) / 5;
          ctx.beginPath();
          ctx.moveTo(Xpos, T);
          ctx.lineTo(Xpos, B);
          ctx.stroke();
          ctx.textAlign = 'center';
          ctx.fillText(`${(-(Tw * (5 - i)) / 5 * 1000).toFixed(0)} ms`, Xpos, B + 14);
        }

        // Center line
        ctx.beginPath();
        ctx.moveTo(L, mid);
        ctx.lineTo(R, mid);
        ctx.stroke();

        ctx.textAlign = 'right';
        ctx.fillText('g', L - 6, T + 4);

        // Shock impact zone markers
        const shocks: number[] = [];
        if (p.def !== 'none') {
          const { u0 } = shockPhase(p, k);
          for (let j = Math.ceil(t0 * fI - u0); j <= Math.floor(tNow * fI - u0); j++) {
            shocks.push((j + u0) / fI);
          }
          for (const ts of shocks) {
            const Xs = tx(ts);
            ctx.fillStyle = 'rgba(220, 38, 38, 0.12)';
            ctx.fillRect(Xs - 4, T, 18, B - T);
          }
        }

        // Signal trace
        const cols = Math.max(1, Math.floor(R - L));
        const sub = 5;
        const scaleMax = 4.0;
        ctx.strokeStyle = isLight ? '#0F172A' : '#38BDF8';
        ctx.lineWidth = 1.2;
        ctx.beginPath();

        for (let c = 0; c < cols; c++) {
          let lo = 1e9;
          let hi = -1e9;
          for (let j = 0; j < sub; j++) {
            const v = synth(p, k, t0 + ((c + j / sub) / cols) * Tw);
            if (v < lo) lo = v;
            if (v > hi) hi = v;
          }
          const Xpos = L + c + 0.5;
          ctx.moveTo(Xpos, mid - (hi / scaleMax) * half);
          ctx.lineTo(Xpos, mid - (lo / scaleMax) * half + 0.5);
        }
        ctx.stroke();

        // Shocks pins
        ctx.font = 'bold 9.5px IBM Plex Mono, monospace';
        shocks.forEach((ts, idx) => {
          const Xs = tx(ts);
          ctx.strokeStyle = '#DC2626';
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(Xs, T);
          ctx.lineTo(Xs, B);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = '#DC2626';
          ctx.beginPath();
          ctx.moveTo(Xs - 4, T - 2);
          ctx.lineTo(Xs + 4, T - 2);
          ctx.lineTo(Xs, T + 5);
          ctx.fill();

          if (idx > 0) {
            const X0 = tx(shocks[idx - 1]);
            ctx.strokeStyle = '#DC2626';
            ctx.beginPath();
            ctx.moveTo(X0, T - 8);
            ctx.lineTo(Xs, T - 8);
            ctx.stroke();
            ctx.textAlign = 'center';
            ctx.fillText(`T = ${(1000 / fI).toFixed(0)} ms`, (X0 + Xs) / 2, T - 11);
          }
        });

        // Now line
        ctx.strokeStyle = '#2563EB';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(R, T - 3);
        ctx.lineTo(R, B);
        ctx.stroke();
        ctx.fillStyle = '#2563EB';
        ctx.textAlign = 'left';
        ctx.font = 'bold 9.5px IBM Plex Sans, sans-serif';
        ctx.fillText('Maintenant', R + 5, mid + 3);
      }

      animId = requestAnimationFrame(renderScope);
    };

    animId = requestAnimationFrame(renderScope);
    return () => cancelAnimationFrame(animId);
  }, [params, kinematics, speedMultiplier, defShaft, isLight]);

  // Spectrum Canvas Mouse Interactions (Drag Zoom & Hover Tooltips)
  const handleSpecMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = specCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    setDragRange({ x0: x, x1: null });
  };

  const handleSpecMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = specCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const W = canvas.clientWidth;
    const L = 48;
    const R = W - 14;

    if (dragRange) {
      setDragRange({ x0: dragRange.x0, x1: x });
      setHoverPeak(null);
      return;
    }

    if (x < L || x > R) {
      setHoverPeak(null);
      return;
    }

    const [f0, f1] = activeZoom;
    const fCur = f0 + ((x - L) / (R - L)) * (f1 - f0);

    let nearest: PeakItem | null = null;
    let minD = 10;

    for (const pk of specData.P) {
      const px = L + ((pk.f - f0) / (f1 - f0)) * (R - L);
      const d = Math.abs(px - x);
      if (pk.f >= f0 && pk.f <= f1 && d < minD) {
        minD = d;
        nearest = pk;
      }
    }

    const hx = nearest ? L + ((nearest.f - f0) / (f1 - f0)) * (R - L) : x;
    setHoverPeak({ x: hx, peak: nearest, freq: fCur });
  };

  const handleSpecMouseUp = () => {
    if (!dragRange) return;
    const { x0, x1 } = dragRange;
    setDragRange(null);

    const canvas = specCanvasRef.current;
    if (!canvas || x1 == null) return;
    if (Math.abs(x1 - x0) > 8) {
      const W = canvas.clientWidth;
      const L = 48;
      const R = W - 14;
      const [f0, f1] = activeZoom;
      const F = (Xpos: number) => f0 + ((Math.min(Math.max(Xpos, L), R) - L) / (R - L)) * (f1 - f0);
      const newMin = F(Math.min(x0, x1));
      const newMax = F(Math.max(x0, x1));
      if (newMax - newMin > 2) {
        setZoomRange([newMin, newMax]);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E3E1DA] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 text-blue-700 uppercase">
              Équipement Machine 3D
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-100 text-emerald-700">
              ISO 10816-3 & ISO 18436-2
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#0F1B2D] tracking-tight mt-1.5 flex items-center gap-2.5">
            <Disc className="w-6 h-6 text-blue-600 animate-spin-slow" />
            <span>Réducteur Industriel 3D Multi-Étages • GMF & TSA</span>
          </h1>
          <p className="text-xs text-[#5B6675] mt-1 max-w-3xl leading-relaxed">
            Simulation cinématique complète d'engrenages parallèles (1 à 3 étages), modulations par excentricité, chocs périodiques de denture défectueuse, oscilloscope temps réel, FFT haute résolution et moyennage synchrone tachymétrique (TSA).
          </p>
        </div>

        {/* Global Reduction Ratio Badge */}
        <div className="p-3.5 rounded-xl border border-[#E3E1DA] bg-white shadow-2xs flex items-center gap-4 shrink-0">
          <div>
            <div className="text-[10px] uppercase font-bold text-[#8A929C] tracking-wider">Rapport Global</div>
            <div className="text-lg font-bold font-mono text-[#0F1B2D]">i = {kinematics.ratio.toFixed(2)}</div>
          </div>
          <div className="border-l border-[#E3E1DA] pl-4">
            <div className="text-[10px] uppercase font-bold text-[#8A929C] tracking-wider">Vitesse Sortie</div>
            <div className="text-lg font-bold font-mono text-blue-600">
              {Math.round(kinematics.f[nStages] * 60)} <span className="text-xs font-normal text-[#5B6675]">RPM</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN 2-COLUMN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: CONTROLS & KINEMATICS (5 COLS) */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Card A: Gearbox Architecture */}
          <div className="p-5 rounded-2xl border border-[#E3E1DA] bg-white shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#EEECE6] pb-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#0F1B2D]">
                <Settings className="w-4 h-4 text-blue-600" />
                <span>Architecture du Réducteur</span>
              </div>
              <span className="text-[11px] font-mono text-[#5B6675]">
                {nStages} étage{nStages > 1 ? 's' : ''}
              </span>
            </div>

            {/* Stage Preset Selector */}
            <div>
              <label className="text-xs font-medium text-[#3A4552] block mb-1.5">Nombre d'étages :</label>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((n) => (
                  <button
                    key={n}
                    onClick={() => handleStagePreset(n)}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      nStages === n
                        ? 'bg-[#0F1B2D] text-white border-[#0F1B2D] shadow-xs'
                        : 'bg-[#FAF9F6] text-[#475569] border-[#E3E1DA] hover:bg-[#F3F2EE]'
                    }`}
                  >
                    {n === 1 ? '1 étage' : n === 2 ? '2 étages' : '3 étages'}
                  </button>
                ))}
              </div>
            </div>

            {/* Input RPM Slider */}
            <div>
              <div className="flex items-center justify-between text-xs font-medium text-[#3A4552] mb-1.5">
                <span>Vitesse d'entrée (Arbre 1) :</span>
                <span className="font-mono font-bold text-blue-600">
                  {params.rpm} RPM ({fmtHz(params.rpm / 60)})
                </span>
              </div>
              <input
                type="range"
                min="300"
                max="3000"
                step="10"
                value={params.rpm}
                onChange={(e) => setParams({ ...params, rpm: Number(e.target.value) })}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            {/* Teeth Counts Per Stage */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between text-[11px] font-semibold text-[#8A929C] px-1">
                <span>Étage</span>
                <span>Z Pignon</span>
                <span>Z Roue</span>
                <span>Rapport i</span>
              </div>
              {params.st.map(([z1, z2], i) => (
                <div 
                  key={i} 
                  className="flex items-center justify-between gap-2 p-2.5 rounded-lg border border-[#E3E1DA] bg-[#FAF9F6]"
                >
                  <span className="font-mono text-xs font-bold" style={{ color: STAGE_COL[i] }}>
                    Étage {i + 1}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="8"
                      max="80"
                      value={z1}
                      onChange={(e) => handleToothChange(i, 0, Number(e.target.value))}
                      className="w-14 h-7 text-center font-mono font-bold text-xs rounded border border-[#D6D3CA] bg-white outline-none focus:border-blue-600"
                    />
                    <span className="text-[#8A929C]">/</span>
                    <input
                      type="number"
                      min="8"
                      max="120"
                      value={z2}
                      onChange={(e) => handleToothChange(i, 1, Number(e.target.value))}
                      className="w-14 h-7 text-center font-mono font-bold text-xs rounded border border-[#D6D3CA] bg-white outline-none focus:border-blue-600"
                    />
                  </div>
                  <span className="font-mono text-xs font-bold text-[#0F1B2D]">
                    i = {(z2 / z1).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Eccentricity and Noise Sliders */}
            <div className="space-y-3 pt-2 border-t border-[#EEECE6]">
              <div>
                <div className="flex items-center justify-between text-xs font-medium text-[#3A4552] mb-1">
                  <span>Excentricité / Usure (Bandes ±1x) :</span>
                  <span className="font-mono font-bold text-red-600">{Math.round(params.ecc * 100)} %</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round(params.ecc * 100)}
                  onChange={(e) => setParams({ ...params, ecc: Number(e.target.value) / 100 })}
                  className="w-full accent-red-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-medium text-[#3A4552] mb-1">
                  <span>Bruit d'interférence non-synchrone :</span>
                  <span className="font-mono font-bold text-slate-500">{Math.round(params.noise * 100)} %</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round(params.noise * 100)}
                  onChange={(e) => setParams({ ...params, noise: Number(e.target.value) / 100 })}
                  className="w-full accent-slate-600 cursor-pointer"
                />
                <p className="text-[10.5px] text-[#8A929C] mt-0.5">
                  Simule une machine voisine. La TSA permettra de l'atténuer entièrement.
                </p>
              </div>
            </div>
          </div>

          {/* Card B: Tooth Defect Simulation */}
          <div className="p-5 rounded-2xl border border-amber-200 bg-amber-50/40 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-amber-200/80 pb-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#0F1B2D]">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Simulation de Défaut de Denture</span>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                params.def === 'broken' ? 'bg-red-100 text-red-700' : (params.def === 'crack' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600')
              }`}>
                {params.def === 'broken' ? 'Dent Cassée' : (params.def === 'crack' ? 'Fissure' : 'Sain')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11.5px] font-medium text-[#3A4552] block mb-1">Type de défaut :</label>
                <select
                  value={params.def}
                  onChange={(e) => setParams({ ...params, def: e.target.value as any })}
                  className="w-full h-8.5 px-2.5 rounded-lg border border-[#D6D3CA] bg-white text-xs font-semibold text-[#0F1B2D] outline-none"
                >
                  <option value="none">Aucun (Sain)</option>
                  <option value="crack">Fissure en pied</option>
                  <option value="broken">Dent cassée</option>
                </select>
              </div>

              <div>
                <label className="text-[11.5px] font-medium text-[#3A4552] block mb-1">Étage défectueux :</label>
                <select
                  value={params.dStage}
                  onChange={(e) => {
                    const stg = Number(e.target.value);
                    const maxT = params.st[stg][params.dW];
                    setParams({ 
                      ...params, 
                      dStage: stg, 
                      dTooth: Math.min(params.dTooth, maxT) 
                    });
                  }}
                  className="w-full h-8.5 px-2.5 rounded-lg border border-[#D6D3CA] bg-white text-xs font-semibold text-[#0F1B2D] outline-none"
                >
                  {params.st.map((_, i) => (
                    <option key={i} value={i}>Étage {i + 1}</option>
                  ))}
                </select>
              </div>
            </div>

            {params.def !== 'none' && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[11.5px] font-medium text-[#3A4552] block mb-1">Roue dentée :</label>
                  <div className="flex p-0.5 bg-white border border-[#D6D3CA] rounded-lg gap-1">
                    <button
                      onClick={() => {
                        const maxT = params.st[params.dStage][0];
                        setParams({ ...params, dW: 0, dTooth: Math.min(params.dTooth, maxT) });
                      }}
                      className={`flex-1 py-1 rounded text-xs font-semibold transition-all ${
                        params.dW === 0 ? 'bg-[#0F1B2D] text-white' : 'text-[#5B6675] hover:text-[#0F1B2D]'
                      }`}
                    >
                      Pignon
                    </button>
                    <button
                      onClick={() => {
                        const maxT = params.st[params.dStage][1];
                        setParams({ ...params, dW: 1, dTooth: Math.min(params.dTooth, maxT) });
                      }}
                      className={`flex-1 py-1 rounded text-xs font-semibold transition-all ${
                        params.dW === 1 ? 'bg-[#0F1B2D] text-white' : 'text-[#5B6675] hover:text-[#0F1B2D]'
                      }`}
                    >
                      Roue
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[11.5px] font-medium text-[#3A4552] block mb-1">
                    Dent n° (sur {params.st[params.dStage][params.dW]}) :
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={params.st[params.dStage][params.dW]}
                    value={params.dTooth}
                    onChange={(e) => setParams({ 
                      ...params, 
                      dTooth: Math.max(1, Math.min(params.st[params.dStage][params.dW], Number(e.target.value) || 1)) 
                    })}
                    className="w-full h-8.5 px-3 rounded-lg border border-[#D6D3CA] bg-white text-xs font-mono font-bold text-[#0F1B2D] outline-none"
                  />
                </div>
              </div>
            )}

            {/* Impact period calculation */}
            {params.def !== 'none' && (
              <div className="p-3 rounded-xl bg-white border border-amber-200 text-xs space-y-1">
                <div className="font-semibold text-amber-900 flex items-center justify-between">
                  <span>Fréquence d'impact de la dent :</span>
                  <span className="font-mono text-red-600 font-bold">
                    {fmtHz(kinematics.f[defShaft])}
                  </span>
                </div>
                <div className="text-[11px] text-[#5B6675]">
                  Un choc se produit toutes les <strong className="text-[#0F1B2D] font-mono">{(1000 / kinematics.f[defShaft]).toFixed(1)} ms</strong> sur l'arbre A{defShaft + 1}.
                </div>
              </div>
            )}
          </div>

          {/* Card C: Kinematic Table */}
          <div className="p-5 rounded-2xl border border-[#E3E1DA] bg-white shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-[#EEECE6] pb-2.5">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#0F1B2D]">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>Fréquences Cinématiques Calculées</span>
              </div>
            </div>

            <div className="space-y-1.5 font-mono text-xs">
              {kinematics.f.map((f, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-[#FAF9F6] border border-[#EEECE6]">
                  <span className="text-blue-700 font-semibold">{shaftName(idx)}</span>
                  <span className="font-bold text-[#0F1B2D]">
                    {Math.round(f * 60)} RPM • {fmtHz(f)}
                  </span>
                </div>
              ))}

              {kinematics.S.map((s, idx) => (
                <div key={`gmf-${idx}`} className="flex items-center justify-between p-2 rounded-lg border border-[#EEECE6]" style={{ backgroundColor: `${STAGE_COL[idx]}0D` }}>
                  <span className="font-bold" style={{ color: STAGE_COL[idx] }}>
                    GMF Étage {idx + 1} ({s.z1}/{s.z2})
                  </span>
                  <span className="font-bold text-[#0F1B2D]">
                    {s.gmf.toFixed(1)} Hz • {Math.round(s.gmf * 60)} CPM
                  </span>
                </div>
              ))}

              {kinematics.S.map((s, idx) => (
                <div key={`htf-${idx}`} className="flex items-center justify-between p-2 rounded-lg bg-[#FAF9F6] border border-[#EEECE6]">
                  <span className="text-[#D97706] font-semibold">
                    HTF / GAPF Étage {idx + 1}
                  </span>
                  <span className="font-bold text-[#0F1B2D]">
                    HTF: {fmtHz(s.htf)} • GAPF: {s.gapf.toFixed(1)} Hz
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: 3D STAGE & PLOTS (7 COLS) */}
        <div className="lg:col-span-7 space-y-6">

          {/* 3D Viewport Controls Bar & Component */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#E3E1DA]">
              {/* Housing Mode */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-[#5B6675] font-medium mr-1 flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  <span>Carter :</span>
                </span>
                {(['trans', 'closed', 'hidden'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setHousingMode(m)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-all cursor-pointer ${
                      housingMode === m
                        ? 'bg-[#0F1B2D] text-white border-[#0F1B2D]'
                        : 'bg-[#FAF9F6] text-[#475569] border-[#E3E1DA] hover:bg-[#F3F2EE]'
                    }`}
                  >
                    {m === 'trans' ? 'Transparent' : (m === 'closed' ? 'Fermé' : 'Masqué')}
                  </button>
                ))}
              </div>

              {/* Speed Multiplier */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-[#5B6675] font-medium mr-1 flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Vitesse :</span>
                </span>
                {[0.25, 0.5, 1, 2].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSpeedMultiplier(s)}
                    className={`px-2 py-0.5 rounded text-[10.5px] font-mono font-semibold border transition-all cursor-pointer ${
                      speedMultiplier === s
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-[#FAF9F6] text-[#475569] border-[#E3E1DA] hover:bg-[#F3F2EE]'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>

            {/* 3D Model Viewport */}
            <ThreeReducerStage
              params={params}
              kinematics={kinematics}
              housingMode={housingMode}
              speedMultiplier={speedMultiplier}
              refShaft={refShaft}
              theme={theme}
            />
          </div>

          {/* Real-time Oscilloscope with Shock Period */}
          <div className="p-5 rounded-2xl border border-[#E3E1DA] bg-white shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-[#EEECE6] pb-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#0F1B2D]">
                <Activity className="w-4 h-4 text-blue-600" />
                <span>Oscilloscope Temporel Synchronisé</span>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold">
                Fenêtre glissante 2,5 tours (A{defShaft + 1})
              </span>
            </div>

            <canvas
              ref={scopeCanvasRef}
              className="w-full h-[140px] rounded-xl border border-[#EEECE6] bg-[#070D18]"
            />
          </div>

          {/* Interactive FFT Spectrum */}
          <div className="p-5 rounded-2xl border border-[#E3E1DA] bg-white shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EEECE6] pb-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#0F1B2D]">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <span>Spectre FFT Haute Résolution</span>
                {refShaft != null && (
                  <span className="text-[11px] font-mono text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded">
                    TSA A{refShaft + 1}
                  </span>
                )}
              </div>

              {/* Scale and Zoom Controls */}
              <div className="flex items-center gap-2">
                <div className="flex p-0.5 bg-[#FAF9F6] border border-[#E3E1DA] rounded-lg">
                  <button
                    onClick={() => setIsDbScale(false)}
                    className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                      !isDbScale ? 'bg-white shadow-2xs text-[#0F1B2D]' : 'text-[#64748B]'
                    }`}
                  >
                    Linéaire (g)
                  </button>
                  <button
                    onClick={() => setIsDbScale(true)}
                    className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                      isDbScale ? 'bg-white shadow-2xs text-[#0F1B2D]' : 'text-[#64748B]'
                    }`}
                  >
                    Log (dB)
                  </button>
                </div>

                {zoomRange && (
                  <button
                    onClick={() => setZoomRange(null)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#E3E1DA] bg-[#FAF9F6] text-xs font-medium text-[#475569] hover:bg-[#F3F2EE] cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Dézoomer</span>
                  </button>
                )}
              </div>
            </div>

            {/* Quick Center Zoom Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#5B6675]">
              <span className="text-[11px] font-medium mr-1 flex items-center gap-1">
                <ZoomIn className="w-3 h-3 text-blue-600" />
                <span>Centrer :</span>
              </span>
              {kinematics.S.map((s, idx) => (
                <button
                  key={`zoom-gmf-${idx}`}
                  onClick={() => setZoomRange([Math.max(0, s.gmf - 12 * kinematics.f[idx]), s.gmf + 12 * kinematics.f[idx]])}
                  className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold border border-[#E3E1DA] bg-[#FAF9F6] hover:bg-[#F3F2EE] cursor-pointer"
                  style={{ color: STAGE_COL[idx] }}
                >
                  GMF{idx + 1} ({s.gmf.toFixed(1)}Hz)
                </button>
              ))}
              <button
                onClick={() => setZoomRange([0, kinematics.f[0] * 7])}
                className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold border border-[#E3E1DA] bg-[#FAF9F6] text-blue-600 hover:bg-[#F3F2EE] cursor-pointer"
              >
                1x Arbres
              </button>
              {params.def !== 'none' && (
                <button
                  onClick={() => {
                    const G = kinematics.S[params.dStage].gmf;
                    const g = gearOf(kinematics, params.dStage, params.dW);
                    setZoomRange([Math.max(0, G - 14 * g.f), G + 14 * g.f]);
                  }}
                  className="px-2 py-0.5 rounded text-[11px] font-mono font-bold border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer"
                >
                  Bandes de choc
                </button>
              )}
            </div>

            {/* Spectrum Canvas */}
            <canvas
              ref={specCanvasRef}
              onMouseDown={handleSpecMouseDown}
              onMouseMove={handleSpecMouseMove}
              onMouseUp={handleSpecMouseUp}
              onMouseLeave={() => setHoverPeak(null)}
              onDoubleClick={() => setZoomRange(null)}
              className="w-full h-[240px] rounded-xl border border-[#EEECE6] bg-[#070D18] cursor-crosshair select-none"
            />

            {/* Spectrum Legend */}
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#475569] pt-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-1 rounded-full bg-blue-600" />
                <span>1x Arbres</span>
              </span>
              {kinematics.S.map((_, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-1 rounded-full" style={{ backgroundColor: STAGE_COL[i] }} />
                  <span>GMF Étage {i + 1}</span>
                </span>
              ))}
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-1 rounded-full bg-red-500" />
                <span>Bandes ±1x</span>
              </span>
              {params.def !== 'none' && (
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-1 rounded-full bg-orange-500" />
                  <span>Bandes de choc</span>
                </span>
              )}
            </div>
          </div>

          {/* Time Synchronous Averaging (TSA) Panel */}
          <div className="p-5 rounded-2xl border border-blue-200 bg-blue-50/30 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-blue-200/80 pb-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#0F1B2D]">
                <Waves className="w-4 h-4 text-blue-600" />
                <span>Moyennage Synchrone (TSA) & Signal Résiduel</span>
              </div>
              <span className="text-[11px] font-mono text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full font-bold">
                Gain bruit : {(-10 * Math.log10(numAvg)).toFixed(1)} dB
              </span>
            </div>

            {/* Reference Shaft Buttons */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-medium text-[#3A4552]">Arbre de référence tachymétrique :</span>
              <button
                onClick={() => setRefShaft(null)}
                className={`px-3 py-1 rounded-lg font-semibold border transition-all cursor-pointer ${
                  refShaft == null ? 'bg-[#0F1B2D] text-white border-[#0F1B2D]' : 'bg-white text-[#475569] border-[#E3E1DA]'
                }`}
              >
                Brut (Tous arbres)
              </button>
              {Array.from({ length: nStages + 1 }).map((_, s) => (
                <button
                  key={s}
                  onClick={() => setRefShaft(s)}
                  className={`px-3 py-1 rounded-lg font-semibold border transition-all cursor-pointer ${
                    refShaft === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-[#475569] border-[#E3E1DA]'
                  }`}
                >
                  TSA {shaftName(s)}
                </button>
              ))}
            </div>

            {/* Number of Averages Slider */}
            <div>
              <div className="flex items-center justify-between text-xs font-medium text-[#3A4552] mb-1.5">
                <span>Nombre de tours moyennés (N) :</span>
                <span className="font-mono font-bold text-blue-700">N = {numAvg} tours ({(numAvg / (kinematics.f[activeRef] || 1)).toFixed(2)} s)</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="8"
                  value={NS.indexOf(numAvg)}
                  onChange={(e) => setNumAvg(NS[Number(e.target.value)])}
                  className="flex-1 accent-blue-600 cursor-pointer"
                />
                <span className="font-mono text-xs font-bold text-[#0F1B2D] w-12 text-right">
                  {numAvg}
                </span>
              </div>
            </div>

            {/* TSA 3-Lane Waveform Canvas */}
            <canvas
              ref={waveCanvasRef}
              className="w-full h-[220px] rounded-xl border border-[#D6D3CA] bg-white shadow-2xs"
            />

            {/* Statistical Health Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-white border border-[#E3E1DA]">
                <span className="text-[10px] uppercase font-bold text-[#8A929C] block">RMS Résiduel</span>
                <span className="text-base font-bold font-mono text-[#0F1B2D] mt-0.5 block">
                  {tsaData.sR.rms.toFixed(3)} <span className="text-xs font-normal text-[#5B6675]">g</span>
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white border border-[#E3E1DA]">
                <span className="text-[10px] uppercase font-bold text-[#8A929C] block">Valeur Crête (Peak)</span>
                <span className="text-base font-bold font-mono text-[#0F1B2D] mt-0.5 block">
                  {tsaData.sR.pk.toFixed(3)} <span className="text-xs font-normal text-[#5B6675]">g</span>
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white border border-[#E3E1DA]">
                <span className="text-[10px] uppercase font-bold text-[#8A929C] block">Facteur de Crête</span>
                <span className="text-base font-bold font-mono text-blue-600 mt-0.5 block">
                  {tsaData.sR.crest.toFixed(2)}
                </span>
              </div>

              <div className={`p-3 rounded-xl border ${
                tsaData.sR.kurt > 3.5 ? 'bg-red-50 border-red-300' : 'bg-white border-[#E3E1DA]'
              }`}>
                <span className="text-[10px] uppercase font-bold text-[#8A929C] block">Kurtosis Résiduel</span>
                <span className={`text-base font-bold font-mono mt-0.5 flex items-center gap-1 ${
                  tsaData.sR.kurt > 3.5 ? 'text-red-600 animate-pulse' : 'text-[#0F1B2D]'
                }`}>
                  <span>{tsaData.sR.kurt.toFixed(2)}</span>
                  {tsaData.sR.kurt > 3.5 && <span className="text-[10px] font-bold">⚠️ CHOC</span>}
                </span>
              </div>
            </div>

            {/* Diagnostic Interpretation Note */}
            <div className={`p-3 rounded-xl border text-xs leading-relaxed ${
              params.def === 'none' 
                ? 'bg-slate-50 border-slate-200 text-[#475569]'
                : (tsaData.u0 != null 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-amber-50 border-amber-200 text-amber-800')
            }`}>
              {params.def === 'none' && (
                <span><strong>État Sain :</strong> Aucun défaut de denture. Le signal résiduel ne contient que le bruit filtré (Kurtosis ≈ 3.0).</span>
              )}
              {params.def !== 'none' && tsaData.u0 != null && (
                <span><strong>Défaut Confirmé sur A{tsaData.s + 1} :</strong> Le choc de la dent n°{params.dTooth} est parfaitement synchrone de cet arbre. Il s'additionne lors de la TSA et fait exploser le Kurtosis ({tsaData.sR.kurt.toFixed(2)} &gt; 3.5).</span>
              )}
              {params.def !== 'none' && tsaData.u0 == null && (
                <span><strong>Avertissement TSA :</strong> Le défaut est situé sur l'arbre A{defShaft + 1}, qui n'est pas synchrone avec l'arbre A{tsaData.s + 1} sélectionné. Le choc s'efface dans la moyenne. Sélectionnez <strong>TSA A{defShaft + 1}</strong> pour révéler le défaut.</span>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
