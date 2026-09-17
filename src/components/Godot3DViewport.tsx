import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { 
  Box, 
  Eye, 
  RotateCw, 
  Maximize2, 
  Grid, 
  Sun, 
  Camera, 
  Layers, 
  Sparkles, 
  Play, 
  Pause, 
  RotateCcw, 
  Move, 
  Maximize, 
  Minimize, 
  Plus, 
  Trash2, 
  Settings,
  Compass,
  Sliders
} from 'lucide-react';
import { Entity3D, MeshGeometryType, Node3DType } from '../types';

interface Godot3DViewportProps {
  entities3D: Entity3D[];
  selectedEntityId: string | null;
  onSelectEntity: (id: string | null) => void;
  onUpdateEntity: (id: string, updates: Partial<Entity3D>) => void;
  onAddEntity3D: (type: Node3DType, geometry?: MeshGeometryType) => void;
  onDeleteEntity3D: (id: string) => void;
  isPlaying?: boolean;
}

export const Godot3DViewport: React.FC<Godot3DViewportProps> = ({
  entities3D,
  selectedEntityId,
  onSelectEntity,
  onUpdateEntity,
  onAddEntity3D,
  onDeleteEntity3D,
  isPlaying = false
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Viewport Settings
  const [viewMode, setViewMode] = useState<'perspective' | 'top' | 'front' | 'side'>('perspective');
  const [displayMode, setDisplayMode] = useState<'shaded' | 'wireframe' | 'unshaded'>('shaded');
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showLightGizmo, setShowLightGizmo] = useState<boolean>(true);
  const [activeGizmo, setActiveGizmo] = useState<'select' | 'move' | 'rotate' | 'scale'>('move');
  const [snapEnabled, setSnapEnabled] = useState<boolean>(true);
  const [snapStep, setSnapStep] = useState<number>(1.0);
  const [cameraSpeed, setCameraSpeed] = useState<number>(2.0);
  const [isSimulating, setIsSimulating] = useState<boolean>(isPlaying);

  // Three.js References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);
  const meshMapRef = useRef<Map<string, THREE.Mesh | THREE.Group>>(new Map());
  const animationFrameRef = useRef<number | null>(null);
  const sunLightRef = useRef<THREE.DirectionalLight | null>(null);

  // Orbit / Interaction state
  const isDraggingRef = useRef<boolean>(false);
  const dragButtonRef = useRef<number>(0);
  const prevMouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const cameraOrbitRef = useRef<{ theta: number; phi: number; radius: number; target: THREE.Vector3 }>({
    theta: Math.PI / 4,
    phi: Math.PI / 4,
    radius: 14,
    target: new THREE.Vector3(0, 1, 0)
  });

  // Transform Gizmo Dragging State
  const activeAxisRef = useRef<'x' | 'y' | 'z' | null>(null);
  const isTransformingRef = useRef<boolean>(false);
  const transformStartPosRef = useRef<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: 0 });
  const mouseStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Update camera position from spherical coordinates
  const updateCameraTransform = useCallback(() => {
    if (!cameraRef.current) return;
    const { theta, phi, radius, target } = cameraOrbitRef.current;
    
    if (viewMode === 'top') {
      cameraRef.current.position.set(target.x, target.y + radius, target.z + 0.001);
      cameraRef.current.lookAt(target);
    } else if (viewMode === 'front') {
      cameraRef.current.position.set(target.x, target.y, target.z + radius);
      cameraRef.current.lookAt(target);
    } else if (viewMode === 'side') {
      cameraRef.current.position.set(target.x + radius, target.y, target.z);
      cameraRef.current.lookAt(target);
    } else {
      // Perspective Orbit
      const x = target.x + radius * Math.sin(phi) * Math.sin(theta);
      const y = target.y + radius * Math.cos(phi);
      const z = target.z + radius * Math.sin(phi) * Math.cos(theta);
      cameraRef.current.position.set(x, y, z);
      cameraRef.current.lookAt(target);
    }
  }, [viewMode]);

  // Initialize Three.js Scene
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 500;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a202c); // Godot 3D horizon tone
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000);
    cameraRef.current = camera;
    updateCameraTransform();

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // 4. Lights (Godot default lighting environment)
    const ambientLight = new THREE.AmbientLight(0xdce7f5, 0.65);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0x599eff, 0x22262d, 0.4);
    scene.add(hemiLight);

    const sun = new THREE.DirectionalLight(0xfff5e6, 1.4);
    sun.position.set(12, 20, 10);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 1024;
    sun.shadow.mapSize.height = 1024;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 60;
    const d = 16;
    sun.shadow.camera.left = -d;
    sun.shadow.camera.right = d;
    sun.shadow.camera.top = d;
    sun.shadow.camera.bottom = -d;
    scene.add(sun);
    sunLightRef.current = sun;

    // 5. Godot-Style 3D Grid & Axis
    const grid = new THREE.GridHelper(40, 40, 0x478cbf, 0x334155);
    grid.position.y = 0;
    scene.add(grid);
    gridHelperRef.current = grid;

    const axesHelper = new THREE.AxesHelper(3);
    axesHelper.position.set(0, 0.01, 0);
    scene.add(axesHelper);

    // 6. Ground Shadow Receiver Plane
    const groundGeo = new THREE.PlaneGeometry(80, 80);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.85,
      metalness: 0.1
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.position.y = -0.01;
    scene.add(ground);

    // 7. Handle Resize with ResizeObserver
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0 && cameraRef.current && rendererRef.current) {
          cameraRef.current.aspect = w / h;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      renderer.dispose();
    };
  }, [updateCameraTransform]);

  // Sync Entities with Three.js scene graph
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Clear old meshes
    meshMapRef.current.forEach((mesh) => {
      scene.remove(mesh);
    });
    meshMapRef.current.clear();

    // Create geometries & materials for each 3D entity
    entities3D.forEach((ent) => {
      if (!ent.visible) return;

      let geo: THREE.BufferGeometry;
      const dims = ent.dimensions || { width: 1, height: 1, depth: 1 };

      switch (ent.geometry) {
        case 'sphere':
          geo = new THREE.SphereGeometry(dims.radius || dims.width / 2, 24, 24);
          break;
        case 'cylinder':
          geo = new THREE.CylinderGeometry(dims.width / 2, dims.width / 2, dims.height, 24);
          break;
        case 'capsule':
          geo = new THREE.CapsuleGeometry(dims.width / 2, dims.height - dims.width, 8, 16);
          break;
        case 'plane':
          geo = new THREE.PlaneGeometry(dims.width, dims.depth);
          break;
        case 'torus':
          geo = new THREE.TorusGeometry(dims.width / 2, (dims.width / 2) * 0.3, 16, 32);
          break;
        case 'box':
        default:
          geo = new THREE.BoxGeometry(dims.width, dims.height, dims.depth);
          break;
      }

      const isSelected = ent.id === selectedEntityId;
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(ent.material.color || '#38bdf8'),
        roughness: ent.material.roughness ?? 0.4,
        metalness: ent.material.metallic ?? 0.1,
        wireframe: displayMode === 'wireframe' || ent.material.wireframe,
        emissive: isSelected ? new THREE.Color(0x38bdf8) : (ent.material.emissive ? new THREE.Color(ent.material.emissive) : new THREE.Color(0x000000)),
        emissiveIntensity: isSelected ? 0.25 : 0.0
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(ent.position.x, ent.position.y, ent.position.z);
      mesh.rotation.set(
        THREE.MathUtils.degToRad(ent.rotation.x),
        THREE.MathUtils.degToRad(ent.rotation.y),
        THREE.MathUtils.degToRad(ent.rotation.z)
      );
      mesh.scale.set(ent.scale.x, ent.scale.y, ent.scale.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { id: ent.id };

      // Selection outline bounding box
      if (isSelected) {
        const boxHelper = new THREE.BoxHelper(mesh, 0x42b0ff); // Godot selection blue
        mesh.add(boxHelper);
      }

      scene.add(mesh);
      meshMapRef.current.set(ent.id, mesh);
    });
  }, [entities3D, selectedEntityId, displayMode]);

  // Main Render & Simulation Loop
  useEffect(() => {
    let lastTime = performance.now();
    const physicsState = new Map<string, { vy: number; y: number }>();

    // Initialize physics state for rigidbodies and character bodies
    entities3D.forEach(ent => {
      if (ent.nodeType === 'RigidBody3D' || ent.nodeType === 'CharacterBody3D') {
        physicsState.set(ent.id, {
          vy: ent.velocity?.y || 0,
          y: ent.position.y
        });
      }
    });

    const animate = () => {
      const now = performance.now();
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Real 3D physics simulation step directly on Three.js meshes
      if (isSimulating) {
        entities3D.forEach((ent) => {
          if (ent.nodeType === 'RigidBody3D' || ent.nodeType === 'CharacterBody3D') {
            const mesh = meshMapRef.current.get(ent.id);
            if (!mesh) return;

            let cur = physicsState.get(ent.id) || { vy: 0, y: mesh.position.y };
            cur.vy -= 9.8 * delta;
            cur.y += cur.vy * delta;

            const groundLimit = (ent.dimensions?.height || 1) / 2;
            if (cur.y <= groundLimit) {
              cur.y = groundLimit;
              cur.vy = Math.abs(cur.vy) * 0.45; // restitution bounce
            }

            physicsState.set(ent.id, cur);
            mesh.position.y = cur.y;
          }
        });
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isSimulating, entities3D]);

  // Mouse Orbit & Panning Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    dragButtonRef.current = e.button;
    prevMouseRef.current = { x: e.clientX, y: e.clientY };

    // Left click Raycasting to select 3D entity
    if (e.button === 0 && canvasRef.current && cameraRef.current && sceneRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, cameraRef.current);

      const meshes: THREE.Mesh[] = [];
      meshMapRef.current.forEach(mesh => {
        if (mesh instanceof THREE.Mesh) meshes.push(mesh);
      });

      const intersects = raycaster.intersectObjects(meshes, false);
      if (intersects.length > 0) {
        const hitMesh = intersects[0].object;
        const hitId = hitMesh.userData?.id;
        if (hitId) {
          onSelectEntity(hitId);
        }
      } else {
        // Clicked void
        onSelectEntity(null);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;

    const dx = e.clientX - prevMouseRef.current.x;
    const dy = e.clientY - prevMouseRef.current.y;
    prevMouseRef.current = { x: e.clientX, y: e.clientY };

    // Right click: Orbit camera
    if (dragButtonRef.current === 2 || (dragButtonRef.current === 0 && e.altKey)) {
      cameraOrbitRef.current.theta -= dx * 0.008 * cameraSpeed;
      cameraOrbitRef.current.phi = Math.max(
        0.05,
        Math.min(Math.PI - 0.05, cameraOrbitRef.current.phi - dy * 0.008 * cameraSpeed)
      );
      updateCameraTransform();
    } 
    // Middle click: Pan camera target
    else if (dragButtonRef.current === 1 || (dragButtonRef.current === 0 && e.shiftKey)) {
      if (!cameraRef.current) return;
      const forward = new THREE.Vector3();
      cameraRef.current.getWorldDirection(forward);
      const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
      const up = new THREE.Vector3().crossVectors(right, forward).normalize();

      cameraOrbitRef.current.target.addScaledVector(right, -dx * 0.02);
      cameraOrbitRef.current.target.addScaledVector(up, dy * 0.02);
      updateCameraTransform();
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    isTransformingRef.current = false;
    activeAxisRef.current = null;
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    cameraOrbitRef.current.radius = Math.max(
      2,
      Math.min(60, cameraOrbitRef.current.radius + (e.deltaY > 0 ? 1.5 : -1.5))
    );
    updateCameraTransform();
  };

  // Selected Entity Shortcut for Gizmo Controls
  const selectedEntity = entities3D.find(e => e.id === selectedEntityId) || null;

  const handleTranslateAxis = (axis: 'x' | 'y' | 'z', delta: number) => {
    if (!selectedEntity) return;
    const current = selectedEntity.position[axis];
    const updated = snapEnabled 
      ? Math.round((current + delta) / snapStep) * snapStep 
      : current + delta;

    onUpdateEntity(selectedEntity.id, {
      position: {
        ...selectedEntity.position,
        [axis]: Number(updated.toFixed(2))
      }
    });
  };

  const handleRotateAxis = (axis: 'x' | 'y' | 'z', deltaDeg: number) => {
    if (!selectedEntity) return;
    const current = selectedEntity.rotation[axis];
    onUpdateEntity(selectedEntity.id, {
      rotation: {
        ...selectedEntity.rotation,
        [axis]: (current + deltaDeg) % 360
      }
    });
  };

  const handleScaleUniform = (delta: number) => {
    if (!selectedEntity) return;
    const s = Math.max(0.1, Number((selectedEntity.scale.x + delta).toFixed(2)));
    onUpdateEntity(selectedEntity.id, {
      scale: { x: s, y: s, z: s }
    });
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full bg-slate-950 select-none overflow-hidden flex flex-col font-mono"
      onContextMenu={e => e.preventDefault()}
    >
      {/* Top Godot 3D Viewport Toolbar */}
      <div className="h-9 bg-[#202531] border-b border-[#2e3748] px-3 flex items-center justify-between text-xs text-slate-300 z-10 shrink-0">
        {/* Left Controls: View Mode & Transform Gizmo Mode */}
        <div className="flex items-center gap-2">
          {/* View Mode Selector */}
          <div className="flex items-center bg-[#151922] rounded border border-[#2e3748] overflow-hidden text-[11px]">
            <button
              onClick={() => { setViewMode('perspective'); updateCameraTransform(); }}
              className={`px-2 py-1 font-semibold transition-colors ${
                viewMode === 'perspective' ? 'bg-[#478cbf] text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Perspective
            </button>
            <button
              onClick={() => { setViewMode('top'); updateCameraTransform(); }}
              className={`px-2 py-1 font-semibold transition-colors ${
                viewMode === 'top' ? 'bg-[#478cbf] text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Top [Y]
            </button>
            <button
              onClick={() => { setViewMode('front'); updateCameraTransform(); }}
              className={`px-2 py-1 font-semibold transition-colors ${
                viewMode === 'front' ? 'bg-[#478cbf] text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Front [Z]
            </button>
            <button
              onClick={() => { setViewMode('side'); updateCameraTransform(); }}
              className={`px-2 py-1 font-semibold transition-colors ${
                viewMode === 'side' ? 'bg-[#478cbf] text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Side [X]
            </button>
          </div>

          {/* Shading Mode */}
          <select
            value={displayMode}
            onChange={(e) => setDisplayMode(e.target.value as any)}
            className="bg-[#151922] border border-[#2e3748] text-slate-300 text-[11px] px-2 py-1 rounded cursor-pointer"
          >
            <option value="shaded">Shaded (PBR)</option>
            <option value="wireframe">Wireframe</option>
            <option value="unshaded">Unshaded</option>
          </select>

          {/* Grid Toggle */}
          <button
            onClick={() => {
              setShowGrid(!showGrid);
              if (gridHelperRef.current) gridHelperRef.current.visible = !showGrid;
            }}
            className={`p-1.5 rounded text-xs flex items-center gap-1 cursor-pointer transition-colors ${
              showGrid ? 'bg-[#478cbf]/20 text-[#599eff] border border-[#478cbf]/40' : 'text-slate-400 hover:text-white'
            }`}
            title="Toggle 3D Grid"
          >
            <Grid className="w-3.5 h-3.5" />
            <span className="text-[11px]">Grid</span>
          </button>

          {/* Snap toggle */}
          <button
            onClick={() => setSnapEnabled(!snapEnabled)}
            className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-colors ${
              snapEnabled ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40' : 'text-slate-400 hover:text-white'
            }`}
            title="Snap to 3D Grid"
          >
            <span>Snap: {snapStep}m</span>
          </button>
        </div>

        {/* Center Controls: Live Simulation Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSimulating(!isSimulating)}
            className={`px-3 py-1 rounded font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer ${
              isSimulating 
                ? 'bg-amber-600 text-white animate-pulse' 
                : 'bg-[#478cbf] hover:bg-[#599eff] text-white'
            }`}
          >
            {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isSimulating ? 'Pause 3D Sim' : 'Simulate 3D'}</span>
          </button>

          <button
            onClick={() => {
              // Reset 3D physics state
              entities3D.forEach(ent => {
                onUpdateEntity(ent.id, {
                  position: { x: ent.position.x, y: Math.max(1, ent.position.y), z: ent.position.z },
                  velocity: { x: 0, y: 0, z: 0 }
                });
              });
              setIsSimulating(false);
            }}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
            title="Reset 3D Transforms"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right Controls: Quick 3D Node Add Bar */}
        <div className="flex items-center gap-1.5">
          <div className="text-[11px] text-slate-400 mr-1">Add 3D:</div>
          <button
            onClick={() => onAddEntity3D('MeshInstance3D', 'box')}
            className="px-2 py-1 rounded bg-[#2a3242] hover:bg-[#363f54] text-sky-400 text-[11px] font-semibold flex items-center gap-1 cursor-pointer border border-[#3b475e]"
            title="Add 3D Box"
          >
            <Plus className="w-3 h-3" />
            <span>Cube</span>
          </button>
          <button
            onClick={() => onAddEntity3D('MeshInstance3D', 'sphere')}
            className="px-2 py-1 rounded bg-[#2a3242] hover:bg-[#363f54] text-emerald-400 text-[11px] font-semibold flex items-center gap-1 cursor-pointer border border-[#3b475e]"
            title="Add 3D Sphere"
          >
            <Plus className="w-3 h-3" />
            <span>Sphere</span>
          </button>
          <button
            onClick={() => onAddEntity3D('MeshInstance3D', 'cylinder')}
            className="px-2 py-1 rounded bg-[#2a3242] hover:bg-[#363f54] text-purple-400 text-[11px] font-semibold flex items-center gap-1 cursor-pointer border border-[#3b475e]"
            title="Add 3D Cylinder"
          >
            <Plus className="w-3 h-3" />
            <span>Cylinder</span>
          </button>
          <button
            onClick={() => onAddEntity3D('CharacterBody3D', 'capsule')}
            className="px-2 py-1 rounded bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 text-[11px] font-semibold flex items-center gap-1 cursor-pointer border border-amber-500/40"
            title="Add 3D CharacterBody (Physics Player)"
          >
            <Plus className="w-3 h-3" />
            <span>Character3D</span>
          </button>
        </div>
      </div>

      {/* Main 3D Canvas Viewport */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
          className="w-full h-full cursor-crosshair block outline-none"
        />

        {/* Godot 3D Navigation Hint Pill */}
        <div className="absolute top-3 left-3 bg-[#151922]/90 backdrop-blur border border-[#2e3748] rounded px-2.5 py-1 text-[11px] text-slate-400 pointer-events-none flex items-center gap-3 shadow-lg">
          <div className="flex items-center gap-1">
            <span className="text-[#599eff] font-bold">RMB:</span> Orbit 3D
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[#599eff] font-bold">MMB:</span> Pan
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[#599eff] font-bold">Wheel:</span> Zoom
          </div>
          <div className="flex items-center gap-1">
            <span className="text-emerald-400 font-bold">LMB:</span> Select Node
          </div>
        </div>

        {/* Selected Entity 3D Floating Transform Gizmo HUD */}
        {selectedEntity && (
          <div className="absolute bottom-4 left-4 bg-[#151922]/95 backdrop-blur border border-[#478cbf]/40 rounded-lg p-3 shadow-2xl text-xs space-y-2.5 max-w-sm">
            <div className="flex items-center justify-between border-b border-[#2e3748] pb-1.5">
              <div className="flex items-center gap-2">
                <Box className="w-4 h-4 text-[#599eff]" />
                <span className="font-bold text-white font-sans">{selectedEntity.name}</span>
                <span className="text-[10px] text-slate-400 font-mono">[{selectedEntity.nodeType}]</span>
              </div>
              <button
                onClick={() => onDeleteEntity3D(selectedEntity.id)}
                className="text-red-400 hover:text-red-300 p-1"
                title="Delete 3D Node"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Position 3D Controls */}
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Position (X, Y, Z)</div>
              <div className="grid grid-cols-3 gap-1.5">
                <div className="flex items-center bg-[#202531] rounded border border-red-500/40 px-1.5 py-0.5">
                  <span className="text-red-400 font-bold text-[10px] mr-1">X</span>
                  <input
                    type="number"
                    step="0.5"
                    value={selectedEntity.position.x}
                    onChange={e => onUpdateEntity(selectedEntity.id, {
                      position: { ...selectedEntity.position, x: parseFloat(e.target.value) || 0 }
                    })}
                    className="w-full bg-transparent text-white font-mono text-[11px] outline-none"
                  />
                  <div className="flex flex-col gap-0.5 ml-1">
                    <button onClick={() => handleTranslateAxis('x', 0.5)} className="text-[9px] hover:text-white">▲</button>
                    <button onClick={() => handleTranslateAxis('x', -0.5)} className="text-[9px] hover:text-white">▼</button>
                  </div>
                </div>

                <div className="flex items-center bg-[#202531] rounded border border-emerald-500/40 px-1.5 py-0.5">
                  <span className="text-emerald-400 font-bold text-[10px] mr-1">Y</span>
                  <input
                    type="number"
                    step="0.5"
                    value={selectedEntity.position.y}
                    onChange={e => onUpdateEntity(selectedEntity.id, {
                      position: { ...selectedEntity.position, y: parseFloat(e.target.value) || 0 }
                    })}
                    className="w-full bg-transparent text-white font-mono text-[11px] outline-none"
                  />
                  <div className="flex flex-col gap-0.5 ml-1">
                    <button onClick={() => handleTranslateAxis('y', 0.5)} className="text-[9px] hover:text-white">▲</button>
                    <button onClick={() => handleTranslateAxis('y', -0.5)} className="text-[9px] hover:text-white">▼</button>
                  </div>
                </div>

                <div className="flex items-center bg-[#202531] rounded border border-blue-500/40 px-1.5 py-0.5">
                  <span className="text-blue-400 font-bold text-[10px] mr-1">Z</span>
                  <input
                    type="number"
                    step="0.5"
                    value={selectedEntity.position.z}
                    onChange={e => onUpdateEntity(selectedEntity.id, {
                      position: { ...selectedEntity.position, z: parseFloat(e.target.value) || 0 }
                    })}
                    className="w-full bg-transparent text-white font-mono text-[11px] outline-none"
                  />
                  <div className="flex flex-col gap-0.5 ml-1">
                    <button onClick={() => handleTranslateAxis('z', 0.5)} className="text-[9px] hover:text-white">▲</button>
                    <button onClick={() => handleTranslateAxis('z', -0.5)} className="text-[9px] hover:text-white">▼</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick 3D Material / Color & Scale */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400">Color:</span>
                <input
                  type="color"
                  value={selectedEntity.material.color}
                  onChange={e => onUpdateEntity(selectedEntity.id, {
                    material: { ...selectedEntity.material, color: e.target.value }
                  })}
                  className="w-5 h-5 rounded cursor-pointer border border-[#3b475e] bg-transparent"
                />
              </div>

              <div className="flex items-center gap-1">
                <span className="text-[10px] text-slate-400">Scale:</span>
                <button
                  onClick={() => handleScaleUniform(0.2)}
                  className="px-1.5 py-0.5 rounded bg-[#202531] hover:bg-[#2e3748] text-white text-[10px]"
                >
                  +
                </button>
                <span className="font-mono text-[10px] text-[#599eff]">{selectedEntity.scale.x.toFixed(1)}x</span>
                <button
                  onClick={() => handleScaleUniform(-0.2)}
                  className="px-1.5 py-0.5 rounded bg-[#202531] hover:bg-[#2e3748] text-white text-[10px]"
                >
                  -
                </button>
              </div>

              <div className="flex items-center gap-1">
                <span className="text-[10px] text-slate-400">Rot Y:</span>
                <button
                  onClick={() => handleRotateAxis('y', 15)}
                  className="px-1.5 py-0.5 rounded bg-[#202531] hover:bg-[#2e3748] text-amber-300 text-[10px] flex items-center"
                >
                  <RotateCw className="w-2.5 h-2.5 mr-0.5" /> 15°
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
