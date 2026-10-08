import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { 
  Scale, 
  Settings, 
  Info, 
  Activity, 
  Wrench, 
  RotateCcw, 
  Maximize2, 
  Minimize2, 
  Play, 
  Pause, 
  CheckCircle2, 
  Flame, 
  Zap, 
  Radio, 
  Eye, 
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  RotateCw
} from 'lucide-react';

interface UnbalanceModuleProps {
  theme?: 'dark' | 'light' | 'mono';
}

// -------------------------------------------------------------
// VECTOR MATHEMATICS FOR FIELD BALANCING (1 PLANE)
// -------------------------------------------------------------
interface Vector2D {
  x: number;
  y: number;
}

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;
const wrap = (a: number) => ((a % 360) + 360) % 360;
const V = (amp: number, ang: number): Vector2D => ({ x: amp * Math.cos(rad(ang)), y: amp * Math.sin(rad(ang)) });
const amp = (v: Vector2D) => Math.hypot(v.x, v.y);
const ang = (v: Vector2D) => wrap(deg(Math.atan2(v.y, v.x)));
const addV = (a: Vector2D, b: Vector2D): Vector2D => ({ x: a.x + b.x, y: a.y + b.y });
const subV = (a: Vector2D, b: Vector2D): Vector2D => ({ x: a.x - b.x, y: a.y - b.y });
const negV = (a: Vector2D): Vector2D => ({ x: -a.x, y: -a.y });
const mulV = (a: Vector2D, b: Vector2D): Vector2D => ({ x: a.x * b.x - a.y * b.y, y: a.x * b.y + a.y * b.x });
const divV = (a: Vector2D, b: Vector2D): Vector2D => {
  const d = b.x * b.x + b.y * b.y || 1e-9;
  return { x: (a.x * b.x + a.y * b.y) / d, y: (a.y * b.x - a.x * b.y) / d };
};

const R_POSE = 0.33; // Radius of weight placement on rotor (m)

interface BalancingData {
  oA: number; // Initial amplitude (mm/s)
  oP: number; // Initial phase (deg)
  tA: number; // Trial amplitude (mm/s)
  tP: number; // Trial phase (deg)
  mT: number; // Trial mass (g)
  aT: number; // Trial angle (deg)
  rpm: number; // Rotor RPM
  keep: boolean; // Keep trial mass on rotor
}

interface SolveResult {
  O: Vector2D;
  T: Vector2D;
  E: Vector2D;
  alpha: Vector2D;
  W: Vector2D;
  U0: Vector2D;
  corr: Vector2D;
  Mt: Vector2D;
  corrM: number;
  corrA: number;
  alphaA: number;
  alphaP: number;
  u0M: number;
  u0A: number;
  forceTrial: number;
  forceU0: number;
  vibTrial: number;
}

function solveBalancing(d: BalancingData): SolveResult {
  const O = V(d.oA, d.oP);
  const T = V(d.tA, d.tP);
  const Mt = V(d.mT, d.aT);
  const E = subV(T, O); // Effect of trial mass
  const alpha = divV(E, Mt); // Influence coefficient / Sensitivity (mm/s per g)
  const W = divV(negV(O), alpha); // Correction if trial mass removed
  const U0 = divV(O, alpha); // Estimated original unbalance (g)
  const Wk = subV(W, Mt); // Correction if trial mass kept
  const corr = d.keep ? Wk : W;
  const w = (d.rpm * 2 * Math.PI) / 60;

  return {
    O,
    T,
    E,
    alpha,
    W,
    U0,
    corr,
    Mt,
    corrM: amp(corr),
    corrA: ang(corr),
    alphaA: amp(alpha),
    alphaP: ang(alpha),
    u0M: amp(U0),
    u0A: ang(U0),
    forceTrial: (d.mT / 1000) * R_POSE * w * w,
    forceU0: (amp(U0) / 1000) * R_POSE * w * w,
    vibTrial: amp(alpha) * d.mT
  };
}

function calculateInstalledCorrection(s: SolveResult, errDeg = 3) {
  const m = Math.round(s.corrM * 2) / 2;
  return { m, a: wrap(Math.round(s.corrA) + errDeg) };
}

function calculateVibrationState(
  s: SolveResult, 
  state: { trial: boolean; corr: { m: number; a: number } | null }
): Vector2D {
  let v = s.O;
  if (state.trial) v = addV(v, mulV(s.alpha, s.Mt));
  if (state.corr) v = addV(v, mulV(s.alpha, V(state.corr.m, state.corr.a)));
  return v;
}

// ISO 10816-3 Severity Zones (Rigid foundation, Group 2)
function getIsoSeverity(a: number) {
  if (a <= 1.4) return { z: 'A', t: 'Zone A : Machine neuve / Équilibrage excellent', c: '#10b981' };
  if (a <= 2.8) return { z: 'B', t: 'Zone B : Fonctionnement acceptable', c: '#84cc16' };
  if (a <= 4.5) return { z: 'C', t: 'Zone C : Fonctionnement toléré sous surveillance', c: '#f59e0b' };
  return { z: 'D', t: 'Zone D : Vibration inadmissible / Arrêt requis', c: '#ef4444' };
}

