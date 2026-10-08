import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { 
  Eye, 
  RotateCcw, 
  Maximize2, 
  Minimize2, 
  Play, 
  Pause,
  AlertTriangle,
  Layers,
  Sparkles,
  ZoomIn,
  ZoomOut,
  Tag
} from 'lucide-react';
import { 
  BearingSimParams, 
  BearingKinematics, 
  impactInfo, 
  impactAmp, 
  PHI_OUT, 
  PHI_IN, 
  TAU 
} from '../utils/bearingModel';
import { 
  buildBearing, 
  makeMaterials, 
  Bearing3DResult, 
  BearingMaterials 
} from '../utils/bearing3d';

export type HousingDisplayMode = 'cut' | 'closed' | 'open' | 'trans' | 'hidden';

interface ThreeBearingStageProps {
  params: BearingSimParams;
  kinematics: BearingKinematics;
  housingMode?: HousingDisplayMode;
  onHousingModeChange?: (mode: HousingDisplayMode) => void;
  speedMultiplier?: number;
  onSpeedMultiplierChange?: (spd: number) => void;
  isExploded?: boolean;
  onExplodedChange?: (ex: boolean) => void;
  showGrease?: boolean;
  onShowGreaseChange?: (show: boolean) => void;
  highlightDefect?: boolean;
  onHighlightDefectChange?: (hl: boolean) => void;
  showLabels?: boolean;
  onShowLabelsChange?: (show: boolean) => void;
  theme?: 'dark' | 'light' | 'mono';
  onDefectSelect?: (def: BearingSimParams['def']) => void;
}

