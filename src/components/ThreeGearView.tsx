import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Eye, RotateCcw, Maximize2, Minimize2 } from 'lucide-react';

interface ThreeGearViewProps {
  rpm: number;
  teeth1: number;
  teeth2: number;
  eccentricity: number;
  theme?: 'dark' | 'light' | 'mono';
}

export default function ThreeGearView({
  rpm,
  teeth1,
  teeth2,
  eccentricity,
  theme = 'dark',
}: ThreeGearViewProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [seeThrough, setSeeThrough] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const stateRef = useRef({
    rpm,
    teeth1,
    teeth2,
    eccentricity,
  });

  const cameraAngleRef = useRef({ theta: 0.0, phi: 0.6, radius: 8.5 });
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });

  const isBW = theme === 'mono';
  const isLight = theme === 'light';

  useEffect(() => {
    stateRef.current = {
      rpm,
      teeth1,
      teeth2,
      eccentricity,
    };
  }, [rpm, teeth1, teeth2, eccentricity]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(
      isLight ? '#f8fafc' : isBW ? '#090d16' : '#0B0F19'
    );

    // 2. Camera Setup
    const width = container.clientWidth || 400;
    const height = container.clientHeight || 350;
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);

    const updateCameraPos = () => {
      const { theta, phi, radius } = cameraAngleRef.current;
      camera.position.x = radius * Math.sin(phi) * Math.sin(theta);
      camera.position.y = radius * Math.cos(phi);
      camera.position.z = radius * Math.sin(phi) * Math.cos(theta);
      camera.lookAt(0, 0, 0);
    };
    updateCameraPos();

    // 3. Renderer Setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 4. Lighting - Enhanced for high visibility in dark mode
    const ambientLight = new THREE.AmbientLight(
      isLight ? 0x94a3b8 : isBW ? 0x666666 : 0x778899,
      isLight ? 2.0 : 1.8
    );
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(
      isLight ? 0x3b82f6 : isBW ? 0xffffff : 0xf0f9ff,
      isLight ? 2.5 : 3.0
    );
    dirLight1.position.set(5, 10, 7);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(
      isLight ? 0xf43f5e : isBW ? 0x888888 : 0x818cf8,
      isLight ? 1.2 : 2.0
    );
    dirLight2.position.set(-5, -5, -5);
    scene.add(dirLight2);

    // 5. Build 3D Gear System
    const gearsSystemGroup = new THREE.Group();
    scene.add(gearsSystemGroup);

    // Gear sizing scale
    const module = 0.07; // physical teeth sizing module

    const d1 = teeth1 * module;
    const d2 = teeth2 * module;

    const r1 = d1 / 2;
    const r2 = d2 / 2;

    const thickness = 0.4;

    const gear1Group = new THREE.Group();
    const gear2Group = new THREE.Group();

    gearsSystemGroup.add(gear1Group);
    gearsSystemGroup.add(gear2Group);

    // Positions: Centered at mesh line
    const totalDistance = r1 + r2;
    
    // Shift system slightly to center it
    const offset1 = -totalDistance / 2;
    const offset2 = totalDistance / 2;

    gear1Group.position.x = offset1;
    gear2Group.position.x = offset2;

    // Materials
    const gear1Mat = new THREE.MeshStandardMaterial({
      color: isLight ? 0x3b82f6 : isBW ? 0x3f3f46 : 0x38bdf8,
      metalness: 0.85,
      roughness: 0.2,
      transparent: true,
      opacity: seeThrough ? 0.4 : 0.95,
    });

    const gear2Mat = new THREE.MeshStandardMaterial({
      color: isLight ? 0xef4444 : isBW ? 0x71717a : 0xf43f5e,
      metalness: 0.85,
      roughness: 0.2,
      transparent: true,
      opacity: seeThrough ? 0.4 : 0.95,
    });

    const brassMat = new THREE.MeshStandardMaterial({
      color: isLight ? 0xf59e0b : isBW ? 0x52525b : 0xeab308,
      metalness: 0.9,
      roughness: 0.15,
    });

    const shaftMat = new THREE.MeshStandardMaterial({
      color: isLight ? 0xcbd5e1 : isBW ? 0xd4d4d8 : 0x94a3b8,
      metalness: 0.95,
      roughness: 0.1,
    });

    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xeab308,
      transparent: true,
      opacity: 0.8,
    });

    // Helper to generate a 3D Gear mesh with teeth
    const create3DGear = (group: THREE.Group, radius: number, teeth: number, material: THREE.Material) => {
      // 1. Gear Core Cylinder
      const coreGeom = new THREE.CylinderGeometry(radius - 0.08, radius - 0.08, thickness, 32);
      const core = new THREE.Mesh(coreGeom, material);
      core.rotation.x = Math.PI / 2;
      group.add(core);

      // 2. Add Teeth
      const toothGeom = new THREE.BoxGeometry(module * 1.1, module * 1.5, thickness * 1.02);
      for (let i = 0; i < teeth; i++) {
        const angle = (i / teeth) * Math.PI * 2;
        const toothHolder = new THREE.Group();
        toothHolder.rotation.z = angle;

        const tooth = new THREE.Mesh(toothGeom, material);
        tooth.position.y = radius - 0.04;
        toothHolder.add(tooth);
        group.add(toothHolder);
      }

      // 3. Brass Core Rim
      const rimGeom = new THREE.CylinderGeometry(radius * 0.4, radius * 0.4, thickness * 1.1, 16);
      const rim = new THREE.Mesh(rimGeom, brassMat);
      rim.rotation.x = Math.PI / 2;
      group.add(rim);

      // 4. Center Shaft Hole
      const shaftGeom = new THREE.CylinderGeometry(radius * 0.18, radius * 0.18, thickness * 3.5, 12);
      const shaft = new THREE.Mesh(shaftGeom, shaftMat);
      shaft.rotation.x = Math.PI / 2;
      group.add(shaft);

      // 5. Shaft keyway line
      const keywayGeom = new THREE.BoxGeometry(0.04, 0.04, thickness * 3.6);
      const keywayMat = new THREE.MeshBasicMaterial({ color: 0xffdd00 });
      const keyway = new THREE.Mesh(keywayGeom, keywayMat);
      keyway.position.set(0, radius * 0.17, 0);
      group.add(keyway);
    };

    create3DGear(gear1Group, r1, teeth1, gear1Mat);
    create3DGear(gear2Group, r2, teeth2, gear2Mat);

    // Make Gear 2 teeth mesh offset correctly (offset by half tooth step)
    gear2Group.rotation.z = Math.PI / teeth2;

    // Contact Point glowing cylinder
    const contactGlowGeom = new THREE.CylinderGeometry(0.08, 0.08, thickness * 1.1, 12);
    const contactGlow = new THREE.Mesh(contactGlowGeom, glowMat);
    contactGlow.rotation.x = Math.PI / 2;
    contactGlow.position.x = 0; // Exactly on mesh line center (0,0,0)
    scene.add(contactGlow);

    // Shadow Floor
    const shadowGeo = new THREE.PlaneGeometry(8, 8);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: isLight ? 0xe2e8f0 : isBW ? 0x05070c : 0x070a12,
      side: THREE.DoubleSide,
    });
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.rotation.x = Math.PI / 2;
    shadowPlane.position.y = -2.2;
    scene.add(shadowPlane);

    const gridHelper = new THREE.GridHelper(
      8,
      8,
      isLight ? 0xcbd5e1 : isBW ? 0x222222 : 0x1e293b,
      isLight ? 0xf1f5f9 : isBW ? 0x111111 : 0x0f172a
    );
    gridHelper.position.y = -2.19;
    scene.add(gridHelper);

    // Dynamic support shafts representation at back
    const supportGeom1 = new THREE.BoxGeometry(0.3, totalDistance * 1.3, 0.15);
    const supportMesh = new THREE.Mesh(supportGeom1, shaftMat);
    supportMesh.position.set(0, 0, -thickness * 1.8);
    gearsSystemGroup.add(supportMesh);

    // Mouse handlers
    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };

      cameraAngleRef.current.theta -= deltaX * 0.008;
      cameraAngleRef.current.phi -= deltaY * 0.008;
      cameraAngleRef.current.phi = Math.max(0.1, Math.min(Math.PI - 0.1, cameraAngleRef.current.phi));
      updateCameraPos();
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      cameraAngleRef.current.radius += e.deltaY * 0.005;
      cameraAngleRef.current.radius = Math.max(3.5, Math.min(15.0, cameraAngleRef.current.radius));
      updateCameraPos();
    };

    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('wheel', handleWheel, { passive: false });

    // Animation loop
    let clock = new THREE.Clock();
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const state = stateRef.current;
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Shaft speed in rad/s (scaled for smooth viewing)
      const speed1 = (state.rpm / 60) * Math.PI * 2 * 0.3;
      const ratio = state.teeth1 / state.teeth2;
      const speed2 = speed1 * ratio;

      // Spin Gear 1 (Driver)
      gear1Group.rotation.z += speed1 * delta;

      // Spin Gear 2 (Driven) - opposite direction, mesh phase shifted
      gear2Group.rotation.z -= speed2 * delta;

      // Handle shaft wobble from eccentricity
      const eccentricityAmp = state.eccentricity * 0.07;
      if (eccentricityAmp > 0) {
        // Wobble Gear 1 radially based on its rotation angle
        const wobbleX = eccentricityAmp * Math.cos(gear1Group.rotation.z);
        const wobbleY = eccentricityAmp * Math.sin(gear1Group.rotation.z);
        gear1Group.position.x = offset1 + wobbleX;
        gear1Group.position.y = wobbleY;

        // Pulse contact glow indicator at Gear Mesh Frequency (GMF)
        const gmfFreq = (state.rpm / 60) * state.teeth1;
        const pulse = 0.5 + 0.5 * Math.sin(time * Math.PI * 2 * gmfFreq * 0.1);
        glowMat.opacity = 0.3 + pulse * 0.5;
        contactGlow.scale.set(1 + pulse * 0.4, 1, 1 + pulse * 0.4);
        
        // Minor shaking on driven gear group from vibrations
        gear2Group.position.x = offset2 + (Math.random() - 0.5) * eccentricityAmp * 0.4;
        gear2Group.position.y = (Math.random() - 0.5) * eccentricityAmp * 0.4;
      } else {
        // Reset positions
        gear1Group.position.set(offset1, 0, 0);
        gear2Group.position.set(offset2, 0, 0);
        glowMat.opacity = 0.4;
        contactGlow.scale.set(1, 1, 1);
      }

      renderer.render(scene, camera);
    };

    animate();

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const w = entry.contentRect.width || container.clientWidth || 400;
        const h = entry.contentRect.height || container.clientHeight || 350;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    });
    resizeObserver.observe(container);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('wheel', handleWheel);

      renderer.dispose();
      gear1Mat.dispose();
      gear2Mat.dispose();
      brassMat.dispose();
      shaftMat.dispose();
      glowMat.dispose();
      supportGeom1.dispose();
      supportMesh.geometry.dispose();
      contactGlowGeom.dispose();
      shadowGeo.dispose();
      shadowMat.dispose();
      gridHelper.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [seeThrough, theme, teeth1, teeth2]);

  const handleResetCamera = () => {
    cameraAngleRef.current = { theta: 0.0, phi: 0.6, radius: 8.5 };
  };

  return (
    <div className={`flex flex-col border rounded-xl overflow-hidden ${isLight ? 'bg-white border-slate-200' : isBW ? 'bg-slate-950 border-slate-800' : 'bg-slate-900/60 border-slate-800/80'} shadow-lg transition-all duration-300`}>
      <div className={`relative w-full cursor-grab active:cursor-grabbing overflow-hidden transition-all duration-300 ${
        isExpanded ? 'h-[580px]' : 'h-[360px]'
      }`}>
        <div ref={mountRef} className="w-full h-full" />

        {/* Floating overlays */}
        <div className={`absolute bottom-3 left-3 flex items-center gap-1.5 backdrop-blur-md px-2.5 py-1 rounded text-[10px] font-mono border ${
          isLight 
            ? 'bg-slate-100/90 text-slate-800 border-slate-200' 
            : 'bg-slate-950/80 ${isLight ? "text-slate-700" : "text-slate-300"} ${isLight ? "border-slate-300" : "border-slate-800"}'
        }`}>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          ENGRENAGE 3D INTERACTIF
        </div>

        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <button
            onClick={() => setSeeThrough(!seeThrough)}
            title="Coupe Transparente"
            className={`p-1.5 rounded-lg border text-[11px] font-bold transition-all cursor-pointer ${
              seeThrough
                ? 'bg-blue-600 text-white border-blue-500'
                : isLight
                  ? 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  : 'bg-slate-950/80 ${isLight ? "text-slate-700" : "text-slate-300"} ${isLight ? "border-slate-300" : "border-slate-800"} hover:bg-slate-800'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleResetCamera}
            title="Réinitialiser la Caméra"
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              isLight
                ? 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                : 'bg-slate-950/80 ${isLight ? "text-slate-700" : "text-slate-300"} ${isLight ? "border-slate-300" : "border-slate-800"} hover:bg-slate-800'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Réduire" : "Agrandir"}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              isLight
                ? 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 shadow-sm'
                : 'bg-slate-950/80 ${isLight ? "text-slate-700" : "text-slate-300"} ${isLight ? "border-slate-300" : "border-slate-800"} hover:bg-slate-800'
            }`}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
