import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Save, 
  Share2, 
  Layers, 
  Plus, 
  Trash2, 
  Copy, 
  Sliders, 
  Eye, 
  EyeOff, 
  Grid, 
  Sparkles, 
  Code2, 
  Volume2, 
  VolumeX, 
  Paintbrush, 
  Cpu, 
  Compass, 
  FolderTree, 
  Terminal, 
  FileCode, 
  Download, 
  Check, 
  Maximize2, 
  Minimize2, 
  X, 
  Move, 
  Box, 
  Flame, 
  Video, 
  ShieldAlert, 
  ChevronRight, 
  ChevronDown, 
  Coffee, 
  Monitor, 
  Smartphone, 
  FileText, 
  Settings, 
  Wrench, 
  HelpCircle,
  Zap,
  MousePointer,
  Square,
  CornerDownRight,
  Activity,
  Maximize,
  RotateCw,
  Search,
  ExternalLink,
  Lock,
  Unlock,
  Radio,
  Clock,
  Film,
  FolderArchive,
  Package
} from 'lucide-react';
import { 
  GameProject, 
  GameEntity, 
  EntityType, 
  BodyType, 
  Entity3D, 
  Node3DType, 
  MeshGeometryType, 
  AnimationClip, 
  GodotSignal, 
  GodotAudioBus 
} from '../types';
import { soundManager } from '../utils/audioSynth';
import { GameEngine, DebugLogEntry } from '../utils/gameEngine';
import { 
  validateJavaCode, 
  generateWindowsJavaGame, 
  generateAndroidJavaGame, 
  generateWindowsBatchScript, 
  generateGradleBuild, 
  generateMavenPom, 
  generateExePackagingGuide 
} from '../utils/javaRunner';
import { TilemapEditor } from './TilemapEditor';
import { PixelArtEditor } from './PixelArtEditor';
import { AudioManager } from './AudioManager';
import { ParticleFXEditor } from './ParticleFXEditor';
import { CameraShaderEditor } from './CameraShaderEditor';
import { EngineProfilerPanel } from './EngineProfilerPanel';
import { CodeEditorView } from './CodeEditorView';
import { VisualLogicEditor } from './VisualLogicEditor';
import { DayOneGuideModal } from './DayOneGuideModal';
import { Godot3DViewport } from './Godot3DViewport';
import { GodotAnimationPlayer } from './GodotAnimationPlayer';
import { GodotAudioBusLayout } from './GodotAudioBusLayout';
import { GodotCreateNodeModal, GodotNodeOption } from './GodotCreateNodeModal';
import { EngineStartupAnimation } from './EngineStartupAnimation';
import { EngineInteractiveGuide } from './EngineInteractiveGuide';
import { AudioAssetsLibrary } from './AudioAssetsLibrary';
import { WindowsSetupWizardModal } from './WindowsSetupWizardModal';

interface DesktopEngineViewProps {
  project: GameProject;
  onUpdateProject: (updater: (prev: GameProject) => GameProject) => void;
  onPlayTest: () => void;
  onBack: () => void;
  onOpenAI: (context?: string) => void;
  onOpenExport: () => void;
  onOpenPublish: () => void;
}

export type GodotWorkspace = '2D' | '3D' | 'Script' | 'AssetLib';
type CenterTab2D = 'scene' | 'viewport' | 'tilemap' | 'art' | 'audio' | 'particles' | 'camera' | 'profiler' | 'logic';
type BottomTab = 'output' | 'debugger' | 'animation' | 'audio' | 'shader' | 'terminal';
type LeftTab = 'scene' | 'filesystem';
type RightTab = 'inspector' | 'node' | 'history';
type GizmoMode = 'select' | 'move' | 'rotate' | 'scale';

