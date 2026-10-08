import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, HelpCircle, Activity, Disc } from 'lucide-react';
import { SignalComponent, ModulationSettings, WindowType } from '../types';
import { fft, applyWindow } from '../utils/math';

interface SignalGeneratorProps {
  theme?: 'dark' | 'light' | 'mono';
}

export default function SignalGenerator({ theme = 'dark' }: SignalGeneratorProps) {
  const [components, setComponents] = useState<SignalComponent[]>([
    { id: '1', type: 'sine', frequency: 50, amplitude: 1.5, phase: 0 },
    { id: '2', type: 'sine', frequency: 120, amplitude: 0.8, phase: 45 },
  ]);

  const [modulation, setModulation] = useState<ModulationSettings>({
    enabled: false,
    type: 'AM',
    carrierFrequency: 200,
    modulatingFrequency: 15,
    index: 0.5,
  });

  const [windowType, setWindowType] = useState<WindowType>('hanning');
  const [noiseLevel, setNoiseLevel] = useState<number>(0.1); // g RMS
  
  const waveCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const specCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const N = 512; // FFT size
  const Fs = 1000; // Sampling frequency in Hz
  const dt = 1 / Fs;

  const [zoomRange, setZoomRange] = useState<[number, number]>([0, 500]);
  const [hoveredX, setHoveredX] = useState<number | null>(null);
  const [hoveredData, setHoveredData] = useState<{ freq: number; amp: number } | null>(null);
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [detectedPeaks, setDetectedPeaks] = useState<{ freq: number; amp: number }[]>([]);

  const magnitudesRef = useRef<Float32Array | null>(null);

  const isLight = theme === 'light';
  const isBW = theme === 'mono';

  // Generate signal and compute FFT
  useEffect(() => {
    drawGraphs();
  }, [components, modulation, windowType, noiseLevel, theme, zoomRange, hoveredX, dragStartX]);

  const addComponent = () => {
    if (components.length >= 4) return;
    const newId = (Math.max(...components.map(c => parseInt(c.id))) + 1).toString();
    setComponents([
      ...components,
      { id: newId, type: 'sine', frequency: Math.round(50 + Math.random() * 150), amplitude: 0.5, phase: 0 }
    ]);
  };

  const removeComponent = (id: string) => {
    if (components.length <= 1) return;
    setComponents(components.filter(c => c.id !== id));
  };

  const updateComponent = (id: string, field: keyof SignalComponent, val: any) => {
    setComponents(components.map(c => c.id === id ? { ...c, [field]: val } : c));
  };

  const drawGraphs = () => {
    const waveCanvas = waveCanvasRef.current;
    const specCanvas = specCanvasRef.current;
    if (!waveCanvas || !specCanvas) return;

    const wWidth = waveCanvas.clientWidth;
    const wHeight = waveCanvas.clientHeight;
    if (waveCanvas.width !== wWidth || waveCanvas.height !== wHeight) {
      waveCanvas.width = wWidth;
      waveCanvas.height = wHeight;
    }

    const sWidth = specCanvas.clientWidth;
    const sHeight = specCanvas.clientHeight;
    if (specCanvas.width !== sWidth || specCanvas.height !== sHeight) {
      specCanvas.width = sWidth;
      specCanvas.height = sHeight;
    }

    // 1. Generate Waveform Data
    const rawData = new Float32Array(N);
    const times = new Float32Array(N);

    for (let n = 0; n < N; n++) {
      const t = n * dt;
      times[n] = t;
      let val = 0;

      if (modulation.enabled) {
        // AM / FM Modulation Mode
        const carrier = Math.sin(2 * Math.PI * modulation.carrierFrequency * t);
        const modSig = Math.sin(2 * Math.PI * modulation.modulatingFrequency * t);
        if (modulation.type === 'AM') {
          val = 2.0 * (1.0 + modulation.index * modSig) * carrier;
        } else {
          val = 2.0 * Math.sin(2 * Math.PI * modulation.carrierFrequency * t + modulation.index * modSig);
        }
      } else {
        // Sum of Custom Components Mode
        for (const comp of components) {
          const angle = 2 * Math.PI * comp.frequency * t + (comp.phase * Math.PI) / 180;
          if (comp.type === 'sine') {
            val += comp.amplitude * Math.sin(angle);
          } else if (comp.type === 'square') {
            val += comp.amplitude * Math.sign(Math.sin(angle));
          } else if (comp.type === 'sawtooth') {
            val += comp.amplitude * (2 * (t * comp.frequency - Math.floor(t * comp.frequency + 0.5)));
          }
        }
      }

      const noise = (Math.random() + Math.random() + Math.random() - 1.5) * noiseLevel * 1.414;
      rawData[n] = val + noise;
    }

    // 2. Plot Raw Waveform (Time Domain)
    const wCtx = waveCanvas.getContext('2d');
    if (wCtx) {
      wCtx.clearRect(0, 0, wWidth, wHeight);

      // Grid
      wCtx.strokeStyle = isLight ? 'rgba(15, 23, 42, 0.06)' : 'rgba(71, 85, 105, 0.15)';
      wCtx.lineWidth = 1;
      for (let i = 1; i < 8; i++) {
        const x = (wWidth / 8) * i;
        wCtx.beginPath(); wCtx.moveTo(x, 0); wCtx.lineTo(x, wHeight); wCtx.stroke();
      }
      for (let i = 1; i < 6; i++) {
        const y = (wHeight / 6) * i;
        wCtx.beginPath(); wCtx.moveTo(0, y); wCtx.lineTo(wWidth, y); wCtx.stroke();
      }

      // Zero line
      const zeroY = wHeight / 2;
      wCtx.strokeStyle = isLight ? 'rgba(15, 23, 42, 0.15)' : 'rgba(148, 163, 184, 0.3)';
      wCtx.beginPath(); wCtx.moveTo(0, zeroY); wCtx.lineTo(wWidth, zeroY); wCtx.stroke();

      // Find max abs amplitude for scaling
      let maxVal = 0.5;
      for (let n = 0; n < N; n++) {
        const absVal = Math.abs(rawData[n]);
        if (absVal > maxVal) maxVal = absVal;
      }
      maxVal *= 1.15; // padding

      // Wave path
      wCtx.strokeStyle = isLight ? '#0284c7' : (isBW ? '#a1a1aa' : '#38bdf8'); // sky-400
      wCtx.lineWidth = 2;
      wCtx.beginPath();
      const drawLimit = 150;
      for (let n = 0; n < drawLimit; n++) {
        const x = (n / (drawLimit - 1)) * wWidth;
        const y = zeroY - (rawData[n] / maxVal) * (wHeight * 0.45);
        if (n === 0) wCtx.moveTo(x, y);
        else wCtx.lineTo(x, y);
      }
      wCtx.stroke();
    }

    // 3. Apply Windowing and FFT
    const { windowed, gainCompensation } = applyWindow(rawData, windowType);
    const real = new Float32Array(N);
    const imag = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      real[i] = windowed[i];
      imag[i] = 0;
    }

    fft(real, imag);

    const spectrumSize = N / 2;
    const magnitudes = new Float32Array(spectrumSize);
    
    for (let i = 0; i < spectrumSize; i++) {
      const mag = Math.sqrt(real[i] * real[i] + imag[i] * imag[i]);
      let ampComp = (i === 0 ? 1 : 2) / N;
      magnitudes[i] = (mag * ampComp) / gainCompensation;
    }

    // Save magnitudes in ref for mouse handlers
    magnitudesRef.current = magnitudes;

    // 4. Plot Magnitude Spectrum (Frequency Domain)
    const sCtx = specCanvas.getContext('2d');
    if (sCtx) {
      sCtx.clearRect(0, 0, sWidth, sHeight);

      const fMin = zoomRange[0];
      const fMax = zoomRange[1];
      const fSpan = fMax - fMin;
      
      const bottomPadding = 24;
      const plotHeight = sHeight - bottomPadding;

      // Dynamic Grid based on zoom
      sCtx.strokeStyle = isLight ? 'rgba(15, 23, 42, 0.06)' : 'rgba(71, 85, 105, 0.15)';
      sCtx.lineWidth = 1;
      
      let step = 50;
      if (fSpan <= 50) step = 5;
      else if (fSpan <= 100) step = 10;
      else if (fSpan <= 250) step = 25;
      
      const firstGridVal = Math.ceil(fMin / step) * step;

      for (let f = firstGridVal; f <= fMax; f += step) {
        const x = ((f - fMin) / fSpan) * sWidth;
        sCtx.beginPath();
        sCtx.moveTo(x, 0);
        sCtx.lineTo(x, plotHeight);
        sCtx.stroke();
      }

      // Horizontal grid lines
      for (let i = 1; i < 6; i++) {
        const y = (plotHeight / 6) * i;
        sCtx.beginPath();
        sCtx.moveTo(0, y);
        sCtx.lineTo(sWidth, y);
        sCtx.stroke();
      }

      // Find max amp in spectrum for scaling
      let maxSpecVal = 0.5;
      for (let i = 1; i < spectrumSize; i++) {
        if (magnitudes[i] > maxSpecVal) maxSpecVal = magnitudes[i];
      }
      maxSpecVal *= 1.2;

      // Create Gradient for fill
      const grad = sCtx.createLinearGradient(0, plotHeight * 0.12, 0, plotHeight);
      if (isLight) {
        grad.addColorStop(0, 'rgba(124, 58, 237, 0.4)');
        grad.addColorStop(1, 'rgba(124, 58, 237, 0.01)');
      } else if (isBW) {
        grad.addColorStop(0, 'rgba(161, 161, 170, 0.4)');
        grad.addColorStop(1, 'rgba(161, 161, 170, 0.01)');
      } else {
        grad.addColorStop(0, 'rgba(168, 85, 247, 0.4)');
        grad.addColorStop(1, 'rgba(168, 85, 247, 0.01)');
      }

      // Plot spectrum lines
      sCtx.strokeStyle = isLight ? '#7c3aed' : (isBW ? '#a1a1aa' : '#a855f7'); // purple-500
      sCtx.lineWidth = 2.5;
      
      // Add glow effect
      sCtx.shadowBlur = 8;
      sCtx.shadowColor = isLight ? 'rgba(124, 58, 237, 0.4)' : (isBW ? 'rgba(161, 161, 170, 0.4)' : 'rgba(168, 85, 247, 0.6)');

      sCtx.beginPath();

      const pathPoints: {x: number, y: number}[] = [];

      let firstVisible = true;
      for (let i = 0; i < spectrumSize; i++) {
        const freq = (i * Fs) / N;
        const x = ((freq - fMin) / fSpan) * sWidth;
        const y = plotHeight - (magnitudes[i] / maxSpecVal) * (plotHeight * 0.88);

        pathPoints.push({x, y});

        if (firstVisible) {
          sCtx.moveTo(x, y);
          firstVisible = false;
        } else {
          sCtx.lineTo(x, y);
        }
      }
      sCtx.stroke();

      // Reset shadow before fill and other elements
      sCtx.shadowBlur = 0;
      
      // Fill under curve
      if (pathPoints.length > 0) {
        sCtx.beginPath();
        sCtx.moveTo(pathPoints[0].x, plotHeight);
        for (const p of pathPoints) {
          sCtx.lineTo(p.x, p.y);
        }
        sCtx.lineTo(pathPoints[pathPoints.length - 1].x, plotHeight);
        sCtx.closePath();
        sCtx.fillStyle = grad;
        sCtx.fill();
      }

      // Find all peaks
      const allPeaks: { freq: number; amp: number }[] = [];
      const threshold = maxSpecVal * 0.05;

      for (let i = 1; i < spectrumSize - 1; i++) {
        if (magnitudes[i] > magnitudes[i - 1] && magnitudes[i] > magnitudes[i + 1] && magnitudes[i] > threshold) {
          allPeaks.push({
            amp: magnitudes[i],
            freq: (i * Fs) / N
          });
        }
      }
      allPeaks.sort((a, b) => b.amp - a.amp);

      // Save top peaks to state if they have changed to prevent infinite loops (done carefully inside setTimeout)
      const topPeaksToSave = allPeaks.slice(0, 6);
      setTimeout(() => {
        setDetectedPeaks(topPeaksToSave);
      }, 0);

      // Draw visible peak markers and labels
      sCtx.font = 'bold 9px JetBrains Mono, monospace';
      sCtx.fillStyle = isLight ? '#6d28d9' : '#c084fc';
      
      const visiblePeaks = allPeaks.filter(p => p.freq >= fMin && p.freq <= fMax).slice(0, 4);
      visiblePeaks.forEach((p) => {
        const x = ((p.freq - fMin) / fSpan) * sWidth;
        const y = plotHeight - (p.amp / maxSpecVal) * (plotHeight * 0.88);
        
        sCtx.beginPath();
        sCtx.arc(x, y, 3.5, 0, 2 * Math.PI);
        sCtx.fill();

        const text = `${p.freq.toFixed(1)}Hz (${p.amp.toFixed(2)}g)`;
        sCtx.fillText(text, x - 15, y - 8);
      });

      // --- DRAW DEDICATED FREQUENCY AXIS BELT ---
      sCtx.fillStyle = isLight ? '#f8fafc' : '#0b0f19';
      sCtx.fillRect(0, plotHeight, sWidth, bottomPadding);

      sCtx.strokeStyle = isLight ? '#cbd5e1' : '#334155';
      sCtx.lineWidth = 1.5;
      sCtx.beginPath();
      sCtx.moveTo(0, plotHeight);
      sCtx.lineTo(sWidth, plotHeight);
      sCtx.stroke();

      // Draw frequency ticks and text
      sCtx.font = 'bold 9px JetBrains Mono, monospace';
      for (let f = firstGridVal; f <= fMax; f += step) {
        const x = ((f - fMin) / fSpan) * sWidth;
        
        // Tick mark
        sCtx.strokeStyle = isLight ? '#94a3b8' : '#475569';
        sCtx.lineWidth = 1;
        sCtx.beginPath();
        sCtx.moveTo(x, plotHeight);
        sCtx.lineTo(x, plotHeight + 4);
        sCtx.stroke();

        // Label
        sCtx.fillStyle = isLight ? '#334155' : '#cbd5e1';
        sCtx.fillText(`${f.toFixed(0)} Hz`, x + 3, sHeight - 7);
      }

      // Draw hover line and info bubble
      if (hoveredX !== null && hoveredData) {
        // Draw vertical red dashed line
        sCtx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
        sCtx.lineWidth = 1;
        sCtx.setLineDash([4, 4]);
        sCtx.beginPath();
        sCtx.moveTo(hoveredX, 0);
        sCtx.lineTo(hoveredX, plotHeight);
        sCtx.stroke();
        sCtx.setLineDash([]); // Reset dashed

        // Hover tooltip bubble
        const { freq, amp } = hoveredData;
        sCtx.font = '10px JetBrains Mono, monospace';
        const txt = `${freq.toFixed(1)} Hz | ${amp.toFixed(2)} g`;
        const txtWidth = sCtx.measureText(txt).width;
        
        let bubbleX = hoveredX + 12;
        let bubbleY = 16;
        if (bubbleX + txtWidth + 16 > sWidth) {
          bubbleX = hoveredX - txtWidth - 16;
        }

        sCtx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        sCtx.strokeStyle = '#ef4444';
        sCtx.lineWidth = 1;
        
        sCtx.beginPath();
        if (sCtx.roundRect) {
          sCtx.roundRect(bubbleX, bubbleY, txtWidth + 10, 18, 4);
        } else {
          sCtx.rect(bubbleX, bubbleY, txtWidth + 10, 18);
        }
        sCtx.fill();
        sCtx.stroke();

        sCtx.fillStyle = '#ffffff';
        sCtx.fillText(txt, bubbleX + 5, bubbleY + 12);
      }

      // Draw drag-to-zoom selection overlay rectangle
      if (dragStartX !== null && hoveredX !== null) {
        sCtx.fillStyle = 'rgba(59, 130, 246, 0.25)'; // semi-transparent blue
        sCtx.strokeStyle = 'rgba(59, 130, 246, 0.7)';
        sCtx.lineWidth = 1.5;
        const xStart = dragStartX;
        const xEnd = hoveredX;
        sCtx.beginPath();
        sCtx.rect(xStart, 0, xEnd - xStart, plotHeight);
        sCtx.fill();
        sCtx.stroke();
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = specCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    const freq = zoomRange[0] + pct * (zoomRange[1] - zoomRange[0]);
    
    const df = Fs / N;
    const idx = Math.round(freq / df);
    let amp = 0;
    if (magnitudesRef.current && idx >= 0 && idx < magnitudesRef.current.length) {
      amp = magnitudesRef.current[idx];
    }
    
    setHoveredX(x);
    setHoveredData({ freq, amp });
  };

  const handleMouseLeave = () => {
    setHoveredX(null);
    setHoveredData(null);
    setDragStartX(null);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = specCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    setDragStartX(x);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (dragStartX === null || hoveredX === null) {
      setDragStartX(null);
      return;
    }
    
    const canvas = specCanvasRef.current;
    if (!canvas) {
      setDragStartX(null);
      return;
    }
    
    const width = canvas.width / (window.devicePixelRatio || 1);
    const diff = Math.abs(hoveredX - dragStartX);
    
    if (diff > 8) {
      const pct1 = Math.max(0, Math.min(1, dragStartX / width));
      const pct2 = Math.max(0, Math.min(1, hoveredX / width));
      const f1 = zoomRange[0] + pct1 * (zoomRange[1] - zoomRange[0]);
      const f2 = zoomRange[0] + pct2 * (zoomRange[1] - zoomRange[0]);
      
      const newMin = Math.max(0, Math.min(f1, f2));
      const newMax = Math.min(500, Math.max(f1, f2));
      
      if (newMax - newMin > 5) {
        setZoomRange([newMin, newMax]);
      }
    }
    setDragStartX(null);
  };

  const zoomToPeak = (peakFreq: number) => {
    const halfWidth = 30; // focus on +/- 30Hz range
    const minF = Math.max(0, peakFreq - halfWidth);
    const maxF = Math.min(500, peakFreq + halfWidth);
    setZoomRange([minF, maxF]);
  };

  return (
    <div className="space-y-6" id="signal-spectrum-generator">
      {/* Intro Banner */}
      <div className={`border p-4 rounded-xl flex items-start gap-3 shadow-inner ${
        isLight
          ? 'bg-slate-50 border-slate-200 text-slate-700'
          : (isBW ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-900/50 border-slate-800 text-slate-300')
      }`}>
        <Activity className="w-5 h-5 text-blue-400 mt-0.5 shrink-0 animate-pulse" />
        <div className="text-sm space-y-1">
          <p>
            Créez des signaux vibratoires complexes en additionnant des ondes élémentaires ou en simulant une 
            <strong> Modulation d'Amplitude (AM) / Fréquence (FM)</strong>.
          </p>
          <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Observez l'effet des différentes <strong>fenêtres de pondération FFT</strong> (Hanning, Flat Top, etc.) sur la résolution d'amplitude et la dispersion spectrale (fuite d'énergie).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Waveform Parameters (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className={`border p-5 rounded-xl space-y-4 relative ${
            isLight
              ? 'bg-white border-slate-200 shadow-sm text-slate-800'
              : (isBW ? 'bg-slate-950 border-slate-800 text-white' : 'bg-[#1E293B] border-slate-700/60 shadow-lg text-white')
          }`}>
            
            {/* Mode Selector */}
            <div className={`flex p-1 rounded-lg border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/90 border-slate-800'
            }`}>
              <button
                onClick={() => setModulation({ ...modulation, enabled: false })}
                className={`flex-1 text-center py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  !modulation.enabled 
                    ? 'bg-blue-600 text-white shadow-md border-blue-500' 
                    : '${isLight ? "text-slate-600" : "text-slate-400"} hover:text-slate-250 hover:text-slate-800'
                }`}
              >
                Somme d'harmoniques
              </button>
              <button
                onClick={() => setModulation({ ...modulation, enabled: true })}
                className={`flex-1 text-center py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  modulation.enabled 
                    ? 'bg-blue-600 text-white shadow-md border-blue-500' 
                    : '${isLight ? "text-slate-600" : "text-slate-400"} hover:text-slate-250 hover:text-slate-800'
                }`}
              >
                Modulation AM/FM
              </button>
            </div>

            {/* Config 1: Sum of Components */}
            {!modulation.enabled ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className={`text-xs font-bold tracking-widest uppercase ${isLight ? 'text-slate-800' : 'text-white'}`}>
                    Composantes de Signal
                  </span>
                  <button
                    onClick={addComponent}
                    disabled={components.length >= 4}
                    className="flex items-center gap-1 text-[11px] font-bold text-blue-500 hover:text-blue-400 disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Ajouter
                  </button>
                </div>

                <div className="space-y-3.5 max-h-[280px] overflow-y-auto pr-1">
                  {components.map((comp, idx) => (
                    <div key={comp.id} className={`border p-3.5 rounded-xl space-y-2.5 relative shadow-inner ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
                    }`}>
                      {components.length > 1 && (
                        <button
                          onClick={() => removeComponent(comp.id)}
                          className={`absolute top-2.5 right-2.5 ${isLight ? "text-slate-600" : "text-slate-400"} hover:text-red-500 transition-colors cursor-pointer`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-bold ${isLight ? 'text-blue-600' : 'text-blue-400'}`}>
                          Harmonique #{idx + 1}
                        </span>
                        <select
                          value={comp.type}
                          onChange={(e) => updateComponent(comp.id, 'type', e.target.value)}
                          className={`border text-[10px] rounded px-1.5 py-0.5 outline-none focus:border-blue-500 ${
                            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-950 border-slate-800 text-slate-300'
                          }`}
                        >
                          <option value="sine">Sinusoïde</option>
                          <option value="square">Carré</option>
                          <option value="sawtooth">Dent de scie</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-[10px]">
                        <div className="space-y-1">
                          <span className={isLight ? 'text-slate-550' : 'text-slate-400'}>Freq: {comp.frequency} Hz</span>
                          <input
                            type="range"
                            min="5"
                            max="450"
                            step="1"
                            value={comp.frequency}
                            onChange={(e) => updateComponent(comp.id, 'frequency', parseInt(e.target.value))}
                            className="w-full accent-blue-500 h-1 bg-slate-200 dark:bg-slate-950 rounded"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className={isLight ? 'text-slate-550' : 'text-slate-400'}>Amp: {comp.amplitude.toFixed(2)} g</span>
                          <input
                            type="range"
                            min="0.05"
                            max="3.0"
                            step="0.05"
                            value={comp.amplitude}
                            onChange={(e) => updateComponent(comp.id, 'amplitude', parseFloat(e.target.value))}
                            className="w-full accent-blue-500 h-1 bg-slate-200 dark:bg-slate-950 rounded"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Config 2: Modulation settings */
              <div className="space-y-4">
                <div className="flex justify-between items-center gap-2">
                  <span className={`text-xs font-bold tracking-widest uppercase ${isLight ? 'text-slate-800' : 'text-white'}`}>
                    Modulation
                  </span>
                  <select
                    value={modulation.type}
                    onChange={(e) => setModulation({ ...modulation, type: e.target.value as 'AM' | 'FM' })}
                    className={`border text-xs rounded-lg px-2.5 py-1 outline-none focus:border-blue-500 shadow-md ${
                      isLight ? 'bg-slate-50 border-slate-200 text-slate-850' : 'bg-slate-900 border-slate-800 text-slate-300'
                    }`}
                  >
                    <option value="AM">Modulation d'Amplitude (AM)</option>
                    <option value="FM">Modulation de Fréquence (FM)</option>
                  </select>
                </div>

                <div className={`border p-4 rounded-xl space-y-4 shadow-inner ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
                }`}>
                  {/* Carrier Freq */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Porteuse (Fc)</span>
                      <span className={`font-mono font-semibold ${isLight ? 'text-blue-600' : 'text-blue-400'}`}>
                        {modulation.carrierFrequency} Hz
                      </span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="400"
                      step="2"
                      value={modulation.carrierFrequency}
                      onChange={(e) => setModulation({ ...modulation, carrierFrequency: parseInt(e.target.value) })}
                      className="w-full accent-blue-500 h-1.5 bg-slate-200 dark:bg-slate-950 rounded-lg"
                    />
                  </div>

                  {/* Modulating Freq */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Modulatrice (Fm - Fréquence défaut)</span>
                      <span className={`font-mono font-semibold ${isLight ? 'text-blue-600' : 'text-blue-400'}`}>
                        {modulation.modulatingFrequency} Hz
                      </span>
                    </div>
                    <input
                      type="range"
                      min="2"
                      max="50"
                      step="1"
                      value={modulation.modulatingFrequency}
                      onChange={(e) => setModulation({ ...modulation, modulatingFrequency: parseInt(e.target.value) })}
                      className="w-full accent-blue-500 h-1.5 bg-slate-200 dark:bg-slate-950 rounded-lg"
                    />
                  </div>

                  {/* Modulation Index */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>
                        {modulation.type === 'AM' ? "Taux d'index (m)" : "Index de modulation (β)"}
                      </span>
                      <span className={`font-mono font-semibold ${isLight ? 'text-blue-600' : 'text-blue-400'}`}>
                        {modulation.index.toFixed(2)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.05"
                      max={modulation.type === 'AM' ? '1.0' : '4.0'}
                      step="0.05"
                      value={modulation.index}
                      onChange={(e) => setModulation({ ...modulation, index: parseFloat(e.target.value) })}
                      className="w-full accent-blue-500 h-1.5 bg-slate-200 dark:bg-slate-950 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Signal Noise & Window Settings */}
            <div className={`border-t pt-4 space-y-4 ${isLight ? 'border-slate-100' : 'border-slate-700/50'}`}>
              <span className={`text-xs font-bold tracking-widest uppercase block ${isLight ? 'text-slate-800' : 'text-white'}`}>
                Traitement du Signal
              </span>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Window Selector */}
                <div className="space-y-1.5">
                  <span className={`text-[11px] block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Fenêtre FFT (Window)
                  </span>
                  <select
                    value={windowType}
                    onChange={(e) => setWindowType(e.target.value as WindowType)}
                    className={`border text-xs rounded-lg px-2.5 py-1.5 outline-none focus:border-blue-500 ${
                      isLight ? 'bg-slate-50 border-slate-200 text-slate-850' : 'bg-slate-900 border-slate-800 text-slate-300'
                    }`}
                  >
                    <option value="rectangular">Rectangulaire (Aucune)</option>
                    <option value="hanning">Hanning (Recommandé)</option>
                    <option value="hamming">Hamming</option>
                    <option value="flattop">Flat Top (Amplitude max)</option>
                  </select>
                </div>

                {/* Noise Level */}
                <div className="space-y-1.5">
                  <span className={`text-[11px] block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Bruit de fond (RMS)
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="0.8"
                      step="0.05"
                      value={noiseLevel}
                      onChange={(e) => setNoiseLevel(parseFloat(e.target.value))}
                      className="flex-1 accent-blue-500 h-1.5 bg-slate-200 dark:bg-slate-950 rounded-lg cursor-pointer"
                    />
                    <span className={`font-mono text-[10px] shrink-0 w-8 text-right ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      {noiseLevel.toFixed(2)}g
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Oscilloscope and Spectrum plots (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Time Domain Waveform */}
          <div className={`rounded-xl border p-4 flex flex-col min-h-[190px] shadow-inner relative ${
            isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-900/50 border-slate-800 text-white'
          }`}>
            <h4 className="text-xs font-bold tracking-widest uppercase mb-2 flex items-center gap-1.5">
              <Disc className="w-3.5 h-3.5 text-blue-500 animate-spin" />
              Domaine Temporel : Signal Résultant (premiers 150 points)
            </h4>
            <div className={`relative flex-1 w-full rounded-xl overflow-hidden min-h-[120px] border ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#0F172A] border-slate-800'
            }`}>
              <canvas ref={waveCanvasRef} className="absolute inset-0 w-full h-full" />
            </div>
          </div>

          {/* Frequency Domain Spectrum */}
          <div className={`rounded-xl border p-5 flex flex-col min-h-[340px] shadow-lg relative ${
            isLight ? 'bg-slate-50 border-slate-200 text-slate-850' : 'bg-slate-900/50 border-slate-800 text-white'
          }`}>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-3 border-b border-slate-850/40 pb-2">
              <div className="flex flex-col">
                <h4 className="text-xs font-bold tracking-widest uppercase flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
                  Analyse FFT : Spectre Fréquentiel Interactif
                </h4>
                <span className={`text-[10px] mt-0.5 ${isLight ? 'text-slate-600 font-medium' : 'text-slate-400'}`}>
                  Glissez pour zoomer • Survolez pour mesurer • Double-cliquez pour réinitialiser
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${
                  isLight ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}>
                  Zoom visible : {zoomRange[0].toFixed(0)} - {zoomRange[1].toFixed(0)} Hz
                </span>
                <button
                  onClick={() => setZoomRange([0, 500])}
                  className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded border transition-all cursor-pointer ${
                    isLight 
                      ? 'border-slate-200 bg-slate-100 text-blue-600 hover:text-white hover:bg-blue-600 hover:border-blue-500' 
                      : 'border-slate-700 bg-slate-900/80 text-blue-400 hover:text-white hover:bg-blue-600 hover:border-blue-500'
                  }`}
                  title="Réinitialiser le zoom"
                >
                  Reset (1x)
                </button>
              </div>
            </div>

            {/* Quick Zoom Preset Buttons */}
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              <span className="text-[10px] text-slate-450 self-center mr-1">Raccourcis Zoom :</span>
              <button
                onClick={() => setZoomRange([0, 100])}
                className={`px-2 py-0.5 text-[10px] rounded border transition-all cursor-pointer ${
                  zoomRange[0] === 0 && zoomRange[1] === 100
                    ? 'bg-blue-600 text-white border-blue-500 font-semibold'
                    : '${isLight ? "bg-slate-50" : "bg-slate-950/40"} ${isLight ? "border-slate-300" : "border-slate-800"} ${isLight ? "text-slate-600" : "text-slate-400"} hover:text-white hover:border-slate-700'
                }`}
              >
                [0 - 100 Hz] Basse Fréq.
              </button>
              <button
                onClick={() => setZoomRange([0, 250])}
                className={`px-2 py-0.5 text-[10px] rounded border transition-all cursor-pointer ${
                  zoomRange[0] === 0 && zoomRange[1] === 250
                    ? 'bg-blue-600 text-white border-blue-500 font-semibold'
                    : '${isLight ? "bg-slate-50" : "bg-slate-950/40"} ${isLight ? "border-slate-300" : "border-slate-800"} ${isLight ? "text-slate-600" : "text-slate-400"} hover:text-white hover:border-slate-700'
                }`}
              >
                [0 - 250 Hz] Moyenne Fréq.
              </button>
              <button
                onClick={() => setZoomRange([0, 500])}
                className={`px-2 py-0.5 text-[10px] rounded border transition-all cursor-pointer ${
                  zoomRange[0] === 0 && zoomRange[1] === 500
                    ? 'bg-blue-600 text-white border-blue-500 font-semibold'
                    : '${isLight ? "bg-slate-50" : "bg-slate-950/40"} ${isLight ? "border-slate-300" : "border-slate-800"} ${isLight ? "text-slate-600" : "text-slate-400"} hover:text-white hover:border-slate-700'
                }`}
              >
                [0 - 500 Hz] Spectre Complet
              </button>
            </div>

            <div className={`relative flex-1 w-full rounded-xl overflow-hidden min-h-[170px] border cursor-crosshair select-none ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#0F172A] border-slate-800'
            }`}>
              <canvas
                ref={specCanvasRef}
                className="absolute inset-0 w-full h-full"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onDoubleClick={() => setZoomRange([0, 500])}
              />
            </div>

            {/* Peaks List & Info Bar */}
            <div className={`mt-3 border-t pt-2.5 ${isLight ? 'border-slate-200' : 'border-slate-800/40'}`}>
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                  isLight ? 'text-purple-700' : 'text-purple-400'
                }`}>
                  🎯 Principaux Pics Détectés ({detectedPeaks.length}) :
                </span>
                <span className={`text-[9px] italic ${isLight ? 'text-slate-600 font-medium' : 'text-slate-400'}`}>
                  Cliquez sur un pic pour zoomer directement dessus
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {detectedPeaks.length > 0 ? (
                  detectedPeaks.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => zoomToPeak(p.freq)}
                      className={`px-2 py-1 rounded border text-[10px] font-mono transition-all flex items-center gap-1 cursor-pointer ${
                        isLight
                          ? 'bg-purple-100/80 hover:bg-purple-600 border-purple-200 hover:border-purple-500 text-purple-850 hover:text-white'
                          : 'bg-purple-900/20 border border-purple-800/60 hover:bg-purple-600 hover:border-purple-500 hover:text-white text-purple-300'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isLight ? 'bg-purple-600' : 'bg-purple-400'}`} />
                      <strong>{p.freq.toFixed(1)} Hz</strong> ({p.amp.toFixed(2)} g)
                    </button>
                  ))
                ) : (
                  <span className={`text-[10px] italic ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Aucun pic détecté au-dessus du bruit de fond.</span>
                )}
              </div>
            </div>
          </div>

          {/* Education panel on Windows */}
          <div className={`border p-4 rounded-xl text-[11px] space-y-2 relative shadow-lg ${
            isLight
              ? 'bg-white border-slate-200 text-slate-650'
              : 'bg-[#1E293B] border-slate-700/60 ${isLight ? "text-slate-700" : "text-slate-300"}'
          }`}>
            <span className={`font-bold uppercase tracking-wider block flex items-center gap-1 text-[10px] ${
              isLight ? 'text-slate-850' : 'text-white'
            }`}>
              <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
              Rôle de la fenêtre d'analyse (Windowing) :
            </span>
            <p className="leading-relaxed">
              Par défaut, la FFT suppose que le signal est périodique sur le bloc de 512 points. Si les signaux ne s'alignent pas exactement (fuite spectrale), de fausses fréquences apparaissent dans le spectre.
            </p>
            <p className={`leading-relaxed ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              • <strong>Rectangulaire</strong> : Idéal pour les signaux transitoires. Offre la meilleure résolution de fréquence mais génère de fortes lobes secondaires (fuites).<br />
              • <strong>Hanning</strong> : Excellent compromis universel en vibration industrielle. Réduit grandement les lobes secondaires au prix d'un léger élargissement des pics.<br />
              • <strong>Flat Top</strong> : Précision maximale sur la mesure d'amplitude des pics, mais élargit beaucoup les pics. Utilisé pour calibrer les niveaux exacts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
