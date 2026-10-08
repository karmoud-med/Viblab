import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { 
  Compass, 
  Activity, 
  RotateCw, 
  Play, 
  Pause, 
  RotateCcw, 
  Layers, 
  Sliders, 
  Eye, 
  EyeOff, 
  Radio, 
  Maximize2, 
  Minimize2, 
  Info, 
  CheckCircle2, 
  HelpCircle,
  Zap,
  Target,
  AlertTriangle,
  Flame,
  ArrowRight,
  TrendingUp,
  Volume2
} from 'lucide-react';

interface PhaseAnalysisModuleProps {
  theme: 'dark' | 'light' | 'mono';
}

// -------------------------------------------------------------
// SENSORS SPECIFICATIONS
// -------------------------------------------------------------
export interface SensorDef {
  id: string;
  b: number; // Bearing 1, 2, 3, 4
  d: 'V' | 'H' | 'A'; // Vertical, Horizontal, Axial
  label: string;
  pos: [number, number, number];
  norm: [number, number, number];
  parentName: 'motor' | 'ped3' | 'ped4';
}

const SENSORS: SensorDef[] = [
  { id: '1RV', b: 1, d: 'V', label: 'Palier 1 (Moteur NDE) - Vertical', pos: [-1.3, 0.68 + 0.245, 0], norm: [0, 1, 0], parentName: 'motor' },
  { id: '1RH', b: 1, d: 'H', label: 'Palier 1 (Moteur NDE) - Horizontal', pos: [-1.3, 0.68, 0.245], norm: [0, 0, 1], parentName: 'motor' },
  { id: '1A',  b: 1, d: 'A', label: 'Palier 1 (Moteur NDE) - Axial', pos: [-1.5, 0.68 + 0.13, 0], norm: [-1, 0, 0], parentName: 'motor' },
  { id: '2RV', b: 2, d: 'V', label: 'Palier 2 (Moteur DE) - Vertical', pos: [-0.42, 0.68 + 0.245, 0], norm: [0, 1, 0], parentName: 'motor' },
  { id: '2RH', b: 2, d: 'H', label: 'Palier 2 (Moteur DE) - Horizontal', pos: [-0.42, 0.68, 0.245], norm: [0, 0, 1], parentName: 'motor' },
  { id: '2A',  b: 2, d: 'A', label: 'Palier 2 (Moteur DE) - Axial', pos: [-0.34, 0.68 + 0.17, 0], norm: [1, 0, 0], parentName: 'motor' },
  { id: '3RV', b: 3, d: 'V', label: 'Palier 3 (Machine DE) - Vertical', pos: [0.35, 0.68 + 0.13, 0], norm: [0, 1, 0], parentName: 'ped3' },
  { id: '3RH', b: 3, d: 'H', label: 'Palier 3 (Machine DE) - Horizontal', pos: [0.35, 0.68, 0.13], norm: [0, 0, 1], parentName: 'ped3' },
  { id: '3A',  b: 3, d: 'A', label: 'Palier 3 (Machine DE) - Axial', pos: [0.26, 0.68 + 0.08, 0.04], norm: [-1, 0, 0], parentName: 'ped3' },
  { id: '4RV', b: 4, d: 'V', label: 'Palier 4 (Machine NDE) - Vertical', pos: [1.45, 0.68 + 0.13, 0], norm: [0, 1, 0], parentName: 'ped4' },
  { id: '4RH', b: 4, d: 'H', label: 'Palier 4 (Machine NDE) - Horizontal', pos: [1.45, 0.68, 0.13], norm: [0, 0, 1], parentName: 'ped4' },
  { id: '4A',  b: 4, d: 'A', label: 'Palier 4 (Machine NDE) - Axial', pos: [1.54, 0.68 + 0.08, 0.04], norm: [1, 0, 0], parentName: 'ped4' },
];

const byId = Object.fromEntries(SENSORS.map((s) => [s.id, s]));
const wrap = (x: number) => ((x % 360) + 360) % 360;

// -------------------------------------------------------------
// VIBRATION FAULTS AND MATHEMATICAL PHASE MODEL
// -------------------------------------------------------------
export interface PhaseCalcResult {
  a: number;
  p: number;
  a2: number;
  p2: number;
}

const pick = (
  s: SensorDef, 
  pH: number, 
  r: { aH: number; aV: number; vOff: number; aA: number; pA?: number; a2?: number; shift2?: number }
): PhaseCalcResult => {
  const o = s.d === 'H' ? { a: r.aH, p: pH } : s.d === 'V' ? { a: r.aV, p: pH + r.vOff } : { a: r.aA, p: r.pA ?? pH };
  const a2 = (r.a2 || 0) * o.a;
  return { a: o.a, p: wrap(o.p), a2, p2: wrap(2 * o.p + (r.shift2 || 0)) };
};

const isMotorBearing = (b: number) => b <= 2;

export interface FaultConfig {
  key: string;
  name: string;
  title: string;
  defAngle: number;
  defA: string;
  defB: string;
  critical?: number;
  calc: (s: SensorDef, theta: number, rpm: number) => PhaseCalcResult;
  desc: string;
  method: string;
  find: string;
}

