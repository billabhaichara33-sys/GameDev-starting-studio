import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Save, 
  Sparkles, 
  Plus, 
  Trash2, 
  Copy, 
  Layers, 
  Code2, 
  Zap, 
  Palette, 
  Volume2, 
  Download, 
  ChevronLeft,
  Grid,
  Check,
  Settings,
  Eye,
  Sliders,
  Move,
  Share2,
  BookOpen,
  Activity,
  Flame,
  Cpu,
  Shield,
  Compass,
  Coffee
} from 'lucide-react';
import { GameProject, GameEntity, EntityType, BodyType } from '../types';
import { VisualLogicEditor } from './VisualLogicEditor';
import { CodeEditorView } from './CodeEditorView';
import { PixelArtEditor } from './PixelArtEditor';
import { AudioManager } from './AudioManager';
import { TilemapEditor } from './TilemapEditor';
import { ParticleFXEditor } from './ParticleFXEditor';
import { CameraShaderEditor } from './CameraShaderEditor';
import { EngineProfilerPanel } from './EngineProfilerPanel';
import { DayOneGuideModal } from './DayOneGuideModal';
import { DesktopEngineView } from './DesktopEngineView';

interface GameEditorProps {
  project: GameProject;
  onUpdateProject: (updated: GameProject) => void;
  onPlayTest: () => void;
  onBack: () => void;
  onOpenAI: (context?: string) => void;
  onOpenExport: () => void;
  onOpenPublish?: () => void;
}

export type EditorTab = 'scene' | 'tilemap' | 'logic' | 'code' | 'art' | 'audio' | 'particles' | 'camera' | 'profiler';