export default function ThreeBearingStage({
  params,
  kinematics,
  housingMode = 'cut',
  onHousingModeChange,
  speedMultiplier = 1,
  onSpeedMultiplierChange,
  isExploded = false,
  onExplodedChange,
  showGrease = true,
  onShowGreaseChange,
  highlightDefect = true,
  onHighlightDefectChange,
  showLabels = true,
  onShowLabelsChange,
  theme = 'dark',
  onDefectSelect,
}: ThreeBearingStageProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [zoomClose, setZoomClose] = useState<boolean>(true);
  const [shockIndicator, setShockIndicator] = useState<{ active: boolean; text: string }>({
    active: false,
    text: '',
  });

  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const materialsRef = useRef<BearingMaterials | null>(null);
  const modelRef = useRef<Bearing3DResult | null>(null);

  // SVG Leaders and 2D Label positions
  const [labelCoords, setLabelCoords] = useState<Record<string, { x: number; y: number; visible: boolean; ax: number; ay: number }>>({});

  const stateRef = useRef({
    params,
    kinematics,
    housingMode,
    speedMultiplier,
    isExploded,
    showGrease,
    highlightDefect,
    showLabels,
    isPlaying,
    zoomClose,
    U: 0,
    ex: 0,
    lastTime: performance.now(),
  });

  const isLight = theme === 'light';
  const isBW = theme === 'mono';

  // Keep stateRef in sync
  useEffect(() => {
    stateRef.current.params = params;
    stateRef.current.kinematics = kinematics;
    stateRef.current.housingMode = housingMode;
    stateRef.current.speedMultiplier = speedMultiplier;
    stateRef.current.isExploded = isExploded;
    stateRef.current.showGrease = showGrease;
    stateRef.current.highlightDefect = highlightDefect;
    stateRef.current.showLabels = showLabels;
    stateRef.current.isPlaying = isPlaying;
    stateRef.current.zoomClose = zoomClose;
  }, [params, kinematics, housingMode, speedMultiplier, isExploded, showGrease, highlightDefect, showLabels, isPlaying, zoomClose]);

  // Camera focus helper
  const focusCamera = useCallback((close: boolean) => {
    const cam = cameraRef.current;
    const ctl = controlsRef.current;
    const m = modelRef.current;
    if (!cam || !ctl || !m) return;

    if (close) {
      ctl.target.set(0, m.Hc, 0);
      cam.position.set(m.OD * 0.9, m.Hc + m.OD * 0.75, m.OD * 3.4);
    } else {
      ctl.target.set(0, m.Hc * 0.95, 0);
      cam.position.set(m.Rh * 1.5, m.Hc + m.Rh * 1.1, m.Rh * 4.4);
    }
    ctl.update();
  }, []);

  // Apply Housing Mode (cut / open / trans / closed / hidden)
  const applyHousing = useCallback(() => {
    const m = modelRef.current;
    const mat = materialsRef.current;
    const renderer = rendererRef.current;
    if (!m || !mat) return;

    const mode = stateRef.current.housingMode;
    const exT = stateRef.current.isExploded;

    if (renderer) renderer.localClippingEnabled = true;

    m.root.updateMatrixWorld(true);
    const clipPlane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0).applyMatrix4(m.root.matrixWorld);

    for (const mt of mat.housingSet) {
      mt.clippingPlanes = mode === 'cut' ? [clipPlane] : null;
      mt.transparent = mode === 'trans';
      mt.opacity = mode === 'trans' ? 0.2 : 1;
      mt.depthWrite = mode !== 'trans';
      mt.needsUpdate = true;
    }

    mat.greaseCh.clippingPlanes = mode === 'cut' ? [clipPlane] : null;
    mat.greaseCh.needsUpdate = true;

    m.housing.visible = mode !== 'hidden' && !exT;
    m.cap.position.y = mode === 'open' ? m.OD * 1.7 : 0;
  }, []);

  // Update defect spall highlighting
  const applyDefectHighlight = useCallback(() => {
    const mat = materialsRef.current;
    if (!mat) return;
    const hl = stateRef.current.highlightDefect;
    mat.def.color.setHex(hl ? 0xf97316 : 0x3b2f2a);
    mat.def.emissiveIntensity = hl ? 0.45 : 0;
    mat.def.roughness = hl ? 0.75 : 0.95;
  }, []);

  // Update Grease visibility
  const applyGreaseVisibility = useCallback(() => {
    const m = modelRef.current;
    if (!m) return;
    const gVis = stateRef.current.showGrease;
    m.grease.forEach((o) => (o.visible = gVis));
  }, []);

  // Rebuild 3D Model when geometry or defect changes
  const rebuild3D = useCallback(() => {
    const scene = sceneRef.current;
    const mat = materialsRef.current;
    if (!scene || !mat) return;

    if (modelRef.current) {
      scene.remove(modelRef.current.root);
    }

    const newModel = buildBearing(THREE, params, mat);
    modelRef.current = newModel;
    scene.add(newModel.root);

    applyHousing();
    applyDefectHighlight();
    applyGreaseVisibility();
    focusCamera(stateRef.current.zoomClose);
  }, [params, applyHousing, applyDefectHighlight, applyGreaseVisibility, focusCamera]);

  // Initial Scene Setup
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 450;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.01, 100);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.localClippingEnabled = true;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // 4. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controlsRef.current = controls;

    // 5. Lighting
    const hemiLight = new THREE.HemisphereLight(
      isLight ? 0xffffff : 0xe0e7ff,
      isLight ? 0xd8d2c4 : 0x1e293b,
      isLight ? 1.1 : 0.9
    );
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
    keyLight.position.set(4, 7, 5);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x93c5fd, 0.7);
    fillLight.position.set(-4, -2, -3);
    scene.add(fillLight);

    // 6. Materials
    materialsRef.current = makeMaterials(THREE);

    // 7. Initial Build
    rebuild3D();

    // 8. Animation Loop
    let animId: number;
    const tempVec = new THREE.Vector3();

    const animate = (time: number) => {
      animId = requestAnimationFrame(animate);

      const st = stateRef.current;
      const dt = Math.min((time - st.lastTime) / 1000, 0.05);
      st.lastTime = time;

      const m = modelRef.current;
      const mat = materialsRef.current;
      const k = st.kinematics;
      const p = st.params;

      if (controlsRef.current) controlsRef.current.update();

      if (m && mat) {
        // Exploded view transition
        const targetEx = st.isExploded ? 1 : 0;
        st.ex += (targetEx - st.ex) * Math.min(1, dt * 5);
        const E = st.ex;

        m.ring.position.set(E * m.OD * 1.15, m.Hc + E * m.OD * 0.35, E * m.B * 3.2);
        m.cage.position.x = E * m.OD * 0.55;
        m.cage.position.z = E * m.B * 1.6;
        m.cage.position.y = m.Hc + E * m.OD * 0.15;
        m.shaft.visible = E < 0.02;

        if (st.isPlaying && st.speedMultiplier > 0) {
          const rate = {
            outer: k.bpfoE,
            inner: k.bpfiE,
            ball: 2 * k.bsfE,
            cage: k.ftfE,
            none: k.f,
          }[p.def];

          const speedNorm = rate ? Math.min(Math.max((1.3 * k.f) / rate, 0.04), 1.5) : 0.5;
          st.U += dt * st.speedMultiplier * speedNorm;

          const t = st.U / k.f;
          const th = TAU * st.U;
          const thc = TAU * t * k.ftfE;
          const psi = -TAU * t * k.bsfE;

          m.shaft.rotation.z = th;
          m.innerG.rotation.z = th;
          m.cage.rotation.z = thc;
          m.balls.forEach((b) => (b.rotation.z = psi));

          if (p.def === 'cage') {
            m.cage.position.x += p.sev * 0.0025 * Math.sin(thc * 3);
            m.cage.position.y += p.sev * 0.0025 * Math.cos(thc * 2);
          }

          // Shocks & Impacts
          let I = 0;
          const ii = impactInfo(p, k);
          if (ii && p.sev && E < 0.02) {
            const u = t * ii.fd - ii.u0;
            const j = Math.floor(u);
            const q = u - j;
            const ti = (j + ii.u0) / ii.fd;
            const par = ((j % 2) + 2) % 2;
            const a = impactAmp(p, k, ti, j);
            I = a * Math.exp(-q / 0.2);

            let ang = 0;
            let r = m.Rp;
            if (p.def === 'outer') {
              ang = PHI_OUT;
              r = m.Rp + m.rb;
            } else if (p.def === 'inner') {
              ang = th + PHI_IN;
              r = m.Rp - m.rb;
            } else {
              ang = thc;
              r = par ? m.Rp - m.rb : m.Rp + m.rb;
            }

            tempVec.set(r * Math.cos(ang), m.Hc + r * Math.sin(ang), m.B / 2);
            m.flash.position.copy(tempVec);
            m.flash.scale.setScalar(m.rb * (0.4 + 1.6 * I));
            (m.flash.material as any).opacity = Math.min(1, I * 1.3);
            m.flash.visible = I > 0.04;

            m.wave.position.set(tempVec.x, tempVec.y, m.B / 2 + 0.003);
            m.wave.visible = q < 0.6 && a > 0.1;
            m.wave.scale.setScalar(m.rb * (0.8 + q * 9));
            (m.wave.material as any).opacity = Math.max(0, 1 - q / 0.6) * a;
          } else {
            m.flash.visible = false;
            m.wave.visible = false;
          }

          mat.sensor.emissiveIntensity = I * 2.5;

          if (I > 0.2) {
            setShockIndicator({
              active: true,
              text:
                p.def === 'ball'
                  ? `CHOC · bille sur ${(Math.floor(t * 2 * k.bsfE) % 2) ? 'bague intérieure' : 'bague extérieure'}`
                  : `CHOC · ${p.def === 'outer' ? 'BPFO' : p.def === 'inner' ? 'BPFI' : 'FTF'}`,
            });
          } else {
            setShockIndicator((prev) => (prev.active ? { active: false, text: '' } : prev));
          }
        }

        // Update 3D Leaders and Labels
        if (st.showLabels && cameraRef.current && container) {
          const cam = cameraRef.current;
          const w = container.clientWidth;
          const h = container.clientHeight;
          const pts: Record<string, [THREE.Object3D, number, number, number]> = {
            outer: [m.ring, 0, m.OD, m.B / 2],
            inner: [m.innerG, 0, -m.ri, m.B / 2],
            ball: [m.balls[0] || m.cage, 0, 0, m.rb],
            cage: [m.cage, -m.Rp * 0.7, m.Rp * 0.7, m.dS * 0.6],
          };
          const OFF: Record<string, [number, number]> = {
            outer: [1, -1],
            inner: [-1, 1],
            ball: [1, 1],
            cage: [-1, -1],
          };
          const dx = Math.min(180, w * 0.24);
          const dy = Math.min(100, h * 0.22);
          const coords: Record<string, { x: number; y: number; visible: boolean; ax: number; ay: number }> = {};

          for (const id in pts) {
            const [obj, a1, a2, a3] = pts[id];
            if (!obj) continue;
            obj.localToWorld(tempVec.set(a1, a2, a3)).project(cam);
            const ax = ((tempVec.x + 1) / 2) * w;
            const ay = ((1 - tempVec.y) / 2) * h;
            const lx = Math.min(Math.max(ax + OFF[id][0] * dx, 60), w - 80);
            const ly = Math.min(Math.max(ay + OFF[id][1] * dy, 60), h - 50);
            coords[id] = {
              x: lx,
              y: ly,
              visible: tempVec.z < 1,
              ax,
              ay,
            };
          }
          setLabelCoords(coords);
        }
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animId = requestAnimationFrame(animate);

    // 9. Resize Handling
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      if (rendererRef.current && rendererRef.current.domElement) {
        rendererRef.current.domElement.remove();
        rendererRef.current.dispose();
      }
    };
  }, [rebuild3D, isLight]);

  // Sync controls changes
  useEffect(() => {
    applyHousing();
  }, [housingMode, isExploded, applyHousing]);

  useEffect(() => {
    applyDefectHighlight();
  }, [highlightDefect, applyDefectHighlight]);

  useEffect(() => {
    applyGreaseVisibility();
  }, [showGrease, applyGreaseVisibility]);

  useEffect(() => {
    rebuild3D();
  }, [params.n, params.d, params.D, params.a, params.def, rebuild3D]);

  const handleResetCamera = () => {
    focusCamera(zoomClose);
  };

  const handleToggleZoom = () => {
    const next = !zoomClose;
    setZoomClose(next);
    focusCamera(next);
  };

  const parts = [
    { id: 'outer', name: 'Bague extérieure', sub: 'Fixe · Défaut → BPFO' },
    { id: 'inner', name: 'Bague intérieure', sub: 'Tourne avec l’arbre · Défaut → BPFI' },
    { id: 'ball', name: 'Éléments roulants', sub: `${params.n} billes Ø ${params.d} mm · Défaut → BSF` },
    { id: 'cage', name: 'Cage de guidage', sub: 'Guide les billes · Défaut → FTF' },
  ];

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden border transition-all duration-300 ${
        isExpanded ? 'fixed inset-0 z-50 rounded-none bg-slate-950' : 'h-[500px]'
      } ${isLight ? 'bg-slate-50/80 border-slate-200' : isBW ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-900/90 border-slate-800'}`}
    >
      {/* 3D Viewport mount */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Shock Warning Pill */}
      <div
        className={`absolute top-4 right-4 z-20 flex items-center gap-2 px-4 py-2 rounded-xl text-white font-mono font-bold text-xs uppercase tracking-wider shadow-lg transition-all duration-100 pointer-events-none ${
          shockIndicator.active
            ? 'bg-rose-600 scale-105 opacity-100 shadow-rose-900/50'
            : 'opacity-0 scale-95'
        }`}
      >
        <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
        {shockIndicator.text}
      </div>

      {/* Top Floating Controls Bar */}
      <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-2 max-w-[85%]">
        {/* Housing Mode */}
        <div className={`flex items-center gap-1 p-1 rounded-xl border text-xs backdrop-blur-md shadow-sm ${
          isLight ? 'bg-white/90 border-slate-200 text-slate-700' : 'bg-slate-950/80 border-slate-800 text-slate-200'
        }`}>
          <span className="px-2 font-mono text-[10px] uppercase font-bold text-slate-400">Palier:</span>
          {(['cut', 'closed', 'open', 'trans', 'hidden'] as HousingDisplayMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => onHousingModeChange?.(mode)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                housingMode === mode
                  ? 'bg-blue-600 text-white shadow-sm font-semibold'
                  : isLight
                  ? 'hover:bg-slate-100 text-slate-600'
                  : 'hover:bg-slate-800/80 text-slate-300'
              }`}
            >
              {mode === 'cut' ? 'Coupe' : mode === 'closed' ? 'Fermé' : mode === 'open' ? 'Chapeau levé' : mode === 'trans' ? 'Transparent' : 'Masqué'}
            </button>
          ))}
        </div>

        {/* View Mode (Assembled vs Exploded) */}
        <div className={`flex items-center gap-1 p-1 rounded-xl border text-xs backdrop-blur-md shadow-sm ${
          isLight ? 'bg-white/90 border-slate-200 text-slate-700' : 'bg-slate-950/80 border-slate-800 text-slate-200'
        }`}>
          <button
            onClick={() => onExplodedChange?.(!isExploded)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              isExploded
                ? 'bg-amber-600 text-white shadow-sm font-semibold'
                : isLight
                ? 'hover:bg-slate-100 text-slate-600'
                : 'hover:bg-slate-800/80 text-slate-300'
            }`}
          >
            {isExploded ? 'Vue Éclatée' : 'Vue Assemblée'}
          </button>
        </div>

        {/* Feature Toggles */}
        <div className={`flex items-center gap-1 p-1 rounded-xl border text-xs backdrop-blur-md shadow-sm ${
          isLight ? 'bg-white/90 border-slate-200 text-slate-700' : 'bg-slate-950/80 border-slate-800 text-slate-200'
        }`}>
          <button
            onClick={handleToggleZoom}
            className={`px-2 py-1 rounded-lg text-xs transition-all flex items-center gap-1 ${
              zoomClose
                ? 'bg-blue-600/20 text-blue-400 font-medium'
                : isLight
                ? 'hover:bg-slate-100 text-slate-600'
                : 'hover:bg-slate-800 text-slate-400'
            }`}
            title="Centrer le zoom sur le roulement ou vue large"
          >
            {zoomClose ? <ZoomOut className="w-3.5 h-3.5" /> : <ZoomIn className="w-3.5 h-3.5" />}
            <span>{zoomClose ? 'Zoom Roulement' : 'Vue Large'}</span>
          </button>

          <button
            onClick={() => onShowGreaseChange?.(!showGrease)}
            className={`px-2 py-1 rounded-lg text-xs transition-all ${
              showGrease
                ? 'bg-yellow-500/20 text-yellow-500 font-medium'
                : isLight
                ? 'hover:bg-slate-100 text-slate-400'
                : 'hover:bg-slate-800 text-slate-500'
            }`}
            title="Afficher/masquer les poches de graisse lithium"
          >
            Graisse
          </button>

          <button
            onClick={() => onHighlightDefectChange?.(!highlightDefect)}
            className={`px-2 py-1 rounded-lg text-xs transition-all flex items-center gap-1 ${
              highlightDefect
                ? 'bg-orange-500/20 text-orange-400 font-medium'
                : isLight
                ? 'hover:bg-slate-100 text-slate-400'
                : 'hover:bg-slate-800 text-slate-500'
            }`}
            title="Surligner le défaut mécanique en orange vif"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Défaut</span>
          </button>

          <button
            onClick={() => onShowLabelsChange?.(!showLabels)}
            className={`px-2 py-1 rounded-lg text-xs transition-all flex items-center gap-1 ${
              showLabels
                ? 'bg-indigo-500/20 text-indigo-400 font-medium'
                : isLight
                ? 'hover:bg-slate-100 text-slate-400'
                : 'hover:bg-slate-800 text-slate-500'
            }`}
            title="Afficher les étiquettes interactives des composants"
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Repères</span>
          </button>
        </div>
      </div>

      {/* Bottom Floating Animation Controls */}
      <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2">
        <div className={`flex items-center gap-1 p-1 rounded-xl border text-xs backdrop-blur-md shadow-sm ${
          isLight ? 'bg-white/90 border-slate-200 text-slate-700' : 'bg-slate-950/80 border-slate-800 text-slate-200'
        }`}>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`p-1.5 rounded-lg text-xs transition-all ${
              isPlaying
                ? 'bg-emerald-600 text-white'
                : isLight
                ? 'hover:bg-slate-100 text-slate-600'
                : 'hover:bg-slate-800 text-slate-300'
            }`}
            title={isPlaying ? 'Mettre en pause' : 'Démarrer l’animation'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          {[
            { label: '0.4x', val: 0.4 },
            { label: '1x', val: 1.0 },
            { label: '2.5x', val: 2.5 },
          ].map((spd) => (
            <button
              key={spd.val}
              onClick={() => onSpeedMultiplierChange?.(spd.val)}
              className={`px-2 py-1 rounded-lg text-xs font-mono transition-all ${
                speedMultiplier === spd.val
                  ? 'bg-blue-600 text-white font-bold'
                  : isLight
                  ? 'hover:bg-slate-100 text-slate-600'
                  : 'hover:bg-slate-800 text-slate-400'
              }`}
            >
              {spd.label}
            </button>
          ))}
        </div>

        {/* Reset Camera button */}
        <button
          onClick={handleResetCamera}
          className={`p-2 rounded-xl border text-xs backdrop-blur-md shadow-sm transition-all ${
            isLight
              ? 'bg-white/90 border-slate-200 text-slate-700 hover:bg-slate-100'
              : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:bg-slate-800'
          }`}
          title="Réinitialiser l'orientation de la caméra"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Fullscreen toggle button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`p-2 rounded-xl border text-xs backdrop-blur-md shadow-sm transition-all ${
            isLight
              ? 'bg-white/90 border-slate-200 text-slate-700 hover:bg-slate-100'
              : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:bg-slate-800'
          }`}
          title={isExpanded ? 'Réduire la vue 3D' : 'Agrandir la vue 3D plein écran'}
        >
          {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Bottom Right Legend Note */}
      <div className={`hidden md:block absolute bottom-3 right-3 z-20 px-3 py-1.5 rounded-xl border text-[11px] font-mono backdrop-blur-md ${
        isLight ? 'bg-white/80 border-slate-200 text-slate-500' : 'bg-slate-950/70 border-slate-800 text-slate-400'
      }`}>
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500 mr-1.5 align-middle" />
        Zone bleue: charge radiale | Défaut: orange | Clic étiquette: injecte le défaut
      </div>

      {/* SVG Leaders & 2D Overlay Labels */}
      {showLabels && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
          <svg className="w-full h-full absolute inset-0 overflow-visible">
            {parts.map((p) => {
              const coord = labelCoords[p.id];
              if (!coord || !coord.visible) return null;
              const isTargetDef = params.def === p.id;
              const color = isTargetDef ? '#f97316' : isLight ? '#64748b' : '#94a3b8';

              return (
                <g key={p.id}>
                  <line
                    x1={coord.ax}
                    y1={coord.ay}
                    x2={coord.x}
                    y2={coord.y}
                    stroke={color}
                    strokeWidth={isTargetDef ? 2 : 1.2}
                    strokeDasharray={isTargetDef ? undefined : '3,3'}
                  />
                  <circle cx={coord.ax} cy={coord.ay} r={isTargetDef ? 4 : 3} fill={color} />
                </g>
              );
            })}
          </svg>

          {parts.map((p) => {
            const coord = labelCoords[p.id];
            if (!coord || !coord.visible) return null;
            const isTargetDef = params.def === p.id;

            return (
              <div
                key={p.id}
                onClick={() => onDefectSelect?.(p.id as BearingSimParams['def'])}
                style={{
                  left: `${coord.x}px`,
                  top: `${coord.y}px`,
                  transform: 'translate(-50%, -50%)',
                }}
                className={`absolute pointer-events-auto cursor-pointer px-3 py-1.5 rounded-xl border shadow-md transition-all flex flex-col items-center select-none ${
                  isTargetDef
                    ? 'border-orange-500 ring-2 ring-orange-500/30 bg-orange-950/90 text-orange-200'
                    : isLight
                    ? 'border-slate-300 bg-white/95 text-slate-800 hover:border-blue-400'
                    : 'border-slate-700 bg-slate-900/90 text-slate-200 hover:border-blue-500'
                }`}
              >
                <span className="font-bold text-xs">{p.name}</span>
                <span className={`text-[10px] font-mono ${isTargetDef ? 'text-orange-300 font-semibold' : 'text-slate-400'}`}>
                  {p.sub}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
