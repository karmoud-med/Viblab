import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { 
  Eye, 
  RotateCcw, 
  Maximize2, 
  Minimize2, 
  Layers,
  Sparkles,
  Scissors
} from 'lucide-react';
import { makeMotorTextures, MotorTextures } from '../utils/motorTextures';
import { buildMotor, makeMaterials, Motor3DResult, MotorMaterials, H, TAU } from '../utils/motor3d';

export type MotorHousingMode = 'closed' | 'trans' | 'cut';
export type OrbitType = 'none' | 'direct' | 'inverse' | 'whirl' | 'complex';

export const ORBIT_DEFINITIONS: Record<
  OrbitType,
  { name: string; desc: string; fn: (t: number) => [number, number]; max: number }
> = {
  none: {
    name: 'Aucune',
    desc: "L'arbre tourne parfaitement au centre radial. Fonctionnement nominal stable.",
    fn: () => [0, 0],
    max: 1,
  },
  direct: {
    name: 'Précession Directe',
    desc: "Le centre de l'arbre décrit une orbite dans le même sens que la rotation, à 1x. Signature du balourd : orbite circulaire ou légèrement elliptique.",
    fn: (t) => [Math.cos(t), Math.sin(t)],
    max: 1,
  },
  inverse: {
    name: 'Précession Inverse',
    desc: "L'orbite tourne en sens opposé à la rotation, à 1x. Cas rare : frottement rotor/stator ou forte anisotropie des paliers. Nécessite deux capteurs X-Y pour être détectée.",
    fn: (t) => [Math.cos(t), -Math.sin(t)],
    max: 1,
  },
  whirl: {
    name: 'Whirl Sous-Synchrone',
    desc: "Le centre de l'arbre tourne à environ 0,43x dans le sens de rotation (instabilité de film d'huile). Une raie sous-synchrone apparaît sous le 1x.",
    fn: (t) => [
      1.1 * Math.cos(0.43 * t) + 0.25 * Math.cos(t),
      1.1 * Math.sin(0.43 * t) + 0.25 * Math.sin(t),
    ],
    max: 1.35,
  },
  complex: {
    name: 'Orbite Complexe',
    desc: "Combinaison 1x + 2x : orbite en forme de huit ou de banane, typique d'un désalignement ou d'une précharge radiale.",
    fn: (t) => [
      Math.cos(t) + 0.55 * Math.cos(2 * t + 0.4),
      0.75 * Math.sin(t) + 0.55 * Math.sin(2 * t + 1.2),
    ],
    max: 1.5,
  },
};

interface ThreeMotorStageProps {
  rpm: number;
  isRunning: boolean;
  poles: number;
  numRotorBars: number;
  hasRotorBarFault: boolean;
  brokenBarCount: number;
  lineFreq: number;
  housingMode: MotorHousingMode;
  onHousingModeChange: (mode: MotorHousingMode) => void;
  orbitType: OrbitType;
  orbitScale: number;
  casingVibration: number;
  theme?: 'dark' | 'light' | 'mono';
  onNomenclatureReady?: (cats: Map<string, THREE.Mesh[]>) => void;
  highlightedPart?: string | null;
}

