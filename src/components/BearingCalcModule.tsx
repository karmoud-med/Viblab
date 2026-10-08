import React, { useState, useEffect, useRef } from 'react';
import { Compass, Settings2, Sliders, Play, Info, Activity } from 'lucide-react';

interface BearingProps {
  theme: 'light' | 'dark' | 'mono';
}

export default function BearingCalcModule({ theme }: BearingProps) {
  const isLight = theme === 'light';
  const isBW = theme === 'mono';

  // State parameters for bearing geometry
  const [rpm, setRpm] = useState<number>(1500);
  const [numRollers, setNumRollers] = useState<number>(9); // N
  const [rollerDiam, setRollerDiam] = useState<number>(7.94); // d in mm
  const [pitchDiam, setPitchDiam] = useState<number>(38.5); // D in mm
  const [contactAngle, setContactAngle] = useState<number>(0); // alpha in degrees
  const [activeCursor, setActiveCursor] = useState<'BPFO' | 'BPFI' | 'BSF' | 'FTF' | 'all'>('all');

  // Calculated frequencies
  const [fShaft, setFShaft] = useState<number>(25); // Hz
  const [bpfo, setBpfo] = useState<number>(0);
  const [bpfi, setBpfi] = useState<number>(0);
  const [bsf, setBsf] = useState<number>(0);
  const [ftf, setFtf] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Recalculate frequencies when geometry or speed changes
  useEffect(() => {
    const fs = rpm / 60;
    setFShaft(fs);

    const cosAlpha = Math.cos((contactAngle * Math.PI) / 180);
    const dOverD = rollerDiam / pitchDiam;

    // Formula calculation
    const calcBpfo = (numRollers * fs / 2) * (1 - dOverD * cosAlpha);
    const calcBpfi = (numRollers * fs / 2) * (1 + dOverD * cosAlpha);
    const calcBsf = (pitchDiam * fs / (2 * rollerDiam)) * (1 - (dOverD * cosAlpha) ** 2);
    const calcFtf = (fs / 2) * (1 - dOverD * cosAlpha);

    setBpfo(calcBpfo);
    setBpfi(calcBpfi);
    setBsf(calcBsf);
    setFtf(calcFtf);
  }, [rpm, numRollers, rollerDiam, pitchDiam, contactAngle]);

  // Render the interactive FFT spectrum with overlay cursors
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Draw background
    ctx.fillStyle = isLight ? '#f8fafc' : '#020617';
    ctx.fillRect(0, 0, width, height);

    // Draw Grid
    ctx.strokeStyle = isLight ? 'rgba(148, 163, 184, 0.2)' : 'rgba(30, 41, 59, 0.5)';
    ctx.lineWidth = 1;
    const gridCols = 10;
    const gridRows = 6;
    for (let i = 1; i < gridCols; i++) {
      const x = (width / gridCols) * i;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let i = 1; i < gridRows; i++) {
      const y = (height / gridRows) * i;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }

    const maxFreq = Math.max(bpfi, bpfo, bsf, fShaft) * 1.5; // auto-scale max freq
    const freqRange = Math.max(maxFreq, 150); // Minimum 150 Hz range

    // Draw theoretical peaks representing what we would see with actual bearing defects
    ctx.strokeStyle = isLight ? '#475569' : '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, height);

    // Generate theoretical spectra curve
    for (let x = 0; x < width; x++) {
      const f = (x / width) * freqRange;
      let amp = 0.05 + Math.abs(Math.sin(f * 8)) * 0.02; // grass noise

      // Add 1x, 2x, 3x shaft speed harmonics
      amp += 0.4 * Math.exp(-(((f - fShaft) / 0.5) ** 2));
      amp += 0.15 * Math.exp(-(((f - fShaft * 2) / 0.5) ** 2));

      // Add bearing defect peak representations (small peak for outer, inner etc.)
      // This simulates a slight rolling defect
      amp += 0.8 * Math.exp(-(((f - bpfo) / 0.8) ** 2));
      amp += 0.3 * Math.exp(-(((f - (bpfo - fShaft)) / 0.8) ** 2)); // BPFO modulations
      amp += 0.3 * Math.exp(-(((f - (bpfo + fShaft)) / 0.8) ** 2));

      amp += 0.6 * Math.exp(-(((f - bpfi) / 0.8) ** 2));
      amp += 0.4 * Math.exp(-(((f - bsf) / 0.8) ** 2));
      amp += 0.15 * Math.exp(-(((f - ftf) / 0.8) ** 2));

      const sy = height - (amp / 2.5) * height;
      ctx.lineTo(x, sy);
    }
    ctx.stroke();

    // Helper to draw vertical cursors
    const drawCursor = (freq: number, label: string, color: string, isActive: boolean) => {
      if (!isActive) return;
      const x = (freq / freqRange) * width;
      if (x < 0 || x > width) return;

      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
      ctx.setLineDash([]);

      // Top label
      ctx.fillStyle = color;
      ctx.font = 'bold 9px monospace';
      ctx.fillText(`${label}: ${freq.toFixed(1)}Hz`, x + 3, 15);
      ctx.fillText(`(${(freq / fShaft).toFixed(2)}x)`, x + 3, 27);
    };

    // Draw Cursors
    const showAll = activeCursor === 'all';
    drawCursor(fShaft, '1X (Shaft)', '#ef4444', showAll);
    drawCursor(bpfo, 'BPFO', '#f59e0b', showAll || activeCursor === 'BPFO');
    drawCursor(bpfi, 'BPFI', '#10b981', showAll || activeCursor === 'BPFI');
    drawCursor(bsf, 'BSF (Bille)', '#3b82f6', showAll || activeCursor === 'BSF');
    drawCursor(ftf, 'FTF (Cage)', '#8b5cf6', showAll || activeCursor === 'FTF');

    // Axes
    ctx.fillStyle = isLight ? '#475569' : '#94a3b8';
    ctx.font = '10px monospace';
    ctx.fillText('FFT Simulée avec défauts composites (mm/s)', 10, height - 10);
    ctx.fillText(`Échelle: 0 - ${freqRange.toFixed(0)} Hz`, width - 140, 20);

  }, [rpm, bpfo, bpfi, bsf, ftf, fShaft, activeCursor, theme]);

  return (
    <div className={`space-y-6 ${isLight ? 'text-slate-800' : 'text-slate-100'}`} id="bearing_calc_root">
      {/* Description header */}
      <div className={`p-6 rounded-2xl border transition-all shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800'
      }`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Compass className="w-6 h-6 text-indigo-500" />
            <h2 className="text-xl font-extrabold tracking-tight">Calculateur de Fréquences de Défauts de Roulement</h2>
          </div>
          <p className={`text-xs ${isLight ? "text-slate-600" : "text-slate-400"}`}>
            Configurez la géométrie physique de votre roulement à billes et projetez instantanément les fréquences critiques sur le spectre FFT.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Parameters Input (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className={`p-5 rounded-xl border flex flex-col gap-5 ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900/40 border-slate-800'
          }`}>
            <span className={`text-xs font-bold uppercase tracking-wider text-indigo-400 block border-b ${isLight ? "border-slate-300" : "border-slate-800"} pb-2`}>
              Caractéristiques Géométriques
            </span>

            {/* Slider parameters */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className={`${isLight ? "text-slate-600" : "text-slate-400"}`}>Vitesse de rotation :</span>
                  <span className="font-mono text-indigo-400">{rpm} RPM ({fShaft.toFixed(1)} Hz)</span>
                </div>
                <input
                  type="range" min="300" max="3600" step="50" value={rpm}
                  onChange={(e) => setRpm(Number(e.target.value))}
                  className={`w-full h-1.5 ${isLight ? "bg-slate-200" : "bg-slate-800"} rounded-lg appearance-none cursor-pointer accent-indigo-500`}
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className={`${isLight ? "text-slate-600" : "text-slate-400"}`}>Nombre d'éléments roulants (N) :</span>
                  <span className="font-mono text-indigo-400">{numRollers}</span>
                </div>
                <input
                  type="range" min="5" max="18" step="1" value={numRollers}
                  onChange={(e) => setNumRollers(Number(e.target.value))}
                  className={`w-full h-1.5 ${isLight ? "bg-slate-200" : "bg-slate-800"} rounded-lg appearance-none cursor-pointer accent-indigo-500`}
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className={`${isLight ? "text-slate-600" : "text-slate-400"}`}>Diamètre des billes/rouleaux (d) :</span>
                  <span className="font-mono text-indigo-400">{rollerDiam.toFixed(2)} mm</span>
                </div>
                <input
                  type="range" min="3.0" max="20.0" step="0.05" value={rollerDiam}
                  onChange={(e) => setRollerDiam(Number(e.target.value))}
                  className={`w-full h-1.5 ${isLight ? "bg-slate-200" : "bg-slate-800"} rounded-lg appearance-none cursor-pointer accent-indigo-500`}
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className={`${isLight ? "text-slate-600" : "text-slate-400"}`}>Diamètre moyen du roulement (D) :</span>
                  <span className="font-mono text-indigo-400">{pitchDiam.toFixed(1)} mm</span>
                </div>
                <input
                  type="range" min="20.0" max="120.0" step="0.5" value={pitchDiam}
                  onChange={(e) => setPitchDiam(Number(e.target.value))}
                  className={`w-full h-1.5 ${isLight ? "bg-slate-200" : "bg-slate-800"} rounded-lg appearance-none cursor-pointer accent-indigo-500`}
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className={`${isLight ? "text-slate-600" : "text-slate-400"}`}>Angle de contact (α) :</span>
                  <span className="font-mono text-indigo-400">{contactAngle}°</span>
                </div>
                <input
                  type="range" min="0" max="45" step="1" value={contactAngle}
                  onChange={(e) => setContactAngle(Number(e.target.value))}
                  className={`w-full h-1.5 ${isLight ? "bg-slate-200" : "bg-slate-800"} rounded-lg appearance-none cursor-pointer accent-indigo-500`}
                />
              </div>
            </div>

            {/* Scientific Formulas Card */}
            <div className={`p-4 rounded-xl border text-[10px] font-mono space-y-1.5 leading-relaxed ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-950/50 border-slate-800 text-slate-400'
            }`}>
              <span className={`font-bold block mb-1 ${isLight ? 'text-indigo-600' : 'text-indigo-400'}`}>Formules Théoriques de base :</span>
              <p>• <strong>BPFO</strong> = (N·f/2) · (1 - (d/D)·cos α)</p>
              <p>• <strong>BPFI</strong> = (N·f/2) · (1 + (d/D)·cos α)</p>
              <p>• <strong>BSF</strong> = (D·f / 2d) · (1 - ((d/D)·cos α)²)</p>
              <p>• <strong>FTF</strong> = (f/2) · (1 - (d/D)·cos α)</p>
            </div>
          </div>
        </div>

        {/* Right column: Calculated Values & Spectrum Plot (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className={`p-4 rounded-xl border flex flex-col gap-4 ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900/40 border-slate-800'
          }`}>
            <div className={`flex justify-between items-center border-b ${isLight ? "border-slate-300" : "border-slate-800"} pb-2`}>
              <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? "text-slate-600" : "text-slate-400"} flex items-center gap-1.5`}>
                <Activity className="w-4 h-4 text-indigo-500" />
                Projection FFT Interactive
              </span>

              {/* Cursor filters */}
              <div className="flex gap-1">
                {['all', 'BPFO', 'BPFI', 'BSF', 'FTF'].map(cType => (
                  <button
                    key={cType}
                    onClick={() => setActiveCursor(cType as any)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors uppercase ${
                      activeCursor === cType 
                        ? 'bg-indigo-600 text-white' 
                        : '${isLight ? "text-slate-600" : "text-slate-400"} hover:text-white bg-slate-800/30'
                    }`}
                  >
                    {cType === 'all' ? 'Tous' : cType}
                  </button>
                ))}
              </div>
            </div>

            {/* Canvas Area */}
            <div className={`relative border rounded-xl overflow-hidden flex items-center justify-center ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
            }`}>
              <canvas ref={canvasRef} width="600" height="220" className="w-full h-auto aspect-[60/22]" />
            </div>

            {/* Calculated Values Dashboard Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <span className="text-[10px] text-amber-500 font-bold block uppercase tracking-wider">BPFO (Bague Ext)</span>
                <span className="text-lg font-bold block font-mono text-amber-400 mt-1">{bpfo.toFixed(1)} Hz</span>
                <span className={`text-[9px] ${isLight ? "text-slate-600" : "text-slate-400"} font-mono mt-0.5 block`}>{(bpfo / fShaft).toFixed(2)}x RPM</span>
              </div>

              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <span className="text-[10px] text-emerald-500 font-bold block uppercase tracking-wider">BPFI (Bague Int)</span>
                <span className="text-lg font-bold block font-mono text-emerald-400 mt-1">{bpfi.toFixed(1)} Hz</span>
                <span className={`text-[9px] ${isLight ? "text-slate-600" : "text-slate-400"} font-mono mt-0.5 block`}>{(bpfi / fShaft).toFixed(2)}x RPM</span>
              </div>

              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <span className="text-[10px] text-blue-500 font-bold block uppercase tracking-wider">BSF (Bille)</span>
                <span className="text-lg font-bold block font-mono text-blue-400 mt-1">{bsf.toFixed(1)} Hz</span>
                <span className={`text-[9px] ${isLight ? "text-slate-600" : "text-slate-400"} font-mono mt-0.5 block`}>{(bsf / fShaft).toFixed(2)}x RPM</span>
              </div>

              <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                <span className="text-[10px] text-purple-500 font-bold block uppercase tracking-wider">FTF (Cage)</span>
                <span className="text-lg font-bold block font-mono text-purple-400 mt-1">{ftf.toFixed(1)} Hz</span>
                <span className={`text-[9px] ${isLight ? "text-slate-600" : "text-slate-400"} font-mono mt-0.5 block`}>{(ftf / fShaft).toFixed(2)}x RPM</span>
              </div>
            </div>

            {/* Details Description Footer */}
            <div className={`text-[11px] leading-relaxed p-3.5 border rounded-xl mt-1 space-y-1 ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-950/20 border-slate-800/40 text-slate-400'
            }`}>
              <p>• <strong>BPFO</strong> : Fréquence de passage de billes sur un défaut situé sur la bague externe fixe.</p>
              <p>• <strong>BPFI</strong> : Fréquence de passage de billes sur un défaut de bague interne tournante.</p>
              <p>• <strong>BSF</strong> : Fréquence de rotation de la bille sur elle-même (défaut d'un élément roulant écaillé).</p>
              <p>• <strong>FTF</strong> : Vitesse de rotation de la cage (défaut de lubrification ou de guidage structurel).</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
