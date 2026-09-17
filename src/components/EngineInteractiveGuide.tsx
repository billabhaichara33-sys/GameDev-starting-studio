import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Compass, 
  Layers, 
  Box, 
  Code2, 
  Sliders, 
  Volume2, 
  Play, 
  Download, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Sparkles, 
  ExternalLink,
  HelpCircle,
  Eye,
  CheckCircle2,
  Check
} from 'lucide-react';
import { soundManager } from '../utils/audioSynth';

export interface GuideStep {
  id: string;
  title: string;
  category: 'Workspace' | 'Scene & Nodes' | 'Viewport' | 'Inspector' | 'Animation & Audio' | 'Build & Export';
  summary: string;
  details: string[];
  recommendedAction?: {
    label: string;
    workspace?: '2D' | '3D' | 'Script' | 'AssetLib';
    bottomTab?: 'output' | 'debugger' | 'animation' | 'audio' | 'terminal';
  };
  shortcut?: string;
  iconName: string;
}

const GUIDE_STEPS: GuideStep[] = [
  {
    id: 'workspaces',
    title: 'Multi-Dimension Workspaces',
    category: 'Workspace',
    summary: 'Seamlessly switch between 2D pixel platforming, real Three.js 3D WebGL scenes, Java code, and the Asset Library.',
    details: [
      'Click [2D] for platformer levels, tilemaps, particle systems, and visual logic.',
      'Click [3D] for hardware-accelerated 3D meshes, lighting, shadows, and real-time physics.',
      'Click [Script] to inspect and edit your Java & GDScript game logic.',
      'Switch renderers in the top-right: Forward+ (Vulkan), Mobile, or Compatibility.'
    ],
    recommendedAction: { label: 'Go to 3D Viewport', workspace: '3D' },
    shortcut: 'Workspace Bar',
    iconName: 'Box'
  },
  {
    id: 'scene_tree',
    title: 'Scene Tree & Node Hierarchy',
    category: 'Scene & Nodes',
    summary: 'Everything in Godot is a Node. Nodes are organized into scenes that combine together.',
    details: [
      'Click [+ Add Node] or press Ctrl+A to open the Node Catalog.',
      'Choose from 2D nodes (CharacterBody2D, StaticBody2D, Area2D, Sprite2D) or 3D nodes (MeshInstance3D, CharacterBody3D, RigidBody3D, DirectionalLight3D).',
      'Toggle the eye icon to hide/show nodes, or lock nodes to prevent accidental selection.',
      'Drag and nest nodes to create parent-child transform relationships.'
    ],
    shortcut: 'Ctrl + A',
    iconName: 'Layers'
  },
  {
    id: 'viewport_gizmos',
    title: 'Viewport Navigation & Gizmos',
    category: 'Viewport',
    summary: 'Control your camera and transform objects in space with full precision.',
    details: [
      'Hold Right-Click + Drag to orbit the 3D camera around your scene.',
      'Hold Middle-Click + Drag (or Shift + Right-Click) to pan the camera view.',
      'Use the Mouse Wheel to zoom in and out smoothly.',
      'Use the toolbar gizmos: Select (Q), Move (W), Rotate (E), and Scale (R) with grid snapping.'
    ],
    recommendedAction: { label: 'Explore 3D Camera', workspace: '3D' },
    shortcut: 'RMB: Orbit • MMB: Pan',
    iconName: 'Compass'
  },
  {
    id: 'inspector_signals',
    title: 'Inspector & Signal Connections',
    category: 'Inspector',
    summary: 'Fine-tune properties and wire interactive events using Godot\'s observer pattern.',
    details: [
      'Select any entity to view its Transform, Collision dimensions, and PBR Materials.',
      'In 3D mode, tweak Albedo color, Roughness, Metalness, and Wireframe shading.',
      'Switch to the [Node] dock to view signals like body_entered(body), timeout(), and tree_entered().',
      'Connect signals to Java functions for decoupled, modular gameplay programming.'
    ],
    shortcut: 'Right Sidebar',
    iconName: 'Sliders'
  },
  {
    id: 'animation_audio',
    title: 'AnimationPlayer & Audio Mixer',
    category: 'Animation & Audio',
    summary: 'Animate any property over time and balance game sounds with high-precision decibel faders.',
    details: [
      'Open the [Animation] bottom dock to create clips (Walk, Idle, Jump, Attack).',
      'Add property tracks and place keyframes on the timeline with live 60 FPS scrubbing.',
      'Open the [Audio] dock to mix Master, Music, and SFX channels with -40dB to +6dB faders.',
      'Toggle Mute (M), Solo (S), and add audio effects like Reverb, Chorus, and EQ.'
    ],
    recommendedAction: { label: 'Open Animation Player', bottomTab: 'animation' },
    shortcut: 'Bottom Dock',
    iconName: 'Volume2'
  },
  {
    id: 'simulation_export',
    title: 'Playtesting & Desktop Export',
    category: 'Build & Export',
    summary: 'Simulate in the editor or compile to standalone Windows .exe and Android .apk binaries.',
    details: [
      'Press Play Project (F5) or Play Scene (F6) to test physics and gameplay instantly.',
      'Click [Build & Export] in the top toolbar to open the Desktop & Mobile build wizard.',
      'Export ready-to-run Windows PC distributions with Launch.bat, Java JAR, and assets.',
      'Generate Android APK packages configured with Gradle and AndroidManifest.xml.'
    ],
    shortcut: 'F5: Run • F8: Stop',
    iconName: 'Play'
  }
];

