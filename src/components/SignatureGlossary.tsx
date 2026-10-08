import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Info, 
  BookOpen, 
  Layers, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw, 
  Compass, 
  Eye, 
  Settings, 
  Sliders, 
  Gauge, 
  FileText, 
  Check, 
  Plus, 
  X, 
  ChevronRight, 
  ArrowUpDown, 
  TrendingUp, 
  Sparkles,
  Award
} from 'lucide-react';

interface SignatureGlossaryProps {
  theme?: 'dark' | 'light' | 'mono';
}

// Interface for database records
interface FftPeak {
  freq: string;
  label: string;
  amplitude: number; // 0 to 100 for graph representation
  desc: string;
}

interface FaultRecord {
  id: string;
  name: string;
  category: 'Mécanique' | 'Composants' | 'Transmission' | 'Structure' | 'Électrique';
  subCategory: string;
  difficulty: 'Facile' | 'Moyen' | 'Difficile' | 'Expert';
  severityImpact: string;
  summary: string;
  description: string;
  formula: string;
  formulaDesc: string;
  spectrumAnalysis: string;
  waveformAnalysis: string;
  phaseAnalysis: string;
  confirmationChecklist: string[];
  fftPeaks: FftPeak[];
  timeWaveType: 'sinusoid' | 'double_peak' | 'truncated' | 'subharmonic' | 'transient' | 'noise' | 'modulated' | 'resonance';
  phaseGraphicType: 'quadrature' | 'coupling_axial' | 'coupling_radial' | 'unstable' | 'transition';
}