export const GameEditor: React.FC<GameEditorProps> = ({
  project,
  onUpdateProject,
  onPlayTest,
  onBack,
  onOpenAI,
  onOpenExport,
  onOpenPublish
}) => {
  const [engineMode, setEngineMode] = useState<'desktop' | 'classic'>('desktop');
  const [currentTab, setCurrentTab] = useState<EditorTab>('scene');
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(
    project.entities.find(e => e.type === 'player')?.id || project.entities[0]?.id || null
  );
  const [gridSnap, setGridSnap] = useState<number>(16);
  const [isSaved, setIsSaved] = useState<boolean>(true);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDayOneGuideOpen, setIsDayOneGuideOpen] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const selectedEntity = project.entities.find(e => e.id === selectedEntityId) || null;

  // Mark unsaved on modifications
  const updateProjectData = (updater: (prev: GameProject) => GameProject) => {
    const updated = updater(project);
    updated.lastModified = Date.now();
    onUpdateProject(updated);
    setIsSaved(false);
  };

  if (engineMode === 'desktop') {
    return (
      <DesktopEngineView
        project={project}
        onUpdateProject={updateProjectData}
        onPlayTest={onPlayTest}
        onBack={onBack}
        onOpenAI={onOpenAI}
        onOpenExport={onOpenExport}
        onOpenPublish={onOpenPublish || (() => {})}
      />
    );
  }

  const handleSave = () => {
    onUpdateProject({ ...project, lastModified: Date.now() });
    setIsSaved(true);
    setTimeout(() => setIsSaved(true), 1500);
  };

  // Add entity helper
  const handleAddEntity = (type: EntityType) => {
    const defaults: Record<EntityType, Partial<GameEntity>> = {
      player: { name: 'Player Hero', width: 24, height: 32, color: '#38bdf8', speed: 4, jumpPower: 11, gravity: true, solid: true, tag: 'player' },
      platform: { name: 'Stone Platform', width: 96, height: 16, color: '#475569', speed: 0, jumpPower: 0, gravity: false, solid: true },
      coin: { name: 'Gold Coin', width: 16, height: 16, color: '#facc15', speed: 0, jumpPower: 0, gravity: false, solid: false, tag: 'coin' },
      enemy: { name: 'Patrol Slime', width: 24, height: 24, color: '#a855f7', speed: 1.5, jumpPower: 0, gravity: true, solid: true, patrolDistance: 80, tag: 'enemy' },
      hazard: { name: 'Spike Hazard', width: 32, height: 12, color: '#ef4444', speed: 0, jumpPower: 0, gravity: false, solid: false, tag: 'hazard' },
      goal: { name: 'Castle Flag', width: 32, height: 64, color: '#f59e0b', speed: 0, jumpPower: 0, gravity: false, solid: false, tag: 'goal' },
      door: { name: 'Locked Door', width: 20, height: 64, color: '#b45309', speed: 0, jumpPower: 0, gravity: false, solid: true, tag: 'door' },
      key: { name: 'Golden Key', width: 18, height: 18, color: '#fbbf24', speed: 0, jumpPower: 0, gravity: false, solid: false, tag: 'key' },
      box: { name: 'Pushable Box', width: 32, height: 32, color: '#ca8a04', speed: 0, jumpPower: 0, gravity: false, solid: true, tag: 'box' },
      projectile: { name: 'Laser Bolt', width: 4, height: 12, color: '#38bdf8', speed: 8, jumpPower: 0, gravity: false, solid: false, tag: 'projectile' }
    };

    const d = defaults[type] || {};
    const newEnt: GameEntity = {
      id: `ent-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: d.name || 'New Entity',
      type,
      x: 100,
      y: 100,
      width: d.width || 24,
      height: d.height || 24,
      color: d.color || '#6366f1',
      speed: d.speed ?? 0,
      jumpPower: d.jumpPower ?? 0,
      health: 1,
      maxHealth: 1,
      gravity: d.gravity ?? false,
      solid: d.solid ?? true,
      patrolDistance: d.patrolDistance,
      tag: d.tag
    };

    updateProjectData(prev => ({
      ...prev,
      entities: [...prev.entities, newEnt]
    }));
    setSelectedEntityId(newEnt.id);
  };

  const handleDeleteSelected = () => {
    if (!selectedEntityId) return;
    updateProjectData(prev => ({
      ...prev,
      entities: prev.entities.filter(e => e.id !== selectedEntityId)
    }));
    setSelectedEntityId(null);
  };

  const handleDuplicateSelected = () => {
    if (!selectedEntity) return;
    const dup: GameEntity = {
      ...selectedEntity,
      id: `ent-${Date.now()}`,
      name: `${selectedEntity.name} (Copy)`,
      x: selectedEntity.x + 20,
      y: selectedEntity.y + 20
    };
    updateProjectData(prev => ({
      ...prev,
      entities: [...prev.entities, dup]
    }));
    setSelectedEntityId(dup.id);
  };

  // Render 2D Scene Canvas
  useEffect(() => {
    if (currentTab !== 'scene' || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Clear background
    ctx.fillStyle = project.settings.backgroundColor || '#0f172a';
    ctx.fillRect(0, 0, w, h);

    // Draw grid if enabled
    if (gridSnap > 0) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += gridSnap) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += gridSnap) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
    }

    // Render Entities
    project.entities.forEach(ent => {
      const isSel = ent.id === selectedEntityId;

      ctx.save();
      // Draw entity box
      ctx.fillStyle = ent.color || '#64748b';

      if (ent.type === 'coin') {
        ctx.beginPath();
        ctx.arc(ent.x + ent.width / 2, ent.y + ent.height / 2, ent.width / 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (ent.type === 'hazard') {
        ctx.beginPath();
        ctx.moveTo(ent.x, ent.y + ent.height);
        ctx.lineTo(ent.x + ent.width / 2, ent.y);
        ctx.lineTo(ent.x + ent.width, ent.y + ent.height);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.roundRect(ent.x, ent.y, ent.width, ent.height, ent.type === 'player' ? 4 : 2);
        ctx.fill();
      }

      // Selection outline
      if (isSel) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.strokeRect(ent.x - 2, ent.y - 2, ent.width + 4, ent.height + 4);

        // Corner handles
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(ent.x - 4, ent.y - 4, 6, 6);
        ctx.fillRect(ent.x + ent.width - 2, ent.y - 4, 6, 6);
        ctx.fillRect(ent.x - 4, ent.y + ent.height - 2, 6, 6);
        ctx.fillRect(ent.x + ent.width - 2, ent.y + ent.height - 2, 6, 6);
      }

      // Entity label
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillText(ent.name, ent.x, ent.y - 4);

      ctx.restore();
    });
  }, [project, selectedEntityId, currentTab, gridSnap]);

  // Canvas Mouse Dragging & Selection
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    // Check hit on any entity (reverse order so top entity is chosen)
    const hit = [...project.entities].reverse().find(ent => {
      return (
        clickX >= ent.x &&
        clickX <= ent.x + ent.width &&
        clickY >= ent.y &&
        clickY <= ent.y + ent.height
      );
    });

    if (hit) {
      setSelectedEntityId(hit.id);
      setIsDragging(true);
      setDragOffset({ x: clickX - hit.x, y: clickY - hit.y });
    } else {
      setSelectedEntityId(null);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !selectedEntityId || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    let newX = (e.clientX - rect.left) * scaleX - dragOffset.x;
    let newY = (e.clientY - rect.top) * scaleY - dragOffset.y;

    if (gridSnap > 0) {
      newX = Math.round(newX / gridSnap) * gridSnap;
      newY = Math.round(newY / gridSnap) * gridSnap;
    }

    updateProjectData(prev => ({
      ...prev,
      entities: prev.entities.map(ent => {
        if (ent.id === selectedEntityId) {
          return { ...ent, x: Math.max(0, newX), y: Math.max(0, newY) };
        }
        return ent;
      })
    }));
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div id="game-editor-root" className="w-full h-full flex flex-col space-y-4">
      {/* Top Navbar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Project info & back */}
        <div className="flex items-center gap-3">
          <button
            id="btn-editor-back"
            onClick={onBack}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <input
                id="input-project-name"
                type="text"
                value={project.name}
                onChange={(e) => {
                  const val = e.target.value;
                  updateProjectData(prev => ({ ...prev, name: val }));
                }}
                className="bg-transparent text-base sm:text-lg font-bold text-white font-['Space_Grotesk'] focus:outline-none focus:border-b border-indigo-500"
              />
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 capitalize font-mono">
                {project.genre.replace('_', ' ')}
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              {isSaved ? 'Saved locally' : 'Unsaved changes...'}
            </div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs overflow-x-auto max-w-2xl">
          <button
            id="tab-scene"
            onClick={() => setCurrentTab('scene')}
            className={`px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${currentTab === 'scene' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Scene</span>
          </button>

          <button
            id="tab-tilemap"
            onClick={() => setCurrentTab('tilemap')}
            className={`px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${currentTab === 'tilemap' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
          >
            <Grid className="w-3.5 h-3.5 text-emerald-400" />
            <span>Tilemap</span>
          </button>

          <button
            id="tab-logic"
            onClick={() => setCurrentTab('logic')}
            className={`px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${currentTab === 'logic' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Logic</span>
          </button>

          <button
            id="tab-code"
            onClick={() => setCurrentTab('code')}
            className={`px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${currentTab === 'code' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
          >
            <Coffee className="w-3.5 h-3.5 text-red-400" />
            <span>Java Code</span>
          </button>

          <button
            id="tab-art"
            onClick={() => setCurrentTab('art')}
            className={`px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${currentTab === 'art' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
          >
            <Palette className="w-3.5 h-3.5 text-pink-400" />
            <span>Sprites</span>
          </button>

          <button
            id="tab-audio"
            onClick={() => setCurrentTab('audio')}
            className={`px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${currentTab === 'audio' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
          >
            <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sound</span>
          </button>

          <button
            id="tab-particles"
            onClick={() => setCurrentTab('particles')}
            className={`px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${currentTab === 'particles' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
          >
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span>Particles</span>
          </button>

          <button
            id="tab-camera"
            onClick={() => setCurrentTab('camera')}
            className={`px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${currentTab === 'camera' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
          >
            <Eye className="w-3.5 h-3.5 text-sky-400" />
            <span>Camera</span>
          </button>

          <button
            id="tab-profiler"
            onClick={() => setCurrentTab('profiler')}
            className={`px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${currentTab === 'profiler' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
          >
            <Activity className="w-3.5 h-3.5 text-lime-400" />
            <span>Profiler</span>
          </button>
        </div>

        {/* Action Buttons: Day 1 Guide, Play/Test, Save, AI, Export */}
        <div className="flex items-center gap-2">
          <button
            id="btn-open-day-one-guide"
            onClick={() => setIsDayOneGuideOpen(true)}
            className="px-3 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Day 1 Game Engine Guide"
          >
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">Day 1 Guide</span>
          </button>

          <button
            id="btn-ask-sparky-ai"
            onClick={() => onOpenAI(`Working on ${project.name} in ${currentTab} mode.`)}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">AI Mentor</span>
          </button>

          <button
            id="btn-export-project-modal"
            onClick={onOpenExport}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>

          {onOpenPublish && (
            <button
              id="btn-share-to-community"
              onClick={onOpenPublish}
              className="px-3 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 border border-indigo-500/30 transition-colors cursor-pointer"
              title="Share this game to Community Showcase"
            >
              <Share2 className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Share</span>
            </button>
          )}

          <button
            id="btn-save-project-manual"
            onClick={handleSave}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isSaved ? 'Saved' : 'Save'}</span>
          </button>

          <button
            id="btn-play-test-game"
            onClick={onPlayTest}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer animate-pulse"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>PLAY / TEST</span>
          </button>
        </div>
      </div>

      {/* Main Tab Views */}
      <div className="flex-1 px-4 sm:px-6 pb-6 overflow-y-auto">
        {currentTab === 'scene' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Entity Palette */}
            <div className="lg:col-span-3 space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Place Game Elements</span>
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { type: 'platform', label: 'Platform', color: 'bg-slate-700' },
                    { type: 'coin', label: 'Gold Coin', color: 'bg-amber-500' },
                    { type: 'enemy', label: 'Slime / Enemy', color: 'bg-purple-500' },
                    { type: 'hazard', label: 'Spike Hazard', color: 'bg-red-500' },
                    { type: 'goal', label: 'Castle Flag', color: 'bg-amber-600' },
                    { type: 'key', label: 'Key', color: 'bg-yellow-400' },
                    { type: 'door', label: 'Locked Door', color: 'bg-amber-800' },
                    { type: 'player', label: 'Extra Hero', color: 'bg-sky-500' },
                  ].map((item) => (
                    <button
                      key={item.type}
                      id={`btn-add-element-${item.type}`}
                      onClick={() => handleAddEntity(item.type as EntityType)}
                      className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-indigo-500/50 text-left text-xs font-medium text-slate-200 flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <span className={`w-3 h-3 rounded-full ${item.color}`} />
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Stage Settings */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Settings className="w-3.5 h-3.5 text-slate-400" />
                  <span>Physics & Grid</span>
                </h3>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Gravity</span>
                    <span className="font-mono text-indigo-400">{project.settings.gravity}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1.2"
                    step="0.1"
                    value={project.settings.gravity}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      updateProjectData(prev => ({
                        ...prev,
                        settings: { ...prev.settings, gravity: val }
                      }));
                    }}
                    className="w-full accent-indigo-500"
                  />

                  <div className="flex justify-between text-slate-400 pt-2">
                    <span>Grid Snap</span>
                    <div className="flex items-center gap-1 font-mono">
                      {[0, 8, 16, 32].map((g) => (
                        <button
                          key={g}
                          onClick={() => setGridSnap(g)}
                          className={`px-1.5 py-0.5 rounded ${gridSnap === g ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}
                        >
                          {g === 0 ? 'Off' : `${g}px`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-slate-400 pt-2">
                    <span>Background Color</span>
                    <input
                      type="color"
                      value={project.settings.backgroundColor}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateProjectData(prev => ({
                          ...prev,
                          settings: { ...prev.settings, backgroundColor: val }
                        }));
                      }}
                      className="w-6 h-6 rounded border border-slate-700 bg-transparent cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Center Column: 2D Stage Canvas */}
            <div className="lg:col-span-6 space-y-3">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center shadow-lg">
                <div className="w-full flex items-center justify-between pb-3 text-xs text-slate-400">
                  <span className="font-semibold text-slate-300">2D Scene View ({project.entities.length} items)</span>
                  <span>Drag items to position on the stage</span>
                </div>

                <div className="w-full flex items-center justify-center">
                  <canvas
                    id="scene-stage-canvas"
                    ref={canvasRef}
                    width={project.settings.canvasWidth || 640}
                    height={project.settings.canvasHeight || 360}
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                    className="w-full max-w-[640px] aspect-[16/9] border border-slate-700 rounded-xl shadow-2xl block select-none cursor-move"
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Entity Inspector */}
            <div className="lg:col-span-3 space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Entity Inspector</span>
                  </h3>
                  {selectedEntity && (
                    <div className="flex items-center gap-1">
                      <button
                        title="Duplicate"
                        onClick={handleDuplicateSelected}
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        title="Delete"
                        onClick={handleDeleteSelected}
                        className="p-1 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {!selectedEntity ? (
                  <div className="text-xs text-slate-500 italic py-6 text-center">
                    Click any element on the stage to view and customize its properties.
                  </div>
                ) : (
                  <div className="space-y-3 text-xs">
                    <div className="space-y-1">
                      <label className="text-slate-400">Name</label>
                      <input
                        type="text"
                        value={selectedEntity.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateProjectData(prev => ({
                            ...prev,
                            entities: prev.entities.map(ent => ent.id === selectedEntity.id ? { ...ent, name: val } : ent)
                          }));
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-slate-400">X Position</label>
                        <input
                          type="number"
                          value={selectedEntity.x}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            updateProjectData(prev => ({
                              ...prev,
                              entities: prev.entities.map(ent => ent.id === selectedEntity.id ? { ...ent, x: val } : ent)
                            }));
                          }}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-400">Y Position</label>
                        <input
                          type="number"
                          value={selectedEntity.y}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            updateProjectData(prev => ({
                              ...prev,
                              entities: prev.entities.map(ent => ent.id === selectedEntity.id ? { ...ent, y: val } : ent)
                            }));
                          }}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-slate-400">Width</label>
                        <input
                          type="number"
                          value={selectedEntity.width}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            updateProjectData(prev => ({
                              ...prev,
                              entities: prev.entities.map(ent => ent.id === selectedEntity.id ? { ...ent, width: val } : ent)
                            }));
                          }}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-400">Height</label>
                        <input
                          type="number"
                          value={selectedEntity.height}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            updateProjectData(prev => ({
                              ...prev,
                              entities: prev.entities.map(ent => ent.id === selectedEntity.id ? { ...ent, height: val } : ent)
                            }));
                          }}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-slate-400">Color</label>
                      <input
                        type="color"
                        value={selectedEntity.color}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateProjectData(prev => ({
                            ...prev,
                            entities: prev.entities.map(ent => ent.id === selectedEntity.id ? { ...ent, color: val } : ent)
                          }));
                        }}
                        className="w-6 h-6 rounded border border-slate-700 bg-transparent cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-slate-400">Solid / Collidable</label>
                      <input
                        type="checkbox"
                        checked={selectedEntity.solid}
                        onChange={(e) => {
                          const val = e.target.checked;
                          updateProjectData(prev => ({
                            ...prev,
                            entities: prev.entities.map(ent => ent.id === selectedEntity.id ? { ...ent, solid: val } : ent)
                          }));
                        }}
                        className="rounded border-slate-700 text-indigo-600"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-slate-400">Affected by Gravity</label>
                      <input
                        type="checkbox"
                        checked={selectedEntity.gravity}
                        onChange={(e) => {
                          const val = e.target.checked;
                          updateProjectData(prev => ({
                            ...prev,
                            entities: prev.entities.map(ent => ent.id === selectedEntity.id ? { ...ent, gravity: val } : ent)
                          }));
                        }}
                        className="rounded border-slate-700 text-indigo-600"
                      />
                    </div>

                    {/* Real Engine Physics Body Type */}
                    <div className="space-y-1 pt-2 border-t border-slate-800">
                      <div className="flex items-center justify-between">
                        <label className="text-slate-400 text-[11px] font-semibold uppercase">Physics Body Type</label>
                        <span className="text-[10px] text-indigo-400 font-mono">2D Rigidbody</span>
                      </div>
                      <select
                        value={selectedEntity.bodyType || (selectedEntity.solid && !selectedEntity.gravity ? 'static' : 'dynamic')}
                        onChange={(e) => {
                          const val = e.target.value as BodyType;
                          updateProjectData(prev => ({
                            ...prev,
                            entities: prev.entities.map(ent => ent.id === selectedEntity.id ? { ...ent, bodyType: val } : ent)
                          }));
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white text-xs font-mono"
                      >
                        <option value="dynamic">Dynamic (Gravity & Forces)</option>
                        <option value="static">Static (Solid Level Geometry)</option>
                        <option value="kinematic">Kinematic (Scripted Velocity)</option>
                      </select>
                    </div>

                    {/* Scene Tree Parent Node */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-slate-400 text-[11px] font-semibold uppercase">Scene Parent Node</label>
                        <span className="text-[10px] text-cyan-400 font-mono">Hierarchy</span>
                      </div>
                      <select
                        value={selectedEntity.parentId || ''}
                        onChange={(e) => {
                          const val = e.target.value || null;
                          updateProjectData(prev => ({
                            ...prev,
                            entities: prev.entities.map(ent => ent.id === selectedEntity.id ? { ...ent, parentId: val } : ent)
                          }));
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white text-xs font-mono"
                      >
                        <option value="">Root Scene (World Origin)</option>
                        {project.entities.filter(ent => ent.id !== selectedEntity.id).map(ent => (
                          <option key={ent.id} value={ent.id}>Attach to: {ent.name}</option>
                        ))}
                      </select>
                    </div>

                    {selectedEntity.type === 'player' && (
                      <div className="space-y-2 pt-2 border-t border-slate-800">
                        <div className="flex justify-between text-slate-400">
                          <span>Move Speed</span>
                          <span className="font-mono text-cyan-400">{selectedEntity.speed}</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="8"
                          value={selectedEntity.speed}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            updateProjectData(prev => ({
                              ...prev,
                              entities: prev.entities.map(ent => ent.id === selectedEntity.id ? { ...ent, speed: val } : ent)
                            }));
                          }}
                          className="w-full accent-cyan-500"
                        />

                        <div className="flex justify-between text-slate-400">
                          <span>Jump Power</span>
                          <span className="font-mono text-cyan-400">{selectedEntity.jumpPower}</span>
                        </div>
                        <input
                          type="range"
                          min="5"
                          max="16"
                          value={selectedEntity.jumpPower}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            updateProjectData(prev => ({
                              ...prev,
                              entities: prev.entities.map(ent => ent.id === selectedEntity.id ? { ...ent, jumpPower: val } : ent)
                            }));
                          }}
                          className="w-full accent-cyan-500"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {currentTab === 'logic' && (
          <VisualLogicEditor
            project={project}
            onUpdateRules={(rules) => {
              updateProjectData(prev => ({ ...prev, logicRules: rules }));
            }}
          />
        )}

        {currentTab === 'code' && (
          <CodeEditorView
            initialCode={project.customCode}
            onSaveCode={(code) => {
              updateProjectData(prev => ({ ...prev, customCode: code }));
            }}
            onAskAI={(code, err) => onOpenAI(`Code inquiry: ${err || 'How do I optimize this?'}`)}
          />
        )}

        {currentTab === 'art' && (
          <PixelArtEditor
            initialSprite={project.sprites[0]}
            onBack={() => setCurrentTab('scene')}
            onSaveToProject={(sprite) => {
              updateProjectData(prev => ({
                ...prev,
                sprites: [sprite, ...prev.sprites.filter(s => s.id !== sprite.id)]
              }));
              alert('Sprite saved to your project assets!');
            }}
          />
        )}

        {currentTab === 'audio' && (
          <AudioManager
            projectSounds={project.sounds}
            onBack={() => setCurrentTab('scene')}
            onSaveSound={(sound) => {
              updateProjectData(prev => ({
                ...prev,
                sounds: [sound, ...prev.sounds.filter(s => s.id !== sound.id)]
              }));
              alert(`Sound "${sound.name}" saved to project sounds!`);
            }}
          />
        )}

        {currentTab === 'tilemap' && (
          <TilemapEditor
            project={project}
            onUpdateProject={(updated) => updateProjectData(() => updated)}
          />
        )}

        {currentTab === 'particles' && (
          <ParticleFXEditor
            project={project}
            onUpdateProject={(updated) => updateProjectData(() => updated)}
          />
        )}

        {currentTab === 'camera' && (
          <CameraShaderEditor
            project={project}
            onUpdateProject={(updated) => updateProjectData(() => updated)}
          />
        )}

        {currentTab === 'profiler' && (
          <EngineProfilerPanel
            project={project}
          />
        )}
      </div>

      <DayOneGuideModal
        isOpen={isDayOneGuideOpen}
        onClose={() => setIsDayOneGuideOpen(false)}
        onJumpToAcademy={onBack}
      />
    </div>
  );
};
