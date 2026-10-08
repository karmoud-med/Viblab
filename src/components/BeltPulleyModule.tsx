import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { 
  Activity, 
  AlertTriangle, 
  Disc, 
  Settings, 
  Zap, 
  Sliders, 
  Radio, 
  RotateCcw,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  Layers,
  Flame,
  HelpCircle,
  TrendingUp,
  Volume2,
  Eye,
  EyeOff,
  CheckCircle2
} from 'lucide-react';

interface BeltPulleyModuleProps {
  theme: 'dark' | 'light' | 'mono';
}

// -------------------------------------------------------------
// SENSORS SPECIFICATIONS
// -------------------------------------------------------------
interface SensorDef {
  id: string;
  side: 'P' | 'S'; // P = Primary (Motor), S = Secondary (Driven)
  d: 'V' | 'H' | 'A'; // Vertical, Horizontal, Axial
  label: string;
  shortLabel: string;
}

const SENSORS: SensorDef[] = [
  { id: 'PRV', side: 'P', d: 'V', label: 'Moteur DE (RV) - Palier conducteur radial vertical', shortLabel: 'Moteur RV' },
  { id: 'PRH', side: 'P', d: 'H', label: 'Moteur DE (RH) - Palier conducteur radial horizontal', shortLabel: 'Moteur RH' },
  { id: 'PAX', side: 'P', d: 'A', label: 'Moteur NDE (AX) - Palier conducteur axial', shortLabel: 'Moteur AX' },
  { id: 'SRV', side: 'S', d: 'V', label: 'Récepteur DE (RV) - Palier récepteur radial vertical', shortLabel: 'Récepteur RV' },
  { id: 'SRH', side: 'S', d: 'H', label: 'Récepteur DE (RH) - Palier récepteur radial horizontal', shortLabel: 'Récepteur RH' },
  { id: 'SAX', side: 'S', d: 'A', label: 'Récepteur NDE (AX) - Palier récepteur axial', shortLabel: 'Récepteur AX' },
];

const byId = Object.fromEntries(SENSORS.map((s) => [s.id, s]));

// -------------------------------------------------------------
// MATHEMATICAL & PHYSICAL ENGINE FOR BELT TRANSMISSION
// -------------------------------------------------------------
interface BeltParams {
  n1: number; // Driver RPM
  d1: number; // Driver diameter (mm)
  d2: number; // Driven diameter (mm)
  c: number;  // Center distance (mm)
  t: number;  // Tension (N)
  m: number;  // Linear density (kg/m)
}

interface BeltPhysicsResult {
  f1: number;
  n2: number;
  f2: number;
  v: number;
  L: number;
  fb: number;
  span: number;
  fn: number;
  hits: string[];
  isResonant: boolean;
  amplification: number;
}

function calculateBeltPhysics(p: BeltParams): BeltPhysicsResult {
  const d1 = p.d1 / 1000;
  const d2 = p.d2 / 1000;
  const C = p.c / 1000;

  const f1 = p.n1 / 60;
  const n2 = (p.n1 * p.d1) / p.d2;
  const f2 = n2 / 60;
  const v = Math.PI * d1 * f1;
  const L = 2 * C + (Math.PI * (d1 + d2)) / 2 + (d2 - d1) ** 2 / (4 * C);
  const fb = v / L;
  const span = Math.sqrt(Math.max(C * C - ((d2 - d1) / 2) ** 2, 1e-6));
  const fn = Math.sqrt(p.t / p.m) / (2 * span);

  const near = (f: number) => Math.abs(f - fn) / fn < 0.06;
  const hits: string[] = [];
  if (near(f1)) hits.push('1x RPM moteur');
  if (near(f2)) hits.push('1x RPM récepteur');
  for (let k = 1; k <= 4; k++) {
    if (near(k * fb)) hits.push(`${k}x f_b (harmonique courroie)`);
  }

  const isResonant = hits.length > 0;
  // Calculate resonant Q-factor
  let minDiff = 1.0;
  const testFreqs = [f1, f2, fb, 2 * fb, 3 * fb, 4 * fb];
  testFreqs.forEach((f) => {
    const d = Math.abs(f - fn) / fn;
    if (d < minDiff) minDiff = d;
  });
  const amplification = 1 + 5.5 / (1 + (minDiff / 0.04) ** 2);

  return { f1, n2, f2, v, L, fb, span, fn, hits, isResonant, amplification };
}

interface BeltSeverities {
  wear: number;     // 0 to 1
  ecc: number;      // 0 to 1
  mis: number;      // 0 to 1
  misType: 'par' | 'ang';
}

interface SpectrumPeak {
  f: number;
  a: number;
  label: string;
  kind: 'rpm' | 'rpm2' | 'belt';
}

function calculateSpectrum(
  sensorId: string, 
  ph: BeltPhysicsResult, 
  sev: BeltSeverities
): SpectrumPeak[] {
  const s = byId[sensorId] || SENSORS[0];
  const own = s.side === 'P' ? ph.f1 : ph.f2;
  const other = s.side === 'P' ? ph.f2 : ph.f1;
  const radial = s.d !== 'A';
  const dirK = s.d === 'H' ? 1.0 : s.d === 'V' ? 0.65 : 0.3;

  const res = (f: number) => (radial ? 1 + 4.2 / (1 + ((f - ph.fn) / (0.05 * ph.fn)) ** 2) : 1);
  const P: SpectrumPeak[] = [];
  const push = (f: number, a: number, label: string, kind: 'rpm' | 'rpm2' | 'belt') => {
    if (f > 0 && a > 0.02) P.push({ f, a: a * res(f), label, kind });
  };

  const ownL = s.side === 'P' ? 'RPM1' : 'RPM2';
  const othL = s.side === 'P' ? 'RPM2' : 'RPM1';

  // Rotation 1x + Pulley Eccentricity
  push(own, radial ? (0.4 + 4.5 * sev.ecc) * dirK : 0.25, `1x ${ownL}`, 'rpm');
  push(other, radial ? (0.2 + 2.0 * sev.ecc) * dirK : 0.12, `1x ${othL}`, 'rpm2');

  // Misalignment : axial / radial
  if (!radial) {
    const k = sev.misType === 'ang' ? 5.5 : 2.5;
    if (P[0]) P[0].a += k * sev.mis;
    if (P[1]) P[1].a += (sev.misType === 'par' ? 2.8 : 1.2) * sev.mis;
    push(2 * own, (sev.misType === 'ang' ? 1.8 : 0.6) * sev.mis, `2x ${ownL}`, 'rpm');
  } else {
    push(2 * own, 0.12 + 0.9 * sev.mis * dirK, `2x ${ownL}`, 'rpm');
  }

  // Belt Defect harmonics (1x fb, 2x fb, 3x fb, 4x fb)
  const w = [0.8, 1.2, 0.7, 0.45];
  for (let k = 1; k <= 4; k++) {
    push(k * ph.fb, (0.08 + 3.2 * sev.wear) * w[k - 1] * (radial ? dirK : 0.35), `${k}x f_b`, 'belt');
  }

  return P;
}

