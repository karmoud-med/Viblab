import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Activity, 
  HelpCircle, 
  Info, 
  Settings, 
  Zap, 
  Disc, 
  Sliders, 
  AlertTriangle, 
  Layers, 
  Sparkles, 
  BarChart3, 
  TrendingUp, 
  Cpu, 
  Waves, 
  ZoomIn, 
  RotateCcw,
  CheckCircle2,
  Maximize2
} from 'lucide-react';
import { 
  PRESETS, 
  FS, 
  NFFT, 
  FRES, 
  TD, 
  freqs, 
  impactInfo, 
  impactAmp, 
  clean, 
  envAt, 
  noiseSigma, 
  record, 
  ampSpec, 
  envelope, 
  rms, 
  kurt, 
  BearingSimParams, 
  BearingKinematics, 
  BearingDefectType, 
  DEFS 
} from '../utils/bearingModel';
import ThreeBearingStage, { HousingDisplayMode } from './ThreeBearingStage';

interface BearingModuleProps {
  theme?: 'dark' | 'light' | 'mono';
}

const COL = {
  f: '#059669',
  outer: '#ea580c',
  inner: '#dc2626',
  ball: '#9333ea',
  cage: '#2563eb',
};

const fmtHz = (f: number) => (f < 10 ? f.toFixed(2) : f.toFixed(1)) + ' Hz';