const FAULTS: FaultConfig[] = [
  {
    key: 'static',
    name: 'Balourd Statique',
    title: 'Balourd statique (heavy spot unilatéral)',
    defAngle: 45,
    defA: '2RH',
    defB: '2RV',
    calc: (s, t) => pick(s, t, { aH: isMotorBearing(s.b) ? 0.7 : 1, aV: isMotorBearing(s.b) ? 0.6 : 0.85, vOff: 90, aA: 0.1, pA: t }),
    desc: 'Défaut classique où la masse excentrée tire le rotor dans le même sens sur les deux paliers. Vibration dominante à 1x RPM, prédominance radiale.',
    method: 'Mesurez verticalement et horizontalement sur chaque palier. Comparez ensuite les phases horizontales entre le palier DE et NDE.',
    find: 'La phase radiale est identique entre les deux paliers (différence ≈ 0°). Sur un même palier, l\'horizontale et la verticale présentent un déphasage strict de 90° (±30°), témoignant d\'une force centrifuge tournante uniforme.'
  },
  {
    key: 'couple',
    name: 'Balourd Couple',
    title: 'Balourd de couple (dynamique 180°)',
    defAngle: 45,
    defA: '3RH',
    defB: '4RH',
    calc: (s, t) => pick(s, t + (s.b === 2 || s.b === 4 ? 180 : 0), { aH: 1, aV: 0.85, vOff: 90, aA: 0.15, pA: t }),
    desc: 'Deux masses égales placées à 180° sur deux plans distincts du rotor. Le rotor bascule autour de son centre : il n\'y a pas de translation globale mais un balancement dynamique.',
    method: 'Comparez la phase horizontale du palier DE et du palier NDE d\'un même rotor, puis répétez la mesure en vertical.',
    find: 'Déphasage de 180° entre les deux paliers du même rotor, dans la même direction (H/H et V/V). Sur chaque palier, H et V restent à 90°. Un équilibrage dynamique 2 plans est requis.'
  },
  {
    key: 'parallel',
    name: 'Désal. Parallèle',
    title: 'Désalignement parallèle (offset radial)',
    defAngle: 30,
    defA: '2RH',
    defB: '3RH',
    calc: (s, t) => pick(s, t + (isMotorBearing(s.b) ? 0 : 180), { aH: 0.9, aV: 0.7, vOff: 0, aA: 0.3, pA: t, a2: 0.9, shift2: 0 }),
    desc: 'Les axes du moteur et de la machine sont parallèles mais décalés. L\'accouplement impose une contrainte de cisaillement opposée de part et d\'autre. Forte composante à 1x et prédominance 2x RPM.',
    method: 'Mesurez en radial (H et V) de chaque côté de l\'accouplement : palier 2 (moteur DE) et palier 3 (machine DE).',
    find: 'Déphasage radial de 180° à travers l\'accouplement. Sur un même palier, H et V sont en phase ou à 180° (vibration directionnelle sans orbite circulaire). L\'axial est en phase.'
  },
  {
    key: 'angular',
    name: 'Désal. Angulaire',
    title: 'Désalignement angulaire (moment axial)',
    defAngle: 30,
    defA: '2A',
    defB: '3A',
    calc: (s, t) => pick(s, t, { aH: 0.45, aV: 0.4, vOff: 90, aA: 1.2, pA: t + (isMotorBearing(s.b) ? 0 : 180), a2: 0.4 }),
    desc: 'Les axes se croisent avec un angle au centre de l\'accouplement. Le moment de flexion génère une forte vibration axiale à 1x RPM (avec harmoniques 2x et 3x possibles).',
    method: 'Positionnez deux accéléromètres en axial de part et d\'autre de l\'accouplement (2A et 3A), orientés vers le centre de la machine.',
    find: 'Déphasage axial de 180° à travers l\'accouplement. L\'amplitude axiale dépasse souvent 50 % de la radiale. Les phases radiales restent cohérentes.'
  },
  {
    key: 'resonance',
    name: 'Résonance Structure',
    title: 'Résonance de structure (vitesse critique f₀ = 30 Hz / 1800 RPM)',
    defAngle: 0,
    defA: '3RH',
    defB: '3RV',
    critical: 1800,
    calc: (s, t, rpm) => {
      const r = rpm / 1800, z = 0.08;
      const amp = 1 / Math.sqrt((1 - r * r) ** 2 + (2 * z * r) ** 2);
      const lag = (Math.atan2(2 * z * r, 1 - r * r) * 180) / Math.PI;
      const res = !isMotorBearing(s.b);
      return pick(s, t, { aH: 0.5, aV: res ? Math.min(0.2 * amp, 2.5) : 0.45, vOff: res ? lag : 90, aA: 0.1, pA: t });
    },
    desc: 'La fréquence de rotation de l\'arbre coïncide exactement avec la fréquence propre f₀ = 30.0 Hz (1800 RPM) du support palier 3. L\'amplitude explose sous un facteur Q ≈ 6.25× et la phase pivote de 90° à la résonance.',
    method: 'Effectuez un balayage tachymétrique progressif (sweep) de 1000 à 2500 RPM. Notez l\'amplitude et l\'angle de phase à chaque palier pour tracer le diagramme de Bode / Nyquist.',
    find: 'À 1800 RPM (f = f₀ = 30 Hz), le déphasage est exactement de 90° par rapport à l\'excitation. En régime sous-critique (< 1700 RPM), la phase est proche de 0°. En régime super-critique (> 1900 RPM), elle atteint 180°.'
  },
  {
    key: 'softfoot',
    name: 'Pied Souple',
    title: 'Pied souple / boîteux (déformation carter)',
    defAngle: 20,
    defA: '2RH',
    defB: '2RV',
    calc: (s, t) => isMotorBearing(s.b)
      ? pick(s, t, { aH: 0.4, aV: 1.3, vOff: 0, aA: 0.1, pA: t, a2: 0.35 })
      : pick(s, t, { aH: 0.3, aV: 0.25, vOff: 90, aA: 0.05, pA: t }),
    desc: 'Un pied du moteur ne repose pas uniformément sur le châssis. Le serrage tord le carter : forte vibration verticale côté moteur, à 1x et 2x RPM (ou 2x f_ligne électrique).',
    method: 'Mesurez la phase verticale sur le pied suspect, puis sur le châssis immédiatement dessous. Desserrez le boulon pour confirmer la chute d\'amplitude.',
    find: 'Vibration directionnelle : H et V du palier moteur sont en phase (≈ 0°) au lieu de 90°. Déphasage d\'environ 180° entre le dessus de la patte et la semelle du châssis.'
  },
  {
    key: 'bent',
    name: 'Arbre Gauchi',
    title: 'Arbre gauchi / courbé (flèche permanente)',
    defAngle: 45,
    defA: '3A',
    defB: '4A',
    calc: (s, t) => pick(s, t, { aH: 0.8, aV: 0.7, vOff: 90, aA: isMotorBearing(s.b) ? 0.2 : 1.1, pA: t + (s.b === 4 ? 180 : 0), a2: 0.3 }),
    desc: 'L\'arbre de la machine présente une flèche mécanique permanente. Le spectre FFT ressemble à un balourd (1x prédominant) mais s\'accompagne d\'une forte composante axiale.',
    method: 'Mesurez en axial aux deux extrémités du rotor (3A et 4A). Utilisez des repères dans le même sens physique.',
    find: 'Déphasage axial net de 180° entre les deux paliers du même rotor. En radial, les signaux imitent un balourd. Seule la phase axiale différentielle permet de trancher avec certitude.'
  }
];

const signal = (r: PhaseCalcResult, psi: number) =>
  r.a * Math.cos(((psi - r.p) * Math.PI) / 180) + r.a2 * Math.cos(((2 * psi - r.p2) * Math.PI) / 180);

