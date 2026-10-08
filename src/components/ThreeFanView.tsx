import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RotateCcw, Eye, Wind, Zap, Maximize2, Minimize2 } from 'lucide-react';

interface ThreeFanViewProps {
  rpm: number;
  numBlades: number;
  hasFlowIssue: boolean;
  turbulenceLevel: number;
  theme?: 'dark' | 'light' | 'mono';
}

type PrecessionType = 'none' | 'sync_forward' | 'sync_backward' | 'fluid_turbulence' | 'complex_whirl';

export default function ThreeFanView({
  rpm,
  numBlades,
  hasFlowIssue,
  turbulenceLevel,
  theme = 'dark',
}: ThreeFanViewProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [isRotating, setIsRotating] = useState(true);
  const [seeThrough, setSeeThrough] = useState(true);
  const [precession, setPrecession] = useState<PrecessionType>('sync_forward');
  const [orbitScale, setOrbitScale] = useState(4.0);
  const [vibrationAmp, setVibrationAmp] = useState(3.0);
  const [isExpanded, setIsExpanded] = useState(false);

  const isLight = theme === 'light';
  const isBW = theme === 'mono';

  // Refs for animation updates
  const stateRef = useRef({
    rpm,
    numBlades,
    hasFlowIssue,
    turbulenceLevel,
    isRotating,
    precession,
    orbitScale,
    vibrationAmp,
  });

  // Track dragging state for interactive camera
  const cameraAngleRef = useRef({ theta: 0.6, phi: 1.3, radius: 8.5 });
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    stateRef.current = {
      rpm,
      numBlades,
      hasFlowIssue,
      turbulenceLevel,
      isRotating,
      precession,
      orbitScale,
      vibrationAmp,
    };
  }, [rpm, numBlades, hasFlowIssue, turbulenceLevel, isRotating, precession, orbitScale, vibrationAmp]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    if (isLight) {
      scene.background = new THREE.Color('#f8fafc');
    } else {
      scene.background = new THREE.Color(isBW ? '#090d16' : '#0B0F19');
    }

    // 2. Camera Setup
    const width = container.clientWidth || 400;
    const height = container.clientHeight || 300;
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
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.9;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // PBR environment map for realistic metallic reflections
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const envPixels = new Uint8Array([
      130, 150, 190, 255, 130, 150, 190, 255, 130, 150, 190, 255, 130, 150, 190, 255,
      30, 35, 45, 255, 30, 35, 45, 255, 30, 35, 45, 255, 30, 35, 45, 255,
    ]);
    const envTex = new THREE.DataTexture(envPixels, 4, 2, THREE.RGBAFormat);
    envTex.needsUpdate = true;
    const envRT = pmremGenerator.fromEquirectangular(envTex);
    scene.environment = envRT.texture;
    envTex.dispose();
    pmremGenerator.dispose();

    // 4. Lighting - Physically realistic 3-point setup
    const ambientColor = isLight ? 0xcccccc : (isBW ? 0x666666 : 0x778899);
    const ambientLight = new THREE.AmbientLight(ambientColor, isLight ? 0.7 : 0.45);
    scene.add(ambientLight);

    const keyColor = isLight ? 0x10b981 : (isBW ? 0xffffff : 0xf0f9ff);
    const dirLight1 = new THREE.DirectionalLight(keyColor, isLight ? 3.5 : 4.5);
    dirLight1.position.set(5, 10, 7);
    dirLight1.castShadow = true;
    dirLight1.shadow.mapSize.width = 1024;
    dirLight1.shadow.mapSize.height = 1024;
    dirLight1.shadow.camera.near = 0.1;
    dirLight1.shadow.camera.far = 30;
    dirLight1.shadow.camera.left = -6;
    dirLight1.shadow.camera.right = 6;
    dirLight1.shadow.camera.top = 6;
    dirLight1.shadow.camera.bottom = -6;
    dirLight1.shadow.bias = -0.001;
    scene.add(dirLight1);

    const fillColor = isLight ? 0xb0c4de : (isBW ? 0x888888 : 0x38bdf8); // sky blue side light
    const dirLight2 = new THREE.DirectionalLight(fillColor, isLight ? 1.0 : 2.0);
    dirLight2.position.set(-5, -5, -5);
    scene.add(dirLight2);

    // 5. Build Turbomachine (Volute Pump/Fan Housing & Impeller)
    const fanGroup = new THREE.Group();
    scene.add(fanGroup);

    // Stator/Housing Group
    const statorGroup = new THREE.Group();
    fanGroup.add(statorGroup);

    // Centrifugal Pump Volute — high-fidelity round casing
    const voluteGeom = new THREE.CylinderGeometry(1.8, 1.8, 1.2, 64, 2);
    const voluteMat = new THREE.MeshStandardMaterial({
      color: isLight ? 0x64748b : (isBW ? 0x52525b : 0x475569),
      metalness: isLight ? 0.75 : 0.88,
      roughness: 0.15,
      envMapIntensity: 1.2,
      transparent: true,
      opacity: seeThrough ? 0.15 : 0.92,
      depthWrite: !seeThrough,
    });
    const volute = new THREE.Mesh(voluteGeom, voluteMat);
    volute.rotation.x = Math.PI / 2;
    statorGroup.add(volute);

    // Suction Inlet Pipe (axial)
    const inletGeom = new THREE.CylinderGeometry(0.7, 0.7, 1.5, 16);
    const inletMat = new THREE.MeshStandardMaterial({
      color: isLight ? 0x475569 : (isBW ? 0x3f3f46 : 0x1e293b),
      metalness: isLight ? 0.75 : 0.88,
      roughness: 0.15,
      envMapIntensity: 1.1,
      transparent: true,
      opacity: seeThrough ? 0.15 : 0.92,
      depthWrite: !seeThrough,
    });
    const inletPipe = new THREE.Mesh(inletGeom, inletMat);
    inletPipe.position.z = 1.0;
    statorGroup.add(inletPipe);

    // Discharge Pipe (tangential extending upwards)
    const dischargeGeom = new THREE.CylinderGeometry(0.5, 0.5, 2.0, 32);
    const dischargeMat = new THREE.MeshStandardMaterial({
      color: isLight ? 0x475569 : (isBW ? 0x3f3f46 : 0x1e293b),
      metalness: isLight ? 0.75 : 0.88,
      roughness: 0.15,
      envMapIntensity: 1.1,
      transparent: true,
      opacity: seeThrough ? 0.15 : 0.92,
      depthWrite: !seeThrough,
    });
    const dischargePipe = new THREE.Mesh(dischargeGeom, dischargeMat);
    dischargePipe.position.set(1.6, 1.2, 0);
    dischargePipe.rotation.z = -0.2;
    statorGroup.add(dischargePipe);

    // Pump Base Plate
    const baseGeom = new THREE.BoxGeometry(2.4, 0.3, 2.0);
    const baseMat = new THREE.MeshStandardMaterial({
      color: isLight ? 0x334155 : (isBW ? 0x18181b : 0x0f172a),
      metalness: 0.8,
      roughness: 0.4,
    });
    const basePlate = new THREE.Mesh(baseGeom, baseMat);
    basePlate.position.y = -2.0;
    statorGroup.add(basePlate);

    // Dynamic Impeller Rotating Group
    const rotorGroup = new THREE.Group();
    fanGroup.add(rotorGroup);

    // Center Shaft
    const shaftGeom = new THREE.CylinderGeometry(0.2, 0.2, 3.6, 16);
    const shaftMat = new THREE.MeshStandardMaterial({
      color: isLight ? 0x94a3b8 : (isBW ? 0xd4d4d8 : 0x94a3b8),
      metalness: 0.97,
      roughness: 0.05,
      envMapIntensity: 1.6,
    });
    const shaft = new THREE.Mesh(shaftGeom, shaftMat);
    shaft.rotation.x = Math.PI / 2;
    rotorGroup.add(shaft);

    // --- BEARINGS (ROULEMENTS) & GEARS (ENGRENAGES) GENERATOR ---
    const bearingOuterGeom = new THREE.CylinderGeometry(0.45, 0.45, 0.16, 24, 1, true);
    const bearingInnerGeom = new THREE.CylinderGeometry(0.28, 0.28, 0.16, 18, 1, true);
    const bearingBallGeom = new THREE.SphereGeometry(0.065, 10, 10);
    
    const bearingMat = new THREE.MeshStandardMaterial({
      color: isLight ? 0x64748b : (isBW ? 0x71717a : 0x475569),
      metalness: 0.95,
      roughness: 0.08,
      envMapIntensity: 1.2,
    });
    const ballMat = new THREE.MeshStandardMaterial({
      color: isLight ? 0xf8fafc : (isBW ? 0xe4e4e7 : 0xb0bec5),
      metalness: 1.0,
      roughness: 0.02,
      envMapIntensity: 2.0,
    });

    // Helper to generate a 3D ball bearing (Roulement à billes)
    const create3DBearing = (zPos: number) => {
      const outerRing = new THREE.Mesh(bearingOuterGeom, bearingMat);
      outerRing.rotation.x = Math.PI / 2;
      outerRing.position.z = zPos;
      statorGroup.add(outerRing);

      const innerRing = new THREE.Mesh(bearingInnerGeom, bearingMat);
      innerRing.rotation.x = Math.PI / 2;
      innerRing.position.z = zPos;
      rotorGroup.add(innerRing);

      const ballsGroup = new THREE.Group();
      ballsGroup.position.z = zPos;
      
      const numBalls = 8;
      for (let i = 0; i < numBalls; i++) {
        const angle = (i / numBalls) * Math.PI * 2;
        const ball = new THREE.Mesh(bearingBallGeom, ballMat);
        ball.position.x = 0.36 * Math.cos(angle);
        ball.position.y = 0.36 * Math.sin(angle);
        ballsGroup.add(ball);
      }
      rotorGroup.add(ballsGroup);
    };

    create3DBearing(0.6);
    create3DBearing(-0.8);

    // Gear Geometries
    const gearCoreGeom = new THREE.CylinderGeometry(0.55, 0.55, 0.25, 24);
    const gearToothGeom = new THREE.BoxGeometry(0.1, 0.16, 0.25);
    const gearMat = new THREE.MeshStandardMaterial({
      color: isLight ? 0xd97706 : (isBW ? 0x888888 : 0xd97706),
      metalness: 0.92,
      roughness: 0.08,
      envMapIntensity: 1.5,
    });

    const gearGroup = new THREE.Group();
    gearGroup.position.z = -1.4;
    
    const gearCore = new THREE.Mesh(gearCoreGeom, gearMat);
    gearCore.rotation.x = Math.PI / 2;
    gearGroup.add(gearCore);

    const numTeeth = 14;
    for (let i = 0; i < numTeeth; i++) {
      const angle = (i / numTeeth) * Math.PI * 2;
      const toothHolder = new THREE.Group();
      toothHolder.rotation.z = angle;

      const tooth = new THREE.Mesh(gearToothGeom, gearMat);
      tooth.position.y = 0.54; // radial offset to sit on the rim
      toothHolder.add(tooth);
      gearGroup.add(toothHolder);
    }
    rotorGroup.add(gearGroup);

    // Impeller central Hub disk
    const hubGeom = new THREE.CylinderGeometry(0.65, 0.65, 0.3, 24);
    const hubMat = new THREE.MeshStandardMaterial({
      color: isLight ? 0x1d4ed8 : (isBW ? 0x52525b : 0x1e3a8a), // industrial dark blue
      metalness: 0.8,
      roughness: 0.2,
    });
    const hub = new THREE.Mesh(hubGeom, hubMat);
    hub.rotation.x = Math.PI / 2;
    rotorGroup.add(hub);

    // Custom Dynamic Impeller Blades list
    const bladeMatNormal = new THREE.MeshStandardMaterial({
      color: isLight ? 0xe11d48 : (isBW ? 0x71717a : 0xf43f5e),
      metalness: isLight ? 0.75 : 0.88,
      roughness: 0.12,
      envMapIntensity: 1.3,
      side: THREE.DoubleSide,
    });

    const impellerBladesGroup = new THREE.Group();
    rotorGroup.add(impellerBladesGroup);

    const rebuildBlades = (count: number) => {
      while (impellerBladesGroup.children.length > 0) {
        const obj = impellerBladesGroup.children[0];
        impellerBladesGroup.remove(obj);
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
        }
      }

      // Aerodynamic backward-curved impeller blades (more realistic shape)
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const bladePivot = new THREE.Group();
        bladePivot.rotation.z = angle;

        // Blade root (wide, near hub)
        const rootGeom = new THREE.BoxGeometry(0.06, 0.28, 0.36);
        const rootBlade = new THREE.Mesh(rootGeom, bladeMatNormal);
        rootBlade.position.set(0.52, 0, 0);
        rootBlade.rotation.z = 0.6;
        bladePivot.add(rootBlade);

        // Blade tip (narrower, near volute)
        const tipGeom = new THREE.BoxGeometry(0.04, 0.45, 0.30);
        const tipBlade = new THREE.Mesh(tipGeom, bladeMatNormal);
        tipBlade.position.set(0.98, 0, 0);
        tipBlade.rotation.z = 0.35;
        bladePivot.add(tipBlade);

        // Leading edge connector
        const edgeGeom = new THREE.BoxGeometry(0.035, 0.52, 0.08);
        const edgeBlade = new THREE.Mesh(edgeGeom, bladeMatNormal);
        edgeBlade.position.set(0.73, 0.06, 0.12);
        edgeBlade.rotation.z = 0.48;
        bladePivot.add(edgeBlade);

        impellerBladesGroup.add(bladePivot);
      }
    };
    rebuildBlades(numBlades);

    // 6. Fluid flow particle engine
    // We animate a pool of 50 particles traveling in a closed loop through pump
    const particleCount = 50;
    const particlesGroup = new THREE.Group();
    scene.add(particlesGroup);

    interface FlowParticle {
      mesh: THREE.Mesh;
      state: 'intake' | 'impeller' | 'discharge';
      progress: number; // 0 to 1
      speed: number;
      localAngle: number;
      offsetRadius: number;
      offsetY: number;
    }

    const flowParticles: FlowParticle[] = [];
    const sphereGeo = new THREE.SphereGeometry(0.06, 8, 8);
    const particleMatNormal = new THREE.MeshBasicMaterial({
      color: isLight ? 0x2563eb : (isBW ? 0xffffff : 0x38bdf8), // glowing blue-cyan
      transparent: true,
      opacity: 0.8,
    });
    const particleMatCavitation = new THREE.MeshBasicMaterial({
      color: 0xef4444, // boiling red cavitation bubble
      transparent: true,
      opacity: 0.9,
    });

    for (let i = 0; i < particleCount; i++) {
      const mesh = new THREE.Mesh(sphereGeo, particleMatNormal.clone());
      particlesGroup.add(mesh);

      flowParticles.push({
        mesh,
        state: 'intake',
        progress: Math.random(),
        speed: 0.35 + Math.random() * 0.4,
        localAngle: Math.random() * Math.PI * 2,
        offsetRadius: Math.random() * 0.4,
        offsetY: (Math.random() - 0.5) * 0.3,
      });
    }

    // 7. Precession Orbit Tracer (Live glowing path behind the impeller tip)
    const maxPathPoints = 120;
    const orbitPathGeo = new THREE.BufferGeometry();
    const orbitPositions = new Float32Array(maxPathPoints * 3);
    for (let i = 0; i < maxPathPoints; i++) {
      orbitPositions[i * 3] = 0;
      orbitPositions[i * 3 + 1] = 0;
      orbitPositions[i * 3 + 2] = 0.8;
    }
    orbitPathGeo.setAttribute('position', new THREE.BufferAttribute(orbitPositions, 3));
    const orbitPathMat = new THREE.LineBasicMaterial({
      color: isBW ? 0xffffff : (isLight ? 0x16a34a : 0x22c55e),
      linewidth: 2,
    });
    const orbitPathLine = new THREE.Line(orbitPathGeo, orbitPathMat);
    scene.add(orbitPathLine);

    // Enable shadows on all fan meshes
    fanGroup.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        (child as THREE.Mesh).castShadow = true;
        (child as THREE.Mesh).receiveShadow = true;
      }
    });

    // Floor shadow plane
    const shadowGeo = new THREE.PlaneGeometry(8, 8);
    const shadowMat = new THREE.MeshStandardMaterial({
      color: isLight ? 0xdde3ec : (isBW ? 0x08090e : 0x060a10),
      roughness: 0.85,
      metalness: 0.0,
      envMapIntensity: 0.3,
    });
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -2.15;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);

    // Grid helper
    const gridHelper = new THREE.GridHelper(
      8, 
      8, 
      isLight ? 0xcbd5e1 : (isBW ? 0x222222 : 0x1e293b), 
      isLight ? 0xf1f5f9 : (isBW ? 0x111111 : 0x0f172a)
    );
    gridHelper.position.y = -2.14;
    scene.add(gridHelper);

    // 8. Interactive Mouse Drag Controls
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
      cameraAngleRef.current.radius = Math.max(4.0, Math.min(15.0, cameraAngleRef.current.radius));
      updateCameraPos();
    };

    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('wheel', handleWheel, { passive: false });

    // Track path history Vector3s for orbit drawing
    const orbitPointsArray: THREE.Vector3[] = [];
    for (let i = 0; i < maxPathPoints; i++) {
      orbitPointsArray.push(new THREE.Vector3(0, 0, 0.8));
    }

    // 9. Animation Loop
    let clock = new THREE.Clock();
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const state = stateRef.current;
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Ensure proper see-through values
      voluteMat.opacity = seeThrough ? 0.15 : 0.92;
      voluteMat.depthWrite = !seeThrough;
      inletMat.opacity = seeThrough ? 0.15 : 0.92;
      inletMat.depthWrite = !seeThrough;
      dischargeMat.opacity = seeThrough ? 0.15 : 0.92;
      dischargeMat.depthWrite = !seeThrough;

      if (state.isRotating) {
        // Spin speed (RPM mapped visually)
        const rotSpeed = (state.rpm / 60) * Math.PI * 2 * 0.35;
        rotorGroup.rotation.z += rotSpeed * delta;
      }

      // 10. Physical precession orbits / Whirl mathematical modeling
      let orbitX = 0;
      let orbitY = 0;
      const orbitBaseFreq = (state.rpm / 60) * Math.PI * 2;
      const visualAmp = (state.orbitScale / 4.0) * 0.18;

      // Severity is raised if we have cavitation flow issues (unstable hydraulic forces)
      let severityFactor = 1.0;
      if (state.hasFlowIssue) {
        severityFactor = 1.0 + state.turbulenceLevel * 2.2;
      }

      if (state.precession !== 'none') {
        const ampX = 0.85 * visualAmp * severityFactor;
        const ampY = 0.55 * visualAmp * severityFactor;

        if (state.precession === 'sync_forward') {
          // Synchronous forward whirling orbit (unbalance)
          orbitX = ampX * Math.cos(orbitBaseFreq * time);
          orbitY = ampY * Math.sin(orbitBaseFreq * time);
        } else if (state.precession === 'sync_backward') {
          // Synchronous backward whirling orbit (rubbing / misalignment)
          orbitX = ampX * Math.cos(-orbitBaseFreq * time);
          orbitY = ampY * Math.sin(-orbitBaseFreq * time);
        } else if (state.precession === 'fluid_turbulence') {
          // Chaotic, turbulent low-frequency whirl (fluid cavitation forces)
          // Combines fractional sub-synchronous speeds with random noise
          const lowF = orbitBaseFreq * 0.32;
          const chaosScale = state.turbulenceLevel * 0.3;
          orbitX = ampX * (Math.cos(lowF * time) + (Math.sin(time * 5.7) * chaosScale));
          orbitY = ampY * (Math.sin(lowF * time) + (Math.cos(time * 4.3) * chaosScale));
        } else if (state.precession === 'complex_whirl') {
          // Double frequency loop orbit (misalignment + unbalance)
          const f1 = orbitBaseFreq;
          const f2 = orbitBaseFreq * 2.0;
          orbitX = visualAmp * severityFactor * (0.7 * Math.cos(f1 * time) + 0.45 * Math.cos(f2 * time));
          orbitY = visualAmp * severityFactor * (0.55 * Math.sin(f1 * time) + 0.35 * Math.sin(f2 * time));
        }
      }

      // Offset rotor group by current precession orbit values
      rotorGroup.position.x = orbitX;
      rotorGroup.position.y = orbitY;
      
      // Dynamic shaft gyroscopic angle tilting
      rotorGroup.rotation.y = orbitX * 0.14;
      rotorGroup.rotation.x = -orbitY * 0.14;

      // 11. Stator/Volute structural vibration shaking
      const shakeAmp = 0.012 * state.vibrationAmp * severityFactor;
      statorGroup.position.x = shakeAmp * Math.sin(orbitBaseFreq * 1.8 * time);
      statorGroup.position.y = shakeAmp * Math.cos(orbitBaseFreq * 1.8 * time) * 0.8;
      statorGroup.position.z = shakeAmp * 0.4 * Math.cos(orbitBaseFreq * 3.6 * time);

      // 12. Fluid Flow Particles Animation inside 3D Casing
      flowParticles.forEach((p, idx) => {
        const flowSpeed = p.speed * (state.isRotating ? (0.2 + (state.rpm / 1500) * 0.8) : 0.05);
        p.progress += flowSpeed * delta;
        if (p.progress > 1.0) {
          p.progress = 0;
          p.localAngle = Math.random() * Math.PI * 2;
        }

        let px = 0, py = 0, pz = 0;
        
        if (p.progress < 0.3) {
          const t_intake = p.progress / 0.3;
          pz = 2.4 - t_intake * 2.1;
          const spinAngle = p.localAngle + t_intake * 1.5;
          px = p.offsetRadius * Math.cos(spinAngle);
          py = p.offsetRadius * Math.sin(spinAngle);
          p.state = 'intake';
        } else if (p.progress < 0.7) {
          const t_imp = (p.progress - 0.3) / 0.4;
          const bladeRotAngle = rotorGroup.rotation.z + p.localAngle + t_imp * 3.5;
          const currentRadius = 0.4 + t_imp * 1.25;
          
          px = currentRadius * Math.cos(bladeRotAngle);
          py = currentRadius * Math.sin(bladeRotAngle);
          pz = (Math.random() - 0.5) * 0.15;
          p.state = 'impeller';
        } else {
          const t_dis = (p.progress - 0.7) / 0.3;
          px = 1.6 + (Math.random() - 0.5) * 0.15;
          py = 1.1 + t_dis * 1.8;
          pz = (Math.random() - 0.5) * 0.15;
          p.state = 'discharge';
        }

        // Apply chaotic turbulent swirls if cavitation/flow issue is enabled
        if (state.hasFlowIssue) {
          const tLevel = state.turbulenceLevel;
          px += Math.sin(time * 18 + idx) * 0.15 * tLevel;
          py += Math.cos(time * 22 + idx) * 0.15 * tLevel;
          pz += Math.sin(time * 26 + idx) * 0.12 * tLevel;

          if (idx % 3 === 0 && p.state === 'impeller') {
            p.mesh.material = particleMatCavitation;
          } else {
            p.mesh.material = particleMatNormal;
          }
        } else {
          p.mesh.material = particleMatNormal;
        }

        p.mesh.position.set(px, py, pz);
      });

      // 13. Trace Impeller shaft tip orbit in 3D
      const impellerWorldTip = new THREE.Vector3(0, 0, 0.8);
      rotorGroup.localToWorld(impellerWorldTip);

      orbitPointsArray.shift();
      orbitPointsArray.push(impellerWorldTip);

      const orbitPosArr = orbitPathLine.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < maxPathPoints; i++) {
        orbitPosArr[i * 3] = orbitPointsArray[i].x;
        orbitPosArr[i * 3 + 1] = orbitPointsArray[i].y;
        orbitPosArr[i * 3 + 2] = orbitPointsArray[i].z;
      }
      orbitPathLine.geometry.attributes.position.needsUpdate = true;

      // Color orbit path
      if (isBW) {
        orbitPathMat.color.setHex(0xffffff);
      } else {
        const totalDisp = Math.sqrt(orbitX * orbitX + orbitY * orbitY);
        if (totalDisp > 0.08) {
          orbitPathMat.color.setHex(0xf43f5e); // pink danger
        } else {
          orbitPathMat.color.setHex(isLight ? 0x2563eb : 0x10b981); // blue in light, green in dark
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // Handle Resize using ResizeObserver to support flex layouts and tab switching perfectly
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const w = entry.contentRect.width || container.clientWidth || 400;
        const h = entry.contentRect.height || container.clientHeight || 280;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    });
    resizeObserver.observe(container);

    // 14. Cleanup on Unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('wheel', handleWheel);

      renderer.dispose();
      envRT.dispose();
      voluteGeom.dispose();
      voluteMat.dispose();
      inletGeom.dispose();
      inletMat.dispose();
      dischargeGeom.dispose();
      dischargeMat.dispose();
      baseGeom.dispose();
      baseMat.dispose();
      bearingOuterGeom.dispose();
      bearingInnerGeom.dispose();
      bearingBallGeom.dispose();
      bearingMat.dispose();
      ballMat.dispose();
      gearCoreGeom.dispose();
      gearToothGeom.dispose();
      gearMat.dispose();
      shaftGeom.dispose();
      shaftMat.dispose();
      hubGeom.dispose();
      hubMat.dispose();
      bladeMatNormal.dispose();
      sphereGeo.dispose();
      particleMatNormal.dispose();
      particleMatCavitation.dispose();
      orbitPathGeo.dispose();
      orbitPathMat.dispose();
      shadowGeo.dispose();
      shadowMat.dispose();
      gridHelper.dispose();

      // Recursive cleanup of child geometries
      while (impellerBladesGroup.children.length > 0) {
        const obj = impellerBladesGroup.children[0];
        impellerBladesGroup.remove(obj);
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
        }
      }

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [seeThrough, numBlades, theme]);

  const handleResetCamera = () => {
    cameraAngleRef.current = { theta: 0.6, phi: 1.3, radius: 8.5 };
  };

  return (
    <div className={`flex flex-col border rounded-xl overflow-hidden shadow-lg ${
      isLight 
        ? 'bg-white border-slate-200' 
        : (isBW ? 'bg-slate-950 border-slate-800' : 'bg-slate-900/60 border-slate-800/80')
    }`}>
      {/* 3D view area */}
      <div className={`relative w-full cursor-grab active:cursor-grabbing overflow-hidden transition-all duration-300 ${
        isExpanded ? 'h-[650px]' : 'h-[450px]'
      }`}>
        <div ref={mountRef} className="w-full h-full" />

        {/* Casing transparency floating indicator */}
        <div className={`absolute bottom-3 left-3 flex items-center gap-1.5 backdrop-blur-md px-2.5 py-1 rounded text-[10px] font-mono border ${
          isLight
            ? 'bg-white/90 text-slate-800 border-slate-200 shadow-sm'
            : 'bg-slate-950/80 ${isLight ? "text-slate-700" : "text-slate-300"} ${isLight ? "border-slate-300" : "border-slate-800"}'
        }`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          TURBOMACHINE 3D INTERACTIVE
        </div>

        {/* Quick helper controls */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <button
            onClick={() => setSeeThrough(!seeThrough)}
            title="Coupe Volute Transparente"
            className={`p-1.5 rounded-lg border text-[11px] font-bold transition-all cursor-pointer ${
              seeThrough
                ? 'bg-emerald-600 text-white border-emerald-500'
                : (isLight
                    ? 'bg-white/90 text-slate-700 border-slate-200 hover:bg-slate-100 shadow-sm'
                    : 'bg-slate-950/80 ${isLight ? "text-slate-700" : "text-slate-300"} ${isLight ? "border-slate-300" : "border-slate-800"} hover:bg-slate-850')
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleResetCamera}
            title="Réinitialiser la Caméra"
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              isLight
                ? 'bg-white/90 text-slate-700 border-slate-200 hover:bg-slate-100 shadow-sm'
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
                ? 'bg-white/90 text-slate-700 border-slate-200 hover:bg-slate-100 shadow-sm'
                : 'bg-slate-950/80 ${isLight ? "text-slate-700" : "text-slate-300"} ${isLight ? "border-slate-300" : "border-slate-800"} hover:bg-slate-800'
            }`}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Control sliders & Precession buttons */}
      <div className={`p-4 border-t space-y-4 ${
        isLight 
          ? 'border-slate-200 bg-slate-50 text-slate-800' 
          : (isBW ? 'border-slate-800 bg-slate-950 text-slate-100' : 'border-slate-800/60 bg-[#1E293B]/50 text-slate-300')
      }`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Precession Selection */}
          <div className="space-y-1.5">
            <span className={`text-[10px] font-bold uppercase tracking-widest block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Type d'orbite de précession (3D)
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'none', label: 'Aucune' },
                { id: 'sync_forward', label: 'Précession Directe' },
                { id: 'sync_backward', label: 'Précession Inverse' },
                { id: 'fluid_turbulence', label: 'Whirl Turbulent / Chocs' },
                { id: 'complex_whirl', label: 'Orbite GMF / Aubes' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPrecession(p.id as PrecessionType)}
                  className={`py-1 px-2 text-[10px] font-bold rounded border text-left transition-all cursor-pointer ${
                    precession === p.id
                      ? (isLight
                          ? 'bg-emerald-600 border-emerald-500 text-white shadow-md'
                          : (isBW
                              ? 'bg-white text-black border-white'
                              : 'bg-emerald-600 border-emerald-500 text-white shadow-md'))
                      : (isLight
                          ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                          : '${isLight ? "bg-white" : "bg-slate-950"} border-slate-850 ${isLight ? "text-slate-600" : "text-slate-400"} hover:text-slate-200 hover:bg-slate-900')
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Scale customization */}
          <div className="space-y-3">
            {/* Orbit amplification */}
            <div className="space-y-1">
              <div className={`flex justify-between items-center text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                <span>Amplification de l'Orbite (Précession)</span>
                <span className={`font-mono font-bold ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`}>{orbitScale.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="8"
                step="0.5"
                value={orbitScale}
                onChange={(e) => setOrbitScale(parseFloat(e.target.value))}
                className="w-full h-1 bg-slate-300 dark:bg-slate-950 rounded cursor-pointer accent-emerald-500"
              />
            </div>

            {/* Volute vibration slider */}
            <div className="space-y-1">
              <div className={`flex justify-between items-center text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                <span>Vibration du Corps (Volute/Châssis)</span>
                <span className={`font-mono font-bold ${isLight ? 'text-blue-600' : 'text-blue-450'}`}>{vibrationAmp.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0"
                max="6"
                step="0.5"
                value={vibrationAmp}
                onChange={(e) => setVibrationAmp(parseFloat(e.target.value))}
                className="w-full h-1 bg-slate-300 dark:bg-slate-950 rounded cursor-pointer accent-blue-500"
              />
            </div>
          </div>

        </div>

        {/* Short dynamic physical explanation card */}
        <div className={`p-3 rounded-lg border text-[11px] leading-relaxed ${
          isLight
            ? 'bg-white border-slate-200 text-slate-500'
            : '${isLight ? "bg-slate-50" : "bg-slate-950/40"} border-slate-850 ${isLight ? "text-slate-600" : "text-slate-400"}'
        }`}>
          {precession === 'none' && (
            <span>L'arbre tourne parfaitement au centre radial. Les particules de fluide s'écoulent de manière optimale dans la volute.</span>
          )}
          {precession === 'sync_forward' && (
            <span>
              <strong>Précession Directe (Unbalance) :</strong> Le rotor de la pompe fléchit radialement et tourne dans un orbite synchrone circulaire. Typique d'une aube cassée ou obstruée créant un déséquilibre massique centrifuge.
            </span>
          )}
          {precession === 'sync_backward' && (
            <span>
              <strong>Précession Inverse (Backward Whirl) :</strong> Orbite rétrograde due au frottement de l'arbre contre la bague d'usure ou le presse-étoupe (contact frictionnel sévère rotor-stator).
            </span>
          )}
          {precession === 'fluid_turbulence' && (
            <span>
              <strong>Whirl de Turbulence / Cavitation :</strong> L'arbre subit des mouvements orbitaux chaotiques à très basse fréquence sous l'impact d'implosions de vapeur répétées (cavitation) et d'un écoulement désordonné.
            </span>
          )}
          {precession === 'complex_whirl' && (
            <span>
              <strong>Orbite GMF / Aubes :</strong> Superpose la précession synchrone (1x) avec des harmoniques de haute fréquence liées au passage répété des aubes devant la languette de volute (vibrations de refoulement complexes).
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
