import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  Plus, 
  Trash2, 
  Clock, 
  Layers, 
  Sliders, 
  Repeat, 
  Sparkles,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { AnimationClip, AnimationTrack, AnimationKeyframe } from '../types';

interface GodotAnimationPlayerProps {
  animations: AnimationClip[];
  onUpdateAnimations: (animations: AnimationClip[]) => void;
  selectedNodeId: string | null;
  selectedNodeName?: string;
  onApplyAnimationPreview: (property: string, value: any) => void;
}

export const GodotAnimationPlayer: React.FC<GodotAnimationPlayerProps> = ({
  animations,
  onUpdateAnimations,
  selectedNodeId,
  selectedNodeName = 'Selected Node',
  onApplyAnimationPreview
}) => {
  const [activeClipIndex, setActiveClipIndex] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0.0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [loopMode, setLoopMode] = useState<'loop' | 'once'>('loop');

  const animationTimerRef = useRef<number | null>(null);

  // Default clip if none exist
  const currentClip: AnimationClip = animations[activeClipIndex] || {
    id: 'anim_idle',
    name: 'idle_animation',
    duration: 2.0,
    loop: true,
    step: 0.1,
    tracks: [
      {
        id: 'track_pos_y',
        targetNodeId: selectedNodeId || 'player-1',
        property: 'position_y',
        keyframes: [
          { time: 0.0, property: 'position_y', value: 0 },
          { time: 1.0, property: 'position_y', value: -12 },
          { time: 2.0, property: 'position_y', value: 0 }
        ]
      },
      {
        id: 'track_scale',
        targetNodeId: selectedNodeId || 'player-1',
        property: 'scale',
        keyframes: [
          { time: 0.0, property: 'scale', value: 1.0 },
          { time: 1.0, property: 'scale', value: 1.15 },
          { time: 2.0, property: 'scale', value: 1.0 }
        ]
      }
    ]
  };

  // Playback timer loop
  useEffect(() => {
    if (!isPlaying) {
      if (animationTimerRef.current) cancelAnimationFrame(animationTimerRef.current);
      return;
    }

    let lastTimestamp = performance.now();

    const loop = (now: number) => {
      const delta = (now - lastTimestamp) / 1000;
      lastTimestamp = now;

      setCurrentTime(prev => {
        let next = prev + delta * playbackSpeed;
        if (next >= currentClip.duration) {
          if (loopMode === 'loop') {
            next = 0;
          } else {
            setIsPlaying(false);
            return currentClip.duration;
          }
        }
        return Number(next.toFixed(3));
      });

      animationTimerRef.current = requestAnimationFrame(loop);
    };

    animationTimerRef.current = requestAnimationFrame(loop);
    return () => {
      if (animationTimerRef.current) cancelAnimationFrame(animationTimerRef.current);
    };
  }, [isPlaying, playbackSpeed, loopMode, currentClip.duration]);

  // Apply preview to active scene when scrubbing
  useEffect(() => {
    if (!currentClip.tracks) return;

    currentClip.tracks.forEach(track => {
      if (track.keyframes.length === 0) return;
      // Sort keyframes by time
      const sorted = [...track.keyframes].sort((a, b) => a.time - b.time);
      
      let interpValue = sorted[0].value;
      for (let i = 0; i < sorted.length; i++) {
        if (sorted[i].time <= currentTime) {
          interpValue = sorted[i].value;
          if (i < sorted.length - 1 && sorted[i + 1].time > currentTime) {
            const k1 = sorted[i];
            const k2 = sorted[i + 1];
            const t = (currentTime - k1.time) / (k2.time - k1.time);
            if (typeof k1.value === 'number' && typeof k2.value === 'number') {
              interpValue = k1.value + (k2.value - k1.value) * t;
            }
          }
        }
      }

      onApplyAnimationPreview(track.property, interpValue);
    });
  }, [currentTime, currentClip, onApplyAnimationPreview]);

  // Add new track
  const handleAddTrack = (prop: 'position_x' | 'position_y' | 'position_z' | 'rotation' | 'scale' | 'color' | 'opacity') => {
    if (!selectedNodeId) return;

    const newTrack: AnimationTrack = {
      id: `track_${Date.now()}`,
      targetNodeId: selectedNodeId,
      property: prop,
      keyframes: [
        { time: 0.0, property: prop, value: prop === 'scale' ? 1.0 : 0 },
        { time: currentClip.duration, property: prop, value: prop === 'scale' ? 1.0 : 0 }
      ]
    };

    const updatedTracks = [...currentClip.tracks, newTrack];
    const updatedClips = animations.map((clip, idx) => 
      idx === activeClipIndex ? { ...clip, tracks: updatedTracks } : clip
    );

    if (animations.length === 0) {
      onUpdateAnimations([{ ...currentClip, tracks: updatedTracks }]);
    } else {
      onUpdateAnimations(updatedClips);
    }
  };

  // Add keyframe at current time for selected track
  const handleAddKeyframe = (trackId: string) => {
    const updatedTracks = currentClip.tracks.map(track => {
      if (track.id !== trackId) return track;
      const existing = track.keyframes.find(k => Math.abs(k.time - currentTime) < 0.05);
      if (existing) {
        return {
          ...track,
          keyframes: track.keyframes.map(k => k === existing ? { ...k, value: 10 } : k)
        };
      }
      return {
        ...track,
        keyframes: [...track.keyframes, { time: Number(currentTime.toFixed(2)), property: track.property, value: 10 }]
      };
    });

    const updatedClips = animations.map((clip, idx) => 
      idx === activeClipIndex ? { ...clip, tracks: updatedTracks } : clip
    );
    onUpdateAnimations(updatedClips);
  };

  const timeTicks = Array.from({ length: Math.floor(currentClip.duration / 0.2) + 1 }, (_, i) => Number((i * 0.2).toFixed(1)));

  return (
    <div className="w-full h-full flex flex-col bg-[#1e232e] text-slate-200 font-mono text-xs select-none">
      {/* Top Godot Animation Toolbar */}
      <div className="h-8 bg-[#181c25] border-b border-[#2a3242] px-3 flex items-center justify-between">
        {/* Left: Animation Clip Selector & Add Clip */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[#599eff] font-bold">Animation:</span>
          <select
            value={activeClipIndex}
            onChange={(e) => {
              setActiveClipIndex(parseInt(e.target.value));
              setCurrentTime(0);
              setIsPlaying(false);
            }}
            className="bg-[#202531] border border-[#2e3748] rounded px-2 py-0.5 text-[11px] text-white"
          >
            {animations.length > 0 ? (
              animations.map((c, i) => (
                <option key={c.id} value={i}>{c.name} ({c.duration}s)</option>
              ))
            ) : (
              <option value={0}>{currentClip.name} ({currentClip.duration}s)</option>
            )}
          </select>

          <button
            onClick={() => {
              const name = prompt('Animation name:', `anim_${animations.length + 1}`);
              if (name) {
                const newClip: AnimationClip = {
                  id: `clip_${Date.now()}`,
                  name,
                  duration: 2.0,
                  loop: true,
                  step: 0.1,
                  tracks: []
                };
                onUpdateAnimations([...animations, newClip]);
                setActiveClipIndex(animations.length);
              }
            }}
            className="px-2 py-0.5 rounded bg-[#2a3242] hover:bg-[#363f54] text-[11px] text-white flex items-center gap-1 border border-[#3b475e]"
          >
            <Plus className="w-3 h-3 text-[#599eff]" />
            <span>New</span>
          </button>
        </div>

        {/* Center: Transport Controls (Play, Pause, Stop, Loop) */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentTime(0)}
            className="p-1 rounded hover:bg-[#2e3748] text-slate-400 hover:text-white"
            title="First Frame"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-3 py-0.5 rounded font-bold flex items-center gap-1 text-[11px] shadow-sm ${
              isPlaying ? 'bg-amber-600 text-white' : 'bg-[#478cbf] hover:bg-[#599eff] text-white'
            }`}
          >
            {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current" />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>

          <button
            onClick={() => { setIsPlaying(false); setCurrentTime(0); }}
            className="p-1 rounded hover:bg-[#2e3748] text-slate-400 hover:text-white"
            title="Stop Animation"
          >
            <Square className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setLoopMode(loopMode === 'loop' ? 'once' : 'loop')}
            className={`p-1 rounded text-xs flex items-center gap-1 ${
              loopMode === 'loop' ? 'text-[#599eff] bg-[#478cbf]/20 border border-[#478cbf]/40' : 'text-slate-400 hover:text-white'
            }`}
            title="Loop Mode"
          >
            <Repeat className="w-3.5 h-3.5" />
          </button>

          {/* Time Scrubber Display */}
          <div className="flex items-center gap-1 bg-[#151922] px-2 py-0.5 rounded border border-[#2a3242] text-[11px] font-mono">
            <span className="text-white font-bold">{currentTime.toFixed(2)}s</span>
            <span className="text-slate-500">/</span>
            <span className="text-slate-400">{currentClip.duration.toFixed(2)}s</span>
          </div>
        </div>

        {/* Right: Add Track Dropdown */}
        <div className="flex items-center gap-2">
          <div className="text-[10px] text-slate-400">Add Track:</div>
          <select
            onChange={(e) => {
              if (e.target.value) {
                handleAddTrack(e.target.value as any);
                e.target.value = '';
              }
            }}
            className="bg-[#202531] border border-[#2e3748] rounded px-2 py-0.5 text-[11px] text-[#599eff] cursor-pointer"
          >
            <option value="">+ Property Track...</option>
            <option value="position_y">Position Y (Jump/Float)</option>
            <option value="position_x">Position X (Walk/Patrol)</option>
            <option value="position_z">Position Z (3D Depth)</option>
            <option value="rotation">Rotation (Spin/Tilt)</option>
            <option value="scale">Scale (Squash/Stretch)</option>
            <option value="opacity">Opacity (Fade)</option>
          </select>
        </div>
      </div>

      {/* Main Track & Timeline Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Tracks List */}
        <div className="w-64 bg-[#1b202a] border-r border-[#2a3242] flex flex-col shrink-0">
          <div className="h-6 bg-[#151922] border-b border-[#2a3242] px-3 flex items-center text-[10px] text-slate-400 font-bold uppercase">
            Node Tracks ({currentClip.tracks.length})
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-[#2a3242]/60">
            {currentClip.tracks.length === 0 ? (
              <div className="p-4 text-center text-slate-500 text-[11px]">
                No tracks yet. Select a node and add a property track above!
              </div>
            ) : (
              currentClip.tracks.map(track => (
                <div key={track.id} className="h-9 px-3 flex items-center justify-between hover:bg-[#202531]">
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    <Sliders className="w-3.5 h-3.5 text-[#599eff] shrink-0" />
                    <span className="text-[11px] text-white font-semibold truncate">{track.property}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleAddKeyframe(track.id)}
                      className="px-1.5 py-0.5 rounded bg-[#2a3242] hover:bg-[#363f54] text-[10px] text-emerald-400 font-bold"
                      title="Add Keyframe at current time"
                    >
                      +Key
                    </button>
                    <button
                      onClick={() => {
                        const updated = currentClip.tracks.filter(t => t.id !== track.id);
                        onUpdateAnimations(animations.map((c, i) => i === activeClipIndex ? { ...c, tracks: updated } : c));
                      }}
                      className="text-slate-500 hover:text-red-400 p-0.5"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Horizontal Time Ruler & Keyframe Diamonds */}
        <div className="flex-1 flex flex-col overflow-x-auto bg-[#181c25] relative">
          {/* Time Ruler */}
          <div 
            className="h-6 bg-[#151922] border-b border-[#2a3242] relative cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const ratio = Math.max(0, Math.min(1, clickX / rect.width));
              setCurrentTime(Number((ratio * currentClip.duration).toFixed(2)));
            }}
          >
            <div className="flex w-full h-full">
              {timeTicks.map(t => (
                <div 
                  key={t}
                  className="flex-1 border-r border-[#2a3242]/80 text-[9px] text-slate-500 pl-1 pt-0.5 select-none"
                >
                  {t}s
                </div>
              ))}
            </div>

            {/* Red Current Time Cursor Head */}
            <div 
              className="absolute top-0 bottom-0 w-1 bg-red-500 z-20 pointer-events-none transition-all"
              style={{ left: `${(currentTime / currentClip.duration) * 100}%` }}
            >
              <div className="w-2.5 h-2.5 bg-red-500 rotate-45 -ml-1 -mt-1 shadow" />
            </div>
          </div>

          {/* Keyframe Rows */}
          <div className="flex-1 divide-y divide-[#2a3242]/40 relative">
            {currentClip.tracks.map(track => (
              <div key={track.id} className="h-9 relative hover:bg-[#202531]/40">
                {/* Horizontal guide line */}
                <div className="absolute top-1/2 left-0 right-0 h-px bg-[#2a3242]" />

                {/* Keyframe Diamonds */}
                {track.keyframes.map((kf, i) => {
                  const leftPercent = (kf.time / currentClip.duration) * 100;
                  return (
                    <div
                      key={i}
                      className="absolute top-1/2 -mt-1.5 -ml-1.5 w-3 h-3 bg-[#599eff] hover:bg-white rotate-45 cursor-pointer shadow-sm border border-slate-900 transition-colors z-10"
                      style={{ left: `${leftPercent}%` }}
                      title={`${track.property} = ${kf.value} @ ${kf.time}s`}
                      onClick={() => setCurrentTime(kf.time)}
                    />
                  );
                })}
              </div>
            ))}

            {/* Vertical Red Playhead line extending down the entire tracks area */}
            <div 
              className="absolute top-0 bottom-0 w-px bg-red-500/80 pointer-events-none z-10"
              style={{ left: `${(currentTime / currentClip.duration) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
