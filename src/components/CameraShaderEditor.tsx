import React, { useState } from 'react';
import { GameProject, EngineCameraSettings } from '../types';
import { Eye, Tv, Sliders, Sparkles, Activity, Check } from 'lucide-react';

interface CameraShaderEditorProps {
  project: GameProject;
  onUpdateProject: (project: GameProject) => void;
}

const POST_PROCESSING_OPTIONS: {
  id: EngineCameraSettings['postProcessing'];
  title: string;
  description: string;
  badge: string;
  previewClass: string;
}[] = [
  {
    id: 'none',
    title: 'Modern Crisp (Native)',
    description: 'Clean high-definition pixel rendering without post-processing distortion.',
    badge: '60 FPS',
    previewClass: 'border-slate-700 bg-slate-900'
  },
  {
    id: 'scanlines',
    title: 'Retro CRT TV Scanlines',
    description: 'Cathode-ray arcade television horizontal scanlines with phosphor beam simulation.',
    badge: 'Arcade Classic',
    previewClass: 'border-amber-500/40 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900'
  },
  {
    id: 'bloom',
    title: '8-Bit Bloom & Glow',
    description: 'Soft additive luminescent bloom halo around lasers, coins, and fire particles.',
    badge: 'Juicy Glow',
    previewClass: 'border-cyan-500/40 bg-slate-900'
  },
  {
    id: 'gameboy',
    title: 'Game Boy Monochrome',
    description: 'Authentic 1989 handheld 4-shade greenish phosphor tint palette.',
    badge: 'Nostalgia',
    previewClass: 'border-lime-500/40 bg-[#9bbc0f]/10'
  },
  {
    id: 'synthwave',
    title: 'Cyberpunk Synthwave',
    description: 'Vibrant neon purple and electric cyan chromatic wash for futuristic games.',
    badge: 'Outrun',
    previewClass: 'border-fuchsia-500/40 bg-fuchsia-950/20'
  }
];

export const CameraShaderEditor: React.FC<CameraShaderEditorProps> = ({ project, onUpdateProject }) => {
  const currentCamera: EngineCameraSettings = project.settings.camera || {
    mode: 'follow_player',
    zoom: 1.0,
    smoothLerp: 0.08,
    deadzoneX: 60,
    deadzoneY: 40,
    screenShake: 0,
    postProcessing: 'none'
  };

  const [camera, setCamera] = useState<EngineCameraSettings>(currentCamera);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const updateCameraField = <K extends keyof EngineCameraSettings>(field: K, val: EngineCameraSettings[K]) => {
    const updated: EngineCameraSettings = {
      ...camera,
      [field]: val
    };
    setCamera(updated);
    onUpdateProject({
      ...project,
      settings: {
        ...project.settings,
        camera: updated
      }
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 1500);
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
      {/* Header */}
      <div className="h-14 px-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
        <div className="flex items-center gap-3">
          <Eye className="w-5 h-5 text-cyan-400" />
          <div>
            <h2 className="text-sm font-bold text-white font-['Space_Grotesk']">Camera & Post-Processing Shaders</h2>
            <p className="text-[11px] text-slate-400">Configure viewport follow lerp, aspect zoom, and visual screen shaders</p>
          </div>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
            <Check className="w-3.5 h-3.5" />
            <span>Camera Settings Saved</span>
          </div>
        )}
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 p-6 overflow-y-auto">
        {/* Left: Viewport & Follow Controls */}
        <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-6 flex flex-col gap-5">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Camera Viewport & Tracking</h3>
          </div>

          {/* Camera Mode */}
          <div>
            <div className="text-xs font-semibold text-slate-300 mb-2">Camera Follow Mode</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                id="btn-camera-mode-follow"
                onClick={() => updateCameraField('mode', 'follow_player')}
                className={`p-3 rounded-xl border text-xs font-semibold text-left transition-all cursor-pointer ${
                  camera.mode === 'follow_player'
                    ? 'bg-cyan-600 text-white border-cyan-500 shadow-md'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="font-bold">Follow Player Hero</div>
                <div className="text-[10px] opacity-80 mt-0.5">Smoothly tracks character with Lerp</div>
              </button>

              <button
                id="btn-camera-mode-fixed"
                onClick={() => updateCameraField('mode', 'fixed')}
                className={`p-3 rounded-xl border text-xs font-semibold text-left transition-all cursor-pointer ${
                  camera.mode === 'fixed'
                    ? 'bg-cyan-600 text-white border-cyan-500 shadow-md'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="font-bold">Fixed Arena Viewport</div>
                <div className="text-[10px] opacity-80 mt-0.5">Locks camera coordinates in place</div>
              </button>
            </div>
          </div>

          {/* Camera Zoom Slider */}
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1.5">
              <span className="font-medium">Camera Optical Zoom</span>
              <span className="font-mono text-cyan-400 font-bold">{camera.zoom.toFixed(2)}x</span>
            </div>
            <input
              id="slider-camera-zoom"
              type="range"
              min="0.5"
              max="2.0"
              step="0.05"
              value={camera.zoom}
              onChange={(e) => updateCameraField('zoom', Number(e.target.value))}
              className="w-full accent-cyan-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
              <span>0.5x (Wide)</span>
              <span>1.0x (Standard)</span>
              <span>2.0x (Close-Up Pixel)</span>
            </div>
          </div>

          {/* Smooth Lerp Factor */}
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1.5">
              <span className="font-medium">Linear Interpolation (Lerp Factor)</span>
              <span className="font-mono text-cyan-400 font-bold">{camera.smoothLerp.toFixed(2)}</span>
            </div>
            <input
              id="slider-camera-lerp"
              type="range"
              min="0.02"
              max="0.3"
              step="0.01"
              value={camera.smoothLerp}
              onChange={(e) => updateCameraField('smoothLerp', Number(e.target.value))}
              className="w-full accent-cyan-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
              <span>0.02 (Silky Cinematic)</span>
              <span>0.08 (Balanced)</span>
              <span>0.30 (Fast Snappy)</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 flex items-start gap-2.5">
            <Activity className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-200">Real Game Engine Math:</span>
              <p className="text-[11px] mt-0.5 leading-relaxed font-mono text-slate-400">
                cam.x += (target.x - cam.x) * smoothLerp;
              </p>
            </div>
          </div>
        </div>

        {/* Right: Post-Processing Shader Filters */}
        <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Tv className="w-4 h-4 text-fuchsia-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Post-Processing Shader Stack</h3>
          </div>

          <div className="space-y-3">
            {POST_PROCESSING_OPTIONS.map(opt => {
              const isSelected = camera.postProcessing === opt.id;
              return (
                <button
                  key={opt.id}
                  id={`shader-${opt.id}`}
                  onClick={() => updateCameraField('postProcessing', opt.id)}
                  className={`w-full p-4 rounded-xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-800 border-cyan-500 shadow-md ring-1 ring-cyan-500/50'
                      : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="font-bold text-sm text-slate-200">{opt.title}</div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                      {opt.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{opt.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