// Dynamic Fault Signatures Database compiled from Technical Vibration Analysis Charts
const FAULT_SIGNATURES: FaultRecord[] = [
  {
    id: 'unbalance',
    name: 'Balourd (Déséquilibre de Masse)',
    category: 'Mécanique',
    subCategory: 'Rotor & Masse',
    difficulty: 'Facile',
    severityImpact: 'Modéré à Très Élevé',
    summary: 'Pic radial dominant unique à 1X, harmoniques négligeables. Phase stable et en quadrature (90°) entre directions H et V.',
    description: 'Le balourd résulte d\'une distribution asymétrique de la masse d\'un rotor par rapport à son axe de rotation géométrique. C\'est le défaut le plus courant sur les machines tournantes. La force centrifuge générée est proportionnelle au carré de la vitesse de rotation (F = m · e · ω²), ce qui signifie que la sévérité vibratoire s\'accroît drastiquement avec la vitesse.',
    formula: 'F_{c} = m \\cdot e \\cdot \\omega^2',
    formulaDesc: 'm = masse excentrée (kg), e = excentricité radiale (m), ω = vitesse angulaire (rad/s).',
    spectrumAnalysis: 'Le spectre présente un pic dominant unique à la fréquence de rotation de l\'arbre (1X) dans le plan radial (horizontal et vertical). Les vibrations axiales sont généralement négligeables (sauf pour les rotors en porte-à-faux). Les harmoniques supérieures (2X, 3X, etc.) sont absentes ou d\'amplitude extrêmement réduite.',
    waveformAnalysis: 'La forme d\'onde temporelle est une sinusoïde presque parfaite et régulière à la fréquence de rotation fondamentale de la machine, dénuée d\'impacts ou de modulations.',
    phaseAnalysis: 'La phase à la fréquence 1X est stable et reproductible. Sur un même palier, on mesure un déphasage rigoureux de 90° (±30°) entre le capteur horizontal et le capteur vertical (quadrature). Entre les deux paliers d\'un même arbre : en phase (0°) indique un balourd statique pur ; en opposition de phase (180°) indique un balourd de couple pur.',
    confirmationChecklist: [
      'Amplitude à 1X strictement proportionnelle au carré du RPM (si vitesse variable).',
      'Phase stable dans le temps à ±5° près.',
      'Déphasage horizontal/vertical d\'environ 90° sur le même palier.',
      'L\'équilibrage dynamique (ajout de masses correctrices) élimine immédiatement la signature.'
    ],
    fftPeaks: [
      { freq: '1X', label: 'Vitesse de rotation', amplitude: 95, desc: 'Fréquence fondamentale de rotation de l\'arbre. Concentre l\'essentiel de l\'énergie vibratoire.' },
      { freq: '2X', label: '2ème harmonique', amplitude: 6, desc: 'Amplitude minime, généralement liée à un léger pli ou serrage induit.' },
      { freq: '3X', label: '3ème harmonique', amplitude: 2, desc: 'Généralement absente du bruit de fond.' }
    ],
    timeWaveType: 'sinusoid',
    phaseGraphicType: 'quadrature'
  },
  {
    id: 'angular_misalignment',
    name: 'Désalignement Angulaire',
    category: 'Mécanique',
    subCategory: 'Accouplement',
    difficulty: 'Moyen',
    severityImpact: 'Élevé',
    summary: 'Vibration axiale prédominante à 1X et 2X. Déphasage axial de 180° à travers l\'accouplement.',
    description: 'Le désalignement angulaire se produit lorsque les axes de deux arbres accouplés se croisent selon un certain angle au lieu d\'être parfaitement colinéaires. Cela soumet l\'accouplement à des contraintes de flexion axiale répétées deux fois par tour, induisant de fortes charges dynamiques sur les paliers adjacents.',
    formula: '\\Delta\\theta_{axial}',
    formulaDesc: 'Mesure de l\'écart d\'angle ou de l\'ouverture de face entre les plateaux d\'accouplement.',
    spectrumAnalysis: 'Se caractérise par une vibration axiale particulièrement élevée, parfois supérieure aux composantes radiales. Le spectre affiche des pics marqués à 1X et 2X axiaux. Le pic à 2X axial est très caractéristique et dépasse fréquemment 50% de la valeur de 1X.',
    waveformAnalysis: 'Le signal temporel présente une forme sinusoïdale modifiée, montrant parfois un aspect asymétrique ou une double alternance par période due à la double excitation par tour.',
    phaseAnalysis: 'On constate un déphasage axial d\'environ 180° (±30°) en mesurant de part et d\'autre de l\'accouplement (entre le palier menant et le palier mené). La phase axiale est stable.',
    confirmationChecklist: [
      'Niveaux vibratoires axiaux élevés (souvent comparables ou supérieurs aux niveaux radiaux).',
      'Différence de phase axiale de 180° à travers l\'accouplement.',
      'Sensible aux variations thermiques (l\'alignement dérive à mesure que les machines chauffent).',
      'Le contrôle par lignage laser à froid et à chaud confirme l\'écart géométrique.'
    ],
    fftPeaks: [
      { freq: '1X', label: '1X Axial', amplitude: 65, desc: 'Excitation axiale de base due au pli de l\'arbre.' },
      { freq: '2X', label: '2X Axial', amplitude: 85, desc: 'Pincement double de l\'accouplement par révolution (signature classique).' },
      { freq: '3X', label: '3X Axial', amplitude: 20, desc: 'Composante harmonique mineure.' }
    ],
    timeWaveType: 'double_peak',
    phaseGraphicType: 'coupling_axial'
  },
  {
    id: 'parallel_misalignment',
    name: 'Désalignement Parallèle (Radial)',
    category: 'Mécanique',
    subCategory: 'Accouplement',
    difficulty: 'Moyen',
    severityImpact: 'Élevé',
    summary: 'Forte vibration radiale à 2X (parfois > 1X). Déphasage radial de 180° à travers l\'accouplement.',
    description: 'Le désalignement parallèle (ou radial) se produit lorsque les axes des deux arbres sont parallèles mais décalés d\'une certaine distance. À chaque tour, l\'accouplement subit une force de cisaillement radial alternée deux fois, ce qui engendre d\'importantes forces de réaction radiales opposées sur chaque arbre.',
    formula: '\\delta_{radial}',
    formulaDesc: 'Décalage radial entre les centres de rotation des deux arbres accouplés.',
    spectrumAnalysis: 'Le spectre radial présente un pic à 2X radial particulièrement fort, souvent prédominant par rapport au 1X (parfois 2X > 100% de 1X). Un pic harmonique à 3X d\'amplitude moyenne est également fréquent.',
    waveformAnalysis: 'La forme d\'onde temporelle montre une sinusoïde à double fréquence ou un motif symétrique en "M" ou "W" représentant le cisaillement double par cycle.',
    phaseAnalysis: 'On observe un déphasage de 180° (±30°) dans la direction radiale à travers l\'accouplement (entre les paliers amont et aval). Les phases radiales horizontales et verticales sur le même palier sont souvent en phase ou en opposition de phase (0° ou 180°).',
    confirmationChecklist: [
      'Pic à 2X radial dominant, supérieur à 50% de la vibration globale.',
      'Saut de phase radial de 180° de part et d\'autre de l\'accouplement.',
      'La vibration axiale reste modérée par rapport au désalignement angulaire.',
      'Un alignement laser de précision ramène les niveaux vibratoires à des valeurs nominales.'
    ],
    fftPeaks: [
      { freq: '1X', label: '1X Radial', amplitude: 45, desc: 'Effet radial résiduel combiné de charge.' },
      { freq: '2X', label: '2X Radial', amplitude: 90, desc: 'Excitation radiale double par tour générée par le cisaillement d\'accouplement.' },
      { freq: '3X', label: '3X Radial', amplitude: 30, desc: 'Harmonique secondaire.' }
    ],
    timeWaveType: 'double_peak',
    phaseGraphicType: 'coupling_radial'
  },
  {
    id: 'looseness_structural',
    name: 'Jeu Structurel / Desserrage (Type A)',
    category: 'Structure',
    subCategory: 'Ancrage & Châssis',
    difficulty: 'Moyen',
    severityImpact: 'Élevé',
    summary: 'Longue série d\'harmoniques décroissantes à 1X, 2X, 3X... jusqu\'à 10X. Forme d\'onde asymétrique et tronquée.',
    description: 'Le jeu structurel (souvent appelé Type A) correspond à une faiblesse de rigidité du support, des boulons d\'ancrage desserrés, un châssis fissuré, ou un socle béton dégradé. La machine "saute" littéralement sur son embase sous l\'effet des forces centrifuges résiduelles, ce qui induit une rigidité non-linéaire extrême (butée physique).',
    formula: 'K(x) \\neq Cte',
    formulaDesc: 'Rigidité variable non-linéaire selon le sens du déplacement de la machine.',
    spectrumAnalysis: 'La distorsion harmonique due à la butée métallique génère une longue famille d\'harmoniques entières décroissantes de la fréquence de rotation (1X, 2X, 3X, 4X... jusqu\'à 10X ou plus) avec des amplitudes significatives, principalement dans la direction de la faiblesse (souvent verticale).',
    waveformAnalysis: 'La forme d\'onde temporelle est fortement distordue. Elle n\'est pas sinusoïdale et présente une troncature ou un "rabotage" d\'un côté de l\'alternance (limitation physique du déplacement vers le bas due au sol).',
    phaseAnalysis: 'La phase mesurée à 1X est instable et fluctue fortement d\'un instant à l\'autre ou selon la position exacte du capteur sur le pied de la machine.',
    confirmationChecklist: [
      'Présence de nombreuses harmoniques (jusqu\'à 10X) sur le plan radial vertical.',
      'La phase fluctue de manière erratique de plus de 30° d\'une mesure à l\'autre.',
      'Le serrage des boulons de fixation fait chuter instantanément le niveau des harmoniques supérieures.',
      'Différence de vibration importante entre le pied de la machine et le châssis en béton.'
    ],
    fftPeaks: [
      { freq: '1X', label: '1X Fondamentale', amplitude: 85, desc: 'Excitation résiduelle de rotation.' },
      { freq: '2X', label: '2X Harmonique', amplitude: 70, desc: 'Distorsion harmonique majeure due au choc/butée.' },
      { freq: '3X', label: '3X Harmonique', amplitude: 55, desc: 'Harmonique secondaire.' },
      { freq: '4X', label: '4X Harmonique', amplitude: 40, desc: 'Série harmonique caractéristique.' },
      { freq: '5X', label: '5X Harmonique', amplitude: 25, desc: 'Harmonique d\'ordre supérieur.' }
    ],
    timeWaveType: 'truncated',
    phaseGraphicType: 'unstable'
  },
  {
    id: 'looseness_internal',
    name: 'Jeu Interne de Palier (Type B)',
    category: 'Structure',
    subCategory: 'Palier & Ajustement',
    difficulty: 'Difficile',
    severityImpact: 'Élevé à Critique',
    summary: 'Présence de sous-harmoniques (0.5X, 1.5X...) et de bruit de frottement à la base des pics.',
    description: 'Le jeu interne (Type B) provient d\'un jeu radial excessif dans un palier lisse ou un roulement à éléments roulants (par exemple, bague extérieure tournant dans son logement, arbre sous-dimensionné ou bague intérieure lâche sur l\'arbre). Cela provoque des impacts un tour sur deux et des frottements de métal contre métal.',
    formula: 'GAP_{radial} > Tolérance',
    formulaDesc: 'Le jeu radial dépasse largement les limites constructeurs.',
    spectrumAnalysis: 'Présence de pics sous-harmoniques (fractionnaires) typiques à 0.5X, 1.5X, 2.5X... accompagnés d\'un tapis de bruit élevé à la base des pics spectraux (bruit de frottement large bande).',
    waveformAnalysis: 'La forme d\'onde est asymétrique et montre des impacts répétés de manière chaotique ou tous les deux tours (périodicité de 0.5X), souvent avec une modulation d\'enveloppe.',
    phaseAnalysis: 'La phase est extrêmement instable, sautant de manière imprévisible et variant selon la force de frottement.',
    confirmationChecklist: [
      'Apparition de pics fractionnaires spécifiques à 1/2 de la vitesse de rotation (0.5X, 1.5X...).',
      'Le spectre montre un élargissement de la base des pics (bruit blanc induit par frottement).',
      'Généralement accompagné d\'un échauffement anormal du palier concerné.',
      'L\'analyse d\'huile ou l\'ouverture du palier confirme l\'usure de l\'alésage.'
    ],
    fftPeaks: [
      { freq: '0.5X', label: 'Sous-Harmonique 1/2X', amplitude: 48, desc: 'Glissement et impact un tour sur deux, typique d\'un jeu interne lâche.' },
      { freq: '1X', label: '1X Rotation', amplitude: 75, desc: 'Vitesse de rotation fondamentale de l\'arbre.' },
      { freq: '1.5X', label: '1.5X Fractionnaire', amplitude: 40, desc: 'Composante asymétrique de frottement.' },
      { freq: '2X', label: '2X Harmonique', amplitude: 55, desc: 'Distorsion harmonique du jeu.' }
    ],
    timeWaveType: 'subharmonic',
    phaseGraphicType: 'unstable'
  },
  {
    id: 'soft_foot',
    name: 'Pied Mou (Soft Foot)',
    category: 'Structure',
    subCategory: 'Châssis',
    difficulty: 'Moyen',
    severityImpact: 'Modéré',
    summary: 'Vibration radiale élevée à 1X (ressemble au balourd). Diminue fortement lors du desserrage d\'un seul boulon.',
    description: 'Le pied mou correspond à une situation où l\'une des pattes d\'appui d\'une machine ne repose pas plan sur le châssis de support. Lors du serrage du boulon de cette patte, le châssis et la carcasse de la machine se déforment sous contrainte élastique, induisant un désalignement interne de paliers et une fragilisation de la structure.',
    formula: '\\delta_{foot} > 0.05 mm',
    formulaDesc: 'Écart physique ou jeu mesurable sous le pied non serré à l\'aide d\'un jeu de cales.',
    spectrumAnalysis: 'Se manifeste par un pic radial élevé à 1X (fréquence de rotation) et parfois 2X, imitant parfaitement un balourd ou un léger désalignement parallèle.',
    waveformAnalysis: 'Forme d\'onde sinusoïdale classique, éventuellement polluée par de petites oscillations harmoniques de faible amplitude.',
    phaseAnalysis: 'La phase à 1X varie de manière spectaculaire (parfois > 90°) si l\'on mesure la différence de phase entre le pied suspect et la structure métallique environnante.',
    confirmationChecklist: [
      'Le desserrage sélectif du boulon d\'ancrage du pied suspect fait chuter la vibration globale de plus de 50%.',
      'Un comparateur à cadran ou palpeur laser placé sur le pied montre un déplacement vertical au desserrage (> 0.05 mm).',
      'Le défaut est corrigé de manière permanente en glissant des cales (shims) d\'épaisseur calibrée sous le pied défectueux.'
    ],
    fftPeaks: [
      { freq: '1X', label: '1X Radial', amplitude: 80, desc: 'Excitation générée par la déformation élastique de la carcasse de la machine.' },
      { freq: '2X', label: '2X Radial', amplitude: 25, desc: 'Distorsion d\'excentricité géométrique induite.' }
    ],
    timeWaveType: 'sinusoid',
    phaseGraphicType: 'quadrature'
  },
  {
    id: 'bearing_stage_3',
    name: 'Usure de Roulement (Stade Advanced - Stade 3)',
    category: 'Composants',
    subCategory: 'Roulement à billes',
    difficulty: 'Difficile',
    severityImpact: 'Élevé',
    summary: 'Pics aux fréquences de défaut calculées (BPFO, BPFI...) avec harmoniques et bandes latérales espacées de 1X.',
    description: 'Au Stade 3 de dégradation d\'un roulement, les micro-fissures initiales évoluent en écaillages et cavités physiques macroscopiques sur les pistes de roulement (bague intérieure ou extérieure) ou les éléments roulants (billes/rouleaux). Chaque passage d\'un élément roulant sur un défaut provoque un impact impulsionnel de forte intensité.',
    formula: 'BPFO = \\frac{n}{2} \\cdot f \\cdot (1 - \\frac{d}{D}\\cos\\phi)',
    formulaDesc: 'n = nb de billes, f = RPM/60, d = diamètre bille, D = diamètre primitif, φ = angle de contact.',
    spectrumAnalysis: 'Le spectre de vitesse classique montre l\'apparition claire et nette des fréquences fondamentales de défaut du roulement (BPFO pour la bague extérieure, BPFI pour l\'intérieure, BSF pour les billes, FTF pour la cage). Ces pics sont accompagnés de leurs harmoniques (2x, 3x BDF) et de bandes latérales (sidebands) d\'espacement 1X (vitesse de rotation) ou FTF.',
    waveformAnalysis: 'La forme d\'onde temporelle montre une série caractéristique de pics de choc pointus et répétitifs (transitoires) suivis d\'une décroissance exponentielle rapide (effet de résonance amortie du palier), modulés en amplitude par la rotation de l\'arbre.',
    phaseAnalysis: 'La phase des vibrations de haute fréquence est totalement instable et non-reproductible d\'une mesure à l\'autre.',
    confirmationChecklist: [
      'Pics non-entiers nets (ex: 3.58X, 4.82X) coïncidant avec les fréquences caractéristiques calculées.',
      'Présence de bandes latérales d\'espacement égal au 1X radial de l\'arbre autour des pics de défaut.',
      'Forte augmentation de l\'accélération globale et des signaux d\'enveloppe démodulés.',
      'Le remplacement du roulement est à planifier à court terme avant la transition vers le Stade 4.'
    ],
    fftPeaks: [
      { freq: '1X', label: '1X Fondamentale', amplitude: 15, desc: 'Vitesse de rotation nominale.' },
      { freq: 'BPFO', label: 'BPFO (ex: 4.12X)', amplitude: 75, desc: 'Passage des billes sur le défaut de la bague externe. Pic net.' },
      { freq: '2xBPFO', label: '2x BPFO (ex: 8.24X)', amplitude: 50, desc: 'Deuxième harmonique du défaut de bague externe.' },
      { freq: 'BPFO-1X', label: 'Bande latérale inférieure', amplitude: 22, desc: 'Modulation de charge par la rotation de l\'arbre.' },
      { freq: 'BPFO+1X', label: 'Bande latérale supérieure', amplitude: 22, desc: 'Indice de sévérité du défaut (croissance des bandes latérales).' }
    ],
    timeWaveType: 'transient',
    phaseGraphicType: 'unstable'
  },
  {
    id: 'bearing_stage_4',
    name: 'Défaillance Critique de Roulement (Stade 4)',
    category: 'Composants',
    subCategory: 'Roulement à billes',
    difficulty: 'Difficile',
    severityImpact: 'Critique (Arrêt immédiat)',
    summary: 'Pics discrets gommés au profit d\'un tapis de bruit large bande massif. Hausse sévère du 1X.',
    description: 'Le Stade 4 est l\'étape ultime avant la rupture catastrophique du roulement. La géométrie des pistes est totalement détruite, le jeu interne devient extrême et le logement est rempli de limaille et débris métalliques. Les billes glissent et s\'entrechoquent de manière aléatoire.',
    formula: 'Noise_{HF} \\gg Normal',
    formulaDesc: 'Le tapis de bruit haute fréquence augmente de façon exponentielle.',
    spectrumAnalysis: 'Les pics discrets de défauts (BPFO, BPFI) diminuent d\'amplitude et disparaissent littéralement. Ils sont remplacés par un "tapis de bruit" large bande extrêmement élevé ("bosse de bruit" dans la zone de haute fréquence). On observe également une hausse majeure du pic de rotation 1X radial induit par le jeu extrême.',
    waveformAnalysis: 'La forme d\'onde temporelle est complètement chaotique, aléatoire et de forte amplitude, semblable à un bruit blanc rugueux sans motif périodique identifiable.',
    phaseAnalysis: 'Incohérence totale des mesures de phase.',
    confirmationChecklist: [
      'Disparition des pics harmoniques nets au profit d\'une large colline de bruit haute fréquence.',
      'Élévation dramatique de la température du palier (mesurée au pyromètre laser).',
      'Le palier produit un grognement ou sifflement sourd et métallique audible à l\'oreille nue.',
      'Arrêt d\'urgence requis : risque de grippage, de destruction de l\'arbre ou de départ de feu.'
    ],
    fftPeaks: [
      { freq: '1X', label: '1X Radial Élevé', amplitude: 85, desc: 'Jeu géométrique extrême induisant un balourd et un désalignement massifs.' },
      { freq: 'Bruit', label: 'Bruit Large Bande', amplitude: 65, desc: 'Friction métal contre métal continue créant un fond sonore vibratoire saturé.' }
    ],
    timeWaveType: 'noise',
    phaseGraphicType: 'unstable'
  },
  {
    id: 'gear_wear',
    name: 'Usure d\'Engrenages & Surcharge',
    category: 'Transmission',
    subCategory: 'Engrenages',
    difficulty: 'Difficile',
    severityImpact: 'Élevé',
    summary: 'Forts pics à la GMF et ses harmoniques (2xGMF, 3xGMF). Bandes latérales de faible amplitude.',
    description: 'L\'usure généralisée des dents d\'une roue dentée ou un défaut d\'alignement interne des engrenages provoque un frottement excessif lors de l\'engrènement. Cela se traduit par une hausse d\'énergie à la fréquence de contact mécanique direct des dents par seconde.',
    formula: 'GMF = Z \\cdot 1X',
    formulaDesc: 'GMF = Gear Mesh Frequency (Hz), Z = Nombre de dents, 1X = Vitesse de l\'arbre associé (Hz).',
    spectrumAnalysis: 'Présence de pics extrêmement intenses à la fréquence d\'engrènement GMF, ainsi qu\'à ses harmoniques supérieures (2xGMF, 3xGMF). Les bandes latérales autour de ces pics restent de faible amplitude au début, témoignant d\'une usure uniforme sans choc localisé.',
    waveformAnalysis: 'Le signal temporel présente une oscillation à haute fréquence continue et symétrique correspondant à l\'engrènement mécanique, sans impulsions marquées de forte amplitude.',
    phaseAnalysis: 'La phase à la fréquence GMF reste relativement stable.',
    confirmationChecklist: [
      'Montée continue et progressive de l\'amplitude à la GMF et ses harmoniques au fil des mois.',
      'Absence de bandes latérales de forte amplitude (qui signale plutôt un défaut localisé comme une fissure).',
      'Une analyse physico-chimique de l\'huile révèle une présence importante de particules d\'usure en suspension.'
    ],
    fftPeaks: [
      { freq: '1X', label: '1X Vitesse Arbre', amplitude: 20, desc: 'Vitesse de rotation de l\'arbre support.' },
      { freq: 'GMF', label: 'GMF (ex: 24X)', amplitude: 85, desc: 'Fréquence d\'engrènement principale. Signale la force d\'impact d\'engrènement.' },
      { freq: '2xGMF', label: '2x GMF (ex: 48X)', amplitude: 60, desc: 'Deuxième harmonique d\'engrènement.' },
      { freq: '3xGMF', label: '3x GMF (ex: 72X)', amplitude: 35, desc: 'Troisième harmonique d\'engrènement.' }
    ],
    timeWaveType: 'modulated',
    phaseGraphicType: 'quadrature'
  },
  {
    id: 'gear_broken_tooth',
    name: 'Dent Cassée / Fissurée d\'Engrenage',
    category: 'Transmission',
    subCategory: 'Engrenages',
    difficulty: 'Expert',
    severityImpact: 'Critique',
    summary: 'Forte modulation d\'amplitude de la GMF avec d\'immenses bandes latérales espacées de 1X. Grand impact par tour en temporel.',
    description: 'Une dent fissurée, ébréchée ou totalement cassée sur un engrenage produit un choc violent et bref à chaque tour complet de cet arbre. Ce choc module en amplitude la fréquence d\'engrènement normale (GMF), générant des bandes latérales d\'une amplitude critique.',
    formula: 'T_{impact} = \\frac{1}{1X_{arbre}}',
    formulaDesc: 'L\'intervalle entre les impacts est égal à la période de rotation de l\'arbre portant la dent défectueuse.',
    spectrumAnalysis: 'Le spectre présente des pics à la GMF entourés de bandes latérales (sidebands) particulièrement denses et élevées, espacées précisément de 1X (vitesse de rotation de l\'arbre portant l\'engrenage endommagé). L\'amplitude de ces bandes latérales dépasse fréquemment celle de la GMF centrale.',
    waveformAnalysis: 'La forme d\'onde temporelle est l\'outil diagnostic roi : elle montre un signal d\'engrènement de haute fréquence transpercé à intervalles parfaitement réguliers ($T = 1/1X$) par un pic d\'impact (shock pulse) de très forte amplitude.',
    phaseAnalysis: 'Sauts locaux de phase lors de l\'impact mécanique.',
    confirmationChecklist: [
      'Bandes latérales autour de la GMF exceptionnellement élevées, confirmant une modulation sévère.',
      'Dans le signal temporel, présence d\'un pic d\'impact unique et régulier à chaque tour de l\'arbre défaillant.',
      'Utilisation impérative de la méthode TSA (Time Synchronous Averaging) pour confirmer quel engrenage est défectueux.'
    ],
    fftPeaks: [
      { freq: '1X', label: '1X Arbre', amplitude: 35, desc: 'Fréquence de rotation de l\'arbre défectueux.' },
      { freq: 'GMF-1X', label: 'Bande latérale (-1X)', amplitude: 75, desc: 'Indicateur direct de modulation d\'amplitude due au choc local.' },
      { freq: 'GMF', label: 'GMF d\'engrènement', amplitude: 45, desc: 'Fréquence d\'engrènement de base.' },
      { freq: 'GMF+1X', label: 'Bande latérale (+1X)', amplitude: 75, desc: 'Indice de sévérité critique (dent fissurée ou cassée).' }
    ],
    timeWaveType: 'transient',
    phaseGraphicType: 'unstable'
  },
  {
    id: 'motor_broken_bars',
    name: 'Barres de Rotor Cassées (Moteur Asynchrone)',
    category: 'Électrique',
    subCategory: 'Rotor & Électromagnétisme',
    difficulty: 'Expert',
    severityImpact: 'Élevé',
    summary: 'Bandes latérales de glissement de pôle (±Fp) très resserrées autour du pic 1X de rotation. Battement lent en temporel.',
    description: 'Sur un moteur asynchrone à cage d\'écureuil, des barres de rotor fissurées ou cassées altèrent la répartition symétrique des champs magnétiques rotatifs. Cela crée une asymétrie de couple électromagnétique tournant, provoquant une modulation d\'amplitude à la fréquence de passage des pôles magnétiques.',
    formula: 'F_{p} = 2 \\cdot s \\cdot F_{ligne}',
    formulaDesc: 'Fp = Fréquence de glissement de pôle (Hz), s = Glissement (%), Fligne = Fréquence électrique réseau (50 ou 60 Hz).',
    spectrumAnalysis: 'Présence de bandes latérales très rapprochées autour du pic de rotation principal (1X) et de ses harmoniques, espacées précisément de la fréquence de passage des pôles $F_p$ (généralement entre 1 Hz et 5 Hz). Une résolution spectrale extrêmement fine est requise pour distinguer ces pics resserrés.',
    waveformAnalysis: 'La forme d\'onde temporelle montre un phénomène de battement caractéristique : une modulation d\'amplitude lente et cyclique à la fréquence $F_p$.',
    phaseAnalysis: 'La phase globale subit une légère oscillation périodique coordonnée avec le glissement.',
    confirmationChecklist: [
      'Présence de pics satellites serrés à $\\pm F_p$ autour de 1X dans le spectre de vitesse radial.',
      'Analyse du courant moteur (MCSA) montrant des bandes latérales à $\\pm F_p$ autour de 50 Hz avec un écart < 35 dB (moteur défectueux).',
      'Test de coupure électrique : la vibration incriminée disparaît de manière INSTANTANÉE à l\'extinction du moteur.'
    ],
    fftPeaks: [
      { freq: '1X-Fp', label: 'Bande gauche (-Fp)', amplitude: 50, desc: 'Pic satellite de modulation électromagnétique inférieure.' },
      { freq: '1X', label: '1X Vitesse de Rotation', amplitude: 90, desc: 'Fréquence de rotation nominale du rotor.' },
      { freq: '1X+Fp', label: 'Bande droite (+Fp)', amplitude: 50, desc: 'Pic satellite de modulation électromagnétique supérieure.' }
    ],
    timeWaveType: 'modulated',
    phaseGraphicType: 'transition'
  },
  {
    id: 'resonance_structural',
    name: 'Résonance Structurelle',
    category: 'Structure',
    subCategory: 'Résonance & Rigidité',
    difficulty: 'Moyen',
    severityImpact: 'Critique',
    summary: 'Amplification massive à la fréquence naturelle. Saut de phase brusque de 180° au passage du régime critique.',
    description: 'La résonance se produit lorsque la fréquence d\'une force d\'excitation (généralement le balourd à 1X) coïncide précisément avec une fréquence naturelle (mode propre) de la structure de support, du châssis ou du rotor. À cette fréquence, l\'amortissement est minimal et les amplitudes de vibration sont amplifiées d\'un facteur 10 à 50 (Facteur Q).',
    formula: 'f_{n} = \\frac{1}{2\\pi}\\sqrt{\\frac{K}{M}}',
    formulaDesc: 'fn = Fréquence naturelle (Hz), K = Rigidité du système (N/m), M = Masse du système (kg).',
    spectrumAnalysis: 'Le spectre montre un pic gigantesque et extrêmement étroit focalisé à la fréquence naturelle de la structure. Dès que la machine s\'éloigne de cette fréquence, la vibration retombe à des niveaux normaux.',
    waveformAnalysis: 'La forme d\'onde est une sinusoïde de très grande amplitude, stable et pure.',
    phaseAnalysis: 'La phase subit un déphasage brusque de près de 180° lors du franchissement de la vitesse de résonance (pendant une rampe d\'accélération ou de décélération de la machine).',
    confirmationChecklist: [
      'Le "Bump Test" (essai de choc) à l\'arrêt révèle une fréquence naturelle identique à la fréquence amplifiée.',
      'Un changement minime de la vitesse de rotation (ex: ±5%) fait s\'effondrer la vibration globale.',
      'La modification physique de la masse (M) ou de la rigidité (K) décale la fréquence de résonance hors de la plage de vitesse de la machine.'
    ],
    fftPeaks: [
      { freq: 'fn', label: 'Fréquence Naturelle (fn)', amplitude: 98, desc: 'Excitation catastrophique coincée pile sur le mode propre de la structure.' }
    ],
    timeWaveType: 'resonance',
    phaseGraphicType: 'transition'
  }
];

