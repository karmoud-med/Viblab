import React, { useEffect, useRef, useState } from 'react';
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
  Sparkles
} from 'lucide-react';
import { 
  ReducerParams, 
  ReducerKinematics, 
  shockPhase, 
  gearOf 
} from '../utils/reducerModel';
import { 
  buildReducer, 
  makeMaterials, 
  Reducer3DResult 
} from '../utils/reducer3d';

const TAU = Math.PI * 2;

interface ThreeReducerStageProps {
  params: ReducerParams;
  kinematics: ReducerKinematics;
  housingMode?: 'trans' | 'closed' | 'hidden';
  speedMultiplier?: number;
  refShaft?: number | null; // Selected TSA reference shaft
  theme?: 'dark' | 'light' | 'mono';
  onShock?: (info: { tooth: number; stage: number; intensity: number }) => void;
}

export default function ThreeReducerStage({
  params,
  kinematics,
  housingMode = 'trans',
  speedMultiplier = 1,
  refShaft = null,
  theme = 'dark',
  onShock
}: ThreeReducerStageProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [shockActive, setShockActive] = useState<boolean>(false);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const materialsRef = useRef<ReturnType<typeof makeMaterials> | null>(null);
  const reducerModelRef = useRef<Reducer3DResult | null>(null);

  const stateRef = useRef({
    params,
    kinematics,
    housingMode,
    speedMultiplier,
    refShaft,
    isPlaying,
    U: 0,
  });

  useEffect(() => {
    stateRef.current = {
      params,
      kinematics,
      housingMode,
      speedMultiplier,
      refShaft,
      isPlaying,
      U: stateRef.current.U,
    };
  }, [params, kinematics, housingMode, speedMultiplier, refShaft, isPlaying]);

  // Determine defective shaft
  const defShaft = params.def !== 'none' ? params.dStage + params.dW : 0;
  const activeRefS = refShaft ?? defShaft;

  const isLight = theme === 'light';
  const isBW = theme === 'mono';

  // 1. Initialize Scene, Camera, Renderer, Controls
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 450;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(isLight ? '#f8fafc' : isBW ? '#090d16' : '#0B111E');
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.05, 100);
    camera.position.set(0.6, 0.8, 1.4);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 0.25, 0);
    controlsRef.current = controls;

    // Lighting
    const hemiLight = new THREE.HemisphereLight(
      isLight ? 0xffffff : 0xdbeafe,
      isLight ? 0x94a3b8 : 0x1e293b,
      isLight ? 1.5 : 1.3
    );
    scene.add(hemiLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, isLight ? 2.0 : 2.5);
    dirLight1.position.set(3, 5, 4);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(isLight ? 0x38bdf8 : 0x60a5fa, isLight ? 1.0 : 1.6);
    dirLight2.position.set(-4, -2, -3);
    scene.add(dirLight2);

    // Materials
    materialsRef.current = makeMaterials();

    // Resize Handler
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      controls.dispose();
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [theme]);

  // 2. Build or Rebuild the Reducer 3D Mesh when params change
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !materialsRef.current) return;

    // Remove old reducer
    if (reducerModelRef.current) {
      scene.remove(reducerModelRef.current.root);
    }

    const mat = materialsRef.current;
    const model = buildReducer(params, kinematics, mat);
    reducerModelRef.current = model;
    scene.add(model.root);

    // Auto-frame camera
    const box = new THREE.Box3().setFromObject(model.root);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3()).length();

    if (controlsRef.current && cameraRef.current) {
      controlsRef.current.target.copy(center);
      cameraRef.current.position.set(center.x + size * 0.35, center.y + size * 0.45, center.z + size * 0.85);
      controlsRef.current.update();
    }

    // Apply housing visibility
    applyHousing();
    paintRefShaft();
  }, [params.st, params.def, params.dStage, params.dW, params.dTooth]);

  // 3. Housing Visibility (trans, closed, hidden)
  const applyHousing = () => {
    const model = reducerModelRef.current;
    const mat = materialsRef.current;
    if (!model || !mat) return;

    const isClosed = housingMode === 'closed';
    const isHidden = housingMode === 'hidden';

    mat.housing.transparent = !isClosed;
    mat.housing.opacity = isClosed ? 1 : 0.14;
    mat.housing.depthWrite = isClosed;
    mat.housing.needsUpdate = true;

    mat.flange.transparent = !isClosed;
    mat.flange.opacity = isClosed ? 1 : 0.4;
    mat.flange.depthWrite = isClosed;
    mat.flange.needsUpdate = true;

    model.housing.forEach((o) => {
      o.visible = !isHidden;
    });
  };

  useEffect(() => {
    applyHousing();
  }, [housingMode]);

  // 4. Highlight reference shaft
  const paintRefShaft = () => {
    const model = reducerModelRef.current;
    const mat = materialsRef.current;
    if (!model || !mat) return;

    model.shafts.forEach((sh, i) => {
      sh.mesh.material = refShaft != null && i === activeRefS ? mat.refShaft : mat.steel;
    });
  };

  useEffect(() => {
    paintRefShaft();
  }, [refShaft, activeRefS]);

  // 5. Animation Loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const animate = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const { isPlaying: playing, speedMultiplier: spd, params: curP, kinematics: curK } = stateRef.current;
      const model = reducerModelRef.current;
      const mat = materialsRef.current;

      if (model && mat && curK && curK.f && curK.f.length > 0) {
        if (playing) {
          const sI = curP.def !== 'none' ? curP.dStage + curP.dW : 0;
          const fDef = curK.f[sI] || 1;
          const f0 = curK.f[0] || 1;

          stateRef.current.U += dt * spd * Math.min((0.35 * f0) / fDef, 3);
          const U = stateRef.current.U;

          // Rotate shafts and gears
          model.shafts.forEach((sh, s) => {
            const fs = curK.f[s] || 1;
            sh.spin.rotation.z = sh.sgn * TAU * ((U * fs) / f0);
          });

          // Defect shock impact flash and shockwave ring
          let I = 0;
          let q = 9;

          if (curP.def !== 'none' && model.meshPts[curP.dStage]) {
            const { g, u0 } = shockPhase(curP, curK);
            let u = (U * g.f) / f0 - u0;
            u -= Math.round(u);
            q = u * g.z;
            I = q < 0 ? Math.exp(-((q / 0.06) ** 2)) : Math.exp(-q / 0.8);

            const P = model.meshPts[curP.dStage];
            model.flash.position.copy(P);
            model.flash.scale.setScalar(0.007 + 0.03 * I);
            (model.flash.material as THREE.Material & { opacity: number }).opacity = Math.min(1, I * 1.3);
            model.flash.visible = I > 0.03;

            model.ring.position.copy(P);
            model.ring.visible = q >= 0 && q < 1.6;
            model.ring.scale.setScalar(0.012 + q * 0.065);
            (model.ring.material as THREE.Material & { opacity: number }).opacity = Math.max(0, 1 - q / 1.6) * 0.9;
          } else {
            model.flash.visible = false;
            model.ring.visible = false;
          }

          (mat.sensor as THREE.MeshStandardMaterial).emissiveIntensity = I * 2.2;
          const isShocking = I > 0.2;
          setShockActive(isShocking);
          if (isShocking && onShock) {
            onShock({ tooth: curP.dTooth, stage: curP.dStage + 1, intensity: I });
          }
        }
      }

      if (controlsRef.current) {
        controlsRef.current.update();
      }
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const handleResetCamera = () => {
    const model = reducerModelRef.current;
    if (!model || !controlsRef.current || !cameraRef.current) return;
    const box = new THREE.Box3().setFromObject(model.root);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3()).length();
    controlsRef.current.target.copy(center);
    cameraRef.current.position.set(center.x + size * 0.35, center.y + size * 0.45, center.z + size * 0.85);
    controlsRef.current.update();
  };

  return (
    <div className={`relative w-full rounded-2xl overflow-hidden border border-[#E3E1DA] shadow-xs transition-all ${
      isExpanded ? 'fixed inset-4 z-50 bg-[#0B111E]' : 'h-[460px] bg-[#0B111E]'
    }`}>
      {/* 3D WebGL Canvas Mount */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Left Floating Status */}
      <div className="absolute top-3 left-3 flex flex-wrap items-center gap-2 pointer-events-none select-none">
        <span className="px-2.5 py-1 rounded-md bg-[#0F1B2D]/85 border border-[#23354E] text-[10.5px] font-mono font-bold text-white backdrop-blur-md">
          ⚙️ Réducteur {params.st.length} étage{params.st.length > 1 ? 's' : ''} • {params.rpm} RPM
        </span>
        {refShaft != null && (
          <span className="px-2.5 py-1 rounded-md bg-blue-600/80 border border-blue-400/40 text-[10px] font-mono font-semibold text-white backdrop-blur-md">
            ● Réf. TSA : Arbre A{activeRefS + 1}
          </span>
        )}
      </div>

      {/* Top Right Shock Banner */}
      {params.def !== 'none' && (
        <div className={`absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-mono text-xs font-bold transition-all backdrop-blur-md pointer-events-none ${
          shockActive 
            ? 'bg-red-600 text-white border-red-400 shadow-[0_0_20px_rgba(239,68,68,0.6)] scale-105' 
            : 'bg-red-950/60 text-red-300 border-red-800/50 opacity-40'
        }`}>
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>CHOC • Dent n°{params.dTooth} • Étage {params.dStage + 1} ({params.dW ? 'Roue' : 'Pignon'})</span>
        </div>
      )}

      {/* Bottom Floating Control Bar */}
      <div className="absolute bottom-3 inset-x-3 flex items-center justify-between pointer-events-auto select-none">
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#0F1B2D]/80 border border-[#23354E] backdrop-blur-md">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            title={isPlaying ? 'Pause' : 'Lecture'}
            className="p-1.5 rounded text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
          </button>
          <button
            onClick={handleResetCamera}
            title="Réinitialiser l'angle caméra"
            className="p-1.5 rounded text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-300" />
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="hidden sm:inline-block px-2.5 py-1 rounded-md bg-[#0F1B2D]/70 border border-[#23354E] text-[10px] font-mono text-slate-300 backdrop-blur-md">
            Clic gauche: Orbite • Molette: Zoom • Clic droit: Pan
          </span>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Réduire' : 'Agrandir en plein écran'}
            className="p-2 rounded-lg bg-[#0F1B2D]/80 border border-[#23354E] text-white hover:bg-white/10 backdrop-blur-md transition-colors cursor-pointer"
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5 text-slate-200" /> : <Maximize2 className="w-3.5 h-3.5 text-slate-200" />}
          </button>
        </div>
      </div>
    </div>
  );
}
