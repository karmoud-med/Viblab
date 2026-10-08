import React, { useState } from 'react';
import { ClipboardList, Printer, Copy, Check, FileText, User, RefreshCw, Send } from 'lucide-react';

interface ReportProps {
  theme: 'light' | 'dark' | 'mono';
}

interface MeasurementPoint {
  point: string;
  rms: number;
  phase: string;
  status: 'Conforme' | 'Alerte' | 'Danger';
}

export default function ExpertReportModule({ theme }: ReportProps) {
  const isLight = theme === 'light';
  const isBW = theme === 'mono';

  // State parameters for report
  const [operator, setOperator] = useState<string>('A. GOMES');
  const [site, setSite] = useState<string>('OCP - MAROC / COMPLEXE INDUSTRIEL');
  const [machineId, setMachineId] = useState<string>('30-K-101 / TURBO-VENTILATEUR DE SOUFFLAGE');
  const [rpm, setRpm] = useState<number>(1495);
  const [defectDiagnostic, setDefectDiagnostic] = useState<string>('Défaut de Balourd Statique (Rotor)');
  const [severityStatus, setSeverityStatus] = useState<string>('Insatisfaisant (Alerte Zone C)');
  const [copied, setCopied] = useState<boolean>(false);

  // Measurements points table state
  const [measurements, setMeasurements] = useState<MeasurementPoint[]>([
    { point: 'Palier 1 (NDE Moteur) - Horizontal', rms: 1.8, phase: '0°', status: 'Conforme' },
    { point: 'Palier 1 (NDE Moteur) - Vertical', rms: 1.5, phase: '90°', status: 'Conforme' },
    { point: 'Palier 2 (DE Moteur) - Horizontal', rms: 5.8, phase: '0°', status: 'Alerte' },
    { point: 'Palier 2 (DE Moteur) - Vertical', rms: 5.6, phase: '91°', status: 'Alerte' },
    { point: 'Palier 2 (DE Moteur) - Axial', rms: 0.9, phase: '0°', status: 'Conforme' },
  ]);

  // Comments
  const [inspectorComments, setInspectorComments] = useState<string>(
    'Le spectre FFT montre un pic unique dominant à la fréquence de rotation nominale (1X = 24.9 Hz) uniquement sur le sens radial (H et V) du palier DE. ' +
    'Le déphasage orthogonal de 91° entre H et V confirme sans équivoque la signature d\'un balourd de rotor statique. ' +
    'Les niveaux vibratoires globaux dépassent le seuil d\'alerte ISO 10816-3 (Zone C). Une intervention d\'équilibrage est fortement recommandée.'
  );

  // Recommendations checkboxes
  const [recommendations, setRecommendations] = useState({
    balancing: true,
    alignment: false,
    tightening: false,
    bearingReplacement: false,
    reMeasure: true
  });

  const handleCopy = () => {
    const textReport = `
======================================================================
                 RAPPORT D'EXPERTISE TECHNIQUE VIBRATOIRE             
======================================================================
Généré par : VibLab Intelligence Center

1. INFORMATIONS GÉNÉRALES
----------------------------------------------------------------------
Inspecteur / Opérateur  : ${operator}
Site Industriel / Client : ${site}
Identifiant Machine     : ${machineId}
Vitesse de rotation     : ${rpm} RPM
Date d'analyse          : ${new Date().toLocaleDateString('fr-FR')}

2. SYNTHÈSE DU DIAGNOSTIC
----------------------------------------------------------------------
Diagnostic Principal   : ${defectDiagnostic}
Niveau de Sévérité     : ${severityStatus}

3. TABLEAU DES MESURES GLOBALES
----------------------------------------------------------------------
${measurements.map(m => `${m.point.padEnd(40)} | RMS: ${m.rms.toFixed(1)} mm/s | Phase: ${m.phase.padEnd(5)} | Statut: ${m.status}`).join('\n')}

4. COMMENTAIRES TECHNIQUES ET DIAGNOSTIC DE L'EXPERT
----------------------------------------------------------------------
${inspectorComments}

5. RECOMMANDATIONS ET PLAN D'ACTION DE MAINTENANCE
----------------------------------------------------------------------
${recommendations.balancing ? '[X] Procéder à un équilibrage dynamique in-situ (Rotor).' : '[ ] Équilibrage.'}
${recommendations.alignment ? '[X] Effectuer un alignement laser de précision des arbres.' : '[ ] Alignement.'}
${recommendations.tightening ? '[X] Serrer les vis de fondation / Corriger le pied souple.' : '[ ] Fixation structurelle.'}
${recommendations.bearingReplacement ? '[X] Remplacer les roulements défectueux (Palier DE).' : '[ ] Remplacement roulement.'}
${recommendations.reMeasure ? '[X] Planifier un contrôle vibratoire post-intervention.' : '[ ] Suivi préventif.'}

----------------------------------------------------------------------
                       Signature de l'expert : ${operator}
======================================================================
    `;
    navigator.clipboard.writeText(textReport.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const loadPreset = (type: 'balourd' | 'alignement' | 'roulement') => {
    if (type === 'balourd') {
      setDefectDiagnostic('Défaut de Balourd Statique (Rotor)');
      setSeverityStatus('Insatisfaisant (Alerte Zone C)');
      setMeasurements([
        { point: 'Palier 1 (NDE Moteur) - Horizontal', rms: 1.8, phase: '0°', status: 'Conforme' },
        { point: 'Palier 1 (NDE Moteur) - Vertical', rms: 1.5, phase: '90°', status: 'Conforme' },
        { point: 'Palier 2 (DE Moteur) - Horizontal', rms: 5.8, phase: '0°', status: 'Alerte' },
        { point: 'Palier 2 (DE Moteur) - Vertical', rms: 5.6, phase: '91°', status: 'Alerte' },
        { point: 'Palier 2 (DE Moteur) - Axial', rms: 0.9, phase: '0°', status: 'Conforme' },
      ]);
      setInspectorComments(
        'Le spectre FFT montre un pic unique dominant à la fréquence de rotation nominale (1X) uniquement sur le sens radial (H et V) du palier DE. ' +
        'Le déphasage de 91° entre H et V confirme la signature d\'un balourd de rotor. Les niveaux vibratoires globaux dépassent le seuil d\'alerte ISO 10816-3 (Zone C). Une intervention d\'équilibrage est requise.'
      );
      setRecommendations({
        balancing: true,
        alignment: false,
        tightening: false,
        bearingReplacement: false,
        reMeasure: true
      });
    } else if (type === 'alignement') {
      setDefectDiagnostic('Désalignement Angulaire / Parallèle d\'arbre');
      setSeverityStatus('Critique (Danger Zone D)');
      setMeasurements([
        { point: 'Palier 1 (NDE Moteur) - Horizontal', rms: 2.1, phase: '0°', status: 'Conforme' },
        { point: 'Palier 2 (DE Moteur) - Horizontal', rms: 7.2, phase: '0°', status: 'Danger' },
        { point: 'Palier 2 (DE Moteur) - Vertical', rms: 4.8, phase: '90°', status: 'Alerte' },
        { point: 'Palier 2 (DE Moteur) - Axial', rms: 8.4, phase: '180°', status: 'Danger' },
        { point: 'Palier 3 (DE Ventilateur) - Axial', rms: 8.1, phase: '0°', status: 'Danger' },
      ]);
      setInspectorComments(
        'Présence d\'une amplitude extrêmement élevée à 1X et 2X (2 fois la fréquence de rotation) avec une forte composante axiale sur les paliers DE et de part et d\'autre du manchon d\'accouplement. ' +
        'Le déphasage axial de 180° de part et d\'autre de l\'accouplement confirme un désalignement critique. Arrêter la machine dès que possible pour réaligner.'
      );
      setRecommendations({
        balancing: false,
        alignment: true,
        tightening: true,
        bearingReplacement: false,
        reMeasure: true
      });
    } else {
      setDefectDiagnostic('Défaut de Roulement Écaillé (Bague Interne)');
      setSeverityStatus('Insatisfaisant (Alerte Zone C)');
      setMeasurements([
        { point: 'Palier 1 (NDE Moteur) - Horizontal', rms: 1.4, phase: '0°', status: 'Conforme' },
        { point: 'Palier 2 (DE Moteur) - Horizontal', rms: 4.6, phase: '120°', status: 'Alerte' },
        { point: 'Palier 2 (DE Moteur) - Accélération g', rms: 12.5, phase: 'N/A', status: 'Alerte' },
        { point: 'Palier 3 (DE Ventilateur) - Horizontal', rms: 1.1, phase: '0°', status: 'Conforme' },
      ]);
      setInspectorComments(
        'Le spectre FFT d\'accélération affiche des pics énergétiques significatifs aux fréquences BPFI caractéristiques du roulement (environ 4.9X) avec des bandes de modulation latérales espacées de la fréquence de rotation (1X). ' +
        'La valeur globale efficace d\'accélération haute fréquence confirme un écaillage prononcé de la piste interne.'
      );
      setRecommendations({
        balancing: false,
        alignment: false,
        tightening: false,
        bearingReplacement: true,
        reMeasure: true
      });
    }
  };

  return (
    <div className={`space-y-6 ${isLight ? 'text-slate-800' : 'text-slate-100'}`} id="expert_report_root">
      {/* Upper header card */}
      <div className={`p-6 rounded-2xl border transition-all shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800'
      }`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-purple-500" />
            <h2 className="text-xl font-extrabold tracking-tight">Générateur Automatique de Rapport d'Expertise</h2>
          </div>
          <p className={`text-xs ${isLight ? "text-slate-600" : "text-slate-400"}`}>
            Établissez des rapports formels d'inspection vibratoire pour vos équipes de maintenance. Personnalisez les constats et exportez-les au format universel.
          </p>
        </div>

        {/* Preset switch buttons */}
        <div className={`flex rounded border ${isLight ? "border-slate-300" : "border-slate-800"} p-1 ${isLight ? "bg-slate-100" : "bg-slate-950/20"} text-[10px] font-bold gap-1`}>
          <span className={`${isLight ? "text-slate-600" : "text-slate-400"} self-center px-1`}>Gabarits :</span>
          <button
            onClick={() => loadPreset('balourd')}
            className={`px-2 py-1 ${isLight ? "bg-slate-200" : "bg-slate-800"} hover:bg-slate-700 rounded ${isLight ? "text-slate-700" : "text-slate-300"} transition-all cursor-pointer`}
          >
            Balourd
          </button>
          <button
            onClick={() => loadPreset('alignement')}
            className={`px-2 py-1 ${isLight ? "bg-slate-200" : "bg-slate-800"} hover:bg-slate-700 rounded ${isLight ? "text-slate-700" : "text-slate-300"} transition-all cursor-pointer`}
          >
            Désalignement
          </button>
          <button
            onClick={() => loadPreset('roulement')}
            className={`px-2 py-1 ${isLight ? "bg-slate-200" : "bg-slate-800"} hover:bg-slate-700 rounded ${isLight ? "text-slate-700" : "text-slate-300"} transition-all cursor-pointer`}
          >
            Roulement
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: input fields and forms (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className={`p-5 rounded-xl border flex flex-col gap-4 ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900/40 border-slate-800'
          }`}>
            <span className={`text-xs font-bold uppercase tracking-wider text-purple-400 block border-b ${isLight ? "border-slate-300" : "border-slate-800"} pb-2`}>
              Saisie des Données d'Inspection
            </span>

            {/* Form Fields */}
            <div className="space-y-3.5 text-xs">
              <div>
                <label className={`block ${isLight ? "text-slate-600" : "text-slate-400"} font-bold mb-1`}>Inspecteur / Analyste certifié :</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                  <input
                    type="text"
                    value={operator}
                    onChange={(e) => setOperator(e.target.value)}
                    className={`w-full ${isLight ? "bg-white" : "bg-slate-950"} border ${isLight ? "border-slate-300" : "border-slate-800"} rounded-md p-2 pl-9 text-xs font-semibold focus:outline-none focus:border-purple-500 ${isLight ? "text-slate-800" : "text-slate-200"}`}
                  />
                </div>
              </div>

              <div>
                <label className={`block ${isLight ? "text-slate-600" : "text-slate-400"} font-bold mb-1`}>Complexe Industriel / Site :</label>
                <input
                  type="text"
                  value={site}
                  onChange={(e) => setSite(e.target.value)}
                  className={`w-full ${isLight ? "bg-white" : "bg-slate-950"} border ${isLight ? "border-slate-300" : "border-slate-800"} rounded-md p-2 text-xs font-semibold focus:outline-none focus:border-purple-500 ${isLight ? "text-slate-800" : "text-slate-200"}`}
                />
              </div>

              <div>
                <label className={`block ${isLight ? "text-slate-600" : "text-slate-400"} font-bold mb-1`}>Désignation / Repère Machine :</label>
                <input
                  type="text"
                  value={machineId}
                  onChange={(e) => setMachineId(e.target.value)}
                  className={`w-full ${isLight ? "bg-white" : "bg-slate-950"} border ${isLight ? "border-slate-300" : "border-slate-800"} rounded-md p-2 text-xs font-semibold focus:outline-none focus:border-purple-500 ${isLight ? "text-slate-800" : "text-slate-200"}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={`block ${isLight ? "text-slate-600" : "text-slate-400"} font-bold mb-1`}>Vitesse (RPM) :</label>
                  <input
                    type="number"
                    value={rpm}
                    onChange={(e) => setRpm(Number(e.target.value))}
                    className={`w-full ${isLight ? "bg-white" : "bg-slate-950"} border ${isLight ? "border-slate-300" : "border-slate-800"} rounded-md p-2 text-xs font-semibold focus:outline-none focus:border-purple-500 ${isLight ? "text-slate-800" : "text-slate-200"} font-mono`}
                  />
                </div>
                <div>
                  <label className={`block ${isLight ? "text-slate-600" : "text-slate-400"} font-bold mb-1`}>Sévérité Générale :</label>
                  <select
                    value={severityStatus}
                    onChange={(e) => setSeverityStatus(e.target.value)}
                    className={`w-full ${isLight ? "bg-white" : "bg-slate-950"} border ${isLight ? "border-slate-300" : "border-slate-800"} rounded-md p-2 text-xs font-semibold focus:outline-none focus:border-purple-500 ${isLight ? "text-slate-800" : "text-slate-200"}`}
                  >
                    <option value="Excellent (Zone A)">Excellent (Zone A)</option>
                    <option value="Satisfaisant (Zone B)">Satisfaisant (Zone B)</option>
                    <option value="Insatisfaisant (Alerte Zone C)">Insatisfaisant (Alerte Zone C)</option>
                    <option value="Critique (Danger Zone D)">Critique (Danger Zone D)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={`block ${isLight ? "text-slate-600" : "text-slate-400"} font-bold mb-1`}>Diagnostic principal de l'anomalie :</label>
                <input
                  type="text"
                  value={defectDiagnostic}
                  onChange={(e) => setDefectDiagnostic(e.target.value)}
                  className={`w-full ${isLight ? "bg-white" : "bg-slate-950"} border ${isLight ? "border-slate-300" : "border-slate-800"} rounded-md p-2 text-xs font-semibold focus:outline-none focus:border-purple-500 ${isLight ? "text-slate-800" : "text-slate-200"}`}
                />
              </div>

              <div>
                <label className={`block ${isLight ? "text-slate-600" : "text-slate-400"} font-bold mb-1`}>Conclusions détaillées et spectre :</label>
                <textarea
                  value={inspectorComments}
                  rows={4}
                  onChange={(e) => setInspectorComments(e.target.value)}
                  className={`w-full ${isLight ? "bg-white" : "bg-slate-950"} border ${isLight ? "border-slate-300" : "border-slate-800"} rounded-md p-2 text-xs font-semibold focus:outline-none focus:border-purple-500 ${isLight ? "text-slate-800" : "text-slate-200"} leading-relaxed font-sans`}
                />
              </div>

              {/* Recommendations Checkbox Lists */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
                <label className={`block ${isLight ? "text-slate-600" : "text-slate-400"} font-bold`}>Mesures d'Intervention Recommandées :</label>
                <div className={`grid grid-cols-1 gap-1 font-semibold ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                  <label className={`flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-slate-950/20`}>
                    <input
                      type="checkbox"
                      checked={recommendations.balancing}
                      onChange={(e) => setRecommendations({ ...recommendations, balancing: e.target.checked })}
                      className="accent-purple-500"
                    />
                    <span>Équilibrage dynamique sur site (Rotor)</span>
                  </label>
                  <label className={`flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-slate-950/20`}>
                    <input
                      type="checkbox"
                      checked={recommendations.alignment}
                      onChange={(e) => setRecommendations({ ...recommendations, alignment: e.target.checked })}
                      className="accent-purple-500"
                    />
                    <span>Réalignement laser des arbres accouplés</span>
                  </label>
                  <label className={`flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-slate-950/20`}>
                    <input
                      type="checkbox"
                      checked={recommendations.tightening}
                      onChange={(e) => setRecommendations({ ...recommendations, tightening: e.target.checked })}
                      className="accent-purple-500"
                    />
                    <span>Serrage / Correction de fondation (Pied souple)</span>
                  </label>
                  <label className={`flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-slate-950/20`}>
                    <input
                      type="checkbox"
                      checked={recommendations.bearingReplacement}
                      onChange={(e) => setRecommendations({ ...recommendations, bearingReplacement: e.target.checked })}
                      className="accent-purple-500"
                    />
                    <span>Changement des roulements de paliers</span>
                  </label>
                  <label className={`flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-slate-950/20`}>
                    <input
                      type="checkbox"
                      checked={recommendations.reMeasure}
                      onChange={(e) => setRecommendations({ ...recommendations, reMeasure: e.target.checked })}
                      className="accent-purple-500"
                    />
                    <span>Contrôle et contre-mesure après travaux</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Formatted Professional Report Preview (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className={`p-4 rounded-xl border flex flex-col gap-4 ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900/40 border-slate-800'
          }`}>
            <div className={`flex justify-between items-center border-b ${isLight ? "border-slate-300" : "border-slate-800"} pb-2`}>
              <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? "text-slate-600" : "text-slate-400"} flex items-center gap-1.5`}>
                <FileText className="w-4 h-4 text-purple-500" />
                Aperçu Fiche d'Expertise (Prêt pour Impression / PDF)
              </span>

              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className={`px-3 py-1.5 ${isLight ? "bg-slate-200" : "bg-slate-800"} hover:bg-slate-700 ${isLight ? "text-slate-800" : "text-slate-200"} text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer`}
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copié' : 'Copier Texte'}
                </button>
                <button
                  onClick={handlePrint}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Imprimer / PDF
                </button>
              </div>
            </div>

            {/* Document sheet template styled as physical paper */}
            <div className="bg-white border border-slate-300 rounded-xl p-6 text-slate-950 font-sans shadow-md text-xs leading-relaxed space-y-4 shadow-slate-950/10">
              {/* Document Header Logo */}
              <div className={`flex justify-between items-start border-b-2 ${isLight ? "border-slate-300" : "border-slate-800"} pb-4`}>
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 ${isLight ? "bg-slate-50" : "bg-slate-900"} text-white rounded flex items-center justify-center font-black`}>
                    VL
                  </div>
                  <div className="flex flex-col">
                    <span className="font-extrabold text-[13px] tracking-wide uppercase leading-none text-slate-900">
                      VibLab Intelligence
                    </span>
                    <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">
                      Centre d'expertise vibratoire
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono text-[9px] text-slate-500 font-bold block uppercase tracking-wider">Document Certifié</span>
                  <span className="font-mono text-[10px] text-slate-900 font-extrabold block">ID-REF: #REP-2026-A</span>
                </div>
              </div>

              {/* Title */}
              <div className="text-center py-2 bg-slate-100 rounded border border-slate-200">
                <h1 className="text-sm font-black uppercase text-slate-900 tracking-wide">
                  Rapport de Diagnostic d'Expertise Vibratoire
                </h1>
              </div>

              {/* General Metadata */}
              <div className="grid grid-cols-2 gap-4 text-[11px] border-b pb-3 border-slate-100">
                <div className="space-y-1">
                  <p><strong className="text-slate-600 font-semibold">Inspecteur :</strong> {operator}</p>
                  <p><strong className="text-slate-600 font-semibold">Client / Site :</strong> {site}</p>
                  <p><strong className="text-slate-600 font-semibold">Organe Machine :</strong> {machineId}</p>
                </div>
                <div className="space-y-1">
                  <p><strong className="text-slate-600 font-semibold">Vitesse de rotation :</strong> {rpm} RPM</p>
                  <p><strong className="text-slate-600 font-semibold">Date d'édition :</strong> {new Date().toLocaleDateString('fr-FR')}</p>
                  <p><strong className="text-slate-600 font-semibold">Statut Général :</strong> <span className="font-bold underline text-red-700">{severityStatus}</span></p>
                </div>
              </div>

              {/* Technical synthesis */}
              <div className="space-y-1.5">
                <h3 className="text-[11px] font-black uppercase border-l-4 border-slate-900 pl-2 text-slate-900 tracking-wider">
                  1. Synthèse de l'Anomalie et Diagnostic
                </h3>
                <p className="font-bold text-[12px] text-slate-900 bg-red-50 p-2 rounded border border-red-200/50">
                  🎯 {defectDiagnostic}
                </p>
              </div>

              {/* Measurements points list */}
              <div className="space-y-2">
                <h3 className="text-[11px] font-black uppercase border-l-4 border-slate-900 pl-2 text-slate-900 tracking-wider">
                  2. Synthèse des Mesures Globales
                </h3>
                <div className="border border-slate-200 rounded overflow-hidden">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 font-extrabold text-slate-700">
                        <th className="p-1.5 pl-3">Point de relevé</th>
                        <th className="p-1.5 text-center">RMS (mm/s)</th>
                        <th className="p-1.5 text-center">Angle Phase</th>
                        <th className="p-1.5 text-center">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {measurements.map((m, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-1.5 pl-3 text-slate-800 font-bold">{m.point}</td>
                          <td className="p-1.5 text-center font-mono font-bold text-slate-900">{m.rms.toFixed(1)}</td>
                          <td className="p-1.5 text-center font-mono">{m.phase}</td>
                          <td className="p-1.5 text-center">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              m.status === 'Conforme' ? 'bg-green-100 text-green-800' :
                              m.status === 'Alerte' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {m.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Expert Observations */}
              <div className="space-y-1.5">
                <h3 className="text-[11px] font-black uppercase border-l-4 border-slate-900 pl-2 text-slate-900 tracking-wider">
                  3. Commentaires Techniques de l'Inspecteur
                </h3>
                <p className="bg-slate-50 p-3 rounded border border-slate-200/50 text-slate-800 leading-relaxed text-[11px]">
                  {inspectorComments}
                </p>
              </div>

              {/* Maintenance recommendations */}
              <div className="space-y-2">
                <h3 className="text-[11px] font-black uppercase border-l-4 border-slate-900 pl-2 text-slate-900 tracking-wider">
                  4. Plan d'Action Corrective Préconisé
                </h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-1.5 pl-4 list-disc text-slate-800 font-bold text-[11px]">
                  {recommendations.balancing && <li>Équilibrage dynamique in-situ (Rotor)</li>}
                  {recommendations.alignment && <li>Réalignement d'arbres par accouplement laser</li>}
                  {recommendations.tightening && <li>Serrage de fondation / Correction pied souple</li>}
                  {recommendations.bearingReplacement && <li>Remplacement des roulements (Palier DE)</li>}
                  {recommendations.reMeasure && <li>Campagne de mesure de validation post-maintenance</li>}
                </ul>
              </div>

              {/* Signature block */}
              <div className="flex justify-between items-end pt-6 mt-4 border-t border-slate-200">
                <div className={`text-[9px] ${isLight ? "text-slate-600" : "text-slate-400"} font-mono`}>
                  Édité électroniquement via VibLab Cloud Service
                </div>
                <div className="text-right space-y-1">
                  <p className="font-bold text-slate-700">Signature de l'Expert :</p>
                  <p className="font-black text-[12px] italic underline font-mono text-slate-950 uppercase tracking-widest">{operator}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