export default function SignatureGlossary({ theme = 'dark' }: SignatureGlossaryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');
  const [selectedFaultId, setSelectedFaultId] = useState<string>('unbalance');
  const [visualTab, setVisualTab] = useState<'fft' | 'time'>('fft');
  const [hoveredPeak, setHoveredPeak] = useState<FftPeak | null>(null);

  // Compare mode states
  const [compareMode, setCompareMode] = useState(false);
  const [compareFaultIdA, setCompareFaultIdA] = useState<string>('unbalance');
  const [compareFaultIdB, setCompareFaultIdB] = useState<string>('angular_misalignment');

  const isLight = theme === 'light';
  const isBW = theme === 'mono';

  // Get categories for filtering
  const categories = useMemo(() => {
    const list = new Set(FAULT_SIGNATURES.map(f => f.category));
    return ['Tous', ...Array.from(list)];
  }, []);

  // Filter fault list
  const filteredFaults = useMemo(() => {
    return FAULT_SIGNATURES.filter(fault => {
      const matchesCategory = selectedCategory === 'Tous' || fault.category === selectedCategory;
      const matchesSearch = fault.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            fault.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            fault.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Selected Fault record
  const activeFault = useMemo(() => {
    return FAULT_SIGNATURES.find(f => f.id === selectedFaultId) || FAULT_SIGNATURES[0];
  }, [selectedFaultId]);

  // Comparison Fault records
  const faultA = useMemo(() => {
    return FAULT_SIGNATURES.find(f => f.id === compareFaultIdA) || FAULT_SIGNATURES[0];
  }, [compareFaultIdA]);

  const faultB = useMemo(() => {
    return FAULT_SIGNATURES.find(f => f.id === compareFaultIdB) || FAULT_SIGNATURES[1];
  }, [compareFaultIdB]);

  // Helper to render beautiful theoretical formula strings
  const formatFormula = (formula: string) => {
    return formula.replace(/\\cdot/g, '·')
                  .replace(/\\omega/g, 'ω')
                  .replace(/\\pi/g, 'π')
                  .replace(/\\sqrt/g, '√')
                  .replace(/\\neq/g, '≠')
                  .replace(/\\delta/g, 'δ')
                  .replace(/\\theta/g, 'θ')
                  .replace(/\\gg/g, '≫')
                  .replace(/_\{([a-zA-Z0-9]+)\}/g, '$1');
  };

  // Generate continuous coordinate points for Waveform SVGs
  const renderWaveformPath = (type: string, width: number, height: number) => {
    const points: string[] = [];
    const amp = height * 0.35;
    const midY = height / 2;

    switch (type) {
      case 'sinusoid':
        for (let x = 0; x <= width; x++) {
          const y = midY + amp * Math.sin((x * 2 * Math.PI) / (width / 3));
          points.push(`${x},${y}`);
        }
        break;
      case 'double_peak':
        for (let x = 0; x <= width; x++) {
          const t = (x * 2 * Math.PI) / (width / 3);
          const y = midY + amp * (0.6 * Math.sin(t) + 0.5 * Math.sin(2 * t));
          points.push(`${x},${y}`);
        }
        break;
      case 'truncated':
        for (let x = 0; x <= width; x++) {
          const rawY = amp * Math.sin((x * 2 * Math.PI) / (width / 3));
          // Clip negative peaks to simulate non-linear structural looseness
          const clippedY = rawY > amp * 0.2 ? amp * 0.2 : rawY;
          points.push(`${x},${midY + clippedY}`);
        }
        break;
      case 'subharmonic':
        for (let x = 0; x <= width; x++) {
          const t = (x * 2 * Math.PI) / (width / 3);
          // Modulate with half-frequency (subharmonic 0.5X)
          const y = midY + amp * (0.7 * Math.sin(t) + 0.45 * Math.sin(t / 2));
          points.push(`${x},${y}`);
        }
        break;
      case 'transient':
        // Repetitive exponentially decaying shock pulses (Bearing Stage 3 or Tooth Chip)
        for (let x = 0; x <= width; x++) {
          const period = width / 3;
          const localX = x % period;
          const decay = Math.exp(-localX * 0.04);
          const highFreq = Math.sin(localX * 1.5);
          const y = midY + amp * 1.3 * decay * highFreq;
          points.push(`${x},${y}`);
        }
        break;
      case 'modulated':
        // Amplitude modulation beat (Rotor bar defect or gear wear mesh)
        for (let x = 0; x <= width; x++) {
          const carrier = Math.sin((x * 2 * Math.PI) / (width / 15)); // High freq mesh/line
          const mod = 0.6 + 0.4 * Math.sin((x * 2 * Math.PI) / width); // Slow slip/rotation envelope
          const y = midY + amp * carrier * mod;
          points.push(`${x},${y}`);
        }
        break;
      case 'resonance':
        // Continuous, high amplitude sinusoidal wave
        for (let x = 0; x <= width; x++) {
          const y = midY + amp * 1.45 * Math.sin((x * 2 * Math.PI) / (width / 3.5));
          points.push(`${x},${y}`);
        }
        break;
      case 'noise':
      default:
        // Highly chaotic random noise (Bearing Stage 4)
        for (let x = 0; x <= width; x++) {
          const rand = (Math.random() - 0.5) * amp * 1.5;
          const filterSine = 0.3 * amp * Math.sin((x * 2 * Math.PI) / (width / 4));
          points.push(`${x},${midY + rand + filterSine}`);
        }
        break;
    }
    return `M ${points.join(' L ')}`;
  };

  // Render Spatial Phase vectors
  const renderPhaseVector = (type: string) => {
    switch (type) {
      case 'quadrature':
        // H and V in quadrature (90 degrees difference)
        return (
          <svg className="w-24 h-24" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" className="text-slate-600" />
            <line x1="50" y1="10" x2="50" y2="90" stroke="currentColor" strokeWidth="0.5" className="text-slate-700" />
            <line x1="10" y1="50" x2="90" y2="50" stroke="currentColor" strokeWidth="0.5" className="text-slate-700" />
            {/* Vector Vertical */}
            <g stroke="#38bdf8" strokeWidth="3" strokeLinecap="round">
              <line x1="50" y1="50" x2="50" y2="15" />
              <polygon points="50,10 47,18 53,18" fill="#38bdf8" stroke="none" />
            </g>
            {/* Vector Horizontal */}
            <g stroke="#f43f5e" strokeWidth="3" strokeLinecap="round">
              <line x1="50" y1="50" x2="85" y2="50" />
              <polygon points="90,50 82,47 82,53" fill="#f43f5e" stroke="none" />
            </g>
            <text x="54" y="24" fill="#38bdf8" className="text-[10px] font-bold font-mono">Vert (0°)</text>
            <text x="68" y="44" fill="#f43f5e" className="text-[10px] font-bold font-mono">Horiz (90°)</text>
          </svg>
        );
      case 'coupling_axial':
        // Shaft axial opposition of phase (180 degrees) across coupling
        return (
          <svg className="w-24 h-24" viewBox="0 0 120 100">
            {/* Left Shaft */}
            <rect x="15" y="40" width="35" height="20" fill="none" stroke="currentColor" className="text-slate-500" strokeWidth="1.5" />
            {/* Coupling plate 1 */}
            <rect x="50" y="25" width="6" height="50" fill="none" stroke="currentColor" className={`${isLight ? "text-slate-600" : "text-slate-400"}`} strokeWidth="1.5" />
            {/* Coupling plate 2 */}
            <rect x="62" y="25" width="6" height="50" fill="none" stroke="currentColor" className={`${isLight ? "text-slate-600" : "text-slate-400"}`} strokeWidth="1.5" />
            {/* Right Shaft */}
            <rect x="68" y="40" width="35" height="20" fill="none" stroke="currentColor" className="text-slate-500" strokeWidth="1.5" />
            {/* Phase Vector Left Axial */}
            <path d="M40 20 L25 20" stroke="#ef4444" strokeWidth="2.5" markerEnd="url(#arrow)" />
            <circle cx="40" cy="20" r="3" fill="#ef4444" />
            {/* Phase Vector Right Axial */}
            <path d="M78 20 L93 20" stroke="#3b82f6" strokeWidth="2.5" markerEnd="url(#arrow)" />
            <circle cx="78" cy="20" r="3" fill="#3b82f6" />
            <text x="18" y="14" fill="#ef4444" className="text-[9px] font-bold font-mono">0°</text>
            <text x="82" y="14" fill="#3b82f6" className="text-[9px] font-bold font-mono">180°</text>
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
              </marker>
            </defs>
          </svg>
        );
      case 'coupling_radial':
        // Shaft radial opposition of phase (180 degrees) across coupling
        return (
          <svg className="w-24 h-24" viewBox="0 0 120 100">
            {/* Left Shaft */}
            <rect x="15" y="40" width="35" height="20" fill="none" stroke="currentColor" className="text-slate-500" strokeWidth="1.5" />
            <rect x="50" y="25" width="6" height="50" fill="none" stroke="currentColor" className={`${isLight ? "text-slate-600" : "text-slate-400"}`} strokeWidth="1.5" />
            <rect x="62" y="25" width="6" height="50" fill="none" stroke="currentColor" className={`${isLight ? "text-slate-600" : "text-slate-400"}`} strokeWidth="1.5" />
            <rect x="68" y="40" width="35" height="20" fill="none" stroke="currentColor" className="text-slate-500" strokeWidth="1.5" />
            {/* Phase Vector Left Radial */}
            <path d="M30 50 L30 20" stroke="#ef4444" strokeWidth="2.5" />
            <polygon points="30,16 27,24 33,24" fill="#ef4444" />
            {/* Phase Vector Right Radial */}
            <path d="M88 50 L88 80" stroke="#3b82f6" strokeWidth="2.5" />
            <polygon points="88,84 85,76 91,76" fill="#3b82f6" />
            <text x="36" y="28" fill="#ef4444" className="text-[9px] font-bold font-mono">0°</text>
            <text x="94" y="78" fill="#3b82f6" className="text-[9px] font-bold font-mono">180°</text>
          </svg>
        );
      case 'transition':
        // Resonance Phase transition diagram (S curve from 0 to 180 degrees)
        return (
          <svg className="w-24 h-24" viewBox="0 0 100 100">
            <line x1="15" y1="85" x2="85" y2="85" stroke="currentColor" className="text-slate-600" strokeWidth="1" />
            <line x1="15" y1="15" x2="15" y2="85" stroke="currentColor" className="text-slate-600" strokeWidth="1" />
            <path d="M 15 80 Q 40 80, 50 50 T 85 20" fill="none" stroke="#22c55e" strokeWidth="2.5" />
            <circle cx="50" cy="50" r="4" fill="#e11d48" />
            <text x="54" y="52" fill="#e11d48" className="text-[8px] font-bold font-mono">fn (90°)</text>
            <text x="8" y="20" fill="currentColor" className={`text-[8px] ${isLight ? "text-slate-600" : "text-slate-400"}`}>180°</text>
            <text x="8" y="82" fill="currentColor" className={`text-[8px] ${isLight ? "text-slate-600" : "text-slate-400"}`}>0°</text>
            <text x="45" y="94" fill="currentColor" className={`text-[8px] ${isLight ? "text-slate-600" : "text-slate-400"}`}>RPM</text>
          </svg>
        );
      case 'unstable':
      default:
        // Scatter / unstable phase cloud representation
        return (
          <svg className="w-24 h-24" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" className="text-slate-600" />
            {/* Random dots representing high-frequency phase instability */}
            <circle cx="35" cy="25" r="2.5" fill="#e11d48" opacity="0.8" />
            <circle cx="68" cy="32" r="3" fill="#e11d48" opacity="0.6" />
            <circle cx="45" cy="72" r="2" fill="#e11d48" opacity="0.9" />
            <circle cx="75" cy="65" r="2.5" fill="#e11d48" opacity="0.5" />
            <circle cx="22" cy="58" r="3.5" fill="#e11d48" opacity="0.7" />
            <circle cx="58" cy="18" r="2" fill="#e11d48" opacity="0.85" />
            <circle cx="52" cy="48" r="3" fill="#e11d48" opacity="0.75" />
            <text x="25" y="94" fill="#e11d48" className="text-[9px] font-bold font-mono uppercase tracking-wider">Instable (Flou)</text>
          </svg>
        );
    }
  };

  // Badge styles based on difficulty
  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'Facile': return isBW ? 'bg-slate-200 text-slate-950' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'Moyen': return isBW ? 'bg-slate-300 text-slate-950' : 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Difficile': return isBW ? 'bg-slate-600 text-white' : 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'Expert': return isBW ? 'bg-slate-900 text-white' : 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default: return 'bg-slate-500/10 ${isLight ? "text-slate-600" : "text-slate-400"} border-slate-500/20';
    }
  };

  return (
    <div className="space-y-6" id="signature_glossary_container">
      {/* Header Banner */}
      <div className={`p-6 rounded-2xl border ${
        isLight
          ? 'bg-gradient-to-r from-slate-50 to-blue-50/30 border-slate-200 text-slate-900'
          : (isBW ? 'bg-slate-950 border-slate-800 text-white' : 'bg-gradient-to-r from-slate-900 via-[#1E293B] to-slate-900 border-slate-800')
      } shadow-md relative overflow-hidden`}>
        {/* Animated background waves */}
        <div className="absolute right-0 top-0 w-96 h-full opacity-5 pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M 0 50 Q 25 15, 50 50 T 100 50 M 0 60 Q 25 25, 50 60 T 100 60" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <BookOpen className={`w-5 h-5 ${isBW ? 'text-white' : (isLight ? 'text-blue-600' : 'text-blue-400')}`} />
              <span className={`text-[10px] font-bold tracking-widest uppercase ${isLight ? 'text-blue-600' : 'text-blue-400'}`}>
                Bibliothèque de Diagnostic Rapide
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight font-sans">
              Glossaire des Signatures de Défauts
            </h1>
            <p className={`text-xs max-w-2xl leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Une bibliothèque de recherche rapide répertoriant les spectres fréquentiels types et formes d\'onde pour chaque défaut machine (balourd, désalignement, usure de roulement, engrenages, moteurs), issue des fiches d\'analyse technique.
            </p>
          </div>

          {/* Compare Toggle Button */}
          <button
            onClick={() => setCompareMode(!compareMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md ${
              compareMode
                ? (isBW ? 'bg-white text-black border-white' : 'bg-blue-600 text-white hover:bg-blue-700 border-blue-500')
                : (isLight 
                    ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300' 
                    : '${isLight ? "bg-slate-200" : "bg-slate-800"} hover:bg-slate-700 ${isLight ? "text-slate-800" : "text-slate-200"} border-slate-700')
            } border`}
          >
            <Sliders className="w-4 h-4" />
            {compareMode ? 'Quitter Comparateur' : 'Mode Comparatif'}
          </button>
        </div>
      </div>

      {compareMode ? (
        /* COMPARATIVE WORKSPACE VIEW */
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Top Panel - Controls */}
          <div className={`xl:col-span-12 p-4 rounded-xl border ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#1E293B]/80 border-slate-800'
          } flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm`}>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-bold uppercase tracking-wider font-mono">
                Sélecteurs de comparaison de signatures :
              </span>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-1.5 flex-1 md:flex-none">
                <span className="text-xs font-bold text-red-500 font-mono">A:</span>
                <select
                  value={compareFaultIdA}
                  onChange={(e) => setCompareFaultIdA(e.target.value)}
                  className={`text-xs p-2 rounded-lg border cursor-pointer outline-none ${
                    isLight ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-700 text-white'
                  }`}
                >
                  {FAULT_SIGNATURES.map(f => (
                    <option key={`comp-a-${f.id}`} value={f.id} disabled={f.id === compareFaultIdB}>{f.name}</option>
                  ))}
                </select>
              </div>
              <span className="text-xs font-mono text-slate-500">vs</span>
              <div className="flex items-center gap-1.5 flex-1 md:flex-none">
                <span className="text-xs font-bold text-blue-500 font-mono">B:</span>
                <select
                  value={compareFaultIdB}
                  onChange={(e) => setCompareFaultIdB(e.target.value)}
                  className={`text-xs p-2 rounded-lg border cursor-pointer outline-none ${
                    isLight ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-700 text-white'
                  }`}
                >
                  {FAULT_SIGNATURES.map(f => (
                    <option key={`comp-b-${f.id}`} value={f.id} disabled={f.id === compareFaultIdA}>{f.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Column A */}
          <div className="xl:col-span-6 space-y-6">
            <div className={`p-5 rounded-2xl border ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#1E293B]/60 border-slate-800'
            } shadow-sm space-y-4`}>
              <div className={`flex items-center justify-between border-b pb-3 ${isLight ? 'border-slate-100' : 'border-slate-850'}`}>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest font-mono">SIGNATURE A</span>
                  <h3 className={`text-lg font-extrabold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>{faultA.name}</h3>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${getDifficultyColor(faultA.difficulty)}`}>
                  {faultA.category}
                </span>
              </div>

              {/* Spectrum Chart A */}
              <div className="space-y-2">
                <span className={`text-xs font-bold ${isLight ? "text-slate-600" : "text-slate-400"} font-mono flex items-center gap-1.5`}>
                  <Activity className="w-3.5 h-3.5 text-red-500" /> Spectre FFT Type
                </span>
                <div className={`p-4 rounded-xl border relative h-40 flex items-end ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-900'
                }`}>
                  {/* SVG graph */}
                  <svg className="w-full h-full" viewBox="0 0 300 100" preserveAspectRatio="none">
                    <line x1="20" y1="90" x2="290" y2="90" stroke="currentColor" className="text-slate-700" strokeWidth="1" />
                    <line x1="20" y1="10" x2="20" y2="90" stroke="currentColor" className="text-slate-700" strokeWidth="1" />
                    {/* Render peaks */}
                    {faultA.fftPeaks.map((peak, idx) => {
                      const x = 20 + ((idx + 1) * 260) / (faultA.fftPeaks.length + 1);
                      const height = peak.amplitude * 0.75;
                      const y = 90 - height;
                      return (
                        <g key={`comp-a-peak-${idx}`}>
                          <line x1={x} y1="90" x2={x} y2={y} stroke="#f43f5e" strokeWidth="3" />
                          <circle cx={x} cy={y} r="3" fill="#f43f5e" />
                          <text x={x} y="98" fill="currentColor" className="text-[7px] text-slate-500 font-mono" textAnchor="middle">{peak.freq}</text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>

              {/* Waveform A */}
              <div className="space-y-2">
                <span className={`text-xs font-bold ${isLight ? "text-slate-600" : "text-slate-400"} font-mono flex items-center gap-1.5`}>
                  <Sliders className="w-3.5 h-3.5 text-red-500" /> Forme d\'Onde Temporelle
                </span>
                <div className={`p-4 rounded-xl border relative h-28 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-900'
                }`}>
                  <svg className="w-full h-full" viewBox="0 0 300 80" preserveAspectRatio="none">
                    <line x1="10" y1="40" x2="290" y2="40" stroke="currentColor" className="text-slate-800" strokeWidth="0.5" strokeDasharray="3 3" />
                    <path d={renderWaveformPath(faultA.timeWaveType, 300, 80)} fill="none" stroke="#f43f5e" strokeWidth="1.5" />
                  </svg>
                </div>
              </div>

              {/* Theoretical Info A */}
              <div className="space-y-3 pt-2 text-xs">
                <div>
                  <h4 className={`font-bold ${isLight ? 'text-slate-850' : 'text-slate-300'}`}>Description Théorique :</h4>
                  <p className={`leading-relaxed text-[11px] mt-1 ${isLight ? 'text-slate-650' : 'text-slate-400'}`}>{faultA.summary}</p>
                </div>
                <div className={`grid grid-cols-2 gap-2 pt-2 border-t ${isLight ? 'border-slate-200' : 'border-slate-850'}`}>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 block">SÉVÉRITÉ MACHINE :</span>
                    <span className={`font-bold ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>{faultA.severityImpact}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 block">DÉPHASAGE CARACTÉRISTIQUE :</span>
                    <span className={`font-bold ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>{faultA.phaseGraphicType === 'quadrature' ? '90° (H/V)' : faultA.phaseGraphicType === 'coupling_axial' ? '180° axial' : 'Variable/Instable'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Column B */}
          <div className="xl:col-span-6 space-y-6">
            <div className={`p-5 rounded-2xl border ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#1E293B]/60 border-slate-800'
            } shadow-sm space-y-4`}>
              <div className={`flex items-center justify-between border-b pb-3 ${isLight ? 'border-slate-100' : 'border-slate-850'}`}>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest font-mono">SIGNATURE B</span>
                  <h3 className={`text-lg font-extrabold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>{faultB.name}</h3>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${getDifficultyColor(faultB.difficulty)}`}>
                  {faultB.category}
                </span>
              </div>

              {/* Spectrum Chart B */}
              <div className="space-y-2">
                <span className={`text-xs font-bold ${isLight ? "text-slate-600" : "text-slate-400"} font-mono flex items-center gap-1.5`}>
                  <Activity className="w-3.5 h-3.5 text-blue-400" /> Spectre FFT Type
                </span>
                <div className={`p-4 rounded-xl border relative h-40 flex items-end ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-900'
                }`}>
                  {/* SVG graph */}
                  <svg className="w-full h-full" viewBox="0 0 300 100" preserveAspectRatio="none">
                    <line x1="20" y1="90" x2="290" y2="90" stroke="currentColor" className="text-slate-700" strokeWidth="1" />
                    <line x1="20" y1="10" x2="20" y2="90" stroke="currentColor" className="text-slate-700" strokeWidth="1" />
                    {/* Render peaks */}
                    {faultB.fftPeaks.map((peak, idx) => {
                      const x = 20 + ((idx + 1) * 260) / (faultB.fftPeaks.length + 1);
                      const height = peak.amplitude * 0.75;
                      const y = 90 - height;
                      return (
                        <g key={`comp-b-peak-${idx}`}>
                          <line x1={x} y1="90" x2={x} y2={y} stroke="#3b82f6" strokeWidth="3" />
                          <circle cx={x} cy={y} r="3" fill="#3b82f6" />
                          <text x={x} y="98" fill="currentColor" className="text-[7px] text-slate-500 font-mono" textAnchor="middle">{peak.freq}</text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>

              {/* Waveform B */}
              <div className="space-y-2">
                <span className={`text-xs font-bold ${isLight ? "text-slate-600" : "text-slate-400"} font-mono flex items-center gap-1.5`}>
                  <Sliders className="w-3.5 h-3.5 text-blue-400" /> Forme d\'Onde Temporelle
                </span>
                <div className={`p-4 rounded-xl border relative h-28 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-900'
                }`}>
                  <svg className="w-full h-full" viewBox="0 0 300 80" preserveAspectRatio="none">
                    <line x1="10" y1="40" x2="290" y2="40" stroke="currentColor" className="text-slate-800" strokeWidth="0.5" strokeDasharray="3 3" />
                    <path d={renderWaveformPath(faultB.timeWaveType, 300, 80)} fill="none" stroke="#3b82f6" strokeWidth="1.5" />
                  </svg>
                </div>
              </div>

              {/* Theoretical Info B */}
              <div className="space-y-3 pt-2 text-xs">
                <div>
                  <h4 className={`font-bold ${isLight ? 'text-slate-850' : 'text-slate-300'}`}>Description Théorique :</h4>
                  <p className={`leading-relaxed text-[11px] mt-1 ${isLight ? 'text-slate-650' : 'text-slate-400'}`}>{faultB.summary}</p>
                </div>
                <div className={`grid grid-cols-2 gap-2 pt-2 border-t ${isLight ? 'border-slate-200' : 'border-slate-850'}`}>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 block">SÉVÉRITÉ MACHINE :</span>
                    <span className={`font-bold ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>{faultB.severityImpact}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 block">DÉPHASAGE CARACTÉRISTIQUE :</span>
                    <span className={`font-bold ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>{faultB.phaseGraphicType === 'quadrature' ? '90° (H/V)' : faultB.phaseGraphicType === 'coupling_axial' ? '180° axial' : 'Variable/Instable'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Comparison Summary Table */}
          <div className="xl:col-span-12">
            <div className={`p-6 rounded-2xl border ${
              isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#1E293B]/70 border-slate-800'
            } shadow-sm overflow-x-auto`}>
              <h3 className="text-sm font-extrabold mb-4 uppercase tracking-wider font-mono flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-emerald-500" /> Analyse de Différenciation de Diagnostic
              </h3>
              <table className="w-full text-xs text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className={`border-b ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                    <th className={`py-3 px-4 ${isLight ? "text-slate-600" : "text-slate-400"} font-bold uppercase font-mono`}>Critère Diagnostique</th>
                    <th className="py-3 px-4 text-red-500 font-black uppercase font-mono">{faultA.name}</th>
                    <th className="py-3 px-4 text-blue-500 font-black uppercase font-mono">{faultB.name}</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isLight ? 'divide-slate-100' : 'divide-slate-850'}`}>
                  <tr>
                    <td className={`py-3 px-4 font-bold ${isLight ? 'text-slate-850 font-black' : 'text-slate-300'}`}>Symptôme Principal</td>
                    <td className={`py-3 px-4 ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>{faultA.summary}</td>
                    <td className={`py-3 px-4 ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>{faultB.summary}</td>
                  </tr>
                  <tr>
                    <td className={`py-3 px-4 font-bold ${isLight ? 'text-slate-850' : 'text-slate-300'}`}>Analyse de Phase</td>
                    <td className={`py-3 px-4 ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>{faultA.phaseAnalysis}</td>
                    <td className={`py-3 px-4 ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>{faultB.phaseAnalysis}</td>
                  </tr>
                  <tr>
                    <td className={`py-3 px-4 font-bold ${isLight ? 'text-slate-850' : 'text-slate-300'}`}>Comportement Temporel</td>
                    <td className={`py-3 px-4 ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>{faultA.waveformAnalysis}</td>
                    <td className={`py-3 px-4 ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>{faultB.waveformAnalysis}</td>
                  </tr>
                  <tr>
                    <td className={`py-3 px-4 font-bold ${isLight ? 'text-slate-850' : 'text-slate-300'}`}>Méthode de Validation Clinique</td>
                    <td className="py-3 px-4">
                      <ul className="list-disc pl-4 space-y-1">
                        {faultA.confirmationChecklist.slice(0, 2).map((c, i) => (
                          <li key={`check-a-tb-${i}`} className={isLight ? 'text-slate-700 font-medium' : 'text-slate-400'}>{c}</li>
                        ))}
                      </ul>
                    </td>
                    <td className="py-3 px-4">
                      <ul className="list-disc pl-4 space-y-1">
                        {faultB.confirmationChecklist.slice(0, 2).map((c, i) => (
                          <li key={`check-b-tb-${i}`} className={isLight ? 'text-slate-700 font-medium' : 'text-slate-400'}>{c}</li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* STANDARD SEARCH LIBRARY + DETAILED VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel: Search Bar, Category filters, and Fault cards list (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Search Input and Filter Row */}
            <div className={`p-4 rounded-xl border space-y-3.5 ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#1E293B]/80 border-slate-800'
            } shadow-sm`}>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Rechercher un défaut (ex: balourd, roulement)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full text-xs pl-9 pr-4 py-2 rounded-lg border outline-none font-sans transition-all ${
                    isLight
                      ? 'bg-slate-50 hover:bg-slate-100/50 border-slate-300 text-slate-900 focus:border-blue-500 focus:bg-white'
                      : '${isLight ? "bg-slate-100" : "bg-slate-900/60"} border-slate-700 hover:border-slate-600 text-white focus:border-blue-500 focus:bg-slate-900'
                  }`}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Categorization tabs */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {categories.map((cat) => {
                  const isActive = selectedCategory === cat;
                  return (
                    <button
                      key={`cat-btn-${cat}`}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold tracking-wide uppercase transition-all cursor-pointer ${
                        isActive
                          ? (isBW ? 'bg-white text-black font-extrabold' : 'bg-blue-600 text-white shadow-sm')
                          : (isLight 
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-600' 
                              : 'bg-slate-800/50 hover:bg-slate-800 ${isLight ? "text-slate-600" : "text-slate-400"}')
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Scrollable List of Cards */}
            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {filteredFaults.length > 0 ? (
                filteredFaults.map((fault) => {
                  const isSelected = selectedFaultId === fault.id;
                  return (
                    <div
                      key={`fault-card-${fault.id}`}
                      onClick={() => {
                        setSelectedFaultId(fault.id);
                        // Reset visualizer tab when switching faults
                        setVisualTab('fft');
                      }}
                      className={`p-4 rounded-xl border text-left cursor-pointer transition-all duration-250 relative ${
                        isSelected
                          ? (isBW 
                              ? 'bg-slate-200 border-white text-black shadow-lg font-bold' 
                              : (isLight
                                  ? 'bg-blue-100/50 border-blue-500 text-slate-900 shadow-md shadow-blue-500/10'
                                  : 'bg-blue-900/20 border-blue-500 text-white shadow-md shadow-blue-950/20'))
                          : (isLight 
                              ? 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800' 
                              : 'bg-[#1E293B]/40 hover:bg-[#1E293B]/80 ${isLight ? "border-slate-300" : "border-slate-800"} ${isLight ? "text-slate-700" : "text-slate-300"}')
                      }`}
                    >
                      {isSelected && !isBW && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l-xl" />
                      )}
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                          isLight 
                            ? (isSelected ? 'bg-blue-100 text-blue-800 font-extrabold' : 'bg-slate-100 text-slate-600')
                            : (isSelected ? 'bg-blue-500/20 text-blue-300' : '${isLight ? "bg-slate-200" : "bg-slate-800"} ${isLight ? "text-slate-600" : "text-slate-400"}')
                        }`}>
                          {fault.category}
                        </span>
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.25 rounded-md border ${getDifficultyColor(fault.difficulty)}`}>
                          {fault.difficulty}
                        </span>
                      </div>
                      <h3 className={`text-xs font-extrabold tracking-tight mb-1 ${
                        isSelected && isLight ? 'text-blue-950 font-black' : ''
                      }`}>{fault.name}</h3>
                      <p className={`text-[11px] line-clamp-2 leading-relaxed ${
                        isSelected 
                          ? (isLight ? 'text-slate-700 font-medium' : 'text-slate-300') 
                          : (isLight ? 'text-slate-500' : 'text-slate-400')
                      }`}>
                        {fault.summary}
                      </p>
                      <div className={`flex items-center justify-end gap-1 mt-2 text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity ${
                        isLight ? 'text-blue-600' : 'text-blue-400'
                      }`}>
                        <span>Voir détails</span>
                        <ChevronRight className="w-3 h-3" />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className={`p-8 text-center rounded-xl border ${
                  isLight ? 'bg-white border-slate-200 text-slate-400' : 'bg-slate-900/40 border-slate-800 text-slate-500'
                }`}>
                  <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-55" />
                  <p className="text-xs font-bold uppercase tracking-wider font-mono">Aucun défaut trouvé</p>
                  <p className="text-[10px] mt-1">Essayez d\'ajuster vos filtres ou termes de recherche.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Active Signature detail board (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className={`p-6 rounded-2xl border ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#1E293B]/70 border-slate-800 text-white'
            } shadow-md space-y-6`}>
              
              {/* Header Title section */}
              <div className="border-b border-slate-850 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className={`text-[10px] font-black uppercase tracking-widest block font-mono ${isLight ? 'text-blue-600' : 'text-blue-400'}`}>
                    Analyse Signature — {activeFault.subCategory}
                  </span>
                  <h2 className="text-xl font-black tracking-tight">{activeFault.name}</h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-500">Gravité type:</span>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                    {activeFault.severityImpact}
                  </span>
                </div>
              </div>

              {/* Graphic Visualizer: Switch between FFT and Time-waveform */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Activity className={`w-4 h-4 ${isBW ? 'text-white' : 'text-blue-500'}`} />
                    <span className="text-xs font-extrabold uppercase tracking-wider font-mono">Signaux caractéristiques</span>
                  </div>
                  <div className={`flex rounded-lg p-0.5 border ${
                    isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-850'
                  }`}>
                    <button
                      onClick={() => setVisualTab('fft')}
                      className={`px-3 py-1 rounded text-[10px] font-bold tracking-wide transition-all cursor-pointer ${
                        visualTab === 'fft'
                          ? (isBW ? 'bg-white text-black font-extrabold' : 'bg-blue-600 text-white')
                          : 'text-slate-450 hover:text-slate-300'
                      }`}
                    >
                      Spectre FFT (Fréquences)
                    </button>
                    <button
                      onClick={() => setVisualTab('time')}
                      className={`px-3 py-1 rounded text-[10px] font-bold tracking-wide transition-all cursor-pointer ${
                        visualTab === 'time'
                          ? (isBW ? 'bg-white text-black font-extrabold' : 'bg-blue-600 text-white')
                          : 'text-slate-450 hover:text-slate-300'
                      }`}
                    >
                      Signal Temporel
                    </button>
                  </div>
                </div>

                {visualTab === 'fft' ? (
                  /* FFT GRAPH INTERACTIVE VISUALIZER */
                  <div className="space-y-2">
                    <div className={`p-4 rounded-xl border relative h-48 flex items-end overflow-hidden ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-900'
                    }`}>
                      {/* Grid background lines */}
                      <div className="absolute inset-0 grid grid-cols-5 grid-rows-4 pointer-events-none opacity-5">
                        <div className="border-r border-b border-slate-500" />
                        <div className="border-r border-b border-slate-500" />
                        <div className="border-r border-b border-slate-500" />
                        <div className="border-r border-b border-slate-500" />
                        <div className="border-b border-slate-500" />
                      </div>

                      {/* Actual vector graph */}
                      <svg className="w-full h-[85%] relative z-10" viewBox="0 0 400 120" preserveAspectRatio="none">
                        {/* Horizontal base line */}
                        <line x1="20" y1="110" x2="385" y2="110" stroke="currentColor" className="text-slate-700" strokeWidth="1.5" />
                        {/* Vertical amplitude line */}
                        <line x1="20" y1="10" x2="20" y2="110" stroke="currentColor" className="text-slate-700" strokeWidth="1.5" />
                        
                        {/* Interactive Peaks */}
                        {activeFault.fftPeaks.map((peak, idx) => {
                          const x = 20 + ((idx + 1) * 350) / (activeFault.fftPeaks.length + 1);
                          const peakH = peak.amplitude * 0.9;
                          const y = 110 - peakH;
                          const isHovered = hoveredPeak?.freq === peak.freq;
                          
                          return (
                            <g key={`peak-${idx}`} className="group cursor-help">
                              {/* Thin connector drop line */}
                              <line x1={x} y1="110" x2={x} y2={y} stroke="currentColor" className={`${
                                isHovered ? 'text-blue-400 stroke-[1.5]' : 'text-slate-800 stroke-[0.5]'
                              }`} strokeDasharray="3 3" />
                              {/* Actual peak bar */}
                              <line
                                x1={x}
                                y1="110"
                                x2={x}
                                y2={y}
                                stroke={isBW ? '#ffffff' : (isHovered ? '#38bdf8' : '#3b82f6')}
                                strokeWidth={isHovered ? '4' : '2.5'}
                                className="transition-all duration-150"
                              />
                              {/* Top indicator dot */}
                              <circle
                                cx={x}
                                cy={y}
                                r={isHovered ? '5' : '3'}
                                fill={isBW ? '#ffffff' : (isHovered ? '#06b6d4' : '#60a5fa')}
                                className="transition-all duration-150"
                              />
                              {/* X Axis text label */}
                              <text x={x} y="119" fill="currentColor" className="text-[8px] font-mono text-slate-500 font-bold" textAnchor="middle">
                                {peak.freq}
                              </text>
                              {/* Y Axis height hint */}
                              {isHovered && (
                                <text x={x} y={y - 6} fill="#38bdf8" className="text-[7px] font-mono font-extrabold" textAnchor="middle">
                                  {peak.amplitude}%
                                </text>
                              )}
                              {/* Hover triggering area overlay */}
                              <rect
                                x={x - 15}
                                y="10"
                                width="30"
                                height="100"
                                fill="transparent"
                                className="cursor-pointer"
                                onMouseEnter={() => setHoveredPeak(peak)}
                                onMouseLeave={() => setHoveredPeak(null)}
                              />
                            </g>
                          );
                        })}
                      </svg>

                      {/* Axes labels */}
                      <span className="absolute left-2.5 top-1.5 text-[8px] font-mono text-slate-500 uppercase tracking-widest font-extrabold">Amplitude (mm/s ou g)</span>
                      <span className="absolute right-4.5 bottom-1.5 text-[8px] font-mono text-slate-500 uppercase tracking-widest font-extrabold">Fréquence</span>
                    </div>

                    {/* Peak Tooltip Helper Panel */}
                    <div className={`p-3.5 rounded-xl border transition-all duration-300 ${
                      hoveredPeak 
                        ? (isBW ? 'bg-slate-100 border-white text-slate-900' : 'bg-blue-950/40 border-blue-500/30 text-white') 
                        : (isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-900/30 border-slate-850 text-slate-400')
                    }`}>
                      {hoveredPeak ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
                            <span className="text-[10px] font-mono uppercase tracking-widest font-black text-blue-400">Pic sélectionné : {hoveredPeak.freq}</span>
                          </div>
                          <h4 className="text-xs font-extrabold">{hoveredPeak.label}</h4>
                          <p className="text-[11px] leading-relaxed text-slate-350">{hoveredPeak.desc}</p>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 py-0.5 text-[10px] font-mono">
                          <Info className="w-3.5 h-3.5 text-slate-450" />
                          <span>Survolez les pics du spectre FFT ci-dessus pour afficher l\'analyse explicative détaillée.</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* TIME DOMAIN GRAPH VISUALIZER */
                  <div className="space-y-2">
                    <div className={`p-4 rounded-xl border relative h-48 overflow-hidden ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-900'
                    }`}>
                      {/* Oscilloscope Grid */}
                      <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 pointer-events-none opacity-5">
                        <div className="border-r border-b border-slate-500" />
                        <div className="border-r border-b border-slate-500" />
                        <div className="border-r border-b border-slate-500" />
                        <div className="border-r border-b border-slate-500" />
                        <div className="border-r border-b border-slate-500" />
                        <div className="border-b border-slate-500" />
                      </div>

                      {/* Continuous wave path */}
                      <div className="w-full h-[85%] relative mt-3">
                        <svg className="w-full h-full" viewBox="0 0 400 100" preserveAspectRatio="none">
                          <line x1="0" y1="50" x2="400" y2="50" stroke="currentColor" className="text-slate-800" strokeWidth="0.75" strokeDasharray="3 3" />
                          <path
                            d={renderWaveformPath(activeFault.timeWaveType, 400, 100)}
                            fill="none"
                            stroke={isBW ? '#ffffff' : '#10b981'}
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>

                      <span className="absolute left-2.5 top-1.5 text-[8px] font-mono text-slate-500 uppercase tracking-widest font-extrabold">Amplitude Temporelle</span>
                      <span className="absolute right-4.5 bottom-1.5 text-[8px] font-mono text-slate-500 uppercase tracking-widest font-extrabold">Temps (t)</span>
                    </div>

                    {/* Explanatory Wave text */}
                    <div className={`p-3 rounded-xl border ${
                      isLight ? 'bg-slate-50 border-slate-200 text-slate-750' : 'bg-slate-900/30 border-slate-850 text-slate-400'
                    } text-xs leading-relaxed`}>
                      <span className={`font-bold block mb-0.5 ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>Comportement Temporel :</span>
                      {activeFault.waveformAnalysis}
                    </div>
                  </div>
                )}
              </div>

              {/* Physical/Mathematical Formula */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                <div className={`md:col-span-8 p-4 rounded-xl border space-y-2 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#1E293B]/40 border-slate-850'
                }`}>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono">Formulation Physique & Mathématique</span>
                  <div className="flex items-center gap-3">
                    <div className={`bg-slate-900/90 px-4 py-2.5 rounded-lg border ${isLight ? "border-slate-300" : "border-slate-800"} shadow-inner flex items-center justify-center font-mono text-sm text-emerald-400 font-extrabold min-w-[110px]`}>
                      {formatFormula(activeFault.formula)}
                    </div>
                    <div className={`text-[11px] leading-relaxed ${isLight ? 'text-slate-650' : 'text-slate-400'}`}>
                      {activeFault.formulaDesc}
                    </div>
                  </div>
                </div>

                {/* Spatial Phase Relations */}
                <div className={`md:col-span-4 p-4 rounded-xl border flex flex-col items-center justify-between gap-2 text-center ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#1E293B]/40 border-slate-850'
                }`}>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono">Relation Spatiale de Phase</span>
                  <div className="flex-1 flex items-center justify-center py-1">
                    {renderPhaseVector(activeFault.phaseGraphicType)}
                  </div>
                </div>
              </div>

              {/* Detailed Technical Description text */}
              <div className="space-y-2">
                <h4 className={`text-xs font-bold uppercase tracking-wider font-mono ${isLight ? 'text-slate-850' : 'text-slate-300'}`}>Analyse Théorique Approfondie</h4>
                <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
                  {activeFault.description}
                </p>
                <div className={`p-4 rounded-xl border text-xs leading-relaxed ${
                  isLight ? 'bg-blue-50/20 border-blue-100 text-slate-750' : 'bg-slate-900/30 border-slate-850'
                }`}>
                  <span className={`font-extrabold block mb-1 ${isLight ? 'text-blue-900' : 'text-slate-300'}`}>Déchiffrage Spectral :</span>
                  {activeFault.spectrumAnalysis}
                </div>
              </div>

              {/* Step-by-Step Clinical Field Validation Checklist */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <h4 className={`text-xs font-bold uppercase tracking-wider font-mono ${isLight ? 'text-slate-850' : 'text-slate-300'}`}>Protocole de Validation Clinique sur Site</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activeFault.confirmationChecklist.map((step, idx) => (
                    <div
                      key={`step-${idx}`}
                      className={`p-3 rounded-lg border text-[11px] leading-relaxed flex items-start gap-2.5 ${
                        isLight ? 'bg-white border-slate-200' : 'bg-slate-900/40 border-slate-850'
                      }`}
                    >
                      <div className="w-4 h-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-2.5 h-2.5 text-emerald-400" />
                      </div>
                      <span className={isLight ? 'text-slate-700 font-medium' : 'text-slate-400'}>{step}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
