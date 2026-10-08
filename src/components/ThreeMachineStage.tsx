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
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import { makeTextures, MachineTextures } from '../utils/machineTextures';
import { buildMachine, makeMaterials, Machine3DResult, SourceId, H } from '../utils/machine3d';

const TAU = Math.PI * 2;
const SLOW = 0.035;

export interface GeneratorSource {
  id: SourceId;
  name: string;
  col: string;
  bg: string;
  on: boolean;
  a: number;
  org: string;
  desc: (f: number) => string;
  sig: (t: number, f: number, A: number) => number;
  lines: (f: number, A: number) => Array<[number, number, string]>;
}

interface ThreeMachineStageProps {
  rpm: number;
  isRunning: boolean;
  isTransparent: boolean;
  onToggleTransparent: () => void;
  activeSources: Record<SourceId, boolean>;
  sourceAmplitudes: Record<SourceId, number>;
  sourcesList: GeneratorSource[];
  highlightedSource: SourceId | null;
  onHoverSource: (id: SourceId | null) => void;
  highlightedPart: string | null;
  onHoverPart: (part: string | null) => void;
  totalSignalFn: (t: number) => number;
  scaleSignal: number;
  theme?: 'dark' | 'light' | 'mono';
  onNomenclatureReady?: (cats: Map<string, THREE.Mesh[]>) => void;
}