// -------------------------------------------------------------
// THREE.JS 3D EQUIPMENT BUILDER FOR DYNAMIC BALANCING
// -------------------------------------------------------------
function buildMachineBalancing(isLightMode: boolean) {
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
    concrete: M('beton', isLightMode ? 0xe2e8f0 : 0x1e293b, 0.95, 0),
    skid: M('chassis_acier', isLightMode ? 0x94a3b8 : 0x334155, 0.55, 0.3),
    body: M('carter_gris', isLightMode ? 0x64748b : 0x475569, 0.5, 0.25),
    dark: M('rotor_fonte', isLightMode ? 0x334155 : 0x1e293b, 0.45, 0.3),
    steel: M('acier_arbre', isLightMode ? 0xcbd5e1 : 0x64748b, 0.3, 0.45),
    orange: M('accouplement', 0xf59e0b, 0.45, 0.2),
    purple: M('masse_correction', 0x8b10ff, 0.4, 0.1, 0x8b10ff),
    green: M('masse_essai', 0x10b981, 0.4, 0.1, 0x10b981),
    red: M('balourd_origine', 0xef4444, 0.4, 0.1, 0xef4444),
    sensor: M('capteur', isLightMode ? 0x334155 : 0x64748b, 0.4, 0.3),
    cable: M('elastomere', 0x1e293b, 0.7, 0),
    laser: M('laser', 0xef4444, 0.4, 0.1, 0xef4444),
    mark: M('repere_reflechissant', 0xfafafa, 0.2, 0.1, 0xffffff),
    white: M('repere_0deg', 0xf8fafc, 0.2, 0.1, 0xffffff),
    tick: M('graduation', isLightMode ? 0x94a3b8 : 0xcbd5e1, 0.4, 0.1),
    tray: M('caisse_outils', isLightMode ? 0x475569 : 0x0f172a, 0.6, 0.2),
  };

  const H = 0.68;
  const root = new THREE.Group();
  root.name = 'equipement_equilibrage';

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

  // Massif et Châssis
  add('massif_beton', box(3.4, 0.2, 1.1), mat.concrete, 0.05, 0.1, 0);
  add('chassis', box(3.1, 0.12, 0.76), mat.skid, 0.05, 0.261, 0);

  // Moteur électrique
  const motor = grp('moteur', -0.85, H, 0);
  add('carcasse', cylX(0.27, 0.9, 64), mat.body, 0, 0, 0, motor);
  for (let i = 0; i < 9; i++) {
    add('ailette_' + i, cylX(0.295, 0.025, 48), mat.body, -0.37 + i * 0.09, 0, 0, motor);
  }
  add('flasque_NDE', cylX(0.24, 0.06), mat.dark, -0.48, 0, 0, motor);
  add('capot_ventilateur', cylX(0.25, 0.14), mat.body, -0.58, 0, 0, motor);
  add('flasque_DE', cylX(0.24, 0.06), mat.dark, 0.48, 0, 0, motor);
  add('boite_bornes', box(0.22, 0.12, 0.2), mat.body, 0, 0.33, 0, motor);
  for (const x of [-0.3, 0.3]) {
    for (const z of [-0.2, 0.2]) {
      add('patte', box(0.16, 0.15, 0.1), mat.body, x, -0.285, z, motor);
    }
  }

  const motorSpin = grp('arbre_moteur_rot', 0, 0, 0, motor);
  add('arbre_moteur', cylX(0.035, 0.34), mat.steel, 0.66, 0, 0, motorSpin);
  add('moyeu_moteur', cylX(0.09, 0.08), mat.orange, 0.78, 0, 0, motorSpin);
  add('repere_tachy', box(0.03, 0.012, 0.012), mat.mark, 0.6, 0, 0.037, motorSpin);

  // Machine Réceptrice & Rotor
  const rotor = grp('rotor_machine', 0.9, H, 0);
  const rotorSpin = grp('rotor_rot', 0, 0, 0, rotor);
  add('arbre_machine', cylX(0.04, 1.62), mat.steel, -0.05, 0, 0, rotorSpin);
  add('roue', cylX(0.42, 0.16, 96), mat.dark, 0, 0, 0, rotorSpin);
  add('moyeu_roue', cylX(0.12, 0.26), mat.body, 0, 0, 0, rotorSpin);
  add('moyeu_machine', cylX(0.09, 0.08), mat.orange, -0.83, 0, 0, rotorSpin);
  add('element_elastique', cylX(0.075, 0.03), mat.cable, -0.885, 0, 0, rotorSpin);

  // Paliers Pedestals
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

  // Graduations angulaires 360° sur la face du disque rotor (0° au repos côté +Z)
  const FX = 0.081;
  const ticks = grp('graduations', 0, 0, 0, rotorSpin);
  for (let i = 0; i < 36; i++) {
    const a = (i * 10 * Math.PI) / 180;
    const big = i % 9 === 0;
    const len = big ? 0.06 : 0.03;
    const t = add('trait_' + i * 10, box(0.003, len, big ? 0.012 : 0.006), i === 0 ? mat.white : mat.tick, FX, 0, 0, ticks);
    const r = 0.4 - len / 2;
    t.position.set(FX, Math.sin(a) * r, Math.cos(a) * r);
    t.rotation.x = -a;
  }
  add('bande_reflechissante', box(0.15, 0.03, 0.003), mat.white, 0, 0, 0.4215, rotorSpin);

  // Tachymètre laser visant le rotor
  const tach = grp('tachymetre_laser', 0.9, 0, 0.66);
  add('mat', new THREE.CylinderGeometry(0.012, 0.012, H - 0.2, 16), mat.steel, 0, (H + 0.2) / 2, 0, tach);
  add('tete', box(0.06, 0.06, 0.1), mat.sensor, 0, H, 0, tach);
  const beam = add('faisceau', new THREE.CylinderGeometry(0.003, 0.003, 0.18, 8).rotateX(Math.PI / 2), mat.laser, 0, H, -0.14, tach);

  // Caisse à outils (support des masses calibrées)
  const trayPos = new THREE.Vector3(1.25, 0.3, 0.44);
  const tray = add('caisse_masses', box(0.34, 0.06, 0.18), mat.tray, 1.25, 0.23, 0.44, root);

  // Géométrie des masses proportionnelles
  const massGeo = (g: number) => {
    const s = 0.018 + 0.016 * Math.cbrt(Math.max(g, 1) / 15);
    return new THREE.CylinderGeometry(s, s, 0.035, 32).rotateZ(Math.PI / 2);
  };

  const mkMass = (name: string, mt: THREE.Material) => {
    const o = new THREE.Mesh(massGeo(15), mt);
    o.name = name;
    rotorSpin.add(o);
    o.visible = false;
    o.castShadow = true;
    return o;
  };

  const masses = {
    u0: mkMass('balourd_origine', mat.red),
    trial: mkMass('masse_essai', mat.green),
    corr: mkMass('masse_correction', mat.purple)
  };

  const ghost = mkMass('cible_correction', new THREE.MeshStandardMaterial({
    color: 0x8b10ff,
    transparent: true,
    opacity: 0.35,
    roughness: 0.3
  }));

  // Capteur 3RH de mesure
  const s3RHGroup = grp('capteur_3RH', 0.35, H, 0.13, ped3);
  s3RHGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1));
  add('embase', new THREE.CylinderGeometry(0.022, 0.022, 0.012, 24), mat.steel, 0, 0.006, 0, s3RHGroup);
  const s3RHBody = add('corps', new THREE.CylinderGeometry(0.018, 0.018, 0.055, 24), mat.green, 0, 0.04, 0, s3RHGroup) as THREE.Mesh;
  add('connecteur', new THREE.CylinderGeometry(0.009, 0.009, 0.02, 16), mat.steel, 0, 0.077, 0, s3RHGroup);

  // Position locale d'une masse à l'angle a (deg) compté dans le sens inverse de rotation
  const localCoord = (a: number, dir: number, out = new THREE.Vector3()) => {
    const r = (a * Math.PI) / 180;
    return out.set(FX + 0.018, dir * Math.sin(r) * R_POSE, Math.cos(r) * R_POSE);
  };

  const resizeMass = (o: THREE.Mesh, g: number) => {
    o.geometry.dispose();
    o.geometry = massGeo(g);
  };

  return {
    root,
    H,
    FX,
    mat,
    motor,
    motorSpin,
    rotor,
    rotorSpin,
    ped3,
    ped4,
    beam,
    tray,
    trayPos,
    ticks,
    masses,
    ghost,
    s3RHGroup,
    s3RHBody,
    localCoord,
    resizeMass
  };
}

