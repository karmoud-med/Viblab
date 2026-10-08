import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { 
  Wind, 
  Activity, 
  Info, 
  Eye, 
  RotateCcw, 
  Maximize2, 
  Minimize2, 
  AlertTriangle, 
  Zap, 
  CheckCircle2,
  Sliders,
  Radio,
  Layers,
  HelpCircle
} from 'lucide-react';

interface PumpFanModuleProps {
  theme?: 'dark' | 'light' | 'mono';
}

// ---------------------------------------------------------------------------
// TYPES & DEFINITIONS
// ---------------------------------------------------------------------------
export type OrbitKey = 'none' | 'direct' | 'inverse' | 'whirl' | 'gmf';

export interface OrbitDefinition {
  k: OrbitKey;
  n: string;
  t: string;
  d: string;
}

export const ORBITS: OrbitDefinition[] = [
  { 
    k: 'none', 
    n: 'Aucune', 
    t: 'Aucune précession (Rotor centré)', 
    d: 'Le rotor tourne centré dans son palier. Seules les composantes normales de l’écoulement (BPF modérée) sont présentes.' 
  },
  { 
    k: 'direct', 
    n: 'Précession Directe', 
    t: 'Précession Directe (Balourd / Unbalance)', 
    d: 'Le rotor de la pompe fléchit radialement et tourne dans une orbite synchrone circulaire. Typique d’une aube cassée ou obstruée créant un déséquilibre massique centrifuge.' 
  },
  { 
    k: 'inverse', 
    n: 'Précession Inverse', 
    t: 'Précession Inverse (Frottement / Rubbing)', 
    d: 'L’orbite tourne dans le sens opposé à la rotation. Typique d’un frottement roue/bague d’usure ou d’un contact rotor/stator : apparition d’harmoniques 2x et 3x RPM.' 
  },
  { 
    k: 'whirl', 
    n: 'Whirl Turbulent / Chocs', 
    t: 'Whirl turbulent / Chocs sous-synchrones', 
    d: 'Orbite instable et sous-synchrone (≈ 0,43x RPM) provoquée par le film fluide ou la recirculation. Le centre de l’arbre décrit une trajectoire erratique avec des chocs.' 
  },
  { 
    k: 'gmf', 
    n: 'Orbite GMF / Aubes', 
    t: 'Orbite GMF / Passage d’Aubes', 
    d: 'Chaque passage d’aube devant le bec de volute crée une impulsion de pression : l’orbite présente B lobes par tour. Signe d’un jeu roue/bec trop faible ou d’une roue excentrée.' 
  },
];

// Frequencies calculation
export function freqs(rpm: number, B: number) {
  const f = rpm / 60;
  return { f, bpf: B * f, cpm: B * rpm };
}

// Normalized orbit displacement (y, z) for rotation angle th (rad)
export function orbitOffset(k: OrbitKey, th: number, B: number, t: number): [number, number] {
  switch (k) {
    case 'direct':
      return [Math.cos(th), Math.sin(th)];
    case 'inverse':
      return [0.75 * Math.cos(th), -0.75 * Math.sin(th)];
    case 'whirl': {
      const a = 0.43 * th;
      const j = 0.35 * Math.sin(t * 23.1) * Math.sin(t * 7.7);
      return [
        (0.8 + j) * Math.cos(a) + 0.15 * Math.sin(t * 31),
        (0.8 - j) * Math.sin(a) + 0.15 * Math.cos(t * 27)
      ];
    }
    case 'gmf': {
      const r = 0.45 * (1 + 0.4 * Math.cos(B * th));
      return [r * Math.cos(th), r * Math.sin(th)];
    }
    default:
      return [0, 0];
  }
}

export interface SpectrumPeak {
  f: number;
  a: number;
  label: string;
  kind: 'rpm' | 'sub' | 'bpf' | 'sb';
}

export function calcSpectrum(p: { rpm: number; B: number; orbit: OrbitKey; amp: number; body: number; cav: boolean }) {
  const { f, bpf } = freqs(p.rpm, p.B);
  const A = p.amp / 4;
  const Bd = p.body / 3;
  const P: SpectrumPeak[] = [];
  const push = (fr: number, a: number, label: string, kind: 'rpm' | 'sub' | 'bpf' | 'sb') => {
    if (a > 0.03) P.push({ f: fr, a, label, kind });
  };

  let x1 = 0.55, x2 = 0.25, x3 = 0, sub = 0, kb = 1, ks = 1;
  if (p.orbit === 'direct') { x1 += 1.9 * A; x2 += 0.1 * A; }
  if (p.orbit === 'inverse') { x1 += 0.6 * A; x2 += 1.1 * A; x3 = 0.6 * A; }
  if (p.orbit === 'whirl') { sub = 1.5 * A; x1 += 0.3 * A; }
  if (p.orbit === 'gmf') { kb = 1 + 1.3 * A; ks = 1 + 1.2 * A; }

  push(f, x1, `1x RPM (${f.toFixed(1)}Hz)`, 'rpm');
  push(2 * f, x2, `2x RPM (${(2 * f).toFixed(1)}Hz)`, 'rpm');
  push(3 * f, x3, `3x RPM (${(3 * f).toFixed(1)}Hz)`, 'rpm');
  push(0.43 * f, sub, `0.43x whirl (${(0.43 * f).toFixed(1)}Hz)`, 'sub');

  const b = (0.5 + 0.55 * Bd) * kb;
  push(bpf, 1.5 * b, `BPF (${bpf.toFixed(1)}Hz)`, 'bpf');
  push(2 * bpf, 0.75 * b, `2x BPF (${(2 * bpf).toFixed(1)}Hz)`, 'bpf');

  for (const [k, a] of [[1, 0.35], [2, 0.22]]) {
    push(bpf - k * f, a * ks * (0.6 + 0.4 * Bd), '', 'sb');
    push(bpf + k * f, a * ks * (0.6 + 0.4 * Bd), '', 'sb');
  }

  return { P, f, bpf, fmax: 2.5 * bpf };
}

