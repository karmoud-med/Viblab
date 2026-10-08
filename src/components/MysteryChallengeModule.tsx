import React, { useState, useEffect, useRef } from 'react';
import { HelpCircle, RefreshCw, CheckCircle2, XCircle, ShieldAlert, Award, ChevronRight, Activity, Radio, Compass } from 'lucide-react';

type DefectType = 
  | 'unbalance' 
  | 'misalignment' 
  | 'looseness' 
  | 'resonance' 
  | 'bearing'
  | 'bent_shaft'
  | 'cavitation'
  | 'gear_defect'
  | 'belt_slippage'
  | 'eccentric_rotor'
  | 'unbalance_and_bearing'
  | 'misalignment_and_looseness';

interface Scenario {
  id: DefectType;
  name: string;
  frenchLabel: string;
  description: string;
  signatureFFT: string;
  signatureWave: string;
  signaturePhase: string;
  clues: string[];
}

const SCENARIOS: Scenario[] = [
  {
    id: 'unbalance',
    name: 'Unbalance',
    frenchLabel: 'Balourd de rotor (Déséquilibre)',
    description: 'Une répartition asymétrique de la masse autour de l\'axe de rotation. Génère une force centrifuge tournante.',
    signatureFFT: 'Pic unique dominant et très élevé à 1x RPM en radial. Pas de pics à haute fréquence.',
    signatureWave: 'Sinusoïde pure, régulière et propre sur les deux voies.',
    signaturePhase: 'Déphasage stable de 90° entre les capteurs Horizontal et Vertical du même palier (force tournante circulaire). Phase identique entre les deux paliers en radial (balourd statique).',
    clues: [
      'Amplitude proportionnelle au carré de la vitesse (augmente rapidement avec les RPM).',
      'Le signal temporel est presque parfait, sans distorsion ni harmoniques.',
      'Le déphasage H vs V est orthogonal (90°).'
    ]
  },
  {
    id: 'misalignment',
    name: 'Misalignment',
    frenchLabel: 'Désalignement d\'arbre (Accouplement)',
    description: 'Les axes géométriques des deux arbres accouplés ne coïncident pas (angulaire, parallèle ou combiné).',
    signatureFFT: 'Pics prononcés à 1x et surtout à 2x RPM. Parfois 3x RPM visible. Forte vibration axiale.',
    signatureWave: 'Forme d\'onde légèrement distordue (double bosse ou asymétrique), mais périodique.',
    signaturePhase: 'Déphasage axial d\'environ 180° à travers l\'accouplement.',
    clues: [
      'Présence d\'une composante à 2x RPM presque aussi forte ou supérieure à 1x RPM.',
      'Le signal axial est exceptionnellement fort.',
      'Changement de phase de 180° mesuré axialement de part et d\'autre de l\'accouplement.'
    ]
  },
  {
    id: 'looseness',
    name: 'Looseness',
    frenchLabel: 'Jeu mécanique ou Desserrage',
    description: 'Boulons d\'ancrage desserrés, jeu excessif dans les paliers, ou fissure structurelle dans le châssis.',
    signatureFFT: 'Longue série d\'harmoniques entières (1x, 2x, 3x, 4x, etc.) avec présence caractéristique de demi-harmoniques (0.5x, 1.5x, 2.5x). Bruit de fond surélevé.',
    signatureWave: 'Signal fortement tronqué ou asymétrique (les chocs limitent le déplacement dans un sens).',
    signaturePhase: 'Phase instable, fluctuante ou déphasage erratique entre les relevés.',
    clues: [
      'Le signal de l\'oscilloscope est asymétrique avec des plats (coups/butées).',
      'Présence de sous-harmoniques ou de fractions comme 0.5x, 1.5x dans le spectre.',
      'La phase change d\'une seconde à l\'autre car la structure "flotte" aléatoirement.'
    ]
  },
  {
    id: 'resonance',
    name: 'Resonance',
    frenchLabel: 'Résonance structurelle (Fréquence critique)',
    description: 'La vitesse de rotation de la machine coïncide avec une fréquence propre de la structure de support.',
    signatureFFT: 'Pic d\'amplitude colossal à 1x RPM uniquement lorsque la vitesse traverse la fréquence critique (ici fixée à 1800 RPM).',
    signatureWave: 'Sinusoïde pure d\'amplitude extrême au pic critique, qui s\'effondre dès qu\'on change la vitesse.',
    signaturePhase: 'Glissement de phase rapide de 180° lors du passage de la vitesse critique (0° en sous-critique, 90° au pic, 180° en sur-critique).',
    clues: [
      'L\'amplitude vibratoire atteint un pic violent à une vitesse précise (1800 RPM) puis diminue fortement au-delà.',
      'La phase par rapport au tachymètre subit une transition complète de 180°.',
      'L\'augmentation de la vitesse au-delà de 1900 RPM fait baisser le niveau vibratoire global.'
    ]
  },
  {
    id: 'bearing',
    name: 'Bearing Defect',
    frenchLabel: 'Défaut de roulement (�0caillage bague externe)',
    description: 'Une anomalie ou un écaillage localisé sur la piste externe du roulement (défaut de type BPFO).',
    signatureFFT: 'Pics de haute fréquence non entiers (ex. 3.12x RPM) avec des bandes latérales espacées de 1x RPM. Plancher de bruit de haute fréquence élevé.',
    signatureWave: 'Série d\'impacts périodiques à haute fréquence atténuée (ondes amorties répétées à la fréquence de passage).',
    signaturePhase: 'La phase à basse fréquence (1x) reste normale, mais les impacts haute fréquence sont désynchronisés par rapport à la rotation standard.',
    clues: [
      'Le spectre montre des pics à des fréquences décimales (non-multiples de 1x).',
      'Le signal temporel montre des pics d\'impacts pointus suivis de décroissances exponentielles.',
      'L\'énergie vibratoire est concentrée dans les hautes fréquences (accélération g).'
    ]
  },
  {
    id: 'bent_shaft',
    name: 'Bent Shaft',
    frenchLabel: 'Arbre fléchi (Flexion d\'arbre)',
    description: 'Une déformation permanente ou courbure de l\'arbre rotorique, créant des contraintes de flexion tournantes élevées.',
    signatureFFT: 'Forte vibration axiale dominante à 1x RPM. 2x RPM également visible si le pliage est important.',
    signatureWave: 'Onde sinusoïdale très propre et stable, mais de très haute amplitude dans la direction axiale.',
    signaturePhase: 'Le déphasage mesuré axialement d\'un bout à l\'autre du même arbre approche 180°.',
    clues: [
      'La vibration axiale à 1X RPM est exceptionnellement prépondérante par rapport à la direction radiale.',
      'Le déphasage axial de part et d\'autre du rotor est de 180°.',
      'Le comportement dynamique ressemble à un balourd mais l\'aspect directionnel (axial) confirme la flexion.'
    ]
  },
  {
    id: 'cavitation',
    name: 'Cavitation',
    frenchLabel: 'Cavitation de pompe hydraulique',
    description: 'Création et implosion violente de bulles de vapeur dans le fluide traversant la pompe à cause d\'une pression locale trop faible.',
    signatureFFT: 'Absence de pics harmoniques à haute fréquence. Présence d\'un énorme monticule de bruit aléatoire continu ("bruit de friture" ou "grass noise") entre 100 Hz et 180 Hz.',
    signatureWave: 'Forme d\'onde très bruitée avec des pointes de chocs irrégulières et aléatoires qui masquent la sinusoïde de rotation.',
    signaturePhase: 'La phase est instable et fluctue constamment de façon aléatoire en raison du caractère turbulent de l\'excitation hydraulique.',
    clues: [
      'Le spectre FFT ressemble à un large dôme ou monticule de bruit sans pics harmoniques distincts.',
      'L\'oscilloscope ressemble à du bruit blanc chaotique avec des impacts aléatoires ("bruit de gravier").',
      'La phase mesurée entre deux points varie de manière complètement désordonnée au cours du temps.'
    ]
  },
  {
    id: 'gear_defect',
    name: 'Gear Defect',
    frenchLabel: 'Défaut d\'engrènement (Dent endommagée)',
    description: 'Rupture, fissure ou écaillage d\'une dent sur un pignon d\'engrenage provoquant des chocs cycliques à l\'engrènement.',
    signatureFFT: 'Pic élevé à la fréquence d\'engrènement (GMF = Fréquence de rotation x nombre de dents) entouré de bandes latérales symétriques espacées de 1x RPM.',
    signatureWave: 'Signal périodique modulé en amplitude avec des pointes de choc brèves et intenses à chaque tour complet de l\'arbre défectueux.',
    signaturePhase: 'La phase reste stable à la fréquence d\'engrènement (GMF) mais subit des micro-modulations périodiques.',
    clues: [
      'Un pic majeur se situe à la fréquence d\'engrènement (GMF) avec des pics satellites (bandes de modulation).',
      'L\'espacement entre les bandes latérales correspond exactement à la vitesse de rotation de l\'arbre d\'entraînement.',
      'Le signal temporel montre un motif classique de battements ou de modulations de l\'amplitude.'
    ]
  },
  {
    id: 'belt_slippage',
    name: 'Belt Slippage',
    frenchLabel: 'Glissement & Usure de Courroie',
    description: 'Une perte d\'adhérence ou usure asymétrique d\'une courroie de transmission, générant des excitations périodiques inférieures à la vitesse de rotation.',
    signatureFFT: 'Pics vibratoires à des fréquences inférieures à 1x RPM (souvent entre 0.3x et 0.45x RPM) ainsi que leurs multiples entiers (2x, 3x fréquence de courroie).',
    signatureWave: 'Signal temporel complexe superposant des oscillations à basse fréquence.',
    signaturePhase: 'Phase stable à la fréquence de la courroie, mais déphasée par rapport à l\'arbre rotatif.',
    clues: [
      'Les pics dominants se situent à des fréquences inférieures à la vitesse de rotation de la machine (sous-harmoniques).',
      'La fréquence de la courroie dépend de sa longueur et des diamètres des poulies, typiquement 0.38X la vitesse de la poulie.',
      'La vibration est souvent instable en amplitude selon la charge de la machine.'
    ]
  },
  {
    id: 'eccentric_rotor',
    name: 'Eccentric Rotor',
    frenchLabel: 'Excentricité de rotor (Écart d\'entrefer)',
    description: 'Le centre géométrique du rotor ne coïncide pas avec son axe de rotation, provoquant un entrefer asymétrique et des forces électromagnétiques tournantes.',
    signatureFFT: 'Pics à 1x RPM fortement accentués, accompagnés de bandes latérales fines à la fréquence de glissement.',
    signatureWave: 'Modulation d\'amplitude très lente et régulière de la forme d\'onde vibratoire (battement magnétique).',
    signaturePhase: 'Le déphasage radial entre capteurs Horizontal et Vertical est instable ou tend vers 0° (mouvement unidirectionnel d\'attraction magnétique).',
    clues: [
      'La vibration principale est à 1X RPM mais sa hauteur oscille lentement à la fréquence de glissement sous charge.',
      'Un essai d\'arrêt (coupure de l\'alimentation électrique) fait disparaître instantanément la composante d\'excentricité.',
      'Le déphasage radial H/V est très faible (proche de 0°), montrant une vibration purement unidirectionnelle.'
    ]
  },
  {
    id: 'unbalance_and_bearing',
    name: 'Combined: Unbalance & Bearing',
    frenchLabel: 'Panne combinée : Balourd + Roulement (Complexe)',
    description: 'Un scénario composite très fréquent en industrie où un déséquilibre résiduel important fatigue prématurément le roulement de support, créant un écaillage de la bague externe.',
    signatureFFT: 'Superposition d\'un pic géant à 1x RPM en radial et d\'une série de pics non-entiers caractéristiques du défaut de roulement (BPFO à 3.12x RPM) avec des bandes latérales.',
    signatureWave: 'Forme d\'onde hybride : une grande oscillation sinusoïdale fondamentale à 1x RPM polluée par des pointes de chocs périodiques pointues.',
    signaturePhase: 'Déphasage net de 90° à la fréquence de rotation fondamentale (1x), tandis que les pics d\'impacts haute fréquence sont déphasés de façon asynchrone.',
    clues: [
      'Il y a DEUX signatures majeures distinctes : une forte amplitude radiale à 1X RPM ET des pics décimaux haute fréquence.',
      'Le signal temporel combine l\'allure de la sinusoïde du balourd avec les décharges impulsionnelles du roulement dégradé.',
      'C\'est un cas complexe d\'évolution de défaut (le balourd engendre des charges dynamiques qui détruisent le palier).'
    ]
  },
  {
    id: 'misalignment_and_looseness',
    name: 'Combined: Misalignment & Looseness',
    frenchLabel: 'Panne combinée : Désalignement + Jeu (Complexe)',
    description: 'Le désalignement sévère des accouplements génère des forces statiques et cycliques qui ont fini par cisailler ou desserrer les boulons d\'ancrage d\'un pied de la machine.',
    signatureFFT: 'Coexistence des pics de désalignement (1x, 2x, 3x RPM) et de la longue traînée d\'harmoniques entières et de demi-harmoniques (0.5x, 1.5x, 2.5x RPM) dues au desserrage.',
    signatureWave: 'Forme d\'onde chaotique montrant une double-bosse asymétrique avec des zones d\'impacts tronquées et rabotées aux extremités.',
    signaturePhase: 'Phase instable et fluctuante avec des variations brusques. Déphasage axial de près de 180° au niveau de l\'accouplement.',
    clues: [
      'Le spectre montre à la fois des harmoniques d\'ordre élevé (jusqu\'à 10X), des demi-harmoniques (0.5X/1.5X) et un pic majeur à 2X RPM.',
      'La forme d\'onde est écrêtée d\'un côté, et montre une déformation complexe à double impulsion.',
      'Le désalignement d\'arbre induit un effort tranchant alternatif qui favorise le jeu d\'ancrage structurel.'
    ]
  }
];

