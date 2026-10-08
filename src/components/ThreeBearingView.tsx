import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Eye, RotateCcw, Maximize2, Minimize2 } from 'lucide-react';

interface ThreeBearingViewProps {
  rpm: number;
  numBalls: number;
  ballDiameter: number;
  pitchDiameter: number;
  contactAngle: number;
  activeDefect: 'none' | 'bpfo' | 'bpfi' | 'bsf' | 'ftf';
  defectSeverity: number;
  theme?: 'dark' | 'light' | 'mono';
}

export default function ThreeBearingView({
  rpm,
  numBalls,
  ballDiameter,
  pitchDiameter,
  contactAngle,
  activeDefect,
  defectSeverity,
  theme = 'dark',
}: ThreeBearingViewProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [seeThrough, setSeeThrough] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  // Keep references to values for the animation tick
  const stateRef = useRef({
    rpm,
    numBalls,
    ballDiameter,
    pitchDiameter,
    contactAngle,
    activeDefect,
    defectSeverity,
  });

  const cameraAngleRef = useRef({ theta: 0.6, phi: 1.0, radius: 7.5 });
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });

  const isBW = theme === 'mono';
  const isLight = theme === 'light';

  useEffect(() => {
    stateRef.current = {
      rpm,
      numBalls,
      ballDiameter,
      pitchDiameter,
      contactAngle,
      activeDefect,
      defectSeverity,
    };
  }, [rpm, numBalls, ballDiameter, pitchDiameter, contactAngle, activeDefect, defectSeverity]);

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
      isLight ? 0xef4444 : isBW ? 0x888888 : 0x818cf8,
      isLight ? 1.2 : 2.0
    );
    dirLight2.position.set(-5, -5, -5);
    scene.add(dirLight2);

    // 5. Build 3D Bearing
    const bearingGroup = new THREE.Group();
    scene.add(bearingGroup);

    const viewScale = 4.0 / (pitchDiameter + ballDiameter * 2 || 40);
    const pdScaled = pitchDiameter * viewScale;
    const bdScaled = ballDiameter * viewScale;

    const rOuterIn = pdScaled / 2 + bdScaled / 2;
    const rOuterOut = rOuterIn + bdScaled * 0.4;
    const rInnerIn = pdScaled / 2 - bdScaled / 2 - bdScaled * 0.4;
    const rInnerOut = pdScaled / 2 - bdScaled / 2;

    const ringThickness = bdScaled * 1.5;

    // Materials
    const steelMat = new THREE.MeshStandardMaterial({
      color: isLight ? 0xe2e8f0 : isBW ? 0x3f3f46 : 0x475569,
      metalness: 0.9,
      roughness: 0.15,
      transparent: true,
      opacity: seeThrough ? 0.35 : 0.95,
      side: THREE.DoubleSide,
    });

    const innerSteelMat = new THREE.MeshStandardMaterial({
      color: isLight ? 0xcbd5e1 : isBW ? 0x52525b : 0x334155,
      metalness: 0.9,
      roughness: 0.1,
    });

    const ballMat = new THREE.MeshStandardMaterial({
      color: isLight ? 0xf1f5f9 : isBW ? 0xd4d4d8 : 0x94a3b8,
      metalness: 1.0,
      roughness: 0.05,
    });

    const cageMat = new THREE.MeshStandardMaterial({
      color: isLight ? 0xf59e0b : isBW ? 0x52525b : 0xd97706,
      metalness: 0.8,
      roughness: 0.25,
      transparent: true,
      opacity: 0.8,
    });

    const defectHighlightMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xef4444,
      emissiveIntensity: 0.8,
    });

    // Outer Ring Mesh (stationary)
    const outerRingGroup = new THREE.Group();
    bearingGroup.add(outerRingGroup);

    const outerGeom = new THREE.CylinderGeometry(rOuterOut, rOuterOut, ringThickness, 32, 1, true);
    const outerMesh = new THREE.Mesh(outerGeom, steelMat);
    outerMesh.rotation.x = Math.PI / 2;
    outerRingGroup.add(outerMesh);

    const outerFlangeGeom1 = new THREE.RingGeometry(rOuterIn, rOuterOut, 32);
    const outerFlange1 = new THREE.Mesh(outerFlangeGeom1, steelMat);
    outerFlange1.position.z = ringThickness / 2;
    outerRingGroup.add(outerFlange1);

    const outerFlange2 = outerFlange1.clone();
    outerFlange2.position.z = -ringThickness / 2;
    outerRingGroup.add(outerFlange2);

    // Inner Ring Mesh (rotating)
    const innerRingGroup = new THREE.Group();
    bearingGroup.add(innerRingGroup);

    const innerGeom = new THREE.CylinderGeometry(rInnerOut, rInnerIn, ringThickness, 32, 1, true);
    const innerMesh = new THREE.Mesh(innerGeom, innerSteelMat);
    innerMesh.rotation.x = Math.PI / 2;
    innerRingGroup.add(innerMesh);

    const innerFlangeGeom1 = new THREE.RingGeometry(rInnerIn, rInnerOut, 32);
    const innerFlange1 = new THREE.Mesh(innerFlangeGeom1, innerSteelMat);
    innerFlange1.position.z = ringThickness / 2;
    innerRingGroup.add(innerFlange1);

    const innerFlange2 = innerFlange1.clone();
    innerFlange2.position.z = -ringThickness / 2;
    innerRingGroup.add(innerFlange2);

    // Shaft through inner ring
    const shaftGeom = new THREE.CylinderGeometry(rInnerIn, rInnerIn, ringThickness * 2.2, 24);
    const shaftMesh = new THREE.Mesh(shaftGeom, innerSteelMat);
    shaftMesh.rotation.x = Math.PI / 2;
    innerRingGroup.add(shaftMesh);

    // Dynamic Cage Group
    const cageGroup = new THREE.Group();
    bearingGroup.add(cageGroup);

    // Cage Rings
    const cageRingGeom = new THREE.RingGeometry(pdScaled / 2 - bdScaled * 0.1, pdScaled / 2 + bdScaled * 0.1, 32);
    const cageRing1 = new THREE.Mesh(cageRingGeom, cageMat);
    cageRing1.position.z = bdScaled * 0.4;
    cageGroup.add(cageRing1);

    const cageRing2 = cageRing1.clone();
    cageRing2.position.z = -bdScaled * 0.4;
    cageGroup.add(cageRing2);

    // Cage spacers between balls
    const cageSpacerGeom = new THREE.CylinderGeometry(bdScaled * 0.1, bdScaled * 0.1, bdScaled * 0.8, 8);
    const ballsGroup = new THREE.Group();
    cageGroup.add(ballsGroup);

    // Create Balls and Spacers
    const ballMeshes: THREE.Mesh[] = [];
    const buildBalls = (count: number) => {
      while (ballsGroup.children.length > 0) {
        ballsGroup.remove(ballsGroup.children[0]);
      }
      ballMeshes.length = 0;

      const geom = new THREE.SphereGeometry(bdScaled / 2, 32, 32);

      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const bX = (pdScaled / 2) * Math.cos(angle);
        const bY = (pdScaled / 2) * Math.sin(angle);

        const ball = new THREE.Mesh(geom, ballMat);
        ball.position.set(bX, bY, 0);
        ballsGroup.add(ball);
        ballMeshes.push(ball);

        const spacerAngle = angle + Math.PI / count;
        const sX = (pdScaled / 2) * Math.cos(spacerAngle);
        const sY = (pdScaled / 2) * Math.sin(spacerAngle);
        const spacer = new THREE.Mesh(cageSpacerGeom, cageMat);
        spacer.position.set(sX, sY, 0);
        spacer.rotation.x = Math.PI / 2;
        spacer.rotation.z = spacerAngle;
        cageGroup.add(spacer);
      }
    };
    buildBalls(numBalls);

    // Defect Visual Markers
    const defectPointGeom = new THREE.SphereGeometry(bdScaled * 0.15, 8, 8);
    const bpfoMarker = new THREE.Mesh(defectPointGeom, defectHighlightMat);
    bpfoMarker.position.set(rOuterIn, 0, 0);
    bpfoMarker.visible = false;
    outerRingGroup.add(bpfoMarker);

    const bpfiMarker = new THREE.Mesh(defectPointGeom, defectHighlightMat);
    bpfiMarker.position.set(rInnerOut, 0, 0);
    bpfiMarker.visible = false;
    innerRingGroup.add(bpfiMarker);

    // Spark Particles for defect impacts
    const sparkCount = 10;
    const sparkGeo = new THREE.BufferGeometry();
    const sparkPositions = new Float32Array(sparkCount * 3);
    sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));
    const sparkMat = new THREE.PointsMaterial({
      color: 0xffaa00,
      size: 0.15,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    const sparks = new THREE.Points(sparkGeo, sparkMat);
    scene.add(sparks);

    // Floor and shadows for depth
    const shadowGeo = new THREE.PlaneGeometry(8, 8);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: isLight ? 0xe2e8f0 : isBW ? 0x05070c : 0x070a12,
      side: THREE.DoubleSide,
    });
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.rotation.x = Math.PI / 2;
    shadowPlane.position.y = -2.0;
    scene.add(shadowPlane);

    const gridHelper = new THREE.GridHelper(
      8,
      8,
      isLight ? 0xcbd5e1 : isBW ? 0x222222 : 0x1e293b,
      isLight ? 0xf1f5f9 : isBW ? 0x111111 : 0x0f172a
    );
    gridHelper.position.y = -1.99;
    scene.add(gridHelper);

    // Mouse control handlers
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

    // Animation variables
    let clock = new THREE.Clock();
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const state = stateRef.current;
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Clear defect highlights
      bpfoMarker.visible = false;
      bpfiMarker.visible = false;
      sparkMat.opacity = 0;

      // Shaft Rotational Speed (Hz)
      const fr = state.rpm / 60;
      const omegaS = fr * Math.PI * 2; // Rad/sec

      // Rotate Inner Ring
      innerRingGroup.rotation.z += omegaS * delta * 0.35; // visually scaled

      // Theoretical cage speed (FTF) speed (Typically ~0.4x RPM)
      // FTF = (fr / 2) * (1 - (d/D)*cos(angle))
      const d_over_D = state.ballDiameter / state.pitchDiameter || 0.2;
      const ftfSpeed = (fr / 2) * (1 - d_over_D * Math.cos((state.contactAngle * Math.PI) / 180));
      const omegaCage = ftfSpeed * Math.PI * 2;

      // Rotate Cage (with balls)
      cageGroup.rotation.z += omegaCage * delta * 0.35;

      // Spin balls about their own axes (BSF)
      // BSF = (fr * D / (2 * d)) * (1 - (d/D)^2 * cos^2(angle))
      const bsfSpeed = (fr * (1 / d_over_D) / 2) * (1 - Math.pow(d_over_D, 2));
      const omegaBall = bsfSpeed * Math.PI * 2;

      ballMeshes.forEach((ball) => {
        ball.rotation.y += omegaBall * delta * 0.35;
      });

      // Handle defect visualization
      let shakeIntensity = 0;
      const sev = state.defectSeverity;

      if (state.activeDefect !== 'none') {
        const bpfoFreq = ftfSpeed * state.numBalls * 2; // approximation
        const period = 1.0 / (bpfoFreq || 5);

        // Impact flash
        const isImpact = Math.sin(time * Math.PI * 2 / period) > 0.85;

        if (state.activeDefect === 'bpfo') {
          bpfoMarker.visible = true;
          if (isImpact) {
            shakeIntensity = 0.05 * sev;
            sparkMat.opacity = 0.8 * sev;
            const pos = sparks.geometry.attributes.position.array as Float32Array;
            for (let i = 0; i < sparkCount; i++) {
              pos[i * 3] = rOuterIn + (Math.random() - 0.5) * 0.1;
              pos[i * 3 + 1] = (Math.random() - 0.5) * 0.1;
              pos[i * 3 + 2] = (Math.random() - 0.5) * 0.15;
            }
            sparks.geometry.attributes.position.needsUpdate = true;
          }
        } else if (state.activeDefect === 'bpfi') {
          bpfiMarker.visible = true;
          if (isImpact) {
            shakeIntensity = 0.04 * sev;
            sparkMat.opacity = 0.8 * sev;
            
            // Transform marker to world coordinate position for spark emitter
            const angle = innerRingGroup.rotation.z;
            const sX = rInnerOut * Math.cos(angle);
            const sY = rInnerOut * Math.sin(angle);

            const pos = sparks.geometry.attributes.position.array as Float32Array;
            for (let i = 0; i < sparkCount; i++) {
              pos[i * 3] = sX + (Math.random() - 0.5) * 0.1;
              pos[i * 3 + 1] = sY + (Math.random() - 0.5) * 0.1;
              pos[i * 3 + 2] = (Math.random() - 0.5) * 0.15;
            }
            sparks.geometry.attributes.position.needsUpdate = true;
          }
        } else if (state.activeDefect === 'bsf') {
          if (isImpact && ballMeshes.length > 0) {
            // Defect on first ball
            const targetBall = ballMeshes[0];
            shakeIntensity = 0.03 * sev;
            sparkMat.opacity = 0.8 * sev;

            // Get ball's absolute position in world space
            const ballWorldPos = new THREE.Vector3();
            targetBall.getWorldPosition(ballWorldPos);

            const pos = sparks.geometry.attributes.position.array as Float32Array;
            for (let i = 0; i < sparkCount; i++) {
              pos[i * 3] = ballWorldPos.x + (Math.random() - 0.5) * 0.1;
              pos[i * 3 + 1] = ballWorldPos.y + (Math.random() - 0.5) * 0.1;
              pos[i * 3 + 2] = ballWorldPos.z + (Math.random() - 0.5) * 0.1;
            }
            sparks.geometry.attributes.position.needsUpdate = true;
          }
        } else if (state.activeDefect === 'ftf') {
          if (isImpact) {
            shakeIntensity = 0.02 * sev;
          }
        }
      }

      // Apply case vibration/shake
      if (shakeIntensity > 0) {
        bearingGroup.position.x = (Math.random() - 0.5) * shakeIntensity;
        bearingGroup.position.y = (Math.random() - 0.5) * shakeIntensity;
        bearingGroup.position.z = (Math.random() - 0.5) * shakeIntensity * 0.5;
      } else {
        // Slow centering spring force
        bearingGroup.position.multiplyScalar(0.85);
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
      outerGeom.dispose();
      steelMat.dispose();
      outerFlangeGeom1.dispose();
      innerGeom.dispose();
      innerSteelMat.dispose();
      innerFlangeGeom1.dispose();
      shaftGeom.dispose();
      cageRingGeom.dispose();
      cageMat.dispose();
      cageSpacerGeom.dispose();
      ballMat.dispose();
      defectPointGeom.dispose();
      defectHighlightMat.dispose();
      sparkGeo.dispose();
      sparkMat.dispose();
      shadowGeo.dispose();
      shadowMat.dispose();
      gridHelper.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [seeThrough, theme, numBalls, ballDiameter, pitchDiameter, contactAngle]);

  const handleResetCamera = () => {
    cameraAngleRef.current = { theta: 0.6, phi: 1.0, radius: 7.5 };
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
          ROULEMENT 3D INTERACTIF
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