export function calcNoiseAt(fr: number, bpf: number, cav: boolean, t: number) {
  let n = 0.035 + 0.025 * Math.abs(Math.sin(fr * 1.37 + 0.4) * Math.cos(fr * 0.29));
  if (cav) {
    n += (0.12 + 0.55 * Math.exp(-fr / (0.7 * bpf))) * (0.5 + 0.5 * Math.abs(Math.sin(fr * 2.3 + t * 17) * Math.cos(fr * 0.71 - t * 11)));
  }
  return n;
}

// ---------------------------------------------------------------------------
// 3D PUMP MODEL BUILDER (from pump3d.js)
// ---------------------------------------------------------------------------
function buildPumpModel(isLightMode: boolean) {
  const M = (name: string, color: number, rough = 0.55, metal = 0.25, o: any = {}) => {
    const m = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, ...o });
    m.name = name;
    return m;
  };

  const mat = {
    concrete: M('beton', isLightMode ? 0xe2e8f0 : 0x1e293b, 0.95, 0),
    skid: M('chassis', isLightMode ? 0x94a3b8 : 0x334155, 0.55, 0.3),
    body: M('carter_moteur', isLightMode ? 0x64748b : 0x475569, 0.5, 0.25),
    dark: M('fonte', isLightMode ? 0x475569 : 0x1e293b, 0.45, 0.3),
    steel: M('acier_arbre', 0xcbd5e1, 0.3, 0.45),
    orange: M('accouplement', 0xf59e0b, 0.45, 0.2),
    elast: M('elastomere', 0x1e293b, 0.7, 0),
    blade: M('roue_aubes', 0x2563eb, 0.35, 0.4),
    shroud: M('flasque_roue', 0x1e40af, 0.4, 0.4),
    volute: M('volute', isLightMode ? 0x94a3b8 : 0x64748b, 0.3, 0.2, {
      transparent: true,
      opacity: 0.32,
      depthWrite: false,
      side: THREE.DoubleSide
    }),
    voluteSolid: M('volute_opaque', isLightMode ? 0x64748b : 0x334155, 0.45, 0.3, {
      side: THREE.DoubleSide
    }),
    pipe: M('tuyauterie', isLightMode ? 0xa3b1c2 : 0x475569, 0.35, 0.3, {
      transparent: true,
      opacity: 0.38,
      depthWrite: false,
      side: THREE.DoubleSide
    }),
    flange: M('bride', 0x64748b, 0.45, 0.35),
    bubble: M('bulle_cavitation', 0xe0f2fe, 0.1, 0, {
      transparent: true,
      opacity: 0.85,
      emissive: new THREE.Color(0x38bdf8),
      emissiveIntensity: 0.45
    }),
    trail: new THREE.LineBasicMaterial({ color: 0x10b981 }),
  };

  const H = 0.6;
  const root = new THREE.Group();
  root.name = 'pompe_centrifuge';

  const grp = (name: string, x: number, y: number, z: number, p: THREE.Group = root) => {
    const g = new THREE.Group();
    g.name = name;
    g.position.set(x, y, z);
    p.add(g);
    return g;
  };

  const add = (name: string, geo: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number, p: THREE.Group = root) => {
    const o = new THREE.Mesh(geo, m);
    o.name = name;
    o.position.set(x, y, z);
    p.add(o);
    return o;
  };

  const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
  const cylX = (r: number, len: number, seg = 48, open = false) =>
    new THREE.CylinderGeometry(r, r, len, seg, 1, open).rotateZ(Math.PI / 2);

  const base = grp('socle', 0, 0, 0);
  add('massif_beton', box(2.5, 0.16, 1.0), mat.concrete, 0.05, 0.08, 0, base);
  add('chassis', box(2.3, 0.1, 0.7), mat.skid, 0.05, 0.21, 0, base);

  // Moteur électrique PBR
  const motor = grp('moteur', -0.6, H, 0, base);
  add('carcasse', cylX(0.22, 0.7, 64), mat.body, 0, 0, 0, motor);
  for (let i = 0; i < 8; i++) {
    add('ailette_' + i, cylX(0.24, 0.02), mat.body, -0.3 + i * 0.085, 0, 0, motor);
  }
  add('capot_ventilateur', cylX(0.2, 0.12), mat.body, -0.41, 0, 0, motor);
  add('flasque_DE', cylX(0.2, 0.05), mat.dark, 0.37, 0, 0, motor);
  add('boite_bornes', box(0.18, 0.1, 0.17), mat.body, 0, 0.27, 0, motor);
  for (const x of [-0.22, 0.22]) {
    for (const z of [-0.16, 0.16]) {
      add('patte', box(0.13, 0.22, 0.08), mat.body, x, -0.23, z, motor);
    }
  }

  const motorSpin = grp('arbre_moteur_rot', 0, 0, 0, motor);
  add('arbre_moteur', cylX(0.03, 0.2), mat.steel, 0.47, 0, 0, motorSpin);
  add('moyeu_moteur', cylX(0.075, 0.07), mat.orange, 0.57, 0, 0, motorSpin);
  add('repere', box(0.03, 0.01, 0.01), mat.flange, 0.47, 0, 0.032, motorSpin);

  // Palier de pompe (lanterne)
  add('lanterne_support', box(0.16, H - 0.26, 0.22), mat.dark, 0.2, (H + 0.26) / 2, 0, base);
  add('lanterne_corps', cylX(0.1, 0.36), mat.body, 0.2, H, 0, base);

  // Ensemble tournant pompe (orbite = position de 'rotor_orbite')
  const orb = grp('rotor_orbite', 0, H, 0, base);
  const spin = grp('rotor_rot', 0, 0, 0, orb);
  add('moyeu_pompe', cylX(0.075, 0.07), mat.orange, -0.025, 0, 0, spin);
  add('element_elastique', cylX(0.065, 0.025), mat.elast, -0.07, 0, 0, spin);
  add('arbre_pompe', cylX(0.032, 0.62), mat.steel, 0.29, 0, 0, spin);
  const imp = grp('roue', 0.62, 0, 0, spin);

  // Volute (tore + flasques), refoulement tangentiel, aspiration axiale
  const vol = grp('volute', 0.64, H, 0, base);
  const mv: THREE.Mesh[] = [];
  mv.push(add('volute_spirale', new THREE.TorusGeometry(0.27, 0.085, 24, 96).rotateY(Math.PI / 2), mat.volute, 0, 0, 0, vol));
  mv.push(add('flasque_arriere', cylX(0.27, 0.02, 64), mat.volute, -0.075, 0, 0, vol));
  mv.push(add('flasque_avant', new THREE.RingGeometry(0.085, 0.27, 64).rotateY(Math.PI / 2), mat.volute, 0.075, 0, 0, vol));
  mv.push(add('bec_refoulement', box(0.15, 0.36, 0.17), mat.volute, 0, 0.2, 0.2, vol));
  add('bride_refoulement', new THREE.CylinderGeometry(0.11, 0.11, 0.03, 40), mat.flange, 0, 0.41, 0.2, vol);
  const disch = add('tuyau_refoulement', new THREE.CylinderGeometry(0.08, 0.08, 0.35, 40, 1, true), mat.pipe, 0, 0.6, 0.2, vol);
  mv.push(add('buse_aspiration', cylX(0.085, 0.16, 48, true), mat.volute, 0.15, 0, 0, vol));
  
  const brideAsp = add('bride_aspiration', new THREE.RingGeometry(0.085, 0.13, 48).rotateY(Math.PI / 2), mat.flange, 0.24, 0, 0, vol);
  const suct = add('tuyau_aspiration', cylX(0.085, 0.45, 48, true), mat.pipe, 0.47, 0, 0, vol);
  add('pied_volute', box(0.18, 0.16, 0.3), mat.dark, 0, -0.26, 0, vol);
  add('garniture', cylX(0.06, 0.06), mat.flange, -0.11, 0, 0, vol);

  // Fonction pour reconstruire la turbine paramétrique à B aubes
  function setImpeller(B: number) {
    while (imp.children.length) {
      const c = imp.children[0] as THREE.Mesh;
      c.geometry?.dispose();
      imp.remove(c);
    }
    add('flasque_roue', cylX(0.22, 0.014, 72), mat.shroud, -0.045, 0, 0, imp);
    add('moyeu_roue', cylX(0.055, 0.1), mat.shroud, -0.01, 0, 0, imp);
    add('nez_roue', new THREE.ConeGeometry(0.05, 0.06, 32).rotateZ(-Math.PI / 2), mat.steel, 0.07, 0, 0, imp);

    const sh = new THREE.Shape();
    const N = 14;
    const th = 0.012;
    const pts: [number, number][] = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      const r = 0.06 + 0.15 * u;
      const a = 1.0 * u * u;
      pts.push([r, a]);
    }
    const P = (r: number, a: number, o: number) =>
      new THREE.Vector2(r * Math.cos(a) - o * Math.sin(a), r * Math.sin(a) + o * Math.cos(a));

    pts.forEach(([r, a], i) => {
      const v = P(r, a, -th / 2);
      i ? sh.lineTo(v.x, v.y) : sh.moveTo(v.x, v.y);
    });
    [...pts].reverse().forEach(([r, a]) => {
      const v = P(r, a, th / 2 + 0.006 * (1 - r / 0.21));
      sh.lineTo(v.x, v.y);
    });
    const g = new THREE.ExtrudeGeometry(sh, { depth: 0.075, bevelEnabled: false }).rotateY(Math.PI / 2);
    for (let i = 0; i < B; i++) {
      const b = add('aube_' + (i + 1), g, mat.blade, -0.04, 0, 0, imp);
      b.rotation.x = (i * 2 * Math.PI) / B;
    }
  }

  // Bulles de cavitation (tournent avec l'écoulement)
  const swirl = grp('cavitation', 0.66, H, 0, base);
  const bgeo = new THREE.SphereGeometry(1, 12, 8);
  const bubbles = Array.from({ length: 70 }, (_, i) => {
    const o = add('bulle_' + i, bgeo, mat.bubble, 0, 0, 0, swirl);
    o.visible = false;
    o.userData = { life: Math.random(), j: Math.random(), init: false };
    return o;
  });

  // Particules d'écoulement
  const fmat = M('ecoulement', 0x3b82f6, 0.3, 0, {
    emissive: new THREE.Color(0x2563eb),
    emissiveIntensity: 0.4
  });
  const fgeo = new THREE.SphereGeometry(0.011, 10, 8);
  const flow = Array.from({ length: 60 }, (_, i) => {
    const o = add('particule_' + i, fgeo, fmat, 0, 0, 0, base);
    o.userData = { s: i / 60, a0: Math.random() * 6.28, j: Math.random() };
    return o;
  });

  const flowAt = (u: number, a0: number, j: number, out: THREE.Vector3) => {
    if (u < 0.3) {
      const k = u / 0.3;
      const r = 0.05 * j;
      return out.set(1.0 - 0.3 * k, H + r * Math.cos(a0), r * Math.sin(a0));
    }
    if (u < 0.75) {
      const k = (u - 0.3) / 0.45;
      const r = 0.06 + 0.21 * k;
      const a = a0 + k * 4.5;
      return out.set(0.64 + 0.04 * (j - 0.5), H + r * Math.cos(a), r * Math.sin(a));
    }
    const k = (u - 0.75) / 0.25;
    return out.set(0.64 + 0.03 * (j - 0.5), H + 0.22 + 0.6 * k, 0.2 + 0.04 * (j - 0.5));
  };

  // Trace d'orbite 3D (amplifiée)
  const N_TRAIL = 240;
  const tg = new THREE.BufferGeometry();
  tg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N_TRAIL * 3), 3));
  const trail = new THREE.Line(tg, mat.trail);
  trail.name = 'trace_orbite';
  trail.position.set(1.12, H, 0);
  trail.frustumCulled = false;
  root.add(trail);

  const ring = add(
    'cadre_orbite',
    new THREE.RingGeometry(0.155, 0.16, 64).rotateY(Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: isLightMode ? 0x94a3b8 : 0x475569, side: THREE.DoubleSide }),
    1.12,
    H,
    0
  );
  add('croix_orbite_h', box(0.002, 0.002, 0.32), ring.material, 1.12, H, 0);
  add('croix_orbite_v', box(0.002, 0.32, 0.002), ring.material, 1.12, H, 0);

  return {
    flow,
    flowAt,
    root,
    H,
    mat,
    base,
    motorSpin,
    orb,
    spin,
    vol,
    volMeshes: mv,
    pipes: [disch, suct],
    setImpeller,
    swirl,
    bubbles,
    trail,
    trailN: N_TRAIL,
    anchors: {
      suct: [1.1, H + 0.14, 0] as [number, number, number],
      disch: [0.64, H + 0.82, 0.2] as [number, number, number],
      imp: [0.64, H - 0.33, 0.12] as [number, number, number]
    }
  };
}