// -------------------------------------------------------------
// PROCEDURAL THREE.JS 3D EQUIPMENT BUILDER WITH DEFECT GRAPHICS
// -------------------------------------------------------------
function buildMachineModel(isLightMode: boolean) {
  const M = (name: string, color: number, rough = 0.55, metal = 0.25, emissive?: number) => {
    const m = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });
    if (emissive) {
      m.emissive = new THREE.Color(emissive);
      m.emissiveIntensity = 1.2;
    }
    m.name = name;
    return m;
  };

  const mat = {
    concrete: M('beton', isLightMode ? 0xe2e8f0 : 0x1e293b, 0.95, 0),
    skid: M('chassis_acier', isLightMode ? 0x94a3b8 : 0x334155, 0.5, 0.35),
    body: M('carter_gris', isLightMode ? 0x64748b : 0x475569, 0.45, 0.3),
    dark: M('rotor_fonte', isLightMode ? 0x334155 : 0x1e293b, 0.45, 0.3),
    steel: M('acier_arbre', isLightMode ? 0xcbd5e1 : 0x64748b, 0.25, 0.5),
    orange: M('accouplement', 0xf59e0b, 0.4, 0.25),
    purple: M('voie_B', 0x8b10ff, 0.35, 0.1),
    green: M('voie_A', 0x10b981, 0.35, 0.1),
    sensor: M('capteur', isLightMode ? 0x334155 : 0x64748b, 0.4, 0.3),
    cable: M('elastomere', 0x0f172a, 0.7, 0),
    laser: M('laser', 0xef4444, 0.4, 0.1, 0xef4444),
    mark: M('repere_reflechissant', 0xffffff, 0.2, 0.1, 0xffffff),
    forceArrow: M('vecteur_force', 0xf59e0b, 0.3, 0.2, 0xf59e0b),
  };

  const H = 0.68;
  const root = new THREE.Group();
  root.name = 'equipement_principal';

  const grp = (name: string, x: number, y: number, z: number, parent = root) => {
    const g = new THREE.Group();
    g.name = name;
    g.position.set(x, y, z);
    parent.add(g);
    return g;
  };

  const add = (name: string, geo: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number, parent = root) => {
    const o = new THREE.Mesh(geo, m);
    o.name = name;
    o.position.set(x, y, z);
    o.castShadow = true;
    o.receiveShadow = true;
    parent.add(o);
    return o;
  };

  const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
  const cylX = (r: number, len: number, seg = 48) => new THREE.CylinderGeometry(r, r, len, seg).rotateZ(Math.PI / 2);

  // Massif de fondation et Châssis métallique
  add('massif_beton', box(3.4, 0.2, 1.1), mat.concrete, 0.05, 0.1, 0);
  add('chassis', box(3.1, 0.12, 0.76), mat.skid, 0.05, 0.261, 0);

  // 1. Moteur Électrique Asynchrone
  const motor = grp('moteur', -0.85, H, 0);
  add('carcasse', cylX(0.27, 0.9, 64), mat.body, 0, 0, 0, motor);
  for (let i = 0; i < 9; i++) {
    add('ailette_' + i, cylX(0.295, 0.025, 48), mat.body, -0.37 + i * 0.09, 0, 0, motor);
  }
  add('flasque_NDE', cylX(0.24, 0.06), mat.dark, -0.48, 0, 0, motor);
  add('capot_ventilateur', cylX(0.25, 0.14), mat.body, -0.58, 0, 0, motor);
  add('flasque_DE', cylX(0.24, 0.06), mat.dark, 0.48, 0, 0, motor);
  add('boite_bornes', box(0.22, 0.12, 0.2), mat.body, 0, 0.33, 0, motor);
  
  // 4 Pattes moteur (avec celle en avant-droite loose/pied souple)
  for (const x of [-0.3, 0.3]) {
    for (const z of [-0.2, 0.2]) {
      add('patte', box(0.16, 0.15, 0.1), mat.body, x, -0.285, z, motor);
    }
  }

  // 3D Soft Foot Visual Wedge under front-right foot (x = 0.3, z = 0.2)
  const softFootShim = grp('pied_souple_cale', -0.85 + 0.3, 0.32, 0.2);
  const shimMesh = add('shim', box(0.17, 0.02, 0.11), new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xd97706,
    emissiveIntensity: 0.8
  }), 0, 0, 0, softFootShim);
  softFootShim.visible = false;

  // Arbre moteur tournant
  const motorSpin = grp('arbre_moteur_rot', 0, 0, 0, motor);
  add('arbre_moteur', cylX(0.035, 0.34), mat.steel, 0.66, 0, 0, motorSpin);
  add('moyeu_moteur', cylX(0.09, 0.08), mat.orange, 0.78, 0, 0, motorSpin);
  add('repere_tachy', box(0.03, 0.012, 0.012), mat.mark, 0.6, 0, 0.037, motorSpin);

  // 2. Machine Entraînée (Rotor + Roue)
  const rotor = grp('rotor_machine', 0.9, H, 0);
  const rotorSpin = grp('rotor_rot', 0, 0, 0, rotor);
  add('arbre_machine', cylX(0.04, 1.62), mat.steel, -0.05, 0, 0, rotorSpin);
  add('roue', cylX(0.42, 0.16, 96), mat.dark, 0, 0, 0, rotorSpin);
  add('moyeu_roue', cylX(0.12, 0.26), mat.body, 0, 0, 0, rotorSpin);
  add('moyeu_machine', cylX(0.09, 0.08), mat.orange, -0.83, 0, 0, rotorSpin);
  add('element_elastique', cylX(0.075, 0.03), mat.cable, -0.885, 0, 0, rotorSpin);

  // 3D Misalignment Stress Glow Ring at Coupling
  const couplingStressRing = add(
    'anneau_contrainte_accouplement',
    new THREE.TorusGeometry(0.12, 0.016, 16, 32),
    new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xef4444,
      emissiveIntensity: 1,
      transparent: true,
      opacity: 0.8
    }),
    -0.885, 0, 0,
    rotor
  );
  couplingStressRing.rotation.y = Math.PI / 2;
  couplingStressRing.visible = false;

  // Balourd physique réglable
  const unb = grp('balourd', 0, 0, 0, rotorSpin);
  add('masse_balourd', box(0.06, 0.07, 0.07), mat.purple, 0.11, 0.36, 0, unb);

  // 3D Centrifugal Force Vector Arrow (Rotating with unbalance mass)
  const unbArrowGroup = grp('vecteur_force_centrifuge', 0.11, 0.36, 0, unb);
  const arrowStem = add('fleche_tige', new THREE.CylinderGeometry(0.008, 0.008, 0.22, 12), mat.forceArrow, 0, 0.12, 0, unbArrowGroup);
  const arrowHead = add('fleche_pointe', new THREE.ConeGeometry(0.024, 0.06, 16), mat.forceArrow, 0, 0.24, 0, unbArrowGroup);
  unbArrowGroup.visible = false;

  // Paliers à chapeau (Pedestals)
  const pedestal = (name: string, x: number) => {
    const g = grp(name, x, 0, 0);
    add('semelle', box(0.3, 0.05, 0.42), mat.body, 0, 0.346, 0, g);
    add('support', box(0.18, H - 0.37, 0.24), mat.body, 0, (H + 0.37) / 2, 0, g);
    add('corps', cylX(0.13, 0.18), mat.body, 0, H, 0, g);
    add('couvercle', cylX(0.11, 0.2), mat.dark, 0, H, 0, g);
    return g;
  };
  const ped3 = pedestal('palier_3', 0.35);
  const ped4 = pedestal('palier_4', 1.45);

  // 3D Resonance Shockwave Wave Rings above Palier 3
  const resWaveGroup = grp('ondes_resonance_palier_3', 0.35, H + 0.15, 0);
  const ringGeo1 = new THREE.RingGeometry(0.18, 0.22, 36);
  const ringGeo2 = new THREE.RingGeometry(0.28, 0.32, 36);
  const ringGeo3 = new THREE.RingGeometry(0.38, 0.42, 36);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
  const rw1 = add('onde_1', ringGeo1, ringMat.clone(), 0, 0, 0, resWaveGroup); rw1.rotation.x = Math.PI / 2;
  const rw2 = add('onde_2', ringGeo2, ringMat.clone(), 0, 0.03, 0, resWaveGroup); rw2.rotation.x = Math.PI / 2;
  const rw3 = add('onde_3', ringGeo3, ringMat.clone(), 0, 0.06, 0, resWaveGroup); rw3.rotation.x = Math.PI / 2;
  resWaveGroup.visible = false;

  // 3. Tachymètre Laser avec visée
  const tach = grp('tachymetre', -0.25, 0, 0.42);
  add('mat_support', new THREE.CylinderGeometry(0.012, 0.012, H - 0.32, 16), mat.steel, 0, (H + 0.32) / 2, 0, tach);
  add('tete_laser', box(0.05, 0.05, 0.09), mat.sensor, 0, H, 0, tach);
  add('lentille', new THREE.CylinderGeometry(0.012, 0.012, 0.01, 16).rotateX(Math.PI / 2), mat.laser, 0, H, -0.05, tach);
  const beam = add('faisceau', new THREE.CylinderGeometry(0.003, 0.003, 0.33, 8).rotateX(Math.PI / 2), mat.laser, 0, H, -0.215, tach);

  // 4. Positionnement des 12 Capteurs Accéléromètres
  const sensorNodes: Record<string, { g: THREE.Group; body: THREE.Mesh }> = {};
  root.updateMatrixWorld(true);

  for (const s of SENSORS) {
    const parent = s.parentName === 'motor' ? motor : s.parentName === 'ped3' ? ped3 : ped4;
    const g = grp('capteur_' + s.id, s.pos[0], s.pos[1], s.pos[2]);
    g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(...s.norm));
    add('embase', new THREE.CylinderGeometry(0.022, 0.022, 0.012, 24), mat.steel, 0, 0.006, 0, g);
    const body = add('corps', new THREE.CylinderGeometry(0.018, 0.018, 0.055, 24), mat.sensor, 0, 0.04, 0, g) as THREE.Mesh;
    add('connecteur', new THREE.CylinderGeometry(0.009, 0.009, 0.02, 16), mat.steel, 0, 0.077, 0, g);
    g.updateMatrixWorld(true);
    parent.attach(g);
    sensorNodes[s.id] = { g, body };
  }

  return { 
    root, 
    H, 
    mat, 
    motor, 
    motorSpin, 
    rotor, 
    rotorSpin, 
    unb, 
    ped3, 
    ped4, 
    beam, 
    sensorNodes,
    unbArrowGroup,
    couplingStressRing,
    resWaveGroup,
    rw1,
    rw2,
    rw3,
    softFootShim,
    shimMesh
  };
}

