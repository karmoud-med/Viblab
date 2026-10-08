import React, { useState, useEffect } from 'react';
import { Settings, RefreshCw, HelpCircle, Info } from 'lucide-react';
import { convertVibrationUnits, ConversionInput } from '../utils/math';

interface UnitConverterProps {
  theme?: 'dark' | 'light' | 'mono';
}

export default function UnitConverter({ theme = 'dark' }: UnitConverterProps) {
  const [value, setValue] = useState<number>(5.0);
  const [type, setType] = useState<'accel' | 'vel' | 'disp'>('vel');
  const [unit, setUnit] = useState<string>('mms_rms');
  const [freq, setFreq] = useState<number>(50.0); // Hz

  const [results, setResults] = useState<ReturnType<typeof convertVibrationUnits> | null>(null);

  const isLight = theme === 'light';
  const isBW = theme === 'mono';

  // Recalculate conversions on input changes
  useEffect(() => {
    const input: ConversionInput = {
      value,
      type,
      unit,
      freq,
    };
    const computed = convertVibrationUnits(input);
    setResults(computed);
  }, [value, type, unit, freq]);

  // Handle unit type preset adjustments
  const handleTypeChange = (newType: 'accel' | 'vel' | 'disp') => {
    setType(newType);
    if (newType === 'accel') {
      setUnit('g_rms');
      setValue(1.0);
    } else if (newType === 'vel') {
      setUnit('mms_rms');
      setValue(5.0);
    } else {
      setUnit('um_pp');
      setValue(50.0);
    }
  };

  const unitsMetadata: Record<string, { label: string; name: string }> = {
    g_rms: { label: 'g RMS', name: 'Accélération efficace' },
    g_pk: { label: 'g Crête', name: 'Accélération crête' },
    mms_rms: { label: 'mm/s RMS', name: 'Vitesse efficace (métrique)' },
    mms_pk: { label: 'mm/s Crête', name: 'Vitesse crête (métrique)' },
    ips_rms: { label: 'in/s (IPS) RMS', name: 'Vitesse efficace (impérial)' },
    ips_pk: { label: 'in/s (IPS) Crête', name: 'Vitesse crête (impérial)' },
    um_pp: { label: 'µm Crête-à-Crête', name: 'Déplacement double-amplitude' },
    mils_pp: { label: 'mils (thou) C-à-C', name: 'Déplacement double-amplitude (impérial)' },
  };

  return (
    <div className="space-y-6" id="vibration-unit-converter">
      {/* Intro */}
      <div className={`border p-4 rounded-xl flex items-start gap-3 shadow-inner ${
        isLight
          ? 'bg-slate-50 border-slate-200 text-slate-700'
          : (isBW ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-900/50 border-slate-800 text-slate-300')
      }`}>
        <Info className={`w-5 h-5 mt-0.5 shrink-0 ${isLight ? 'text-blue-600' : 'text-blue-400'}`} />
        <div className="text-sm space-y-1">
          <p>
            Les conversions de valeurs de vibrations dépendent directement de la <strong>fréquence harmonique f</strong> à laquelle s'effectue la mesure.
          </p>
          <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Saisissez une valeur dans n'importe quelle unité, définissez la fréquence de vibration, et l'outil calculera instantanément les équivalences physiques de déplacement, vitesse et accélération.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left column: Input controls (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          <div className={`border p-5 rounded-xl space-y-5 relative ${
            isLight
              ? 'bg-white border-slate-200 shadow-sm text-slate-800'
              : (isBW ? 'bg-slate-950 border-slate-800 text-white' : 'bg-[#1E293B] border-slate-700/60 shadow-lg text-white')
          }`}>
            <h3 className={`text-xs font-bold tracking-widest uppercase border-b pb-2.5 ${
              isLight ? 'text-slate-800 border-slate-200' : 'text-white border-slate-700/50'
            }`}>
              Paramètres d'Entrée
            </h3>

            {/* Selector for Type */}
            <div className="space-y-1.5">
              <span className={`text-[10px] font-bold uppercase tracking-widest block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Grandeur physique
              </span>
              <div className={`flex p-1 rounded-lg border ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/90 border-slate-800'
              }`}>
                <button
                  onClick={() => handleTypeChange('accel')}
                  className={`flex-1 text-center py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    type === 'accel'
                      ? 'bg-blue-600 text-white shadow-md border-blue-500'
                      : '${isLight ? "text-slate-600" : "text-slate-400"} hover:text-slate-200'
                  }`}
                >
                  Accélération
                </button>
                <button
                  onClick={() => handleTypeChange('vel')}
                  className={`flex-1 text-center py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    type === 'vel'
                      ? 'bg-blue-600 text-white shadow-md border-blue-500'
                      : '${isLight ? "text-slate-600" : "text-slate-400"} hover:text-slate-200'
                  }`}
                >
                  Vitesse
                </button>
                <button
                  onClick={() => handleTypeChange('disp')}
                  className={`flex-1 text-center py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    type === 'disp'
                      ? 'bg-blue-600 text-white shadow-md border-blue-500'
                      : '${isLight ? "text-slate-600" : "text-slate-400"} hover:text-slate-200'
                  }`}
                >
                  Déplacement
                </button>
              </div>
            </div>

            {/* Value Input */}
            <div className="space-y-1.5">
              <span className={`text-[10px] font-bold uppercase tracking-widest block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Valeur de Mesure
              </span>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.01"
                  value={value}
                  onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
                  className={`flex-1 border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-500 ${
                    isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-white'
                  }`}
                />
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className={`border text-xs rounded-lg px-2.5 outline-none focus:border-blue-500 ${
                    isLight ? 'bg-slate-50 border-slate-200 text-slate-850' : 'bg-slate-900 border-slate-800 text-slate-300'
                  }`}
                >
                  {type === 'accel' && (
                    <>
                      <option value="g_rms">g RMS</option>
                      <option value="g_pk">g Peak</option>
                    </>
                  )}
                  {type === 'vel' && (
                    <>
                      <option value="mms_rms">mm/s RMS</option>
                      <option value="mms_pk">mm/s Peak</option>
                      <option value="ips_rms">in/s (IPS) RMS</option>
                      <option value="ips_pk">in/s (IPS) Peak</option>
                    </>
                  )}
                  {type === 'disp' && (
                    <>
                      <option value="um_pp">µm P-P</option>
                      <option value="mils_pp">mils P-P</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            {/* Frequency Settings */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Fréquence Harmonique (f)</span>
                <span className={`font-mono font-semibold ${isLight ? 'text-blue-600' : 'text-blue-400'}`}>
                  {freq.toFixed(1)} Hz ({Math.round(freq * 60)} CPM)
                </span>
              </div>
              <input
                type="range"
                min="2.0"
                max="200.0"
                step="0.5"
                value={freq}
                onChange={(e) => setFreq(parseFloat(e.target.value))}
                className="w-full accent-blue-500 h-1.5 bg-slate-200 dark:bg-slate-950 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Right column: Results grid (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className={`border p-5 rounded-xl space-y-4 relative ${
            isLight
              ? 'bg-white border-slate-200 shadow-sm text-slate-800'
              : (isBW ? 'bg-slate-950 border-slate-800 text-white' : 'bg-[#1E293B] border-slate-700/60 shadow-lg text-white')
          }`}>
            <h4 className={`text-xs font-bold tracking-widest uppercase border-b pb-2.5 ${
              isLight ? 'text-slate-800 border-slate-200' : 'text-white border-slate-700/50'
            }`}>
              Équivalences Physiques Calculées
            </h4>

            {results && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Acceleration Results */}
                <div className={`border p-4 rounded-xl space-y-2.5 shadow-inner ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
                }`}>
                  <span className="text-red-500 font-bold text-[10px] block uppercase tracking-wider">
                    Accélération (Efforts de choc)
                  </span>
                  <div className="space-y-1.5 font-mono text-xs">
                    <div className={`flex justify-between border-b pb-1.5 ${isLight ? 'border-slate-200' : 'border-slate-800/50'}`}>
                      <span className={isLight ? 'text-slate-500' : 'text-slate-500'}>g RMS</span>
                      <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-slate-250'}`}>{results.accel_g_rms.toFixed(3)} g</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={isLight ? 'text-slate-500' : 'text-slate-500'}>g Peak</span>
                      <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-slate-250'}`}>{results.accel_g_pk.toFixed(3)} g</span>
                    </div>
                  </div>
                </div>

                {/* Velocity Results */}
                <div className={`border p-4 rounded-xl space-y-2.5 shadow-inner ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
                }`}>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[10px] block uppercase tracking-wider">
                    Vitesse (Fatigue / Énergie)
                  </span>
                  <div className="space-y-1.5 font-mono text-xs">
                    <div className={`flex justify-between border-b pb-1.5 ${isLight ? 'border-slate-200' : 'border-slate-800/50'}`}>
                      <span className={isLight ? 'text-slate-500' : 'text-slate-500'}>mm/s RMS</span>
                      <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-slate-250'}`}>{results.vel_mms_rms.toFixed(2)} mm/s</span>
                    </div>
                    <div className={`flex justify-between border-b pb-1.5 ${isLight ? 'border-slate-200' : 'border-slate-800/50'}`}>
                      <span className={isLight ? 'text-slate-500' : 'text-slate-500'}>mm/s Peak</span>
                      <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-slate-250'}`}>{results.vel_mms_pk.toFixed(2)} mm/s</span>
                    </div>
                    <div className={`flex justify-between border-b pb-1.5 ${isLight ? 'border-slate-200' : 'border-slate-800/50'}`}>
                      <span className={isLight ? 'text-slate-500' : 'text-slate-500'}>in/s RMS</span>
                      <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-slate-250'}`}>{results.vel_ips_rms.toFixed(3)} ips</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={isLight ? 'text-slate-500' : 'text-slate-500'}>in/s Peak</span>
                      <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-slate-250'}`}>{results.vel_ips_pk.toFixed(3)} ips</span>
                    </div>
                  </div>
                </div>

                {/* Displacement Results */}
                <div className={`border p-4 rounded-xl space-y-2.5 sm:col-span-2 shadow-inner ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
                }`}>
                  <span className="text-blue-500 font-bold text-[10px] block uppercase tracking-wider">
                    Déplacement (Amplitudes de jeu)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs pt-1">
                    <div className={`flex justify-between border-b pb-1.5 sm:border-0 sm:pb-0 ${isLight ? 'border-slate-200' : 'border-slate-800/50'}`}>
                      <span className={isLight ? 'text-slate-500' : 'text-slate-500'}>µm Crête-à-Crête</span>
                      <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-slate-250'}`}>{results.disp_um_pp.toFixed(1)} µm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={isLight ? 'text-slate-500' : 'text-slate-500'}>mils Crête-à-Crête</span>
                      <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-slate-250'}`}>{results.disp_mils_pp.toFixed(2)} mils</span>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* Theoretical equations reference card */}
          <div className={`border p-4 rounded-xl text-[11px] space-y-2 shadow-lg relative ${
            isLight ? 'bg-white border-slate-200 text-slate-600' : 'bg-[#1E293B] border-slate-700/60 text-slate-300'
          }`}>
            <span className={`font-bold uppercase tracking-wider block flex items-center gap-1 text-[10px] ${isLight ? 'text-slate-800' : 'text-white'}`}>
              <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
              Équations théoriques de passage (pour un sinus pur à fréquence f) :
            </span>
            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[10px] p-2.5 rounded-lg border ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-900/40 border-slate-800 text-slate-400'
            }`}>
              <div>Vitesse Peak = 2 · π · f · Déplacement Peak</div>
              <div>Accél. Peak = (2 · π · f) · Vitesse Peak</div>
              <div>Vitesse RMS = Vitesse Peak / √2</div>
              <div>1 mil = 25.4 µm | 1 inch/s = 25.4 mm/s</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