export default function ThreeMotorStage({
  rpm,
  isRunning,
  poles,
  numRotorBars,
  hasRotorBarFault,
  brokenBarCount,
  lineFreq,
  housingMode,
  onHousingModeChange,
  orbitType,
  orbitScale,
  casingVibration,
  theme = 'dark',
  onNomenclatureReady,
  highlightedPart,
}: ThreeMotorStageProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    name: string;
    group: string;
    x: number;
    y: number;
  }>({
    visible: false,
    name: '',
    group: '',
    x: 0,
    y: 0,
  });

  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const texturesRef = useRef<MotorTextures | null>(null);
  const materialsRef = useRef<MotorMaterials | null>(null);
  const modelRef = useRef<Motor3DResult | null>(null);
  const clippingPlaneRef = useRef<THREE.Plane>(new THREE.Plane(new THREE.Vector3(0, 0, -1), 0));

  const isLight = theme === 'light';
  const isBW = theme === 'mono';

  // Real-time animation parameters
  const stateRef = useRef({
    rpm,
    isRunning,
    poles,
    numRotorBars,
    hasRotorBarFault,
    brokenBarCount,
    lineFreq,
    housingMode,
    orbitType,
    orbitScale,
    casingVibration,
    time: 0,
    trailN: 0,
  });

  useEffect(() => {
    stateRef.current.rpm = rpm;
    stateRef.current.isRunning = isRunning;
    stateRef.current.poles = poles;
    stateRef.current.numRotorBars = numRotorBars;
    stateRef.current.hasRotorBarFault = hasRotorBarFault;
    stateRef.current.brokenBarCount = brokenBarCount;
    stateRef.current.lineFreq = lineFreq;
    stateRef.current.housingMode = housingMode;
    stateRef.current.orbitType = orbitType;
    stateRef.current.orbitScale = orbitScale;
    stateRef.current.casingVibration = casingVibration;
  }, [
    rpm,
    isRunning,
    poles,
    numRotorBars,
    hasRotorBarFault,
    brokenBarCount,
    lineFreq,
    housingMode,
    orbitType,
    orbitScale,
    casingVibration,
  ]);

  // Apply housing clipping/transparency
  const updateHousingVisuals = useCallback(() => {
    const model = modelRef.current;
    const mats = materialsRef.current;
    if (!model || !mats) return;

    model.root.updateMatrixWorld(true);
    clippingPlaneRef.current
      .set(new THREE.Vector3(0, 0, -1), 0)
      .applyMatrix4(model.root.matrixWorld);

    const housingMaterials = [
      mats.hPaint,
      mats.hGrill,
      mats.sLamA,
      mats.sLamB,
      mats.sCopper,
      mats.insul,
    ];

    for (const mt of housingMaterials) {
      const isTrans = stateRef.current.housingMode === 'trans';
      const isCut = stateRef.current.housingMode === 'cut';

      mt.clippingPlanes = isCut ? [clippingPlaneRef.current] : null;
      mt.transparent = isTrans || mt === mats.hGrill;
      mt.opacity = isTrans ? (mt === mats.hPaint || mt === mats.hGrill ? 0.13 : 0.3) : 1;
      mt.depthWrite = !isTrans;
      mt.needsUpdate = true;
    }
  }, []);

  useEffect(() => {
    updateHousingVisuals();
  }, [housingMode, updateHousingVisuals]);

  // Rebuild model when rotor geometry or fault parameters change
  const rebuildMotorModel = useCallback(() => {
    const scene = sceneRef.current;
    const mats = materialsRef.current;
    if (!scene || !mats) return;

    if (modelRef.current) {
      scene.remove(modelRef.current.root);
    }

    const newModel = buildMotor(THREE, mats, {
      R: numRotorBars,
      def: hasRotorBarFault,
      nb: brokenBarCount,
    });

    modelRef.current = newModel;
    scene.add(newModel.root);

    if (onNomenclatureReady) {
      onNomenclatureReady(newModel.cats);
    }

    stateRef.current.trailN = 0;
    updateHousingVisuals();
  }, [numRotorBars, hasRotorBarFault, brokenBarCount, onNomenclatureReady, updateHousingVisuals]);

  useEffect(() => {
    rebuildMotorModel();
  }, [rebuildMotorModel]);

  // Highlight part from nomenclature hover
  useEffect(() => {
    const model = modelRef.current;
    if (!model) return;

    model.cats.forEach((meshes, catName) => {
      const isTarget = highlightedPart === catName;
      meshes.forEach((mesh) => {
        if (isTarget) {
          (mesh as any).__origMat = (mesh as any).__origMat || mesh.material;
          mesh.material = new THREE.MeshBasicMaterial({
            color: 0x00f0ff,
            wireframe: false,
          });
        } else if ((mesh as any).__origMat) {
          mesh.material = (mesh as any).__origMat;
          delete (mesh as any).__origMat;
        }
      });
    });
  }, [highlightedPart]);

  // Initialize Three.js scene
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth;
    const height = mount.clientHeight || 470;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const bgColor = isLight ? 0xf1f5f9 : isBW ? 0x09090b : 0x0a0f1d;
    scene.background = new THREE.Color(bgColor);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.05, 20);
    camera.position.set(0.65, 0.48, 0.82);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = isLight ? 1.05 : 1.15;
    renderer.localClippingEnabled = true;
    rendererRef.current = renderer;

    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0.03, H, 0);
    controls.maxPolarAngle = Math.PI / 2 + 0.05; // don't go below floor
    controls.minDistance = 0.3;
    controls.maxDistance = 3.5;
    controls.update();
    controlsRef.current = controls;

    // Workshop Floor
    const textures = makeMotorTextures(THREE);
    texturesRef.current = textures;
    const mats = makeMaterials(THREE, textures);
    materialsRef.current = mats;

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(4, 4),
      new THREE.MeshStandardMaterial({
        map: textures.floor,
        roughness: 0.85,
        metalness: 0,
      })
    );
    floor.name = 'sol_atelier';
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, -0.0005, 0);
    floor.receiveShadow = true;
    scene.add(floor);

    // Studio Lighting
    const hemiLight = new THREE.HemisphereLight(
      0xffffff,
      isLight ? 0x8a857c : 0x334155,
      isLight ? 0.75 : 0.65
    );
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, isLight ? 2.2 : 2.5);
    keyLight.position.set(1.2, 2.2, 1.4);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(2048, 2048);
    keyLight.shadow.bias = -0.0003;
    keyLight.shadow.normalBias = 0.002;
    Object.assign(keyLight.shadow.camera, {
      left: -0.8,
      right: 0.8,
      top: 0.8,
      bottom: -0.8,
      near: 0.1,
      far: 6,
    });
    keyLight.shadow.camera.updateProjectionMatrix();
    scene.add(keyLight);
    scene.add(keyLight.target);
    keyLight.target.position.set(0, H, 0);

    const fillLight = new THREE.DirectionalLight(0x93c5fd, 0.8);
    fillLight.position.set(-1.5, 1.5, -1.0);
    scene.add(fillLight);

    // Initial Motor build
    const motor = buildMotor(THREE, mats, {
      R: numRotorBars,
      def: hasRotorBarFault,
      nb: brokenBarCount,
    });
    modelRef.current = motor;
    scene.add(motor.root);

    if (onNomenclatureReady) {
      onNomenclatureReady(motor.cats);
    }
    updateHousingVisuals();

    // Raycaster for hover tooltips
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(motor.root, true);

      const hit = intersects.find((h) => {
        if (!h.object.visible || !h.object.userData.part) return false;
        const mt = (h.object as THREE.Mesh).material as THREE.Material;
        const housingMats = [
          mats.hPaint,
          mats.hGrill,
          mats.sLamA,
          mats.sLamB,
          mats.sCopper,
          mats.insul,
        ];
        if (stateRef.current.housingMode === 'trans' && housingMats.includes(mt as any))
          return false;
        if (
          stateRef.current.housingMode === 'cut' &&
          housingMats.includes(mt as any) &&
          clippingPlaneRef.current.distanceToPoint(h.point) < 0
        )
          return false;
        return true;
      });

      if (hit && hit.object.userData.part) {
        const [group, name] = (hit.object.userData.part as string).split(' · ');
        setTooltip({
          visible: true,
          name: name || group,
          group: group || '',
          x: e.clientX - rect.left + 16,
          y: e.clientY - rect.top + 16,
        });
      } else {
        setTooltip((prev) => (prev.visible ? { ...prev, visible: false } : prev));
      }
    };

    const handlePointerLeave = () => {
      setTooltip((prev) => (prev.visible ? { ...prev, visible: false } : prev));
    };

    renderer.domElement.addEventListener('pointermove', handlePointerMove);
    renderer.domElement.addEventListener('pointerleave', handlePointerLeave);

    // Resize handling
    const resizeObserver = new ResizeObserver(() => {
      if (!mount || !renderer || !camera) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight || 470;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(mount);

    // Animation loop
    let lastTime = performance.now();
    let animId: number;

    const animate = (now: number) => {
      animId = requestAnimationFrame(animate);

      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const st = stateRef.current;
      const model = modelRef.current;

      if (st.isRunning) {
        st.time += dt * 0.035;
      }

      if (model && mats) {
        const ns = (120 * st.lineFreq) / st.poles;
        const fr = st.rpm / 60;
        const fs = (ns - st.rpm) / 60;
        const fp = st.poles * fs;
        const modAmp = st.hasRotorBarFault ? Math.min(0.12 * st.brokenBarCount, 0.6) : 0;

        const th = TAU * fr * st.time;
        const env = 1 + modAmp * Math.cos(TAU * fp * st.time);
        const orbitDef = ORBIT_DEFINITIONS[st.orbitType];

        // 1. Rotor rotation
        model.spin.rotation.x = -th;
        model.cages.forEach((cage) => {
          cage.rotation.x = -th * 0.38;
        });

        // 2. 3D Shaft precession orbit
        const [oa, ob] = orbitDef.fn(th);
        const k = (st.orbitScale * 0.00045 * env) / orbitDef.max;
        model.rotorG.position.set(0, H + ob * k, oa * k);

        // 3. Stator & casing structural vibration
        const s = st.casingVibration * 0.00035 * env;
        model.frame.position.set(
          0,
          s * Math.sin(th) * 0.6,
          s * Math.cos(th)
        );

        // 4. Real-time 3D orbit trail at shaft end
        const pos = model.trail.geometry.attributes.position as THREE.BufferAttribute;
        const NP = model.NP;
        const g = 7;

        if (st.isRunning) {
          if (st.trailN < NP) st.trailN++;
          for (let i = 0; i < st.trailN - 1; i++) {
            pos.setXYZ(i, pos.getX(i + 1), pos.getY(i + 1), pos.getZ(i + 1));
          }
          pos.setXYZ(st.trailN - 1, model.trailX, H + ob * k * g, oa * k * g);
          pos.needsUpdate = true;
          model.trail.geometry.setDrawRange(0, st.trailN);
          model.dot.position.set(model.trailX, H + ob * k * g, oa * k * g);
        }

        // 5. Broken bars glow pulsation at pole-pass frequency (Fp)
        const gI = st.hasRotorBarFault ? Math.max(0, Math.cos(TAU * fp * st.time)) : 0;
        mats.broken.emissiveIntensity = st.hasRotorBarFault ? 0.25 + 0.9 * gI : 0;
        model.glow.forEach((gl) => {
          gl.visible = gI > 0.15;
          gl.scale.setScalar(0.5 + gI);
        });
        mats.glow.opacity = 0.3 + 0.6 * gI;
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('pointermove', handlePointerMove);
      renderer.domElement.removeEventListener('pointerleave', handlePointerLeave);
      controls.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [isLight, isBW]);

  const handleResetCamera = () => {
    if (controlsRef.current && cameraRef.current) {
      controlsRef.current.target.set(0.03, H, 0);
      cameraRef.current.position.set(0.65, 0.48, 0.82);
      controlsRef.current.update();
    }
  };

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden border transition-all duration-300 ${
        isExpanded ? 'fixed inset-0 z-50 rounded-none bg-slate-950' : 'h-[470px]'
      } ${
        isLight
          ? 'bg-slate-50 border-slate-200'
          : isBW
          ? 'bg-zinc-950 border-zinc-800'
          : 'bg-slate-900/90 border-slate-800'
      }`}
    >
      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Floating Controls */}
      <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-2">
        {/* Housing view modes */}
        <div
          className={`flex items-center p-1 rounded-xl border backdrop-blur-md shadow-xs ${
            isLight
              ? 'bg-white/90 border-slate-200'
              : 'bg-slate-900/90 border-slate-700/70'
          }`}
        >
          <button
            onClick={() => onHousingModeChange('closed')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              housingMode === 'closed'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : isLight
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Fermé
          </button>
          <button
            onClick={() => onHousingModeChange('trans')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              housingMode === 'trans'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : isLight
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Transparent
          </button>
          <button
            onClick={() => onHousingModeChange('cut')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
              housingMode === 'cut'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : isLight
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Scissors className="w-3 h-3" />
            <span>Coupe 3D</span>
          </button>
        </div>

        {/* Reset Camera button */}
        <button
          onClick={handleResetCamera}
          title="Recentrer la vue 3D"
          className={`p-2 rounded-xl border backdrop-blur-md transition-all shadow-xs ${
            isLight
              ? 'bg-white/90 border-slate-200 text-slate-700 hover:bg-slate-100'
              : 'bg-slate-900/90 border-slate-700/70 text-slate-200 hover:bg-slate-800'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Top Right: Fullscreen Toggle */}
      <div className="absolute top-3 right-3 z-20">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          title={isExpanded ? 'Réduire' : 'Plein écran'}
          className={`p-2 rounded-xl border backdrop-blur-md transition-all shadow-xs ${
            isLight
              ? 'bg-white/90 border-slate-200 text-slate-700 hover:bg-slate-100'
              : 'bg-slate-900/90 border-slate-700/70 text-slate-200 hover:bg-slate-800'
          }`}
        >
          {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Bottom Floating Status Tag */}
      <div className="absolute bottom-3 left-3 z-20 pointer-events-none">
        <div
          className={`px-3 py-1.5 rounded-xl border text-[11px] font-mono backdrop-blur-md flex items-center gap-2 shadow-xs ${
            isLight
              ? 'bg-white/90 border-slate-200 text-slate-700'
              : 'bg-slate-900/90 border-slate-700/70 text-slate-300'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span>MOTEUR ASYNCHRONE 3D · 15 kW IE3 · B3</span>
        </div>
      </div>

      {/* Hover Tooltip */}
      {tooltip.visible && (
        <div
          className="absolute z-30 pointer-events-none px-3 py-2 rounded-xl text-xs shadow-xl backdrop-blur-md border border-slate-700/70 bg-slate-900/95 text-white animate-fade-in flex flex-col gap-0.5"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <b className="font-semibold text-sky-400">{tooltip.name}</b>
          <span className="text-[10px] text-slate-400">{tooltip.group}</span>
        </div>
      )}
    </div>
  );
}
