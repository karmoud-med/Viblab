export interface PrebuiltTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  htmlContent: string;
}

export const PREBUILT_HTML_MODULES: PrebuiltTemplate[] = [
  {
    id: 'bearing_bpfi_bpfo',
    name: 'Diagnostic Écaillage Roulement (BPFI & BPFO)',
    category: 'Roulements',
    description: 'Module complet avec formules cinématiques, schéma SVG annoté et tableau d\'harmoniques.',
    htmlContent: `<div class="p-6 space-y-6 text-slate-150">
  <div class="border-l-4 border-blue-500 pl-4 py-1 bg-blue-950/20 rounded-r-lg">
    <h3 class="text-xl font-bold text-blue-400">Défauts d'Écaillage des Pistes de Roulement</h3>
    <p class="text-xs text-slate-300 mt-1">Analyse des fréquences caractéristiques d'impact générées lors du passage des billes sur une fissure locale.</p>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div class="p-4 rounded-xl border border-slate-700/80 bg-slate-900/60 space-y-3">
      <span class="text-xs font-bold text-amber-400 uppercase tracking-wider block">1. Formules Cinématiques Fondamentales</span>
      <div class="space-y-2 text-xs font-mono">
        <div class="p-2.5 rounded bg-slate-950/80 border border-slate-800">
          <strong class="text-blue-400 block text-xs">BPFO (Bague Extérieure) :</strong>
          <span class="text-slate-300">BPFO = (n/2) × RPM/60 × [1 - (d/D) × cos(β)]</span>
        </div>
        <div class="p-2.5 rounded bg-slate-950/80 border border-slate-800">
          <strong class="text-emerald-400 block text-xs">BPFI (Bague Intérieure) :</strong>
          <span class="text-slate-300">BPFI = (n/2) × RPM/60 × [1 + (d/D) × cos(β)]</span>
        </div>
        <div class="p-2.5 rounded bg-slate-950/80 border border-slate-800">
          <strong class="text-purple-400 block text-xs">BSF (Corps Roulants) :</strong>
          <span class="text-slate-300">BSF = (D/2d) × RPM/60 × [1 - (d/D)² × cos²(β)]</span>
        </div>
      </div>
    </div>

    <div class="p-4 rounded-xl border border-slate-700/80 bg-slate-900/60 flex flex-col justify-between">
      <span class="text-xs font-bold text-blue-400 uppercase tracking-wider block">2. Schéma de Propagation des Ondes de Choc</span>
      <div class="flex items-center justify-center p-3 bg-slate-950 rounded-lg border border-slate-800">
        <svg viewBox="0 0 200 120" class="w-full max-h-32">
          <circle cx="100" cy="60" r="45" fill="none" stroke="#475569" stroke-width="4" />
          <circle cx="100" cy="60" r="26" fill="none" stroke="#334155" stroke-width="4" />
          <circle cx="100" cy="60" r="18" fill="#1e293b" />
          <!-- Defect point on outer race -->
          <circle cx="100" cy="15" r="4" fill="#ef4444" />
          <text x="100" y="9" text-anchor="middle" fill="#ef4444" font-size="7" font-weight="bold">Défaut Local (Écaillement)</text>
          <!-- Rolling elements -->
          <circle cx="100" cy="24" r="5" fill="#f59e0b" />
          <circle cx="132" cy="42" r="5" fill="#64748b" />
          <circle cx="132" cy="78" r="5" fill="#64748b" />
          <circle cx="100" cy="96" r="5" fill="#64748b" />
          <circle cx="68" cy="78" r="5" fill="#64748b" />
          <circle cx="68" cy="42" r="5" fill="#64748b" />
          <!-- Sensor -->
          <rect x="94" y="6" width="12" height="6" fill="#3b82f6" rx="1" />
        </svg>
      </div>
      <p class="text-[11px] text-slate-400 mt-2 text-center">À chaque passage de bille sur le cratère, une impulsion Dirac brève excite les résonances du capteur.</p>
    </div>
  </div>

  <div class="p-4 rounded-xl border border-slate-700/80 bg-slate-900/60 space-y-2">
    <span class="text-xs font-bold text-emerald-400 uppercase tracking-wider block">3. Critères d'Évolution en 4 Stades ISO</span>
    <div class="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
      <div class="p-2.5 rounded bg-slate-950/60 border border-slate-800">
        <strong class="text-blue-400 block font-bold">Stade 1 : Micro-fissures</strong>
        <p class="text-[11px] text-slate-400 mt-1">Détectable uniquement en ultra-haute fréquence (HFE, PeakVue &gt; 20 kHz).</p>
      </div>
      <div class="p-2.5 rounded bg-slate-950/60 border border-slate-800">
        <strong class="text-emerald-400 block font-bold">Stade 2 : Écaillage naissant</strong>
        <p class="text-[11px] text-slate-400 mt-1">Apparition des fréquences BPFO/BPFI avec bande latérale 1x de modulation.</p>
      </div>
      <div class="p-2.5 rounded bg-slate-950/60 border border-slate-800">
        <strong class="text-amber-400 block font-bold">Stade 3 : Multiples impacts</strong>
        <p class="text-[11px] text-slate-400 mt-1">Harmoniques nombreuses (2x, 3x, 4x BPFI) et élévation du plancher de bruit.</p>
      </div>
      <div class="p-2.5 rounded bg-slate-950/60 border border-slate-800">
        <strong class="text-red-400 block font-bold">Stade 4 : Rupture imminente</strong>
        <p class="text-[11px] text-slate-400 mt-1">Disparition des pics discrets remplacés par un bruit aléatoire massif. Arrêt impératif.</p>
      </div>
    </div>
  </div>
</div>`
  },
  {
    id: 'sensor_mounting_iso',
    name: 'Guide Pratique Fixation Capteurs & Réponse ISO',
    category: 'Instrumentation',
    description: 'Protocoles de serrage, courbes de réponse en fréquence comparatives et erreurs de mesure.',
    htmlContent: `<div class="p-6 space-y-6 text-slate-150">
  <div class="border-l-4 border-emerald-500 pl-4 py-1 bg-emerald-950/20 rounded-r-lg">
    <h3 class="text-xl font-bold text-emerald-400">Technologie de Fixation des Capteurs Accéléromètres</h3>
    <p class="text-xs text-slate-300 mt-1">Impact direct de l'interface mécanique sur la bande passante utile et la fidélité spectrale.</p>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
    <div class="p-4 rounded-xl border border-slate-700 bg-slate-900/60 space-y-2">
      <span class="font-bold text-emerald-400 block text-sm">Goujon Fileté (M6 / 1/4-28)</span>
      <span class="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 inline-block">Bande utile : 0 - 15 kHz</span>
      <p class="text-[11px] text-slate-400 leading-relaxed">
        Fixation idéale pour surveillance permanente et haute fréquence. Requiert un couple de serrage précis (2.5 à 3.5 Nm) et de la graisse silicone sous l'embase.
      </p>
    </div>

    <div class="p-4 rounded-xl border border-slate-700 bg-slate-900/60 space-y-2">
      <span class="font-bold text-blue-400 block text-sm">Embase Collée (Cyanoacrylate)</span>
      <span class="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 inline-block">Bande utile : 0 - 8 kHz</span>
      <p class="text-[11px] text-slate-400 leading-relaxed">
        Alternative non-destructive pour surfaces usinées propres. Assure une excellente transmission sans percer les carters de machines sous garantie.
      </p>
    </div>

    <div class="p-4 rounded-xl border border-slate-700 bg-slate-900/60 space-y-2">
      <span class="font-bold text-amber-400 block text-sm">Aimant Plat ou Bi-pôle</span>
      <span class="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 inline-block">Bande utile : 0 - 3 kHz</span>
      <p class="text-[11px] text-slate-400 leading-relaxed">
        Courant en ronde d'inspection portable. Attention : ne pas laisser claquer l'aimant (risque de saturation du cristal piézo-électrique).
      </p>
    </div>
  </div>

  <div class="p-4 rounded-xl border border-slate-700 bg-slate-900/60 space-y-3">
    <span class="text-xs font-bold text-slate-300 uppercase tracking-wider block">Règles d'Or de l'Inspecteur Vibration</span>
    <ul class="text-xs space-y-2 text-slate-300 list-disc list-inside">
      <li><strong>Positionnement :</strong> Toujours mesurer le plus près possible de la zone de charge du palier (fond de palier ou 90° dans le plan de rotation).</li>
      <li><strong>Préparation de surface :</strong> Éliminer la peinture écaillée et la rouille à l'aide d'un racloir ou fraise à surfacer.</li>
      <li><strong>Câblage :</strong> Éviter les boucles de câbles libres soumises au souffle des ventilateurs pour éliminer les bruits triboélectriques parasites.</li>
    </ul>
  </div>
</div>`
  },
  {
    id: 'unbalance_misalignment_fft',
    name: 'Balourd vs Désalignement : Discrimination FFT',
    category: 'Défauts Mécaniques',
    description: 'Comparaison des composantes radiales/axiales, phase 1x vs 2x et signatures types.',
    htmlContent: `<div class="p-6 space-y-6 text-slate-150">
  <div class="border-l-4 border-purple-500 pl-4 py-1 bg-purple-950/20 rounded-r-lg">
    <h3 class="text-xl font-bold text-purple-400">Discrimination Spectrale : Balourd vs Désalignement</h3>
    <p class="text-xs text-slate-300 mt-1">Méthodologie infaillible pour différencier les deux défauts mécaniques les plus fréquents en industrie.</p>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <!-- Balourd -->
    <div class="p-4 rounded-xl border border-purple-800/60 bg-purple-950/20 space-y-3">
      <div class="flex justify-between items-center">
        <span class="font-extrabold text-sm text-purple-400">BALOURD PUR (1x RPM)</span>
        <span class="text-[9px] font-mono px-2 py-0.5 rounded bg-purple-900/60 text-purple-200">Force Centrifuge</span>
      </div>
      <div class="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono space-y-1.5">
        <div><strong>Spectre FFT :</strong> Pic dominant unique à 1x RPM (sans harmoniques significatives).</div>
        <div><strong>Direction :</strong> Radiale prédominante (Horizontale &gt; Verticale sur fondation souple).</div>
        <div><strong>Vibration Axiale :</strong> Faible (&lt; 20% du radial).</div>
        <div><strong>Phase croisée H/V :</strong> Déphasage stable d'environ 90° (±30°).</div>
      </div>
      <p class="text-[11px] text-slate-400">Solution : Équilibrage dynamique sur site en 1 ou 2 plans à l'aide de masses de correction.</p>
    </div>

    <!-- Desalignement -->
    <div class="p-4 rounded-xl border border-blue-800/60 bg-blue-950/20 space-y-3">
      <div class="flex justify-between items-center">
        <span class="font-extrabold text-sm text-blue-400">DÉSALIGNEMENT (1x + 2x RPM)</span>
        <span class="text-[9px] font-mono px-2 py-0.5 rounded bg-blue-900/60 text-blue-200">Couple de Cisaillement</span>
      </div>
      <div class="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono space-y-1.5">
        <div><strong>Spectre FFT :</strong> Pics à 1x RPM et fort pic à 2x RPM (parfois 3x selon accouplement).</div>
        <div><strong>Direction :</strong> Forte composante axiale en désalignement angulaire.</div>
        <div><strong>Vibration Axiale :</strong> Élevée (&gt; 50% de la radiale).</div>
        <div><strong>Phase à travers accouplement :</strong> Déphasage proche de 180° entre paliers adjacents.</div>
      </div>
      <p class="text-[11px] text-slate-400">Solution : Lignage d'arbres au comparateur ou système laser optique double tête.</p>
    </div>
  </div>

  <div class="p-4 rounded-xl border border-slate-700 bg-slate-900/60">
    <span class="text-xs font-bold text-amber-400 uppercase tracking-wider block mb-2">Synthèse de Décision Rapide</span>
    <table class="w-full text-xs text-left border-collapse font-mono">
      <thead>
        <tr class="border-b border-slate-800 text-slate-400">
          <th class="py-1.5">Paramètre</th>
          <th class="py-1.5">Balourd</th>
          <th class="py-1.5">Désalignement Angulaire</th>
          <th class="py-1.5">Désalignement Parallèle</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-800/60 text-slate-300">
        <tr>
          <td class="py-1.5 font-bold">Fréquence reine</td>
          <td class="text-purple-400">1x RPM</td>
          <td class="text-blue-400">1x RPM (Axial)</td>
          <td class="text-emerald-400">2x RPM (Radial)</td>
        </tr>
        <tr>
          <td class="py-1.5 font-bold">Vibration axiale</td>
          <td>Négligeable</td>
          <td class="text-amber-400">Très importante</td>
          <td>Modérée</td>
        </tr>
        <tr>
          <td class="py-1.5 font-bold">Déphasage accouplement</td>
          <td>0°</td>
          <td class="text-red-400">180° (Axial)</td>
          <td class="text-red-400">180° (Radial)</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>`
  },
  {
    id: 'iso_20816_matrix',
    name: 'Matrice de Sévérité Vibratoire ISO 20816-3',
    category: 'Normes & Seuils',
    description: 'Seuils d\'alarme et de déclenchement selon la puissance machine et le type de fondation.',
    htmlContent: `<div class="p-6 space-y-6 text-slate-150">
  <div class="border-l-4 border-amber-500 pl-4 py-1 bg-amber-950/20 rounded-r-lg">
    <h3 class="text-xl font-bold text-amber-400">Grille Officielle de Sévérité ISO 20816-3 / 10816-3</h3>
    <p class="text-xs text-slate-300 mt-1">Limites en vitesse globale efficace (mm/s RMS) pour machines industrielles de 15 kW à 50 MW.</p>
  </div>

  <div class="overflow-x-auto rounded-xl border border-slate-700">
    <table class="w-full text-xs text-center border-collapse">
      <thead class="bg-slate-900 text-slate-300 font-bold border-b border-slate-700">
        <tr>
          <th class="p-3 text-left">Zone de Sévérité</th>
          <th class="p-3">Groupe 1 (Rigide)</th>
          <th class="p-3">Groupe 1 (Souple)</th>
          <th class="p-3">Groupe 2 (Rigide)</th>
          <th class="p-3">Groupe 2 (Souple)</th>
          <th class="p-3 text-left">Action Opérationnelle</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-800 font-mono">
        <tr class="bg-emerald-950/30 text-emerald-300">
          <td class="p-3 font-bold text-left">Zone A : Neuf / Reconditionné</td>
          <td class="p-3">&lt; 2.3 mm/s</td>
          <td class="p-3">&lt; 3.5 mm/s</td>
          <td class="p-3">&lt; 1.4 mm/s</td>
          <td class="p-3">&lt; 2.3 mm/s</td>
          <td class="p-3 text-left font-sans text-slate-300">Acceptation machine sans restriction.</td>
        </tr>
        <tr class="bg-blue-950/30 text-blue-300">
          <td class="p-3 font-bold text-left">Zone B : Fonctionnement Illimité</td>
          <td class="p-3">2.3 - 4.5</td>
          <td class="p-3">3.5 - 7.1</td>
          <td class="p-3">1.4 - 2.8</td>
          <td class="p-3">2.3 - 4.5</td>
          <td class="p-3 text-left font-sans text-slate-300">Exploitation continue à long terme normale.</td>
        </tr>
        <tr class="bg-amber-950/30 text-amber-300">
          <td class="p-3 font-bold text-left">Zone C : Alerte / Restreint</td>
          <td class="p-3">4.5 - 7.1</td>
          <td class="p-3">7.1 - 11.0</td>
          <td class="p-3">2.8 - 4.5</td>
          <td class="p-3">4.5 - 7.1</td>
          <td class="p-3 text-left font-sans text-slate-300">Planifier une inspection et intervention rapprochée.</td>
        </tr>
        <tr class="bg-red-950/30 text-red-300 font-bold">
          <td class="p-3 font-bold text-left">Zone D : Danger / Arrêt Immédiat</td>
          <td class="p-3">&gt; 7.1 mm/s</td>
          <td class="p-3">&gt; 11.0 mm/s</td>
          <td class="p-3">&gt; 4.5 mm/s</td>
          <td class="p-3">&gt; 7.1 mm/s</td>
          <td class="p-3 text-left font-sans text-slate-300">Arrêt obligatoire sous peine de détérioration grave.</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
    <div class="p-3.5 rounded-lg border border-slate-800 bg-slate-900/60">
      <strong class="text-blue-400 block mb-1">Groupe 1 : Grosses machines</strong>
      <p class="text-slate-400">Moteurs &gt; 300 kW, turbines industrielles, compresseurs lourds de raffinerie ou cimenterie.</p>
    </div>
    <div class="p-3.5 rounded-lg border border-slate-800 bg-slate-900/60">
      <strong class="text-emerald-400 block mb-1">Groupe 2 : Machines moyennes</strong>
      <p class="text-slate-400">Moteurs de 15 kW à 300 kW, pompes centrifuges, ventilateurs industriels de process.</p>
    </div>
  </div>
</div>`
  }
];
