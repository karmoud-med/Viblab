import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Play, Pause, Eye, RotateCcw, Maximize2, Minimize2 } from 'lucide-react';

interface ThreeMotorViewProps {
  rpm: number;
  poles: number;
  numRotorBars: number;
  hasRotorBarFault: boolean;
  faultSeverity: number;
  theme?: 'dark' | 'light' | 'mono';
}

type PrecessionType = 'none' | 'sync_forward' | 'sync_backward' | 'sub_harmonic' | 'complex';

export default function ThreeMotorView({
  rpm,
  poles,
  numRotorBars,
  hasRotorBarFault,
  faultSeverity,
  theme = 'dark',
}: ThreeMotorViewProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [isRotating, setIsRotating] = useState(true);
  const [seeThrough, setSeeThrough] = useState(true);
  const [precession, setPrecession] = useState<PrecessionType>('sync_forward');
  const [orbitScale, setOrbitScale] = useState(4.0); // Visual amplification multiplier
  const [vibrationAmp, setVibrationAmp] = useState(3.0); // Casing shake multiplier
  const [isExpanded, setIsExpanded] = useState(false);

  const isLight = theme === 'light';
  const isBW = theme === 'mono';

  // Refs for animation loop updates
  const stateRef = useRef({
    rpm,
    hasRotorBarFault,
    faultSeverity,
    isRotating,
    precession,
    orbitScale,
    vibrationAmp,
  });

  // Track dragging state for interactive camera
  const cameraAngleRef = useRef({ theta: 0.8, phi: 1.2, radius: 8.5 });
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });

  // Update stateRef whenever props/state change
  useEffect(() => {
    stateRef.current = {
      rpm,
      hasRotorBarFault,
      faultSeverity,
      isRotating,
      precession,
      orbitScale,
      vibrationAmp,
    };
  }, [rpm, hasRotorBarFault, faultSeverity, isRotating, precession, orbitScale, vibrationAmp]);

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
    
    // Position camera using spherical coordinates
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

    const keyColor = isLight ? 0xffffff : (isBW ? 0xffffff : 0xf0f9ff);
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

    const fillColor = isLight ? 0xb0c4de : (isBW ? 0x888888 : 0x818cf8);
    const dirLight2 = new THREE.DirectionalLight(fillColor, isLight ? 1.0 : 2.0);
    dirLight2.position.set(-5, -5, -5);
    scene.add(dirLight2);

    // 5. Creating Motor Geometries and Meshes
    const motorGroup = new THREE.Group();
    scene.add(motorGroup);

    // Stator Group (holds the loaded GLTF motor model)
    const statorGroup = new THREE.Group();
    motorGroup.add(statorGroup);
    
    // Track materials to control seeThrough opacity
    const statorMaterials: THREE.Material[] = [];

    const gltfLoader = new GLTFLoader();
    gltfLoader.load('/models/motor/scene.gltf', (gltf) => {
      const model = gltf.scene;
      
      // Auto-scale to fit the scene (target size ~4 units)
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 4.0 / maxDim;
      model.scale.set(scale, scale, scale);
      
      // Center the model
      const center = box.getCenter(new THREE.Vector3());
      model.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
      
      // Store materials for opacity toggle
      model.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          if (mesh.material) {
            // Some models have array of materials, handle both
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach(m => statorMaterials.push(m));
            } else {
              statorMaterials.push(mesh.material as THREE.Material);
            }
          }
        }
      });

      // Wrapper to orient correctly
      const wrapper = new THREE.Group();
      wrapper.add(model);
      statorGroup.add(wrapper);
    }, undefined, (error) => {
      console.error('Erreur de chargement du modèle 3D du moteur:', error);
    });

    // ROTOR GROUP (rotates and whirls)
    const rotorGroup = new THREE.Group();
    motorGroup.add(rotorGroup);

    // --- BEARINGS (ROULEMENTS) & GEARS (ENGRENAGES) GENERATOR ---
    // Bearing geometries (shared between front and rear bearings)
    const bearingOuterGeom = new THREE.CylinderGeometry(0.55, 0.55, 0.16, 24, 1, true);
    const bearingInnerGeom = new THREE.CylinderGeometry(0.35, 0.35, 0.16, 18, 1, true);
    const bearingBallGeom = new THREE.SphereGeometry(0.08, 10, 10);
    
    const bearingMat = new THREE.MeshStandardMaterial({
      color: isBW ? 0x71717a : 0x475569,
      metalness: 0.95,
      roughness: 0.08,
      envMapIntensity: 1.2,
    });
    const ballMat = new THREE.MeshStandardMaterial({
      color: isBW ? 0xe4e4e7 : 0xd0d8e0,
      metalness: 1.0,
      roughness: 0.02,
      envMapIntensity: 2.0,
    });

    // Helper to generate a 3D ball bearing (Roulement à billes)
    const create3DBearing = (zPos: number) => {
      // 1. Static Outer Ring (attached to stator group)
      const outerRing = new THREE.Mesh(bearingOuterGeom, bearingMat);
      outerRing.rotation.x = Math.PI / 2;
      outerRing.position.z = zPos;
      statorGroup.add(outerRing);

      // 2. Rotating Inner Ring (attached to rotor group)
      const innerRing = new THREE.Mesh(bearingInnerGeom, bearingMat);
      innerRing.rotation.x = Math.PI / 2;
      innerRing.position.z = zPos;
      rotorGroup.add(innerRing);

      // 3. Rotating Balls (attached to rotor group so they spin)
      const ballsGroup = new THREE.Group();
      ballsGroup.position.z = zPos;
      
      const numBalls = 8;
      for (let i = 0; i < numBalls; i++) {
        const angle = (i / numBalls) * Math.PI * 2;
        const ball = new THREE.Mesh(bearingBallGeom, ballMat);
        ball.position.x = 0.45 * Math.cos(angle);
        ball.position.y = 0.45 * Math.sin(angle);
        ballsGroup.add(ball);
      }
      rotorGroup.add(ballsGroup);
    };

    // Instantiate front and rear bearings supporting the shaft
    create3DBearing(1.25);
    create3DBearing(-1.25);

    // Gear Geometries
    const gearCoreGeom = new THREE.CylinderGeometry(0.65, 0.65, 0.25, 24);
    const gearToothGeom = new THREE.BoxGeometry(0.12, 0.18, 0.25);
    const gearMat = new THREE.MeshStandardMaterial({
      color: isBW ? 0x888888 : 0xd97706,
      metalness: 0.92,
      roughness: 0.08,
      envMapIntensity: 1.5,
    });

    // Create Golden Gear (Engrenage) on rotor group (positioned at z = 1.7)
    const gearGroup = new THREE.Group();
    gearGroup.position.z = 1.75;
    
    const gearCore = new THREE.Mesh(gearCoreGeom, gearMat);
    gearCore.rotation.x = Math.PI / 2;
    gearGroup.add(gearCore);

    const numTeeth = 16;
    for (let i = 0; i < numTeeth; i++) {
      const angle = (i / numTeeth) * Math.PI * 2;
      const toothHolder = new THREE.Group();
      toothHolder.rotation.z = angle;

      const tooth = new THREE.Mesh(gearToothGeom, gearMat);
      tooth.position.y = 0.64; // radial offset to sit on the rim
      toothHolder.add(tooth);
      gearGroup.add(toothHolder);
    }
    // Add gear to rotor group so it spins beautifully!
    rotorGroup.add(gearGroup);

    // Rotor Core Cylinder (inside stator)
    const rotorCoreGeom = new THREE.CylinderGeometry(0.9, 0.9, 2.4, 24);
    const rotorCoreMat = new THREE.MeshStandardMaterial({
      color: isBW ? 0x52525b : 0x475569,
      metalness: 0.6,
      roughness: 0.5,
    });
    const rotorCore = new THREE.Mesh(rotorCoreGeom, rotorCoreMat);
    rotorCore.rotation.x = Math.PI / 2;
    rotorGroup.add(rotorCore);

    // Rotor Shaft (long rod sticking out)
    const shaftGeom = new THREE.CylinderGeometry(0.25, 0.25, 4.8, 16);
    const shaftMat = new THREE.MeshStandardMaterial({
      color: isBW ? 0xe4e4e7 : 0x94a3b8,
      metalness: 0.97,
      roughness: 0.05,
      envMapIntensity: 1.6,
    });
    const shaft = new THREE.Mesh(shaftGeom, shaftMat);
    shaft.rotation.x = Math.PI / 2;
    rotorGroup.add(shaft);

    // Pulley / coupling disc on shaft end
    const pulleyGeom = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 24);
    const pulleyMat = new THREE.MeshStandardMaterial({
      color: isBW ? 0x334155 : 0x1e3a8a,
      metalness: 0.8,
      roughness: 0.2,
    });
    const pulley = new THREE.Mesh(pulleyGeom, pulleyMat);
    pulley.rotation.x = Math.PI / 2;
    pulley.position.z = 2.1;
    rotorGroup.add(pulley);

    // Keyway indicator line on shaft to show rotation clearly
    const keywayGeom = new THREE.BoxGeometry(0.06, 0.06, 0.8);
    const keywayMat = new THREE.MeshBasicMaterial({ color: isBW ? 0xff0000 : 0xeab308 });
    const keyway = new THREE.Mesh(keywayGeom, keywayMat);
    keyway.position.set(0, 0.24, 2.0);
    rotorGroup.add(keyway);

    // Copper Rotor Bars (running inside the core cylindrical surface)
    const numBars = Math.min(numRotorBars, 24); // Cap rendering bars to keep FPS super high
    const barGeom = new THREE.CylinderGeometry(0.04, 0.04, 2.38, 8);
    const barMatNormal = new THREE.MeshStandardMaterial({
      color: isBW ? 0xa1a1aa : 0xf59e0b, // copper / yellow
      metalness: 0.8,
      roughness: 0.2,
    });
    const barMatFault = new THREE.MeshStandardMaterial({
      color: 0xef4444, // bright red fault
      emissive: 0xef4444,
      emissiveIntensity: 0.6,
      metalness: 0.5,
    });

    const rotorBars: THREE.Mesh[] = [];
    for (let i = 0; i < numBars; i++) {
      const angle = (i / numBars) * Math.PI * 2;
      const barHolder = new THREE.Group();
      barHolder.rotation.z = angle;

      // Color one bar red if fault is active to visually represent the cracked bar
      const isFaultyBar = hasRotorBarFault && (i === 0 || i === Math.floor(numBars / 2));
      const bar = new THREE.Mesh(barGeom, isFaultyBar ? barMatFault : barMatNormal);
      bar.rotation.x = Math.PI / 2;
      bar.position.y = 0.82; // place on the outer boundary of rotor core
      barHolder.add(bar);
      rotorGroup.add(barHolder);
      rotorBars.push(bar);
    }

    // Spark points at the fault location
    const sparkCount = 8;
    const sparkGeo = new THREE.BufferGeometry();
    const sparkPositions = new Float32Array(sparkCount * 3);
    for (let i = 0; i < sparkCount * 3; i++) {
      sparkPositions[i] = 0;
    }
    sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));
    const sparkMat = new THREE.PointsMaterial({
      color: 0xffdd44,
      size: 0.12,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    const sparks = new THREE.Points(sparkGeo, sparkMat);
    scene.add(sparks);

    // 6. Precession Orbit Path Tracer (Live Glowing line in front of the shaft)
    const maxPathPoints = 120;
    const orbitPathGeo = new THREE.BufferGeometry();
    const orbitPositions = new Float32Array(maxPathPoints * 3);
    // Initialize points to the resting front tip of shaft (0, 0, 2.4)
    for (let i = 0; i < maxPathPoints; i++) {
      orbitPositions[i * 3] = 0;
      orbitPositions[i * 3 + 1] = 0;
      orbitPositions[i * 3 + 2] = 2.4;
    }
    orbitPathGeo.setAttribute('position', new THREE.BufferAttribute(orbitPositions, 3));
    const orbitPathMat = new THREE.LineBasicMaterial({
      color: isBW ? 0xffffff : 0x22c55e,
      linewidth: 2,
    });
    const orbitPathLine = new THREE.Line(orbitPathGeo, orbitPathMat);
    scene.add(orbitPathLine);

    // Enable shadows on all motor meshes
    motorGroup.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        (child as THREE.Mesh).castShadow = true;
        (child as THREE.Mesh).receiveShadow = true;
      }
    });
    rotorGroup.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        (child as THREE.Mesh).castShadow = true;
        (child as THREE.Mesh).receiveShadow = true;
      }
    });

    // Ground shadow plane for depth
    const shadowGeo = new THREE.PlaneGeometry(8, 8);
    const shadowMat = new THREE.MeshStandardMaterial({
      color: isLight ? 0xdde3ec : (isBW ? 0x08090e : 0x060a10),
      roughness: 0.85,
      metalness: 0.0,
      envMapIntensity: 0.3,
    });
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -2.0;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);

    // Grid helper on floor
    const gridHelper = new THREE.GridHelper(
      8, 
      8, 
      isLight ? 0xcbd5e1 : (isBW ? 0x222222 : 0x1e293b), 
      isLight ? 0xf1f5f9 : (isBW ? 0x111111 : 0x0f172a)
    );
    gridHelper.position.y = -1.99;
    scene.add(gridHelper);

    // 7. Interactive Mouse Controls Handler
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

      // Restrict phi so we don't flip camera upside down
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

    // Track path index for drawing orbit
    const orbitPointsArray: THREE.Vector3[] = [];
    for (let i = 0; i < maxPathPoints; i++) {
      orbitPointsArray.push(new THREE.Vector3(0, 0, 2.4));
    }

    // 8. Animation Loop
    let clock = new THREE.Clock();
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const state = stateRef.current;
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Ensure proper materials opacity based on state
      statorMaterials.forEach(mat => {
        mat.opacity = seeThrough ? 0.15 : 1.0;
        mat.transparent = true;
        (mat as THREE.MeshStandardMaterial).depthWrite = !seeThrough;
        mat.needsUpdate = true;
      });

      if (state.isRotating) {
        // Calculate rotational speed in radians per second
        // Scaled down visually so high RPMs are watchable but fast
        const radPerSec = (state.rpm / 60) * Math.PI * 2 * 0.35;
        rotorGroup.rotation.z += radPerSec * delta;
      }

      // 9. Precession Orbit math & Rotor shaft displacement
      // Whirl displacement (orbit) parameters
      let orbitX = 0;
      let orbitY = 0;
      const orbitBaseFreq = (state.rpm / 60) * Math.PI * 2; // Synchronous speed

      // Adjust orbit based on Precession Selection
      const visualAmp = (state.orbitScale / 4.0) * 0.15; // Amp scale
      
      // Determine defect multiplier
      let severityFactor = 1.0;
      if (state.hasRotorBarFault) {
        severityFactor = 1.0 + state.faultSeverity * 2.0;
      }

      if (state.precession !== 'none') {
        const ampX = 0.8 * visualAmp * severityFactor;
        const ampY = 0.5 * visualAmp * severityFactor; // Elliptical

        if (state.precession === 'sync_forward') {
          // Forward precession: shaft orbits in same direction as rotation
          orbitX = ampX * Math.cos(orbitBaseFreq * time);
          orbitY = ampY * Math.sin(orbitBaseFreq * time);
        } else if (state.precession === 'sync_backward') {
          // Backward precession: orbits in opposite direction
          orbitX = ampX * Math.cos(-orbitBaseFreq * time);
          orbitY = ampY * Math.sin(-orbitBaseFreq * time);
        } else if (state.precession === 'sub_harmonic') {
          // Subharmonic oil whirl / instability orbit (whirl speed at 0.45x)
          const subFreq = orbitBaseFreq * 0.45;
          orbitX = ampX * Math.cos(subFreq * time) * 1.3;
          orbitY = ampY * Math.sin(subFreq * time) * 1.3;
        } else if (state.precession === 'complex') {
          // Multi-harmonic quasi-periodic orbit (double loop orbit)
          const f1 = orbitBaseFreq;
          const f2 = orbitBaseFreq * 2.15;
          orbitX = visualAmp * severityFactor * (0.8 * Math.cos(f1 * time) + 0.4 * Math.cos(f2 * time));
          orbitY = visualAmp * severityFactor * (0.6 * Math.sin(f1 * time) + 0.3 * Math.sin(f2 * time));
        }
      }

      // Apply orbital whirl translation to the Rotor Group
      // Pivoting around center so shaft moves in circular/elliptical wobble
      rotorGroup.position.x = orbitX;
      rotorGroup.position.y = orbitY;
      
      // Shaft wobbly tilting (angular deflection representing bending/precession)
      rotorGroup.rotation.y = orbitX * 0.12;
      rotorGroup.rotation.x = -orbitY * 0.12;

      // 10. Shaking Stator (directional housing vibration)
      // The stator structural housing vibrates from structural forces
      const shakeAmp = 0.012 * state.vibrationAmp * severityFactor;
      statorGroup.position.x = shakeAmp * Math.sin(orbitBaseFreq * 1.5 * time);
      statorGroup.position.y = shakeAmp * Math.cos(orbitBaseFreq * 1.5 * time) * 0.8;
      statorGroup.position.z = shakeAmp * 0.3 * Math.sin(orbitBaseFreq * 3.0 * time);

      // 11. Rotor Bar Spark Fault animation
      if (state.hasRotorBarFault) {
        // Position sparks at the faulty bar (assumed to be on the outer core radius of rotor)
        // Faulty bar is at local angle 0, rotating with rotorGroup
        const angleRotated = rotorGroup.rotation.z;
        const barLocalX = 0.82 * Math.cos(angleRotated);
        const barLocalY = 0.82 * Math.sin(angleRotated);
        
        // Transform local rotor coordinates to world coordinates
        const sparkCenterX = rotorGroup.position.x + barLocalX * Math.cos(rotorGroup.rotation.y) - barLocalY * Math.sin(rotorGroup.rotation.y);
        const sparkCenterY = rotorGroup.position.y + barLocalY * Math.cos(rotorGroup.rotation.x);
        const sparkCenterZ = 1.0; // Place sparks at front side where bar is mounted

        // Fill sparks position buffer
        const positions = sparks.geometry.attributes.position.array as Float32Array;
        sparkMat.opacity = 0.4 + Math.random() * 0.6; // Flicker
        
        for (let i = 0; i < sparkCount; i++) {
          positions[i * 3] = sparkCenterX + (Math.random() - 0.5) * 0.25;
          positions[i * 3 + 1] = sparkCenterY + (Math.random() - 0.5) * 0.25;
          positions[i * 3 + 2] = sparkCenterZ + (Math.random() - 0.5) * 0.4;
        }
        sparks.geometry.attributes.position.needsUpdate = true;
      } else {
        sparkMat.opacity = 0;
      }

      // 12. Trace Orbit Pathway in 3D
      // We read current front shaft center point in world coords
      const shaftWorldTip = new THREE.Vector3(0, 0, 2.4);
      rotorGroup.localToWorld(shaftWorldTip);

      // Shift path points and append newest
      orbitPointsArray.shift();
      orbitPointsArray.push(shaftWorldTip);

      // Map to buffer positions
      const orbitPosArr = orbitPathLine.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < maxPathPoints; i++) {
        orbitPosArr[i * 3] = orbitPointsArray[i].x;
        orbitPosArr[i * 3 + 1] = orbitPointsArray[i].y;
        orbitPosArr[i * 3 + 2] = orbitPointsArray[i].z;
      }
      orbitPathLine.geometry.attributes.position.needsUpdate = true;

      // Color orbit line based on mode
      if (isBW) {
        orbitPathMat.color.setHex(0xffffff);
      } else {
        // Red if heavy orbit, green if safe
        const totalDisp = Math.sqrt(orbitX * orbitX + orbitY * orbitY);
        if (totalDisp > 0.08) {
          orbitPathMat.color.setHex(0xf43f5e); // danger pink-red
        } else {
          orbitPathMat.color.setHex(isLight ? 0x2563eb : 0x10b981); // safe blue in light, emerald in dark
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize handler using ResizeObserver to support flex layouts and tab switching perfectly
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

    // 13. Cleanup on Unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('wheel', handleWheel);
      
      // Dispose WebGL resources
      renderer.dispose();
      envRT.dispose();
      bearingOuterGeom.dispose();
      bearingInnerGeom.dispose();
      bearingBallGeom.dispose();
      bearingMat.dispose();
      ballMat.dispose();
      gearCoreGeom.dispose();
      gearToothGeom.dispose();
      gearMat.dispose();
      rotorCoreGeom.dispose();
      rotorCoreMat.dispose();
      shaftGeom.dispose();
      shaftMat.dispose();
      pulleyGeom.dispose();
      pulleyMat.dispose();
      keywayGeom.dispose();
      keywayMat.dispose();
      barGeom.dispose();
      barMatNormal.dispose();
      barMatFault.dispose();
      sparkGeo.dispose();
      sparkMat.dispose();
      orbitPathGeo.dispose();
      orbitPathMat.dispose();
      shadowGeo.dispose();
      shadowMat.dispose();
      gridHelper.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [seeThrough, theme, numRotorBars, hasRotorBarFault]);

  // Reset Camera angle
  const handleResetCamera = () => {
    cameraAngleRef.current = { theta: 0.8, phi: 1.2, radius: 8.5 };
  };

  return (
    <div className={`flex flex-col border rounded-xl overflow-hidden shadow-lg ${
      isLight 
        ? 'bg-white border-slate-200' 
        : (isBW ? 'bg-slate-950 border-slate-800' : 'bg-slate-900/60 border-slate-800/80')
    }`}>
      {/* 3D viewport canvas */}
      <div className={`relative w-full cursor-grab active:cursor-grabbing overflow-hidden transition-all duration-300 ${
        isExpanded ? 'h-[650px]' : 'h-[450px]'
      }`}>
        <div ref={mountRef} className="w-full h-full" />

        {/* See-through overlay indicator */}
        <div className={`absolute bottom-3 left-3 flex items-center gap-1.5 backdrop-blur-md px-2.5 py-1 rounded text-[10px] font-mono border ${
          isLight
            ? 'bg-white/90 text-slate-800 border-slate-200 shadow-sm'
            : 'bg-slate-950/80 ${isLight ? "text-slate-700" : "text-slate-300"} ${isLight ? "border-slate-300" : "border-slate-800"}'
        }`}>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          MOTEUR 3D INTERACTIF
        </div>

        {/* Quick helper controls inside canvas */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <button
            onClick={() => setSeeThrough(!seeThrough)}
            title="Coupe Transparente"
            className={`p-1.5 rounded-lg border text-[11px] font-bold transition-all cursor-pointer ${
              seeThrough
                ? 'bg-blue-600 text-white border-blue-500'
                : (isLight
                    ? 'bg-white/90 text-slate-700 border-slate-200 hover:bg-slate-100 shadow-sm'
                    : 'bg-slate-950/80 ${isLight ? "text-slate-700" : "text-slate-300"} ${isLight ? "border-slate-300" : "border-slate-800"} hover:bg-slate-800')
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

      {/* Control panel & Explanations under 3D */}
      <div className={`p-4 border-t space-y-4 ${
        isLight 
          ? 'border-slate-200 bg-slate-50 text-slate-800' 
          : (isBW ? 'border-slate-800 bg-slate-950 text-slate-100' : 'border-slate-800/60 bg-[#1E293B]/50 text-slate-300')
      }`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Precession selection */}
          <div className="space-y-1.5">
            <span className={`text-[10px] font-bold uppercase tracking-widest block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Type d'orbite de précession (3D)
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'none', label: 'Aucune' },
                { id: 'sync_forward', label: 'Précession Directe' },
                { id: 'sync_backward', label: 'Précession Inverse' },
                { id: 'sub_harmonic', label: 'Whirl Sous-Synchrone' },
                { id: 'complex', label: 'Orbite Complexe' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPrecession(p.id as PrecessionType)}
                  className={`py-1 px-2 text-[10px] font-bold rounded border text-left transition-all cursor-pointer ${
                    precession === p.id
                      ? (isLight
                          ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                          : (isBW
                              ? 'bg-white text-black border-white'
                              : 'bg-blue-600 border-blue-500 text-white shadow-md'))
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
                <span className="font-mono text-blue-500 font-bold">{orbitScale.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="8"
                step="0.5"
                value={orbitScale}
                onChange={(e) => setOrbitScale(parseFloat(e.target.value))}
                className="w-full h-1 bg-slate-300 dark:bg-slate-950 rounded cursor-pointer accent-blue-500"
              />
            </div>

            {/* Casing vibration slider */}
            <div className="space-y-1">
              <div className={`flex justify-between items-center text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                <span>Vibration de la Structure (Carcasse)</span>
                <span className="font-mono text-emerald-500 font-bold">{vibrationAmp.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0"
                max="6"
                step="0.5"
                value={vibrationAmp}
                onChange={(e) => setVibrationAmp(parseFloat(e.target.value))}
                className="w-full h-1 bg-slate-300 dark:bg-slate-950 rounded cursor-pointer accent-emerald-500"
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
            <span>L'arbre tourne parfaitement au centre radial. Fonctionnement nominal stable.</span>
          )}
          {precession === 'sync_forward' && (
            <span>
              <strong>Précession Directe (Forward Whirl) :</strong> Le centre de l'arbre décrit une orbite dans le <strong>même sens</strong> que sa rotation propre. C'est le comportement typique d'une flexion due à un balourd (force centrifuge s'exerçant vers l'extérieur).
            </span>
          )}
          {precession === 'sync_backward' && (
            <span>
              <strong>Précession Inverse (Backward Whirl) :</strong> L'arbre décrit une orbite dans le <strong>sens opposé</strong> à sa rotation. Ce phénomène rare est déclenché par des chocs frictionnels répétés (rotor-stator rub) ou des contraintes d'asymétrie sévère.
            </span>
          )}
          {precession === 'sub_harmonic' && (
            <span>
              <strong>Whirl Sous-Synchrone (Instabilité) :</strong> Orbite circulaire à ~0.45x la fréquence de rotation. Caractéristique d'une instabilité de film d'huile de palier ou d'une résonance cinématique d'entrefer.
            </span>
          )}
          {precession === 'complex' && (
            <span>
              <strong>Orbite Multi-Harmonique :</strong> Trajectoire en "huit" ou boucles complexes. Elle modélise la superposition d'asymétries magnétiques et de forces d'impulsion, révélant la complexité des mouvements mécaniques réels.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