const noiseFloor = (f: number) => 0.04 + 0.03 * Math.abs(Math.sin(f * 1.7) * Math.cos(f * 0.31 + 1.3));

// -------------------------------------------------------------
// THREE.JS 3D EQUIPMENT MODEL FOR BELT & PULLEYS
// -------------------------------------------------------------
interface BeltLoopGeometry {
  L: number;
  at: (s: number, out?: THREE.Vector3) => THREE.Vector3;
  pts: THREE.Vector3[];
}

function calculateBeltLoop(
  x1: number, 
  x2: number, 
  H: number, 
  r1: number, 
  r2: number, 
  n = 360
): BeltLoopGeometry {
  const C = x2 - x1;
  const a = Math.asin((r2 - r1) / C);
  const tu = Math.PI / 2 + a;
  const segs: Array<{ type: 'arc' | 'line'; cx?: number; r?: number; a0?: number; a1?: number; p0?: THREE.Vector2; p1?: THREE.Vector2; len: number }> = [];

  // Arc Pulley 2
  segs.push({ type: 'arc', cx: x2, r: r2, a0: tu, a1: -tu, len: r2 * 2 * tu });
  const p = (cx: number, r: number, t: number) => new THREE.Vector2(cx + r * Math.cos(t), H + r * Math.sin(t));
  const A = p(x2, r2, -tu);
  const B = p(x1, r1, -tu);
  segs.push({ type: 'line', p0: A, p1: B, len: A.distanceTo(B) });

  // Arc Pulley 1
  segs.push({ type: 'arc', cx: x1, r: r1, a0: -tu, a1: tu - 2 * Math.PI, len: r1 * (2 * Math.PI - 2 * tu) });
  const Cc = p(x1, r1, tu);
  const D = p(x2, r2, tu);
  segs.push({ type: 'line', p0: Cc, p1: D, len: Cc.distanceTo(D) });

  const L = segs.reduce((s, g) => s + g.len, 0);

  const at = (s: number, out = new THREE.Vector3()) => {
    s = ((s % L) + L) % L;
    for (const g of segs) {
      if (s <= g.len) {
        const u = s / g.len;
        if (g.type === 'arc' && g.cx !== undefined && g.r !== undefined && g.a0 !== undefined && g.a1 !== undefined) {
          const t = g.a0 + (g.a1 - g.a0) * u;
          return out.set(g.cx + g.r * Math.cos(t), H + g.r * Math.sin(t), 0);
        }
        if (g.p0 && g.p1) {
          return out.set(g.p0.x + (g.p1.x - g.p0.x) * u, g.p0.y + (g.p1.y - g.p0.y) * u, 0);
        }
      }
      s -= g.len;
    }
    return out;
  };

  const pts: THREE.Vector3[] = [];
  for (let i = 0; i < n; i++) pts.push(at((i / n) * L));
  return { L, at, pts };
}

