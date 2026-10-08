import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  Info, 
  Zap, 
  ChevronRight, 
  ChevronLeft,
  Activity,
  Gauge,
  HelpCircle
} from 'lucide-react';

interface WaveformPhaseSimulatorProps {
  theme?: 'dark' | 'light' | 'mono';
}

type ConceptType = 'period' | 'freq' | 'amp_pk' | 'amp_pp' | 'amp_rms' | null;

export default function WaveformPhaseSimulator({ theme = 'dark' }: WaveformPhaseSimulatorProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [frequency, setFrequency] = useState(5.0); // Hz
  const [amplitude, setAmplitude] = useState(5.0); // Normalized units
  const [showDisp, setShowDisp] = useState(true);
  const [showVel, setShowVel] = useState(true);
  const [showAccel, setShowAccel] = useState(true);

  // Advanced Animation states
  const [animSpeed, setAnimSpeed] = useState<number>(1.0); // 1.0, 0.5, 0.1, 0.0 (Step)
  const [hoveredConcept, setHoveredConcept] = useState<ConceptType>(null);

  // Shock impulses (defect simulation)
  const [shockEnabled, setShockEnabled] = useState(false);
  const [shockSeverity, setShockSeverity] = useState(5.0); // 1 to 10

  // Real-time statistical metrics calculated from the screen samples
  const [stats, setStats] = useState({
    rms: 0,
    peak: 0,
    crest: 1.414,
    kurtosis: 1.5
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const phasorRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const timeRef = useRef<number>(0);
  const lastStatsUpdateRef = useRef<number>(0);

  const isLight = theme === 'light';
  const isBW = theme === 'mono';

  // Physics parameter calculations
  const periodSec = 1 / frequency;
  const periodMs = periodSec * 1000;
  const frequencyCpm = frequency * 60;

  // Exact math representing decaying spall impacts (bearing shock impulses)
  const getShockValue = (t: number) => {
    // Defect frequency tracks the motor rotational speed (3.2x multiplier)
    const f_defect = 3.2 * frequency;
    const T_defect = 1 / f_defect;
    const decay = 18 * frequency; // Decay speed relative to speed
    const f_res = 14 * frequency; // High frequency structural resonance of the bearing housing

    // Find previous defect triggers
    const t_start = Math.floor((t - T_defect * 2.5) / T_defect) * T_defect;
    let val = 0;
    for (let td = t_start; td <= t + T_defect; td += T_defect) {
      if (t >= td) {
        const dt_shock = t - td;
        // Decade pulse function
        val += (shockSeverity * 0.45) * Math.exp(-decay * dt_shock) * Math.sin(2 * Math.PI * f_res * dt_shock);
      }
    }
    return val;
  };

  // Helper to compute stats over a fixed block of 150 points
  const calcStats = (samples: number[]) => {
    if (samples.length === 0) return { rms: 0, peak: 0, crest: 1.414, kurtosis: 1.5 };
    
    let sum = 0;
    let maxAbs = 0;
    for (const val of samples) {
      sum += val;
      if (Math.abs(val) > maxAbs) maxAbs = Math.abs(val);
    }
    const mean = sum / samples.length;
    
    let sumSq = 0;
    for (const val of samples) {
      sumSq += (val - mean) * (val - mean);
    }
    const variance = sumSq / samples.length;
    const rms = Math.sqrt(variance);
    
    let sum4 = 0;
    for (const val of samples) {
      sum4 += Math.pow(val - mean, 4);
    }
    
    const denom = Math.pow(variance, 2);
    // Normalized kurtosis: 1.5 for sine wave, 3.0 for gaussian noise, spikes are much higher
    const kurtosis = denom > 0.0001 ? sum4 / samples.length / denom : 1.5;
    const crest = rms > 0.0001 ? maxAbs / rms : 1.414;
    
    return { rms, peak: maxAbs, crest, kurtosis };
  };

  // Animate the physical relationship
  useEffect(() => {
    let lastTime = performance.now();

    const draw = (timestamp: number) => {
      const delta = (timestamp - lastTime) / 1000;
      lastTime = timestamp;

      if (isPlaying && animSpeed > 0) {
        timeRef.current += delta * animSpeed;
      }

      drawPlots();
      drawPhasors();

      animationRef.current = requestAnimationFrame(draw);
    };

    animationRef.current = requestAnimationFrame(draw);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [
    isPlaying, 
    frequency, 
    amplitude, 
    showDisp, 
    showVel, 
    showAccel, 
    animSpeed, 
    hoveredConcept, 
    shockEnabled, 
    shockSeverity, 
    theme
  ]);

  // Handle single frame step
  const handleStep = (direction: 'forward' | 'backward') => {
    const stepSize = 0.008 / frequency; // Fraction of a period
    if (direction === 'forward') {
      timeRef.current += stepSize;
    } else {
      timeRef.current -= stepSize;
    }
    drawPlots();
    drawPhasors();
  };

  // Redraw plot canvas
  const drawPlots = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear and match dpi
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    ctx.clearRect(0, 0, width, height);

    // Draw Grid
    ctx.strokeStyle = isLight ? 'rgba(15, 23, 42, 0.06)' : (isBW ? 'rgba(255, 255, 255, 0.08)' : 'rgba(71, 85, 105, 0.15)');
    ctx.lineWidth = 1;
    const gridCols = 8;
    const gridRows = 6;

    // Vertical grid lines
    for (let i = 1; i < gridCols; i++) {
      const x = (width / gridCols) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    // Horizontal grid lines
    for (let i = 1; i < gridRows; i++) {
      const y = (height / gridRows) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Zero center line
    const zeroY = height / 2;
    ctx.strokeStyle = isLight ? 'rgba(15, 23, 42, 0.15)' : (isBW ? 'rgba(255, 255, 255, 0.3)' : 'rgba(148, 163, 184, 0.4)');
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, zeroY);
    ctx.lineTo(width, zeroY);
    ctx.stroke();

    const tOffset = timeRef.current;
    const scaleY = height / 4; // Max amplitude scaling
    const T_view = 1.5 / frequency; // Show exactly 1.5 periods on screen

    // Gather 150 points to compute stats representing the visible screen
    const sampleVals: number[] = [];
    for (let i = 0; i < 150; i++) {
      const t = tOffset + (i / 150) * T_view;
      const angle = 2 * Math.PI * frequency * t;
      let baseVal = amplitude * 0.4 * Math.sin(angle + Math.PI); // Aligns with accel
      if (shockEnabled) {
        baseVal += getShockValue(t);
      }
      baseVal += Math.sin(t * 3000) * 0.03; // Tiny noise
      sampleVals.push(baseVal);
    }

    // Update statistics at a throttled rate to guarantee perfect performance
    const calculated = calcStats(sampleVals);
    const now = performance.now();
    if (now - lastStatsUpdateRef.current > 120) {
      setStats(calculated);
      lastStatsUpdateRef.current = now;
    }

    // Draw Displacement (Deplacement) - Sine wave
    if (showDisp) {
      ctx.strokeStyle = isLight ? '#2563eb' : (isBW ? '#ffffff' : '#3b82f6'); // Blue vs White vs sky-blue
      ctx.setLineDash([]);
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let x = 0; x < width; x++) {
        const t = tOffset + (x / width) * T_view;
        const angle = 2 * Math.PI * frequency * t;
        let val = amplitude * 0.4 * Math.sin(angle);

        if (shockEnabled) {
          val += getShockValue(t) * 0.05;
        }

        const y = zeroY + val * scaleY;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Draw Velocity (Vitesse) - Leads Displacement by 90°
    if (showVel) {
      ctx.strokeStyle = isLight ? '#16a34a' : (isBW ? '#a1a1aa' : '#22c55e'); // Green vs zinc-mono vs green-lime
      ctx.setLineDash(isBW ? [10, 6] : []);
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let x = 0; x < width; x++) {
        const t = tOffset + (x / width) * T_view;
        const angle = 2 * Math.PI * frequency * t;
        let val = amplitude * 0.4 * Math.sin(angle + Math.PI / 2);

        if (shockEnabled) {
          val += getShockValue(t) * 0.25;
        }

        const y = zeroY + val * scaleY;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Draw Acceleration (Acceleration) - Leads Velocity by 90° / out of phase with Disp by 180°
    if (showAccel) {
      ctx.strokeStyle = isLight ? '#dc2626' : (isBW ? '#e4e4e7' : '#ef4444'); // Red vs light-zinc vs red
      ctx.setLineDash(isBW ? [2, 4] : []);
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let x = 0; x < width; x++) {
        const t = tOffset + (x / width) * T_view;
        const angle = 2 * Math.PI * frequency * t;
        let val = amplitude * 0.4 * Math.sin(angle + Math.PI);

        if (shockEnabled) {
          val += getShockValue(t);
        }

        const y = zeroY + val * scaleY;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    ctx.setLineDash([]);

    // DRAW HOVER CONCEPT DIMENSIONS OVERLAYS
    if (hoveredConcept === 'period') {
      const yVal = 35;
      const xStart = width * 0.15;
      const xEnd = xStart + (width * (2 / 3));

      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;

      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(xStart, yVal);
      ctx.lineTo(xStart, height - 15);
      ctx.moveTo(xEnd, yVal);
      ctx.lineTo(xEnd, height - 15);
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(xStart, yVal);
      ctx.lineTo(xEnd, yVal);
      ctx.stroke();

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(xStart, yVal);
      ctx.lineTo(xStart + 8, yVal - 4);
      ctx.lineTo(xStart + 8, yVal + 4);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(xEnd, yVal);
      ctx.lineTo(xEnd - 8, yVal - 4);
      ctx.lineTo(xEnd - 8, yVal + 4);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = isLight ? '#0f172a' : '#ffffff';
      ctx.font = 'bold 11px font-sans';
      ctx.fillText(`Période (T) = ${periodMs.toFixed(1)} ms`, (xStart + xEnd) / 2 - 65, yVal - 8);
    }

    if (hoveredConcept === 'amp_pk') {
      const yVal = zeroY - (amplitude * 0.4) * scaleY;
      ctx.strokeStyle = isLight ? '#2563eb' : '#3b82f6';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);

      ctx.beginPath();
      ctx.moveTo(0, yVal);
      ctx.lineTo(width, yVal);
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(width / 3, zeroY);
      ctx.lineTo(width / 3, yVal);
      ctx.stroke();

      ctx.fillStyle = isLight ? '#2563eb' : '#3b82f6';
      ctx.beginPath();
      ctx.moveTo(width / 3, yVal);
      ctx.lineTo(width / 3 - 5, yVal + 8);
      ctx.lineTo(width / 3 + 5, yVal + 8);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = isLight ? '#0f172a' : '#ffffff';
      ctx.font = 'bold 11px font-sans';
      ctx.fillText(`Amplitude Crête (A_pk) = ${amplitude.toFixed(1)}`, width / 3 + 12, yVal + 14);
    }

    if (hoveredConcept === 'amp_pp') {
      const yValTop = zeroY - (amplitude * 0.4) * scaleY;
      const yValBot = zeroY + (amplitude * 0.4) * scaleY;
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);

      ctx.beginPath();
      ctx.moveTo(0, yValTop);
      ctx.lineTo(width, yValTop);
      ctx.moveTo(0, yValBot);
      ctx.lineTo(width, yValBot);
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(width / 2.5, yValBot);
      ctx.lineTo(width / 2.5, yValTop);
      ctx.stroke();

      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(width / 2.5, yValTop);
      ctx.lineTo(width / 2.5 - 5, yValTop + 8);
      ctx.lineTo(width / 2.5 + 5, yValTop + 8);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(width / 2.5, yValBot);
      ctx.lineTo(width / 2.5 - 5, yValBot - 8);
      ctx.lineTo(width / 2.5 + 5, yValBot - 8);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = isLight ? '#0f172a' : '#ffffff';
      ctx.font = 'bold 11px font-sans';
      ctx.fillText(`Crête-à-Crête (A_p-p) = ${(amplitude * 2).toFixed(1)}`, width / 2.5 + 12, zeroY - 4);
    }

    if (hoveredConcept === 'amp_rms') {
      const rmsVal = amplitude * 0.4 * 0.7071;
      const yVal = zeroY - rmsVal * scaleY;
      ctx.strokeStyle = isLight ? '#16a34a' : '#22c55e';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);

      ctx.beginPath();
      ctx.moveTo(0, yVal);
      ctx.lineTo(width, yVal);
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(width / 2, zeroY);
      ctx.lineTo(width / 2, yVal);
      ctx.stroke();

      ctx.fillStyle = isLight ? '#16a34a' : '#22c55e';
      ctx.beginPath();
      ctx.moveTo(width / 2, yVal);
      ctx.lineTo(width / 2 - 5, yVal + 8);
      ctx.lineTo(width / 2 + 5, yVal + 8);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = isLight ? '#0f172a' : '#ffffff';
      ctx.font = 'bold 11px font-sans';
      ctx.fillText(`Valeur Efficace (A_rms) = ${(amplitude * 0.7071).toFixed(2)}`, width / 2 + 12, yVal + 14);
    }

    ctx.strokeStyle = '#f59e0b'; 
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, height);
    ctx.stroke();
    ctx.setLineDash([]);
  };

  // Draw Phasor circle and mechanical rotor shaft in the center
  const drawPhasors = () => {
    const canvas = phasorRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.38;

    // Draw circular grid background
    ctx.strokeStyle = isLight ? 'rgba(15, 23, 42, 0.05)' : (isBW ? 'rgba(255,255,255,0.06)' : 'rgba(71, 85, 105, 0.15)');
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.66, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.33, 0, 2 * Math.PI);
    ctx.stroke();

    // Draw Crosshairs
    ctx.beginPath();
    ctx.moveTo(centerX - radius - 10, centerY);
    ctx.lineTo(centerX + radius + 10, centerY);
    ctx.moveTo(centerX, centerY - radius - 10);
    ctx.lineTo(centerX, centerY + radius + 10);
    ctx.stroke();

    const angle = 2 * Math.PI * frequency * timeRef.current;

    // ROTATING ROTOR SHAFT MODEL IN CENTER
    const shaftRadius = 24;
    ctx.strokeStyle = isLight ? '#94a3b8' : (isBW ? 'rgba(255,255,255,0.4)' : 'rgba(100, 116, 139, 0.6)');
    ctx.lineWidth = 2;
    ctx.fillStyle = isLight ? '#f1f5f9' : (isBW ? '#1e293b' : '#0f172a');
    ctx.beginPath();
    ctx.arc(centerX, centerY, shaftRadius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    // Keyway indicator line rotating inside
    ctx.strokeStyle = isLight ? '#cbd5e1' : (isBW ? 'rgba(255,255,255,0.2)' : 'rgba(148, 163, 184, 0.3)');
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
      centerX + (shaftRadius - 4) * Math.cos(angle),
      centerY - (shaftRadius - 4) * Math.sin(angle)
    );
    ctx.stroke();

    // Draw rotating unbalance "Heavy Spot" on the shaft boundary
    const heavySpotX = centerX + (shaftRadius - 3) * Math.cos(angle);
    const heavySpotY = centerY - (shaftRadius - 3) * Math.sin(angle);
    
    ctx.fillStyle = isLight ? '#ea580c' : (isBW ? '#ffffff' : '#f59e0b');
    ctx.beginPath();
    ctx.arc(heavySpotX, heavySpotY, 4.5, 0, 2 * Math.PI);
    ctx.fill();

    ctx.font = 'bold 8px font-sans';
    ctx.fillStyle = isLight ? '#475569' : (isBW ? '#d4d4d8' : '#f59e0b');
    ctx.fillText("Balourd", heavySpotX + 6, heavySpotY + 3);

    // Bearing Outer Race defect fissure and flash sparks
    if (shockEnabled) {
      ctx.strokeStyle = isLight ? 'rgba(220, 38, 38, 0.15)' : (isBW ? 'rgba(255,255,255,0.2)' : 'rgba(239, 68, 68, 0.25)');
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 0.9, 0, 2 * Math.PI);
      ctx.stroke();

      const defectAngle = Math.PI / 4;
      const defectX = centerX + radius * 0.9 * Math.cos(defectAngle);
      const defectY = centerY - radius * 0.9 * Math.sin(defectAngle);

      ctx.fillStyle = isLight ? '#dc2626' : (isBW ? '#ffffff' : '#ef4444');
      ctx.beginPath();
      ctx.arc(defectX, defectY, 4, 0, 2 * Math.PI);
      ctx.fill();

      ctx.font = '8px font-sans';
      ctx.fillStyle = isLight ? '#b91c1c' : (isBW ? '#ffffff' : '#fca5a5');
      ctx.fillText("Fissure", defectX + 6, defectY + 3);

      const t_now = timeRef.current;
      const f_defect = 3.2 * frequency;
      const T_defect = 1 / f_defect;
      const timeSinceLastShock = t_now % T_defect;

      if (timeSinceLastShock < 0.04) {
        ctx.strokeStyle = isLight ? '#dc2626' : (isBW ? '#ffffff' : '#ef4444');
        ctx.lineWidth = 1.8;
        const sparkLength = 12 * (1 - timeSinceLastShock / 0.04);
        
        for (let s = 0; s < 6; s++) {
          const spAngle = (s * Math.PI) / 3;
          ctx.beginPath();
          ctx.moveTo(defectX, defectY);
          ctx.lineTo(
            defectX + sparkLength * Math.cos(spAngle),
            defectY + sparkLength * Math.sin(spAngle)
          );
          ctx.stroke();
        }
      }
    }

    // Displacement Phasor: Blue, reference angle
    const dispX = centerX + radius * 0.8 * Math.cos(angle);
    const dispY = centerY - radius * 0.8 * Math.sin(angle);

    // Velocity Phasor: Green, +90 degrees
    const velX = centerX + radius * 0.8 * Math.cos(angle + Math.PI / 2);
    const velY = centerY - radius * 0.8 * Math.sin(angle + Math.PI / 2);

    // Acceleration Phasor: Red, +180 degrees
    const accelX = centerX + radius * 0.8 * Math.cos(angle + Math.PI);
    const accelY = centerY - radius * 0.8 * Math.sin(angle + Math.PI);

    const drawVector = (tox: number, toy: number, color: string, name: string) => {
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(tox, toy);
      ctx.stroke();

      const arrowSize = 6.5;
      const angleVector = Math.atan2(toy - centerY, tox - centerX);
      ctx.beginPath();
      ctx.moveTo(tox, toy);
      ctx.lineTo(
        tox - arrowSize * Math.cos(angleVector - Math.PI / 6),
        toy - arrowSize * Math.sin(angleVector - Math.PI / 6)
      );
      ctx.lineTo(
        tox - arrowSize * Math.cos(angleVector + Math.PI / 6),
        toy - arrowSize * Math.sin(angleVector + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fill();

      ctx.font = 'bold 11px JetBrains Mono, monospace';
      ctx.fillStyle = color;
      ctx.fillText(name, tox + 9 * Math.cos(angleVector), toy + 4 * Math.sin(angleVector) + 3);
    };

    if (showDisp) drawVector(dispX, dispY, isLight ? '#2563eb' : (isBW ? '#ffffff' : '#3b82f6'), 'D');
    if (showVel) drawVector(velX, velY, isLight ? '#16a34a' : (isBW ? '#a1a1aa' : '#22c55e'), 'V');
    if (showAccel) drawVector(accelX, accelY, isLight ? '#dc2626' : (isBW ? '#e4e4e7' : '#ef4444'), 'A');

    // Rotation direction arc arrow
    ctx.strokeStyle = isLight ? '#ea580c' : (isBW ? 'rgba(255,255,255,0.4)' : '#f59e0b');
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 38, -angle - 0.4, -angle);
    ctx.stroke();
    
    const arcX = centerX + 38 * Math.cos(-angle);
    const arcY = centerY + 38 * Math.sin(-angle);
    ctx.fillStyle = isLight ? '#ea580c' : (isBW ? '#ffffff' : '#f59e0b');
    ctx.beginPath();
    ctx.arc(arcX, arcY, 2.5, 0, 2 * Math.PI);
    ctx.fill();
  };

  return (
    <div className="space-y-6" id="fundamental-vibration-relations">
      {/* Top Banner */}
      <div className={`border p-4 rounded-xl flex items-start gap-3 shadow-inner ${
        isLight
          ? 'bg-slate-50 border-slate-200 text-slate-750'
          : (isBW ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-slate-900/50 border-slate-800 text-slate-300')
      }`}>
        <Info className={`w-5 h-5 mt-0.5 shrink-0 ${isLight ? 'text-blue-600' : (isBW ? 'text-slate-300' : 'text-blue-400')}`} />
        <div className="text-sm space-y-1">
          <p>
            Ce module démontre les <strong>relations de phase fondamentales</strong> entre le 
            <strong> Déplacement (D)</strong>, la <strong>Vitesse (V)</strong> et l'<strong>Accélération (A)</strong>.
          </p>
          <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            • <strong>Passez votre curseur</strong> sur les notions physiques ci-dessous pour tracer instantanément leurs dimensions en temps réel sur l'oscilloscope !
          </p>
        </div>
      </div>

      {/* Main Container Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Hand: Controls & Stats & Physical Rotor (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Main parameters block */}
          <div className={`border p-5 rounded-xl space-y-4 relative ${
            isLight
              ? 'bg-white border-slate-200 shadow-sm text-slate-800'
              : (isBW ? 'bg-slate-900 border-slate-800 text-white' : 'bg-[#1E293B] border-slate-700/60 shadow-lg text-white')
          }`}>
            <h3 className={`text-xs font-bold tracking-widest uppercase border-b pb-2 flex items-center gap-2 ${
              isLight ? 'text-slate-800 border-slate-200' : 'text-white border-slate-700/50'
            }`}>
              <Gauge className={`w-4 h-4 ${isLight ? 'text-blue-600' : (isBW ? 'text-white' : 'text-blue-400')}`} />
              Paramètres du Mouvement
            </h3>

            {/* Frequency Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Fréquence Vibratoire</span>
                <span className={`font-mono font-semibold ${isLight ? 'text-blue-600' : (isBW ? 'text-white' : 'text-blue-400')}`}>
                  {frequency.toFixed(1)} Hz ({Math.round(frequencyCpm)} CPM)
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="12"
                step="0.1"
                value={frequency}
                onChange={(e) => setFrequency(parseFloat(e.target.value))}
                className="w-full accent-blue-500 h-1.5 bg-slate-200 dark:bg-slate-950 rounded-lg cursor-pointer"
              />
            </div>

            {/* Amplitude Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Amplitude Crête</span>
                <span className={`font-mono font-semibold ${isLight ? 'text-emerald-600' : (isBW ? 'text-white' : 'text-emerald-400')}`}>
                  {amplitude.toFixed(1)} mm/s pk
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="0.1"
                value={amplitude}
                onChange={(e) => setAmplitude(parseFloat(e.target.value))}
                className="w-full accent-blue-500 h-1.5 bg-slate-200 dark:bg-slate-950 rounded-lg cursor-pointer"
              />
            </div>

            {/* Advanced Animation Speed Button Group */}
            <div className="space-y-1.5 pt-1">
              <span className={`text-[10px] font-bold uppercase tracking-widest block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Vitesse d'animation (Ralenti)
              </span>
              <div className={`grid grid-cols-4 gap-1.5 p-1 rounded-lg border ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'
              }`}>
                {[
                  { label: 'Réel (1x)', val: 1.0 },
                  { label: '0.5x', val: 0.5 },
                  { label: '0.1x', val: 0.1 },
                  { label: 'Pas-à-Pas', val: 0.0 }
                ].map((sp) => (
                  <button
                    key={sp.label}
                    onClick={() => {
                      setAnimSpeed(sp.val);
                      if (sp.val > 0) setIsPlaying(true);
                    }}
                    className={`py-1 text-[10px] font-bold rounded text-center transition-all cursor-pointer ${
                      animSpeed === sp.val
                        ? isBW
                          ? 'bg-white text-black'
                          : 'bg-blue-600 text-white shadow'
                        : isLight
                          ? 'text-slate-500 hover:text-slate-850 hover:bg-slate-200'
                          : '${isLight ? "text-slate-600" : "text-slate-400"} hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    {sp.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Signal Selectors Toggle Button Grid */}
            <div className="space-y-2.5">
              <span className={`text-[10px] font-bold uppercase tracking-widest block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Afficher les courbes
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setShowDisp(!showDisp)}
                  className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    showDisp
                      ? isLight
                        ? 'bg-blue-600/10 text-blue-600 border-blue-500/50'
                        : (isBW ? 'bg-white/10 text-white border-white/50' : 'bg-blue-600/20 text-blue-400 border-blue-500/50')
                      : isLight ? 'bg-slate-50 text-slate-400 border-slate-200 hover:border-slate-300' : 'bg-slate-950 text-slate-500 border-transparent hover:border-slate-800'
                  }`}
                >
                  {showDisp ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  D (Dépl.)
                </button>
                <button
                  onClick={() => setShowVel(!showVel)}
                  className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    showVel
                      ? isLight
                        ? 'bg-emerald-600/10 text-emerald-600 border-emerald-500/50'
                        : (isBW ? 'bg-white/10 text-white border-white/50' : 'bg-emerald-600/20 text-emerald-400 border-emerald-500/50')
                      : isLight ? 'bg-slate-50 text-slate-400 border-slate-200 hover:border-slate-300' : 'bg-slate-950 text-slate-500 border-transparent hover:border-slate-800'
                  }`}
                >
                  {showVel ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  V (Vitesse)
                </button>
                <button
                  onClick={() => setShowAccel(!showAccel)}
                  className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    showAccel
                      ? isLight
                        ? 'bg-red-600/10 text-red-600 border-red-500/50'
                        : (isBW ? 'bg-white/10 text-white border-white/50' : 'bg-red-600/20 text-red-400 border-red-500/50')
                      : isLight ? 'bg-slate-50 text-slate-400 border-slate-200 hover:border-slate-300' : 'bg-slate-950 text-slate-500 border-transparent hover:border-slate-800'
                  }`}
                >
                  {showAccel ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  A (Accél.)
                </button>
              </div>
            </div>

            {/* Animation state controls & Step button */}
            <div className={`flex gap-2 pt-1 border-t ${isLight ? 'border-slate-100' : 'border-slate-800/80'}`}>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer ${
                  isPlaying 
                    ? isLight
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-350'
                      : '${isLight ? "bg-slate-200" : "bg-slate-800"} hover:bg-slate-750 ${isLight ? "text-slate-800" : "text-slate-200"} border border-slate-700' 
                    : isBW 
                      ? 'bg-white text-black font-extrabold' 
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20'
                }`}
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5 fill-current" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current animate-pulse" />
                    Démarrer
                  </>
                )}
              </button>

              {/* Step frame controls */}
              <button
                onClick={() => handleStep('backward')}
                title="Pas précédent"
                className={`border px-2.5 rounded-lg transition-colors cursor-pointer ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleStep('forward')}
                title="Pas suivant"
                className={`border px-2.5 rounded-lg transition-colors cursor-pointer ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => { timeRef.current = 0; drawPlots(); drawPhasors(); }}
                title="Réinitialiser"
                className={`border p-2 rounded-lg transition-colors cursor-pointer ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Shock Impulse Injector */}
          <div className={`border p-5 rounded-xl space-y-4 shadow-lg relative ${
            isLight
              ? 'bg-white border-slate-200 text-slate-800 shadow-sm'
              : (isBW ? 'bg-slate-900 border-slate-800 text-white' : 'bg-[#1E293B] border-slate-700/60 shadow-lg text-white')
          }`}>
            <div className={`flex justify-between items-center border-b pb-2 ${isLight ? 'border-slate-100' : 'border-slate-700/50'}`}>
              <h3 className="text-xs font-bold tracking-widest uppercase flex items-center gap-1.5">
                <Zap className={`w-4 h-4 ${isLight ? 'text-amber-600' : (isBW ? 'text-white' : 'text-amber-400')}`} />
                Injecteur d'Impulsions (Chocs)
              </h3>
              
              {/* Checkbox Toggle */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={shockEnabled}
                  onChange={(e) => setShockEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-slate-300 dark:bg-slate-950 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3.5 after:transition-all peer-checked:bg-blue-600"></div>
                <span className={`ml-1 text-[10px] font-bold uppercase ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  {shockEnabled ? "ACTIF" : "OFF"}
                </span>
              </label>
            </div>

            {shockEnabled ? (
              <div className="space-y-3 animate-fade-in text-xs">
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Sévérité des Chocs (Fissure roulement)</span>
                    <span className="font-mono text-red-500 font-bold">{shockSeverity.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="0.5"
                    value={shockSeverity}
                    onChange={(e) => setShockSeverity(parseFloat(e.target.value))}
                    className="w-full accent-blue-500 h-1 bg-slate-200 dark:bg-slate-950 rounded"
                  />
                </div>

                {/* Real-time calculated indicators */}
                <div className={`p-3 rounded-lg border space-y-2 font-mono text-[11px] ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-950/80 border-slate-800 text-slate-300'
                }`}>
                  <div className={`flex justify-between items-center border-b pb-1 ${isLight ? 'border-slate-200' : 'border-slate-900'}`}>
                    <span className="text-[10px] font-sans">VALEUR CRÊTE (Peak)</span>
                    <span className="font-bold">{(stats.peak * 2.5).toFixed(2)} g</span>
                  </div>
                  <div className={`flex justify-between items-center border-b pb-1 ${isLight ? 'border-slate-200' : 'border-slate-900'}`}>
                    <span className="text-[10px] font-sans">VALEUR EFFICACE (RMS)</span>
                    <span className="font-bold">{(stats.rms * 2.5).toFixed(2)} g</span>
                  </div>
                  <div className={`flex justify-between items-center border-b pb-1 px-1.5 py-0.5 rounded ${isLight ? 'bg-blue-50 text-blue-800 border-blue-100' : 'bg-blue-950/30 text-blue-300'}`}>
                    <span className="text-[10px] font-sans font-bold">FACTEUR CRÊTE (FC)</span>
                    <span className="font-bold">{(stats.crest).toFixed(2)} ({ (20 * Math.log10(stats.crest)).toFixed(1) } dB)</span>
                  </div>
                  <div className={`flex justify-between items-center px-1.5 py-0.5 rounded ${isLight ? 'bg-purple-50 text-purple-800 border-purple-100' : 'bg-purple-950/30 text-purple-300'}`}>
                    <span className="text-[10px] font-sans font-bold">KURTOSIS (Aplatissement)</span>
                    <span className="font-bold">{(stats.kurtosis).toFixed(2)}</span>
                  </div>
                </div>

                <div className={`text-[10px] leading-relaxed p-2.5 rounded border ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-950/40 border-slate-900 text-slate-400'
                }`}>
                  {stats.kurtosis > 4.5 ? (
                    <span className="text-red-500 font-bold block mb-1">
                      ⚠️ ALERT: KURTOSIS TRÈS ÉLEVÉ ({stats.kurtosis.toFixed(1)})
                    </span>
                  ) : (
                    <span className={`font-bold block mb-1 ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
                      Indicateurs en santé
                    </span>
                  )}
                  {stats.kurtosis > 4.5 ? (
                    "Le Kurtosis explose (>> 3) car les ondes de choc sont extrêmement courtes et aiguës par rapport à la période globale. C'est la signature exacte d'un écaillage précoce de bague de roulement."
                  ) : (
                    "Actuellement sur signal sinusoïdal classique : le Facteur Crête est de 1.41 (3 dB) et le Kurtosis de 1.5. Le signal est parfaitement régulier."
                  )}
                </div>
              </div>
            ) : (
              <p className={`text-[11px] leading-relaxed ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Activez l'injecteur pour superposer des chocs mécaniques répétés et voir comment les indicateurs statistiques (Kurtosis, Facteur Crête) réagissent instantanément à la présence d'impulsions transitoires !
              </p>
            )}
          </div>
        </div>

        {/* Right Hand: Oscilloscope canvas + Dynamic Info Cards (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Main Scope Canvas */}
          <div className={`rounded-xl p-5 flex flex-col h-full shadow-inner min-h-[350px] relative border ${
            isLight
              ? 'bg-slate-50 border-slate-200 text-slate-800 shadow-sm'
              : (isBW ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-900/50 border border-slate-800 text-white')
          }`}>
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold uppercase tracking-widest ${isLight ? 'text-blue-600' : 'text-blue-400'}`}>
                  Oscilloscope Virtuel
                </span>
                <h4 className="text-xs font-medium">
                  Signal d'Onde de Vibration Temporelle
                </h4>
              </div>
              <span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${
                isLight ? 'bg-white border-slate-200 text-slate-500' : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}>
                Largeur : 1.5 Cycles (Rotor)
              </span>
            </div>

            {/* Scope Canvas Box */}
            <div className={`relative flex-1 w-full rounded-xl overflow-hidden border ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#0F172A] border-slate-900'
            }`}>
              <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
              
              {shockEnabled && (
                <div className={`absolute top-2 right-2 flex flex-col gap-1 text-[9px] font-mono px-2 py-1.5 rounded border ${
                  isLight ? 'bg-slate-50/90 border-slate-200 text-slate-800' : 'bg-slate-950/90 border-slate-800 text-slate-300'
                }`}>
                  <span>CF: <strong className="text-blue-500">{stats.crest.toFixed(2)}</strong></span>
                  <span>Kurt: <strong className="text-purple-500">{stats.kurtosis.toFixed(1)}</strong></span>
                </div>
              )}
            </div>

            {/* Oscilloscope Custom Legends with distinct styles */}
            <div className={`flex justify-around items-center mt-3 text-[10px] font-mono p-2 rounded-lg border shadow-inner ${
              isLight ? 'bg-white border-slate-200 text-slate-600' : 'bg-slate-950/60 border-slate-900 text-slate-400'
            }`}>
              {showDisp && (
                <span className="flex items-center gap-1.5">
                  <span className={`w-3 h-0.5 ${isLight ? 'bg-blue-600' : (isBW ? 'bg-white' : 'bg-blue-500')} inline-block`} />
                  Déplacement (D)
                </span>
              )}
              {showVel && (
                <span className="flex items-center gap-1.5">
                  <span className={`w-3 h-0.5 ${isBW ? 'bg-slate-400 border-t border-dashed' : 'bg-emerald-500'} inline-block`} />
                  Vitesse (V)
                </span>
              )}
              {showAccel && (
                <span className="flex items-center gap-1.5">
                  <span className={`w-3 h-0.5 ${isBW ? 'bg-slate-200 border-t border-dotted' : 'bg-red-500'} inline-block`} />
                  Accél. (A)
                </span>
              )}
            </div>
          </div>

          {/* Interactive Educational Cards */}
          <div className={`border p-5 rounded-xl shadow-lg space-y-4 ${
            isLight
              ? 'bg-white border-slate-200 text-slate-800 shadow-sm'
              : (isBW ? 'bg-slate-900 border-slate-800 text-white' : 'bg-[#1E293B] border-slate-700/60 shadow-lg text-white')
          }`}>
            <h4 className="text-xs font-bold tracking-widest uppercase border-b pb-2 border-slate-200 dark:border-slate-700/50">
              Les Piliers de la Vibration : Période, Fréquence, Amplitude
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              
              {/* Period block */}
              <div 
                onMouseEnter={() => setHoveredConcept('period')}
                onMouseLeave={() => setHoveredConcept(null)}
                className={`p-3 rounded-xl border transition-all cursor-help relative shadow-sm ${
                  hoveredConcept === 'period'
                    ? 'bg-amber-950/20 border-amber-500/50'
                    : isLight
                      ? 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      : '${isLight ? "bg-slate-100" : "bg-slate-950/60"} border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-amber-500 font-bold text-[11px]">Période (T)</span>
                  <span className={`text-[9px] font-mono px-1 py-0.25 rounded ${
                    isLight ? 'bg-amber-50 text-amber-600' : 'bg-amber-950/40 text-amber-500'
                  }`}>
                    T = 1 / f
                  </span>
                </div>
                <p className={`font-mono text-xs mt-1 ${isLight ? 'text-slate-800' : 'text-white'}`}>{periodMs.toFixed(1)} ms</p>
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                  Durée exacte d'un cycle vibratoire complet.
                </p>
                {hoveredConcept === 'period' && (
                  <span className="absolute bottom-1 right-2 text-[8px] font-bold text-amber-500">TRACÉ ACTIF</span>
                )}
              </div>

              {/* Frequency block */}
              <div 
                onMouseEnter={() => setHoveredConcept('freq')}
                onMouseLeave={() => setHoveredConcept(null)}
                className={`p-3 rounded-xl border transition-all cursor-help relative shadow-sm ${
                  hoveredConcept === 'freq'
                    ? 'bg-blue-950/20 border-blue-500/50'
                    : isLight
                      ? 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      : '${isLight ? "bg-slate-100" : "bg-slate-950/60"} border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-blue-500 font-bold text-[11px]">Fréquence (f)</span>
                  <span className={`text-[9px] font-mono px-1 py-0.25 rounded ${
                    isLight ? 'bg-blue-50 text-blue-600' : 'bg-blue-950/40 text-blue-500'
                  }`}>
                    Hz / CPM
                  </span>
                </div>
                <p className={`font-mono text-xs mt-1 ${isLight ? 'text-slate-800' : 'text-white'}`}>
                  {frequency.toFixed(1)} Hz ({Math.round(frequencyCpm)} CPM)
                </p>
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                  Nombre d'oscillations du rotor par seconde.
                </p>
              </div>

              {/* Amplitude block */}
              <div className={`border p-3 rounded-xl space-y-1.5 flex flex-col justify-between ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800/80'
              }`}>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px] block">Amplitude (A)</span>
                
                <div className="space-y-1">
                  {/* Peak */}
                  <div 
                    onMouseEnter={() => setHoveredConcept('amp_pk')}
                    onMouseLeave={() => setHoveredConcept(null)}
                    className={`flex justify-between items-center px-1.5 py-0.5 rounded cursor-help ${
                      hoveredConcept === 'amp_pk' ? 'bg-blue-950/60 text-blue-300' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <span className="text-[9px] font-mono">Crête (Apk)</span>
                    <span className="font-mono font-semibold text-[10px]">{amplitude.toFixed(1)}</span>
                  </div>

                  {/* Peak to Peak */}
                  <div 
                    onMouseEnter={() => setHoveredConcept('amp_pp')}
                    onMouseLeave={() => setHoveredConcept(null)}
                    className={`flex justify-between items-center px-1.5 py-0.5 rounded cursor-help ${
                      hoveredConcept === 'amp_pp' ? 'bg-red-950/60 text-red-300' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <span className="text-[9px] font-mono">Crête-Crête (App)</span>
                    <span className="font-mono font-semibold text-[10px]">{(amplitude * 2).toFixed(1)}</span>
                  </div>

                  {/* RMS */}
                  <div 
                    onMouseEnter={() => setHoveredConcept('amp_rms')}
                    onMouseLeave={() => setHoveredConcept(null)}
                    className={`flex justify-between items-center px-1.5 py-0.5 rounded cursor-help ${
                      hoveredConcept === 'amp_rms' ? 'bg-emerald-950/60 text-emerald-300' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <span className="text-[9px] font-mono">Efficace (RMS)</span>
                    <span className="font-mono font-semibold text-[10px]">{(amplitude * 0.7071).toFixed(2)}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Dynamic visual diagram vector panel */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1.5">
              {/* Rotor Phasor Diagram block */}
              <div className={`border p-4 rounded-xl flex flex-col items-center justify-center ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'
              }`}>
                <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-2 text-center self-stretch">
                  Rotor Synchrone & Vecteurs de Phase
                </span>
                
                <div className="relative w-full aspect-square max-w-[190px]">
                  <canvas ref={phasorRef} className="w-full h-full" />
                </div>
              </div>

              {/* Dynamic explanations for Kurtosis and Crest Factor relations */}
              <div className={`p-4 rounded-xl flex flex-col justify-between text-xs space-y-2 ${
                isLight ? 'bg-slate-50 text-slate-650' : 'text-slate-300'
              }`}>
                <span className={`font-bold uppercase tracking-wider text-[10px] flex items-center gap-1 ${isLight ? 'text-slate-800' : 'text-white'}`}>
                  <HelpCircle className="w-4 h-4 text-blue-500" />
                  Rôle des Indicateurs Statistiques :
                </span>
                <p className="text-[11px] leading-relaxed text-slate-500">
                  <strong>Facteur Crête :</strong> Crête / RMS. Il quantifie la "violence" d'un choc par rapport au bruit continu. Un Facteur Crête élevé est synonyme d'impacts réguliers de roulement.
                </p>
                <p className="text-[11px] leading-relaxed text-slate-500">
                  <strong>Kurtosis :</strong> C'est le moment d'ordre 4. Il est extrêmement sensible aux pics isolés (impulsions). S'il dépasse 3.0, cela confirme que le signal n'est plus continu mais dominé par des chocs (écaillages).
                </p>
                <div className={`px-3 py-2 rounded border text-[10px] leading-relaxed ${
                  isLight ? 'bg-white border-slate-200 text-slate-600' : 'bg-slate-900/80 border-slate-800'
                }`}>
                  💡 <strong>Détectabilité :</strong> En industrie, les indicateurs d'impulsion augmentent de nombreux mois avant que la vibration globale (RMS) ne commence à croître, permettant de planifier la maintenance à temps.
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
