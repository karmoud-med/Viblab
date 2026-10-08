import React, { useState } from 'react';

export const SkiSlopeDemo = () => {
  const [mode, setMode] = useState<'correct' | 'loose'>('correct');

  return (
    <div className="w-full flex flex-col md:flex-row gap-6 p-6 rounded-2xl bg-[#0f172a] border border-slate-700 shadow-2xl animate-in fade-in zoom-in duration-700">
       {/* Left side: Controls and Machine SVG */}
       <div className="flex-[1.2] flex flex-col gap-6">
          <div className="flex gap-3 bg-slate-800 p-2 rounded-xl">
            <button 
               onClick={() => setMode('correct')}
               className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm transition-all duration-300 shadow-sm ${mode === 'correct' ? 'bg-emerald-500 text-white scale-[1.02]' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
            >
              ✅ Montage Ferme
            </button>
            <button 
               onClick={() => setMode('loose')}
               className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm transition-all duration-300 shadow-sm ${mode === 'loose' ? 'bg-red-500 text-white scale-[1.02] animate-pulse' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
            >
              ❌ Montage Lâche
            </button>
          </div>
          
          <div className="flex-1 bg-slate-800 rounded-xl border border-slate-600 flex items-center justify-center p-6 relative overflow-hidden shadow-inner">
             {/* Simple machine SVG */}
             <svg viewBox="0 0 200 200" className="w-full h-auto max-h-[200px] drop-shadow-xl">
               {/* Machine body */}
               <rect x="30" y="120" width="140" height="60" rx="8" fill="#1e293b" />
               <rect x="50" y="100" width="100" height="20" fill="#334155" />
               <circle cx="100" cy="150" r="20" fill="#0f172a" />
               
               {/* Magnetic Base */}
               <rect x="85" y="85" width="30" height="15" fill="#94a3b8" />
               <line x1="85" y1="92" x2="115" y2="92" stroke="#475569" strokeWidth="2" />
               
               {/* Sensor that shakes if loose */}
               <g className={`transition-transform duration-150 ${mode === 'loose' ? 'animate-[shake_0.1s_ease-in-out_infinite]' : ''}`} style={{ transformOrigin: '100px 85px' }}>
                  <path d="M 90,85 L 90,40 C 90,35 110,35 110,40 L 110,85 Z" fill="#3b82f6" />
                  <rect x="95" y="45" width="10" height="30" fill="#2563eb" />
                  {/* Cable */}
                  <path d="M 100,38 C 100,20 130,20 130,0" fill="none" stroke="#ef4444" strokeWidth="3" />
               </g>

               {/* Impact lines if loose */}
               {mode === 'loose' && (
                 <g className="animate-pulse">
                   <path d="M 70,80 L 60,70 M 130,80 L 140,70 M 75,90 L 65,95 M 125,90 L 135,95" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" />
                   <circle cx="100" cy="85" r="30" fill="none" stroke="#ef4444" strokeWidth="2" opacity="0.5" className="animate-[ping_1s_cubic-bezier(0,0,0.2,1)_infinite]" />
                 </g>
               )}
               {/* Vibration waves if correct */}
               {mode === 'correct' && (
                 <g className="animate-pulse opacity-30">
                   <path d="M 40,150 Q 100,120 160,150" fill="none" stroke="#10b981" strokeWidth="2" />
                   <path d="M 50,160 Q 100,140 150,160" fill="none" stroke="#10b981" strokeWidth="2" />
                 </g>
               )}
             </svg>
             <style dangerouslySetInnerHTML={{__html: `
               @keyframes shake {
                 0%, 100% { transform: rotate(0deg) translateY(0px); }
                 25% { transform: rotate(-8deg) translateY(-2px); }
                 50% { transform: rotate(5deg) translateY(1px); }
                 75% { transform: rotate(-3deg) translateY(-1px); }
               }
             `}} />
          </div>
          
          <div className="bg-slate-800 p-4 rounded-xl border-l-4 border-slate-500 min-h-[80px] flex items-center justify-center text-center">
             <p className="text-sm font-medium text-slate-300">
               {mode === 'correct' ? 
                  "L'aimant est collé sur une surface nettoyée et plane. La mesure est parfaite." : 
                  "Le capteur claque contre la surface (chocs métalliques). L'amplificateur piézoélectrique est saturé."
               }
             </p>
          </div>
       </div>

       {/* Right side: Spectrum Graph SVG */}
       <div className="flex-[1.8] bg-[#020617] rounded-xl p-6 flex flex-col relative border border-slate-800 shadow-2xl overflow-hidden">
          <div className="flex justify-between items-center mb-6">
             <h4 className="text-sky-400 font-mono text-sm tracking-widest uppercase flex items-center gap-2">
                <span className="w-2 h-2 bg-sky-400 rounded-full animate-ping"></span> Live FFT Spectrum
             </h4>
             <span className="text-slate-500 font-mono text-xs">0 - 1000 Hz</span>
          </div>

          <svg viewBox="0 0 400 200" className="w-full h-full drop-shadow-[0_0_12px_rgba(59,130,246,0.3)]">
             {/* Grid */}
             <g stroke="#1e293b" strokeWidth="1">
                <line x1="40" y1="160" x2="380" y2="160" stroke="#334155" strokeWidth="2" />
                <line x1="40" y1="20" x2="40" y2="160" stroke="#334155" strokeWidth="2" />
                {Array.from({length: 4}).map((_, i) => <line key={`y-${i}`} x1="40" y1={40 + i*30} x2="380" y2={40 + i*30} />)}
                {Array.from({length: 8}).map((_, i) => <line key={`x-${i}`} x1="80 + i*40" y1="20" x2="80 + i*40" y2="160" />)}
             </g>
             
             {/* The signal path */}
             <g className="transition-all duration-1000 ease-out">
                {mode === 'correct' ? (
                   /* Normal clean spectrum */
                   <>
                     <path d="M 40,160 L 60,160 L 70,80 L 80,160 L 140,160 L 150,110 L 160,160 L 250,160 L 260,130 L 270,160 L 380,160" fill="none" stroke="#3b82f6" strokeWidth="3" />
                     {/* Harmonics text */}
                     <text x="65" y="70" className="text-[10px] fill-slate-400 font-mono">1X</text>
                     <text x="145" y="100" className="text-[10px] fill-slate-400 font-mono">2X</text>
                   </>
                ) : (
                   /* Ski slope spectrum */
                   <>
                     <path d="M 40,20 Q 80,160 140,160 L 150,110 L 160,160 L 250,160 L 260,130 L 270,160 L 380,160" fill="none" stroke="#ef4444" strokeWidth="4" />
                     <path d="M 40,160 L 40,20 Q 80,160 140,160 Z" fill="url(#skiGradient)" />
                   </>
                )}
             </g>
             
             <defs>
                <linearGradient id="skiGradient" x1="0" y1="0" x2="0" y2="1">
                   <stop offset="0%" stopColor="rgba(239, 68, 68, 0.5)" />
                   <stop offset="100%" stopColor="rgba(239, 68, 68, 0)" />
                </linearGradient>
             </defs>
          </svg>

          {/* Alarm Overlay */}
          {mode === 'loose' && (
             <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-950/90 text-red-400 text-sm px-6 py-3 rounded-lg border-2 border-red-500 font-mono font-bold animate-[pulse_0.5s_infinite] whitespace-nowrap shadow-[0_0_30px_rgba(220,38,38,0.5)]">
               ⚠️ SATURATION HF - THE SKI SLOPE !
             </div>
          )}
       </div>
    </div>
  );
};