interface MysteryChallengeModuleProps {
  theme: 'light' | 'dark' | 'mono';
}

export default function MysteryChallengeModule({ theme }: MysteryChallengeModuleProps) {
  const isLight = theme === 'light';
  const isBW = theme === 'mono';

  // State
  const [score, setScore] = useState<number>(0);
  const [totalAttempts, setTotalAttempts] = useState<number>(0);
  const [currentScenario, setCurrentScenario] = useState<Scenario>(SCENARIOS[0]);
  const [rpm, setRpm] = useState<number>(1500); // Default RPM
  const [sensorA, setSensorA] = useState<string>('2RH'); // Horizontal Drive End
  const [sensorB, setSensorB] = useState<string>('2RV'); // Vertical Drive End
  const [activeTab, setActiveTab] = useState<'scope' | 'fft' | 'orbit'>('scope');
  const [selectedGuess, setSelectedGuess] = useState<DefectType | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string>('');
  const [showClueCount, setShowClueCount] = useState<number>(0);

  // Canvas Refs
  const scopeCanvasRef = useRef<HTMLCanvasElement>(null);
  const fftCanvasRef = useRef<HTMLCanvasElement>(null);
  const orbitCanvasRef = useRef<HTMLCanvasElement>(null);

  // Load a random scenario
  const initNewMysteryMachine = () => {
    const currentIndex = SCENARIOS.findIndex(s => s.id === currentScenario.id);
    let nextIndex = currentIndex;
    while (nextIndex === currentIndex) {
      nextIndex = Math.floor(Math.random() * SCENARIOS.length);
    }
    setCurrentScenario(SCENARIOS[nextIndex]);
    setRpm(1200 + Math.floor(Math.random() * 800)); // random RPM between 1200 and 2000
    setSelectedGuess(null);
    setHasSubmitted(false);
    setIsCorrect(false);
    setFeedback('');
    setShowClueCount(0);
  };

  // Init on mount
  useEffect(() => {
    initNewMysteryMachine();
  }, []);

  const handleDiagnose = () => {
    if (!selectedGuess) return;
    const correct = selectedGuess === currentScenario.id;
    setIsCorrect(correct);
    setHasSubmitted(true);
    setTotalAttempts(prev => prev + 1);
    if (correct) {
      setScore(prev => prev + 1);
      setFeedback('Félicitations ! Votre diagnostic est parfaitement exact. Vous avez identifié les signatures vibratoires caractéristiques.');
    } else {
      setFeedback(`Diagnostic erroné. Il s'agissait en réalité d'un(e) : ${currentScenario.frenchLabel}. Analysez la correction détaillée ci-dessous.`);
    }
  };

  const getSignals = (time: number, sType: string) => {
    const f1x = rpm / 60; // rotational frequency
    let amp = 1.0;
    let phaseShift = sType === '2RV' ? -Math.PI / 2 : 0; // standard 90 deg V vs H
    let noise = (Math.sin(time * 1000) * 0.05 + Math.cos(time * 2500) * 0.03);

    switch (currentScenario.id) {
      case 'unbalance':
        // Pure high 1x
        amp = 2.8 * (rpm / 1500) ** 2;
        return amp * Math.sin(2 * Math.PI * f1x * time + phaseShift) + noise;

      case 'misalignment':
        // High 1x and 2x
        amp = 1.8;
        const phaseShiftAxial = sType === '2RV' ? Math.PI : 0; // axial / phase shift 180
        return (
          amp * Math.sin(2 * Math.PI * f1x * time + phaseShift) +
          1.5 * Math.sin(2 * Math.PI * (2 * f1x) * time + phaseShiftAxial) +
          noise
        );

      case 'looseness':
        // Distorted truncated wave, harmonics
        amp = 2.2;
        const rawWave = amp * Math.sin(2 * Math.PI * f1x * time + phaseShift);
        // Truncate bottom half to simulate impact/mechanical looseness clipping
        const clippedWave = rawWave < -0.6 ? -0.6 + (rawWave + 0.6) * 0.15 : rawWave;
        // Add random high freq structural rattle
        const rattle = 0.4 * Math.sin(2 * Math.PI * (4.5 * f1x) * time) * Math.sin(2 * Math.PI * f1x * 0.5 * time);
        return clippedWave + rattle + noise * 2;

      case 'resonance':
        // Extreme amplitude peak at 1800 RPM (30Hz)
        const distanceToResonance = Math.abs(rpm - 1800);
        const resonanceGain = 6.0 / (1 + (distanceToResonance / 80) ** 2); // Lorentz profile
        amp = 0.5 + resonanceGain;
        // Phase shift around resonance from 0 to -180 deg
        const resPhaseShift = -Math.PI / (1 + Math.exp(-(rpm - 1800) / 40));
        return amp * Math.sin(2 * Math.PI * f1x * time + phaseShift + resPhaseShift) + noise;

      case 'bearing':
        // Series of high frequency impacts
        const bpfo = 3.12 * f1x;
        const impactInterval = 1 / bpfo;
        const relativeTime = time % impactInterval;
        const impactAmp = 3.5 * Math.exp(-relativeTime * 150) * Math.sin(2 * Math.PI * 450 * time);
        // Small 1x RPM component is always there
        const baseRev = 0.4 * Math.sin(2 * Math.PI * f1x * time + phaseShift);
        return baseRev + impactAmp + noise;

      case 'bent_shaft':
        // Very high axial vibration (2A sensor) and moderate radial
        const isAxialSensor = sType === '2A';
        const bentAmp = isAxialSensor ? 3.2 : 1.1;
        const bentPhase = sType === '2RV' ? -Math.PI / 2 : (sType === '2A' ? Math.PI : 0);
        return bentAmp * Math.sin(2 * Math.PI * f1x * time + bentPhase) +
               0.6 * Math.sin(2 * Math.PI * (2 * f1x) * time + bentPhase * 2) + noise;

      case 'cavitation':
        // Massive hydraulic turbulence / broad broadband noise
        const cavitationNoise = Math.sin(time * 3000) * Math.cos(time * 1800) * 1.4 + 
                                 Math.sin(time * 7500) * 0.7 + 
                                 Math.cos(time * 11500) * 0.35;
        const lowFreqFlow = 0.35 * Math.sin(2 * Math.PI * f1x * time);
        return lowFreqFlow + cavitationNoise + noise * 3.5;

      case 'gear_defect':
        // Gear mesh frequency (e.g. 21 * f1x) modulated in amplitude by 1x RPM
        const gmf = 21 * f1x;
        const gearMod = 0.55 + 0.45 * Math.sin(2 * Math.PI * f1x * time);
        const toothImpact = 2.2 * gearMod * Math.sin(2 * Math.PI * gmf * time);
        const shaft1x = 0.45 * Math.sin(2 * Math.PI * f1x * time + phaseShift);
        return shaft1x + toothImpact + noise;

      case 'belt_slippage':
        // Sub-harmonic belt speed (~0.38x) and its harmonics
        const beltFreq = 0.38 * f1x;
        return 1.5 * Math.sin(2 * Math.PI * beltFreq * time) +
               0.9 * Math.sin(2 * Math.PI * (2 * beltFreq) * time) +
               0.4 * Math.sin(2 * Math.PI * (3 * beltFreq) * time) +
               0.3 * Math.sin(2 * Math.PI * f1x * time + phaseShift) + noise;

      case 'eccentric_rotor':
        // Attraction force is unidirectionally biased (so very narrow radial H/V phase)
        const eccentricPhase = sType === '2RV' ? -0.12 : 0;
        // Beating at slip frequency (slow amplitude change)
        const slipBeating = 0.75 + 0.25 * Math.sin(2 * Math.PI * 3.5 * time);
        return 2.4 * slipBeating * Math.sin(2 * Math.PI * f1x * time + eccentricPhase) + noise;

      case 'unbalance_and_bearing':
        // Composite: Giant 1x RPM unbalance + high-frequency BPFO bearing impacts
        const compUnb = 2.5 * Math.sin(2 * Math.PI * f1x * time + phaseShift);
        const compBpfo = 3.12 * f1x;
        const compInterval = 1 / compBpfo;
        const compRelTime = time % compInterval;
        const compImpact = 2.2 * Math.exp(-compRelTime * 130) * Math.sin(2 * Math.PI * 450 * time);
        return compUnb + compImpact + noise;

      case 'misalignment_and_looseness':
        // Composite: 1x & 2x misalignment + severe looseness clipping/mechanical rattle
        const compMis = 1.5 * Math.sin(2 * Math.PI * f1x * time + phaseShift) +
                        1.2 * Math.sin(2 * Math.PI * (2 * f1x) * time + (sType === '2RV' ? Math.PI : 0));
        const compClipped = compMis < -0.55 ? -0.55 + (compMis + 0.55) * 0.18 : compMis;
        const compRattle = 0.45 * Math.sin(2 * Math.PI * (6 * f1x) * time) * Math.sin(2 * Math.PI * f1x * 0.5 * time);
        return compClipped + compRattle + noise * 1.8;

      default:
        return Math.sin(2 * Math.PI * f1x * time) + noise;
    }
  };

  // Render Oscilloscope
  useEffect(() => {
    const canvas = scopeCanvasRef.current;
    if (!canvas || activeTab !== 'scope') return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Draw background
    ctx.fillStyle = isLight ? '#f8fafc' : '#020617';
    ctx.fillRect(0, 0, width, height);

    // Draw Grid
    ctx.strokeStyle = isLight ? 'rgba(148, 163, 184, 0.25)' : 'rgba(30, 41, 59, 0.7)';
    ctx.lineWidth = 1;
    const gridCols = 10;
    const gridRows = 6;
    for (let i = 1; i < gridCols; i++) {
      const x = (width / gridCols) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0); ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let i = 1; i < gridRows; i++) {
      const y = (height / gridRows) * i;
      ctx.beginPath();
      ctx.moveTo(0, y); ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Centered axis
    ctx.strokeStyle = isLight ? '#94a3b8' : '#475569';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, height / 2); ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Plot Waveform A (Sensor A) - Green
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let x = 0; x < width; x++) {
      const time = (x / width) * 0.1; // 100 ms full scale
      const yVal = getSignals(time, sensorA);
      // Map -5 to +5 range to canvas height
      const y = height / 2 - (yVal / 5) * (height / 2);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Plot Waveform B (Sensor B) - Purple/Magenta
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x < width; x++) {
      const time = (x / width) * 0.1;
      const yVal = getSignals(time, sensorB);
      const y = height / 2 - (yVal / 5) * (height / 2);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Trigger info overlay
    ctx.fillStyle = isLight ? '#475569' : '#94a3b8';
    ctx.font = '10px monospace';
    ctx.fillText(`Voie A (Vert): ${sensorA} (RMS ~ ${(sensorA === '2RH' ? 1.5 : 1.2).toFixed(2)} mm/s)`, 10, 20);
    ctx.fillText(`Voie B (Violet): ${sensorB} (RMS ~ ${(sensorB === '2RV' ? 1.2 : 0.9).toFixed(2)} mm/s)`, 10, 35);
    ctx.fillText('Base de temps : 10 ms/div | Amplitude : 1.0 V/div', 10, height - 10);
  }, [currentScenario, rpm, sensorA, sensorB, activeTab, theme]);

  // Render FFT Spectrum
  useEffect(() => {
    const canvas = fftCanvasRef.current;
    if (!canvas || activeTab !== 'fft') return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = isLight ? '#f8fafc' : '#020617';
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = isLight ? 'rgba(148, 163, 184, 0.25)' : 'rgba(30, 41, 59, 0.7)';
    ctx.lineWidth = 1;
    const gridDivs = 10;
    for (let i = 1; i < gridDivs; i++) {
      const x = (width / gridDivs) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0); ctx.lineTo(x, height);
      ctx.stroke();
      const y = (height / gridDivs) * i;
      ctx.beginPath();
      ctx.moveTo(0, y); ctx.lineTo(width, y);
      ctx.stroke();
    }

    const f1x = rpm / 60; // 1x frequency
    let maxFreq = 200; // default max frequency plotted in Hz
    
    // Scale up frequency axis for specific defects that have high-frequency content
    if (currentScenario.id === 'gear_defect') {
      maxFreq = 1000; // GMF is around 21x
    } else if (currentScenario.id === 'misalignment_and_looseness') {
      maxFreq = 400; // Looseness has harmonics up to 10x
    }

    // Compile spectral line parameters
    interface Peak { freq: number; amp: number; noiseLevel?: number }
    let peaks: Peak[] = [];

    // Add baseline noise spectrum
    const noiseFloor = 0.05;

    switch (currentScenario.id) {
      case 'unbalance':
        const unbAmp = 3.2 * (rpm / 1500) ** 2;
        peaks.push({ freq: f1x, amp: unbAmp });
        break;

      case 'misalignment':
        peaks.push({ freq: f1x, amp: 1.8 });
        peaks.push({ freq: 2 * f1x, amp: 2.5 });
        peaks.push({ freq: 3 * f1x, amp: 0.6 });
        break;

      case 'looseness':
        // harmonic series
        for (let h = 1; h <= 8; h++) {
          peaks.push({ freq: h * f1x, amp: 2.2 / h });
        }
        // sub harmonics
        for (let h = 1; h <= 5; h++) {
          peaks.push({ freq: (h - 0.5) * f1x, amp: 0.65 / h });
        }
        break;

      case 'resonance':
        const dist = Math.abs(rpm - 1800);
        const resAmp = 0.4 + 5.5 / (1 + (dist / 80) ** 2);
        peaks.push({ freq: f1x, amp: resAmp });
        break;

      case 'bearing':
        peaks.push({ freq: f1x, amp: 0.4 });
        // High frequency BPFO peaks
        const bpfo = 3.12 * f1x;
        peaks.push({ freq: bpfo, amp: 1.6 });
        peaks.push({ freq: bpfo - f1x, amp: 0.55 });
        peaks.push({ freq: bpfo + f1x, amp: 0.55 });
        peaks.push({ freq: 2 * bpfo, amp: 0.8 });
        peaks.push({ freq: 2 * bpfo - f1x, amp: 0.3 });
        peaks.push({ freq: 2 * bpfo + f1x, amp: 0.3 });
        break;

      case 'bent_shaft':
        // High 1X axial, but overall spectrum shows dominant 1X and smaller 2X
        peaks.push({ freq: f1x, amp: 3.2 });
        peaks.push({ freq: 2 * f1x, amp: 1.2 });
        peaks.push({ freq: 3 * f1x, amp: 0.3 });
        break;

      case 'cavitation':
        // No discrete peaks, cavitation is broadband random.
        // It will be drawn via the dynamic raised floor hump in the loop below.
        peaks.push({ freq: f1x, amp: 0.35 });
        break;

      case 'gear_defect':
        // Peak at GMF (21 * f1x) and its 1x sidebands
        const gmfFreq = 21 * f1x;
        peaks.push({ freq: f1x, amp: 0.45 });
        peaks.push({ freq: gmfFreq, amp: 2.5 });
        peaks.push({ freq: gmfFreq - f1x, amp: 0.9 });
        peaks.push({ freq: gmfFreq + f1x, amp: 0.9 });
        peaks.push({ freq: gmfFreq - 2 * f1x, amp: 0.45 });
        peaks.push({ freq: gmfFreq + 2 * f1x, amp: 0.45 });
        break;

      case 'belt_slippage':
        const beltF = 0.38 * f1x;
        peaks.push({ freq: beltF, amp: 1.6 });
        peaks.push({ freq: 2 * beltF, amp: 1.0 });
        peaks.push({ freq: 3 * beltF, amp: 0.5 });
        peaks.push({ freq: f1x, amp: 0.3 });
        break;

      case 'eccentric_rotor':
        // 1x with fine sidebands
        peaks.push({ freq: f1x, amp: 2.5 });
        peaks.push({ freq: f1x - 12, amp: 0.5 });
        peaks.push({ freq: f1x + 12, amp: 0.5 });
        break;

      case 'unbalance_and_bearing':
        // Giant 1x unbalance + BPFO bearing
        peaks.push({ freq: f1x, amp: 2.8 });
        const combBpfo = 3.12 * f1x;
        peaks.push({ freq: combBpfo, amp: 1.4 });
        peaks.push({ freq: combBpfo - f1x, amp: 0.45 });
        peaks.push({ freq: combBpfo + f1x, amp: 0.45 });
        peaks.push({ freq: 2 * combBpfo, amp: 0.7 });
        break;

      case 'misalignment_and_looseness':
        // 1x, 2x, 3x misalignment + looseness harmonics/demi-harmonics
        peaks.push({ freq: f1x, amp: 1.5 });
        peaks.push({ freq: 2 * f1x, amp: 2.1 });
        peaks.push({ freq: 3 * f1x, amp: 0.7 });
        for (let h = 4; h <= 7; h++) {
          peaks.push({ freq: h * f1x, amp: 1.3 / h });
        }
        for (let h = 1; h <= 4; h++) {
          peaks.push({ freq: (h - 0.5) * f1x, amp: 0.55 / h });
        }
        break;
    }

    // Draw Spectrum lines
    ctx.strokeStyle = '#0284c7'; // Blue FFT trace
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, height);

    for (let x = 0; x < width; x++) {
      const f = (x / width) * maxFreq;
      // Synthesize noise floor plus peaks
      let ampAtF = noiseFloor + Math.abs(Math.sin(f * 20 + timeNoise)) * 0.04;

      // Special raised hump for cavitation
      if (currentScenario.id === 'cavitation') {
        const hump = 1.8 * Math.exp(-(((f - 130) / 45) ** 2));
        const extraNoise = (Math.sin(f * 80) + Math.cos(f * 150)) * 0.15;
        ampAtF += hump + Math.abs(extraNoise) + 0.35;
      }

      // Add peaks as gaussian curves
      peaks.forEach(p => {
        const spread = 0.8;
        const val = p.amp * Math.exp(-(((f - p.freq) / spread) ** 2));
        ampAtF += val;
      });

      const sy = height - (ampAtF / 6.0) * height; // normalized to 6.0 max amp
      ctx.lineTo(x, sy);
    }
    ctx.stroke();

    // Mark 1X cursor
    const cx1x = (f1x / maxFreq) * width;
    if (cx1x < width) {
      ctx.strokeStyle = '#ef4444';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(cx1x, 0); ctx.lineTo(cx1x, height);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#ef4444';
      ctx.font = '9px sans-serif';
      ctx.fillText(`1X (${f1x.toFixed(1)} Hz)`, cx1x + 4, 15);
    }

    // Axis labels
    ctx.fillStyle = isLight ? '#475569' : '#94a3b8';
    ctx.font = '10px monospace';
    ctx.fillText('Amplitude (mm/s RMS)', 10, 20);
    ctx.fillText(`Fréquence (Hz) | Max: ${maxFreq} Hz`, width - 160, height - 10);
  }, [currentScenario, rpm, activeTab, theme]);

  // Orbit / Polar Relevé de phase
  useEffect(() => {
    const canvas = orbitCanvasRef.current;
    if (!canvas || activeTab !== 'orbit') return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = isLight ? '#f8fafc' : '#020617';
    ctx.fillRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) * 0.4;

    // Concentric grid circles
    ctx.strokeStyle = isLight ? '#cbd5e1' : '#1e293b';
    ctx.lineWidth = 1;
    [0.5, 1.0].forEach(r => {
      ctx.beginPath();
      ctx.arc(cx, cy, radius * r, 0, 2 * Math.PI);
      ctx.stroke();
    });

    // Cross axes
    ctx.beginPath();
    ctx.moveTo(cx - radius, cy); ctx.lineTo(cx + radius, cy);
    ctx.moveTo(cx, cy - radius); ctx.lineTo(cx, cy + radius);
    ctx.stroke();

    // Degrees label
    ctx.fillStyle = isLight ? '#64748b' : '#475569';
    ctx.font = 'bold 8px monospace';
    ctx.fillText('0° (Ref)', cx + radius + 3, cy + 3);
    ctx.fillText('90°', cx - 8, cy - radius - 5);
    ctx.fillText('180°', cx - radius - 24, cy + 3);
    ctx.fillText('270°', cx - 8, cy + radius + 11);

    // Calculate phase difference V vs H
    let phaseDiff = 90; // default for unbalance
    let refAmp = 2.0;
    let compAmp = 2.0;

    switch (currentScenario.id) {
      case 'unbalance':
        phaseDiff = 90;
        refAmp = 2.5;
        compAmp = 2.5;
        break;
      case 'misalignment':
        phaseDiff = 180;
        refAmp = 1.8;
        compAmp = 1.8;
        break;
      case 'looseness':
        // random jittering phase
        phaseDiff = 45 + Math.sin(Date.now() / 300) * 35;
        refAmp = 1.6;
        compAmp = 1.2;
        break;
      case 'resonance':
        // Phase shifts with RPM
        const dist = Math.abs(rpm - 1800);
        const shiftDeg = 180 / (1 + Math.exp(-(rpm - 1800) / 40));
        phaseDiff = 90 + shiftDeg;
        const peakGain = 5 / (1 + (dist / 80) ** 2);
        refAmp = 0.5 + peakGain;
        compAmp = 0.4 + peakGain;
        break;
      case 'bearing':
        phaseDiff = 120;
        refAmp = 0.8;
        compAmp = 0.7;
        break;
      case 'bent_shaft':
        // Axial phase shifts 180 deg
        const usesAxial = sensorA === '2A' || sensorB === '2A';
        phaseDiff = usesAxial ? 180 : 90;
        refAmp = usesAxial ? 3.0 : 1.2;
        compAmp = usesAxial ? 3.0 : 1.2;
        break;
      case 'cavitation':
        // Completely chaotic drifting phase due to broadband fluid turbulence
        phaseDiff = (Date.now() / 12) % 360;
        refAmp = 1.2 + Math.abs(Math.sin(Date.now() / 800)) * 0.8;
        compAmp = 1.2 + Math.abs(Math.cos(Date.now() / 800)) * 0.8;
        break;
      case 'gear_defect':
        phaseDiff = 70;
        refAmp = 1.5;
        compAmp = 1.3;
        break;
      case 'belt_slippage':
        phaseDiff = 115;
        refAmp = 1.4;
        compAmp = 1.0;
        break;
      case 'eccentric_rotor':
        // Unidirectional radial attraction: H & V are almost in phase (0 to 15 deg)
        phaseDiff = 12;
        refAmp = 2.3;
        compAmp = 2.1;
        break;
      case 'unbalance_and_bearing':
        phaseDiff = 90; // dominated by 1x unbalance
        refAmp = 2.6;
        compAmp = 2.4;
        break;
      case 'misalignment_and_looseness':
        // Combined 180 deg from alignment + jitter from looseness
        phaseDiff = 180 + Math.sin(Date.now() / 250) * 25;
        refAmp = 2.0;
        compAmp = 1.6;
        break;
    }

    // Plot reference vector (Green, at 0°)
    const lenRef = radius * (refAmp / 5);
    const rx = cx + lenRef * Math.cos(0);
    const ry = cy - lenRef * Math.sin(0);

    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(rx, ry); ctx.stroke();
    ctx.fillStyle = '#10b981';
    ctx.beginPath(); ctx.arc(rx, ry, 5, 0, 2 * Math.PI); ctx.fill();

    // Plot comparative vector (Purple, at phaseDiff)
    const radComp = (phaseDiff * Math.PI) / 180;
    const lenComp = radius * (compAmp / 5);
    const cx_v = cx + lenComp * Math.cos(radComp);
    const cy_v = cy - lenComp * Math.sin(radComp);

    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx_v, cy_v); ctx.stroke();
    ctx.fillStyle = '#a855f7';
    ctx.beginPath(); ctx.arc(cx_v, cy_v, 5, 0, 2 * Math.PI); ctx.fill();

    // Draw central dot
    ctx.fillStyle = isLight ? '#0f172a' : '#ffffff';
    ctx.beginPath(); ctx.arc(cx, cy, 4, 0, 2 * Math.PI); ctx.fill();

    // Text box info
    ctx.fillStyle = isLight ? '#1e293b' : '#f1f5f9';
    ctx.font = '11px monospace';
    ctx.fillText(`Déphasage mesuré : ${phaseDiff.toFixed(0)}°`, 10, 20);
    ctx.fillText(`Axe Voie A (Vert) : Référence 0°`, 10, 35);
    ctx.fillText(`Axe Voie B (Violet) : Déphasé de ${phaseDiff.toFixed(0)}°`, 10, 50);

  }, [currentScenario, rpm, activeTab, theme]);

  // Dummy animation variable to make noise shift
  const [timeNoise, setTimeNoise] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeNoise(prev => prev + 0.1);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`space-y-6 ${isLight ? 'text-slate-800' : 'text-slate-100'}`} id="mystery_challenge_root">
      {/* Upper Score Card & Header */}
      <div className={`p-6 rounded-2xl border transition-all shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800'
      }`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-yellow-500" />
            <h2 className="text-xl font-extrabold tracking-tight">Défi de Diagnostic : Machine Mystère</h2>
          </div>
          <p className={`text-xs ${isLight ? "text-slate-600" : "text-slate-400"}`}>
            Une anomalie machine est active en arrière-plan. Inspectez les trois écrans de mesure, déterminez le défaut et soumettez votre rapport.
          </p>
        </div>

        {/* Score display */}
        <div className={`flex items-center gap-4 ${isLight ? "bg-slate-50" : "bg-slate-950/40"} p-3.5 rounded-xl border border-slate-700/50`}>
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-400" />
            <div className="flex flex-col">
              <span className={`text-[10px] ${isLight ? "text-slate-600" : "text-slate-400"} font-mono uppercase tracking-wider`}>Score Global</span>
              <span className="text-lg font-bold font-mono text-yellow-400">{score} / {totalAttempts}</span>
            </div>
          </div>
          <button
            onClick={initNewMysteryMachine}
            className="flex items-center gap-1 text-[11px] font-bold bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Nouvelle Machine
          </button>
        </div>
      </div>

      {/* Interactive Workspace Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Analyzer Instruments (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className={`p-4 rounded-xl border ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900/40 border-slate-800'
          }`}>
            {/* Instrument Selection Tabs */}
            <div className={`flex border-b ${isLight ? "border-slate-300" : "border-slate-800"} pb-2 mb-4 justify-between items-center`}>
              <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? "text-slate-600" : "text-slate-400"} flex items-center gap-1.5`}>
                <Activity className="w-4 h-4 text-blue-500" />
                Appareil d'Analyse Vibratoire
              </span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setActiveTab('scope')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                    activeTab === 'scope' ? 'bg-blue-600 text-white' : isLight ? 'text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200' : 'text-slate-400 hover:text-white bg-slate-800/30 hover:bg-slate-800/60'
                  }`}
                >
                  Oscilloscope
                </button>
                <button
                  onClick={() => setActiveTab('fft')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                    activeTab === 'fft' ? 'bg-blue-600 text-white' : isLight ? 'text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200' : 'text-slate-400 hover:text-white bg-slate-800/30 hover:bg-slate-800/60'
                  }`}
                >
                  Spectre FFT
                </button>
                <button
                  onClick={() => setActiveTab('orbit')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                    activeTab === 'orbit' ? 'bg-blue-600 text-white' : isLight ? 'text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200' : 'text-slate-400 hover:text-white bg-slate-800/30 hover:bg-slate-800/60'
                  }`}
                >
                  Diagramme de Phase
                </button>
              </div>
            </div>

            {/* Instrument Displays */}
            <div className={`relative border rounded-xl overflow-hidden flex items-center justify-center ${isLight ? 'bg-white border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
              {activeTab === 'scope' && (
                <canvas ref={scopeCanvasRef} width="600" height="400" className="w-full h-auto aspect-[3/2]" />
              )}
              {activeTab === 'fft' && (
                <canvas ref={fftCanvasRef} width="600" height="400" className="w-full h-auto aspect-[3/2]" />
              )}
              {activeTab === 'orbit' && (
                <canvas ref={orbitCanvasRef} width="600" height="400" className="w-full h-auto aspect-[3/2]" />
              )}
            </div>

            {/* Active Machine Controls */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-800/60 pt-4 text-xs">
              <div>
                <label className={`block ${isLight ? "text-slate-600" : "text-slate-400"} font-bold mb-1.5`}>Vitesse de Rotation (RPM)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="1000"
                    max="2200"
                    step="50"
                    value={rpm}
                    onChange={(e) => setRpm(Number(e.target.value))}
                    disabled={hasSubmitted && currentScenario.id === 'resonance'} // fix speed if submitted to analyze resonance
                    className={`w-full h-1.5 ${isLight ? "bg-slate-200" : "bg-slate-800"} rounded-lg appearance-none cursor-pointer accent-blue-500`}
                  />
                  <span className="font-mono font-bold whitespace-nowrap">{rpm} RPM</span>
                </div>
                <span className={`text-[10px] ${isLight ? "text-slate-600" : "text-slate-400"} mt-1 block`}>Varier la vitesse pour voir l'effet sur l'amplitude et la phase.</span>
              </div>

              <div>
                <label className={`block font-bold mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Capteur Voie A (Vert)</label>
                <select
                  value={sensorA}
                  onChange={(e) => setSensorA(e.target.value)}
                  className={`w-full border rounded-md p-1.5 text-xs font-semibold focus:outline-none focus:border-blue-500 ${isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-950 border-slate-800 text-slate-300'}`}
                >
                  <option value="2RH">Palier 2 (Moteur DE) - Horiz</option>
                  <option value="2RV">Palier 2 (Moteur DE) - Vert</option>
                  <option value="2A">Palier 2 (Moteur DE) - Axial</option>
                </select>
              </div>

              <div>
                <label className={`block font-bold mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Capteur Voie B (Violet)</label>
                <select
                  value={sensorB}
                  onChange={(e) => setSensorB(e.target.value)}
                  className={`w-full border rounded-md p-1.5 text-xs font-semibold focus:outline-none focus:border-blue-500 ${isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-950 border-slate-800 text-slate-300'}`}
                >
                  <option value="2RV">Palier 2 (Moteur DE) - Vert</option>
                  <option value="2RH">Palier 2 (Moteur DE) - Horiz</option>
                  <option value="2A">Palier 2 (Moteur DE) - Axial</option>
                </select>
              </div>
            </div>
          </div>

          {/* Dynamic clues system */}
          <div className={`p-4 rounded-xl border ${
            isLight ? 'bg-yellow-50/50 border-yellow-200' : 'bg-yellow-500/5 border-yellow-500/20'
          }`}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-yellow-500 flex items-center gap-1">
                <HelpCircle className="w-4 h-4" /> Indices Disponibles
              </span>
              {showClueCount < currentScenario.clues.length && (
                <button
                  onClick={() => setShowClueCount(prev => prev + 1)}
                  className="text-[10px] bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 font-bold px-2 py-1 rounded border border-yellow-500/30 transition-colors cursor-pointer"
                >
                  Révéler un indice ({showClueCount}/{currentScenario.clues.length})
                </button>
              )}
            </div>

            {showClueCount === 0 ? (
              <p className={`text-xs ${isLight ? "text-slate-600" : "text-slate-400"} italic`}>
                Aucun indice révélé. Utilisez vos instruments ou cliquez sur le bouton pour obtenir une piste diagnostique.
              </p>
            ) : (
              <ul className={`text-xs space-y-1.5 ${isLight ? "text-slate-700" : "text-slate-300"} list-disc list-inside`}>
                {currentScenario.clues.slice(0, showClueCount).map((clue, idx) => (
                  <li key={idx} className="text-yellow-600/90 dark:text-yellow-400/90 leading-relaxed">
                    {clue}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Right Side: Diagnostic Submission Panel (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className={`p-5 rounded-xl border h-full flex flex-col ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900/40 border-slate-800'
          }`}>
            <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? "text-slate-600" : "text-slate-400"} block mb-4 border-b ${isLight ? "border-slate-300" : "border-slate-800"} pb-2`}>
              Formulaire de Diagnostic
            </span>

            {/* Defect Choice Cards */}
            <div className="flex-1 flex flex-col min-h-0">
              <label className={`block text-xs ${isLight ? "text-slate-600" : "text-slate-400"} font-bold mb-2`}>Choisissez l'anomalie correspondante :</label>
              <div className="space-y-2 overflow-y-auto pr-1 flex-1 max-h-[480px] scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                {SCENARIOS.map(s => {
                  const isSelected = selectedGuess === s.id;
                  
                  // Level Categorization Badge
                  let levelBadge = { text: 'Fondamental', class: 'bg-blue-500/10 text-blue-450 dark:text-blue-400 border-blue-500/20' };
                  if (['looseness', 'bearing', 'gear_defect', 'belt_slippage', 'eccentric_rotor'].includes(s.id)) {
                    levelBadge = { text: 'Avancé', class: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' };
                  } else if (['cavitation', 'unbalance_and_bearing', 'misalignment_and_looseness'].includes(s.id)) {
                    levelBadge = { text: 'Expert', class: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' };
                  }

                  return (
                    <button
                      key={s.id}
                      onClick={() => !hasSubmitted && setSelectedGuess(s.id)}
                      disabled={hasSubmitted}
                      className={`w-full text-left p-3.5 rounded-xl border text-xs transition-all duration-200 flex items-center justify-between cursor-pointer ${
                        hasSubmitted
                          ? s.id === currentScenario.id
                            ? 'bg-green-500/10 border-green-500 text-green-600 dark:text-green-400 font-bold'
                            : s.id === selectedGuess
                              ? 'bg-red-500/10 border-red-500 text-red-600 dark:text-red-400 font-bold'
                              : isLight ? 'bg-slate-50 border-slate-200 text-slate-400' : 'bg-slate-950/20 border-slate-850 text-slate-500'
                          : isSelected
                            ? 'bg-blue-600/10 border-blue-500 text-blue-700 dark:text-blue-400 font-extrabold shadow-md'
                            : isLight ? 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50' : 'bg-slate-950/40 border-slate-800/80 text-slate-600 dark:text-slate-300 hover:border-slate-700 hover:bg-slate-950/60'
                      }`}
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold">{s.frenchLabel}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-semibold ${levelBadge.class}`}>
                            {levelBadge.text}
                          </span>
                        </div>
                        <span className={`text-[10px] font-mono font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{s.name}</span>
                      </div>
                      {hasSubmitted && s.id === currentScenario.id && (
                        <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                      )}
                      {hasSubmitted && s.id === selectedGuess && s.id !== currentScenario.id && (
                        <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                      )}
                      {!hasSubmitted && isSelected && (
                        <ChevronRight className="w-4 h-4 text-blue-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submission Status & Validation */}
            <div className="mt-6 pt-4 border-t border-slate-800/80 space-y-4">
              {!hasSubmitted ? (
                <button
                  onClick={handleDiagnose}
                  disabled={!selectedGuess}
                  className={`w-full py-3 rounded-xl font-bold uppercase tracking-wider text-xs transition-all flex items-center justify-center gap-2 ${
                    selectedGuess 
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg cursor-pointer hover:shadow-indigo-900/20 hover:scale-[1.01]' 
                      : '${isLight ? "bg-slate-200" : "bg-slate-800"} text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Compass className="w-4 h-4" /> Soumettre mon Diagnostic
                </button>
              ) : (
                <div className="space-y-4 animate-fade-in">
                  <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                    isCorrect ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'
                  }`}>
                    {isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <span className={`text-xs font-bold ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                        {isCorrect ? 'Diagnostic Correct !' : 'Diagnostic Incorrect'}
                      </span>
                      <p className={`text-xs ${isLight ? "text-slate-700" : "text-slate-300"} leading-relaxed`}>{feedback}</p>
                    </div>
                  </div>

                  {/* Scientific correction box */}
                  <div className={`p-4 rounded-xl border space-y-2.5 ${isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-950 border-slate-850 text-slate-300'}`}>
                    <span className="text-[10px] font-bold text-blue-500 dark:text-blue-400 uppercase tracking-widest block font-mono">
                      Fiche d'Analyse d'Expert
                    </span>
                    <p className="text-xs leading-relaxed font-medium">
                      <strong>Phénomène :</strong> {currentScenario.description}
                    </p>
                    <div className={`text-[11px] space-y-1.5 border-t pt-2 ${isLight ? 'border-slate-200 text-slate-600' : 'border-slate-800 text-slate-400'}`}>
                      <p>⬢ <strong>Spectre FFT :</strong> {currentScenario.signatureFFT}</p>
                      <p>⬢ <strong>Forme temp. :</strong> {currentScenario.signatureWave}</p>
                      <p>⬢ <strong>Phase relative :</strong> {currentScenario.signaturePhase}</p>
                    </div>
                  </div>

                  <button
                    onClick={initNewMysteryMachine}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Tester la machine suivante
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