// -------------------------------------------------------------
// MAIN COMPONENT
// -------------------------------------------------------------
export default function PhaseAnalysisModule({ theme }: PhaseAnalysisModuleProps) {
  const isLight = theme === 'light';

  // State
  const [selectedFault, setSelectedFault] = useState<FaultConfig>(FAULTS[0]);
  const [defectAngle, setDefectAngle] = useState<number>(45);
  const [rpm, setRpm] = useState<number>(1500);
  const [sensorA, setSensorA] = useState<string>('2RH');
  const [sensorB, setSensorB] = useState<string>('2RV');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isDeforming, setIsDeforming] = useState<boolean>(true);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [plotMode, setPlotMode] = useState<'polar' | 'orbit'>('polar');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // 2D Canvas Labels overlay state
  const [screenLabels, setScreenLabels] = useState<Record<string, { x: number; y: number; visible: boolean }>>({});
  const [resTagPos, setResTagPos] = useState<{ x: number; y: number; visible: boolean } | null>(null);

  // Refs
  const viewportRef = useRef<HTMLDivElement>(null);
  const scopeCanvasRef = useRef<HTMLCanvasElement>(null);
  const polarCanvasRef = useRef<HTMLCanvasElement>(null);

  // Three.js internal holders
  const threeRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    model: ReturnType<typeof buildMachineModel>;
    basePositions: { motor: THREE.Vector3; rotor: THREE.Vector3; p3: THREE.Vector3; p4: THREE.Vector3 };
  } | null>(null);

  const stateRef = useRef({
    selectedFault,
    defectAngle,
    rpm,
    sensorA,
    sensorB,
    isPlaying,
    isDeforming,
    showLabels,
    plotMode,
    psi: 0,
    isLight
  });

  useEffect(() => {
    stateRef.current = {
      selectedFault,
      defectAngle,
      rpm,
      sensorA,
      sensorB,
      isPlaying,
      isDeforming,
      showLabels,
      plotMode,
      psi: stateRef.current.psi,
      isLight
    };
  }, [selectedFault, defectAngle, rpm, sensorA, sensorB, isPlaying, isDeforming, showLabels, plotMode, isLight]);

  // Synchronize fault selection
  const handleSelectFault = (f: FaultConfig) => {
    setSelectedFault(f);
    setDefectAngle(f.defAngle);
    setSensorA(f.defA);
    setSensorB(f.defB);
  };

  // Delta Phi calculation
  const currentDeltaPhi = useMemo(() => {
    const sA = byId[sensorA];
    const sB = byId[sensorB];
    if (!sA || !sB) return 0;
    const a = selectedFault.calc(sA, defectAngle, rpm);
    const b = selectedFault.calc(sB, defectAngle, rpm);
    return Math.round(wrap(b.p - a.p));
  }, [selectedFault, defectAngle, rpm, sensorA, sensorB]);

  // Dynamic Resonance Calculations
  const resonanceMetrics = useMemo(() => {
    const f0 = 30.0; // Hz
    const rpm0 = 1800; // RPM
    const f = rpm / 60; // Hz
    const r = f / f0;
    const z = 0.08; // Amortissement 8%
    const amp = 1 / Math.sqrt((1 - r * r) ** 2 + (2 * z * r) ** 2);
    const lagDeg = (Math.atan2(2 * z * r, 1 - r * r) * 180) / Math.PI;
    const isAtResonance = Math.abs(rpm - rpm0) <= 80;
    const isNearResonance = Math.abs(rpm - rpm0) <= 160;

    return {
      f0,
      rpm0,
      f,
      r,
      amp,
      lagDeg,
      isAtResonance,
      isNearResonance
    };
  }, [rpm]);

  // -------------------------------------------------------------
  // INITIALIZE THREE.JS STAGE
  // -------------------------------------------------------------
  useEffect(() => {
    const container = viewportRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 460;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(isLight ? 0xf8fafc : 0x090d16);

    // Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    camera.position.set(2.8, 2.2, 3.4);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.target.set(0.1, 0.65, 0);
    controls.maxPolarAngle = Math.PI / 2 - 0.02; // Ne pas passer sous le sol
    controls.minDistance = 1.2;
    controls.maxDistance = 9;

    // Lighting Studio
    const hemiLight = new THREE.HemisphereLight(0xffffff, isLight ? 0x94a3b8 : 0x1e293b, 1.2);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
    dirLight.position.set(3.5, 6, 4.5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 15;
    dirLight.shadow.camera.left = -3;
    dirLight.shadow.camera.right = 3;
    dirLight.shadow.camera.top = 3;
    dirLight.shadow.camera.bottom = -3;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.5);
    fillLight.position.set(-3.5, 3, -3);
    scene.add(fillLight);

    // Floor Shadow Receiver
    const floorGeo = new THREE.PlaneGeometry(10, 10);
    const floorMat = new THREE.ShadowMaterial({ opacity: isLight ? 0.15 : 0.35 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    scene.add(floor);

    // Build Machine Model with visual defects
    const model = buildMachineModel(isLight);
    scene.add(model.root);

    const basePositions = {
      motor: model.motor.position.clone(),
      rotor: model.rotor.position.clone(),
      p3: model.ped3.position.clone(),
      p4: model.ped4.position.clone()
    };

    threeRef.current = {
      scene,
      camera,
      renderer,
      controls,
      model,
      basePositions
    };

    // Resize Observer
    const resizeObserver = new ResizeObserver(() => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(container);

    // Clean up
    return () => {
      resizeObserver.disconnect();
      renderer.dispose();
      controls.dispose();
      threeRef.current = null;
    };
  }, [isLight]);

  // -------------------------------------------------------------
  // ANIMATION & CANVAS RENDERING LOOP
  // -------------------------------------------------------------
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();
    const tempVec = new THREE.Vector3();

    const renderLoop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      const st = stateRef.current;
      const tObj = threeRef.current;

      if (st.isPlaying) {
        st.psi += dt * (st.rpm / 60) * 360 * 0.05;
      }
      const rad = (st.psi * Math.PI) / 180;

      if (tObj) {
        const { controls, renderer, scene, camera, model, basePositions } = tObj;

        // Update sensor colors based on active selection
        for (const s of SENSORS) {
          const node = model.sensorNodes[s.id];
          if (node) {
            const isA = s.id === st.sensorA;
            const isB = s.id === st.sensorB;
            node.body.material = isA ? model.mat.green : isB ? model.mat.purple : model.mat.sensor;
          }
        }

        // Rotate shafts and align unbalance mass
        model.motorSpin.rotation.x = rad;
        model.rotorSpin.rotation.x = rad;
        model.unb.rotation.x = (st.defectAngle * Math.PI) / 180;

        // Laser strobe pulse when passing reflector
        model.beam.visible = Math.cos(rad) > 0.96;

        // Visual defect toggles
        const isResonance = st.selectedFault.key === 'resonance';
        const isUnbalance = st.selectedFault.key === 'static' || st.selectedFault.key === 'couple';
        const isMisalignment = st.selectedFault.key === 'parallel' || st.selectedFault.key === 'angular';
        const isSoftFoot = st.selectedFault.key === 'softfoot';

        // 1. Unbalance centrifugal force arrow
        model.unbArrowGroup.visible = isUnbalance;

        // 2. Misalignment stress ring at coupling
        model.couplingStressRing.visible = isMisalignment;
        if (isMisalignment) {
          const stressPulse = (Math.sin(time * 0.008) + 1) / 2;
          (model.couplingStressRing.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.5 + 1.2 * stressPulse;
        }

        // 3. Soft foot gap indicator under motor foot
        model.softFootShim.visible = isSoftFoot;
        if (isSoftFoot) {
          const lift = Math.max(0, Math.sin(st.psi * (Math.PI / 180))) * 0.018;
          model.softFootShim.position.y = 0.32 + lift;
        }

        // 4. Resonance wave rings animation around Palier 3
        model.resWaveGroup.visible = isResonance;
        if (isResonance) {
          const r = st.rpm / 1800;
          const z = 0.08;
          const amp = 1 / Math.sqrt((1 - r * r) ** 2 + (2 * z * r) ** 2);
          const isNear = Math.abs(st.rpm - 1800) <= 150;
          const pulseSpeed = time * 0.008;

          const p1 = (Math.sin(pulseSpeed) + 1) / 2;
          const p2 = (Math.sin(pulseSpeed + 1.2) + 1) / 2;
          const p3 = (Math.sin(pulseSpeed + 2.4) + 1) / 2;

          const intensity = Math.min(amp / 6.25, 1);
          (model.rw1.material as THREE.MeshBasicMaterial).opacity = (0.2 + 0.7 * p1) * intensity;
          (model.rw2.material as THREE.MeshBasicMaterial).opacity = (0.15 + 0.6 * p2) * intensity;
          (model.rw3.material as THREE.MeshBasicMaterial).opacity = (0.1 + 0.5 * p3) * intensity;

          const ringColor = isNear ? 0xef4444 : 0xf59e0b;
          (model.rw1.material as THREE.MeshBasicMaterial).color.setHex(ringColor);
          (model.rw2.material as THREE.MeshBasicMaterial).color.setHex(ringColor);
          (model.rw3.material as THREE.MeshBasicMaterial).color.setHex(ringColor);
        }

        // Physical vibration deformation
        const calcSensor = (id: string) => st.selectedFault.calc(byId[id], st.defectAngle, st.rpm);
        const disp = (b: number) => {
          const g = (d: string) => signal(calcSensor(`${b}${d === 'A' ? 'A' : 'R' + d}`), st.psi);
          return new THREE.Vector3(g('A'), g('V'), g('H'));
        };

        const k = st.isDeforming ? (isResonance ? 0.022 : 0.015) : 0;
        const d1 = disp(1).multiplyScalar(k);
        const d2 = disp(2).multiplyScalar(k);
        const d3 = disp(3).multiplyScalar(k);
        const d4 = disp(4).multiplyScalar(k);

        model.motor.position.copy(basePositions.motor).add(tempVec.copy(d1).add(d2).multiplyScalar(0.5));
        model.motor.rotation.set(0, -(d2.z - d1.z) / 0.9, (d2.y - d1.y) / 0.9);

        model.rotor.position.copy(basePositions.rotor).add(tempVec.copy(d3).add(d4).multiplyScalar(0.5));
        model.rotor.rotation.set(0, -(d4.z - d3.z) / 1.1, (d4.y - d3.y) / 1.1);

        model.ped3.position.copy(basePositions.p3).add(d3);
        model.ped4.position.copy(basePositions.p4).add(d4);

        // Controls & render
        controls.update();
        renderer.render(scene, camera);

        // Project 3D sensor coordinates to 2D screen positions
        const w = renderer.domElement.clientWidth;
        const h = renderer.domElement.clientHeight;

        if (st.showLabels) {
          const newLabels: Record<string, { x: number; y: number; visible: boolean }> = {};
          for (const s of SENSORS) {
            const node = model.sensorNodes[s.id];
            if (node) {
              node.g.localToWorld(tempVec.set(0, 0.08, 0)).project(camera);
              newLabels[s.id] = {
                x: ((tempVec.x + 1) / 2) * w,
                y: ((1 - tempVec.y) / 2) * h,
                visible: tempVec.z < 1
              };
            }
          }
          setScreenLabels(newLabels);
        }

        // Project Palier 3 position for floating Resonance Badge
        if (isResonance) {
          tempVec.set(0.35, 0.68 + 0.38, 0).project(camera);
          setResTagPos({
            x: ((tempVec.x + 1) / 2) * w,
            y: ((1 - tempVec.y) / 2) * h,
            visible: tempVec.z < 1
          });
        } else {
          setResTagPos(null);
        }
      }

      // Draw Scope Canvas
      drawScope();

      // Draw Polar / Orbit Canvas
      drawPolar();

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // -------------------------------------------------------------
  // DUAL-TRACE OSCILLOSCOPE DRAWING
  // -------------------------------------------------------------
  const drawScope = () => {
    const canvas = scopeCanvasRef.current;
    if (!canvas) return;

    const st = stateRef.current;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight || 280;

    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const isLightMode = st.isLight;
    const p0 = -60, p1 = 840;
    const toX = (p: number) => ((p - p0) / (p1 - p0)) * w;
    const mid = h / 2 + 10;

    // Grid lines
    ctx.strokeStyle = isLightMode ? '#f1f5f9' : '#1e293b';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 20; i++) {
      ctx.beginPath();
      ctx.moveTo((i * w) / 20, 0);
      ctx.lineTo((i * w) / 20, h);
      ctx.stroke();
    }
    for (let i = 0; i <= 8; i++) {
      ctx.beginPath();
      ctx.moveTo(0, (i * h) / 8);
      ctx.lineTo(w, (i * h) / 8);
      ctx.stroke();
    }

    // Center baseline
    ctx.strokeStyle = isLightMode ? '#cbd5e1' : '#334155';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, mid);
    ctx.lineTo(w, mid);
    ctx.stroke();

    // Laser Tachometer Trigger Lines (0°, 360°, 720°)
    ctx.font = 'bold 10px ui-monospace, Menlo, monospace';
    for (const t of [0, 360, 720]) {
      const tx = toX(t);
      ctx.strokeStyle = '#ef4444';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(tx, 22);
      ctx.lineTo(tx, h);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#ef4444';
      ctx.textAlign = 'center';
      ctx.fillText('TOP LASER (t=0)', tx, 16);
    }

    const calcSensor = (id: string) => st.selectedFault.calc(byId[id], st.defectAngle, st.rpm);
    const a = calcSensor(st.sensorA);
    const b = calcSensor(st.sensorB);
    const sc = (h * 0.32) / Math.max(a.a + a.a2, b.a + b.a2, 0.05);

    // Draw Traces: Channel A (Green) and Channel B (Purple)
    const traces: [PhaseCalcResult, string][] = [
      [a, '#10b981'],
      [b, '#8b10ff']
    ];

    for (const [r, col] of traces) {
      ctx.strokeStyle = col;
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let p = p0; p <= p1; p += 3) {
        const y = mid - signal(r, p) * sc;
        if (p === p0) ctx.moveTo(toX(p), y);
        else ctx.lineTo(toX(p), y);
      }
      ctx.stroke();
    }

    // Phase difference Δφ marker
    const pa = a.p < 300 ? a.p : a.p - 360;
    const d = Math.round(wrap(b.p - a.p));
    const yb = mid - (a.a + a.a2) * sc - 18;

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(toX(pa), yb);
    ctx.lineTo(toX(pa + d), yb);
    ctx.moveTo(toX(pa), yb - 6);
    ctx.lineTo(toX(pa), yb + 6);
    ctx.moveTo(toX(pa + d), yb - 6);
    ctx.lineTo(toX(pa + d), yb + 6);
    ctx.stroke();

    ctx.fillStyle = '#d97706';
    ctx.textAlign = 'left';
    ctx.font = 'bold 11px ui-monospace, Menlo, monospace';
    ctx.fillText(`Δφ = ${d}°`, toX(pa) + 4, yb - 8);

    // Real-time Sweep Cursor Line
    const cur = wrap(st.psi);
    for (const k of [0, 360, 720]) {
      if (cur + k <= p1) {
        ctx.fillStyle = isLightMode ? 'rgba(15,23,42,0.1)' : 'rgba(255,255,255,0.15)';
        ctx.fillRect(toX(cur + k) - 1, 0, 2, h);
      }
    }
  };

  // -------------------------------------------------------------
  // POLAR / ORBIT DIAGRAM DRAWING
  // -------------------------------------------------------------
  const drawPolar = () => {
    const canvas = polarCanvasRef.current;
    if (!canvas) return;

    const st = stateRef.current;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight || 300;

    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const isLightMode = st.isLight;
    const cx = w / 2;
    const cy = h / 2;
    const R = Math.min(w, h) / 2 - 32;

    // Concentric grid circles
    ctx.strokeStyle = isLightMode ? '#e2e8f0' : '#1e293b';
    ctx.lineWidth = 1;
    for (const k of [1 / 3, 2 / 3, 1]) {
      ctx.beginPath();
      ctx.arc(cx, cy, R * k, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Axes
    ctx.beginPath();
    ctx.moveTo(cx - R, cy);
    ctx.lineTo(cx + R, cy);
    ctx.moveTo(cx, cy - R);
    ctx.lineTo(cx, cy + R);
    ctx.stroke();

    // Degree Labels
    ctx.fillStyle = isLightMode ? '#64748b' : '#94a3b8';
    ctx.font = '10px ui-monospace, Menlo, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('90°', cx, cy - R - 8);
    ctx.fillText('270°', cx, cy + R + 14);
    ctx.fillText('180°', cx - R - 16, cy + 4);
    ctx.fillText('0°', cx + R + 14, cy + 4);

    const calcSensor = (id: string) => st.selectedFault.calc(byId[id], st.defectAngle, st.rpm);
    const a = calcSensor(st.sensorA);
    const b = calcSensor(st.sensorB);

    if (st.plotMode === 'polar') {
      // POLAR VECTORS
      const mx = Math.max(a.a, b.a, 0.01);
      const vectors: [PhaseCalcResult, string][] = [
        [a, '#10b981'],
        [b, '#8b10ff']
      ];

      for (const [r, col] of vectors) {
        const L = (r.a / mx) * R * 0.85;
        const rad = (r.p * Math.PI) / 180;
        const ex = cx + L * Math.cos(rad);
        const ey = cy - L * Math.sin(rad);

        // Vector line
        ctx.strokeStyle = col;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(ex, ey);
        ctx.stroke();

        // Tip circle
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(ex, ey, 5.5, 0, Math.PI * 2);
        ctx.fill();

        // Label
        ctx.font = 'bold 11px ui-monospace, Menlo, monospace';
        ctx.fillText(`${Math.round(r.p)}°`, cx + (L + 18) * Math.cos(rad), cy - (L + 18) * Math.sin(rad) + 4);
      }

      // Delta Phi arc
      const dPhi = Math.round(wrap(b.p - a.p));
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.25, -(a.p * Math.PI) / 180, -((a.p + dPhi) * Math.PI) / 180, true);
      ctx.stroke();
    } else {
      // ORBIT (Lissajous H x V on bearing A)
      const bearingNum = byId[st.sensorA]?.b || 2;
      const sH = SENSORS.find((q) => q.b === bearingNum && q.d === 'H');
      const sV = SENSORS.find((q) => q.b === bearingNum && q.d === 'V');

      if (sH && sV) {
        const rh = calcSensor(sH.id);
        const rv = calcSensor(sV.id);
        const mx = Math.max(rh.a + rh.a2, rv.a + rv.a2, 0.01);
        const k = (R * 0.85) / mx;

        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let p = 0; p <= 360; p += 3) {
          const px = cx + signal(rh, p) * k;
          const py = cy - signal(rv, p) * k;
          if (p === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();

        // Laser Keyphasor Reference Dot at t=0
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(cx + signal(rh, 0) * k, cy - signal(rv, 0) * k, 5, 0, Math.PI * 2);
        ctx.fill();

        // Real-time orbit point
        ctx.fillStyle = isLightMode ? '#0f172a' : '#ffffff';
        ctx.beginPath();
        ctx.arc(cx + signal(rh, st.psi) * k, cy - signal(rv, st.psi) * k, 4.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = isLightMode ? '#64748b' : '#94a3b8';
        ctx.textAlign = 'left';
        ctx.fillText(`Orbite Palier ${bearingNum} (H × V) · ● Top Tachy`, 10, h - 10);
      }
    }

    // Center pivot point
    ctx.fillStyle = isLightMode ? '#0f172a' : '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
    ctx.fill();
  };

  // Reset Camera View
  const handleResetCamera = () => {
    if (threeRef.current) {
      const { camera, controls } = threeRef.current;
      camera.position.set(2.8, 2.2, 3.4);
      controls.target.set(0.1, 0.65, 0);
      controls.update();
    }
  };

  // -------------------------------------------------------------
  // JSX RENDERING
  // -------------------------------------------------------------
  return (
    <div className={`space-y-6 ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
      {/* Header Banner */}
      <div className={`p-6 rounded-2xl border shadow-sm transition-all ${
        isLight ? 'bg-white border-slate-200' : 'bg-[#0D1322] border-slate-800'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-600">
              <Compass className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-purple-600 text-white">
                  DIAGNOSTIC AVANCÉ ISO 10816 / 18436
                </span>
                <span className={`text-xs font-mono font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Simulation 3D Temps Réel & Analyse Cross-Phase
                </span>
              </div>
              <h2 className={`text-xl font-black tracking-tight mt-1 ${isLight ? 'text-slate-950' : 'text-white'}`}>
                Analyse de Phase 3D : Ligne d'Arbre & Déformée Opérationnelle
              </h2>
              <p className={`text-xs mt-1 max-w-3xl leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                L'analyse de phase mesure la relation temporelle (en degrés de 0 à 360°) entre le repère tachymétrique laser (t=0) et les crêtes vibratoires sur 12 capteurs orthogonaux. Elle permet de trancher avec certitude entre <strong>balourd</strong>, <strong>désalignement</strong>, <strong>arbre courbé</strong> ou <strong>résonance</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Fault Selection Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {FAULTS.map((f) => {
          const isSelected = selectedFault.key === f.key;
          return (
            <button
              key={f.key}
              onClick={() => handleSelectFault(f)}
              className={`p-3 rounded-xl border text-xs font-black transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-1.5 ${
                isSelected
                  ? 'bg-purple-600 border-purple-600 text-white shadow-md shadow-purple-900/20'
                  : isLight
                    ? 'bg-white border-slate-200 text-slate-700 hover:border-purple-300 hover:bg-purple-50/50'
                    : 'bg-[#0D1322] border-slate-800 text-slate-300 hover:border-purple-600/50 hover:bg-slate-800/40'
              }`}
            >
              <Zap className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-purple-500'}`} />
              <span>{f.name}</span>
            </button>
          );
        })}
      </div>

      {/* Main Grid: 3D Viewport & Oscilloscope (Left) | Controls & Polar/Orbit (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: 3D Machine + Oscilloscope (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* 3D Machine Viewport Card */}
          <div className={`p-5 rounded-2xl border shadow-sm relative ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#0D1322] border-slate-800'
          }`}>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-purple-500" />
                <span className="text-xs font-black uppercase tracking-wider">
                  Simulation 3D des Défauts : Ligne d'Arbres & Capteurs
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleResetCamera}
                  title="Réinitialiser l'angle de caméra"
                  className={`p-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                    isLight ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  title={isExpanded ? 'Réduire la hauteur' : 'Agrandir la vue 3D'}
                  className={`p-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                    isLight ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                  }`}
                >
                  {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* 3D Canvas Container */}
            <div 
              className={`relative rounded-xl border overflow-hidden ${isExpanded ? 'h-[620px]' : 'h-[440px]'} ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#090D16] border-slate-800'
              }`}
            >
              <div ref={viewportRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

              {/* DYNAMIC 3D HUD OVERLAY FOR FAULT SIMULATION */}
              {selectedFault.key === 'resonance' ? (
                /* EXPLICIT RESONANCE HUD OVERLAY */
                <div className={`absolute top-3 left-3 z-30 p-3 rounded-xl border backdrop-blur-md shadow-xl max-w-sm sm:max-w-md animate-fadeIn transition-all ${
                  resonanceMetrics.isAtResonance
                    ? 'bg-red-600/95 border-red-300 text-white ring-2 ring-red-400 shadow-red-600/40'
                    : isLight 
                      ? 'bg-white/95 border-amber-300 text-slate-900 shadow-amber-500/10' 
                      : 'bg-slate-900/95 border-amber-500/50 text-white shadow-black/40'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full shrink-0 ${
                      resonanceMetrics.isAtResonance ? 'bg-white animate-ping' : 'bg-amber-500 animate-pulse'
                    }`} />
                    <span className="text-[11px] font-black tracking-wide uppercase">
                      FRÉQUENCE PROPRE : <span className="underline decoration-2">f₀ = 30.0 Hz (1800 RPM)</span>
                    </span>
                  </div>

                  <div className="mt-1.5 text-[11px] font-mono flex items-center justify-between gap-3">
                    <span>Vitesse actuelle : <strong>{resonanceMetrics.f.toFixed(1)} Hz ({rpm} RPM)</strong></span>
                    <span>Rapport f/f₀ : <strong>{resonanceMetrics.r.toFixed(2)}</strong></span>
                  </div>

                  {resonanceMetrics.isAtResonance ? (
                    <div className="mt-2 pt-2 border-t border-white/30 text-[10px] font-black tracking-wide text-white uppercase flex flex-col gap-1">
                      <div className="flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-amber-200 animate-bounce" />
                        <span>⚡ RÉSONANCE CRITIQUE ATTEINTE ! Coïncidence f = f₀</span>
                      </div>
                      <span className="text-[9px] font-medium text-red-100">
                        Amplification dynamique maximale Q ≈ {resonanceMetrics.amp.toFixed(1)}× • Déphasage exact à 90° !
                      </span>
                    </div>
                  ) : (
                    <div className="mt-1.5 text-[10px] font-semibold flex items-center justify-between text-slate-600 dark:text-slate-300">
                      <span>{rpm < 1800 ? "Régime Sous-Critique (f < f₀) : déphasage ≈ 0°" : "Régime Super-Critique (f > f₀) : déphasage ≈ 180°"}</span>
                      <span className="font-mono text-purple-600 font-bold">Q = {resonanceMetrics.amp.toFixed(1)}×</span>
                    </div>
                  )}

                  {/* Preset Speed Buttons in HUD */}
                  <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => setRpm(1200)}
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
                    >
                      1200 RPM (f &lt; f₀)
                    </button>
                    <button
                      onClick={() => setRpm(1800)}
                      className="px-2 py-0.5 rounded text-[10px] font-black bg-red-600 hover:bg-red-500 text-white shadow-xs cursor-pointer flex items-center gap-1"
                    >
                      <Zap className="w-3 h-3" />
                      1800 RPM (f = f₀ Résonance)
                    </button>
                    <button
                      onClick={() => setRpm(2400)}
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
                    >
                      2400 RPM (f &gt; f₀)
                    </button>
                  </div>
                </div>
              ) : (
                /* OTHER FAULTS 3D HUD OVERLAY */
                <div className={`absolute top-3 left-3 z-30 p-2.5 rounded-xl border backdrop-blur-md shadow-md text-xs max-w-sm ${
                  isLight ? 'bg-white/95 border-slate-200 text-slate-800' : 'bg-[#0D1322]/95 border-slate-800 text-slate-200'
                }`}>
                  <div className="flex items-center gap-2 font-black text-[11px] text-purple-600">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Simulation Défaut 3D : {selectedFault.name}</span>
                  </div>
                  <p className="text-[10px] mt-1 text-slate-600 dark:text-slate-400 leading-snug">
                    {selectedFault.key === 'static' && `Force centrifuge F_c à ${defectAngle}° sur le rotor. Déphasage 90° H/V.`}
                    {selectedFault.key === 'couple' && `Couple dynamique : 2 forces à 180° causant un balancement en opposition.`}
                    {selectedFault.key === 'parallel' && `Cisaillement radial à l'accouplement : déphasage 180° radial à travers l'accouplement.`}
                    {selectedFault.key === 'angular' && `Moment de flexion axiale : déphasage 180° axial à travers l'accouplement.`}
                    {selectedFault.key === 'softfoot' && `Pied avant moteur desserré : vibration directionnelle verticale à 1x et 2x.`}
                    {selectedFault.key === 'bent' && `Arbre gauchi entre paliers 3 et 4 : déphasage axial 180° distinct du balourd.`}
                  </p>
                </div>
              )}

              {/* Floating Resonance Pin directly above Palier 3 in 3D */}
              {selectedFault.key === 'resonance' && resTagPos && resTagPos.visible && (
                <div 
                  className={`absolute -translate-x-1/2 -translate-y-[120%] pointer-events-none z-30 px-2 py-1 rounded-lg border text-[10px] font-black font-mono shadow-md transition-transform flex items-center gap-1.5 ${
                    resonanceMetrics.isAtResonance
                      ? 'bg-red-600 border-white text-white animate-bounce ring-2 ring-red-400'
                      : isLight 
                        ? 'bg-amber-100 border-amber-400 text-amber-950' 
                        : 'bg-amber-950/90 border-amber-500 text-amber-200'
                  }`}
                  style={{ left: `${resTagPos.x}px`, top: `${resTagPos.y}px` }}
                >
                  <Flame className="w-3 h-3" />
                  <span>Palier 3 : f₀ = 30.0 Hz (1800 RPM)</span>
                </div>
              )}

              {/* Projected 2D Sensor Overlay Labels */}
              {showLabels && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  {SENSORS.map((s) => {
                    const pos = screenLabels[s.id];
                    if (!pos || !pos.visible) return null;
                    const isA = s.id === sensorA;
                    const isB = s.id === sensorB;

                    return (
                      <div
                        key={s.id}
                        className={`absolute text-[10px] font-black font-mono px-1.5 py-0.5 rounded shadow-sm transition-transform pointer-events-none -translate-x-1/2 -translate-y-[130%] ${
                          isA
                            ? 'bg-emerald-500 text-white ring-2 ring-emerald-300 z-20'
                            : isB
                              ? 'bg-purple-600 text-white ring-2 ring-purple-300 z-20'
                              : isLight
                                ? 'bg-white/90 text-slate-700 border border-slate-300'
                                : 'bg-slate-900/90 text-slate-300 border border-slate-700'
                        }`}
                        style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
                      >
                        {s.id}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Sliders & Toggles Toolbar */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Defect Angle Slider */}
              <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#131B2E] border-slate-800'}`}>
                <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                  <span className="text-purple-600">Angle Défaut / Balourd :</span>
                  <span className="font-mono text-amber-500 font-extrabold">{defectAngle}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="359"
                  value={defectAngle}
                  onChange={(e) => setDefectAngle(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Machine RPM Slider */}
              <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#131B2E] border-slate-800'}`}>
                <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <span>Vitesse Machine (RPM) :</span>
                    {selectedFault.key === 'resonance' && (
                      <span className="text-[10px] text-amber-500 font-black">(f₀ = 1800)</span>
                    )}
                  </span>
                  <span className="font-mono font-extrabold text-blue-500">{rpm} RPM</span>
                </div>
                <input
                  type="range"
                  min="300"
                  max="3000"
                  step="10"
                  value={rpm}
                  onChange={(e) => setRpm(Number(e.target.value))}
                  className={`w-full cursor-pointer ${selectedFault.key === 'resonance' && resonanceMetrics.isAtResonance ? 'accent-red-600' : 'accent-blue-600'}`}
                />
              </div>
            </div>

            {/* Feature Action Buttons */}
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 cursor-pointer transition-all ${
                  isPlaying 
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                    : isLight ? 'bg-white text-slate-700 border-slate-200' : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlaying ? 'Pause Rotation' : 'Démarrer Rotation'}</span>
              </button>

              <button
                onClick={() => setIsDeforming(!isDeforming)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 cursor-pointer transition-all ${
                  isDeforming 
                    ? 'bg-purple-600 text-white border-purple-600 shadow-sm' 
                    : isLight ? 'bg-white text-slate-700 border-slate-200' : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Déformée 3D ({isDeforming ? 'Active ×' : 'Désactivée'})</span>
              </button>

              <button
                onClick={() => setShowLabels(!showLabels)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 cursor-pointer transition-all ${
                  showLabels 
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' 
                    : isLight ? 'bg-white text-slate-700 border-slate-200' : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                {showLabels ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>Étiquettes Capteurs ({showLabels ? 'ON' : 'OFF'})</span>
              </button>
            </div>
          </div>

          {/* Oscilloscope Card */}
          <div className={`p-5 rounded-2xl border shadow-sm ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#0D1322] border-slate-800'
          }`}>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-black uppercase tracking-wider">
                  Oscilloscope Bi-Courbe : Signaux de Phase
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-md font-mono text-[11px] font-black bg-amber-500/10 border border-amber-500/30 text-amber-500">
                Déphasage Inter-Capteur Δφ = {currentDeltaPhi}°
              </span>
            </div>

            <div className={`rounded-xl border overflow-hidden ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#090D16] border-slate-800'
            }`}>
              <canvas ref={scopeCanvasRef} className="w-full h-72 block" />
            </div>

            {/* Legend & Channel Badges */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono font-bold">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="flex items-center gap-1.5 text-emerald-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Voie Réf (A) : <strong>{sensorA}</strong> ({Math.round(selectedFault.calc(byId[sensorA], defectAngle, rpm).p)}°)
                </span>
                <span className="flex items-center gap-1.5 text-purple-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                  Voie Comp (B) : <strong>{sensorB}</strong> ({Math.round(selectedFault.calc(byId[sensorB], defectAngle, rpm).p)}°)
                </span>
                <span className="flex items-center gap-1.5 text-red-500">
                  <span className="w-2 h-2 rounded-xs bg-red-500" />
                  Top Tachy Laser (t=0)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Channel Selectors & Polar/Orbit Diagram & Diagnostic (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Channel Selectors Card */}
          <div className={`p-5 rounded-2xl border shadow-sm space-y-4 ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#0D1322] border-slate-800'
          }`}>
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
              <Sliders className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-black uppercase tracking-wider">Sélection des Voies de Mesure</span>
            </div>

            {/* Voie A */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-emerald-600 flex items-center justify-between">
                <span>VOIE A (RÉFÉRENCE - VERT) :</span>
                <span className="font-mono text-[11px] font-bold text-slate-500">{byId[sensorA]?.d === 'H' ? 'Horizontal' : byId[sensorA]?.d === 'V' ? 'Vertical' : 'Axial'}</span>
              </label>
              <select
                value={sensorA}
                onChange={(e) => setSensorA(e.target.value)}
                className={`w-full p-2.5 rounded-xl border text-xs font-bold font-mono outline-none cursor-pointer transition-all ${
                  isLight 
                    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500 focus:bg-white shadow-xs' 
                    : 'bg-[#131B2E] border-slate-700 text-white focus:border-emerald-500'
                }`}
              >
                {SENSORS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.id} — {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Voie B */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-purple-600 flex items-center justify-between">
                <span>VOIE B (COMPARAISON - VIOLET) :</span>
                <span className="font-mono text-[11px] font-bold text-slate-500">{byId[sensorB]?.d === 'H' ? 'Horizontal' : byId[sensorB]?.d === 'V' ? 'Vertical' : 'Axial'}</span>
              </label>
              <select
                value={sensorB}
                onChange={(e) => setSensorB(e.target.value)}
                className={`w-full p-2.5 rounded-xl border text-xs font-bold font-mono outline-none cursor-pointer transition-all ${
                  isLight 
                    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-purple-500 focus:bg-white shadow-xs' 
                    : 'bg-[#131B2E] border-slate-700 text-white focus:border-purple-500'
                }`}
              >
                {SENSORS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.id} — {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Polar / Orbit Plotter Card */}
          <div className={`p-5 rounded-2xl border shadow-sm ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#0D1322] border-slate-800'
          }`}>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-500" />
                <span className="text-xs font-black uppercase tracking-wider">Diagramme Vectoriel</span>
              </div>
              <div className={`inline-flex p-1 rounded-lg border text-xs font-bold ${
                isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#131B2E] border-slate-700'
              }`}>
                <button
                  onClick={() => setPlotMode('polar')}
                  className={`px-2.5 py-0.5 rounded cursor-pointer transition-all ${
                    plotMode === 'polar' 
                      ? 'bg-purple-600 text-white font-black shadow-xs' 
                      : isLight ? 'text-slate-700' : 'text-slate-400'
                  }`}
                >
                  Polaire
                </button>
                <button
                  onClick={() => setPlotMode('orbit')}
                  className={`px-2.5 py-0.5 rounded cursor-pointer transition-all ${
                    plotMode === 'orbit' 
                      ? 'bg-purple-600 text-white font-black shadow-xs' 
                      : isLight ? 'text-slate-700' : 'text-slate-400'
                  }`}
                >
                  Orbite
                </button>
              </div>
            </div>

            <div className={`rounded-xl border overflow-hidden ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#090D16] border-slate-800'
            }`}>
              <canvas ref={polarCanvasRef} className="w-full h-72 block" />
            </div>

            {/* Readouts */}
            <div className="grid grid-cols-2 gap-3 mt-3 font-mono text-xs">
              <div className={`p-2.5 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#131B2E] border-slate-800'}`}>
                <span className="text-slate-500 block text-[10px] font-bold">Amplitude Voie A (1x)</span>
                <span className="text-base font-extrabold text-emerald-600">
                  {(selectedFault.calc(byId[sensorA], defectAngle, rpm).a * 4).toFixed(1)} mm/s
                </span>
              </div>
              <div className={`p-2.5 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#131B2E] border-slate-800'}`}>
                <span className="text-slate-500 block text-[10px] font-bold">Amplitude Voie B (1x)</span>
                <span className="text-base font-extrabold text-purple-600">
                  {(selectedFault.calc(byId[sensorB], defectAngle, rpm).a * 4).toFixed(1)} mm/s
                </span>
              </div>
            </div>
          </div>

          {/* Diagnostic Expert Fiche */}
          <div className={`p-5 rounded-2xl border shadow-sm space-y-4 ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#0D1322] border-slate-800'
          }`}>
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-black uppercase tracking-wider">Fiche d'Expertise Diagnostique</span>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-purple-50 text-purple-900 border border-purple-200">
                {selectedFault.name}
              </span>
            </div>

            <div className="space-y-3 text-xs leading-relaxed">
              <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#131B2E] border-slate-800'}`}>
                <strong className="text-purple-600 uppercase text-[10px] tracking-wider block mb-1">
                  1. Nature Physique du Phénomène :
                </strong>
                <p className={isLight ? 'text-slate-700' : 'text-slate-300'}>{selectedFault.desc}</p>
              </div>

              <div className={`p-3 rounded-xl border ${isLight ? 'bg-emerald-50/50 border-emerald-200' : 'bg-emerald-950/20 border-emerald-900/40'}`}>
                <strong className="text-emerald-600 uppercase text-[10px] tracking-wider block mb-1">
                  2. Méthode Pratique de Mesure :
                </strong>
                <p className={isLight ? 'text-slate-700' : 'text-slate-300'}>{selectedFault.method}</p>
              </div>

              <div className={`p-3 rounded-xl border ${isLight ? 'bg-amber-50/60 border-amber-200' : 'bg-amber-950/20 border-amber-900/40'}`}>
                <strong className="text-amber-600 uppercase text-[10px] tracking-wider block mb-1">
                  3. Critères et Constatations de Phase Réelles :
                </strong>
                <p className={`font-semibold ${isLight ? 'text-slate-900' : 'text-amber-200'}`}>{selectedFault.find}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