export default function BearingModule({ theme = 'dark' }: BearingModuleProps) {
  // 1. Simulation Parameters
  const [params, setParams] = useState<BearingSimParams>({
    rpm: 1500,
    name: 'SKF 6205',
    n: PRESETS['6205'].n,
    d: PRESETS['6205'].d,
    D: PRESETS['6205'].D,
    a: PRESETS['6205'].a,
    def: 'outer',
    sev: 0.6,
    noise: 0.25,
    slip: 1.5,
  });

  // 2. 3D Viewport Controls
  const [housingMode, setHousingMode] = useState<HousingDisplayMode>('cut');
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0);
  const [isExploded, setIsExploded] = useState<boolean>(false);
  const [showGrease, setShowGrease] = useState<boolean>(true);
  const [highlightDefect, setHighlightDefect] = useState<boolean>(true);
  const [showLabels, setShowLabels] = useState<boolean>(true);

  // 3. Spectral Analysis Controls
  const [mode, setMode] = useState<'raw' | 'wide' | 'env'>('env');
  const [scale, setScale] = useState<'lin' | 'db'>('lin');
  const [fc, setFc] = useState<number>(3000);
  const [bw, setBw] = useState<number>(1200);
  const [zoomRange, setZoomRange] = useState<[number, number] | null>(null);

  // Spectrum Canvas References & Interactive Selection
  const specCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const scopeCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [hoveredPeak, setHoveredPeak] = useState<{
    freq: number;
    amp: number;
    ratio: number;
    label?: string;
  } | null>(null);

  const isLight = theme === 'light';
  const isBW = theme === 'mono';

  // 4. Kinematics & Frequency Calculations
  const kinematics = useMemo<BearingKinematics>(() => {
    return freqs(params);
  }, [params]);

  // Nominal and effective defect rate
  const fdNom = useMemo(() => {
    return {
      outer: kinematics.bpfo,
      inner: kinematics.bpfi,
      ball: 2 * kinematics.bsf,
      cage: kinematics.ftf,
      none: kinematics.f,
    }[params.def];
  }, [kinematics, params.def]);

  const fdOf = useMemo(() => {
    return {
      outer: kinematics.bpfoE,
      inner: kinematics.bpfiE,
      ball: 2 * kinematics.bsfE,
      cage: kinematics.ftfE,
      none: kinematics.f,
    }[params.def];
  }, [kinematics, params.def]);

  // 5. Signal Generation & Demodulation
  const rawData = useMemo(() => {
    const x = record(params, kinematics);
    return {
      x,
      raw: ampSpec(x),
      rms: rms(x),
      kurt: kurt(x),
    };
  }, [params, kinematics]);

  const envData = useMemo(() => {
    const res = envelope(rawData.x, fc, bw);
    return res.spec;
  }, [rawData.x, fc, bw]);

  // Scale factor for oscilloscope
  const scSc = useMemo(() => {
    return (params.def === 'none' || params.def === 'cage' ? 0.5 : 3 * params.sev + 0.3) + 3 * noiseSigma(params);
  }, [params]);

  // Full spectral window
  const fullRange = useCallback((): [number, number] => {
    if (mode === 'wide') return [0, 8000];
    const topF = Math.max(kinematics.bpfi, 2 * kinematics.bsf) * 4.2;
    return [0, Math.max(250, Math.ceil(topF / 50) * 50)];
  }, [mode, kinematics]);

  // Markers for defect harmonics and sidebands
  const markers = useMemo(() => {
    const k = kinematics;
    const p = params;
    const M: Array<{ f: number; l: string; c: string; sb?: boolean }> = [{ f: k.f, l: '1x', c: COL.f }];

    if (mode === 'wide') {
      return [{ f: FRES, l: 'Résonance palier (3 kHz)', c: '#3b82f6' }];
    }

    const addHarmonics = (f: number, l: string, c: string, n = 5, sb = 0) => {
      for (let i = 1; i <= n; i++) {
        M.push({ f: i * f, l: i > 1 ? `${i}×${l}` : l, c });
        if (sb) {
          for (const s of [-1, 1]) {
            M.push({ f: i * f + s * sb, l: '', c, sb: true });
          }
        }
      }
    };

    if (p.def === 'outer') addHarmonics(k.bpfo, 'BPFO', COL.outer);
    if (p.def === 'inner') addHarmonics(k.bpfi, 'BPFI', COL.inner, 4, k.f);
    if (p.def === 'ball') {
      addHarmonics(2 * k.bsf, '2×BSF', COL.ball, 4, k.ftf);
      M.push({ f: k.bsf, l: 'BSF', c: COL.ball });
    }
    if (p.def === 'cage') addHarmonics(k.ftf, 'FTF', COL.cage, 4);

    return M;
  }, [kinematics, params, mode]);

  // 6. Draw Spectrum Canvas
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

    const [f0, f1] = zoomRange || fullRange();
    const A = mode === 'env' ? envData : rawData.raw;
    const df = FS / NFFT;

    const L = 56;
    const R = W - 16;
    const T = 32;
    const B = H - 28;

    const fx = (f: number) => L + ((f - f0) / (f1 - f0)) * (R - L);

    // Peak amplitude calculation
    let top = 0;
    const iStart = Math.max(1, Math.floor(f0 / df));
    const iEnd = Math.min(A.length - 1, Math.ceil(f1 / df));
    for (let i = iStart; i <= iEnd; i++) {
      if (A[i] > top) top = A[i];
    }
    top = top * 1.25 || 1;

    const isDb = scale === 'db';
    const fy = (a: number) => {
      if (isDb) {
        const val = Math.min(Math.max((20 * Math.log10(Math.max(a, 1e-9) / top) + 70) / 70, 0), 1);
        return B - val * (B - T);
      }
      return B - (a / top) * (B - T);
    };

    // Draw Grid Lines & Frequency Axis
    ctx.font = '10px ui-monospace,Menlo,monospace';
    ctx.lineWidth = 1;
    ctx.strokeStyle = isLight ? '#e2e8f0' : '#1e293b';
    ctx.fillStyle = isLight ? '#64748b' : '#94a3b8';

    for (let i = 0; i <= 10; i++) {
      const X = L + (i * (R - L)) / 10;
      const f = f0 + (i * (f1 - f0)) / 10;
      ctx.beginPath();
      ctx.moveTo(X, T);
      ctx.lineTo(X, B);
      ctx.stroke();
      ctx.textAlign = 'center';
      ctx.fillText(Math.round(f) + ' Hz', X, B + 16);
    }

    // Y Axis labels
    for (let i = 0; i <= 4; i++) {
      const Y = T + (i * (B - T)) / 4;
      ctx.beginPath();
      ctx.moveTo(L, Y);
      ctx.lineTo(R, Y);
      ctx.stroke();
      ctx.textAlign = 'right';
      ctx.fillText(isDb ? `${(-17.5 * i).toFixed(0)} dB` : `${(top * (1 - i / 4)).toFixed(3)} g`, L - 8, Y + 3);
    }

    // Clip to plot area
    ctx.save();
    ctx.beginPath();
    ctx.rect(L, T, R - L, B - T);
    ctx.clip();

    // Wideband Bandpass Filter Highlight
    if (mode === 'wide') {
      const loF = fx(fc - bw / 2);
      const hiF = fx(fc + bw / 2);
      ctx.fillStyle = isLight ? 'rgba(37,99,235,0.12)' : 'rgba(59,130,246,0.18)';
      ctx.fillRect(loF, T, hiF - loF, B - T);
      ctx.fillStyle = '#3b82f6';
      ctx.textAlign = 'center';
      ctx.fillText('Filtre enveloppe démodulée', fx(fc), T + 14);
    }

    // Theoretical Fault Markers
    const placed: Array<[number, number, number]> = [];
    for (const mk of markers) {
      if (mk.f < f0 || mk.f > f1) continue;
      const X = fx(mk.f);
      ctx.strokeStyle = mk.c;
      ctx.globalAlpha = mk.sb ? 0.35 : 0.65;
      ctx.setLineDash(mk.sb ? [2, 3] : [4, 3]);
      ctx.beginPath();
      ctx.moveTo(X, mk.sb ? T + 20 : T);
      ctx.lineTo(X, B);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;

      if (mk.l) {
        ctx.font = 'bold 10px ui-monospace,Menlo,monospace';
        const tw = ctx.measureText(mk.l).width / 2 + 3;
        let ly = T + 14;
        while (placed.some((q) => Math.abs(q[0] - X) < q[1] + tw && q[2] === ly)) {
          ly += 12;
        }
        placed.push([X, tw, ly]);
        ctx.fillStyle = mk.c;
        ctx.textAlign = 'center';
        ctx.fillText(mk.l, X, ly);
      }
    }

    // Spectrum Curve (Peak envelope per column)
    const curveColor = mode === 'env' ? '#f97316' : isLight ? '#0f172a' : '#38bdf8';
    ctx.strokeStyle = curveColor;
    ctx.lineWidth = 1.4;
    ctx.beginPath();

    const cols = Math.floor(R - L);
    for (let c = 0; c <= cols; c++) {
      const fa = f0 + (c / cols) * (f1 - f0);
      const fb = f0 + ((c + 1) / cols) * (f1 - f0);
      let a = 0;
      const idxA = Math.max(1, Math.floor(fa / df));
      const idxB = Math.max(idxA, Math.ceil(fb / df) - 1);
      for (let i = idxA; i <= idxB; i++) {
        if ((A[i] || 0) > a) a = A[i] || 0;
      }
      const py = fy(a);
      if (c === 0) ctx.moveTo(L + c, py);
      else ctx.lineTo(L + c, py);
    }
    ctx.stroke();
    ctx.restore();

    // Hover Cursor & Tooltip
    if (hoveredPeak) {
      const X = fx(hoveredPeak.freq);
      if (X >= L && X <= R) {
        ctx.strokeStyle = isLight ? '#475569' : '#94a3b8';
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(X, T);
        ctx.lineTo(X, B);
        ctx.stroke();
        ctx.setLineDash([]);

        let tag = `${hoveredPeak.freq.toFixed(1)} Hz · ${hoveredPeak.amp.toFixed(4)} g · ${hoveredPeak.ratio.toFixed(2)}x RPM`;
        if (hoveredPeak.label) tag += ` · ${hoveredPeak.label}`;

        ctx.font = '11px ui-monospace,Menlo,monospace';
        const tw = ctx.measureText(tag).width + 16;
        const bx = Math.min(Math.max(X - tw / 2, L), R - tw);
        ctx.fillStyle = isLight ? '#0f172a' : '#1e293b';
        ctx.fillRect(bx, B - 26, tw, 20);
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.fillText(tag, bx + 8, B - 12);
      }
    }
  }, [zoomRange, fullRange, mode, scale, envData, rawData.raw, fc, bw, markers, hoveredPeak, isLight]);

  // Redraw Spectrum on data/filter/theme change
  useEffect(() => {
    drawSpectrum();
  }, [drawSpectrum]);

  // Drag-to-zoom logic for spectrum canvas
  const dragRef = useRef<{ x0: number; x1: number | null } | null>(null);

  const handleSpecMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = specCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    dragRef.current = { x0: x, x1: null };
  };

  const handleSpecMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = specCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;

    const W = canvas.clientWidth;
    const L = 56;
    const R = W - 16;
    const [f0, f1] = zoomRange || fullRange();
    const A = mode === 'env' ? envData : rawData.raw;
    const df = FS / NFFT;

    if (dragRef.current) {
      dragRef.current.x1 = x;
      setHoveredPeak(null);
      drawSpectrum();
      return;
    }

    if (x < L || x > R) {
      setHoveredPeak(null);
      return;
    }

    const curF = f0 + ((x - L) / (R - L)) * (f1 - f0);
    const bi = Math.round(curF / df);
    let best = bi;
    for (let i = bi - 3; i <= bi + 3; i++) {
      if ((A[i] || 0) > (A[best] || 0)) best = i;
    }
    const peakF = best * df;
    const peakAmp = A[best] || 0;
    const ratio = peakF / kinematics.f;

    // Find nearest marker
    const nearest = markers
      .filter((m) => m.l)
      .sort((a, b) => Math.abs(a.f - peakF) - Math.abs(b.f - peakF))[0];
    const matchLabel = nearest && Math.abs(nearest.f - peakF) < 2.5 ? `≈ ${nearest.l}` : undefined;

    setHoveredPeak({
      freq: peakF,
      amp: peakAmp,
      ratio,
      label: matchLabel,
    });
  };

  const handleSpecMouseUp = () => {
    const drag = dragRef.current;
    dragRef.current = null;
    const canvas = specCanvasRef.current;
    if (!drag || drag.x1 == null || !canvas) return;

    const W = canvas.clientWidth;
    const L = 56;
    const R = W - 16;
    const [f0, f1] = zoomRange || fullRange();

    if (Math.abs(drag.x1 - drag.x0) > 8) {
      const xa = Math.min(drag.x0, drag.x1);
      const xb = Math.max(drag.x0, drag.x1);
      const na = Math.max(0, f0 + ((Math.max(xa, L) - L) / (R - L)) * (f1 - f0));
      const nb = f0 + ((Math.min(xb, R) - L) / (R - L)) * (f1 - f0);
      if (nb - na > 10) {
        setZoomRange([na, nb]);
      }
    }
  };

  const handleSpecDoubleClick = () => {
    setZoomRange(null);
  };

  // 7. Synchronized Oscilloscope Canvas
  useEffect(() => {
    const canvas = scopeCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let U = 0;
    let last = performance.now();

    const renderScope = (now: number) => {
      animId = requestAnimationFrame(renderScope);

      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      const rate = {
        outer: kinematics.bpfoE,
        inner: kinematics.bpfiE,
        ball: 2 * kinematics.bsfE,
        cage: kinematics.ftfE,
        none: kinematics.f,
      }[params.def];

      const spdNorm = rate ? Math.min(Math.max((1.3 * kinematics.f) / rate, 0.04), 1.5) : 0.5;
      U += dt * speedMultiplier * spdNorm;

      const dpr = window.devicePixelRatio || 1;
      const W = canvas.clientWidth;
      const H = canvas.clientHeight;
      if (canvas.width !== Math.floor(W * dpr) || canvas.height !== Math.floor(H * dpr)) {
        canvas.width = Math.floor(W * dpr);
        canvas.height = Math.floor(H * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      // Window duration
      const [Tw, nm] = {
        outer: [6 / kinematics.bpfo, 'BPFO'],
        inner: [2.2 / kinematics.f, 'BPFI'],
        ball: [1.2 / kinematics.ftf, '2×BSF'],
        cage: [2.5 / kinematics.ftf, 'FTF'],
        none: [3 / kinematics.f, '1x'],
      }[params.def] as [number, string];

      const tNow = U / kinematics.f;
      const t0 = tNow - Tw;

      const L = 50;
      const R = W - 70;
      const T = 30;
      const B = H - 24;
      const mid = (T + B) / 2 + 6;
      const half = (B - T) / 2 - 8;
      const sc = scSc;
      const sg = noiseSigma(params);

      const tx = (t: number) => L + ((t - t0) / Tw) * (R - L);

      // Grid
      ctx.font = '10px ui-monospace,Menlo,monospace';
      ctx.strokeStyle = isLight ? '#e2e8f0' : '#1e293b';
      ctx.fillStyle = isLight ? '#64748b' : '#94a3b8';
      ctx.lineWidth = 1;

      for (let i = 0; i <= 5; i++) {
        const X = L + (i * (R - L)) / 5;
        ctx.beginPath();
        ctx.moveTo(X, T);
        ctx.lineTo(X, B);
        ctx.stroke();
        ctx.textAlign = 'center';
        ctx.fillText(`${(-(Tw * (5 - i)) / 5 * 1000).toFixed(0)} ms`, X, B + 16);
      }

      ctx.beginPath();
      ctx.moveTo(L, mid);
      ctx.lineTo(R, mid);
      ctx.stroke();
      ctx.textAlign = 'right';
      ctx.fillText('g', L - 8, T + 4);

      // Shaft or Cage Revolution vertical lines
      if (params.def === 'inner' || params.def === 'ball') {
        const fr = params.def === 'inner' ? kinematics.f : kinematics.ftf;
        const lab = params.def === 'inner' ? '1 tour arbre' : '1 tour cage';
        ctx.strokeStyle = isLight ? '#94a3b8' : '#475569';
        ctx.fillStyle = isLight ? '#64748b' : '#94a3b8';
        ctx.textAlign = 'center';
        for (let j = Math.ceil(t0 * fr); j <= tNow * fr; j++) {
          const X = tx(j / fr);
          ctx.setLineDash([2, 4]);
          ctx.beginPath();
          ctx.moveTo(X, T);
          ctx.lineTo(X, B);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillText(lab, X, B - 4);
        }
      }

      // Raw Acceleration Waveform
      const cols = Math.max(1, Math.floor(R - L));
      const sub = 5;
      ctx.strokeStyle = isLight ? '#0f172a' : '#f8fafc';
      ctx.beginPath();

      for (let c = 0; c < cols; c++) {
        let lo = 1e9;
        let hi = -1e9;
        for (let j = 0; j < sub; j++) {
          const v = clean(params, kinematics, t0 + ((c + j / sub) / cols) * Tw) + sg * (Math.random() * 2 - 1) * 1.3;
          if (v < lo) lo = v;
          if (v > hi) hi = v;
        }
        ctx.moveTo(L + c + 0.5, mid - (hi / sc) * half);
        ctx.lineTo(L + c + 0.5, mid - (lo / sc) * half + 0.5);
      }
      ctx.stroke();

      // Envelope Waveform (Orange)
      const ii = impactInfo(params, kinematics);
      if (ii && params.sev) {
        ctx.strokeStyle = '#ea580c';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let c = 0; c <= cols; c++) {
          const e = envAt(params, kinematics, t0 + (c / cols) * Tw);
          const Y = mid - (e / sc) * half;
          if (c === 0) ctx.moveTo(L + c, Y);
          else ctx.lineTo(L + c, Y);
        }
        ctx.stroke();
        ctx.lineWidth = 1;

        // Red Impact Triangle Markers
        const imp: Array<[number, number]> = [];
        const jStart = Math.ceil(t0 * ii.fd - ii.u0);
        const jEnd = Math.floor(tNow * ii.fd - ii.u0);
        for (let j = jStart; j <= jEnd; j++) {
          const ti = (j + ii.u0) / ii.fd;
          imp.push([ti, impactAmp(params, kinematics, ti, j)]);
        }

        imp.forEach(([ti, a]) => {
          const X = tx(ti);
          const s = 3 + 4 * a;
          ctx.fillStyle = '#dc2626';
          ctx.globalAlpha = 0.35 + 0.65 * a;
          ctx.beginPath();
          ctx.moveTo(X - s, T - 4);
          ctx.lineTo(X + s, T - 4);
          ctx.lineTo(X, T + 4);
          ctx.fill();
          ctx.globalAlpha = 1;
        });

        // Time period delta between consecutive impacts
        if (imp.length > 1) {
          const a = tx(imp[imp.length - 2][0]);
          const b = tx(imp[imp.length - 1][0]);
          ctx.strokeStyle = '#dc2626';
          ctx.beginPath();
          ctx.moveTo(a, T - 10);
          ctx.lineTo(b, T - 10);
          ctx.stroke();
          ctx.fillStyle = '#dc2626';
          ctx.font = 'bold 10px ui-monospace,Menlo,monospace';
          ctx.textAlign = b > R - 120 ? 'right' : 'center';
          ctx.fillText(`T = 1/${nm} = ${(1000 / ii.fd).toFixed(1)} ms`, b > R - 120 ? b : (a + b) / 2, T - 14);
        }
      }

      // "Maintenant" current time cursor line
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(R, T - 4);
      ctx.lineTo(R, B);
      ctx.stroke();
      ctx.lineWidth = 1;
      ctx.fillStyle = '#3b82f6';
      ctx.textAlign = 'left';
      ctx.font = 'bold 10px system-ui';
      ctx.fillText('maintenant', R + 6, mid + 3);
    };

    animId = requestAnimationFrame(renderScope);
    return () => cancelAnimationFrame(animId);
  }, [params, kinematics, scSc, speedMultiplier, isLight]);

  // Statistical diagnostic metrics
  const statsMetrics = useMemo(() => {
    const A = envData;
    const fd = fdOf;
    const i0 = Math.round(fd);
    let pk = 0;
    for (let i = i0 - 2; i <= i0 + 2; i++) {
      if ((A[i] || 0) > pk) pk = A[i] || 0;
    }
    const fl = [...A.slice(5, 600)].sort((a, b) => a - b)[295] || 1e-9;
    const emDb = 20 * Math.log10(pk / fl);

    return {
      rms: rawData.rms,
      kurt: rawData.kurt,
      pk,
      emDb,
      fd,
    };
  }, [envData, fdOf, rawData.rms, rawData.kurt]);

  const applyPreset = (presetKey: string) => {
    const p = PRESETS[presetKey];
    if (p) {
      setParams((prev) => ({
        ...prev,
        name: p.name,
        n: p.n,
        d: p.d,
        D: p.D,
        a: p.a,
      }));
      setZoomRange(null);
    }
  };

  return (
    <div className="space-y-6 max-w-[1550px] mx-auto pb-12">
      {/* Module Header & Intro */}
      <div className={`p-6 rounded-2xl border backdrop-blur-md shadow-sm ${
        isLight ? 'bg-white/80 border-slate-200' : isBW ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-900/80 border-slate-800'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-orange-600/10 text-orange-500 border border-orange-500/20">
                <Disc className="w-6 h-6 animate-spin-slow" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">
                  Diagnostic Vibratoire des Roulements Industriels & Palier 3D
                </h1>
                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Cinématique réelle avec glissement des billes, zone de charge radiale, signaux de chocs transitoires et démodulation d'enveloppe de Hilbert.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Presets Buttons */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Modèle:</span>
            {Object.entries(PRESETS).map(([key, item]) => (
              <button
                key={key}
                onClick={() => applyPreset(key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                  params.name === item.name
                    ? 'bg-blue-600 text-white border-blue-500 shadow-sm font-semibold'
                    : isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                    : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid: Controls Left, 3D & Analysis Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Geometry & Defect Injector (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Virtual Defect Injector */}
          <div className={`p-5 rounded-2xl border shadow-sm space-y-4 ${
            isLight ? 'bg-white border-slate-200' : isBW ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-900 border-slate-800'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-400 font-mono">
                Injecteur de Défaut Virtuel
              </span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                params.def === 'none'
                  ? 'bg-emerald-500/10 text-emerald-500'
                  : 'bg-orange-500/10 text-orange-500'
              }`}>
                {DEFS[params.def]}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'none', label: 'Sain (1x)' },
                { id: 'outer', label: 'BPFO (Bague Ext)' },
                { id: 'inner', label: 'BPFI (Bague Int)' },
                { id: 'ball', label: 'BSF (Bille / Élément)' },
                { id: 'cage', label: 'FTF (Cage)' },
              ].map((d) => (
                <button
                  key={d.id}
                  onClick={() => setParams((prev) => ({ ...prev, def: d.id as BearingDefectType }))}
                  className={`p-2.5 rounded-xl text-xs font-medium border text-left transition-all ${
                    params.def === d.id
                      ? d.id === 'none'
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-md font-semibold'
                        : 'bg-orange-600 text-white border-orange-500 shadow-md font-semibold'
                      : isLight
                      ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 border-slate-700/80'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            {/* Sliders: Severity, Noise, Slip */}
            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-slate-400">Sévérité du défaut (écaillage)</span>
                  <span className="font-mono font-bold text-rose-500">{(params.sev * 100).toFixed(0)} %</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={params.sev * 100}
                  onChange={(e) => setParams((prev) => ({ ...prev, sev: +e.target.value / 100 }))}
                  className="w-full accent-rose-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-slate-400">Bruit de fond machine</span>
                  <span className="font-mono font-bold text-slate-400">{(params.noise * 100).toFixed(0)} %</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={params.noise * 100}
                  onChange={(e) => setParams((prev) => ({ ...prev, noise: +e.target.value / 100 }))}
                  className="w-full accent-slate-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-slate-400">Glissement des billes</span>
                  <span className="font-mono font-bold text-purple-500">{params.slip.toFixed(1)} %</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="3"
                  step="0.1"
                  value={params.slip}
                  onChange={(e) => setParams((prev) => ({ ...prev, slip: +e.target.value }))}
                  className="w-full accent-purple-500"
                />
                <p className="text-[10px] text-slate-400">
                  En service, la cage tourne 1 à 3 % plus lentement : les fréquences effectives réelles diffèrent légèrement des équations théoriques.
                </p>
              </div>
            </div>
          </div>

          {/* Bearing Internal Geometry */}
          <div className={`p-5 rounded-2xl border shadow-sm space-y-4 ${
            isLight ? 'bg-white border-slate-200' : isBW ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-900 border-slate-800'
          }`}>
            <span className="font-bold text-xs uppercase tracking-wider text-slate-400 font-mono">
              Géométrie Interne du Roulement
            </span>

            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-slate-400">Vitesse de rotation</span>
                  <span className="font-mono font-bold text-blue-500">{params.rpm} RPM ({(params.rpm / 60).toFixed(1)} Hz)</span>
                </div>
                <input
                  type="range"
                  min="300"
                  max="3600"
                  step="10"
                  value={params.rpm}
                  onChange={(e) => setParams((prev) => ({ ...prev, rpm: +e.target.value }))}
                  className="w-full accent-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-400">Nbre de billes (N)</label>
                  <input
                    type="number"
                    min="6"
                    max="20"
                    value={params.n}
                    onChange={(e) => setParams((prev) => ({ ...prev, n: Math.max(6, Math.min(20, Math.round(+e.target.value || 6))) }))}
                    className={`w-full px-3 py-2 rounded-xl border font-mono text-xs font-bold ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-400">Diam. billes (d - mm)</label>
                  <input
                    type="number"
                    min="3"
                    max="40"
                    step="0.01"
                    value={params.d}
                    onChange={(e) => setParams((prev) => ({ ...prev, d: +e.target.value || 3 }))}
                    className={`w-full px-3 py-2 rounded-xl border font-mono text-xs font-bold ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-400">Diam. primitif (D - mm)</label>
                  <input
                    type="number"
                    min="15"
                    max="200"
                    step="0.1"
                    value={params.D}
                    onChange={(e) => setParams((prev) => ({ ...prev, D: +e.target.value || 15 }))}
                    className={`w-full px-3 py-2 rounded-xl border font-mono text-xs font-bold ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-400">Angle de contact (α °)</label>
                  <input
                    type="number"
                    min="0"
                    max="45"
                    value={params.a}
                    onChange={(e) => setParams((prev) => ({ ...prev, a: +e.target.value || 0 }))}
                    className={`w-full px-3 py-2 rounded-xl border font-mono text-xs font-bold ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Fault Frequencies Calculation Cards */}
          <div className={`p-5 rounded-2xl border shadow-sm space-y-4 ${
            isLight ? 'bg-white border-slate-200' : isBW ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-900 border-slate-800'
          }`}>
            <span className="font-bold text-xs uppercase tracking-wider text-slate-400 font-mono">
              Fréquences Caractéristiques Calculées
            </span>

            <div className="grid grid-cols-2 gap-3">
              {[
                { name: 'BPFO (Bague Ext)', f: kinematics.bpfo, fe: kinematics.bpfoE, col: 'text-orange-500', bg: 'border-orange-500/30' },
                { name: 'BPFI (Bague Int)', f: kinematics.bpfi, fe: kinematics.bpfiE, col: 'text-rose-500', bg: 'border-rose-500/30' },
                { name: 'BSF (Bille / Élém.)', f: kinematics.bsf, fe: kinematics.bsfE, col: 'text-purple-500', bg: 'border-purple-500/30' },
                { name: 'FTF (Cage)', f: kinematics.ftf, fe: kinematics.ftfE, col: 'text-blue-500', bg: 'border-blue-500/30' },
              ].map((item) => (
                <div key={item.name} className={`p-3 rounded-xl border ${item.bg} ${isLight ? 'bg-slate-50' : 'bg-slate-800/40'}`}>
                  <span className={`text-[10px] font-bold uppercase tracking-wider block ${item.col}`}>{item.name}</span>
                  <div className={`text-sm font-mono font-bold mt-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {item.f.toFixed(2)} Hz
                  </div>
                  <div className={`text-[10px] font-mono mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    {(item.f / kinematics.f).toFixed(2)}x RPM · {Math.round(item.f * 60)} CPM
                  </div>
                  {params.slip > 0 && (
                    <div className="text-[9px] font-mono text-slate-500 mt-1">
                      Eff: {item.fe.toFixed(2)} Hz
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className={`p-3 rounded-xl border text-[11px] font-mono ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-800/40 border-slate-800 text-slate-400'
            }`}>
              <div>r = (d/D)·cos α = {kinematics.r.toFixed(4)}</div>
              <div className="mt-1">BPFO = (N/2)·f·(1 − r) · BPFI = (N/2)·f·(1 + r)</div>
              <div className="mt-0.5">BSF = (D/2d)·f·(1 − r²) · FTF = (f/2)·(1 − r)</div>
            </div>
          </div>
        </div>

        {/* Right Column: 3D Stage + Oscilloscope + Spectrum (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* 3D Plummer Block Stage */}
          <div className="space-y-2">
            <ThreeBearingStage
              params={params}
              kinematics={kinematics}
              housingMode={housingMode}
              onHousingModeChange={setHousingMode}
              speedMultiplier={speedMultiplier}
              onSpeedMultiplierChange={setSpeedMultiplier}
              isExploded={isExploded}
              onExplodedChange={setIsExploded}
              showGrease={showGrease}
              onShowGreaseChange={setShowGrease}
              highlightDefect={highlightDefect}
              onHighlightDefectChange={setHighlightDefect}
              showLabels={showLabels}
              onShowLabelsChange={setShowLabels}
              theme={theme}
              onDefectSelect={(def) => setParams((prev) => ({ ...prev, def }))}
            />
          </div>

          {/* Synchronized Oscilloscope */}
          <div className={`p-5 rounded-2xl border shadow-sm space-y-3 ${
            isLight ? 'bg-white border-slate-200' : isBW ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-900 border-slate-800'
          }`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="space-y-0.5">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-400 font-mono">
                  Signal Temporel Accéléromètre (Synchronisé 3D)
                </span>
                <p className="text-[11px] text-slate-400">
                  Noir/Blanc : signal d'accélération brute · Orange : enveloppe des chocs démodulée · Triangles rouges : impact bille/défaut
                </p>
              </div>
            </div>

            <canvas
              ref={scopeCanvasRef}
              className={`w-full h-[220px] rounded-xl border ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
              }`}
            />
          </div>

          {/* Advanced Spectral Analysis */}
          <div className={`p-5 rounded-2xl border shadow-sm space-y-4 ${
            isLight ? 'bg-white border-slate-200' : isBW ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-900 border-slate-800'
          }`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-400 font-mono">
                  {mode === 'raw'
                    ? 'Spectre FFT Brute (Basse Fréquence)'
                    : mode === 'wide'
                    ? 'Spectre Large Bande (Résonance Palier)'
                    : 'Spectre d’Enveloppe Démodulé (Hilbert)'}
                </span>
                <p className="text-[11px] text-slate-400">
                  Glissez pour zoomer · Survolez pour inspecter · Double-cliquez pour réinitialiser
                </p>
              </div>

              {/* Reset Zoom Button */}
              {zoomRange && (
                <button
                  onClick={handleSpecDoubleClick}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium border border-blue-500 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 transition-all flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Réinitialiser zoom</span>
                </button>
              )}
            </div>

            {/* Mode & Scale Switchers */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-800/60">
              <div className="flex items-center gap-1 p-1 rounded-xl border text-xs bg-slate-950/60 border-slate-800">
                {(['raw', 'wide', 'env'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                      mode === m
                        ? 'bg-blue-600 text-white font-semibold shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {m === 'raw' ? 'FFT brute' : m === 'wide' ? 'FFT large bande' : 'Spectre d’enveloppe'}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 p-1 rounded-xl border text-xs bg-slate-950/60 border-slate-800">
                {(['lin', 'db'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setScale(s)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                      scale === s
                        ? 'bg-blue-600 text-white font-semibold shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {s === 'lin' ? 'Linéaire (g)' : 'Échelle dB'}
                  </button>
                ))}
              </div>
            </div>

            {/* Bandpass Filter sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 rounded-xl border border-slate-800/80 bg-slate-950/40">
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Filtre passe-bande : centre (fc)</span>
                  <span className="font-mono font-bold text-blue-400">{fc} Hz</span>
                </div>
                <input
                  type="range"
                  min="800"
                  max="7000"
                  step="50"
                  value={fc}
                  onChange={(e) => setFc(+e.target.value)}
                  className="w-full accent-blue-600"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Largeur de bande (Δf)</span>
                  <span className="font-mono font-bold text-blue-400">{bw} Hz</span>
                </div>
                <input
                  type="range"
                  min="200"
                  max="3000"
                  step="50"
                  value={bw}
                  onChange={(e) => setBw(+e.target.value)}
                  className="w-full accent-blue-600"
                />
              </div>
            </div>

            {/* Quick Zoom Chips */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-400 font-mono text-[11px]">Centrer zoom :</span>
              {[
                { label: '1x RPM', f: kinematics.f, color: COL.f },
                { label: 'BPFO', f: kinematics.bpfo, color: COL.outer },
                { label: 'BPFI', f: kinematics.bpfi, color: COL.inner },
                { label: 'BSF', f: kinematics.bsf, color: COL.ball },
                { label: 'FTF', f: kinematics.ftf, color: COL.cage },
              ].map((chip) => (
                <button
                  key={chip.label}
                  onClick={() => {
                    if (mode === 'wide') setMode('env');
                    const span = Math.max(25, chip.f * 0.6);
                    setZoomRange([Math.max(0, chip.f - span), chip.f + span]);
                  }}
                  className="px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-mono text-[11px] transition-all"
                  style={{ color: chip.color }}
                >
                  {chip.label} ({fmtHz(chip.f)})
                </button>
              ))}
            </div>

            {/* Spectrum Plot Canvas */}
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

            {/* Diagnostic Statistics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'}`}>
                <span className={`text-[10px] font-bold uppercase tracking-wider block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>RMS Global</span>
                <div className={`text-sm font-mono font-bold mt-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {statsMetrics.rms.toFixed(3)} g
                </div>
              </div>

              <div className={`p-3 rounded-xl border ${
                statsMetrics.kurt > 3.5
                  ? 'bg-rose-950/30 border-rose-600/40 text-rose-300'
                  : isLight
                  ? 'bg-slate-50 border-slate-200'
                  : 'bg-slate-950/60 border-slate-800'
              }`}>
                <span className={`text-[10px] font-bold uppercase tracking-wider block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Kurtosis Signal</span>
                <div className={`text-sm font-mono font-bold mt-1 ${statsMetrics.kurt > 3.5 ? 'text-rose-500' : isLight ? 'text-slate-900' : 'text-white'}`}>
                  {statsMetrics.kurt.toFixed(2)} {statsMetrics.kurt > 3.5 && '⚠ Chocs'}
                </div>
              </div>

              <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'}`}>
                <span className={`text-[10px] font-bold uppercase tracking-wider block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Pic Enveloppe</span>
                <div className={`text-sm font-mono font-bold mt-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {statsMetrics.pk.toFixed(4)} g
                </div>
              </div>

              <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'}`}>
                <span className={`text-[10px] font-bold uppercase tracking-wider block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Émergence / Bruit</span>
                <div className={`text-sm font-mono font-bold mt-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {statsMetrics.emDb.toFixed(1)} dB
                </div>
              </div>
            </div>
          </div>

          {/* Pedagogical Step-by-Step Explanation */}
          <div className={`p-5 rounded-2xl border shadow-sm space-y-4 ${
            isLight ? 'bg-white border-slate-200' : isBW ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-900 border-slate-800'
          }`}>
            <span className={`font-bold text-xs uppercase tracking-wider font-mono ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Comprendre la Démodulation d'Enveloppe (Méthode de Référence)
            </span>

            <ol className={`space-y-3 text-xs ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600/20 text-blue-500 font-bold flex items-center justify-center font-mono text-xs">
                  1
                </span>
                <div>
                  <b className={isLight ? 'text-slate-900' : 'text-white'}>Le choc transitoire fait résonner la structure :</b> Chaque passage d'une bille sur l'écaillage est une impulsion Dirac brève qui excite la résonance naturelle du palier (ici ~3 kHz). L'énergie du défaut se loge en haute fréquence, rendant les raies imperceptibles dans une FFT brute classique.
                </div>
              </li>

              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600/20 text-blue-500 font-bold flex items-center justify-center font-mono text-xs">
                  2
                </span>
                <div>
                  <b className={isLight ? 'text-slate-900' : 'text-white'}>Filtrage passe-bande centré sur la résonance :</b> Un filtre isole la bande résonante [{fc - bw / 2} ; {fc + bw / 2}] Hz, éliminant les bruits basses fréquences (balourd, désalignement).
                </div>
              </li>

              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600/20 text-blue-500 font-bold flex items-center justify-center font-mono text-xs">
                  3
                </span>
                <div>
                  <b className={isLight ? 'text-slate-900' : 'text-white'}>Démodulation par Transformée de Hilbert :</b> On construit le signal analytique <span className="font-mono text-blue-500">z(t) = x(t) + j·H&#123;x&#125;(t)</span> puis on extrait son amplitude instantanée <span className="font-mono text-blue-500">e(t) = |z(t)|</span>.
                </div>
              </li>

              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600/20 text-blue-500 font-bold flex items-center justify-center font-mono text-xs">
                  4
                </span>
                <div>
                  <b className={isLight ? 'text-slate-900' : 'text-white'}>Spectre FFT de l'enveloppe :</b> La périodicité des chocs réapparaît avec ses harmoniques claires : BPFO pour bague extérieure, BPFI avec bandes latérales ±1x (modulation lors du passage dans la zone de charge), et 2×BSF avec bandes latérales ±FTF.
                </div>
              </li>

              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600/20 text-blue-500 font-bold flex items-center justify-center font-mono text-xs">
                  5
                </span>
                <div>
                  <b className={isLight ? 'text-slate-900' : 'text-white'}>Pourquoi l'enveloppe et pas le TSA ?</b> Les billes glissent naturellement de 1 à 3 % (glissement cinématique). Les chocs ne sont pas rigoureusement périodiques par rapport à l'arbre. Le moyennage temporel synchrone (TSA) annulerait le signal, tandis que l'enveloppe de Hilbert l'isole parfaitement.
                </div>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