export default function ThreeMachineStage({
  rpm,
  isRunning,
  isTransparent,
  onToggleTransparent,
  activeSources,
  sourceAmplitudes,
  sourcesList,
  highlightedSource,
  onHoverSource,
  highlightedPart,
  onHoverPart,
  totalSignalFn,
  scaleSignal,
  theme = 'dark',
  onNomenclatureReady,
}: ThreeMachineStageProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [hoveredTip, setHoveredTip] = useState<{
    name: string;
    category: string;
    sourceName?: string;
    sourceCol?: string;
    x: number;
    y: number;
  } | null>(null);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const modelRef = useRef<Machine3DResult | null>(null);
  const texturesRef = useRef<MachineTextures | null>(null);

  const stateRef = useRef({
    rpm,
    isRunning,
    isTransparent,
    highlightedSource,
    highlightedPart,
    activeSources,
    sourceAmplitudes,
    totalSignalFn,
    scaleSignal,
    T: 0,
    lastTime: performance.now(),
  });

  const isLight = theme === 'light';
  const isBW = theme === 'mono';

  // Keep stateRef fresh for the animation frame
  useEffect(() => {
    stateRef.current.rpm = rpm;
    stateRef.current.isRunning = isRunning;
    stateRef.current.isTransparent = isTransparent;
    stateRef.current.highlightedSource = highlightedSource;
    stateRef.current.highlightedPart = highlightedPart;
    stateRef.current.activeSources = activeSources;
    stateRef.current.sourceAmplitudes = sourceAmplitudes;
    stateRef.current.totalSignalFn = totalSignalFn;
    stateRef.current.scaleSignal = scaleSignal;
  }, [rpm, isRunning, isTransparent, highlightedSource, highlightedPart, activeSources, sourceAmplitudes, totalSignalFn, scaleSignal]);

  // Apply transparency to housing meshes
  const applyTransparency = useCallback(() => {
    const m = modelRef.current;
    if (!m) return;
    for (const o of m.housing) {
      const mt = o.material as THREE.MeshStandardMaterial;
      mt.transparent = isTransparent || mt.name === 'grille';
      mt.opacity = isTransparent ? 0.14 : mt.name === 'grille' ? 0.55 : 1;
      mt.depthWrite = !isTransparent;
      mt.needsUpdate = true;
    }
  }, [isTransparent]);

  useEffect(() => {
    applyTransparency();
  }, [isTransparent, applyTransparency]);

  // Apply highlight from active generator source
  useEffect(() => {
    const m = modelRef.current;
    if (!m) return;

    for (const s of sourcesList) {
      const isTarget = s.id === highlightedSource;
      const c = new THREE.Color(s.col);
      const meshes = m.parts[s.id] || [];
      for (const o of meshes) {
        const mat = o.material as THREE.MeshStandardMaterial;
        mat.emissive.copy(c);
        mat.emissiveIntensity = isTarget ? 0.6 : 0;
      }
    }
  }, [highlightedSource, sourcesList]);

  // Apply highlight from hovered nomenclature part
  useEffect(() => {
    const m = modelRef.current;
    if (!m) return;
    const CYAN = new THREE.Color('#0ea5e9');

    // Reset old categories unless they are part of active highlightedSource
    for (const [catName, meshes] of m.cats) {
      const isCatTarget = catName === highlightedPart;
      for (const o of meshes) {
        const mat = o.material as THREE.MeshStandardMaterial;
        const src = o.userData.src as SourceId | undefined;
        if (isCatTarget) {
          mat.emissive.copy(CYAN);
          mat.emissiveIntensity = 0.75;
        } else if (src && src === stateRef.current.highlightedSource) {
          const s = sourcesList.find((x) => x.id === src);
          if (s) {
            mat.emissive.set(s.col);
            mat.emissiveIntensity = 0.6;
          }
        } else {
          mat.emissive.setHex(0x000000);
          mat.emissiveIntensity = 0;
        }
      }
    }
  }, [highlightedPart, sourcesList]);

  // Initial Scene Setup
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(isLight ? 0xe5e7eb : 0x090d16);
    sceneRef.current = scene;

    // 2. Camera
    const width = container.clientWidth || 700;
    const height = container.clientHeight || 520;
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.05, 50);
    camera.position.set(1.15, 1.0, 1.6);
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
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = isLight ? 1.08 : 1.15;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // 4. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.target.set(0.05, 0.38, 0);
    controls.update();
    controlsRef.current = controls;

    // 5. Lighting
    const amb = new THREE.HemisphereLight(0xffffff, 0x8a857c, isLight ? 0.85 : 0.6);
    scene.add(amb);

    const key = new THREE.DirectionalLight(0xffffff, isLight ? 2.4 : 2.8);
    key.position.set(1.6, 2.6, 1.4);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.bias = -0.0003;
    key.shadow.normalBias = 0.002;
    key.shadow.camera.left = -1.1;
    key.shadow.camera.right = 1.1;
    key.shadow.camera.top = 1.1;
    key.shadow.camera.bottom = -1.1;
    key.shadow.camera.near = 0.1;
    key.shadow.camera.far = 8;
    key.shadow.camera.updateProjectionMatrix();
    scene.add(key);
    scene.add(key.target);
    key.target.position.set(0, 0.2, 0);

    const fill = new THREE.DirectionalLight(0x93c5fd, 0.6);
    fill.position.set(-2, 1, -1.5);
    scene.add(fill);

    // 6. Textures & Materials
    const TX = makeTextures(THREE);
    texturesRef.current = TX;
    const mat = makeMaterials(THREE, TX);

    // Floor (workshop concrete with safety zone)
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(4, 4),
      new THREE.MeshStandardMaterial({
        map: TX.floor,
        roughness: 0.85,
        metalness: 0,
        bumpMap: TX.castBump,
        bumpScale: 0.6,
      })
    );
    floor.name = 'sol_atelier';
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0.05, -0.0005, 0.1);
    floor.receiveShadow = true;
    scene.add(floor);

    // 7. Build Motopump Machine Train
    const m = buildMachine(THREE, mat);
    modelRef.current = m;
    scene.add(m.root);

    onNomenclatureReady?.(m.cats);
    applyTransparency();

    // 8. Animation Loop
    let animId: number;
    const BPFO_X = 3.07;
    const FTF_X = 0.38;

    const animate = (time: number) => {
      animId = requestAnimationFrame(animate);

      const st = stateRef.current;
      const dt = Math.min((time - st.lastTime) / 1000, 0.05);
      st.lastTime = time;

      if (controlsRef.current) controlsRef.current.update();

      if (st.isRunning) {
        st.T += dt * SLOW * (st.rpm / 1800);
      }

      const f = st.rpm / 60;
      const th = TAU * f * st.T;

      if (m) {
        m.shaft.rotation.x = th;
        m.brgs.forEach((c) => (c.rotation.x = th * FTF_X));

        // Bearing shock flash
        let I = 0;
        const brgOn = st.activeSources.brg;
        const brgAmp = st.sourceAmplitudes.brg || 0;
        if (brgOn && brgAmp > 0) {
          const u = st.T * BPFO_X * f;
          const q = u - Math.floor(u);
          I = Math.exp(-q / 0.12) * Math.min(1, brgAmp);
        }
        m.flash.visible = I > 0.05;
        m.flash.scale.setScalar(0.004 + 0.016 * I);
        (m.flash.material as THREE.Material & { opacity: number }).opacity = Math.min(1, I * 1.3);

        // Sensor LED glow
        const totalV = Math.abs(st.totalSignalFn(st.T));
        (m.led.material as THREE.MeshStandardMaterial).emissiveIntensity = Math.min(
          2.2,
          (totalV / (st.scaleSignal || 1)) * 2.2
        );
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
  }, [applyTransparency, onNomenclatureReady, isLight]);

  // Raycasting for interactive 3D Hover
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const container = mountRef.current;
    const camera = cameraRef.current;
    const m = modelRef.current;
    if (!container || !camera || !m || e.buttons) return;

    const rect = container.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), camera);

    const hits = raycaster.intersectObject(m.root, true);
    const validHit = hits.find(
      (h) => h.object.visible && (!stateRef.current.isTransparent || !m.housing.includes(h.object as THREE.Mesh))
    );

    if (validHit && validHit.object) {
      let src: SourceId | null = null;
      for (let o: THREE.Object3D | null = validHit.object; o; o = o.parent) {
        if (o.userData && o.userData.src) {
          src = o.userData.src as SourceId;
          break;
        }
      }

      const partString = (validHit.object.userData && validHit.object.userData.part) as string | undefined;
      if (partString) {
        const [cat, name] = partString.split(' · ');
        const matchedSource = src ? sourcesList.find((s) => s.id === src) : undefined;

        setHoveredTip({
          name: name || partString,
          category: cat || 'Machine',
          sourceName: matchedSource?.name,
          sourceCol: matchedSource?.col,
          x: e.clientX - rect.left + 14,
          y: e.clientY - rect.top + 14,
        });

        if (src !== stateRef.current.highlightedSource) {
          onHoverSource(src);
        }
        if (partString !== stateRef.current.highlightedPart) {
          onHoverPart(partString);
        }
        return;
      }
    }

    setHoveredTip(null);
    if (stateRef.current.highlightedSource) onHoverSource(null);
    if (stateRef.current.highlightedPart) onHoverPart(null);
  };

  const handlePointerLeave = () => {
    setHoveredTip(null);
    onHoverSource(null);
    onHoverPart(null);
  };

  const handleResetCamera = () => {
    if (controlsRef.current && cameraRef.current) {
      controlsRef.current.target.set(0.05, 0.38, 0);
      cameraRef.current.position.set(1.15, 1.0, 1.6);
      controlsRef.current.update();
    }
  };

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden border transition-all duration-300 ${
        isExpanded ? 'fixed inset-0 z-50 rounded-none bg-slate-950' : 'h-[470px]'
      } ${isLight ? 'bg-slate-50 border-slate-200' : isBW ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-900/90 border-slate-800'}`}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      {/* Three.js Canvas Mount */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Floating Controls */}
      <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-2">
        <button
          onClick={onToggleTransparent}
          className={`px-3 py-1.5 rounded-xl border text-xs font-semibold backdrop-blur-md shadow-sm transition-all flex items-center gap-1.5 ${
            isTransparent
              ? 'bg-blue-600 text-white border-blue-500 shadow-blue-900/30'
              : isLight
              ? 'bg-white/90 text-slate-700 border-slate-200 hover:bg-slate-100'
              : 'bg-slate-950/80 text-slate-200 border-slate-800 hover:bg-slate-800'
          }`}
          title="Rendre les carters transparents pour visualiser les éléments internes tournants"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{isTransparent ? 'Carters opaques' : 'Carters transparents'}</span>
        </button>

        <button
          onClick={handleResetCamera}
          className={`p-2 rounded-xl border text-xs backdrop-blur-md shadow-sm transition-all ${
            isLight
              ? 'bg-white/90 border-slate-200 text-slate-700 hover:bg-slate-100'
              : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:bg-slate-800'
          }`}
          title="Recentrer la caméra"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`p-2 rounded-xl border text-xs backdrop-blur-md shadow-sm transition-all ${
            isLight
              ? 'bg-white/90 border-slate-200 text-slate-700 hover:bg-slate-100'
              : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:bg-slate-800'
          }`}
          title={isExpanded ? 'Réduire' : 'Plein écran'}
        >
          {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Top Right Usage Hint */}
      <div className={`hidden sm:block absolute top-3 right-3 z-20 px-3 py-1.5 rounded-xl border text-[11px] font-mono backdrop-blur-md ${
        isLight ? 'bg-white/90 border-slate-200 text-slate-600' : 'bg-slate-950/80 border-slate-800 text-slate-300'
      }`}>
        Rotation : clic gauche · Zoom : molette · Pan : clic droit
      </div>

      {/* 3D Raycast Tooltip */}
      {hoveredTip && (
        <div
          style={{
            left: `${hoveredTip.x}px`,
            top: `${hoveredTip.y}px`,
          }}
          className="absolute z-30 pointer-events-none -translate-x-2 -translate-y-2 p-2.5 rounded-xl bg-slate-950/95 border border-slate-700 text-white shadow-xl backdrop-blur-md min-w-[200px] max-w-[280px]"
        >
          <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
            {hoveredTip.category}
          </div>
          <div className="font-bold text-xs text-white mt-0.5">
            {hoveredTip.name}
          </div>
          {hoveredTip.sourceName && (
            <div className="mt-1 pt-1 border-t border-slate-800 flex items-center gap-1.5 text-[11px] font-mono">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: hoveredTip.sourceCol }}
              />
              <span className="text-slate-300">{hoveredTip.sourceName}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