// -------------------------------------------------------------
// MAIN COMPONENT
// -------------------------------------------------------------
export default function UnbalanceModule({ theme = 'dark' }: UnbalanceModuleProps) {
  const isLight = theme === 'light';

  // --- BALANCING DATA STATE ---
  const [data, setData] = useState<BalancingData>({
    oA: 6.2,  // Initial amplitude (mm/s)
    oP: 120,  // Initial phase (deg)
    tA: 4.8,  // Trial amplitude (mm/s)
    tP: 45,   // Trial phase (deg)
    mT: 15,   // Trial weight (g)
    aT: 90,   // Trial angle (deg)
    rpm: 1800, // Rotor nominal speed (1800 RPM / 30 Hz)
    keep: false // Keep trial weight
  });

  // --- SIMULATION & WIZARD STATE ---
  const [direction, setDirection] = useState<number>(-1); // -1: CW (Horaire), 1: CCW (Anti-horaire)
  const [activeStep, setActiveStep] = useState<number>(1);
  const [completedStep, setCompletedStep] = useState<number>(0);
  const [isBusy, setIsBusy] = useState<boolean>(false);
  const [statusBanner, setStatusBanner] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Masses mounted state
  const [hasTrialMass, setHasTrialMass] = useState<boolean>(false);
  const [installedCorrection, setInstalledCorrection] = useState<{ m: number; a: number } | null>(null);
  const [measuredValues, setMeasuredValues] = useState<{ O?: Vector2D; T?: Vector2D; F?: Vector2D }>({});
  const [ePlotProgress, setEPlotProgress] = useState<number>(0);

  // Layer visual toggles
  const [showU0, setShowU0] = useState<boolean>(true);
  const [showTrial, setShowTrial] = useState<boolean>(true);
  const [showCorr, setShowCorr] = useState<boolean>(true);
  const [showTicks, setShowTicks] = useState<boolean>(true);

  // Live real-time vibration readout
  const [liveVib, setLiveVib] = useState<number>(0);
  const [livePhase, setLivePhase] = useState<number>(0);
  const [liveRpm, setLiveRpm] = useState<number>(0);

  // 2D Screen Projection Labels
  const [labelsPos, setLabelsPos] = useState<Record<string, { x: number; y: number; visible: boolean; text: string; color?: string }>>({});
  // Refs
  const viewportRef = useRef<HTMLDivElement>(null);
  const polarCanvasRef = useRef<HTMLCanvasElement>(null);

  const threeRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    model: ReturnType<typeof buildMachineBalancing>;
    basePositions: { r: THREE.Vector3; p3: THREE.Vector3; p4: THREE.Vector3 };
  } | null>(null);

  // Animation physics state ref
  const animStateRef = useRef({
    speed: 0,
    speedTarget: 0,
    psi: 0,
    measuring: false,
    flying: false,
    flyingCorr: false,
    data,
    direction,
    hasTrialMass,
    installedCorrection,
    measuredValues,
    ePlotProgress,
    showU0,
    showTrial,
    showCorr,
    showTicks,
    isLight
  });

  // Calculate vector balancing solutions
  const solution = useMemo(() => {
    return solveBalancing(data);
  }, [data]);

  useEffect(() => {
    animStateRef.current = {
      speed: animStateRef.current.speed,
      speedTarget: animStateRef.current.speedTarget,
      psi: animStateRef.current.psi,
      measuring: animStateRef.current.measuring,
      flying: animStateRef.current.flying,
      flyingCorr: animStateRef.current.flyingCorr,
      data,
      direction,
      hasTrialMass,
      installedCorrection,
      measuredValues,
      ePlotProgress,
      showU0,
      showTrial,
      showCorr,
      showTicks,
      isLight
    };
  }, [data, direction, hasTrialMass, installedCorrection, measuredValues, ePlotProgress, showU0, showTrial, showCorr, showTicks, isLight]);

  // -------------------------------------------------------------
  // INITIALIZE THREE.JS 3D SCENE
  // -------------------------------------------------------------
  useEffect(() => {
    const container = viewportRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 460;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(isLight ? 0xf8fafc : 0x090d16);

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 50);
    // Framing the rotor face and Palier 3
    camera.position.set(2.4, 1.6, 2.7);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.target.set(0.65, 0.58, 0);
    controls.maxPolarAngle = Math.PI / 2 - 0.02;
    controls.minDistance = 1.0;
    controls.maxDistance = 8.0;

    // Lighting Studio
    const hemiLight = new THREE.HemisphereLight(0xffffff, isLight ? 0x94a3b8 : 0x1e293b, 1.2);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
    dirLight.position.set(3.5, 5.5, 4.0);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.5);
    fillLight.position.set(-3, 3, -3);
    scene.add(fillLight);

    // Floor Shadow
    const floorGeo = new THREE.PlaneGeometry(10, 10);
    const floorMat = new THREE.ShadowMaterial({ opacity: isLight ? 0.15 : 0.35 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    scene.add(floor);

    // Build Machine
    const model = buildMachineBalancing(isLight);
    scene.add(model.root);

    const basePositions = {
      r: model.rotor.position.clone(),
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

    const resizeObserver = new ResizeObserver(() => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      renderer.dispose();
      controls.dispose();
      threeRef.current = null;
    };
  }, [isLight]);

  // -------------------------------------------------------------
  // ANIMATION LOOP & 3D DYNAMICS
  // -------------------------------------------------------------
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();
    const tempVec = new THREE.Vector3();

    const renderLoop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      const st = animStateRef.current;
      const tObj = threeRef.current;

      // Smooth acceleration / deceleration
      st.speed += Math.sign(st.speedTarget - st.speed) * Math.min(Math.abs(st.speedTarget - st.speed), dt * 0.55);
      st.psi += dt * st.speed * (st.data.rpm / 60) * 360 * 0.05;

      const currentSol = solveBalancing(st.data);

      if (tObj) {
        const { controls, renderer, scene, camera, model, basePositions } = tObj;

        // Rotor rotation
        const rot = (st.direction * st.psi * Math.PI) / 180;
        model.rotorSpin.rotation.x = rot;
        model.motorSpin.rotation.x = rot;

        // Laser strobe beam
        model.beam.visible = (st.speed > 0.02 && Math.cos(rot) > 0.985) || st.speed <= 0.02;

        // Position masses on rotor face
        const M = model.masses;
        model.localCoord(currentSol.u0A, st.direction, M.u0.position);
        M.u0.visible = st.showU0;

        if (!st.flying) {
          model.localCoord(st.data.aT, st.direction, M.trial.position);
          M.trial.visible = st.hasTrialMass && st.showTrial;
        }

        if (st.installedCorrection && !st.flyingCorr) {
          model.localCoord(st.installedCorrection.a, st.direction, M.corr.position);
        }
        M.corr.visible = (!!st.installedCorrection && st.showCorr && !st.flyingCorr) || st.flyingCorr;

        model.localCoord(currentSol.corrA, st.direction, model.ghost.position);
        model.ghost.visible = completedStep >= 3 && !st.installedCorrection && st.showCorr;

        model.ticks.visible = st.showTicks;

        // Resize masses geometry
        model.resizeMass(M.trial, st.data.mT);
        model.resizeMass(M.u0, currentSol.u0M);
        if (!st.installedCorrection) {
          model.resizeMass(model.ghost, currentSol.corrM);
        } else {
          model.resizeMass(M.corr, st.installedCorrection.m);
        }

        // Calculate dynamic vibration response
        const vib = calculateVibrationState(currentSol, {
          trial: st.hasTrialMass,
          corr: st.installedCorrection
        });

        // Speed squared force effect (vibration amplitude proportional to unbalance force)
        const dynamicAmp = amp(vib) * (st.speed * st.speed);

        // Rotor dynamic orbit displacement toward heavy spot
        const heavy = ang(vib) - currentSol.alphaP;
        const beta = ((st.direction * heavy - st.direction * st.psi) * Math.PI) / 180;
        const kDisp = 0.0024 * dynamicAmp;

        const off = new THREE.Vector3(0, Math.sin(beta) * kDisp, Math.cos(beta) * kDisp);
        model.rotor.position.copy(basePositions.r).add(off);
        model.ped3.position.copy(basePositions.p3).addScaledVector(off, 0.65);
        model.ped4.position.copy(basePositions.p4).addScaledVector(off, 0.65);

        controls.update();
        renderer.render(scene, camera);

        // Live measurements state update
        const jitter = st.measuring ? 1 + (Math.random() - 0.5) * 0.05 : 1;
        setLiveVib(Number((dynamicAmp * jitter).toFixed(2)));
        setLivePhase(Math.round(ang(vib)));
        setLiveRpm(Math.round(st.data.rpm * st.speed));

        // 2D Screen Projection Labels
        const w = renderer.domElement.clientWidth;
        const h = renderer.domElement.clientHeight;

        if (st.speed < 0.35) {
          const newLabels: Record<string, { x: number; y: number; visible: boolean; text: string; color?: string }> = {};
          const sp = model.rotorSpin;

          // Rotor 0°, 90°, 180°, 270° angles
          if (st.showTicks) {
            for (const a of [0, 90, 180, 270]) {
              const posL = model.localCoord(a, st.direction).multiplyScalar(1.33).setX(model.FX + 0.02);
              sp.localToWorld(tempVec.copy(posL)).project(camera);
              newLabels['deg_' + a] = {
                x: ((tempVec.x + 1) / 2) * w,
                y: ((1 - tempVec.y) / 2) * h,
                visible: tempVec.z < 1,
                text: `${a}°`
              };
            }
          }

          // Masses labels
          if (M.u0.visible) {
            sp.localToWorld(tempVec.copy(M.u0.position).add(new THREE.Vector3(0.06, 0, 0))).project(camera);
            newLabels['u0'] = {
              x: ((tempVec.x + 1) / 2) * w,
              y: ((1 - tempVec.y) / 2) * h,
              visible: tempVec.z < 1,
              text: `Balourd O (${currentSol.u0M.toFixed(1)}g)`,
              color: '#ef4444'
            };
          }

          if (M.trial.visible) {
            sp.localToWorld(tempVec.copy(M.trial.position).add(new THREE.Vector3(0.06, 0, 0))).project(camera);
            newLabels['trial'] = {
              x: ((tempVec.x + 1) / 2) * w,
              y: ((1 - tempVec.y) / 2) * h,
              visible: tempVec.z < 1,
              text: `Essai (${st.data.mT}g)`,
              color: '#10b981'
            };
          }

          if (M.corr.visible && st.installedCorrection) {
            sp.localToWorld(tempVec.copy(M.corr.position).add(new THREE.Vector3(0.06, 0, 0))).project(camera);
            newLabels['corr'] = {
              x: ((tempVec.x + 1) / 2) * w,
              y: ((1 - tempVec.y) / 2) * h,
              visible: tempVec.z < 1,
              text: `Correction (${st.installedCorrection.m.toFixed(1)}g)`,
              color: '#8b10ff'
            };
          }

          if (model.ghost.visible) {
            sp.localToWorld(tempVec.copy(model.ghost.position).add(new THREE.Vector3(0.06, 0, 0))).project(camera);
            newLabels['ghost'] = {
              x: ((tempVec.x + 1) / 2) * w,
              y: ((1 - tempVec.y) / 2) * h,
              visible: tempVec.z < 1,
              text: `Cible W (${currentSol.corrM.toFixed(1)}g)`,
              color: '#a78bfa'
            };
          }

          setLabelsPos(newLabels);
        } else {
          setLabelsPos({});
        }
      }

      // Draw Polar Canvas
      drawPolar();

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [completedStep]);

  // -------------------------------------------------------------
  // POLAR VECTOR DIAGRAM DRAWING
  // -------------------------------------------------------------
  const drawPolar = () => {
    const canvas = polarCanvasRef.current;
    if (!canvas) return;

    const st = animStateRef.current;
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.clientWidth;
    const Hh = canvas.clientHeight || 360;

    if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(Hh * dpr)) {
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(Hh * dpr);
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, Hh);

    const isLightMode = st.isLight;
    ctx.fillStyle = isLightMode ? '#ffffff' : '#0a0f1d';
    ctx.fillRect(0, 0, W, Hh);

    const cx = W / 2;
    const cy = Hh / 2;
    const R = Hh / 2 - 32;
    const currentSol = solveBalancing(st.data);
    const maxVal = Math.max(st.data.oA, st.data.tA, amp(currentSol.corr), 1) * 1.25;
    const k = R / maxVal;

    // Concentric amplitude circles
    ctx.strokeStyle = isLightMode ? '#e2e8f0' : '#1e293b';
    ctx.lineWidth = 1;
    ctx.font = '10px ui-monospace, Menlo, monospace';
    ctx.fillStyle = isLightMode ? '#64748b' : '#94a3b8';
    ctx.textAlign = 'center';

    for (let i = 1; i <= 4; i++) {
      ctx.beginPath();
      ctx.arc(cx, cy, (R * i) / 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillText(((maxVal * i) / 4).toFixed(1) + ' mm/s', cx + (R * i) / 4, cy + 12);
    }

    // Radial angle lines (every 30°)
    for (let a = 0; a < 360; a += 30) {
      const t = (a * Math.PI) / 180;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + R * Math.cos(t), cy - R * Math.sin(t));
      ctx.stroke();
      ctx.fillText(a + '°', cx + (R + 15) * Math.cos(t), cy - (R + 15) * Math.sin(t) + 3);
    }

    const toScreen = (v: Vector2D): [number, number] => [cx + v.x * k, cy - v.y * k];

    // Arrow vector renderer
    const drawArrow = (from: Vector2D, to: Vector2D, col: string, label: string, isDashed = false) => {
      const [x0, y0] = toScreen(from);
      const [x1, y1] = toScreen(to);

      ctx.strokeStyle = col;
      ctx.fillStyle = col;
      ctx.lineWidth = 2.5;
      ctx.setLineDash(isDashed ? [6, 4] : []);
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
      ctx.setLineDash([]);

      const headAngle = Math.atan2(y1 - y0, x1 - x0);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x1 - 10 * Math.cos(headAngle - 0.35), y1 - 10 * Math.sin(headAngle - 0.35));
      ctx.lineTo(x1 - 10 * Math.cos(headAngle + 0.35), y1 - 10 * Math.sin(headAngle + 0.35));
      ctx.fill();

      if (label) {
        ctx.font = 'bold 11px ui-monospace, Menlo, monospace';
        ctx.textAlign = 'left';
        ctx.fillText(label, x1 + 8, y1 - 6);
      }
    };

    const originV: Vector2D = { x: 0, y: 0 };

    // 1. Vector O (Initial unbalance)
    if (st.measuredValues.O) {
      drawArrow(originV, currentSol.O, '#ef4444', `O (Origine) ${amp(currentSol.O).toFixed(1)} mm/s`);
    }

    // 2. Vector T (Trial run)
    if (st.measuredValues.T) {
      drawArrow(originV, currentSol.T, '#3b82f6', `T (Essai) ${amp(currentSol.T).toFixed(1)} mm/s`);
    }

    // 3. Vector E (Effect) and -O (Correction direction)
    if (st.ePlotProgress > 0) {
      const eInterp = {
        x: currentSol.O.x + currentSol.E.x * st.ePlotProgress,
        y: currentSol.O.y + currentSol.E.y * st.ePlotProgress
      };
      drawArrow(currentSol.O, eInterp, '#f59e0b', st.ePlotProgress > 0.95 ? `E (Effet) ${amp(currentSol.E).toFixed(1)}` : '', true);

      const cInterp = {
        x: -currentSol.O.x * st.ePlotProgress,
        y: -currentSol.O.y * st.ePlotProgress
      };
      drawArrow(originV, cInterp, '#8b10ff', st.ePlotProgress > 0.95 ? `Correction (-O)` : '');
    }

    // 4. Vector R (Final control)
    if (st.measuredValues.F) {
      drawArrow(originV, st.measuredValues.F, '#10b981', `R (Résiduel) ${amp(st.measuredValues.F).toFixed(2)} mm/s`);
    }

    // Center pivot point
    ctx.fillStyle = isLightMode ? '#0f172a' : '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
    ctx.fill();
  };

  // -------------------------------------------------------------
  // ANIMATION HELPERS (FLY, INDEX, SPIN)
  // -------------------------------------------------------------
  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
  const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
  const tween = (dur: number, fn: (u: number) => void) =>
    new Promise<void>((resolve) => {
      const t0 = performance.now();
      const frame = (t: number) => {
        const u = Math.min((t - t0) / dur, 1);
        fn(easeInOut(u));
        if (u < 1) requestAnimationFrame(frame);
        else resolve();
      };
      requestAnimationFrame(frame);
    });

  const showBanner = (text: string) => {
    setStatusBanner(text);
  };

  const spinRotorTo = async (target: number) => {
    animStateRef.current.speedTarget = target;
    while (Math.abs(animStateRef.current.speed - target) > 0.015) {
      await sleep(40);
    }
    animStateRef.current.speed = target;
  };

  const indexRotorAngle = async (targetAngle: number) => {
    const target = targetAngle - 90 * direction;
    const from = animStateRef.current.psi;
    const delta = wrap(target - from);
    await tween(900 + delta * 4, (u) => {
      animStateRef.current.psi = from + delta * u;
    });
  };

  const fly3DMass = async (mesh: THREE.Mesh, fromWorld: THREE.Vector3, toLocal: THREE.Vector3, dur = 1300) => {
    const parent = mesh.parent;
    if (!parent) return;
    const a = fromWorld.clone();
    const p = new THREE.Vector3();
    mesh.visible = true;

    await tween(dur, (u) => {
      const b = parent.localToWorld(toLocal.clone());
      p.lerpVectors(a, b, u);
      p.y += Math.sin(u * Math.PI) * 0.35; // Parabolic jump arc
      mesh.position.copy(parent.worldToLocal(p.clone()));
    });
  };

  // -------------------------------------------------------------
  // 5-STEP BALANCING PROTOCOL
  // -------------------------------------------------------------
  const executeStep = async (stepNum: number) => {
    if (isBusy || !threeRef.current) return;
    setIsBusy(true);

    const m = threeRef.current.model;
    const sol = solveBalancing(data);

    if (stepNum === 1) {
      // Step 1: Initial Run (Vector O)
      showBanner('Démarrage du rotor pour la mesure initiale O…');
      await spinRotorTo(1);

      showBanner('Acquisition Run 1 : Moyennage synchrone tachymètre 8 tours…');
      animStateRef.current.measuring = true;
      await sleep(2200);
      animStateRef.current.measuring = false;

      const vO = calculateVibrationState(sol, { trial: false, corr: null });
      setMeasuredValues((prev) => ({ ...prev, O: vO }));
      setCompletedStep(Math.max(completedStep, 1));
      setActiveStep(2);
      showBanner(`Run Initial O mesuré : ${amp(vO).toFixed(2)} mm/s @ ${Math.round(ang(vO))}°`);
    } else if (stepNum === 2) {
      // Step 2: Install Trial Mass & Run 2 (Vector T)
      showBanner('Arrêt et consignation sécurisée du rotor…');
      await spinRotorTo(0);

      showBanner(`Indexation automatique du rotor à ${data.aT}° en position de pose…`);
      await indexRotorAngle(data.aT);

      showBanner(`Installation de la masse d'essai calibrée de ${data.mT}g…`);
      animStateRef.current.flying = true;
      m.masses.trial.position.copy(m.rotorSpin.worldToLocal(m.trayPos.clone()));
      await fly3DMass(m.masses.trial, m.trayPos, m.localCoord(data.aT, direction));
      animStateRef.current.flying = false;
      setHasTrialMass(true);

      await sleep(350);
      showBanner('Redémarrage du rotor avec la masse d\'essai…');
      await spinRotorTo(1);

      showBanner('Acquisition Run 2 (T) : Synchronisation laser & mesure vectorielle…');
      animStateRef.current.measuring = true;
      await sleep(2200);
      animStateRef.current.measuring = false;

      const vT = calculateVibrationState(sol, { trial: true, corr: null });
      setMeasuredValues((prev) => ({ ...prev, T: vT }));
      setCompletedStep(Math.max(completedStep, 2));
      setActiveStep(3);
      showBanner(`Run d'Essai T mesuré : ${amp(vT).toFixed(2)} mm/s @ ${Math.round(ang(vT))}°`);
    } else if (stepNum === 3) {
      // Step 3: Compute Vector Correction (E, alpha, W)
      showBanner('Calcul des coefficients vectoriels : E = T - O, α = E / Mₜ, W = -O / α…');
      await tween(1800, (u) => setEPlotProgress(u));
      setCompletedStep(Math.max(completedStep, 3));
      setActiveStep(4);
      showBanner('Cible de correction calculée et projetée en 3D sur le rotor (repère violet transparent)');
    } else if (stepNum === 4) {
      // Step 4: Install Correction Weight
      const realCorr = calculateInstalledCorrection(sol);
      showBanner('Arrêt du rotor pour intervention sur site…');
      await spinRotorTo(0);

      if (!data.keep) {
        showBanner('Retrait de la masse d\'essai...');
        await indexRotorAngle(data.aT);
        animStateRef.current.flying = true;
        await fly3DMass(
          m.masses.trial,
          m.rotorSpin.localToWorld(m.masses.trial.position.clone()),
          m.rotorSpin.worldToLocal(m.trayPos.clone()),
          1100
        );
        animStateRef.current.flying = false;
        m.masses.trial.visible = false;
        setHasTrialMass(false);
      }

      showBanner(`Indexation automatique à l'angle de correction ${realCorr.a}°…`);
      await indexRotorAngle(realCorr.a);

      showBanner(`Pose de la masse de correction finale ${realCorr.m.toFixed(1)}g…`);
      m.resizeMass(m.masses.corr, realCorr.m);
      animStateRef.current.flyingCorr = true;
      m.ghost.visible = false;
      m.masses.corr.position.copy(m.rotorSpin.worldToLocal(m.trayPos.clone()));
      await fly3DMass(m.masses.corr, m.trayPos, m.localCoord(realCorr.a, direction));
      animStateRef.current.flyingCorr = false;
      setInstalledCorrection(realCorr);

      setCompletedStep(Math.max(completedStep, 4));
      setActiveStep(5);
      showBanner(`Masse de correction installée : ${realCorr.m.toFixed(1)}g à ${realCorr.a}°`);
    } else if (stepNum === 5) {
      // Step 5: Final Verification Run (Vector R)
      showBanner('Démarrage du rotor pour le run de contrôle final…');
      await spinRotorTo(1);

      showBanner('Acquisition finale : Mesure de la vibration résiduelle R…');
      animStateRef.current.measuring = true;
      await sleep(2200);
      animStateRef.current.measuring = false;

      const vFinal = calculateVibrationState(sol, {
        trial: data.keep,
        corr: installedCorrection
      });
      setMeasuredValues((prev) => ({ ...prev, F: vFinal }));
      setCompletedStep(Math.max(completedStep, 5));

      const reductionPct = Math.round((1 - amp(vFinal) / data.oA) * 100);
      const isoZone = getIsoSeverity(amp(vFinal));
      showBanner(`Run de Contrôle terminé : R = ${amp(vFinal).toFixed(2)} mm/s (Réduction ${reductionPct}%) • ${isoZone.t}`);
    }

    setIsBusy(false);
  };

  // Reset Wizard
  const handleResetWizard = async () => {
    if (isBusy) return;
    setIsBusy(true);
    showBanner('Réinitialisation du banc d\'équilibrage…');
    await spinRotorTo(0);

    setCompletedStep(0);
    setActiveStep(1);
    setHasTrialMass(false);
    setInstalledCorrection(null);
    setMeasuredValues({});
    setEPlotProgress(0);

    if (threeRef.current) {
      const m = threeRef.current.model;
      m.masses.trial.visible = false;
      m.masses.corr.visible = false;
      m.ghost.visible = false;
    }

    setIsBusy(false);
    showBanner('Banc réinitialisé : Prêt pour le run d\'origine O');
  };

  const handleResetCamera = () => {
    if (threeRef.current) {
      const { camera, controls } = threeRef.current;
      camera.position.set(2.4, 1.6, 2.7);
      controls.target.set(0.65, 0.58, 0);
      controls.update();
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
            <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-600">
              <Scale className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-purple-600 text-white">
                  ÉQUILIBRAGE DYNAMIQUE 1 PLAN ISO 1940
                </span>
                <span className={`text-xs font-mono font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Méthode des Coefficients d'Influence & Diagnostic ISO 1940
                </span>
              </div>
              <h2 className={`text-xl font-black tracking-tight mt-1 ${isLight ? 'text-slate-950' : 'text-white'}`}>
                Équilibrage sur Site 3D : Ligne d'Arbre & Correction Vectorielle
              </h2>
              <p className={`text-xs mt-1 max-w-3xl leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Simulez une intervention complète d'équilibrage monoplan sur machine tournante : run d'origine O, pose de masse d'essai T, calcul de sensibilité α et pose de correction W avec contrôle en 3D.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Experimental Controls (Left 4 cols) | 3D Machine + Polar Diagram (Right 8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column: Experimental Controls & Mass Tools (4 cols) */}
        <div className="lg:col-span-4 space-y-6">

          {/* Card 1: Experimental Data Inputs */}
          <div className={`p-5 rounded-2xl border shadow-sm ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#0D1322] border-slate-800'
          }`}>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-purple-500" />
                <span className="text-xs font-black uppercase tracking-wider">
                  Données Expérimentales
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {/* Box 1: Run O */}
              <div className={`p-3 rounded-xl border ${
                isLight ? 'bg-red-50/40 border-red-200' : 'bg-red-950/20 border-red-900/40'
              }`}>
                <span className="text-[11px] font-black uppercase tracking-wider text-red-600 dark:text-red-400 block mb-2">
                  1. Run Initial (O) : Sans Masse
                </span>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-500 block">Amplitude O</label>
                    <div className="flex items-center justify-between font-mono font-bold">
                      <span className="text-red-600">{data.oA.toFixed(1)} mm/s</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="15"
                      step="0.1"
                      value={data.oA}
                      disabled={completedStep >= 1}
                      onChange={(e) => setData({ ...data, oA: Number(e.target.value) })}
                      className="w-full accent-red-600 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block">Phase O</label>
                    <div className="flex items-center justify-between font-mono font-bold">
                      <span className="text-red-600">{data.oP}°</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="359"
                      value={data.oP}
                      disabled={completedStep >= 1}
                      onChange={(e) => setData({ ...data, oP: Number(e.target.value) })}
                      className="w-full accent-red-600 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Box 2: Run T */}
              <div className={`p-3 rounded-xl border ${
                isLight ? 'bg-blue-50/40 border-blue-200' : 'bg-blue-950/20 border-blue-900/40'
              }`}>
                <span className="text-[11px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 block mb-2">
                  2. Run d'Essai (T) : Avec Masse
                </span>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-500 block">Amplitude T</label>
                    <div className="flex items-center justify-between font-mono font-bold">
                      <span className="text-blue-600">{data.tA.toFixed(1)} mm/s</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="15"
                      step="0.1"
                      value={data.tA}
                      disabled={completedStep >= 2}
                      onChange={(e) => setData({ ...data, tA: Number(e.target.value) })}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block">Phase T</label>
                    <div className="flex items-center justify-between font-mono font-bold">
                      <span className="text-blue-600">{data.tP}°</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="359"
                      value={data.tP}
                      disabled={completedStep >= 2}
                      onChange={(e) => setData({ ...data, tP: Number(e.target.value) })}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Box 3: Installed Trial Weight */}
              <div className={`p-3 rounded-xl border ${
                isLight ? 'bg-emerald-50/40 border-emerald-200' : 'bg-emerald-950/20 border-emerald-900/40'
              }`}>
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-2">
                  3. Masse d'Essai Installée (Mₜ)
                </span>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-500 block">Masse Mₜ</label>
                    <div className="flex items-center justify-between font-mono font-bold">
                      <span className="text-emerald-600">{data.mT.toFixed(1)} g</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="100"
                      step="0.5"
                      value={data.mT}
                      disabled={completedStep >= 2}
                      onChange={(e) => setData({ ...data, mT: Number(e.target.value) })}
                      className="w-full accent-emerald-600 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block">Angle de Pose</label>
                    <div className="flex items-center justify-between font-mono font-bold">
                      <span className="text-emerald-600">{data.aT}°</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="359"
                      value={data.aT}
                      disabled={completedStep >= 2}
                      onChange={(e) => setData({ ...data, aT: Number(e.target.value) })}
                      className="w-full accent-emerald-600 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Box 4: Rotor Speed Control */}
              <div className={`p-3 rounded-xl border ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#090D16] border-slate-800'
              }`}>
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Vitesse Rotor :
                  </span>
                  <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                    {data.rpm} tr/min ({(data.rpm / 60).toFixed(1)} Hz)
                  </span>
                </div>
                <input
                  type="range"
                  min="300"
                  max="3600"
                  step="50"
                  value={data.rpm}
                  onChange={(e) => setData({ ...data, rpm: Number(e.target.value) })}
                  className="w-full accent-purple-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
                  <span>300 tr/min</span>
                  <span>1800 tr/min (Nominal)</span>
                  <span>3600 tr/min</span>
                </div>
              </div>

              {/* Box 5: Field Options & Display */}
              <div className="space-y-3 pt-2">
                <div>
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Sens de Rotation (vu depuis Palier 4) :
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setDirection(-1)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        direction === -1
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : isLight ? 'bg-white border-slate-300 text-slate-700' : 'bg-slate-800 border-slate-700 text-slate-300'
                      }`}
                    >
                      ↻ Horaire (CW)
                    </button>
                    <button
                      onClick={() => setDirection(1)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        direction === 1
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : isLight ? 'bg-white border-slate-300 text-slate-700' : 'bg-slate-800 border-slate-700 text-slate-300'
                      }`}
                    >
                      ↺ Anti-horaire (CCW)
                    </button>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Gestion de la Masse d'Essai :
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setData({ ...data, keep: false })}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        !data.keep
                          ? 'bg-purple-600 border-purple-600 text-white'
                          : isLight ? 'bg-white border-slate-300 text-slate-700' : 'bg-slate-800 border-slate-700 text-slate-300'
                      }`}
                    >
                      Retirer Masse Essai
                    </button>
                    <button
                      onClick={() => setData({ ...data, keep: true })}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        data.keep
                          ? 'bg-purple-600 border-purple-600 text-white'
                          : isLight ? 'bg-white border-slate-300 text-slate-700' : 'bg-slate-800 border-slate-700 text-slate-300'
                      }`}
                    >
                      Conserver Masse Essai
                    </button>
                  </div>
                </div>

                {/* Layer Visibility Checkboxes */}
                <div className="grid grid-cols-2 gap-2 pt-2 text-xs font-semibold">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showU0}
                      onChange={(e) => setShowU0(e.target.checked)}
                      className="accent-red-600"
                    />
                    <span className="text-red-500">Balourd O</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showTrial}
                      onChange={(e) => setShowTrial(e.target.checked)}
                      className="accent-emerald-600"
                    />
                    <span className="text-emerald-500">Masse d'Essai</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showCorr}
                      onChange={(e) => setShowCorr(e.target.checked)}
                      className="accent-purple-600"
                    />
                    <span className="text-purple-500">Correction</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showTicks}
                      onChange={(e) => setShowTicks(e.target.checked)}
                      className="accent-blue-600"
                    />
                    <span>Graduations 360°</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Calibrated Weight Toolkit */}
          <div className={`p-4 rounded-2xl border shadow-sm ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#0D1322] border-slate-800'
          }`}>
            <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-2">
              Boîte à Outils : Masses d'Essai Calibrées
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { name: 'Vis légère', g: 5 },
                { name: 'Vis standard', g: 15 },
                { name: 'Contrepoids', g: 40 },
                { name: 'Lest lourd', g: 80 },
              ].map((tool) => (
                <button
                  key={tool.g}
                  onClick={() => {
                    if (hasTrialMass) {
                      showBanner('Arrêtez le rotor et retirez d\'abord la masse d\'essai en cours.');
                      return;
                    }
                    setData({ ...data, mT: tool.g });
                  }}
                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                    data.mT === tool.g
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : isLight ? 'bg-slate-50 border-slate-200 hover:border-emerald-300' : 'bg-slate-900 border-slate-700 hover:border-emerald-600'
                  }`}
                >
                  <span className="text-[10px] font-bold">{tool.name}</span>
                  <span className="text-xs font-mono font-black">{tool.g} g</span>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: 3D Viewport + Results + Polar Vector Canvas (8 cols) */}
        <div className="lg:col-span-8 space-y-6">

          {/* Results Summary Header Card */}
          <div className={`p-5 rounded-2xl border shadow-sm ${
            isLight ? 'bg-purple-50/50 border-purple-200' : 'bg-purple-950/20 border-purple-800/40'
          }`}>
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-purple-300 dark:border-purple-800/50">
              <span className="text-xs font-black uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-purple-500" />
                Correction Vectorielle Calculée (W{data.keep ? '′ = W − Mₜ' : ''})
              </span>
              <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400">
                α = {Math.round(solution.alphaA * 1000)} µm/s/g @ {Math.round(solution.alphaP)}°
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              <div className="sm:col-span-1 text-center sm:text-left">
                <span className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400 block">
                  Masse de Correction :
                </span>
                <span className="text-2xl font-mono font-black text-purple-600 dark:text-purple-400">
                  {solution.corrM.toFixed(1)} g
                </span>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
                  à poser à l'angle : <strong className="text-purple-600">{Math.round(solution.corrA)}°</strong>
                </span>
              </div>

              <div className="sm:col-span-2 grid grid-cols-2 gap-3 text-xs font-mono">
                <div className={`p-2.5 rounded-lg border ${isLight ? 'bg-white border-purple-200' : 'bg-slate-900 border-purple-900/60'}`}>
                  <span className="text-[10px] text-slate-500 block">Effet Masse Essai E :</span>
                  <span className="font-bold text-amber-600">
                    {amp(solution.E).toFixed(2)} mm/s @ {Math.round(ang(solution.E))}°
                  </span>
                </div>
                <div className={`p-2.5 rounded-lg border ${isLight ? 'bg-white border-purple-200' : 'bg-slate-900 border-purple-900/60'}`}>
                  <span className="text-[10px] text-slate-500 block">Balourd Estimé U₀ :</span>
                  <span className="font-bold text-red-600">
                    {solution.u0M.toFixed(1)} g @ {Math.round(solution.u0A)}°
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 3D Viewport Card */}
          <div className={`p-5 rounded-2xl border shadow-sm relative ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#0D1322] border-slate-800'
          }`}>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-purple-500" />
                <span className="text-xs font-black uppercase tracking-wider">
                  Simulation 3D : Ligne d'Arbre, Masses d'Équilibrage & Capteur 3RH
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleResetCamera}
                  title="Réinitialiser la vue caméra"
                  className={`p-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                    isLight ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  title={isExpanded ? 'Réduire la vue 3D' : 'Agrandir la vue 3D'}
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
              className={`relative rounded-xl border overflow-hidden ${isExpanded ? 'h-[620px]' : 'h-[460px]'} ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#090D16] border-slate-800'
              }`}
            >
              <div ref={viewportRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

              {/* DYNAMIC 3D HUD OVERLAY (BALANCING PARAMETERS) */}
              <div className={`absolute top-3 left-3 z-30 p-3 rounded-xl border backdrop-blur-md shadow-xl max-w-xs transition-all ${
                isLight 
                  ? 'bg-white/95 border-purple-200 text-slate-900 shadow-purple-500/10' 
                  : 'bg-[#0D1322]/95 border-purple-800/50 text-white shadow-black/40'
              }`}>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
                  <span className="text-[11px] font-black tracking-wide uppercase text-purple-600 dark:text-purple-400">
                    PARAMÈTRES D'ÉQUILIBRAGE ROTOR
                  </span>
                </div>

                <div className="mt-2 space-y-1.5 text-[11px] font-mono">
                  <div className="flex justify-between gap-3 text-slate-600 dark:text-slate-300">
                    <span>Vitesse :</span>
                    <strong className="text-slate-900 dark:text-white">{liveRpm} tr/min ({(data.rpm / 60).toFixed(1)} Hz)</strong>
                  </div>
                  <div className="flex justify-between gap-3 text-slate-600 dark:text-slate-300">
                    <span>Balourd U₀ :</span>
                    <strong className="text-red-500">{solution.u0M.toFixed(1)} g @ {Math.round(solution.u0A)}°</strong>
                  </div>
                  <div className="flex justify-between gap-3 text-slate-600 dark:text-slate-300">
                    <span>Force F_c (U₀) :</span>
                    <strong className="text-red-500">{solution.forceU0.toFixed(1)} N</strong>
                  </div>
                  <div className="flex justify-between gap-3 text-slate-600 dark:text-slate-300">
                    <span>Rayon de pose R :</span>
                    <strong className="text-slate-900 dark:text-white">330 mm</strong>
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-[10px]">
                  <span className="text-slate-500">Masse d'essai : {data.mT}g @ {data.aT}°</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">F_essai = {solution.forceTrial.toFixed(1)} N</span>
                </div>
              </div>

              {/* Real-time vibration readout pill (Top Right) */}
              <div className={`absolute top-3 right-3 z-30 px-3 py-2 rounded-xl border backdrop-blur-md shadow-md text-right ${
                isLight ? 'bg-white/95 border-slate-200' : 'bg-slate-900/95 border-slate-800'
              }`}>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Vibration Palier 3 (1x) :</span>
                <span className="text-lg font-mono font-black text-purple-600 dark:text-purple-400">
                  {liveVib.toFixed(2)} mm/s
                </span>
                <span className="text-[10px] font-mono text-slate-500 block">
                  {liveRpm > 50 ? `Phase: ${livePhase}°` : 'Rotor consigné'}
                </span>
              </div>

              {/* 3D Dynamic Floating Labels on Rotor Face */}
              {(Object.entries(labelsPos) as [string, { x: number; y: number; visible: boolean; text: string; color?: string }][]).map(([k, lbl]) => {
                if (!lbl.visible) return null;
                return (
                  <div
                    key={k}
                    className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20 px-1.5 py-0.5 rounded text-[10px] font-black font-mono shadow-sm transition-transform"
                    style={{
                      left: `${lbl.x}px`,
                      top: `${lbl.y}px`,
                      backgroundColor: lbl.color || (isLight ? '#ffffff' : '#0f172a'),
                      color: lbl.color ? '#ffffff' : (isLight ? '#334155' : '#cbd5e1'),
                      border: `1px solid ${lbl.color || (isLight ? '#cbd5e1' : '#334155')}`
                    }}
                  >
                    {lbl.text}
                  </div>
                );
              })}

              {/* Status Banner along bottom */}
              {statusBanner && (
                <div className="absolute left-1/2 -translate-x-1/2 bottom-3 z-30 px-4 py-1.5 rounded-full bg-slate-900/90 text-white border border-slate-700 text-xs font-semibold backdrop-blur-md shadow-lg max-w-[90%] text-center">
                  {statusBanner}
                </div>
              )}
            </div>

            {/* Quick Metrics Bar below 3D */}
            <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3.5 p-3 rounded-xl border text-xs font-mono ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#090D16] border-slate-800'
            }`}>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Force Centrifuge Mₜ :</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{solution.forceTrial.toFixed(1)} N</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Force Balourd U₀ :</span>
                <span className="font-bold text-red-600 dark:text-red-400">{solution.forceU0.toFixed(1)} N</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Vibration Essai :</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">{solution.vibTrial.toFixed(2)} mm/s</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Sensibilité α :</span>
                <span className="font-bold text-purple-600 dark:text-purple-400">{Math.round(solution.alphaA * 1000)} µm/s/g</span>
              </div>
            </div>
          </div>

          {/* Polar Vector Diagram Card */}
          <div className={`p-5 rounded-2xl border shadow-sm relative ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#0D1322] border-slate-800'
          }`}>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-500" />
                <span className="text-xs font-black uppercase tracking-wider">
                  Diagramme Vectoriel Polaire (O, T, E & Correction -O)
                </span>
              </div>
              <div className="text-[10px] font-mono text-slate-400">
                Plan Polaire 360° · mm/s RMS
              </div>
            </div>

            <div className="relative border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden h-[360px]">
              <canvas ref={polarCanvasRef} className="w-full h-full" />
            </div>
          </div>

        </div>

      </div>

      {/* Terminal d'Équilibrage Réel Pas-à-Pas (Bottom Full Width) */}
      <div className={`p-6 rounded-2xl border shadow-sm ${
        isLight ? 'bg-white border-slate-200' : 'bg-[#0D1322] border-slate-800'
      }`}>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-3 mb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className={`text-base font-black tracking-tight ${isLight ? 'text-slate-950' : 'text-white'}`}>
              Terminal d'Équilibrage Réel Pas-à-Pas (ISO 1940)
            </h3>
            <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'} mt-0.5`}>
              Simulez une intervention complète sur site : faites vos mesures, indexez le rotor, posez les masses et vérifiez la conformité.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-600">
              Étape {Math.min(completedStep + 1, 5)}/5 {completedStep === 5 ? '✓ Conforme' : ''}
            </span>
            <button
              onClick={handleResetWizard}
              disabled={isBusy}
              className={`p-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                isLight ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Recommencer</span>
            </button>
          </div>
        </div>

        {/* Step Navigation Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
          {[
            { n: 1, title: '1. Run Initial (O)' },
            { n: 2, title: '2. Masse d\'Essai (T)' },
            { n: 3, title: '3. Calcul Vectoriel' },
            { n: 4, title: '4. Pose Correction' },
            { n: 5, title: '5. Contrôle Final (R)' },
          ].map((s) => (
            <button
              key={s.n}
              onClick={() => setActiveStep(s.n)}
              disabled={s.n > completedStep + 1}
              className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeStep === s.n
                  ? 'bg-purple-600 border-purple-600 text-white shadow-md'
                  : s.n <= completedStep
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600'
                    : isLight ? 'bg-slate-100 border-slate-200 text-slate-400 opacity-60' : 'bg-slate-800/40 border-slate-800 text-slate-500 opacity-60'
              }`}
            >
              {s.n <= completedStep && <CheckCircle2 className="w-3.5 h-3.5" />}
              <span>{s.title}</span>
            </button>
          ))}
        </div>

        {/* Active Step Details & Action Panel */}
        <div className={`p-4 rounded-xl border ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#090D16] border-slate-800'
        }`}>
          {activeStep === 1 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-red-600 dark:text-red-400">
                  Étape 1 : Mesure de la Vibration d'Origine (Vecteur O)
                </span>
                <span className="text-xs font-mono font-bold text-slate-500">
                  Curseurs : {data.oA.toFixed(1)} mm/s @ {data.oP}°
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Faites tourner la machine dans son état actuel (sans aucune masse d'équilibrage). Nous mesurons l'amplitude et la phase de vibration à 1x RPM provoquée par le balourd initial résiduel $U_0$.
              </p>
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => executeStep(1)}
                  disabled={isBusy || completedStep >= 1}
                  className={`py-2 px-4 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                    completedStep >= 1
                      ? 'bg-emerald-600 text-white opacity-80'
                      : 'bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-600/30'
                  }`}
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{completedStep >= 1 ? 'Run Initial Mesuré ✓' : isBusy ? 'Acquisition synchrone…' : 'Lancer la Mesure du Run O'}</span>
                </button>
              </div>
            </div>
          )}

          {activeStep === 2 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-blue-600 dark:text-blue-400">
                  Étape 2 : Pose de la Masse d'Essai Calibrée & Mesure du Run T
                </span>
                <span className="text-xs font-mono font-bold text-slate-500">
                  Mₜ = {data.mT}g @ {data.aT}°
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Le système consigne automatiquement le rotor, effectue l'indexation angulaire à {data.aT}° en position haute de travail, et transfère la masse d'essai depuis la boîte à outils. Puis il redémarre la machine pour acquérir le vecteur T.
              </p>
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => executeStep(2)}
                  disabled={isBusy || completedStep < 1 || completedStep >= 2}
                  className={`py-2 px-4 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                    completedStep >= 2
                      ? 'bg-emerald-600 text-white opacity-80'
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30'
                  }`}
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{completedStep >= 2 ? 'Run d\'Essai Mesuré ✓' : isBusy ? 'Pose et acquisition…' : 'Poser la Masse d\'Essai & Mesurer T'}</span>
                </button>
              </div>
            </div>
          )}

          {activeStep === 3 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-amber-600 dark:text-amber-400">
                  Étape 3 : Calcul Vectoriel des Coefficients d'Influence
                </span>
                <span className="text-xs font-mono font-bold text-slate-500">
                  W = {solution.corrM.toFixed(1)}g @ {Math.round(solution.corrA)}°
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                L'effet de la masse d'essai est calculé par soustraction vectorielle E = T - O. La sensibilité dynamique du rotor est α = E / Mₜ. La correction idéale est W = -O / α.
              </p>
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => executeStep(3)}
                  disabled={isBusy || completedStep < 2 || completedStep >= 3}
                  className={`py-2 px-4 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                    completedStep >= 3
                      ? 'bg-emerald-600 text-white opacity-80'
                      : 'bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-600/30'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{completedStep >= 3 ? 'Calculs Validés ✓' : isBusy ? 'Calcul vectoriel…' : 'Calculer la Correction & Projeter sur Rotor'}</span>
                </button>
              </div>
            </div>
          )}

          {activeStep === 4 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-purple-600 dark:text-purple-400">
                  Étape 4 : Pose de la Masse de Correction Finale
                </span>
                <span className="text-xs font-mono font-bold text-slate-500">
                  Pose réelle : {calculateInstalledCorrection(solution).m}g @ {calculateInstalledCorrection(solution).a}°
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Arrêt du rotor. {data.keep ? 'La masse d\'essai reste en place sur le rotor.' : 'La masse d\'essai est retirée et replacée dans la caisse.'} La masse de correction réelle (arrondie à 0,5 g avec tolérance angulaire de pose) est installée sur le rotor.
              </p>
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => executeStep(4)}
                  disabled={isBusy || completedStep < 3 || completedStep >= 4}
                  className={`py-2 px-4 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                    completedStep >= 4
                      ? 'bg-emerald-600 text-white opacity-80'
                      : 'bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/30'
                  }`}
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>{completedStep >= 4 ? 'Correction Installée ✓' : isBusy ? 'Indexation et pose 3D…' : 'Installer la Masse de Correction Finale'}</span>
                </button>
              </div>
            </div>
          )}

          {activeStep === 5 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-emerald-600 dark:text-emerald-400">
                  Étape 5 : Run de Contrôle Final & Diagnostic ISO 10816-3
                </span>
                {measuredValues.F && (
                  <span className="text-xs font-mono font-bold text-emerald-600">
                    R = {amp(measuredValues.F).toFixed(2)} mm/s (Zone {getIsoSeverity(amp(measuredValues.F)).z})
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Redémarrez le rotor pour acquérir la vibration résiduelle finale R. Nous calculons le taux d'abattement vibratoire et vérifions l'acceptabilité selon la norme ISO 10816-3.
              </p>
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => executeStep(5)}
                  disabled={isBusy || completedStep < 4 || completedStep >= 5}
                  className={`py-2 px-4 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                    completedStep >= 5
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{completedStep >= 5 ? 'Équilibrage Conforme et Terminé ✓' : isBusy ? 'Acquisition finale…' : 'Lancer le Run de Contrôle Final (R)'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