interface EngineInteractiveGuideProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateWorkspace?: (ws: '2D' | '3D' | 'Script' | 'AssetLib') => void;
  onNavigateBottomTab?: (tab: 'output' | 'debugger' | 'animation' | 'audio' | 'terminal') => void;
}

export const EngineInteractiveGuide: React.FC<EngineInteractiveGuideProps> = ({
  isOpen,
  onClose,
  onNavigateWorkspace,
  onNavigateBottomTab
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const currentStep = GUIDE_STEPS[currentStepIndex];

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStepIndex < GUIDE_STEPS.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
      try { soundManager.playBlip(); } catch {}
    } else {
      try { soundManager.playCoin(); } catch {}
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
      try { soundManager.playBlip(); } catch {}
    }
  };

  const handleAction = () => {
    if (!currentStep.recommendedAction) return;
    if (currentStep.recommendedAction.workspace && onNavigateWorkspace) {
      onNavigateWorkspace(currentStep.recommendedAction.workspace);
    }
    if (currentStep.recommendedAction.bottomTab && onNavigateBottomTab) {
      onNavigateBottomTab(currentStep.recommendedAction.bottomTab);
    }
    try { soundManager.playPowerup(); } catch {}
  };

  const getStepIcon = (name: string) => {
    switch (name) {
      case 'Box': return <Box className="w-5 h-5 text-indigo-400" />;
      case 'Layers': return <Layers className="w-5 h-5 text-emerald-400" />;
      case 'Compass': return <Compass className="w-5 h-5 text-cyan-400" />;
      case 'Sliders': return <Sliders className="w-5 h-5 text-amber-400" />;
      case 'Volume2': return <Volume2 className="w-5 h-5 text-pink-400" />;
      case 'Play': return <Play className="w-5 h-5 text-purple-400" />;
      default: return <Sparkles className="w-5 h-5 text-[#478cbf]" />;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 select-none font-sans"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 12 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-2xl bg-[#181d28] border border-[#2c374d] rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-[#283245] bg-[#141923] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#478cbf]/20 border border-[#478cbf]/40 flex items-center justify-center">
                <HelpCircle className="w-4 h-4 text-[#599eff]" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white font-['Space_Grotesk'] flex items-center gap-2">
                  <span>Engine Interactive Tour & Guide</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#202736] border border-[#303d54] text-[10px] text-[#599eff] font-mono font-normal">
                    Godot 4.3 Architecture
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Step {currentStepIndex + 1} of {GUIDE_STEPS.length} • {currentStep.category}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#202736] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-5">
            {/* Step Card */}
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-[#202736] border border-[#2f3b52] shrink-0 shadow-inner">
                {getStepIcon(currentStep.iconName)}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-bold text-white font-['Space_Grotesk']">
                    {currentStep.title}
                  </h4>
                  {currentStep.shortcut && (
                    <span className="px-2 py-0.5 rounded bg-[#1f2737] border border-[#2f3c55] text-[10px] font-mono text-slate-300">
                      {currentStep.shortcut}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {currentStep.summary}
                </p>
              </div>
            </div>

            {/* Bullet Details */}
            <div className="bg-[#121620] border border-[#232d3f] rounded-xl p-4 space-y-2.5">
              {currentStep.details.map((detail, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed">
                  <div className="w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span>{detail}</span>
                </div>
              ))}
            </div>

            {/* Quick Action Button if available */}
            {currentStep.recommendedAction && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#1e2535] border border-[#313e57]">
                <span className="text-xs text-slate-300 font-medium">
                  Try this feature now:
                </span>
                <button
                  onClick={handleAction}
                  className="px-3 py-1.5 rounded-lg bg-[#478cbf] hover:bg-[#599eff] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow cursor-pointer"
                >
                  <span>{currentStep.recommendedAction.label}</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Progress Dots */}
            <div className="flex items-center justify-center gap-2 pt-1">
              {GUIDE_STEPS.map((step, idx) => (
                <button
                  key={step.id}
                  onClick={() => {
                    setCurrentStepIndex(idx);
                    try { soundManager.playBlip(); } catch {}
                  }}
                  className={`h-2 rounded-full transition-all duration-200 cursor-pointer ${
                    idx === currentStepIndex
                      ? 'w-6 bg-[#478cbf]'
                      : 'w-2 bg-[#2a3449] hover:bg-[#3d4b68]'
                  }`}
                  title={step.title}
                />
              ))}
            </div>
          </div>

          {/* Footer Controls */}
          <div className="px-6 py-3.5 border-t border-[#283245] bg-[#141923] flex items-center justify-between">
            <button
              onClick={onClose}
              className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded hover:bg-[#202736] transition-colors cursor-pointer"
            >
              Skip Tour
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                disabled={currentStepIndex === 0}
                className="px-3 py-1.5 rounded-lg bg-[#202736] hover:bg-[#2a3449] disabled:opacity-40 disabled:pointer-events-none text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <button
                onClick={handleNext}
                className="px-4 py-1.5 rounded-lg bg-[#478cbf] hover:bg-[#599eff] text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow cursor-pointer"
              >
                <span>{currentStepIndex === GUIDE_STEPS.length - 1 ? 'Finish Tour' : 'Next Step'}</span>
                {currentStepIndex === GUIDE_STEPS.length - 1 ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