// ---------------------------------------------------------------------------
// MAIN REACT COMPONENT
// ---------------------------------------------------------------------------
export default function PumpFanModule({ theme = 'dark' }: PumpFanModuleProps) {
  // State
  const [rpm, setRpm] = useState<number>(1450);
  const [numBlades, setNumBlades] = useState<number>(6);
  const [orbitType, setOrbitType] = useState<OrbitKey>('direct');
  const [orbitAmp, setOrbitAmp] = useState<number>(4.0);
  const [bodyVib, setBodyVib] = useState<number>(3.0);
  const [hasFlowIssue, setHasFlowIssue] = useState<boolean>(false);
  const [isSeeThrough, setIsSeeThrough] = useState<boolean>(true);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // 3D & 2D canvas refs
  const mountRef = useRef<HTMLDivElement | null>(null);
  const fftCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tag overlay positions
  const [tagPos, setTagPos] = useState<{
    suct: { x: number; y: number; visible: boolean };
    disch: { x: number; y: number; visible: boolean };
    imp: { x: number; y: number; visible: boolean };
  }>({
    suct: { x: 0, y: 0, visible: false },
    disch: { x: 0, y: 0, visible: false },
    imp: { x: 0, y: 0, visible: false },
  });

  const isLight = theme === 'light';

  // Derived frequencies
  const { f, bpf, cpm } = useMemo(() => freqs(rpm, numBlades), [rpm, numBlades]);
  const currentOrbitDef = useMemo(() => ORBITS.find((o) => o.k === orbitType) || ORBITS[0], [orbitType]);

  // Reference container for animation loop
  const simStateRef = useRef({
    rpm,
    numBlades,
    orbitType,
    orbitAmp,
    bodyVib,
    hasFlowIssue,
    isSeeThrough,
  });

  useEffect(() => {
    simStateRef.current = {
      rpm,
      numBlades,
      orbitType,
      orbitAmp,
      bodyVib,
      hasFlowIssue,
      isSeeThrough,
    };
  }, [rpm, numBlades, orbitType, orbitAmp, bodyVib, hasFlowIssue, isSeeThrough]);

  // Camera reset trigger
  const resetCameraRef = useRef<() => void>(() => {});

  // -------------------------------------------------------------------------
  // THREE.JS 3D SCENE SETUP & ANIMATION LOOP
  // -------------------------------------------------------------------------
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 440;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(isLight ? 0xf8fafc : 0x090d16);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI / 2 + 0.05; // Do not go under floor
    controls.minDistance = 0.8;
    controls.maxDistance = 8.0;

    // Lighting
    const amb = new THREE.AmbientLight(isLight ? 0xffffff : 0x94a3b8, isLight ? 0.85 : 0.55);
    scene.add(amb);

    const dir1 = new THREE.DirectionalLight(0xffffff, isLight ? 2.8 : 3.2);
    dir1.position.set(4, 7, 5);
    dir1.castShadow = true;
    dir1.shadow.mapSize.width = 1024;
    dir1.shadow.mapSize.height = 1024;
    scene.add(dir1);

    const dir2 = new THREE.DirectionalLight(0x38bdf8, isLight ? 0.9 : 1.4);
    dir2.position.set(-4, -2, -4);
    scene.add(dir2);

    // Build Pump Model
    const pump = buildPumpModel(isLight);
    pump.setImpeller(numBlades);
    scene.add(pump.root);

    const homeCamera = () => {
      controls.target.set(0.25, pump.H - 0.05, 0);
      camera.position.set(1.9, 1.35, 2.0);
      controls.update();
    };
    resetCameraRef.current = homeCamera;
    homeCamera();

    // Responsive resize
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const ro = new ResizeObserver(handleResize);
    ro.observe(container);

    // Animation loop
    let animId: number;
    let th = 0;
    let t = 0;
    let ti = 0;
    let lastTime = performance.now();
    let currentBlades = numBlades;
    const trailAttr = pump.trail.geometry.attributes.position as THREE.BufferAttribute;
    const vProj = new THREE.Vector3();

    const tick = (now: number) => {
      animId = requestAnimationFrame(tick);

      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      t += dt;

      const st = simStateRef.current;

      // Rebuild impeller if blade count changed
      if (st.numBlades !== currentBlades) {
        currentBlades = st.numBlades;
        pump.setImpeller(currentBlades);
      }

      // Volute transparency toggle
      for (const mesh of pump.volMeshes) {
        mesh.material = st.isSeeThrough ? pump.mat.volute : pump.mat.voluteSolid;
      }

      // Rotation angles
      const rotFreq = st.rpm / 60;
      th += dt * rotFreq * 2 * Math.PI * 0.06;
      pump.spin.rotation.x = th;
      pump.motorSpin.rotation.x = th;

      // Rotor precession orbit
      let [oy, oz] = orbitOffset(st.orbitType, th, st.numBlades, t);
      if (st.hasFlowIssue) {
        oy += 0.25 * Math.sin(t * 41) * Math.sin(t * 13);
        oz += 0.25 * Math.cos(t * 37) * Math.sin(t * 17);
      }
      const kDisp = 0.0035 * st.orbitAmp;
      pump.orb.position.set(0, pump.H + oy * kDisp, oz * kDisp);
      pump.orb.rotation.set(0, -oz * kDisp * 0.6, oy * kDisp * 0.6);

      // Orbit trail recording
      for (let i = 0; i < 3; i++) {
        trailAttr.setXYZ(
          ti % pump.trailN,
          0,
          oy * 0.035 * Math.min(st.orbitAmp, 4.5),
          oz * 0.035 * Math.min(st.orbitAmp, 4.5)
        );
        ti++;
      }
      for (let i = 0; i < pump.trailN; i++) {
        if (ti < pump.trailN && i >= ti) {
          trailAttr.setXYZ(
            i,
            0,
            trailAttr.getY((ti - 1 + pump.trailN) % pump.trailN),
            trailAttr.getZ((ti - 1 + pump.trailN) % pump.trailN)
          );
        }
      }
      trailAttr.needsUpdate = true;
      pump.trail.visible = st.orbitType !== 'none' || st.hasFlowIssue;

      // Casing / body vibration at blade pass
      const bodyA = 0.0011 * st.bodyVib * (st.orbitType === 'gmf' ? 1.8 : 1) + (st.hasFlowIssue ? 0.0025 * Math.random() : 0);
      pump.vol.position.y = pump.H + bodyA * Math.sin(st.numBlades * th * 4);
      pump.vol.position.z = bodyA * 0.6 * Math.cos(st.numBlades * th * 4);

      // Fluid flow particles animation
      const flowSpeed = 0.12 * (st.rpm / 1450) * (st.hasFlowIssue ? 0.65 : 1);
      for (const pMesh of pump.flow) {
        const u = pMesh.userData;
        u.s = (u.s + dt * flowSpeed) % 1;
        pump.flowAt(u.s, u.a0 + (st.hasFlowIssue ? Math.sin(t * 9 + u.j * 7) * 0.6 : 0), u.j, pMesh.position);
        if (st.hasFlowIssue && u.s > 0.75) {
          pMesh.position.z += 0.025 * Math.sin(t * 30 + u.j * 9);
          pMesh.position.x += 0.02 * Math.cos(t * 27 + u.j * 5);
        }
      }

      // Cavitation bubbles animation
      pump.swirl.rotation.x = th * 0.8;
      for (const b of pump.bubbles) {
        const u = b.userData;
        if (!st.hasFlowIssue) {
          b.visible = false;
          continue;
        }
        u.life += dt * (1.3 + u.j);
        if (!u.init || u.life > 1) {
          u.init = true;
          u.life = 0;
          u.j = Math.random();
          const r = 0.05 + Math.random() * 0.16;
          const a = Math.random() * 6.28;
          b.position.set(-0.03 + Math.random() * 0.1, r * Math.cos(a), r * Math.sin(a));
        }
        const s = u.life < 0.8 ? 0.004 + 0.012 * (u.life / 0.8) : 0.016 * (1 - (u.life - 0.8) / 0.2) * 1.4;
        b.scale.setScalar(Math.max(s, 0.001));
        b.visible = true;
      }

      controls.update();
      renderer.render(scene, camera);

      // Project 3D tags
      const w = container.clientWidth;
      const h = container.clientHeight;
      const projectAnchor = (coord: [number, number, number]) => {
        vProj.set(...coord).project(camera);
        return {
          x: ((vProj.x + 1) / 2) * w,
          y: ((1 - vProj.y) / 2) * h,
          visible: vProj.z < 1
        };
      };

      setTagPos({
        suct: projectAnchor(pump.anchors.suct),
        disch: projectAnchor(pump.anchors.disch),
        imp: projectAnchor(pump.anchors.imp)
      });
    };

    animId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [isLight]);

  // -------------------------------------------------------------------------
  // 2D FFT SPECTRUM RENDER LOOP
  // -------------------------------------------------------------------------
  useEffect(() => {
    const canvas = fftCanvasRef.current;
    if (!canvas) return;

    let animId: number;
    let t = 0;
    let last = performance.now();

    const renderFFT = (now: number) => {
      animId = requestAnimationFrame(renderFFT);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      t += dt;

      const dpr = window.devicePixelRatio || 1;
      const W = canvas.clientWidth;
      const H = canvas.clientHeight || 280;

      if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
        canvas.width = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      const S = calcSpectrum({
        rpm,
        B: numBlades,
        orbit: orbitType,
        amp: orbitAmp,
        body: bodyVib,
        cav: hasFlowIssue
      });

      const L = 16;
      const R = W - 16;
      const T = 24;
      const B = H - 32;

      const fx = (freq: number) => L + (freq / S.fmax) * (R - L);
      const top = 4.2;
      const fy = (a: number) => B - (Math.min(a, top) / top) * (B - T);

      // Grid
      ctx.strokeStyle = isLight ? '#f1f5f9' : '#1e293b';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 10; i++) {
        const X = L + (i * (R - L)) / 10;
        ctx.beginPath();
        ctx.moveTo(X, T);
        ctx.lineTo(X, B);
        ctx.stroke();
      }
      for (let i = 0; i <= 5; i++) {
        const Y = T + (i * (B - T)) / 5;
        ctx.beginPath();
        ctx.moveTo(L, Y);
        ctx.lineTo(R, Y);
        ctx.stroke();
      }

      // Baseline
      ctx.strokeStyle = isLight ? '#cbd5e1' : '#475569';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(L, B);
      ctx.lineTo(R, B);
      ctx.stroke();

      // Frequency X-axis graduations
      ctx.fillStyle = isLight ? '#64748b' : '#94a3b8';
      ctx.font = 'bold 10px ui-monospace, Menlo, monospace';
      for (let k = 0; k <= 4; k++) {
        const freqVal = (k * S.bpf) / 2;
        const X = fx(freqVal);
        ctx.beginPath();
        ctx.moveTo(X, B);
        ctx.lineTo(X, B + 4);
        ctx.stroke();
        ctx.textAlign = k === 0 ? 'left' : 'center';
        ctx.fillText(`${Math.round(freqVal)} Hz`, X, B + 16);
      }

      // Cavitation noise floor and broadband rise
      ctx.strokeStyle = hasFlowIssue ? '#f87171' : (isLight ? '#e2e8f0' : '#334155');
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (let i = 0; i <= 400; i++) {
        const fIter = (i / 400) * S.fmax;
        const Y = fy(calcNoiseAt(fIter, S.bpf, hasFlowIssue, t));
        if (i === 0) ctx.moveTo(fx(fIter), Y);
        else ctx.lineTo(fx(fIter), Y);
      }
      ctx.stroke();

      if (hasFlowIssue) {
        const cavEndX = fx(S.bpf * 0.85);
        ctx.fillStyle = isLight ? 'rgba(239, 68, 68, 0.08)' : 'rgba(239, 68, 68, 0.16)';
        ctx.fillRect(L, T, cavEndX - L, B - T);
        ctx.fillStyle = '#ef4444';
        ctx.textAlign = 'left';
        ctx.font = 'bold 10px ui-monospace, Menlo, monospace';
        ctx.fillText('▲ Bruit large bande (Cavitation & Turbulence)', L + 8, T + 14);
      }

      // Discrete peaks
      const colMap = {
        rpm: '#2563eb', // Blue
        sub: '#10b981', // Emerald
        bpf: '#dc2626', // Red
        sb: '#38bdf8'   // Sky blue
      };

      for (const q of S.P) {
        const X = fx(q.f);
        const dynamicAmp = q.a + (hasFlowIssue ? 0.05 * Math.sin(t * 9 + q.f) : 0);
        const Y = fy(dynamicAmp);
        const isSb = q.kind === 'sb';
        const lineCol = colMap[q.kind];

        ctx.strokeStyle = lineCol;
        ctx.lineWidth = isSb ? 1.4 : 2.2;
        ctx.beginPath();
        ctx.moveTo(X, B);
        ctx.lineTo(X, Y);
        ctx.stroke();

        ctx.fillStyle = lineCol;
        ctx.beginPath();
        ctx.arc(X, Y, isSb ? 2.5 : 4, 0, Math.PI * 2);
        ctx.fill();

        if (q.label) {
          ctx.fillStyle = isLight ? '#0f172a' : '#f8fafc';
          ctx.textAlign = 'center';
          ctx.font = 'bold 10px ui-monospace, Menlo, monospace';
          ctx.fillText(q.label, X, Y - 10);
        }
      }
    };

    animId = requestAnimationFrame(renderFFT);
    return () => cancelAnimationFrame(animId);
  }, [rpm, numBlades, orbitType, orbitAmp, bodyVib, hasFlowIssue, isLight]);

  // Fullscreen container handler
  const handleToggleFullscreen = () => {
    if (!mountRef.current?.parentElement) return;
    const vp = mountRef.current.parentElement;
    if (!document.fullscreenElement) {
      vp.requestFullscreen().then(() => setIsExpanded(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsExpanded(false)).catch(() => {});
    }
  };

  return (
    <div className={`space-y-6 max-w-7xl mx-auto transition-colors duration-200 ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
      
      {/* Intro Hero Card */}
      <div className={`p-5 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm ${
        isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0D1322] border-slate-800 text-slate-200'
      }`}>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Wind className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black tracking-tight uppercase">
                Pompes Centrifuges & Ventilateurs 3D
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 font-bold">
                BPF & Turbulences
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Les turbomachines génèrent une vibration caractéristique liée au refoulement des fluides, appelée{' '}
              <strong>Fréquence de passage des aubes (BPF — Blade Pass Frequency)</strong>. Ajustez la vitesse et le nombre d'aubes pour observer la cinématique de refoulement, les orbites de précession et le plancher de bruit en cas de cavitation.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto shrink-0 font-mono text-xs">
          <span className={`px-3 py-1.5 rounded-lg border font-bold ${
            isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-900/60 border-slate-700 text-slate-300'
          }`}>
            BPF = B × (N / 60)
          </span>
        </div>
      </div>

      {/* Main Grid: Controls + 3D Viewport */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Turbine Geometry & Calculations (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Card 1: Rotor Geometry */}
          <div className={`p-5 rounded-2xl border space-y-4 shadow-sm ${
            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0D1322] border-slate-800 text-slate-200'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800 border-slate-100">
              <span className="text-xs font-black tracking-wider uppercase flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <Sliders className="w-4 h-4" />
                Géométrie de la Turbine
              </span>
              <span className="text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400">
                {rpm} RPM ({f.toFixed(1)} Hz)
              </span>
            </div>

            {/* RPM Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-600 dark:text-slate-400">Vitesse du Rotor</span>
                <span className="font-mono font-bold">{rpm} tr/min</span>
              </div>
              <input
                type="range"
                min="300"
                max="3600"
                step="10"
                value={rpm}
                onChange={(e) => setRpm(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>300 RPM</span>
                <span>1450 (Nominal)</span>
                <span>3600 RPM</span>
              </div>
            </div>

            {/* Blades Input */}
            <div className="space-y-2 pt-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-600 dark:text-slate-400">Nombre d'aubes / ailettes (B)</span>
                <span className="font-mono font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  {numBlades} aubes
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="2"
                  max="12"
                  step="1"
                  value={numBlades}
                  onChange={(e) => setNumBlades(Number(e.target.value))}
                  className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer accent-blue-600"
                />
                <input
                  type="number"
                  min="2"
                  max="12"
                  value={numBlades}
                  onChange={(e) => setNumBlades(Math.min(12, Math.max(2, Math.round(Number(e.target.value) || 6))))}
                  className={`w-14 px-2 py-1 text-center font-mono font-bold text-xs rounded-lg border ${
                    isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-700 text-slate-100'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Card 2: Turbomachine Frequency Calculation */}
          <div className={`p-5 rounded-2xl border space-y-3 shadow-sm ${
            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0D1322] border-slate-800 text-slate-200'
          }`}>
            <span className="text-xs font-black tracking-wider uppercase flex items-center gap-2 text-blue-600 dark:text-blue-400 border-b pb-3 dark:border-slate-800 border-slate-100">
              <Activity className="w-4 h-4" />
              Calcul Fréquence Turbine
            </span>

            <div className="space-y-2.5 font-mono text-xs">
              <div className="flex justify-between items-center py-1 border-b dark:border-slate-800/60 border-slate-100">
                <span className="text-slate-500 dark:text-slate-400">Fréq. Rotation Arbre (1x)</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">{f.toFixed(1)} Hz</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b dark:border-slate-800/60 border-slate-100">
                <span className="text-slate-500 dark:text-slate-400">Passage Aubes (BPF)</span>
                <span className="font-bold text-red-600 dark:text-red-400">
                  {bpf.toFixed(1)} Hz <span className="text-[10px] text-slate-400">({Math.round(cpm)} CPM)</span>
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500 dark:text-slate-400">Harmonique 2x BPF</span>
                <span className="font-bold text-red-600 dark:text-red-400">{(2 * bpf).toFixed(1)} Hz</span>
              </div>
            </div>
          </div>

          {/* Card 3: Cavitation / Perturbation Injector */}
          <div className={`p-5 rounded-2xl border space-y-4 shadow-sm ${
            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0D1322] border-slate-800 text-slate-200'
          }`}>
            <span className="text-xs font-black tracking-wider uppercase block border-b pb-3 dark:border-slate-800 border-slate-100">
              Injecteur de Perturbation / Cavitation
            </span>

            <div className="space-y-2">
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                <strong>Recyclage / Turbulence de flux (Cavitation) :</strong> Provoque des chocs hydrauliques désordonnés, des implosions de bulles et de l'instabilité de refoulement.
              </p>

              <button
                onClick={() => setHasFlowIssue(!hasFlowIssue)}
                className={`w-full py-3 px-4 rounded-xl text-xs font-black tracking-wide uppercase transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm ${
                  hasFlowIssue
                    ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30'
                    : isLight
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                }`}
              >
                <Zap className={`w-4 h-4 ${hasFlowIssue ? 'animate-bounce' : ''}`} />
                <span>{hasFlowIssue ? 'Désactiver Perturbation' : 'Activer Perturbation'}</span>
              </button>
            </div>
          </div>

        </div>

        {/* Right Column: 3D Banc & Precession Controls (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Card: 3D Viewport */}
          <div className={`rounded-2xl border overflow-hidden shadow-md flex flex-col ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#0D1322] border-slate-800'
          }`}>
            
            {/* Viewport Window */}
            <div className="relative h-[440px] w-full bg-slate-900 overflow-hidden select-none">
              <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

              {/* Projected 3D Tags */}
              <div className="absolute inset-0 pointer-events-none">
                {tagPos.suct.visible && (
                  <div
                    style={{ left: `${tagPos.suct.x}px`, top: `${tagPos.suct.y}px` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 font-mono font-bold text-[10px] px-2 py-0.5 rounded shadow border bg-white/90 text-slate-800 border-slate-300 dark:bg-slate-900/90 dark:text-slate-100 dark:border-slate-700"
                  >
                    Aspiration
                  </div>
                )}
                {tagPos.disch.visible && (
                  <div
                    style={{ left: `${tagPos.disch.x}px`, top: `${tagPos.disch.y}px` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 font-mono font-bold text-[10px] px-2 py-0.5 rounded shadow border bg-white/90 text-slate-800 border-slate-300 dark:bg-slate-900/90 dark:text-slate-100 dark:border-slate-700"
                  >
                    Refoulement
                  </div>
                )}
                {tagPos.imp.visible && (
                  <div
                    style={{ left: `${tagPos.imp.x}px`, top: `${tagPos.imp.y}px` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 font-mono font-bold text-[10px] px-2 py-0.5 rounded shadow border bg-white/90 text-slate-800 border-slate-300 dark:bg-slate-900/90 dark:text-slate-100 dark:border-slate-700"
                  >
                    Roue ({numBlades} aubes)
                  </div>
                )}
              </div>

              {/* Top Left Badge */}
              <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1 rounded-lg backdrop-blur-md border text-[11px] font-mono font-bold tracking-wide shadow-md bg-white/90 border-slate-200 text-slate-800 dark:bg-slate-900/90 dark:border-slate-700 dark:text-slate-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                TURBOMACHINE 3D INTERACTIVE
              </div>

              {/* Cavitation Alert Banner */}
              {hasFlowIssue && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg border animate-bounce bg-red-500/95 border-red-400 text-white">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Cavitation active : implosion de bulles à l'œil de roue</span>
                </div>
              )}

              {/* Viewport Control Buttons */}
              <div className="absolute top-3 right-3 flex items-center gap-2">
                <button
                  onClick={() => setIsSeeThrough(!isSeeThrough)}
                  title={isSeeThrough ? 'Volute opaque' : 'Vue en coupe (volute transparente)'}
                  className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all cursor-pointer shadow-md ${
                    isSeeThrough
                      ? 'bg-emerald-600 border-emerald-500 text-white'
                      : isLight
                        ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Eye className="w-4 h-4" />
                </button>

                <button
                  onClick={() => resetCameraRef.current()}
                  title="Réinitialiser la vue de la caméra"
                  className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all cursor-pointer shadow-md ${
                    isLight
                      ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  onClick={handleToggleFullscreen}
                  title="Plein écran"
                  className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all cursor-pointer shadow-md ${
                    isLight
                      ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Controls Toolbar under 3D */}
            <div className="p-5 space-y-5">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Precession Orbit Selector */}
                <div className="space-y-2">
                  <span className="text-[11px] font-black tracking-wider uppercase text-slate-500 dark:text-slate-400 block">
                    Type d'orbite de précession (3D)
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {ORBITS.map((orb) => (
                      <button
                        key={orb.k}
                        onClick={() => setOrbitType(orb.k)}
                        className={`px-3 py-2 rounded-xl text-left text-xs font-bold border transition-all cursor-pointer ${
                          orbitType === orb.k
                            ? 'bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-600/20'
                            : isLight
                              ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                              : 'bg-slate-900/60 hover:bg-slate-800 text-slate-300 border-slate-800'
                        }`}
                      >
                        {orb.n}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Precession & Vibration Sliders */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-600 dark:text-slate-400">
                        Amplification de l'Orbite (Précession)
                      </span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {orbitAmp.toFixed(1)}x
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="8"
                      step="0.1"
                      value={orbitAmp}
                      onChange={(e) => setOrbitAmp(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer accent-emerald-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-600 dark:text-slate-400">
                        Vibration du Corps (Volute/Châssis)
                      </span>
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                        {bodyVib.toFixed(1)}x
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="6"
                      step="0.1"
                      value={bodyVib}
                      onChange={(e) => setBodyVib(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer accent-blue-600"
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic Physical Explanation */}
              <div className={`p-4 rounded-xl border text-xs leading-relaxed ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-900/50 border-slate-800 text-slate-300'
              }`}>
                <strong className="text-slate-900 dark:text-slate-100">{currentOrbitDef.t} :</strong>{' '}
                {currentOrbitDef.d}
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* Bottom Section: Dynamic High-Precision Spectrum Plot */}
      <div className={`p-5 rounded-2xl border space-y-4 shadow-sm ${
        isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0D1322] border-slate-800 text-slate-200'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-3 dark:border-slate-800 border-slate-100">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-black tracking-tight uppercase">
              Spectre Turbine : BPF et Bruit Hydraulique
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
              BPF = {bpf.toFixed(1)} Hz
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              1x = {f.toFixed(1)} Hz
            </span>
          </div>
        </div>

        {/* Canvas FFT Plot */}
        <div className={`w-full h-80 rounded-xl overflow-hidden border relative ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#090D16] border-slate-800'
        }`}>
          <canvas ref={fftCanvasRef} className="w-full h-full block" />
        </div>

        {/* Diagnostic Guide */}
        <div className={`p-4 rounded-xl border text-xs space-y-2 ${
          isLight ? 'bg-blue-50/60 border-blue-200 text-slate-700' : 'bg-blue-950/20 border-blue-900/40 text-slate-300'
        }`}>
          <h4 className="font-black uppercase tracking-wider text-[11px] flex items-center gap-1.5 text-blue-800 dark:text-blue-300">
            <HelpCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Interprétation des défauts hydrauliques :
          </h4>
          <p className="leading-relaxed">
            • <strong>BPF (Blade Pass Frequency) :</strong> Est toujours présente à amplitude modérée dans une pompe saine. Une augmentation majeure de l'amplitude BPF et de ses harmoniques indique un <strong>obstacle à l'aspiration ou au refoulement</strong>, ou un jeu excentrique dans le corps.
          </p>
          <p className="leading-relaxed">
            • <strong>Cavitation & Turbulence :</strong> Génère des vibrations aléatoires se manifestant par une <strong>hausse brutale du bruit de fond</strong> (notamment basse fréquence), agissant comme des bulles de gaz implosant contre les aubes.
          </p>
        </div>

      </div>

    </div>
  );
}