function buildBelt3D(prm: BeltParams, isLightMode: boolean) {
  const M = (name: string, color: number, rough = 0.55, metal = 0.25, emissive?: number) => {
    const m = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });
    if (emissive) {
      m.emissive = new THREE.Color(emissive);
      m.emissiveIntensity = 1.0;
    }
    m.name = name;
    return m;
  };

  const mat = {
    skid: M('socle_acier', isLightMode ? 0x94a3b8 : 0x334155, 0.55, 0.3),
    body: M('carter_gris', isLightMode ? 0x64748b : 0x475569, 0.5, 0.25),
    dark: M('fonte', isLightMode ? 0x475569 : 0x1e293b, 0.45, 0.3),
    steel: M('acier_arbre', isLightMode ? 0xcbd5e1 : 0x64748b, 0.3, 0.45),
    pulley: M('poulie_fonte', isLightMode ? 0xdbe3ee : 0x64748b, 0.35, 0.35),
    pulleyWeb: M('voile_poulie', isLightMode ? 0x94a3b8 : 0x475569, 0.5, 0.2),
    belt: M('courroie_caoutchouc', 0x111827, 0.85, 0),
    marker: M('repere_rouge', 0xef4444, 0.4, 0, 0xef4444),
    sensor: M('capteur', isLightMode ? 0x334155 : 0x64748b, 0.4, 0.3),
    sel: M('capteur_selection', 0x2563eb, 0.35, 0.1, 0x2563eb),
    resonanceWave: M('onde_resonance', 0xef4444, 0.3, 0, 0xef4444),
    misalignmentHighlight: M('surbrillance_desalignement', 0xf59e0b, 0.3, 0, 0xf59e0b)
  };

  const r1 = prm.d1 / 2000;
  const r2 = prm.d2 / 2000;
  const C = prm.c / 1000;
  const H = 0.34;
  const x1 = -C / 2;
  const x2 = C / 2;

  const root = new THREE.Group();
  root.name = 'transmission_poulie_courroie';

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
  const cylZ = (r: number, len: number, seg = 48) => new THREE.CylinderGeometry(r, r, len, seg).rotateX(Math.PI / 2);

  // Concrete / Steel Skid Base
  add('socle', box(C + Math.max(r2, 0.12) + 0.55, 0.06, 0.62), mat.skid, (x1 + x2) / 2 + 0.03, 0.03, -0.17);

  // Moteur Conducteur (Driver Motor)
  const motor = grp('moteur', x1, H, 0);
  add('carcasse', cylZ(0.11, 0.3, 64), mat.body, 0, 0, -0.23, motor);
  for (let i = 0; i < 7; i++) {
    add('ailette_' + i, cylZ(0.122, 0.012, 48), mat.body, 0, 0, -0.12 - i * 0.04, motor);
  }
  add('flasque_DE', cylZ(0.1, 0.03), mat.dark, 0, 0, -0.075, motor);
  add('capot_ventilateur', cylZ(0.105, 0.06), mat.body, 0, 0, -0.41, motor);
  add('boite_bornes', box(0.09, 0.06, 0.1), mat.body, 0, 0.14, -0.23, motor);
  for (const z of [-0.14, -0.32]) {
    add('patte', box(0.2, H - 0.06 - 0.05, 0.04), mat.body, 0, 0.06 + (H - 0.11) / 2 - H, z, motor);
  }
  add('arbre_moteur', cylZ(0.019, 0.12), mat.steel, 0, 0, -0.03, motor);

  // Récepteur : arbre + 2 paliers à chapeau (Driven Machine)
  const recv = grp('recepteur', x2, H, 0);
  add('arbre_recepteur', cylZ(0.022, 0.42), mat.steel, 0, 0, -0.18, recv);
  for (const [n, z] of [['palier_avant', -0.1], ['palier_arriere', -0.3]] as const) {
    add(n + '_corps', cylZ(0.055, 0.07), mat.body, 0, 0, z, recv);
    add(n + '_semelle', box(0.2, 0.03, 0.07), mat.body, 0, -0.055, z, recv);
    add(n + '_support', box(0.1, H - 0.06 - 0.07, 0.06), mat.dark, 0, -(H - 0.06 - 0.07) / 2 - 0.07, z, recv);
  }

  // Poulies réalistes (Pulleys with machined trapezoidal V-groove and spokes)
  const pulley = (name: string, x: number, r: number) => {
    const mount = grp(name, x, H, 0);
    const spin = grp(name + '_rot', 0, 0, 0, mount);
    const w = 0.04;
    const prof = [
      [r * 0.84, -w / 2],
      [r, -w / 2],
      [r, -0.009],
      [r - 0.016, -0.004],
      [r - 0.016, 0.004],
      [r, 0.009],
      [r, w / 2],
      [r * 0.84, w / 2],
      [r * 0.84, -w / 2]
    ].map(([a, b]) => new THREE.Vector2(a, b));

    add('jante', new THREE.LatheGeometry(prof, 96).rotateX(Math.PI / 2), mat.pulley, 0, 0, 0, spin);
    add('moyeu', cylZ(Math.max(r * 0.22, 0.03), 0.05), mat.pulley, 0, 0, 0, spin);
    add('voile', cylZ(r * 0.84, 0.006, 64), mat.pulleyWeb, 0, 0, -0.008, spin);

    for (let i = 0; i < 4; i++) {
      const sp = add('rayon_' + i, box(r * 0.84 - 0.02, 0.014, 0.016), mat.pulley, 0, 0, 0, spin);
      const t = (i * Math.PI) / 2;
      sp.position.set(Math.cos(t) * r * 0.44, Math.sin(t) * r * 0.44, 0.004);
      sp.rotation.z = t;
    }
    return { mount, spin };
  };

  const p1 = pulley('poulie_conductrice', x1, r1);
  const p2 = pulley('poulie_receptrice', x2, r2);

  // Courroie continue (Continuous 3D Rubber V-Belt)
  const loop = calculateBeltLoop(x1, x2, H, r1 - 0.008, r2 - 0.008);
  const curve = new THREE.CatmullRomCurve3(loop.pts, true);
  const belt = add('courroie', new THREE.TubeGeometry(curve, 400, 0.0085, 12, true), mat.belt, 0, 0, 0);

  // Red movement tracking markers on belt
  const markers = [0, 0.25, 0.5, 0.75].map((_, i) =>
    add('repere_courroie_' + i, new THREE.SphereGeometry(0.012, 20, 12), mat.marker, 0, 0, 0)
  );

  // 3D Misalignment visual torus/stress indicator around driven pulley
  const misHighlight = add(
    'indicateur_desalignement',
    new THREE.TorusGeometry(r2 + 0.02, 0.008, 16, 48),
    new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xf59e0b,
      emissiveIntensity: 1.2,
      transparent: true,
      opacity: 0.85
    }),
    0, 0, 0,
    p2.mount
  );
  misHighlight.visible = false;

  // 3D Transverse Belt Span Resonance Wave Rings (Pulsating at the free belt span)
  const spanMidX = (x1 + x2) / 2;
  const resWaveGroup = grp('ondes_resonance_courroie', spanMidX, H + (r1 + r2) / 2 + 0.04, 0);
  const ringGeo1 = new THREE.RingGeometry(0.06, 0.08, 32);
  const ringGeo2 = new THREE.RingGeometry(0.12, 0.14, 32);
  const ringGeo3 = new THREE.RingGeometry(0.18, 0.20, 32);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide, transparent: true, opacity: 0.85 });
  const rw1 = add('onde_1', ringGeo1, ringMat.clone(), 0, 0, 0, resWaveGroup); rw1.rotation.x = Math.PI / 2;
  const rw2 = add('onde_2', ringGeo2, ringMat.clone(), 0, 0.02, 0, resWaveGroup); rw2.rotation.x = Math.PI / 2;
  const rw3 = add('onde_3', ringGeo3, ringMat.clone(), 0, 0.04, 0, resWaveGroup); rw3.rotation.x = Math.PI / 2;
  resWaveGroup.visible = false;

  // Capteurs Accéléromètres orthogonaux (6 Sensors: PRV, PRH, PAX, SRV, SRH, SAX)
  const sensors: Record<string, { g: THREE.Group; body: THREE.Mesh }> = {};
  const place: [string, [number, number, number], [number, number, number], THREE.Group][] = [
    ['PRV', [x1, H + 0.124, -0.13], [0, 1, 0], motor],
    ['PRH', [x1 - 0.124, H, -0.13], [-1, 0, 0], motor],
    ['PAX', [x1, H + 0.05, -0.44], [0, 0, -1], motor],
    ['SRV', [x2, H + 0.055, -0.1], [0, 1, 0], recv],
    ['SRH', [x2 + 0.055, H, -0.1], [1, 0, 0], recv],
    ['SAX', [x2 + 0.03, H - 0.03, -0.335], [0, 0, -1], recv],
  ];

  root.updateMatrixWorld(true);

  for (const [id, p, n, parent] of place) {
    const g = grp('capteur_' + id, ...p);
    g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(...n));
    add('embase', new THREE.CylinderGeometry(0.016, 0.016, 0.01, 24), mat.steel, 0, 0.005, 0, g);
    const body = add('corps', new THREE.CylinderGeometry(0.013, 0.013, 0.04, 24), mat.sensor, 0, 0.03, 0, g) as THREE.Mesh;
    body.userData.sensor = id;
    add('connecteur', new THREE.CylinderGeometry(0.007, 0.007, 0.014, 16), mat.steel, 0, 0.057, 0, g);
    g.updateMatrixWorld(true);
    parent.attach(g);
    sensors[id] = { g, body };
  }

  return {
    root,
    H,
    x1,
    x2,
    r1,
    r2,
    motor,
    recv,
    p1,
    p2,
    belt,
    loop,
    markers,
    sensors,
    mat,
    misHighlight,
    resWaveGroup,
    rw1,
    rw2,
    rw3
  };
}

