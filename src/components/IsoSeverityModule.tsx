import React, { useState, useEffect } from 'react';
import { Sliders, CheckSquare, Info, ShieldAlert, CheckCircle, HelpCircle } from 'lucide-react';

interface SeverityProps {
  theme: 'light' | 'dark' | 'mono';
}

type MachineGroup = 'group1' | 'group2'; // group1 = Large (>300kW), group2 = Medium (15-300kW)
type SupportType = 'rigid' | 'flexible';

export default function IsoSeverityModule({ theme }: SeverityProps) {
  const isLight = theme === 'light';
  const isBW = theme === 'mono';

  // Interactive inputs
  const [rmsVelocity, setRmsVelocity] = useState<number>(3.5);
  const [machineGroup, setMachineGroup] = useState<MachineGroup>('group2');
  const [supportType, setSupportType] = useState<SupportType>('flexible');

  // Classification results
  const [currentZone, setCurrentZone] = useState<'A' | 'B' | 'C' | 'D'>('A');

  // Limits lookup based on selection
  // Returns [limit_A_B, limit_B_C, limit_C_D]
  const getLimits = (): [number, number, number] => {
    if (machineGroup === 'group1') {
      if (supportType === 'rigid') {
        return [2.3, 4.5, 7.1];
      } else {
        return [3.5, 7.1, 11.0];
      }
    } else {
      if (supportType === 'rigid') {
        return [1.4, 2.8, 4.5];
      } else {
        return [2.3, 4.5, 7.1];
      }
    }
  };

  const [limitAB, limitBC, limitCD] = getLimits();

  // Determine current Zone
  useEffect(() => {
    if (rmsVelocity <= limitAB) {
      setCurrentZone('A');
    } else if (rmsVelocity <= limitBC) {
      setCurrentZone('B');
    } else if (rmsVelocity <= limitCD) {
      setCurrentZone('C');
    } else {
      setCurrentZone('D');
    }
  }, [rmsVelocity, limitAB, limitBC, limitCD]);

  const getZoneMeta = () => {
    switch (currentZone) {
      case 'A':
        return {
          label: 'Zone A (Vert) : État Neuf',
          description: 'Vibrations typiques d\'une machine neuve ou récemment mise en service sans restriction d\'exploitation.',
          colorClass: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30',
          recommendation: 'Aucune action requise. Continuer la surveillance préventive périodique de routine.',
          badgeBg: 'bg-emerald-500'
        };
      case 'B':
        return {
          label: 'Zone B (Jaune) : Satisfaisant',
          description: 'Vibrations acceptables pour un fonctionnement continu à long terme sans aucune restriction.',
          colorClass: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30',
          recommendation: 'Fonctionnement nominal. Planifier un relevé dans les cycles d\'inspection normaux.',
          badgeBg: 'bg-yellow-500'
        };
      case 'C':
        return {
          label: 'Zone C (Orange) : Alerte / Insatisfaisant',
          description: 'Niveaux de vibrations élevés. Acceptables pour une durée limitée mais inadaptés pour un fonctionnement continu à long terme.',
          colorClass: 'text-orange-500 bg-orange-500/10 border-orange-500/30',
          recommendation: 'Alerte maintenance requise. Analyser le spectre vibratoire pour identifier l\'anomalie sous-jacente (balourd, désalignement, roulement) et planifier une correction.',
          badgeBg: 'bg-orange-500'
        };
      case 'D':
        return {
          label: 'Zone D (Rouge) : Danger / Arrêt Immédiat',
          description: 'Niveau vibratoire critique provoquant des contraintes excessives susceptibles d\'endommager gravement la structure.',
          colorClass: 'text-red-500 bg-red-500/10 border-red-500/30',
          recommendation: 'Arrêt immédiat obligatoire ! Risque de défaillance catastrophique imminente. Réaliser un diagnostic d\'urgence et procéder aux réparations mécaniques nécessaires.',
          badgeBg: 'bg-red-500'
        };
    }
  };

  const meta = getZoneMeta();

  // Helper to map velocity value to gauge percentage (max range 15 mm/s)
  const maxScale = 15;
  const percentage = Math.min((rmsVelocity / maxScale) * 100, 100);

  return (
    <div className={`space-y-6 ${isLight ? 'text-slate-800' : 'text-slate-100'}`} id="iso_severity_root">
      {/* Description header */}
      <div className={`p-6 rounded-2xl border transition-all shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800'
      }`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-emerald-500" />
            <h2 className="text-xl font-extrabold tracking-tight">Sévérité Vibratoire selon la Norme ISO 10816-3</h2>
          </div>
          <p className={`text-xs ${isLight ? "text-slate-600" : "text-slate-400"}`}>
            Évaluez instantanément l'état mécanique d'une machine industrielle rotative selon les seuils réglementaires de l'Organisation Internationale de Normalisation.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Setup Panel (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className={`p-5 rounded-xl border flex flex-col gap-4 ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900/40 border-slate-800'
          }`}>
            <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? "text-slate-600" : "text-slate-400"} block border-b ${isLight ? "border-slate-300" : "border-slate-800"} pb-2`}>
              Configuration de la Machine
            </span>

            {/* Selection buttons for Machine group */}
            <div className="space-y-2">
              <label className={`block text-xs ${isLight ? "text-slate-600" : "text-slate-400"} font-bold`}>Groupe de Puissance Machine :</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => setMachineGroup('group1')}
                  className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                    machineGroup === 'group1' 
                      ? 'bg-blue-600 border-blue-500 text-white font-bold' 
                      : (isLight ? 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300' : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:border-slate-700')
                  }`}
                >
                  <span className="font-bold block">Groupe 1 : Grandes Machines</span>
                  <span className={`text-[9px] ${isLight ? "text-slate-600" : "text-slate-400"} font-normal`}>Moteurs &gt; 300 kW (jusqu'à 50 MW)</span>
                </button>
                <button
                  onClick={() => setMachineGroup('group2')}
                  className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                    machineGroup === 'group2' 
                      ? 'bg-blue-600 border-blue-500 text-white font-bold' 
                      : (isLight ? 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300' : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:border-slate-700')
                  }`}
                >
                  <span className="font-bold block">Groupe 2 : Moyennes Machines</span>
                  <span className={`text-[9px] ${isLight ? "text-slate-600" : "text-slate-400"} font-normal`}>Puissances entre 15 kW et 300 kW</span>
                </button>
              </div>
            </div>

            {/* Selection buttons for Support Stiffness */}
            <div className="space-y-2">
              <label className={`block text-xs ${isLight ? "text-slate-600" : "text-slate-400"} font-bold`}>Type de rigidité de fondation (Support) :</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => setSupportType('rigid')}
                  className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                    supportType === 'rigid' 
                      ? 'bg-blue-600 border-blue-500 text-white font-bold' 
                      : (isLight ? 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300' : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:border-slate-700')
                  }`}
                >
                  <span className="font-bold block">Support Rigide</span>
                  <span className={`text-[9px] ${isLight ? "text-slate-600" : "text-slate-400"} font-normal`}>Fondation robuste, ancrée en béton dur</span>
                </button>
                <button
                  onClick={() => setSupportType('flexible')}
                  className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                    supportType === 'flexible' 
                      ? 'bg-blue-600 border-blue-500 text-white font-bold' 
                      : (isLight ? 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300' : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:border-slate-700')
                  }`}
                >
                  <span className="font-bold block">Support Flexible</span>
                  <span className={`text-[9px] ${isLight ? "text-slate-600" : "text-slate-400"} font-normal`}>Montage sur plots amortisseurs / ressorts</span>
                </button>
              </div>
            </div>

            {/* Interactive Speed slider */}
            <div className="space-y-2 border-t border-slate-800/60 pt-4">
              <div className="flex justify-between text-xs font-semibold">
                <span className={`${isLight ? "text-slate-600" : "text-slate-400"} font-bold`}>Vitesse Vibratoire Globale (RMS) :</span>
                <span className="font-mono text-xl text-blue-400 font-bold">{rmsVelocity.toFixed(2)} mm/s</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="15.0"
                step="0.1"
                value={rmsVelocity}
                onChange={(e) => setRmsVelocity(Number(e.target.value))}
                className={`w-full h-2 ${isLight ? "bg-slate-200" : "bg-slate-800"} rounded-lg appearance-none cursor-pointer accent-blue-500`}
              />
              <span className={`text-[10px] ${isLight ? "text-slate-600" : "text-slate-400"} italic block mt-1`}>Note : Valeur efficace mesurée dans la bande passante 2 Hz – 1000 Hz.</span>
            </div>
          </div>
        </div>

        {/* Right Side: Meter & Highlights (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className={`p-5 rounded-xl border flex flex-col gap-5 ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900/40 border-slate-800'
          }`}>
            <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? "text-slate-600" : "text-slate-400"} block border-b ${isLight ? "border-slate-300" : "border-slate-800"} pb-2`}>
              Jauge & Classification de Sévérité
            </span>

            {/* Standard Color-coded bar graph representing ISO Limits */}
            <div className="space-y-1.5">
              <div className={`flex justify-between text-[10px] font-mono font-bold ${isLight ? "text-slate-600" : "text-slate-400"} mb-0.5`}>
                <span>0 mm/s</span>
                <span>{limitAB}</span>
                <span>{limitBC}</span>
                <span>{limitCD}</span>
                <span>15 mm/s</span>
              </div>
              <div className={`relative h-6 rounded-full overflow-hidden flex ${isLight ? "bg-white" : "bg-slate-950"} border ${isLight ? "border-slate-300" : "border-slate-800"}`}>
                {/* Zone A (Green) */}
                <div 
                  style={{ width: `${(limitAB / maxScale) * 100}%` }}
                  className="bg-emerald-500 h-full opacity-80 flex items-center justify-center text-[9px] font-extrabold text-slate-950 font-mono"
                >
                  A
                </div>
                {/* Zone B (Yellow) */}
                <div 
                  style={{ width: `${((limitBC - limitAB) / maxScale) * 100}%` }}
                  className="bg-yellow-500 h-full opacity-80 flex items-center justify-center text-[9px] font-extrabold text-slate-950 font-mono"
                >
                  B
                </div>
                {/* Zone C (Orange) */}
                <div 
                  style={{ width: `${((limitCD - limitBC) / maxScale) * 100}%` }}
                  className="bg-orange-500 h-full opacity-80 flex items-center justify-center text-[9px] font-extrabold text-slate-950 font-mono"
                >
                  C
                </div>
                {/* Zone D (Red) */}
                <div 
                  style={{ width: `${((maxScale - limitCD) / maxScale) * 100}%` }}
                  className="bg-red-500 h-full opacity-80 flex items-center justify-center text-[9px] font-extrabold text-white font-mono"
                >
                  D
                </div>

                {/* Moving Needle needle */}
                <div 
                  style={{ left: `${percentage}%` }}
                  className="absolute top-0 bottom-0 w-1 bg-white border border-slate-950 shadow-lg -translate-x-1/2 transition-all duration-150"
                />
                <div
                  style={{ left: `${percentage}%` }}
                  className="absolute bottom-[-6px] w-3.5 h-3.5 bg-white rounded-full border-2 border-blue-500 shadow-md -translate-x-1/2 transition-all duration-150"
                />
              </div>
            </div>

            {/* Severity Diagnosis Card */}
            <div className={`p-4 rounded-xl border flex flex-col md:flex-row gap-4 items-start ${meta.colorClass} transition-all duration-300 mt-2`}>
              <div className={`w-10 h-10 rounded-full ${meta.badgeBg} flex items-center justify-center text-white text-lg font-bold shadow-lg shrink-0`}>
                {currentZone}
              </div>
              <div className="space-y-1.5 flex-1">
                <span className="text-sm font-extrabold block">{meta.label}</span>
                <p className={`text-xs leading-relaxed ${isLight ? "text-slate-700" : "text-slate-300"}`}>{meta.description}</p>
                <div className={`border-t border-slate-700/30 pt-2 text-[11px] leading-relaxed ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                  <strong>Recommandation :</strong> {meta.recommendation}
                </div>
              </div>
            </div>

            {/* Threshold limits grid highlighting the active row */}
            <div className="mt-2 space-y-2">
              <span className={`text-[10px] font-bold ${isLight ? "text-slate-600" : "text-slate-400"} uppercase tracking-widest block font-mono`}>
                Seuils Précis ISO 10816-3 (en mm/s RMS)
              </span>
              <div className={`border ${isLight ? "border-slate-300" : "border-slate-800"} rounded-lg overflow-hidden text-xs`}>
                {/* Headers */}
                <div className={`grid grid-cols-4 p-2 border-b font-bold text-center font-mono text-[10px] ${isLight ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-slate-950/60 border-slate-800 text-slate-400'}`}>
                  <span>Zone A (Neuf)</span>
                  <span>Zone B (Satisfaisant)</span>
                  <span>Zone C (Alerte)</span>
                  <span>Zone D (Arrêt)</span>
                </div>
                {/* Values row */}
                <div className={`grid grid-cols-4 p-2.5 text-center font-mono font-bold ${isLight ? 'bg-slate-50' : 'bg-slate-900/15'}`}>
                  <span className={`py-1 rounded ${currentZone === 'A' ? 'bg-emerald-500/25 text-emerald-400' : 'text-slate-500'}`}>
                    &le; {limitAB}
                  </span>
                  <span className={`py-1 rounded ${currentZone === 'B' ? 'bg-yellow-500/25 text-yellow-400' : 'text-slate-500'}`}>
                    {limitAB} - {limitBC}
                  </span>
                  <span className={`py-1 rounded ${currentZone === 'C' ? 'bg-orange-500/25 text-orange-400' : 'text-slate-500'}`}>
                    {limitBC} - {limitCD}
                  </span>
                  <span className={`py-1 rounded ${currentZone === 'D' ? 'bg-red-500/25 text-red-400' : 'text-slate-500'}`}>
                    &gt; {limitCD}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
