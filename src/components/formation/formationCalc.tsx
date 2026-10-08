import React, { useState, useEffect, useRef } from 'react';
import { 
  Calculator, 
  Maximize2, 
  Minimize2, 
  Sliders, 
  Activity, 
  Layers, 
  Scale, 
  Info, 
  Plus, 
  Trash2,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export type ToolType = 'iso' | 'conv' | 'freq' | 'brg' | 'bal';

export const TOOLS_LABELS: Record<ToolType, string> = {
  iso: 'ISO 10816-3',
  conv: 'Conversions',
  freq: 'Fréquences',
  brg: 'Roulements',
  bal: 'Équilibrage'
};

interface FormationCalcProps {
  initialTool?: ToolType;
  initialPre?: any;
  theme?: 'dark' | 'light' | 'mono';
  onClose?: () => void;
}

// ---------------------------------------------------------------------------
// ISO 10816-3 CONSTANTS
// ---------------------------------------------------------------------------
const LIM: Record<string, [number, number, number]> = {
  '1r': [2.3, 4.5, 7.1],
  '1f': [3.5, 7.1, 11],
  '2r': [1.4, 2.8, 4.5],
  '2f': [2.3, 4.5, 7.1],
  '3r': [2.3, 4.5, 7.1],
  '3f': [3.5, 7.1, 11],
  '4r': [1.4, 2.8, 4.5],
  '4f': [2.3, 4.5, 7.1]
};

const COLS = ['4r', '4f', '3r', '3f', '2r', '2f', '1r', '1f'];
const BND = [0, 0.71, 1.4, 2.3, 2.8, 3.5, 4.5, 7.1, 11, 18];
const ZCOL = ['#00b050', '#ffff00', '#ff9933', '#ff0000'];
const ZTXT = [
  ['A', 'Machine neuve', 'New machine condition'],
  ['B', 'Fonctionnement illimité à long terme', 'Unlimited long-term operation allowable'],
  ['C', 'Fonctionnement limité à court terme', 'Short-term operation allowable'],
  ['D', 'Vibration provoquant des dommages', 'Vibration causes damage']
];

const f2 = (x: number, d = 2) => (Number.isFinite(x) ? x.toFixed(d).replace('.', ',') : '—');

const zoneOf = (col: string, v: number): number => {
  const L = LIM[col] || [1.4, 2.8, 4.5];
  return v <= L[0] ? 0 : v <= L[1] ? 1 : v <= L[2] ? 2 : 3;
};

const yOf = (v: number): number => {
  v = Math.min(Math.max(v, 0), 18);
  let i = 0;
  while (i < 8 && v > BND[i + 1]) i++;
  return ((i + (v - BND[i]) / (BND[i + 1] - BND[i])) / 9) * 100;
};

// ---------------------------------------------------------------------------
// CONVERSIONS CONSTANTS
// ---------------------------------------------------------------------------
const UNITS: Record<string, [string, string][]> = {
  d: [['µm', 'µm'], ['mm', 'mm'], ['mils', 'mils']],
  v: [['mm/s', 'mm/s'], ['in/s', 'in/s'], ['m/s', 'm/s']],
  a: [['g', 'g'], ['m/s²', 'm/s²'], ['mm/s²', 'mm/s²']]
};

const TO_BASE: Record<string, number> = {
  'µm': 1,
  mm: 1000,
  mils: 25.4,
  'mm/s': 1,
  'in/s': 25.4,
  'm/s': 1000,
  g: 9.80665,
  'm/s²': 1,
  'mm/s²': 0.001
};

const DET = {
  rms: 1,
  pk: Math.SQRT2,
  pp: 2 * Math.SQRT2
};

function convAll(c: { q: string; u: string; det: 'rms' | 'pk' | 'pp'; val: number; f: number; fu: string }) {
  const f = c.fu === 'CPM' ? c.f / 60 : c.f;
  const w = 2 * Math.PI * (f || 1e-9);
  const rms = ((c.val || 0) * (TO_BASE[c.u] || 1)) / (DET[c.det] || 1);

  let v = 0; // mm/s RMS
  if (c.q === 'v') v = rms;
  else if (c.q === 'd') v = (rms / 1000) * w;
  else v = (rms / w) * 1000;

  const d = (v / w) * 1000; // µm RMS
  const a = (v / 1000) * w; // m/s² RMS

  const all = (x: number) => ({
    rms: x,
    pk: x * DET.pk,
    pp: x * DET.pp
  });

  return { f, w, d: all(d), v: all(v), a: all(a) };
}

export default function FormationCalc({
  initialTool = 'iso',
  initialPre = {},
  theme = 'dark',
  onClose
}: FormationCalcProps) {
  const isLight = theme === 'light';

  // Active Tool
  const [tool, setTool] = useState<ToolType>(initialTool);
  const [isBig, setIsBig] = useState<boolean>(false);

  // Tool 1: ISO 10816-3 State
  const [isoCol, setIsoCol] = useState<string>('2r');
  const [isoRpm, setIsoRpm] = useState<number>(1480);
  const [isoPts, setIsoPts] = useState<{ l: string; v: number }[]>([
    { l: 'Palier 1 H', v: 3.2 }
  ]);

  // Tool 2: Conversions State
  const [convState, setConvState] = useState<{
    q: 'd' | 'v' | 'a';
    u: string;
    det: 'rms' | 'pk' | 'pp';
    val: number;
    f: number;
    fu: 'Hz' | 'CPM';
  }>({
    q: 'v',
    u: 'mm/s',
    det: 'rms',
    val: 4.5,
    f: 25,
    fu: 'Hz'
  });

  // Tool 3: Frequencies State
  const [freqState, setFreqState] = useState<{
    rpm: number;
    b: number;
    z: number;
  }>({
    rpm: 1500,
    b: 6,
    z: 23
  });

  // Tool 4: Bearings State
  const [brgState, setBrgState] = useState<{
    n: number;
    bd: number;
    pd: number;
    ang: number;
    rpm: number;
  }>({
    n: 9,
    bd: 7.94,
    pd: 39.04,
    ang: 0,
    rpm: 1480
  });

  // Tool 5: Balancing State
  const [balState, setBalState] = useState<{
    oA: number;
    oP: number;
    tA: number;
    tP: number;
    m: number;
    a: number;
  }>({
    oA: 6.2,
    oP: 120,
    tA: 4.8,
    tP: 45,
    m: 15,
    a: 90
  });

  // Canvas ref for Nomogram
  const nomoCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Handle external pre-fills
  useEffect(() => {
    if (initialTool) {
      setTool(initialTool);
    }
    if (initialPre && Object.keys(initialPre).length > 0) {
      if (initialTool === 'iso' && initialPre.v !== undefined) {
        setIsoCol(`${initialPre.g || 2}${initialPre.s || 'r'}`);
        setIsoPts([{ l: 'Énoncé de la question', v: Number(initialPre.v) }]);
      } else if (initialTool === 'conv') {
        setConvState((prev) => ({
          ...prev,
          val: initialPre.val ?? prev.val,
          q: initialPre.kind ?? prev.q,
          u: (initialPre.kind === 'd' ? 'µm' : initialPre.kind === 'a' ? 'g' : 'mm/s'),
          det: initialPre.kind === 'd' ? 'pp' : 'rms',
          f: initialPre.f ?? prev.f
        }));
      } else if (initialTool === 'freq') {
        setFreqState((prev) => ({
          ...prev,
          rpm: initialPre.rpm ?? prev.rpm,
          b: initialPre.b ?? prev.b,
          z: initialPre.z ?? prev.z
        }));
      } else if (initialTool === 'brg') {
        setBrgState((prev) => ({ ...prev, ...initialPre }));
      } else if (initialTool === 'bal') {
        setBalState((prev) => ({ ...prev, ...initialPre }));
      }
    }
  }, [initialTool, initialPre]);

  // Draw D-V-A Nomogram
  useEffect(() => {
    if (tool !== 'conv') return;
    const cv = nomoCanvasRef.current;
    if (!cv) return;

    const dpr = window.devicePixelRatio || 1;
    const W = cv.clientWidth || 360;
    const H = 260;
    cv.width = W * dpr;
    cv.height = H * dpr;

    const x = cv.getContext('2d');
    if (!x) return;
    x.setTransform(dpr, 0, 0, dpr, 0, 0);

    const L = 38;
    const R = W - 12;
    const T = 12;
    const B = H - 24;
    const F0 = 0, F1 = 4, V0 = -2, V1 = 3;

    const X = (fr: number) => L + ((Math.log10(fr) - F0) / (F1 - F0)) * (R - L);
    const Y = (v: number) => B - ((Math.log10(v) - V0) / (V1 - V0)) * (B - T);

    x.save();
    x.beginPath();
    x.rect(L, T, R - L, B - T);
    x.clip();

    // Grid
    x.strokeStyle = isLight ? '#f1f5f9' : '#1e293b';
    x.lineWidth = 1;
    for (let e = F0; e <= F1; e++) {
      for (let k = 1; k < 10; k++) {
        const px = X(k * 10 ** e);
        x.beginPath(); x.moveTo(px, T); x.lineTo(px, B); x.stroke();
      }
    }
    for (let e = V0; e <= V1; e++) {
      for (let k = 1; k < 10; k++) {
        const py = Y(k * 10 ** e);
        x.beginPath(); x.moveTo(L, py); x.lineTo(R, py); x.stroke();
      }
    }

    // Displacement diagonals (blue)
    x.font = 'bold 8.5px ui-monospace, Menlo, monospace';
    for (const d of [0.1, 1, 10, 100, 1000, 10000]) {
      const v = (fr: number) => (2 * Math.PI * fr * d) / 1000;
      x.strokeStyle = '#93c5fd';
      x.beginPath();
      x.moveTo(X(1), Y(v(1)));
      x.lineTo(X(1e4), Y(v(1e4)));
      x.stroke();

      const vR = v(1e4);
      x.fillStyle = '#2563eb';
      x.textAlign = 'right';
      if (vR < 10 ** V1 && vR > 10 ** V0) {
        x.fillText(`${d} µm`, R - 3, Y(vR) + 10);
      }
    }

    // Acceleration diagonals (red)
    for (const a of [0.01, 0.1, 1, 10, 100, 1000]) {
      const v = (fr: number) => (a / (2 * Math.PI * fr)) * 1000;
      x.strokeStyle = '#fca5a5';
      x.beginPath();
      x.moveTo(X(1), Y(v(1)));
      x.lineTo(X(1e4), Y(v(1e4)));
      x.stroke();

      const vL = v(1);
      x.fillStyle = '#dc2626';
      x.textAlign = 'left';
      if (vL < 10 ** V1 && vL > 10 ** V0) {
        x.fillText(`${a} m/s²`, L + 3, Y(vL) + 10);
      }
    }

    // Operating point
    const R0 = convAll(convState);
    if (R0.f > 0 && R0.v.rms > 0) {
      const px = X(R0.f);
      const py = Y(R0.v.rms);
      x.strokeStyle = isLight ? '#0f172a' : '#f8fafc';
      x.setLineDash([4, 3]);
      x.beginPath();
      x.moveTo(px, B);
      x.lineTo(px, py);
      x.lineTo(L, py);
      x.stroke();
      x.setLineDash([]);

      x.fillStyle = '#9333ea';
      x.beginPath();
      x.arc(px, py, 4.5, 0, Math.PI * 2);
      x.fill();
    }

    x.restore();

    // Axes
    x.fillStyle = isLight ? '#475569' : '#94a3b8';
    x.textAlign = 'center';
    for (let e = F0; e <= F1; e++) {
      x.fillText(`${10 ** e}`, X(10 ** e), B + 14);
    }
    x.fillText('Fréquence (Hz)', (L + R) / 2, H - 2);

    x.textAlign = 'right';
    for (let e = V0; e <= V1; e++) {
      x.fillText(`${10 ** e}`, L - 3, Y(10 ** e) + 3);
    }

    x.strokeStyle = isLight ? '#cbd5e1' : '#475569';
    x.strokeRect(L, T, R - L, B - T);
  }, [tool, convState, isLight]);

  return (
    <div className={`rounded-2xl border p-4 shadow-xl transition-all ${
      isBig
        ? 'fixed inset-4 z-50 overflow-y-auto max-w-5xl mx-auto my-auto max-h-[92vh]'
        : 'relative w-full'
    } ${
      isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0D1322] border-slate-800 text-slate-100'
    }`}>
      
      {/* Header Toolbar */}
      <div className="flex items-center justify-between gap-3 border-b pb-3 mb-4 dark:border-slate-800 border-slate-100">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span className="text-xs font-black tracking-wider uppercase">
            Calculatrice & Abaques Industriels
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsBig(!isBig)}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            {isBig ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span>{isBig ? 'Réduire' : 'Agrandir'}</span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="text-xs font-bold px-2 py-1 rounded hover:bg-red-500/10 text-red-500 cursor-pointer"
            >
              Fermer
            </button>
          )}
        </div>
      </div>

      {/* Tabs navigation */}
      <div className={`grid grid-cols-5 gap-1.5 p-1 rounded-xl mb-4 text-xs font-bold border ${
        isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        {(Object.keys(TOOLS_LABELS) as ToolType[]).map((t) => (
          <button
            key={t}
            onClick={() => setTool(t)}
            className={`py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer truncate ${
              tool === t
                ? 'bg-blue-600 text-white shadow-sm'
                : isLight
                  ? 'text-slate-700 hover:text-slate-950 hover:bg-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            {TOOLS_LABELS[t]}
          </button>
        ))}
      </div>

      {/* TOOL 1: ISO 10816-3 */}
      {tool === 'iso' && (() => {
        const L = LIM[isoCol] || [1.4, 2.8, 4.5];
        const pts = isoPts.filter((p) => Number.isFinite(p.v));
        const band = isoRpm > 600 ? '10 – 1000 Hz' : '2 – 1000 Hz';
        const worst = pts.reduce((a, p) => (!a || p.v > a.v ? p : a), pts[0] || null);
        const wz = worst ? zoneOf(isoCol, worst.v) : 0;
        const next = L[wz];
        const g = isoCol[0];
        const f = isoCol[1];

        return (
          <div className="space-y-4">
            {/* Configuration Row 1: Machine Group & Foundation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className={`font-semibold block mb-1 ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
                  Type de machine
                </label>
                <select
                  value={g}
                  onChange={(e) => setIsoCol(e.target.value + f)}
                  className={`w-full p-2.5 rounded-lg border font-mono font-bold text-xs ${
                    isLight ? 'bg-white border-slate-300 text-slate-900 shadow-xs' : 'bg-slate-900 border-slate-700 text-slate-100'
                  }`}
                >
                  <option value="1">Groupe 1 : grandes machines 300 kW – 50 MW / moteurs H ≥ 315 mm</option>
                  <option value="2">Groupe 2 : machines moyennes 15 – 300 kW / moteurs 160 ≤ H &lt; 315 mm</option>
                  <option value="3">Groupe 3 : pompes &gt; 15 kW, arbre intermédiaire / courroie</option>
                  <option value="4">Groupe 4 : pompes &gt; 15 kW, entraînement direct</option>
                </select>
              </div>

              <div>
                <label className={`font-semibold block mb-1 ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
                  Fondation
                </label>
                <select
                  value={f}
                  onChange={(e) => setIsoCol(g + e.target.value)}
                  className={`w-full p-2.5 rounded-lg border font-mono font-bold text-xs ${
                    isLight ? 'bg-white border-slate-300 text-slate-900 shadow-xs' : 'bg-slate-900 border-slate-700 text-slate-100'
                  }`}
                >
                  <option value="r">Rigide</option>
                  <option value="f">Flexible</option>
                </select>
              </div>
            </div>

            {/* Configuration Row 2: RPM & Measurements Help */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs items-center">
              <div>
                <label className={`font-semibold block mb-1 ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
                  Vitesse de rotation (tr/min)
                </label>
                <input
                  type="number"
                  step="10"
                  value={isoRpm}
                  onChange={(e) => setIsoRpm(parseFloat(e.target.value) || 0)}
                  className={`w-full p-2 rounded-lg border font-mono font-bold text-xs ${
                    isLight ? 'bg-white border-slate-300 text-slate-900 shadow-xs' : 'bg-slate-900 border-slate-700 text-slate-100'
                  }`}
                />
              </div>

              <div className="pt-3 text-[11px] text-slate-500">
                Mesures (vitesse RMS, mm/s). Chaque point est placé en direct sur l'abaque.
              </div>
            </div>

            {/* Measurements Points */}
            <div className="space-y-2">
              <span className={`text-xs font-semibold block ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
                Points de mesure vibratoire (mm/s RMS)
              </span>
              {isoPts.map((p, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={p.l}
                    onChange={(e) => {
                      const next = [...isoPts];
                      next[i].l = e.target.value;
                      setIsoPts(next);
                    }}
                    placeholder="Nom du point (ex: Palier 1 H)"
                    className={`flex-1 p-2 rounded-lg border text-xs font-semibold ${
                      isLight ? 'bg-white border-slate-300 text-slate-900 shadow-xs' : 'bg-slate-900 border-slate-700 text-slate-100'
                    }`}
                  />
                  <input
                    type="number"
                    step="0.1"
                    value={p.v}
                    onChange={(e) => {
                      const next = [...isoPts];
                      next[i].v = parseFloat(e.target.value) || 0;
                      setIsoPts(next);
                    }}
                    className={`w-24 p-2 rounded-lg border text-xs font-mono font-bold ${
                      isLight ? 'bg-white border-slate-300 text-slate-900 shadow-xs' : 'bg-slate-900 border-slate-700 text-slate-100'
                    }`}
                  />
                  <span className={`text-xs font-mono ${isLight ? 'text-slate-600 font-semibold' : 'text-slate-400'}`}>mm/s</span>
                  {isoPts.length > 1 && (
                    <button
                      onClick={() => setIsoPts(isoPts.filter((_, idx) => idx !== i))}
                      className="p-1.5 px-2.5 rounded hover:bg-red-500/10 text-red-500 cursor-pointer text-base font-bold leading-none"
                      title="Supprimer"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => setIsoPts([...isoPts, { l: `Point ${isoPts.length + 1}`, v: 2.0 }])}
                className={`px-3 py-1.5 rounded-lg border border-dashed text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                  isLight ? 'text-blue-700 border-blue-400 hover:bg-blue-50 bg-blue-50/40' : 'text-blue-400 border-blue-500/50 hover:bg-blue-500/10'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Ajouter un point de mesure</span>
              </button>
            </div>

            {/* Authentic ISO 10816-3 Abacus Chart */}
            <div className="overflow-x-auto border border-[#0f172a] rounded-md my-2.5 bg-white select-none shadow-xs">
              <div className="min-w-[560px]">
                {/* 8 Columns + 2 Axis Scales (52px, 52px) */}
                <div className="grid grid-cols-[repeat(8,minmax(0,1fr))_52px_52px] h-[252px] border-b border-[#0f172a]">
                  {COLS.map((colKey, colIdx) => {
                    const isSelected = colKey === isoCol;
                    return (
                      <div
                        key={colKey}
                        onClick={() => setIsoCol(colKey)}
                        title={`Groupe ${colKey[0]} ${colKey[1] === 'r' ? 'rigide' : 'flexible'}`}
                        className={`relative flex flex-col cursor-pointer border-r border-[#0f172a] transition-opacity ${
                          isSelected ? 'opacity-100 ring-2 ring-[#2563eb] z-10' : 'opacity-60 hover:opacity-85'
                        }`}
                      >
                        {[8, 7, 6, 5, 4, 3, 2, 1, 0].map((bndIdx) => {
                          const z = zoneOf(colKey, (BND[bndIdx] + BND[bndIdx + 1]) / 2);
                          const first = zoneOf(colKey, (BND[bndIdx + 1] + (BND[bndIdx + 2] ?? 99)) / 2) !== z || bndIdx === 8;
                          return (
                            <div
                              key={bndIdx}
                              style={{ backgroundColor: ZCOL[z] }}
                              className="h-[28px] border-b border-[rgba(15,23,42,0.6)] last:border-b-0 flex items-center justify-center font-extrabold text-sm"
                            >
                              {isSelected && first && (
                                <b style={{ color: z === 3 ? '#fff' : '#0f172a' }}>
                                  {'ABCD'[z]}
                                </b>
                              )}
                            </div>
                          );
                        })}

                        {/* Measurement Markers */}
                        {isSelected && pts.map((p, pIdx) => {
                          const isLeftBadge = colIdx >= 4;
                          return (
                            <div
                              key={pIdx}
                              style={{ bottom: `${yOf(p.v)}%` }}
                              className="absolute left-[-2px] right-[-2px] h-[3px] bg-[#0f172a] shadow-[0_0_0_1.5px_#fff] translate-y-1/2 z-20 pointer-events-none"
                            >
                              <span className={`absolute top-1/2 -translate-y-1/2 bg-[#0f172a] text-white font-mono font-bold text-[9.5px] px-1.5 py-0.5 rounded whitespace-nowrap ${
                                isLeftBadge ? 'right-full mr-1' : 'left-full ml-1'
                              }`}>
                                {p.l} · {f2(p.v, 1)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}

                  {/* Metric Axis Scale (mm/s RMS) */}
                  <div className="relative border-r border-[#0f172a] font-mono text-[10.5px] text-[#0f172a]">
                    {BND.slice(1, 9).map((b) => (
                      <span
                        key={b}
                        style={{ bottom: `${yOf(b)}%` }}
                        className="absolute left-[5px] translate-y-1/2 bg-white px-0.5 whitespace-nowrap leading-none"
                      >
                        {f2(b, b < 1 ? 2 : 1).replace(',0', '').replace(',10', ',1')}
                      </span>
                    ))}
                  </div>

                  {/* Imperial Axis Scale (in/s RMS) */}
                  <div className="relative font-mono text-[10.5px] text-[#0f172a]">
                    {BND.slice(1, 9).map((b) => (
                      <span
                        key={b}
                        style={{ bottom: `${yOf(b)}%` }}
                        className="absolute left-[5px] translate-y-1/2 bg-white px-0.5 whitespace-nowrap leading-none"
                      >
                        {f2(b / 25.4, 2)}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Footer Multi-Row Matrix */}
                <div className="grid grid-cols-[repeat(8,minmax(0,1fr))_52px_52px] text-center text-[10.5px] text-[#0f172a] leading-tight">
                  {/* Row 1: Rigid vs Flexible */}
                  {COLS.map((colKey) => (
                    <div
                      key={colKey}
                      className={`border-r border-t border-[#0f172a] p-1 flex items-center justify-center ${
                        colKey === isoCol ? 'bg-[#dbeafe] font-bold' : ''
                      }`}
                    >
                      {colKey[1] === 'r' ? 'rigide' : 'flexible'}
                    </div>
                  ))}
                  <div className="col-span-2 border-t border-[#0f172a] p-1 flex items-center justify-center font-bold">
                    Fondation
                  </div>

                  {/* Row 2: Machine Category */}
                  <div className={`col-span-4 border-r border-t border-[#0f172a] p-1 flex items-center justify-center ${
                    g === '3' || g === '4' ? 'bg-[#dbeafe] font-bold' : ''
                  }`}>
                    Pompes &gt; 15 kW<br />radiales, axiales, diagonales
                  </div>
                  <div className={`col-span-2 border-r border-t border-[#0f172a] p-1 flex items-center justify-center ${
                    g === '2' ? 'bg-[#dbeafe] font-bold' : ''
                  }`}>
                    Machines moyennes<br />15 kW &lt; P &lt; 300 kW
                  </div>
                  <div className={`col-span-2 border-r border-t border-[#0f172a] p-1 flex items-center justify-center ${
                    g === '1' ? 'bg-[#dbeafe] font-bold' : ''
                  }`}>
                    Grandes machines<br />300 kW &lt; P &lt; 50 MW
                  </div>
                  <div className="col-span-2 border-t border-[#0f172a] p-1 flex items-center justify-center font-bold">
                    Type de machine
                  </div>

                  {/* Row 3: Sub-types */}
                  <div className={`col-span-2 border-r border-t border-[#0f172a] p-1 flex items-center justify-center ${
                    g === '4' ? 'bg-[#dbeafe] font-bold' : ''
                  }`}>
                    Entraînement direct
                  </div>
                  <div className={`col-span-2 border-r border-t border-[#0f172a] p-1 flex items-center justify-center ${
                    g === '3' ? 'bg-[#dbeafe] font-bold' : ''
                  }`}>
                    Arbre intermédiaire /<br />entraînement courroie
                  </div>
                  <div className={`col-span-2 border-r border-t border-[#0f172a] p-1 flex items-center justify-center ${
                    g === '2' ? 'bg-[#dbeafe] font-bold' : ''
                  }`}>
                    Moteurs<br />160 mm &lt; H &lt; 315 mm
                  </div>
                  <div className={`col-span-2 border-r border-t border-[#0f172a] p-1 flex items-center justify-center ${
                    g === '1' ? 'bg-[#dbeafe] font-bold' : ''
                  }`}>
                    Moteurs<br />315 mm ≤ H
                  </div>
                  <div className="col-span-2 border-t border-[#0f172a] p-1" />

                  {/* Row 4: Groups */}
                  {['4', '3', '2', '1'].map((x) => (
                    <div
                      key={x}
                      className={`col-span-2 border-r border-t border-[#0f172a] p-1.5 flex items-center justify-center ${
                        g === x ? 'bg-[#dbeafe] font-bold' : ''
                      }`}
                    >
                      <b>Groupe {x}</b>
                    </div>
                  ))}
                  <div className="col-span-2 border-t border-[#0f172a] p-1.5 flex items-center justify-center font-bold">
                    Groupe
                  </div>
                </div>
              </div>

              {/* Units footer */}
              <div className="grid grid-cols-[1fr_52px_52px] font-mono font-semibold text-[9px] text-[#475569] min-w-[560px] border-t border-[#0f172a] bg-slate-50">
                <span className="col-start-2 text-center py-1">mm/s RMS</span>
                <span className="text-center py-1">in/s RMS</span>
              </div>
            </div>

            {/* 4 Zones Legend with FR / EN subtitles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-2 text-xs">
              {ZTXT.map(([z, fr, en], i) => (
                <div key={z} className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
                  <span
                    style={{ backgroundColor: ZCOL[i], color: i === 3 ? '#fff' : '#0f172a' }}
                    className="w-8 h-6 rounded flex items-center justify-center font-black text-xs border border-[#0f172a] shrink-0"
                  >
                    {z}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold leading-tight">{fr}</span>
                    <span className="text-[10px] text-slate-500 font-normal leading-tight">{en}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Active Zone Status Banner */}
            {worst && (
              <div
                style={{ backgroundColor: ZCOL[wz], color: wz === 3 ? '#fff' : '#0f172a' }}
                className="rounded-lg p-2.5 font-bold text-xs shadow-xs"
              >
                Zone {ZTXT[wz][0]} · {ZTXT[wz][1]} (point le plus élevé : {worst.l}, {f2(worst.v, 2)} mm/s)
              </div>
            )}

            {/* Measurement Table */}
            <table className="w-full border-collapse mt-2 font-mono text-xs border border-slate-300 dark:border-slate-700">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-sans text-[11px] font-bold">
                  <th className="border border-slate-300 dark:border-slate-700 p-1.5 text-left">Point</th>
                  <th className="border border-slate-300 dark:border-slate-700 p-1.5 text-left">mm/s RMS</th>
                  <th className="border border-slate-300 dark:border-slate-700 p-1.5 text-left">in/s RMS</th>
                  <th className="border border-slate-300 dark:border-slate-700 p-1.5 text-center">Zone</th>
                </tr>
              </thead>
              <tbody>
                {pts.map((p, idx) => {
                  const z = zoneOf(isoCol, p.v);
                  return (
                    <tr key={idx} className="border-t border-slate-200 dark:border-slate-700">
                      <td className="border border-slate-300 dark:border-slate-700 p-1.5 font-sans font-medium">{p.l}</td>
                      <td className="border border-slate-300 dark:border-slate-700 p-1.5">{f2(p.v, 2)}</td>
                      <td className="border border-slate-300 dark:border-slate-700 p-1.5">{f2(p.v / 25.4, 3)}</td>
                      <td className="border border-slate-300 dark:border-slate-700 p-1.5 text-center">
                        <span
                          style={{ backgroundColor: ZCOL[z], color: z === 3 ? '#fff' : '#0f172a' }}
                          className="inline-block w-6 h-5 rounded font-black text-xs border border-[#0f172a]"
                        >
                          {'ABCD'[z]}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Detailed Output Diagnostic Card */}
            <div className="bg-[#0f172a] text-[#e2e8f0] rounded-xl p-3.5 font-mono text-xs space-y-1.5 mt-2.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Limites A/B · B/C · C/D :</span>
                <b className="text-white">{L.map((x) => f2(x, 1)).join(' · ')} mm/s</b>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Équivalent impérial :</span>
                <b className="text-white">{L.map((x) => f2(x / 25.4, 2)).join(' · ')} in/s</b>
              </div>
              {worst && wz < 3 && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Marge avant la zone {'ABCD'[wz + 1]} :</span>
                  <b className="text-amber-400">
                    {f2(next - worst.v, 2)} mm/s ({Math.round(((next - worst.v) / next) * 100)} %)
                  </b>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400">Alarme recommandée (≤ 1,25 × B/C) :</span>
                <b className="text-amber-300">{f2(Math.min(1.25 * L[1], L[2]), 2)} mm/s</b>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Déclenchement (≤ 1,25 × C/D) :</span>
                <b className="text-red-400">{f2(1.25 * L[2], 2)} mm/s</b>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Bande de mesure ({Math.round(isoRpm)} tr/min) :</span>
                <b className="text-white">{band}</b>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
              Vitesse vibratoire efficace mesurée sur les paliers, directions radiales et axiale. Cliquez une colonne de l'abaque pour changer de groupe ou de fondation.
            </p>
          </div>
        );
      })()}

      {/* TOOL 2: CONVERSIONS D-V-A */}
      {tool === 'conv' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className={`font-semibold block mb-1 ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>Grandeur Mesurée</label>
              <select
                value={convState.q}
                onChange={(e) => {
                  const q = e.target.value as 'd' | 'v' | 'a';
                  setConvState((prev) => ({
                    ...prev,
                    q,
                    u: UNITS[q][0][0]
                  }));
                }}
                className={`w-full p-2.5 rounded-lg border font-mono font-bold text-xs ${
                  isLight ? 'bg-white border-slate-300 text-slate-900 shadow-xs' : 'bg-slate-900 border-slate-700 text-slate-100'
                }`}
              >
                <option value="d">Déplacement (D)</option>
                <option value="v">Vitesse (V)</option>
                <option value="a">Accélération (A)</option>
              </select>
            </div>
            <div>
              <label className={`font-semibold block mb-1 ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>Unité</label>
              <select
                value={convState.u}
                onChange={(e) => setConvState((prev) => ({ ...prev, u: e.target.value }))}
                className={`w-full p-2.5 rounded-lg border font-mono font-bold text-xs ${
                  isLight ? 'bg-white border-slate-300 text-slate-900 shadow-xs' : 'bg-slate-900 border-slate-700 text-slate-100'
                }`}
              >
                {UNITS[convState.q]?.map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={`font-semibold block mb-1 ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>Mode Détection</label>
              <select
                value={convState.det}
                onChange={(e) => setConvState((prev) => ({ ...prev, det: e.target.value as any }))}
                className={`w-full p-2.5 rounded-lg border font-mono font-bold text-xs ${
                  isLight ? 'bg-white border-slate-300 text-slate-900 shadow-xs' : 'bg-slate-900 border-slate-700 text-slate-100'
                }`}
              >
                <option value="rms">Efficace (RMS)</option>
                <option value="pk">Crête (0-Pk)</option>
                <option value="pp">Crête-à-Crête (Pk-Pk)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className={`font-semibold block mb-1 ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>Valeur Mesurée</label>
              <input
                type="number"
                step="any"
                value={convState.val}
                onChange={(e) => setConvState((prev) => ({ ...prev, val: parseFloat(e.target.value) || 0 }))}
                className={`w-full p-2.5 rounded-lg border font-mono font-bold text-xs ${
                  isLight ? 'bg-white border-slate-300 text-slate-900 shadow-xs' : 'bg-slate-900 border-slate-700 text-slate-100'
                }`}
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className={`font-semibold block mb-1 ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>Fréquence</label>
                <input
                  type="number"
                  step="any"
                  value={convState.f}
                  onChange={(e) => setConvState((prev) => ({ ...prev, f: parseFloat(e.target.value) || 0 }))}
                  className={`w-full p-2.5 rounded-lg border font-mono font-bold text-xs ${
                    isLight ? 'bg-white border-slate-300 text-slate-900 shadow-xs' : 'bg-slate-900 border-slate-700 text-slate-100'
                  }`}
                />
              </div>
              <div className="w-24">
                <label className={`font-semibold block mb-1 ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>Unité Fréq.</label>
                <select
                  value={convState.fu}
                  onChange={(e) => setConvState((prev) => ({ ...prev, fu: e.target.value as any }))}
                  className={`w-full p-2.5 rounded-lg border font-mono font-bold text-xs ${
                    isLight ? 'bg-white border-slate-300 text-slate-900 shadow-xs' : 'bg-slate-900 border-slate-700 text-slate-100'
                  }`}
                >
                  <option value="Hz">Hz</option>
                  <option value="CPM">CPM (tr/min)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results Table */}
          {(() => {
            const R = convAll(convState);
            return (
              <div className="space-y-3">
                <div className={`rounded-xl border overflow-hidden ${isLight ? 'border-slate-300 bg-white shadow-xs' : 'border-slate-800 bg-slate-900/60'}`}>
                  <table className="w-full text-xs font-mono text-left">
                    <thead className={isLight ? 'bg-slate-100 text-slate-700 font-bold border-b border-slate-200' : 'bg-slate-900 text-slate-300 border-b border-slate-800'}>
                      <tr>
                        <th className="p-2.5">Grandeur</th>
                        <th className="p-2.5">RMS</th>
                        <th className="p-2.5">Crête (0-Pk)</th>
                        <th className="p-2.5">Crête-Crête (Pk-Pk)</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isLight ? 'divide-slate-200 text-slate-800' : 'divide-slate-800 text-slate-200'}`}>
                      <tr>
                        <td className="p-2.5 font-bold text-blue-600 dark:text-blue-400">Déplacement</td>
                        <td className="p-2.5">{R.d.rms.toFixed(2)} µm</td>
                        <td className="p-2.5">{R.d.pk.toFixed(2)} µm</td>
                        <td className="p-2.5 font-black">{R.d.pp.toFixed(2)} µm ({ (R.d.pp / 25.4).toFixed(2) } mils)</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold text-emerald-600 dark:text-emerald-400">Vitesse</td>
                        <td className="p-2.5 font-black">{R.v.rms.toFixed(2)} mm/s</td>
                        <td className="p-2.5">{R.v.pk.toFixed(2)} mm/s</td>
                        <td className="p-2.5">{R.v.pp.toFixed(2)} mm/s</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold text-red-600 dark:text-red-400">Accélération</td>
                        <td className="p-2.5">{(R.a.rms / 9.80665).toFixed(3)} g ({R.a.rms.toFixed(2)} m/s²)</td>
                        <td className="p-2.5">{(R.a.pk / 9.80665).toFixed(3)} g</td>
                        <td className="p-2.5">{(R.a.pp / 9.80665).toFixed(3)} g</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Nomogram canvas */}
                <div className="space-y-1">
                  <span className={`text-[11px] font-mono font-bold uppercase ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Nomogramme Log-Log D-V-A (Point de fonctionnement violet)
                  </span>
                  <div className={`p-2 rounded-xl border ${isLight ? 'bg-white border-slate-300 shadow-xs' : 'bg-[#090D16] border-slate-800'}`}>
                    <canvas ref={nomoCanvasRef} className="w-full h-[260px] block" />
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* TOOL 3: FREQUENCIES */}
      {tool === 'freq' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className={`font-semibold block mb-1 ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>Vitesse Machine (N)</label>
              <input
                type="number"
                value={freqState.rpm}
                onChange={(e) => setFreqState((prev) => ({ ...prev, rpm: parseFloat(e.target.value) || 0 }))}
                className={`w-full p-2.5 rounded-lg border font-mono font-bold text-xs ${
                  isLight ? 'bg-white border-slate-300 text-slate-900 shadow-xs' : 'bg-slate-900 border-slate-700 text-slate-100'
                }`}
              />
              <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>tr/min ou CPM</span>
            </div>
            <div>
              <label className={`font-semibold block mb-1 ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>Nombre d'aubes (B)</label>
              <input
                type="number"
                value={freqState.b}
                onChange={(e) => setFreqState((prev) => ({ ...prev, b: parseInt(e.target.value) || 1 }))}
                className={`w-full p-2.5 rounded-lg border font-mono font-bold text-xs ${
                  isLight ? 'bg-white border-slate-300 text-slate-900 shadow-xs' : 'bg-slate-900 border-slate-700 text-slate-100'
                }`}
              />
              <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Pompes / ventilateurs</span>
            </div>
            <div>
              <label className={`font-semibold block mb-1 ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>Nombre de dents (Z)</label>
              <input
                type="number"
                value={freqState.z}
                onChange={(e) => setFreqState((prev) => ({ ...prev, z: parseInt(e.target.value) || 1 }))}
                className={`w-full p-2.5 rounded-lg border font-mono font-bold text-xs ${
                  isLight ? 'bg-white border-slate-300 text-slate-900 shadow-xs' : 'bg-slate-900 border-slate-700 text-slate-100'
                }`}
              />
              <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Pignon engrenage</span>
            </div>
          </div>

          {/* Frequency Results */}
          {(() => {
            const f1x = (freqState.rpm || 0) / 60;
            const bpf = freqState.b * f1x;
            const gmf = freqState.z * f1x;
            return (
              <div className={`p-4 rounded-xl border space-y-2.5 font-mono text-xs ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200'
              }`}>
                <div className={`flex justify-between items-center py-1.5 border-b ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                  <span className={isLight ? 'text-slate-600 font-bold' : 'text-slate-400'}>Fréquence Fondamentale (1x) :</span>
                  <span className="font-black text-blue-600 dark:text-blue-400">
                    {f1x.toFixed(2)} Hz ({Math.round(freqState.rpm)} CPM) — T = {(1000 / (f1x || 1)).toFixed(2)} ms
                  </span>
                </div>
                <div className={`flex justify-between items-center py-1.5 border-b ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                  <span className={isLight ? 'text-slate-600 font-bold' : 'text-slate-400'}>Harmoniques 2x · 3x :</span>
                  <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-slate-300'}`}>
                    {(2 * f1x).toFixed(2)} Hz · {(3 * f1x).toFixed(2)} Hz
                  </span>
                </div>
                <div className={`flex justify-between items-center py-1.5 border-b ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                  <span className={isLight ? 'text-slate-600 font-bold' : 'text-slate-400'}>Passage Aubes (BPF = B × f) :</span>
                  <span className="font-black text-red-600 dark:text-red-400">
                    {bpf.toFixed(1)} Hz ({Math.round(bpf * 60)} CPM)
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className={isLight ? 'text-slate-600 font-bold' : 'text-slate-400'}>Engrènement (GMF = Z × f) :</span>
                  <span className="font-black text-purple-600 dark:text-purple-400">
                    {gmf.toFixed(1)} Hz
                  </span>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* TOOL 4: BEARINGS */}
      {tool === 'brg' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            <div>
              <label className={`font-semibold block mb-1 ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>Nb Éléments (n)</label>
              <input
                type="number"
                value={brgState.n}
                onChange={(e) => setBrgState((prev) => ({ ...prev, n: parseInt(e.target.value) || 1 }))}
                className={`w-full p-2.5 rounded-lg border font-mono font-bold text-xs ${
                  isLight ? 'bg-white border-slate-300 text-slate-900 shadow-xs' : 'bg-slate-900 border-slate-700 text-slate-100'
                }`}
              />
            </div>
            <div>
              <label className={`font-semibold block mb-1 ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>Vitesse (RPM)</label>
              <input
                type="number"
                value={brgState.rpm}
                onChange={(e) => setBrgState((prev) => ({ ...prev, rpm: parseFloat(e.target.value) || 0 }))}
                className={`w-full p-2.5 rounded-lg border font-mono font-bold text-xs ${
                  isLight ? 'bg-white border-slate-300 text-slate-900 shadow-xs' : 'bg-slate-900 border-slate-700 text-slate-100'
                }`}
              />
            </div>
            <div>
              <label className={`font-semibold block mb-1 ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>Diam. Bille (Bd)</label>
              <input
                type="number"
                step="0.01"
                value={brgState.bd}
                onChange={(e) => setBrgState((prev) => ({ ...prev, bd: parseFloat(e.target.value) || 0 }))}
                className={`w-full p-2.5 rounded-lg border font-mono font-bold text-xs ${
                  isLight ? 'bg-white border-slate-300 text-slate-900 shadow-xs' : 'bg-slate-900 border-slate-700 text-slate-100'
                }`}
              />
            </div>
            <div>
              <label className={`font-semibold block mb-1 ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>Diam. Primitif (Pd)</label>
              <input
                type="number"
                step="0.01"
                value={brgState.pd}
                onChange={(e) => setBrgState((prev) => ({ ...prev, pd: parseFloat(e.target.value) || 0 }))}
                className={`w-full p-2.5 rounded-lg border font-mono font-bold text-xs ${
                  isLight ? 'bg-white border-slate-300 text-slate-900 shadow-xs' : 'bg-slate-900 border-slate-700 text-slate-100'
                }`}
              />
            </div>
            <div>
              <label className={`font-semibold block mb-1 ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>Angle contact (α)</label>
              <input
                type="number"
                value={brgState.ang}
                onChange={(e) => setBrgState((prev) => ({ ...prev, ang: parseFloat(e.target.value) || 0 }))}
                className={`w-full p-2.5 rounded-lg border font-mono font-bold text-xs ${
                  isLight ? 'bg-white border-slate-300 text-slate-900 shadow-xs' : 'bg-slate-900 border-slate-700 text-slate-100'
                }`}
              />
            </div>
          </div>

          {/* Results Table */}
          {(() => {
            const f = (brgState.rpm || 0) / 60;
            const r = (brgState.bd / (brgState.pd || 1)) * Math.cos((brgState.ang * Math.PI) / 180);
            const bpfo = (brgState.n / 2) * f * (1 - r);
            const bpfi = (brgState.n / 2) * f * (1 + r);
            const bsf = (brgState.pd / (2 * (brgState.bd || 1))) * f * (1 - r * r);
            const ftf = (f / 2) * (1 - r);

            return (
              <div className={`p-4 rounded-xl border space-y-2.5 font-mono text-xs ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200'
              }`}>
                <div className={`flex justify-between items-center py-1.5 border-b ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                  <span className={isLight ? 'text-slate-600 font-bold' : 'text-slate-400'}>BPFO (Bague extérieure) :</span>
                  <span className="font-black text-red-600 dark:text-red-400">
                    {bpfo.toFixed(1)} Hz ({(bpfo / (f || 1)).toFixed(2)}x)
                  </span>
                </div>
                <div className={`flex justify-between items-center py-1.5 border-b ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                  <span className={isLight ? 'text-slate-600 font-bold' : 'text-slate-400'}>BPFI (Bague intérieure) :</span>
                  <span className="font-black text-amber-600 dark:text-amber-400">
                    {bpfi.toFixed(1)} Hz ({(bpfi / (f || 1)).toFixed(2)}x)
                  </span>
                </div>
                <div className={`flex justify-between items-center py-1.5 border-b ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                  <span className={isLight ? 'text-slate-600 font-bold' : 'text-slate-400'}>BSF (Élément roulant / Bille) :</span>
                  <span className="font-black text-blue-600 dark:text-blue-400">
                    {bsf.toFixed(1)} Hz ({(bsf / (f || 1)).toFixed(2)}x)
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className={isLight ? 'text-slate-600 font-bold' : 'text-slate-400'}>FTF (Cage) :</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400">
                    {ftf.toFixed(1)} Hz ({(ftf / (f || 1)).toFixed(2)}x)
                  </span>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* TOOL 5: BALANCING */}
      {tool === 'bal' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className={`font-semibold block mb-1 ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>O : Amplitude Initiale</label>
              <input
                type="number"
                step="0.1"
                value={balState.oA}
                onChange={(e) => setBalState((prev) => ({ ...prev, oA: parseFloat(e.target.value) || 0 }))}
                className={`w-full p-2.5 rounded-lg border font-mono font-bold text-xs ${
                  isLight ? 'bg-white border-slate-300 text-slate-900 shadow-xs' : 'bg-slate-900 border-slate-700 text-slate-100'
                }`}
              />
              <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>mm/s</span>
            </div>
            <div>
              <label className={`font-semibold block mb-1 ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>O : Phase Initiale</label>
              <input
                type="number"
                value={balState.oP}
                onChange={(e) => setBalState((prev) => ({ ...prev, oP: parseFloat(e.target.value) || 0 }))}
                className={`w-full p-2.5 rounded-lg border font-mono font-bold text-xs ${
                  isLight ? 'bg-white border-slate-300 text-slate-900 shadow-xs' : 'bg-slate-900 border-slate-700 text-slate-100'
                }`}
              />
              <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>degrés (°)</span>
            </div>
            <div>
              <label className={`font-semibold block mb-1 ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>T : Amplitude avec Essai</label>
              <input
                type="number"
                step="0.1"
                value={balState.tA}
                onChange={(e) => setBalState((prev) => ({ ...prev, tA: parseFloat(e.target.value) || 0 }))}
                className={`w-full p-2.5 rounded-lg border font-mono font-bold text-xs ${
                  isLight ? 'bg-white border-slate-300 text-slate-900 shadow-xs' : 'bg-slate-900 border-slate-700 text-slate-100'
                }`}
              />
              <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>mm/s</span>
            </div>
            <div>
              <label className={`font-semibold block mb-1 ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>T : Phase avec Essai</label>
              <input
                type="number"
                value={balState.tP}
                onChange={(e) => setBalState((prev) => ({ ...prev, tP: parseFloat(e.target.value) || 0 }))}
                className={`w-full p-2.5 rounded-lg border font-mono font-bold text-xs ${
                  isLight ? 'bg-white border-slate-300 text-slate-900 shadow-xs' : 'bg-slate-900 border-slate-700 text-slate-100'
                }`}
              />
              <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>degrés (°)</span>
            </div>
            <div>
              <label className={`font-semibold block mb-1 ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>Masse d'Essai (Mt)</label>
              <input
                type="number"
                step="0.1"
                value={balState.m}
                onChange={(e) => setBalState((prev) => ({ ...prev, m: parseFloat(e.target.value) || 0 }))}
                className={`w-full p-2.5 rounded-lg border font-mono font-bold text-xs ${
                  isLight ? 'bg-white border-slate-300 text-slate-900 shadow-xs' : 'bg-slate-900 border-slate-700 text-slate-100'
                }`}
              />
              <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>grammes (g)</span>
            </div>
            <div>
              <label className={`font-semibold block mb-1 ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>Angle de Pose (Mt)</label>
              <input
                type="number"
                value={balState.a}
                onChange={(e) => setBalState((prev) => ({ ...prev, a: parseFloat(e.target.value) || 0 }))}
                className={`w-full p-2.5 rounded-lg border font-mono font-bold text-xs ${
                  isLight ? 'bg-white border-slate-300 text-slate-900 shadow-xs' : 'bg-slate-900 border-slate-700 text-slate-100'
                }`}
              />
              <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>degrés (°)</span>
            </div>
          </div>

          {/* Vector Solver Results */}
          {(() => {
            const rad = (d: number) => (d * Math.PI) / 180;
            const O = [balState.oA * Math.cos(rad(balState.oP)), balState.oA * Math.sin(rad(balState.oP))];
            const T = [balState.tA * Math.cos(rad(balState.tP)), balState.tA * Math.sin(rad(balState.tP))];
            const M = [balState.m * Math.cos(rad(balState.a)), balState.m * Math.sin(rad(balState.a))];
            const E = [T[0] - O[0], T[1] - O[1]];

            const dv = (a: number[], b: number[]) => {
              const d = b[0] ** 2 + b[1] ** 2 || 1e-9;
              return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d];
            };

            const al = dv(E, M);
            const W = dv([-O[0], -O[1]], al);
            const amp = (v: number[]) => Math.hypot(v[0], v[1]);
            const ang = (v: number[]) => (((Math.atan2(v[1], v[0]) * 180) / Math.PI) + 360) % 360;

            const eAmp = amp(E);
            const alAmp = amp(al);
            const wAmp = amp(W);
            const wAng = Math.round(ang(W));
            const variationPct = Math.round((eAmp / (balState.oA || 1)) * 100);

            return (
              <div className={`p-4 rounded-xl border space-y-2.5 font-mono text-xs ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200'
              }`}>
                <div className={`flex justify-between items-center py-1.5 border-b ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                  <span className={isLight ? 'text-slate-600 font-bold' : 'text-slate-400'}>Effet Masse Essai (E = T − O) :</span>
                  <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
                    {eAmp.toFixed(2)} mm/s @ {Math.round(ang(E))}°
                  </span>
                </div>
                <div className={`flex justify-between items-center py-1.5 border-b ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                  <span className={isLight ? 'text-slate-600 font-bold' : 'text-slate-400'}>Sensibilité d'influence (α = E / Mt) :</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {Math.round(alAmp * 1000)} µm/s/g @ {Math.round(ang(al))}°
                  </span>
                </div>
                <div className={`flex justify-between items-center py-1.5 border-b ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                  <span className={isLight ? 'text-slate-600 font-bold' : 'text-slate-400'}>Masse de Correction Finale (W) :</span>
                  <span className="font-black text-purple-600 dark:text-purple-400 text-sm">
                    {wAmp.toFixed(1)} g @ {wAng}° (Masse d'essai retirée)
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className={isLight ? 'text-slate-600 font-bold' : 'text-slate-400'}>Vérification Règle des 30% :</span>
                  <span className={`font-black ${variationPct >= 30 ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {variationPct}% {variationPct >= 30 ? '✓ Valide (≥ 30%)' : '⚠ Faible (< 30%)'}
                  </span>
                </div>
              </div>
            );
          })()}
        </div>
      )}

    </div>
  );
}