const DEFAULT_3D_ENTITIES: Entity3D[] = [
  {
    id: 'node-3d-ground',
    name: 'GroundPlane3D',
    nodeType: 'StaticBody3D',
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    geometry: 'plane',
    dimensions: { width: 30, height: 1, depth: 30 },
    material: { color: '#1e293b', roughness: 0.85, metallic: 0.1 },
    visible: true
  },
  {
    id: 'node-3d-player',
    name: 'CharacterHero3D',
    nodeType: 'CharacterBody3D',
    position: { x: 0, y: 1.5, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    geometry: 'capsule',
    dimensions: { width: 1, height: 2, depth: 1 },
    material: { color: '#38bdf8', roughness: 0.3, metallic: 0.2 },
    mass: 70,
    velocity: { x: 0, y: 0, z: 0 },
    visible: true
  },
  {
    id: 'node-3d-chest',
    name: 'TreasureChest3D',
    nodeType: 'RigidBody3D',
    position: { x: 3, y: 1, z: -2 },
    rotation: { x: 0, y: 35, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    geometry: 'box',
    dimensions: { width: 1.5, height: 1.2, depth: 1.2 },
    material: { color: '#f59e0b', roughness: 0.2, metallic: 0.8 },
    mass: 25,
    visible: true
  },
  {
    id: 'node-3d-orb',
    name: 'MagicOrb3D',
    nodeType: 'MeshInstance3D',
    position: { x: -3, y: 2, z: 2 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    geometry: 'sphere',
    dimensions: { width: 1.2, height: 1.2, depth: 1.2, radius: 0.6 },
    material: { color: '#a855f7', roughness: 0.1, metallic: 0.5, emissive: '#7e22ce' },
    visible: true
  },
  {
    id: 'node-3d-pillar',
    name: 'StonePillar3D',
    nodeType: 'StaticBody3D',
    position: { x: -5, y: 3, z: -4 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    geometry: 'cylinder',
    dimensions: { width: 1.4, height: 6, depth: 1.4 },
    material: { color: '#64748b', roughness: 0.7, metallic: 0.1 },
    visible: true
  }
];

export const DesktopEngineView: React.FC<DesktopEngineViewProps> = ({
  project,
  onUpdateProject,
  onPlayTest,
  onBack,
  onOpenAI,
  onOpenExport,
  onOpenPublish
}) => {
  // 1. Godot Main Workspaces (2D, 3D, Script, AssetLib)
  const [workspace, setWorkspace] = useState<GodotWorkspace>('2D');
  const [renderer, setRenderer] = useState<'Forward+' | 'Mobile' | 'Compatibility'>('Forward+');

  // Center 2D Sub-tabs
  const [centerTab2D, setCenterTab2D] = useState<CenterTab2D>('scene');
  const [leftTab, setLeftTab] = useState<LeftTab>('scene');
  const [rightTab, setRightTab] = useState<RightTab>('inspector');
  const [bottomTab, setBottomTab] = useState<BottomTab>('output');

  // Panel Dock Toggles
  const [showLeftDock, setShowLeftDock] = useState<boolean>(true);
  const [showRightDock, setShowRightDock] = useState<boolean>(true);
  const [showBottomDock, setShowBottomDock] = useState<boolean>(true);

  // 2D & 3D Selection State
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(
    project.entities.find(e => e.type === 'player')?.id || project.entities[0]?.id || null
  );
  const [selectedEntity3DId, setSelectedEntity3DId] = useState<string | null>('node-3d-player');

  // 3D Entities state
  const entities3D = project.entities3D && project.entities3D.length > 0 
    ? project.entities3D 
    : DEFAULT_3D_ENTITIES;

  // Viewport Settings & Gizmos
  const [gizmoMode, setGizmoMode] = useState<GizmoMode>('move');
  const [gridSnap, setGridSnap] = useState<number>(16);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showCameraBounds, setShowCameraBounds] = useState<boolean>(true);
  const [hierarchyFilter, setHierarchyFilter] = useState<string>('');

  // Modals & Guided Experience
  const [showStartupAnimation, setShowStartupAnimation] = useState<boolean>(() => {
    try {
      return !sessionStorage.getItem('gamedev_engine_boot_seen');
    } catch {
      return true;
    }
  });
  const [isInteractiveGuideOpen, setIsInteractiveGuideOpen] = useState<boolean>(false);
  const [isAudioAssetsModalOpen, setIsAudioAssetsModalOpen] = useState<boolean>(false);
  const [isWindowsSetupWizardOpen, setIsWindowsSetupWizardOpen] = useState<boolean>(false);
  const [isCreateNodeModalOpen, setIsCreateNodeModalOpen] = useState<boolean>(false);
  const [isDayOneGuideOpen, setIsDayOneGuideOpen] = useState<boolean>(false);
  const [showAboutModal, setShowAboutModal] = useState<boolean>(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState<boolean>(false);
  const [activeMenu, setActiveMenu] = useState<'file' | 'edit' | 'scene' | 'build' | 'view' | 'help' | null>(null);

  // 2D In-Viewport Live Game Simulation
  const viewportCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineInstanceRef = useRef<GameEngine | null>(null);
  const [isViewportRunning, setIsViewportRunning] = useState<boolean>(false);
  const [isViewportPaused, setIsViewportPaused] = useState<boolean>(false);
  const [viewportFps, setViewportFps] = useState<number>(60);
  const [viewportScore, setViewportScore] = useState<number>(0);
  const [viewportLives, setViewportLives] = useState<number>(project.settings.lives || 3);

  // Godot Engine Output Logs
  const [godotLogs, setGodotLogs] = useState<Array<{ time: string; type: 'info' | 'warn' | 'error' | 'success'; text: string }>>([
    { time: '12:00:01', type: 'info', text: 'Godot Engine v4.3.stable.official.227755 - https://godotengine.org' },
    { time: '12:00:02', type: 'success', text: `Vulkan API 1.3.275 - Forward+ renderer initialized with hardware acceleration.` },
    { time: '12:00:02', type: 'info', text: `Loaded main scene "res://scenes/${project.name}.tscn" (2D/3D dual pipeline ready).` }
  ]);
  const [cliInput, setCliInput] = useState<string>('');
  const [cliHistory, setCliHistory] = useState<string[]>([
    'Godot 4.3 Engine Command Line Terminal. Type "help", "tree", "build", or "clear".'
  ]);

  // Undo / Redo History Stack
  const [historyStack, setHistoryStack] = useState<Array<{ desc: string; time: string }>>([
    { desc: 'Scene loaded from disk', time: '12:00:01' },
    { desc: 'Initialized CharacterBody2D transform', time: '12:00:02' }
  ]);

  // Selected Entities
  const selectedEntity2D = project.entities.find(e => e.id === selectedEntityId) || null;
  const selectedEntity3D = entities3D.find(e => e.id === selectedEntity3DId) || null;

  // 2D Editor Canvas Dragging
  const editorCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDraggingEntity, setIsDraggingEntity] = useState<boolean>(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const addLog = (type: 'info' | 'warn' | 'error' | 'success', text: string) => {
    const time = new Date().toLocaleTimeString();
    setGodotLogs(prev => [...prev.slice(-150), { time, type, text }]);
  };

  const pushHistory = (desc: string) => {
    const time = new Date().toLocaleTimeString();
    setHistoryStack(prev => [...prev.slice(-30), { desc, time }]);
  };

  // Keyboard Shortcuts (F5 Run Project, F6 Run Scene, F7 Pause, F8 Stop, Ctrl+S Save)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'F5') {
        e.preventDefault();
        handleRunViewport();
      } else if (e.key === 'F6') {
        e.preventDefault();
        handleRunViewport();
      } else if (e.key === 'F7') {
        e.preventDefault();
        handlePauseViewport();
      } else if (e.key === 'F8' || e.key === 'Escape') {
        if (isViewportRunning) {
          e.preventDefault();
          handleStopViewport();
        }
        setActiveMenu(null);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveProject();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setIsCreateNodeModalOpen(true);
      } else if (e.key.toLowerCase() === 'q') {
        setGizmoMode('select');
      } else if (e.key.toLowerCase() === 'w') {
        setGizmoMode('move');
      } else if (e.key.toLowerCase() === 'e') {
        setGizmoMode('rotate');
      } else if (e.key.toLowerCase() === 'r') {
        setGizmoMode('scale');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isViewportRunning, selectedEntityId, selectedEntity3DId]);

  // Click outside to close menus
  useEffect(() => {
    const handleClickOutside = () => setActiveMenu(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // -------------------------------------------------------------
  // 2D Live Simulation
  // -------------------------------------------------------------
  const handleRunViewport = () => {
    setWorkspace('2D');
    setCenterTab2D('viewport');
    setIsViewportRunning(true);
    setIsViewportPaused(false);
    addLog('info', `[Run] Starting 60FPS Godot scene simulation: "${project.name}"...`);

    setTimeout(() => {
      if (viewportCanvasRef.current) {
        if (engineInstanceRef.current) {
          engineInstanceRef.current.stop();
        }

        const engine = new GameEngine(viewportCanvasRef.current, project, {
          onScoreChange: (s) => setViewportScore(s),
          onLivesChange: (l) => setViewportLives(l),
          onGameOver: () => addLog('warn', '[Game] Player lives depleted! (tree_exited)'),
          onVictory: () => addLog('success', '[Game] Victory conditions reached! (scene_finished)'),
          onDebugLog: (log: DebugLogEntry) => {
            if (log.type === 'damage' || log.type === 'warning') {
              addLog('warn', `[Physics2D] ${log.message}`);
            }
          }
        });

        engineInstanceRef.current = engine;
        engine.start();
        addLog('success', '[Run] Native Godot 2D Physics & Canvas pipeline running.');
      }
    }, 60);
  };

  const handlePauseViewport = () => {
    if (engineInstanceRef.current) {
      if (isViewportPaused) {
        engineInstanceRef.current.start();
        setIsViewportPaused(false);
        addLog('info', '[Run] Scene unpaused.');
      } else {
        engineInstanceRef.current.stop();
        setIsViewportPaused(true);
        addLog('info', '[Run] Scene paused.');
      }
    }
  };

  const handleStopViewport = () => {
    if (engineInstanceRef.current) {
      engineInstanceRef.current.stop();
      engineInstanceRef.current = null;
    }
    setIsViewportRunning(false);
    setIsViewportPaused(false);
    addLog('info', '[Run] Scene playback stopped. Restored editor state.');
  };

  // -------------------------------------------------------------
  // 2D Canvas Editor Render
  // -------------------------------------------------------------
  useEffect(() => {
    if (workspace !== '2D' || centerTab2D !== 'scene' || !editorCanvasRef.current) return;

    const canvas = editorCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = project.settings.canvasWidth || 640;
    const height = project.settings.canvasHeight || 360;
    canvas.width = width;
    canvas.height = height;

    // Background
    ctx.fillStyle = project.settings.backgroundColor || '#151922';
    ctx.fillRect(0, 0, width, height);

    // 2D Grid
    if (showGrid && gridSnap > 0) {
      ctx.strokeStyle = '#202531';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x < width; x += gridSnap) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = 0; y < height; y += gridSnap) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // Godot origin lines (Red X, Green Y)
      ctx.strokeStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(0, height - 1);
      ctx.lineTo(width, height - 1);
      ctx.stroke();

      ctx.strokeStyle = '#22c55e';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, height);
      ctx.stroke();
    }

    // Tilemap layer
    if (project.tilemap?.tiles) {
      const tileSize = project.tilemap.tileSize || 32;
      project.tilemap.tiles.forEach(tile => {
        ctx.fillStyle = tile.color || '#475569';
        ctx.fillRect(tile.x * tileSize, tile.y * tileSize, tileSize, tileSize);
        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.strokeRect(tile.x * tileSize, tile.y * tileSize, tileSize, tileSize);
      });
    }

    // Entities
    project.entities.forEach(ent => {
      if (ent.visible === false) return;

      const isSelected = ent.id === selectedEntityId;
      ctx.save();

      if (ent.rotation) {
        ctx.translate(ent.x + ent.width / 2, ent.y + ent.height / 2);
        ctx.rotate((ent.rotation * Math.PI) / 180);
        ctx.translate(-(ent.x + ent.width / 2), -(ent.y + ent.height / 2));
      }

      ctx.fillStyle = ent.color || '#38bdf8';
      ctx.fillRect(ent.x, ent.y, ent.width, ent.height);

      // Node label
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px monospace';
      ctx.fillText(ent.name, ent.x, ent.y - 4);

      // Godot Selection Box
      if (isSelected) {
        ctx.strokeStyle = '#599eff'; // Godot selection cyan
        ctx.lineWidth = 1.5;
        ctx.strokeRect(ent.x - 2, ent.y - 2, ent.width + 4, ent.height + 4);

        // Corner gizmo handles
        const handles = [
          { x: ent.x - 4, y: ent.y - 4 },
          { x: ent.x + ent.width, y: ent.y - 4 },
          { x: ent.x - 4, y: ent.y + ent.height },
          { x: ent.x + ent.width, y: ent.y + ent.height }
        ];
        ctx.fillStyle = '#ffffff';
        handles.forEach(h => ctx.fillRect(h.x, h.y, 4, 4));
      }

      ctx.restore();
    });
  }, [workspace, centerTab2D, project, selectedEntityId, showGrid, gridSnap]);

  // -------------------------------------------------------------
  // Node Creation Handler (from GodotCreateNodeModal)
  // -------------------------------------------------------------
  const handleNodeCreated = (nodeOption: GodotNodeOption) => {
    if (nodeOption.is3D) {
      // Create 3D Node
      const newEntity3D: Entity3D = {
        id: `node-3d-${Date.now()}`,
        name: `${nodeOption.name}_${entities3D.length + 1}`,
        nodeType: nodeOption.defaultType3D || 'MeshInstance3D',
        position: { x: 0, y: 1, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        geometry: nodeOption.defaultType3D === 'CharacterBody3D' ? 'capsule' : 'box',
        dimensions: { width: 1.5, height: 1.5, depth: 1.5 },
        material: { color: '#38bdf8', roughness: 0.4, metallic: 0.2 },
        visible: true
      };

      const updated = [...entities3D, newEntity3D];
      onUpdateProject(prev => ({ ...prev, entities3D: updated }));
      setSelectedEntity3DId(newEntity3D.id);
      setWorkspace('3D');
      addLog('success', `[Scene] Created 3D node "${newEntity3D.name}" of type <${newEntity3D.nodeType}>.`);
      pushHistory(`Created 3D node ${newEntity3D.name}`);
    } else {
      // Create 2D Node
      const type: EntityType = nodeOption.defaultType2D || 'platform';
      const newEntity: GameEntity = {
        id: `node-2d-${Date.now()}`,
        name: `${nodeOption.name}_${project.entities.length + 1}`,
        type,
        x: 60,
        y: 100,
        width: type === 'platform' ? 96 : 32,
        height: type === 'platform' ? 16 : 32,
        color: type === 'player' ? '#38bdf8' : type === 'coin' ? '#fbbf24' : '#64748b',
        speed: 4,
        jumpPower: 10,
        health: 3,
        maxHealth: 3,
        gravity: type === 'player',
        solid: true,
        tag: type,
        visible: true
      };

      onUpdateProject(prev => ({
        ...prev,
        entities: [...prev.entities, newEntity]
      }));
      setSelectedEntityId(newEntity.id);
      setWorkspace('2D');
      setCenterTab2D('scene');
      addLog('success', `[Scene] Created 2D node "${newEntity.name}" of type <${nodeOption.name}>.`);
      pushHistory(`Created 2D node ${newEntity.name}`);
    }
  };

  // -------------------------------------------------------------
  // 3D Viewport Entity Management Handlers
  // -------------------------------------------------------------
  const handleUpdateEntity3D = (id: string, updates: Partial<Entity3D>) => {
    const updated = entities3D.map(e => e.id === id ? { ...e, ...updates } : e);
    onUpdateProject(prev => ({ ...prev, entities3D: updated }));
  };

  const handleAddEntity3DDirect = (type: Node3DType, geometry: MeshGeometryType = 'box') => {
    const newEnt: Entity3D = {
      id: `node-3d-${Date.now()}`,
      name: `${type}_${entities3D.length + 1}`,
      nodeType: type,
      position: { x: 0, y: 1.5, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      geometry,
      dimensions: { width: 1.5, height: 1.5, depth: 1.5 },
      material: { color: '#38bdf8', roughness: 0.4, metallic: 0.2 },
      visible: true
    };
    onUpdateProject(prev => ({ ...prev, entities3D: [...entities3D, newEnt] }));
    setSelectedEntity3DId(newEnt.id);
    addLog('success', `[Scene] Added 3D mesh "${newEnt.name}".`);
  };

  const handleDeleteEntity3D = (id: string) => {
    const updated = entities3D.filter(e => e.id !== id);
    onUpdateProject(prev => ({ ...prev, entities3D: updated }));
    setSelectedEntity3DId(updated[0]?.id || null);
    addLog('info', `[Scene] Deleted 3D node ${id}.`);
  };

  // Save Project Handler
  const handleSaveProject = () => {
    onUpdateProject(prev => ({ ...prev, lastModified: Date.now() }));
    addLog('success', `[Project] Saved scene "res://scenes/${project.name}.tscn" to disk.`);
    pushHistory('Saved scene');
    soundManager.playCoin();
  };

  return (
    <div id="godot-engine-root" className="w-full h-screen bg-[#141720] text-slate-200 flex flex-col font-sans select-none overflow-hidden">
      {/* ========================================================================= */}
      {/* 1. TOP GODOT HEADER BAR (Logo, Workspace Switcher, Renderer, Run Toolbar) */}
      {/* ========================================================================= */}
      <header className="h-10 bg-[#202531] border-b border-[#2a3242] px-3 flex items-center justify-between z-30 shrink-0">
        {/* Left: Godot Brand & Scene Name */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#478cbf] flex items-center justify-center text-white font-bold text-xs shadow-sm">
              <Box className="w-3.5 h-3.5 fill-current" />
            </div>
            <span className="font-bold text-white text-xs font-['Space_Grotesk'] tracking-tight">
              Godot Engine
            </span>
          </div>

          <div className="h-4 w-px bg-[#2e3748]" />

          {/* Menus: Scene, Project, Debug, Export, Help */}
          <div className="flex items-center text-xs text-slate-300">
            <button
              onClick={() => setActiveMenu(activeMenu === 'scene' ? null : 'scene')}
              className={`px-2 py-1 rounded hover:bg-[#2a3242] ${activeMenu === 'scene' ? 'bg-[#2a3242] text-[#599eff]' : ''}`}
            >
              Scene
            </button>
            <button
              onClick={() => setActiveMenu(activeMenu === 'edit' ? null : 'edit')}
              className={`px-2 py-1 rounded hover:bg-[#2a3242] ${activeMenu === 'edit' ? 'bg-[#2a3242] text-[#599eff]' : ''}`}
            >
              Project
            </button>
            <button
              onClick={onOpenExport}
              className="px-2 py-1 rounded hover:bg-[#2a3242] flex items-center gap-1 text-amber-300"
            >
              <Download className="w-3 h-3" />
              <span>Export</span>
            </button>
            <button
              onClick={() => setIsWindowsSetupWizardOpen(true)}
              className="px-2 py-1 rounded bg-cyan-600/20 hover:bg-cyan-600/40 border border-cyan-500/30 flex items-center gap-1 text-cyan-300 font-semibold cursor-pointer transition-colors"
              title="Windows .ZIP Package & Setup Wizard"
            >
              <Package className="w-3 h-3 text-cyan-400" />
              <span>Windows .ZIP Setup</span>
            </button>
            <button
              onClick={() => setIsAudioAssetsModalOpen(true)}
              className="px-2 py-1 rounded hover:bg-[#2a3242] flex items-center gap-1 text-cyan-400 font-semibold cursor-pointer"
              title="Open Audio Assets & Sound Library"
            >
              <Volume2 className="w-3 h-3 text-cyan-400" />
              <span>Audio Assets</span>
            </button>
            <button
              onClick={() => setIsInteractiveGuideOpen(true)}
              className="px-2 py-1 rounded hover:bg-[#2a3242] flex items-center gap-1 text-emerald-400 font-semibold cursor-pointer"
              title="Open Interactive Engine Guide & Tour"
            >
              <HelpCircle className="w-3 h-3" />
              <span>Tour & Guide</span>
            </button>
            <button
              onClick={() => setShowStartupAnimation(true)}
              className="px-2 py-1 rounded hover:bg-[#2a3242] flex items-center gap-1 text-slate-400 hover:text-indigo-300 cursor-pointer"
              title="Replay Engine Boot Intro Animation"
            >
              <Zap className="w-3 h-3 text-indigo-400" />
              <span className="hidden sm:inline">Intro</span>
            </button>
            <button
              onClick={() => setIsDayOneGuideOpen(true)}
              className="px-2 py-1 rounded hover:bg-[#2a3242] flex items-center gap-1 text-sky-400 cursor-pointer"
            >
              <Compass className="w-3 h-3" />
              <span>Roadmap</span>
            </button>
          </div>
        </div>

        {/* Center: Iconic Godot Workspace Switcher [ 2D ] [ 3D ] [ Script ] [ AssetLib ] */}
        <div className="flex items-center bg-[#151922] p-0.5 rounded-lg border border-[#2a3242]">
          <button
            onClick={() => setWorkspace('2D')}
            className={`px-4 py-1 rounded font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
              workspace === '2D'
                ? 'bg-[#478cbf] text-white shadow-md shadow-[#478cbf]/25'
                : 'text-slate-400 hover:text-white hover:bg-[#202531]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>2D</span>
          </button>

          <button
            onClick={() => setWorkspace('3D')}
            className={`px-4 py-1 rounded font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
              workspace === '3D'
                ? 'bg-[#478cbf] text-white shadow-md shadow-[#478cbf]/25'
                : 'text-slate-400 hover:text-white hover:bg-[#202531]'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>3D</span>
          </button>

          <button
            onClick={() => setWorkspace('Script')}
            className={`px-4 py-1 rounded font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
              workspace === 'Script'
                ? 'bg-[#478cbf] text-white shadow-md shadow-[#478cbf]/25'
                : 'text-slate-400 hover:text-white hover:bg-[#202531]'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Script</span>
          </button>

          <button
            onClick={() => setWorkspace('AssetLib')}
            className={`px-4 py-1 rounded font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
              workspace === 'AssetLib'
                ? 'bg-[#478cbf] text-white shadow-md shadow-[#478cbf]/25'
                : 'text-slate-400 hover:text-white hover:bg-[#202531]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AssetLib</span>
          </button>
        </div>

        {/* Right: Renderer Switcher & Run Controls */}
        <div className="flex items-center gap-2">
          {/* Renderer Selector (Forward+ / Mobile / Compatibility) */}
          <select
            value={renderer}
            onChange={(e) => setRenderer(e.target.value as any)}
            className="bg-[#151922] border border-[#2a3242] text-slate-300 text-[11px] font-mono px-2 py-1 rounded cursor-pointer outline-none"
            title="Godot Graphics Renderer"
          >
            <option value="Forward+">Forward+ (Vulkan 1.3)</option>
            <option value="Mobile">Mobile (Vulkan / Android)</option>
            <option value="Compatibility">Compatibility (OpenGL 3)</option>
          </select>

          <div className="h-4 w-px bg-[#2e3748]" />

          {/* Godot Run Transport: Play (F5), Play Scene (F6), Pause (F7), Stop (F8) */}
          <div className="flex items-center bg-[#151922] rounded border border-[#2a3242] p-0.5">
            <button
              onClick={handleRunViewport}
              className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1 transition-colors ${
                isViewportRunning 
                  ? 'bg-emerald-600 text-white' 
                  : 'text-slate-300 hover:bg-[#202531] hover:text-emerald-400'
              }`}
              title="Play Project (F5)"
            >
              <Play className="w-3 h-3 fill-current" />
              <span className="text-[10px]">F5</span>
            </button>

            <button
              onClick={handlePauseViewport}
              disabled={!isViewportRunning}
              className={`p-1 rounded text-xs transition-colors ${
                isViewportPaused ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white disabled:opacity-40'
              }`}
              title="Pause Scene (F7)"
            >
              <Pause className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleStopViewport}
              disabled={!isViewportRunning}
              className="p-1 rounded text-xs text-slate-400 hover:text-rose-400 disabled:opacity-40 transition-colors"
              title="Stop Scene (F8)"
            >
              <Square className="w-3 h-3 fill-current" />
            </button>
          </div>

          {/* AI Assistant Button */}
          <button
            onClick={() => onOpenAI('Godot 2D/3D Engine Architecture & Scripting')}
            className="px-2.5 py-1 rounded bg-[#2a3242] hover:bg-[#363f54] text-[#599eff] text-xs font-bold flex items-center gap-1 border border-[#3b475e]"
          >
            <Sparkles className="w-3 h-3" />
            <span>AI Copilot</span>
          </button>

          {/* Exit / Return */}
          <button
            onClick={onBack}
            className="p-1.5 rounded hover:bg-rose-600/30 text-slate-400 hover:text-rose-300 transition-colors"
            title="Return to Projects Dashboard"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. MAIN 3-COLUMN WORKSPACE DOCK                                           */}
      {/* ========================================================================= */}
      <div className="flex-1 flex overflow-hidden">
        {/* ------------------------------------------------------------- */}
        {/* LEFT DOCK: Godot "Scene" (Node Tree) & "FileSystem" (res://)  */}
        {/* ------------------------------------------------------------- */}
        {showLeftDock && (
          <aside className="w-72 bg-[#1b202a] border-r border-[#262c3a] flex flex-col shrink-0 text-xs select-none">
            {/* Left Dock Tab Switcher */}
            <div className="h-8 bg-[#151922] border-b border-[#262c3a] flex items-center justify-between px-2">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setLeftTab('scene')}
                  className={`px-3 py-1 font-bold text-[11px] rounded transition-colors ${
                    leftTab === 'scene' ? 'bg-[#202531] text-[#599eff]' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Scene
                </button>
                <button
                  onClick={() => setLeftTab('filesystem')}
                  className={`px-3 py-1 font-bold text-[11px] rounded transition-colors ${
                    leftTab === 'filesystem' ? 'bg-[#202531] text-[#599eff]' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  FileSystem
                </button>
              </div>

              {/* Node Add Button (+) */}
              {leftTab === 'scene' && (
                <button
                  onClick={() => setIsCreateNodeModalOpen(true)}
                  className="p-1 rounded bg-[#478cbf] hover:bg-[#599eff] text-white flex items-center gap-1 font-bold text-[10px] px-2 shadow-xs cursor-pointer"
                  title="Add Child Node (Ctrl+A)"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Node</span>
                </button>
              )}
            </div>

            {/* Content: Scene Node Tree */}
            {leftTab === 'scene' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Search Filter */}
                <div className="p-2 border-b border-[#262c3a]">
                  <div className="relative">
                    <Search className="w-3 h-3 text-slate-500 absolute left-2 top-2" />
                    <input
                      type="text"
                      placeholder="Filter Nodes..."
                      value={hierarchyFilter}
                      onChange={e => setHierarchyFilter(e.target.value)}
                      className="w-full bg-[#151922] border border-[#2e3748] rounded pl-7 pr-2 py-0.5 text-[11px] text-white outline-none"
                    />
                  </div>
                </div>

                {/* Node Tree View */}
                <div className="flex-1 overflow-y-auto p-1 font-mono text-[11px] space-y-0.5">
                  {/* Root Node representation */}
                  <div className="px-2 py-1 bg-[#202531]/70 rounded text-[#599eff] font-bold flex items-center gap-1.5">
                    <Box className="w-3.5 h-3.5" />
                    <span>{workspace === '3D' ? 'World3D (Node3D)' : `${project.name} (Node2D)`}</span>
                  </div>

                  {/* 2D Entities if in 2D or 3D Entities if in 3D */}
                  {workspace === '3D' ? (
                    entities3D
                      .filter(ent => ent.name.toLowerCase().includes(hierarchyFilter.toLowerCase()))
                      .map(ent => (
                        <div
                          key={ent.id}
                          onClick={() => setSelectedEntity3DId(ent.id)}
                          className={`pl-5 pr-2 py-1 rounded flex items-center justify-between transition-colors cursor-pointer ${
                            selectedEntity3DId === ent.id ? 'bg-[#478cbf] text-white font-bold' : 'hover:bg-[#202531] text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <Box className="w-3 h-3 text-red-400 shrink-0" />
                            <span className="truncate">{ent.name}</span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateEntity3D(ent.id, { visible: !ent.visible });
                              }}
                              className="text-slate-400 hover:text-white"
                            >
                              {ent.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3 text-slate-600" />}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteEntity3D(ent.id);
                              }}
                              className="text-slate-500 hover:text-red-400"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))
                  ) : (
                    project.entities
                      .filter(ent => ent.name.toLowerCase().includes(hierarchyFilter.toLowerCase()))
                      .map(ent => (
                        <div
                          key={ent.id}
                          onClick={() => setSelectedEntityId(ent.id)}
                          className={`pl-5 pr-2 py-1 rounded flex items-center justify-between transition-colors cursor-pointer ${
                            selectedEntityId === ent.id ? 'bg-[#478cbf] text-white font-bold' : 'hover:bg-[#202531] text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <Layers className="w-3 h-3 text-sky-400 shrink-0" />
                            <span className="truncate">{ent.name}</span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onUpdateProject(prev => ({
                                  ...prev,
                                  entities: prev.entities.map(item => item.id === ent.id ? { ...item, visible: !item.visible } : item)
                                }));
                              }}
                              className="text-slate-400 hover:text-white"
                            >
                              {ent.visible !== false ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3 text-slate-600" />}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onUpdateProject(prev => ({
                                  ...prev,
                                  entities: prev.entities.filter(item => item.id !== ent.id)
                                }));
                              }}
                              className="text-slate-500 hover:text-red-400"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            )}

            {/* Content: FileSystem res:// */}
            {leftTab === 'filesystem' && (
              <div className="flex-1 overflow-y-auto p-2 font-mono text-[11px] space-y-1">
                <div className="text-[#599eff] font-bold flex items-center gap-1.5">
                  <FolderTree className="w-3.5 h-3.5" />
                  <span>res://</span>
                </div>
                <div className="pl-4 space-y-1 text-slate-400">
                  <div className="flex items-center gap-1.5 hover:text-white cursor-pointer" onClick={() => setWorkspace('2D')}>
                    <FileText className="w-3 h-3 text-sky-400" />
                    <span>scenes/Main2D.tscn</span>
                  </div>
                  <div className="flex items-center gap-1.5 hover:text-white cursor-pointer" onClick={() => setWorkspace('3D')}>
                    <Box className="w-3 h-3 text-red-400" />
                    <span>scenes/World3D.tscn</span>
                  </div>
                  <div className="flex items-center gap-1.5 hover:text-white cursor-pointer" onClick={() => setWorkspace('Script')}>
                    <Code2 className="w-3 h-3 text-amber-400" />
                    <span>scripts/PlayerController.java</span>
                  </div>
                  <div className="flex items-center gap-1.5 hover:text-white cursor-pointer" onClick={() => setWorkspace('Script')}>
                    <Code2 className="w-3 h-3 text-emerald-400" />
                    <span>scripts/GameLogic.gd</span>
                  </div>
                  <div className="flex items-center gap-1.5 hover:text-white cursor-pointer" onClick={onOpenExport}>
                    <FileCode className="w-3 h-3 text-purple-400" />
                    <span>build.gradle</span>
                  </div>
                  <div className="flex items-center gap-1.5 hover:text-white cursor-pointer" onClick={onOpenExport}>
                    <Terminal className="w-3 h-3 text-sky-400" />
                    <span>run_windows.bat</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <FileText className="w-3 h-3" />
                    <span>project.godot</span>
                  </div>
                </div>
              </div>
            )}
          </aside>
        )}

        {/* ------------------------------------------------------------- */}
        {/* CENTER VIEWPORT (2D Scene, 3D WebGL, Script Editor, AssetLib) */}
        {/* ------------------------------------------------------------- */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#151922]">
          {/* Scene Tabs Bar */}
          <div className="h-8 bg-[#181c25] border-b border-[#262c3a] px-2 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setWorkspace('2D')}
                className={`px-3 py-1 text-xs rounded-t font-semibold flex items-center gap-1.5 border-t-2 ${
                  workspace === '2D' ? 'bg-[#202531] text-white border-[#478cbf]' : 'text-slate-400 hover:text-white border-transparent'
                }`}
              >
                <Layers className="w-3 h-3 text-sky-400" />
                <span>Main2D.tscn</span>
              </button>

              <button
                onClick={() => setWorkspace('3D')}
                className={`px-3 py-1 text-xs rounded-t font-semibold flex items-center gap-1.5 border-t-2 ${
                  workspace === '3D' ? 'bg-[#202531] text-white border-[#478cbf]' : 'text-slate-400 hover:text-white border-transparent'
                }`}
              >
                <Box className="w-3 h-3 text-red-400" />
                <span>World3D.tscn</span>
              </button>

              <button
                onClick={() => setWorkspace('Script')}
                className={`px-3 py-1 text-xs rounded-t font-semibold flex items-center gap-1.5 border-t-2 ${
                  workspace === 'Script' ? 'bg-[#202531] text-white border-[#478cbf]' : 'text-slate-400 hover:text-white border-transparent'
                }`}
              >
                <Code2 className="w-3 h-3 text-amber-400" />
                <span>PlayerScript.java</span>
              </button>
            </div>

            {/* 2D Sub-Tool Tabs */}
            {workspace === '2D' && (
              <div className="flex items-center gap-1 text-[11px]">
                <button
                  onClick={() => setCenterTab2D('scene')}
                  className={`px-2 py-0.5 rounded ${centerTab2D === 'scene' ? 'bg-[#2a3242] text-white' : 'text-slate-400'}`}
                >
                  Canvas
                </button>
                <button
                  onClick={() => setCenterTab2D('tilemap')}
                  className={`px-2 py-0.5 rounded ${centerTab2D === 'tilemap' ? 'bg-[#2a3242] text-white' : 'text-slate-400'}`}
                >
                  TileMap
                </button>
                <button
                  onClick={() => setCenterTab2D('particles')}
                  className={`px-2 py-0.5 rounded ${centerTab2D === 'particles' ? 'bg-[#2a3242] text-white' : 'text-slate-400'}`}
                >
                  Particles2D
                </button>
                <button
                  onClick={() => setCenterTab2D('logic')}
                  className={`px-2 py-0.5 rounded ${centerTab2D === 'logic' ? 'bg-[#2a3242] text-white' : 'text-slate-400'}`}
                >
                  VisualLogic
                </button>
              </div>
            )}
          </div>

          {/* VIEWPORT CONTENT AREA */}
          <div className="flex-1 relative overflow-hidden">
            {/* 1. WORKSPACE: 3D (Real Three.js WebGL Engine Viewport) */}
            {workspace === '3D' && (
              <Godot3DViewport
                entities3D={entities3D}
                selectedEntityId={selectedEntity3DId}
                onSelectEntity={setSelectedEntity3DId}
                onUpdateEntity={handleUpdateEntity3D}
                onAddEntity3D={handleAddEntity3DDirect}
                onDeleteEntity3D={handleDeleteEntity3D}
                isPlaying={isViewportRunning}
              />
            )}

            {/* 2. WORKSPACE: 2D Canvas */}
            {workspace === '2D' && (
              <>
                {centerTab2D === 'scene' && (
                  <div className="w-full h-full flex flex-col bg-[#141720] relative">
                    {/* 2D Viewport Toolbar */}
                    <div className="h-8 bg-[#1b202a] border-b border-[#262c3a] px-3 flex items-center justify-between text-xs text-slate-300 z-10">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setGizmoMode('select')}
                          className={`p-1 rounded ${gizmoMode === 'select' ? 'bg-[#478cbf] text-white' : 'text-slate-400 hover:text-white'}`}
                          title="Select Mode (Q)"
                        >
                          <MousePointer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setGizmoMode('move')}
                          className={`p-1 rounded ${gizmoMode === 'move' ? 'bg-[#478cbf] text-white' : 'text-slate-400 hover:text-white'}`}
                          title="Move Mode (W)"
                        >
                          <Move className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setGizmoMode('rotate')}
                          className={`p-1 rounded ${gizmoMode === 'rotate' ? 'bg-[#478cbf] text-white' : 'text-slate-400 hover:text-white'}`}
                          title="Rotate Mode (E)"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setGizmoMode('scale')}
                          className={`p-1 rounded ${gizmoMode === 'scale' ? 'bg-[#478cbf] text-white' : 'text-slate-400 hover:text-white'}`}
                          title="Scale Mode (R)"
                        >
                          <Maximize className="w-3.5 h-3.5" />
                        </button>

                        <div className="h-4 w-px bg-[#2e3748] mx-1" />

                        {/* Snap & Grid */}
                        <button
                          onClick={() => setShowGrid(!showGrid)}
                          className={`px-2 py-0.5 rounded text-[11px] flex items-center gap-1 ${showGrid ? 'bg-[#478cbf]/20 text-[#599eff]' : 'text-slate-400'}`}
                        >
                          <Grid className="w-3 h-3" />
                          <span>Snap: {gridSnap}px</span>
                        </button>
                      </div>

                      {/* Live In-Viewport Simulation Status */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleRunViewport}
                          className="px-3 py-1 rounded bg-[#478cbf] hover:bg-[#599eff] text-white text-xs font-bold flex items-center gap-1 shadow-sm"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Simulate 2D Scene</span>
                        </button>
                      </div>
                    </div>

                    {/* Canvas Stage */}
                    <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
                      <canvas
                        ref={editorCanvasRef}
                        className="shadow-2xl border border-[#2e3748] rounded bg-[#0f172a]"
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const clickX = e.clientX - rect.left;
                          const clickY = e.clientY - rect.top;
                          const hit = project.entities.find(ent => 
                            clickX >= ent.x && clickX <= ent.x + ent.width &&
                            clickY >= ent.y && clickY <= ent.y + ent.height
                          );
                          setSelectedEntityId(hit ? hit.id : null);
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* In-Viewport Live Running Canvas */}
                {centerTab2D === 'viewport' && (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-black relative">
                    <canvas
                      ref={viewportCanvasRef}
                      width={project.settings.canvasWidth || 640}
                      height={project.settings.canvasHeight || 360}
                      className="border border-[#478cbf] shadow-2xl rounded"
                    />

                    <div className="absolute top-4 right-4 bg-[#151922]/90 border border-[#2e3748] rounded-lg p-3 text-xs space-y-1">
                      <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5" />
                        <span>60 FPS Native Simulation</span>
                      </div>
                      <div className="text-slate-300">Score: {viewportScore} / Lives: {viewportLives}</div>
                      <div className="text-[10px] text-slate-500">Press F8 or ESC to exit simulation</div>
                    </div>
                  </div>
                )}

                {centerTab2D === 'tilemap' && (
                  <TilemapEditor project={project} onUpdateProject={updater => onUpdateProject(() => updater)} />
                )}

                {centerTab2D === 'particles' && (
                  <ParticleFXEditor project={project} onUpdateProject={updater => onUpdateProject(() => updater)} />
                )}

                {centerTab2D === 'logic' && (
                  <VisualLogicEditor project={project} onUpdateProject={updater => onUpdateProject(() => updater)} />
                )}
              </>
            )}

            {/* 3. WORKSPACE: Script Editor */}
            {workspace === 'Script' && (
              <CodeEditorView
                project={project}
                onUpdateProject={updater => onUpdateProject(() => updater)}
              />
            )}

            {/* 4. WORKSPACE: Godot AssetLib */}
            {workspace === 'AssetLib' && (
              <div className="w-full h-full p-6 overflow-y-auto bg-[#141720] space-y-4">
                <div className="flex items-center justify-between border-b border-[#2e3748] pb-3">
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#599eff]" />
                      <span>Godot Asset Library & Community Templates</span>
                    </h2>
                    <p className="text-xs text-slate-400">Import ready-to-use 2D sprites, 3D low-poly meshes, audio bundles, and shader packs</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Asset Card 1 */}
                  <div className="bg-[#1e232e] border border-[#2e3748] rounded-lg p-4 space-y-2">
                    <div className="font-bold text-white text-sm">Retro 2D Dungeon Crawler Pack</div>
                    <p className="text-xs text-slate-400">Full 16x16 tilemap, animated knight hero, slime enemy, and particle effects.</p>
                    <button
                      onClick={() => {
                        addLog('success', '[AssetLib] Imported Retro 2D Dungeon Crawler Pack into res://assets/.');
                        soundManager.playCoin();
                      }}
                      className="w-full py-1.5 rounded bg-[#478cbf] hover:bg-[#599eff] text-white text-xs font-bold"
                    >
                      Download & Import
                    </button>
                  </div>

                  {/* Asset Card 2 */}
                  <div className="bg-[#1e232e] border border-[#2e3748] rounded-lg p-4 space-y-2">
                    <div className="font-bold text-white text-sm">Low-Poly 3D Starter Arena</div>
                    <p className="text-xs text-slate-400">PBR stone pillars, glowing crystals, treasure chests, and physics rigidbodies.</p>
                    <button
                      onClick={() => {
                        setWorkspace('3D');
                        addLog('success', '[AssetLib] Imported Low-Poly 3D Starter Arena into World3D.tscn.');
                        soundManager.playCoin();
                      }}
                      className="w-full py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                    >
                      Download & Open in 3D
                    </button>
                  </div>

                  {/* Asset Card 3 */}
                  <div className="bg-[#1e232e] border border-[#2e3748] rounded-lg p-4 space-y-2">
                    <div className="font-bold text-white text-sm">Chiptune & 8-Bit Audio Synth Kit</div>
                    <p className="text-xs text-slate-400">4-bus Godot audio mixer preset, jump sounds, laser blasts, and background loops.</p>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => {
                          setBottomTab('audio');
                          setShowBottomDock(true);
                          addLog('success', '[AssetLib] Applied Audio Bus preset.');
                          soundManager.playLaser();
                        }}
                        className="py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold cursor-pointer transition-colors"
                      >
                        Audio Mixer
                      </button>
                      <button
                        onClick={() => {
                          setIsAudioAssetsModalOpen(true);
                          soundManager.playCoin();
                        }}
                        className="py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>Sound Library</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* RIGHT DOCK: Godot "Inspector" & "Node" (Signals & Groups)     */}
        {/* ------------------------------------------------------------- */}
        {showRightDock && (
          <aside className="w-80 bg-[#1b202a] border-l border-[#262c3a] flex flex-col shrink-0 text-xs select-none">
            {/* Right Dock Tabs */}
            <div className="h-8 bg-[#151922] border-b border-[#262c3a] flex items-center px-2">
              <button
                onClick={() => setRightTab('inspector')}
                className={`px-3 py-1 font-bold text-[11px] rounded transition-colors ${
                  rightTab === 'inspector' ? 'bg-[#202531] text-[#599eff]' : 'text-slate-400 hover:text-white'
                }`}
              >
                Inspector
              </button>
              <button
                onClick={() => setRightTab('node')}
                className={`px-3 py-1 font-bold text-[11px] rounded transition-colors ${
                  rightTab === 'node' ? 'bg-[#202531] text-[#599eff]' : 'text-slate-400 hover:text-white'
                }`}
              >
                Node (Signals)
              </button>
              <button
                onClick={() => setRightTab('history')}
                className={`px-3 py-1 font-bold text-[11px] rounded transition-colors ${
                  rightTab === 'history' ? 'bg-[#202531] text-[#599eff]' : 'text-slate-400 hover:text-white'
                }`}
              >
                History
              </button>
            </div>

            {/* TAB 1: INSPECTOR */}
            {rightTab === 'inspector' && (
              <div className="flex-1 overflow-y-auto p-3 space-y-3 font-mono text-[11px]">
                {/* 3D Entity Inspector when in 3D */}
                {workspace === '3D' && selectedEntity3D ? (
                  <div className="space-y-3">
                    {/* Node Category */}
                    <div className="bg-[#202531] rounded border border-[#2e3748] p-2.5 space-y-2">
                      <div className="text-[10px] font-bold text-[#599eff] uppercase tracking-wider flex items-center justify-between">
                        <span>Node3D</span>
                        <span className="text-slate-400 font-normal">{selectedEntity3D.nodeType}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px]">Name:</span>
                        <input
                          type="text"
                          value={selectedEntity3D.name}
                          onChange={e => handleUpdateEntity3D(selectedEntity3D.id, { name: e.target.value })}
                          className="w-full bg-[#151922] border border-[#2e3748] rounded px-2 py-0.5 text-white font-mono text-xs mt-0.5"
                        />
                      </div>
                    </div>

                    {/* Transform3D Category */}
                    <div className="bg-[#202531] rounded border border-[#2e3748] p-2.5 space-y-2">
                      <div className="text-[10px] font-bold text-[#599eff] uppercase tracking-wider">Transform3D</div>
                      
                      {/* Position X, Y, Z */}
                      <div className="space-y-1">
                        <div className="text-[10px] text-slate-400">Position</div>
                        <div className="grid grid-cols-3 gap-1">
                          <div className="bg-[#151922] rounded border border-red-500/40 px-1 py-0.5 flex items-center">
                            <span className="text-red-400 text-[10px] font-bold mr-1">X</span>
                            <input
                              type="number"
                              value={selectedEntity3D.position.x}
                              onChange={e => handleUpdateEntity3D(selectedEntity3D.id, {
                                position: { ...selectedEntity3D.position, x: parseFloat(e.target.value) || 0 }
                              })}
                              className="w-full bg-transparent text-white text-[10px]"
                            />
                          </div>
                          <div className="bg-[#151922] rounded border border-emerald-500/40 px-1 py-0.5 flex items-center">
                            <span className="text-emerald-400 text-[10px] font-bold mr-1">Y</span>
                            <input
                              type="number"
                              value={selectedEntity3D.position.y}
                              onChange={e => handleUpdateEntity3D(selectedEntity3D.id, {
                                position: { ...selectedEntity3D.position, y: parseFloat(e.target.value) || 0 }
                              })}
                              className="w-full bg-transparent text-white text-[10px]"
                            />
                          </div>
                          <div className="bg-[#151922] rounded border border-blue-500/40 px-1 py-0.5 flex items-center">
                            <span className="text-blue-400 text-[10px] font-bold mr-1">Z</span>
                            <input
                              type="number"
                              value={selectedEntity3D.position.z}
                              onChange={e => handleUpdateEntity3D(selectedEntity3D.id, {
                                position: { ...selectedEntity3D.position, z: parseFloat(e.target.value) || 0 }
                              })}
                              className="w-full bg-transparent text-white text-[10px]"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Material & Color */}
                      <div className="pt-2 border-t border-[#2e3748] space-y-1.5">
                        <div className="text-[10px] text-slate-400">PBR Material</div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-400">Albedo:</span>
                          <input
                            type="color"
                            value={selectedEntity3D.material.color}
                            onChange={e => handleUpdateEntity3D(selectedEntity3D.id, {
                              material: { ...selectedEntity3D.material, color: e.target.value }
                            })}
                            className="w-6 h-6 rounded cursor-pointer border border-[#2e3748] bg-transparent"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-400">Roughness:</span>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={selectedEntity3D.material.roughness}
                            onChange={e => handleUpdateEntity3D(selectedEntity3D.id, {
                              material: { ...selectedEntity3D.material, roughness: parseFloat(e.target.value) }
                            })}
                            className="w-24 accent-[#599eff]"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-400">Metallic:</span>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={selectedEntity3D.material.metallic}
                            onChange={e => handleUpdateEntity3D(selectedEntity3D.id, {
                              material: { ...selectedEntity3D.material, metallic: parseFloat(e.target.value) }
                            })}
                            className="w-24 accent-[#599eff]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : selectedEntity2D ? (
                  /* 2D Entity Inspector when in 2D */
                  <div className="space-y-3">
                    <div className="bg-[#202531] rounded border border-[#2e3748] p-2.5 space-y-2">
                      <div className="text-[10px] font-bold text-[#599eff] uppercase tracking-wider flex items-center justify-between">
                        <span>Node2D</span>
                        <span className="text-slate-400 font-normal">{selectedEntity2D.type}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px]">Name:</span>
                        <input
                          type="text"
                          value={selectedEntity2D.name}
                          onChange={e => onUpdateProject(prev => ({
                            ...prev,
                            entities: prev.entities.map(item => item.id === selectedEntity2D.id ? { ...item, name: e.target.value } : item)
                          }))}
                          className="w-full bg-[#151922] border border-[#2e3748] rounded px-2 py-0.5 text-white font-mono text-xs mt-0.5"
                        />
                      </div>
                    </div>

                    <div className="bg-[#202531] rounded border border-[#2e3748] p-2.5 space-y-2">
                      <div className="text-[10px] font-bold text-[#599eff] uppercase tracking-wider">Transform2D</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] text-slate-400">Position X:</span>
                          <input
                            type="number"
                            value={selectedEntity2D.x}
                            onChange={e => onUpdateProject(prev => ({
                              ...prev,
                              entities: prev.entities.map(item => item.id === selectedEntity2D.id ? { ...item, x: parseInt(e.target.value) || 0 } : item)
                            }))}
                            className="w-full bg-[#151922] border border-[#2e3748] rounded px-2 py-0.5 text-white text-xs"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400">Position Y:</span>
                          <input
                            type="number"
                            value={selectedEntity2D.y}
                            onChange={e => onUpdateProject(prev => ({
                              ...prev,
                              entities: prev.entities.map(item => item.id === selectedEntity2D.id ? { ...item, y: parseInt(e.target.value) || 0 } : item)
                            }))}
                            className="w-full bg-[#151922] border border-[#2e3748] rounded px-2 py-0.5 text-white text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Script Variables */}
                    <div className="bg-[#202531] rounded border border-[#2e3748] p-2.5 space-y-2">
                      <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Script Variables (@export)</div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-400">speed:</span>
                          <input
                            type="number"
                            value={selectedEntity2D.speed}
                            onChange={e => onUpdateProject(prev => ({
                              ...prev,
                              entities: prev.entities.map(item => item.id === selectedEntity2D.id ? { ...item, speed: parseFloat(e.target.value) || 0 } : item)
                            }))}
                            className="w-16 bg-[#151922] border border-[#2e3748] rounded px-1.5 py-0.5 text-right text-white"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-400">jump_velocity:</span>
                          <input
                            type="number"
                            value={selectedEntity2D.jumpPower}
                            onChange={e => onUpdateProject(prev => ({
                              ...prev,
                              entities: prev.entities.map(item => item.id === selectedEntity2D.id ? { ...item, jumpPower: parseFloat(e.target.value) || 0 } : item)
                            }))}
                            className="w-16 bg-[#151922] border border-[#2e3748] rounded px-1.5 py-0.5 text-right text-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center text-slate-500 text-xs">
                    Select any 2D or 3D node in the scene to inspect properties.
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: NODE (SIGNALS & GROUPS) */}
            {rightTab === 'node' && (
              <div className="flex-1 overflow-y-auto p-3 space-y-4 font-mono text-[11px]">
                {/* Signals Section */}
                <div className="space-y-2">
                  <div className="text-[10px] font-bold text-[#599eff] uppercase tracking-wider flex items-center gap-1">
                    <Radio className="w-3.5 h-3.5" />
                    <span>Signals</span>
                  </div>
                  <div className="space-y-1 bg-[#202531] rounded border border-[#2e3748] p-2 divide-y divide-[#2e3748]/60">
                    <div className="flex items-center justify-between py-1">
                      <span className="text-slate-300">body_entered(body)</span>
                      <button
                        onClick={() => {
                          addLog('info', `[Signal] Connected "body_entered" to _on_body_entered() in script.`);
                          soundManager.playCoin();
                        }}
                        className="px-2 py-0.5 rounded bg-[#478cbf] hover:bg-[#599eff] text-white text-[10px]"
                      >
                        Connect...
                      </button>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-slate-300">body_exited(body)</span>
                      <button
                        onClick={() => addLog('info', `[Signal] Connected "body_exited" to script.`)}
                        className="px-2 py-0.5 rounded bg-[#2a3242] hover:bg-[#363f54] text-slate-300 text-[10px]"
                      >
                        Connect...
                      </button>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-slate-300">tree_entered()</span>
                      <button
                        onClick={() => addLog('info', `[Signal] Connected "tree_entered" to script.`)}
                        className="px-2 py-0.5 rounded bg-[#2a3242] hover:bg-[#363f54] text-slate-300 text-[10px]"
                      >
                        Connect...
                      </button>
                    </div>
                  </div>
                </div>

                {/* Groups Section */}
                <div className="space-y-2">
                  <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Groups</div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/40 text-[10px]">
                      player
                    </span>
                    <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px]">
                      collectibles
                    </span>
                    <button
                      onClick={() => {
                        const group = prompt('Enter group name to add (e.g. enemies, hazards, coins):', 'enemies');
                        if (group) addLog('success', `[Group] Added node to group "${group}".`);
                      }}
                      className="px-2 py-0.5 bg-[#202531] hover:bg-[#2e3748] text-[#599eff] rounded text-[10px] border border-[#2e3748]"
                    >
                      + Add Group
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: HISTORY */}
            {rightTab === 'history' && (
              <div className="flex-1 overflow-y-auto p-2 font-mono text-[11px] space-y-1">
                {historyStack.map((h, i) => (
                  <div key={i} className="px-2 py-1 bg-[#202531] rounded flex items-center justify-between text-slate-300">
                    <span className="truncate">{h.desc}</span>
                    <span className="text-slate-500 text-[9px] ml-1">{h.time}</span>
                  </div>
                ))}
              </div>
            )}
          </aside>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. GODOT EXPANDABLE BOTTOM DOCK (Output, Debugger, Animation, Audio, CLI) */}
      {/* ========================================================================= */}
      {showBottomDock && (
        <div className="h-56 bg-[#181c25] border-t border-[#262c3a] flex flex-col shrink-0 text-xs select-none">
          {/* Bottom Dock Tabs Header */}
          <div className="h-7 bg-[#141720] border-b border-[#262c3a] px-3 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setBottomTab('output')}
                className={`px-3 py-0.5 font-bold text-[11px] rounded transition-colors ${
                  bottomTab === 'output' ? 'bg-[#202531] text-[#599eff]' : 'text-slate-400 hover:text-white'
                }`}
              >
                Output ({godotLogs.length})
              </button>
              <button
                onClick={() => setBottomTab('debugger')}
                className={`px-3 py-0.5 font-bold text-[11px] rounded transition-colors ${
                  bottomTab === 'debugger' ? 'bg-[#202531] text-[#599eff]' : 'text-slate-400 hover:text-white'
                }`}
              >
                Debugger
              </button>
              <button
                onClick={() => setBottomTab('animation')}
                className={`px-3 py-0.5 font-bold text-[11px] rounded transition-colors ${
                  bottomTab === 'animation' ? 'bg-[#202531] text-amber-400' : 'text-slate-400 hover:text-white'
                }`}
              >
                AnimationPlayer
              </button>
              <button
                onClick={() => setBottomTab('audio')}
                className={`px-3 py-0.5 font-bold text-[11px] rounded transition-colors ${
                  bottomTab === 'audio' ? 'bg-[#202531] text-purple-400' : 'text-slate-400 hover:text-white'
                }`}
              >
                Audio Bus
              </button>
              <button
                onClick={() => setBottomTab('terminal')}
                className={`px-3 py-0.5 font-bold text-[11px] rounded transition-colors ${
                  bottomTab === 'terminal' ? 'bg-[#202531] text-emerald-400' : 'text-slate-400 hover:text-white'
                }`}
              >
                Terminal
              </button>
            </div>

            <div className="flex items-center gap-2 text-slate-400">
              <button
                onClick={() => setGodotLogs([])}
                className="hover:text-white text-[10px]"
                title="Clear Output Logs"
              >
                Clear
              </button>
              <button
                onClick={() => setShowBottomDock(false)}
                className="hover:text-white"
                title="Hide Bottom Panel"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Bottom Dock Panels */}
          <div className="flex-1 overflow-hidden">
            {bottomTab === 'output' && (
              <div className="w-full h-full p-2 overflow-y-auto font-mono text-[11px] space-y-1 bg-[#141720]">
                {godotLogs.map((log, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-slate-500 shrink-0">{log.time}</span>
                    <span className={
                      log.type === 'error' ? 'text-red-400 font-bold' :
                      log.type === 'warn' ? 'text-amber-400' :
                      log.type === 'success' ? 'text-emerald-400' : 'text-slate-300'
                    }>
                      {log.text}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {bottomTab === 'debugger' && (
              <EngineProfilerPanel project={project} />
            )}

            {bottomTab === 'animation' && (
              <GodotAnimationPlayer
                animations={project.animations || []}
                onUpdateAnimations={anims => onUpdateProject(prev => ({ ...prev, animations: anims }))}
                selectedNodeId={selectedEntityId}
                selectedNodeName={selectedEntity2D?.name || selectedEntity3D?.name}
                onApplyAnimationPreview={() => {
                  // Safe visual preview handled in viewport without mutating project database
                }}
              />
            )}

            {bottomTab === 'audio' && (
              <GodotAudioBusLayout
                buses={project.audioBuses}
                onUpdateBuses={buses => onUpdateProject(prev => ({ ...prev, audioBuses: buses }))}
              />
            )}

            {bottomTab === 'terminal' && (
              <div className="w-full h-full flex flex-col bg-black text-emerald-400 font-mono text-[11px] p-2">
                <div className="flex-1 overflow-y-auto space-y-0.5">
                  {cliHistory.map((line, i) => (
                    <div key={i}>{line}</div>
                  ))}
                </div>
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    if (!cliInput.trim()) return;
                    const cmd = cliInput.trim();
                    setCliHistory(prev => [...prev, `$ ${cmd}`]);
                    if (cmd === 'clear') setCliHistory([]);
                    else if (cmd === 'tree') setCliHistory(prev => [...prev, 'Node2D', '  ├── CharacterBody2D', '  └── StaticBody2D']);
                    else if (cmd === 'build') {
                      onOpenExport();
                      setCliHistory(prev => [...prev, '[Build] Opened Desktop Windows & Android export dialog.']);
                    } else {
                      setCliHistory(prev => [...prev, `[Godot CLI] Command executed: ${cmd}`]);
                    }
                    setCliInput('');
                  }}
                  className="flex items-center gap-2 pt-1 border-t border-emerald-500/30"
                >
                  <span className="text-emerald-400 font-bold">$</span>
                  <input
                    type="text"
                    value={cliInput}
                    onChange={e => setCliInput(e.target.value)}
                    placeholder="godot --help | javac | gradle run..."
                    className="flex-1 bg-transparent text-white outline-none"
                  />
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. GODOT CREATE NODE MODAL (+ Ctrl+A)                                     */}
      {/* ========================================================================= */}
      <GodotCreateNodeModal
        isOpen={isCreateNodeModalOpen}
        onClose={() => setIsCreateNodeModalOpen(false)}
        onSelectNode={handleNodeCreated}
        currentWorkspace={workspace}
      />

      {/* Day 1 Roadmap Guide Modal */}
      <DayOneGuideModal
        isOpen={isDayOneGuideOpen}
        onClose={() => setIsDayOneGuideOpen(false)}
        onJumpToAcademy={onBack}
      />

      {/* 5. ENGINE STARTUP INTRO ANIMATION */}
      {showStartupAnimation && (
        <EngineStartupAnimation
          projectName={project.name}
          onComplete={() => {
            setShowStartupAnimation(false);
            try {
              sessionStorage.setItem('gamedev_engine_boot_seen', 'true');
              if (!localStorage.getItem('gamedev_engine_guide_seen')) {
                setIsInteractiveGuideOpen(true);
                localStorage.setItem('gamedev_engine_guide_seen', 'true');
              }
            } catch {}
          }}
        />
      )}

      {/* 6. INTERACTIVE ENGINE TOUR & GUIDES */}
      <EngineInteractiveGuide
        isOpen={isInteractiveGuideOpen}
        onClose={() => setIsInteractiveGuideOpen(false)}
        onNavigateWorkspace={(ws) => {
          setWorkspace(ws);
          addLog('info', `[Tour] Switched to ${ws} workspace.`);
        }}
        onNavigateBottomTab={(tab) => {
          setShowBottomDock(true);
          setBottomTab(tab);
          addLog('info', `[Tour] Opened ${tab} dock.`);
        }}
      />

      {/* 7. AUDIO ASSETS & SOUND LIBRARY MODAL */}
      {isAudioAssetsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121622] border border-[#27354d] rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 bg-[#182030] border-b border-[#27354d] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                  <Volume2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm font-['Space_Grotesk']">
                    Audio Assets & Procedural Synthesizer
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Project: <span className="text-[#599eff] font-mono">{project.name}</span> • Ready for Godot Audio Buses
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsAudioAssetsModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-[#20293d] hover:bg-[#2b3752] text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <AudioAssetsLibrary
                activeProject={project}
                onSaveSoundToProject={(sound) => {
                  onUpdateProject(prev => ({
                    ...prev,
                    sounds: [sound, ...prev.sounds.filter(s => s.id !== sound.id)]
                  }));
                  addLog('success', `[Audio] Added sound "${sound.name}" to project resources.`);
                }}
                isEmbedded={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* 8. WINDOWS SETUP WIZARD & ZIP PACKAGER */}
      {isWindowsSetupWizardOpen && (
        <WindowsSetupWizardModal
          project={project}
          onClose={() => setIsWindowsSetupWizardOpen(false)}
          onPlayTest={handleRunViewport}
        />
      )}
    </div>
  );
};