// -------------------------------------------------------------
// MAIN COMPONENT
// -------------------------------------------------------------
export default function BeltPulleyModule({ theme }: BeltPulleyModuleProps) {
  const isLight = theme === 'light';

  // --- PARAMETERS ---
  const [n1, setN1] = useState<number>(1500); // Driver RPM
  const [d1, setD1] = useState<number>(120);  // Driver diameter (mm)
  const [d2, setD2] = useState<number>(180);  // Driven diameter (mm)
  const [c, setC] = useState<number>(450);    // Center distance (mm)
  const [t, setT] = useState<number>(350);    // Tension (N)
  const [m, setM] = useState<number>(0.35);   // Linear mass (kg/m)

  // --- DEFECTS SEVERITIES ---
  const [wear, setWear] = useState<number>(20); // Belt defect severity (%)
  const [ecc, setEcc] = useState<number>(15);   // Pulley eccentricity (%)
  const [mis, setMis] = useState<number>(10);   // Pulley misalignment (%)
  const [misType, setMisType] = useState<'par' | 'ang'>('par');

  // --- INTERACTIVE SELECTIONS ---
  const [selectedSensor, setSelectedSensor] = useState<string>('PRV');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [showFx, setShowFx] = useState<boolean>(true);
  const [fmax, setFmax] = useState<number>(100); // 100 Hz or 200 Hz
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // 2D Canvas Labels overlay state
  const [screenLabels, setScreenLabels] = useState<Record<string, { x: number; y: number; visible: boolean }>>({});
  const [resTagPos, setResTagPos] = useState<{ x: number; y: number; visible: boolean } | null>(null);

  // Refs
  const viewportRef = useRef<HTMLDivElement>(null);
  const fftCanvasRef = useRef<HTMLCanvasElement>(null);

  // Three.js instance
  const threeRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    model: ReturnType<typeof buildBelt3D>;
  } | null>(null);

  // Animation sync state
  const stateRef = useRef({
    p: { n1, d1, d2, c, t, m },
    sev: { wear: wear / 100, ecc: ecc / 100, mis: mis / 100, misType },
    selectedSensor,
    isPlaying,
    showFx,
    fmax,
    s: 0,
    isLight
  });

  useEffect(() => {
    stateRef.current = {
      p: { n1, d1, d2, c, t, m },
      sev: { wear: wear / 100, ecc: ecc / 100, mis: mis / 100, misType },
      selectedSensor,
      isPlaying,
      showFx,
      fmax,
      s: stateRef.current.s,
      isLight
    };
  }, [n1, d1, d2, c, t, m, wear, ecc, mis, misType, selectedSensor, isPlaying, showFx, fmax, isLight]);

  // Physical calculations memo
  const physics = useMemo(() => {
    return calculateBeltPhysics({ n1, d1, d2, c, t, m });
  }, [n1, d1, d2, c, t, m]);

  // -------------------------------------------------------------
  // INITIALIZE THREE.JS 3D STAGE
  // -------------------------------------------------------------
  useEffect(() => {
    const container = viewportRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 440;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(isLight ? 0xf8fafc : 0x090d16);

    // Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    camera.position.set(0.2, 0.95, 1.35);

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
    controls.target.set(0.05, 0.35, -0.15);
    controls.maxPolarAngle = Math.PI / 2 - 0.02;
    controls.minDistance = 0.6;
    controls.maxDistance = 6;

    // Lights
    const hemiLight = new THREE.HemisphereLight(0xffffff, isLight ? 0x94a3b8 : 0x1e293b, 1.2);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
    dirLight.position.set(2.5, 4.5, 3.5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 10;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.45);
    fillLight.position.set(-2.5, 2.5, -2.5);
    scene.add(fillLight);

    // Floor Shadow
    const floorGeo = new THREE.PlaneGeometry(8, 8);
    const floorMat = new THREE.ShadowMaterial({ opacity: isLight ? 0.15 : 0.35 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    scene.add(floor);

    // Build 3D Belt and Pulleys
    const model = buildBelt3D({ n1, d1, d2, c, t, m }, isLight);
    scene.add(model.root);

    threeRef.current = {
      scene,
      camera,
      renderer,
      controls,
      model
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

    // Direct 3D Raycasting for Sensors
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let downPos = { x: 0, y: 0 };

    const handlePointerDown = (e: PointerEvent) => {
      downPos = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y) > 5) return;
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const bodies = Object.values(model.sensors).map((s) => s.g);
      const hits = raycaster.intersectObjects(bodies, true);

      const found = hits.find((h) => h.object.userData.sensor || h.object.parent);
      if (found) {
        let cur: THREE.Object3D | null = found.object;
        while (cur && !cur.name.startsWith('capteur_')) {
          cur = cur.parent;
        }
        if (cur) {
          const sId = cur.name.replace('capteur_', '');
          if (byId[sId]) {
            setSelectedSensor(sId);
          }
        }
      }
    };

    const cv = renderer.domElement;
    cv.addEventListener('pointerdown', handlePointerDown);
    cv.addEventListener('pointerup', handlePointerUp);

    return () => {
      cv.removeEventListener('pointerdown', handlePointerDown);
      cv.removeEventListener('pointerup', handlePointerUp);
      resizeObserver.disconnect();
      renderer.dispose();
      controls.dispose();
      threeRef.current = null;
    };
  }, [d1, d2, c, isLight]); // Rebuild 3D geometry when diameters or center distance change

  // -------------------------------------------------------------
  // ANIMATION LOOP & FFT DRAWING
  // -------------------------------------------------------------
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();
    let totalTime = 0;
    const tempVec = new THREE.Vector3();

    const renderLoop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;
      totalTime += dt;

      const st = stateRef.current;
      const tObj = threeRef.current;
      const ph = calculateBeltPhysics(st.p);

      if (st.isPlaying) {
        st.s += dt * ph.v * 0.07;
      }

      if (tObj) {
        const { controls, renderer, scene, camera, model } = tObj;

        // Update sensor materials
        for (const s of SENSORS) {
          const node = model.sensors[s.id];
          if (node) {
            node.body.material = s.id === st.selectedSensor ? model.mat.sel : model.mat.sensor;
          }
        }

        // Rotate pulleys
        const r1 = model.r1 - 0.008;
        const r2 = model.r2 - 0.008;
        const a1 = -st.s / r1;
        const a2 = -st.s / r2;

        model.p1.spin.rotation.z = a1;
        model.p2.spin.rotation.z = a2;

        // 1. Defect: Pulley Eccentricity (orbital wobble)
        const ek = st.showFx ? st.sev.ecc * 0.008 : 0;
        model.p1.spin.position.set(ek * Math.cos(a1), ek * Math.sin(a1), 0);
        model.p2.spin.position.set(ek * Math.cos(a2), ek * Math.sin(a2), 0);

        // 2. Defect: Pulley Misalignment (Parallel offset or Angular tilt)
        const mk = st.showFx ? st.sev.mis : 0;
        model.p2.mount.position.z = st.sev.misType === 'par' ? mk * 0.025 : 0;
        model.p2.mount.rotation.y = st.sev.misType === 'ang' ? mk * 0.12 : 0;
        model.misHighlight.visible = st.showFx && st.sev.mis > 0.05;
        if (model.misHighlight.visible) {
          const pulse = (Math.sin(time * 0.008) + 1) / 2;
          (model.misHighlight.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.5 + 1.2 * pulse;
        }

        // 3. Move Belt tracking markers
        model.markers.forEach((o, i) => {
          model.loop.at(st.s + (i * model.loop.L) / model.markers.length, o.position);
        });

        // 4. Defect: Belt Wear Shake / Flap & Transverse Resonance
        const isResonance = ph.isResonant;
        const shake = isResonance 
          ? 0.0065 * ph.amplification 
          : (st.showFx ? st.sev.wear * 0.0022 : 0);

        const beltOscillation = shake * Math.sin(totalTime * (isResonance ? 45 : 30));
        model.belt.position.y = beltOscillation;
        model.markers.forEach((o) => {
          o.position.y += beltOscillation;
        });

        // 5. 3D Resonance Shockwave Rings on the Belt Span
        model.resWaveGroup.visible = isResonance;
        if (isResonance) {
          const pulseSpeed = time * 0.009;
          const p1 = (Math.sin(pulseSpeed) + 1) / 2;
          const p2 = (Math.sin(pulseSpeed + 1.2) + 1) / 2;
          const p3 = (Math.sin(pulseSpeed + 2.4) + 1) / 2;

          (model.rw1.material as THREE.MeshBasicMaterial).opacity = 0.25 + 0.65 * p1;
          (model.rw2.material as THREE.MeshBasicMaterial).opacity = 0.2 + 0.55 * p2;
          (model.rw3.material as THREE.MeshBasicMaterial).opacity = 0.15 + 0.45 * p3;
        }

        controls.update();
        renderer.render(scene, camera);

        // Project sensor 3D points to 2D screen positions for floating labels
        const w = renderer.domElement.clientWidth;
        const h = renderer.domElement.clientHeight;

        const newLabels: Record<string, { x: number; y: number; visible: boolean }> = {};
        for (const s of SENSORS) {
          const node = model.sensors[s.id];
          if (node) {
            node.g.localToWorld(tempVec.set(0, 0.075, 0)).project(camera);
            newLabels[s.id] = {
              x: ((tempVec.x + 1) / 2) * w,
              y: ((1 - tempVec.y) / 2) * h,
              visible: tempVec.z < 1
            };
          }
        }
        setScreenLabels(newLabels);

        // Project Belt Span position for floating Resonance Pin
        const spanMidX = (model.x1 + model.x2) / 2;
        tempVec.set(spanMidX, model.H + (model.r1 + model.r2) / 2 + 0.12, 0).project(camera);
        setResTagPos({
          x: ((tempVec.x + 1) / 2) * w,
          y: ((1 - tempVec.y) / 2) * h,
          visible: tempVec.z < 1
        });
      }

      // Draw FFT Spectrum
      drawFFT();

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // -------------------------------------------------------------
  // HIGH-RESOLUTION FFT CANVAS DRAWING
  // -------------------------------------------------------------
  const drawFFT = () => {
    const canvas = fftCanvasRef.current;
    if (!canvas) return;

    const st = stateRef.current;
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.clientWidth;
    const Hh = canvas.clientHeight || 280;

    if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(Hh * dpr)) {
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(Hh * dpr);
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, Hh);

    const isLightMode = st.isLight;
    const ph = calculateBeltPhysics(st.p);
    const P = calculateSpectrum(st.selectedSensor, ph, st.sev).filter((q) => q.f <= st.fmax);

    const L = 48, R = W - 16, T = 30, B = Hh - 30;
    const fx = (f: number) => L + (f / st.fmax) * (R - L);
    const top = Math.max(1.2, ...P.map((q) => q.a)) * 1.25;
    const fy = (a: number) => B - (a / top) * (B - T);

    // Grid and Axes
    ctx.font = '10px ui-monospace, Menlo, monospace';
    ctx.strokeStyle = isLightMode ? '#f1f5f9' : '#1e293b';
    ctx.lineWidth = 1;
    ctx.fillStyle = isLightMode ? '#64748b' : '#94a3b8';

    // Vertical Frequency divisions
    for (let i = 0; i <= 10; i++) {
      const X = L + (i * (R - L)) / 10;
      ctx.beginPath();
      ctx.moveTo(X, T);
      ctx.lineTo(X, B);
      ctx.stroke();
      ctx.textAlign = 'center';
      ctx.fillText(Math.round((i * st.fmax) / 10) + ' Hz', X, B + 18);
    }

    // Horizontal Amplitude divisions
    for (let i = 0; i <= 4; i++) {
      const Y = B - (i * (B - T)) / 4;
      ctx.beginPath();
      ctx.moveTo(L, Y);
      ctx.lineTo(R, Y);
      ctx.stroke();
      ctx.textAlign = 'right';
      ctx.fillText(((i * top) / 4).toFixed(1), L - 6, Y + 3);
    }

    // Y Axis unit label
    ctx.save();
    ctx.translate(14, (T + B) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.font = 'bold 10px ui-monospace, Menlo, monospace';
    ctx.fillText('Amplitude (mm/s RMS)', 0, 0);
    ctx.restore();

    // Natural Frequency (fn) Translucent Resonance Band
    if (ph.fn <= st.fmax) {
      const X = fx(ph.fn);
      const bw = Math.max(((0.06 * ph.fn) / st.fmax) * (R - L), 8);

      ctx.fillStyle = isLightMode ? 'rgba(245, 158, 11, 0.14)' : 'rgba(245, 158, 11, 0.18)';
      ctx.fillRect(X - bw, T, bw * 2, B - T);

      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(X, T);
      ctx.lineTo(X, B);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#d97706';
      ctx.textAlign = 'center';
      ctx.font = 'bold 10px ui-monospace, Menlo, monospace';
      ctx.fillText(`FRÉQUENCE PROPRE SPAN fn = ${ph.fn.toFixed(1)} Hz`, X, T - 10);
    }

    // Background deterministic noise floor
    ctx.strokeStyle = isLightMode ? '#cbd5e1' : '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let f = 0; f <= st.fmax; f += st.fmax / 350) {
      const Y = fy(noiseFloor(f));
      if (f === 0) ctx.moveTo(fx(f), Y);
      else ctx.lineTo(fx(f), Y);
    }
    ctx.stroke();

    // Harmonic Peaks with distinct color coding
    const col: Record<string, string> = {
      rpm: '#2563eb',   // 1x RPM1 Motor (Blue)
      rpm2: '#10b981',  // 1x RPM2 Driven (Emerald)
      belt: '#ef4444'   // Belt Defect harmonics fb (Red)
    };

    const placed: [number, number, number][] = [];
    for (const q of [...P].sort((a, b) => b.a - a.a)) {
      const X = fx(q.f);
      const Y = fy(q.a);

      ctx.strokeStyle = col[q.kind] || '#2563eb';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(X, B);
      ctx.lineTo(X, Y);
      ctx.stroke();

      ctx.fillStyle = col[q.kind] || '#2563eb';
      ctx.beginPath();
      ctx.arc(X, Y, 4, 0, Math.PI * 2);
      ctx.fill();

      // Peak Label tag with anti-overlap
      ctx.font = 'bold 10px ui-monospace, Menlo, monospace';
      const labelText = `${q.label} (${q.f.toFixed(1)} Hz : ${q.a.toFixed(2)})`;
      const tw = ctx.measureText(labelText).width / 2 + 5;
      let ly = Y - 10;
      while (placed.some((p) => Math.abs(p[0] - X) < p[2] + tw && Math.abs(p[1] - ly) < 14)) {
        ly -= 13;
      }
      placed.push([X, ly, tw]);

      ctx.textAlign = 'center';
      ctx.fillText(labelText, X, Math.max(ly, T + 8));
    }
  };

  // Reset Camera View
  const handleResetCamera = () => {
    if (threeRef.current) {
      const { camera, controls } = threeRef.current;
      camera.position.set(0.2, 0.95, 1.35);
      controls.target.set(0.05, 0.35, -0.15);
      controls.update();
    }
  };

  // Quick Resonance Preset Tuning
  const tuneResonance = (mode: 'motor' | 'driven' | 'belt2x') => {
    if (mode === 'motor') {
      // Set N1 so that f1 = fn
      setN1(Math.round(physics.fn * 60));
    } else if (mode === 'driven') {
      // Set N1 so that f2 = fn -> N1 = fn * 60 * (d2 / d1)
      setN1(Math.round(physics.fn * 60 * (d2 / d1)));
    } else if (mode === 'belt2x') {
      // Set N1 so that 2 * fb = fn
      // fb = (pi * d1 * (N1 / 60)) / L -> N1 = (fn / 2) * L * 60 / (pi * d1)
      const d1M = d1 / 1000;
      const targetN1 = ((physics.fn / 2) * physics.L * 60) / (Math.PI * d1M);
      setN1(Math.round(targetN1));
    }
  };

  return (
    <div className={`space-y-6 ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
      
      {/* Header Banner */}
      <div className={`p-6 rounded-2xl border shadow-sm transition-all ${
        isLight ? 'bg-white border-slate-200' : 'bg-[#0D1322] border-slate-800'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-600">
              <Disc className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-emerald-600 text-white">
                  TRANSMISSIONS SOUPLES ISO 10816
                </span>
                <span className={`text-xs font-mono font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Simulation 3D & Fréquence Propre de Span (fₙ)
                </span>
              </div>
              <h2 className={`text-xl font-black tracking-tight mt-1 ${isLight ? 'text-slate-950' : 'text-white'}`}>
                Poulies & Courroies 3D : Diagnostic Vibratoire & Résonance
              </h2>
              <p className={`text-xs mt-1 max-w-3xl leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Visualisez en temps réel le défilement de la courroie trapézoïdale sur ses poulies avec modélisation 3D des défauts d'<strong>excentricité</strong>, de <strong>désalignement</strong>, d'<strong>usure de courroie</strong> et de <strong>battement résonant</strong>.
              </p>
            </div>
          </div>

          {/* Resonance Quick Badge in Header */}
          {physics.isResonant && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-600/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-black animate-pulse">
              <Flame className="w-4 h-4 text-red-500 animate-bounce" />
              <span>RÉSONANCE ACTIVE ({physics.hits.join(', ')})</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Controls (Left 4 cols) | 3D Equipment + FFT (Right 8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column: Physical & Defect Controls (4 cols) */}
        <div className="lg:col-span-4 space-y-6">

          {/* Card 1: Geometrical & Physical Parameters */}
          <div className={`p-5 rounded-2xl border shadow-sm ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#0D1322] border-slate-800'
          }`}>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-black uppercase tracking-wider">
                  Géométrie & Paramètres Physiques
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {/* Driver RPM */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Régime Moteur (N₁) :</span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{n1} tr/min</span>
                </div>
                <input
                  type="range"
                  min="400"
                  max="3000"
                  step="10"
                  value={n1}
                  onChange={(e) => setN1(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-0.5">
                  <span>400 RPM</span>
                  <span>3000 RPM</span>
                </div>
              </div>

              {/* Pulley Diameters */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Diamètre d₁ (Moteur)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="60"
                      max="350"
                      value={d1}
                      onChange={(e) => setD1(Math.max(50, Number(e.target.value)))}
                      className={`w-full px-2.5 py-1.5 pr-8 rounded-lg border text-xs font-mono font-bold ${
                        isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                      }`}
                    />
                    <span className="absolute right-2.5 top-2 text-[10px] text-slate-400">mm</span>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Diamètre d₂ (Récepteur)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="60"
                      max="350"
                      value={d2}
                      onChange={(e) => setD2(Math.max(50, Number(e.target.value)))}
                      className={`w-full px-2.5 py-1.5 pr-8 rounded-lg border text-xs font-mono font-bold ${
                        isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                      }`}
                    />
                    <span className="absolute right-2.5 top-2 text-[10px] text-slate-400">mm</span>
                  </div>
                </div>
              </div>

              {/* Center distance C */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Entraxe des Poulies (C) :</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{c} mm</span>
                </div>
                <input
                  type="range"
                  min="260"
                  max="700"
                  step="5"
                  value={c}
                  onChange={(e) => setC(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>

              {/* Belt Tension T */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Tension de Courroie (T) :</span>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{t} N</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="1000"
                  step="10"
                  value={t}
                  onChange={(e) => setT(Number(e.target.value))}
                  className="w-full accent-amber-600 cursor-pointer"
                />
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                  Une tension plus élevée augmente la fréquence propre de span fn ∝ √(Tension).
                </p>
              </div>

              {/* Belt Linear Density m */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Masse linéique (m) :</span>
                  <span className="font-mono font-bold text-purple-600 dark:text-purple-400">{m.toFixed(2)} kg/m</span>
                </div>
                <input
                  type="range"
                  min="0.10"
                  max="0.80"
                  step="0.01"
                  value={m}
                  onChange={(e) => setM(Number(e.target.value))}
                  className="w-full accent-purple-600 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Defect Severities & Misalignment Type */}
          <div className={`p-5 rounded-2xl border shadow-sm ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#0D1322] border-slate-800'
          }`}>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-500" />
                <span className="text-xs font-black uppercase tracking-wider">
                  Simulation des Défauts
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {/* Belt Wear / Defect */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Usure / Fissure Courroie :</span>
                  <span className="font-mono font-bold text-red-600 dark:text-red-400">{wear}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={wear}
                  onChange={(e) => setWear(Number(e.target.value))}
                  className="w-full accent-red-600 cursor-pointer"
                />
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                  Génère des pics aux harmoniques de la courroie (f_b, 2f_b, 3f_b...).
                </p>
              </div>

              {/* Pulley Eccentricity */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Excentricité / Faux-Rond Poulies :</span>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{ecc}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={ecc}
                  onChange={(e) => setEcc(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                  Provoque des vibrations synchrones à 1x RPM1 et 1x RPM2 en radial.
                </p>
              </div>

              {/* Pulley Misalignment */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Désalignement de Poulie :</span>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{mis}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={mis}
                  onChange={(e) => setMis(Number(e.target.value))}
                  className="w-full accent-amber-600 cursor-pointer"
                />

                <div className="mt-2.5 flex items-center gap-4 text-xs font-semibold">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="misalignmentType"
                      value="par"
                      checked={misType === 'par'}
                      onChange={() => setMisType('par')}
                      className="accent-amber-600"
                    />
                    <span>Parallèle (Radial)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="misalignmentType"
                      value="ang"
                      checked={misType === 'ang'}
                      onChange={() => setMisType('ang')}
                      className="accent-amber-600"
                    />
                    <span>Angulaire (Axial)</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Quick Resonance Presets */}
          <div className={`p-4 rounded-2xl border shadow-sm ${
            isLight ? 'bg-amber-50/50 border-amber-200' : 'bg-amber-950/20 border-amber-800/40'
          }`}>
            <div className="flex items-center gap-2 mb-2 font-black text-xs text-amber-700 dark:text-amber-400 uppercase tracking-wide">
              <Flame className="w-4 h-4 text-amber-500 animate-pulse" />
              <span>Simulateur de Résonance Rapide</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mb-3 leading-snug">
              Réglez instantanément la vitesse $N_1$ pour faire coïncider les fréquences d'excitation avec la <strong>fréquence propre de span $f_n = {physics.fn.toFixed(1)}$ Hz</strong> :
            </p>
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => tuneResonance('motor')}
                className="w-full py-1.5 px-3 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-900 dark:text-amber-200 transition-all cursor-pointer flex items-center justify-between"
              >
                <span>⚡ Caler sur 1x RPM Moteur (f₁ = fₙ)</span>
                <span className="font-mono font-black">{Math.round(physics.fn * 60)} tr/min</span>
              </button>

              <button
                onClick={() => tuneResonance('driven')}
                className="w-full py-1.5 px-3 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-900 dark:text-emerald-200 transition-all cursor-pointer flex items-center justify-between"
              >
                <span>⚡ Caler sur 1x RPM Récepteur (f₂ = fₙ)</span>
                <span className="font-mono font-black">{Math.round(physics.fn * 60 * (d2 / d1))} tr/min</span>
              </button>

              <button
                onClick={() => tuneResonance('belt2x')}
                className="w-full py-1.5 px-3 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 border border-red-300 dark:border-red-700 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-900 dark:text-red-200 transition-all cursor-pointer flex items-center justify-between"
              >
                <span>⚡ Caler sur Harmonique Courroie 2x f_b</span>
                <span className="font-mono font-black">2x f_b = fₙ</span>
              </button>
            </div>
          </div>

        </div>

        {/* Right Column: 3D Viewport + FFT Spectrum (8 cols) */}
        <div className="lg:col-span-8 space-y-6">

          {/* 3D Viewport Card */}
          <div className={`p-5 rounded-2xl border shadow-sm relative ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#0D1322] border-slate-800'
          }`}>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-black uppercase tracking-wider">
                  Simulation 3D : Poulies, Courroie & 6 Capteurs Accéléromètres
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  title={isPlaying ? 'Pause' : 'Reprendre le défilement'}
                  className={`p-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    isPlaying 
                      ? 'bg-emerald-600 text-white border-emerald-600' 
                      : (isLight ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300')
                  }`}
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span className="text-[10px] hidden sm:inline">{isPlaying ? 'Défilement' : 'En Pause'}</span>
                </button>
                <button
                  onClick={() => setShowFx(!showFx)}
                  title="Activer/Désactiver les effets visuels de défaut"
                  className={`p-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    showFx
                      ? 'bg-purple-600 text-white border-purple-600'
                      : (isLight ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300')
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span className="text-[10px] hidden sm:inline">Défauts 3D</span>
                </button>
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
              className={`relative rounded-xl border overflow-hidden ${isExpanded ? 'h-[600px]' : 'h-[440px]'} ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#090D16] border-slate-800'
              }`}
            >
              <div ref={viewportRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

              {/* DYNAMIC 3D HUD OVERLAY FOR BELT TRANSMISSION & RESONANCE */}
              <div className={`absolute top-3 left-3 z-30 p-3 rounded-xl border backdrop-blur-md shadow-xl max-w-sm sm:max-w-md transition-all ${
                physics.isResonant
                  ? 'bg-red-600/95 border-red-300 text-white ring-2 ring-red-400 shadow-red-600/40'
                  : isLight 
                    ? 'bg-white/95 border-emerald-300 text-slate-900 shadow-emerald-500/10' 
                    : 'bg-slate-900/95 border-emerald-500/50 text-white shadow-black/40'
              }`}>
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full shrink-0 ${
                    physics.isResonant ? 'bg-white animate-ping' : 'bg-emerald-500 animate-pulse'
                  }`} />
                  <span className="text-[11px] font-black tracking-wide uppercase">
                    FRÉQUENCE PROPRE COURROIE (SPAN) : <span className="underline decoration-2">fₙ = {physics.fn.toFixed(1)} Hz</span>
                  </span>
                </div>

                <div className="mt-1.5 text-[11px] font-mono flex items-center justify-between gap-3">
                  <span>1x Moteur : <strong>{physics.f1.toFixed(1)} Hz</strong></span>
                  <span>1x Récepteur : <strong>{physics.f2.toFixed(1)} Hz</strong></span>
                  <span>Courroie f_b : <strong>{physics.fb.toFixed(1)} Hz</strong></span>
                </div>

                {physics.isResonant ? (
                  <div className="mt-2 pt-2 border-t border-white/30 text-[10px] font-black tracking-wide text-white uppercase flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-amber-200 animate-bounce" />
                      <span>⚡ RÉSONANCE DE COURROIE ACTIVE ! Coïncidence : {physics.hits.join(', ')}</span>
                    </div>
                    <span className="text-[9px] font-medium text-red-100">
                      Battement transversal violent et usure critique • Facteur d'amplification Q ≈ {physics.amplification.toFixed(1)}× !
                    </span>
                  </div>
                ) : (
                  <div className="mt-1.5 text-[10px] font-semibold flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span>Régime stable : pas de coïncidence avec fₙ ({physics.fn.toFixed(1)} Hz)</span>
                    <span className="font-mono text-emerald-600 font-bold">Vitesse = {physics.v.toFixed(1)} m/s</span>
                  </div>
                )}
              </div>

              {/* Floating Resonance Pin directly above Belt Span in 3D */}
              {resTagPos && resTagPos.visible && (
                <div 
                  className={`absolute -translate-x-1/2 -translate-y-[120%] pointer-events-none z-30 px-2 py-1 rounded-lg border text-[10px] font-black font-mono shadow-md transition-transform flex items-center gap-1.5 ${
                    physics.isResonant
                      ? 'bg-red-600 border-white text-white animate-bounce ring-2 ring-red-400'
                      : isLight 
                        ? 'bg-emerald-100 border-emerald-400 text-emerald-950' 
                        : 'bg-emerald-950/90 border-emerald-500 text-emerald-200'
                  }`}
                  style={{ left: `${resTagPos.x}px`, top: `${resTagPos.y}px` }}
                >
                  <Flame className={`w-3 h-3 ${physics.isResonant ? 'text-amber-200' : 'text-emerald-500'}`} />
                  <span>Courroie (Span) : fₙ = {physics.fn.toFixed(1)} Hz</span>
                </div>
              )}

              {/* 3D Interactive Sensor Badges (Clickable Overlay) */}
              {(Object.entries(screenLabels) as [string, { x: number; y: number; visible: boolean }][]).map(([id, pos]) => {
                if (!pos.visible) return null;
                const isSelected = id === selectedSensor;
                const sDef = byId[id];

                return (
                  <button
                    key={id}
                    onClick={() => setSelectedSensor(id)}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 px-2 py-0.5 rounded text-[10px] font-black font-mono tracking-wider transition-transform cursor-pointer shadow-md ${
                      isSelected
                        ? 'bg-blue-600 text-white scale-110 ring-2 ring-blue-400 shadow-blue-500/50'
                        : isLight
                          ? 'bg-white/90 text-slate-800 border border-slate-300 hover:border-blue-400'
                          : 'bg-slate-900/90 text-slate-200 border border-slate-700 hover:border-blue-400'
                    }`}
                    style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
                    title={sDef?.label}
                  >
                    {id}
                  </button>
                );
              })}

              <div className="absolute left-3 bottom-3 text-[10px] px-2.5 py-1 rounded bg-black/60 text-white/90 backdrop-blur-xs font-medium">
                💡 Clic ou glisser pour tourner • Molette pour zoomer • Cliquez sur un capteur (PRV, PRH, PAX, SRV, SRH, SAX)
              </div>
            </div>

            {/* Quick Metrics Bar below 3D */}
            <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3.5 p-3 rounded-xl border text-xs font-mono ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#090D16] border-slate-800'
            }`}>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">1x RPM Moteur :</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">{physics.f1.toFixed(2)} Hz ({n1} tr/min)</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">1x RPM Récepteur :</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{physics.f2.toFixed(2)} Hz ({Math.round(physics.n2)} tr/min)</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Vitesse Courroie :</span>
                <span className="font-bold text-orange-600 dark:text-orange-400">{physics.v.toFixed(1)} m/s (f_b: {physics.fb.toFixed(1)} Hz)</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Fréq. Propre Span :</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">{physics.fn.toFixed(2)} Hz (fₙ)</span>
              </div>
            </div>
          </div>

          {/* FFT Spectrum Card */}
          <div className={`p-5 rounded-2xl border shadow-sm relative ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#0D1322] border-slate-800'
          }`}>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-black uppercase tracking-wider">
                  Spectre FFT : Capteur {selectedSensor} ({byId[selectedSensor]?.label})
                </span>
              </div>

              {/* Frequency Axis Toggle */}
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold px-1.5 text-slate-500">Échelle :</span>
                <button
                  onClick={() => setFmax(100)}
                  className={`px-2 py-0.5 rounded text-[10px] font-black font-mono transition-all cursor-pointer ${
                    fmax === 100
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-white'
                  }`}
                >
                  0 - 100 Hz
                </button>
                <button
                  onClick={() => setFmax(200)}
                  className={`px-2 py-0.5 rounded text-[10px] font-black font-mono transition-all cursor-pointer ${
                    fmax === 200
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-white'
                  }`}
                >
                  0 - 200 Hz
                </button>
              </div>
            </div>

            {/* FFT Canvas */}
            <div className="relative border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden h-[280px]">
              <canvas ref={fftCanvasRef} className="w-full h-full" />
            </div>

            {/* Diagnostic Interpretation Box */}
            <div className={`mt-3.5 text-[11px] leading-relaxed p-3.5 rounded-xl border ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-[#090D16] border-slate-800 text-slate-400'
            }`}>
              <span className="font-extrabold text-blue-600 dark:text-blue-400 uppercase block text-[10px] tracking-wider mb-1">
                Analyse & Interprétation Vibratoire :
              </span>
              {selectedSensor.startsWith('P') ? "Mesure sur le palier d'arbre moteur (Conducteur)." : "Mesure sur le palier d'arbre récepteur."}{' '}
              {selectedSensor.endsWith('H') && "L'axe horizontal est sensible aux défauts de parallélisme d'arbres et au balourd/excentricité radial des poulies."}
              {selectedSensor.endsWith('V') && "L'axe vertical est particulièrement sensible aux battements transversaux et à la résonance de courroie."}
              {selectedSensor.endsWith('X') && "L'axe axial révèle les défauts d'alignement angulaire des poulies (torsion axiale de la courroie)."}
              {physics.isResonant && (
                <span className="text-red-600 dark:text-red-400 font-bold block mt-1">
                  ⚠️ ALERTE RÉSONANCE : La fréquence propre de span ({physics.fn.toFixed(1)} Hz) est excitée par [{physics.hits.join(', ')}]. Risque d'usure prématurée et de rupture de courroie !
                </span>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
