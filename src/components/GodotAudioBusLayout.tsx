import React, { useState, useEffect } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Plus, 
  Trash2, 
  Sliders, 
  Activity, 
  Play, 
  Sparkles,
  Layers,
  ChevronDown
} from 'lucide-react';
import { GodotAudioBus } from '../types';
import { soundManager } from '../utils/audioSynth';

interface GodotAudioBusLayoutProps {
  buses?: GodotAudioBus[];
  onUpdateBuses?: (buses: GodotAudioBus[]) => void;
}

const DEFAULT_BUSES: GodotAudioBus[] = [
  { name: 'Master', volumeDb: 0, mute: false, solo: false },
  { name: 'Music (BGM)', volumeDb: -4, mute: false, solo: false },
  { name: 'SFX', volumeDb: 0, mute: false, solo: false },
  { name: 'UI / Voices', volumeDb: -2, mute: false, solo: false }
];

export const GodotAudioBusLayout: React.FC<GodotAudioBusLayoutProps> = ({
  buses = DEFAULT_BUSES,
  onUpdateBuses
}) => {
  const [activeBuses, setActiveBuses] = useState<GodotAudioBus[]>(buses.length > 0 ? buses : DEFAULT_BUSES);
  const [meterLevels, setMeterLevels] = useState<number[]>([65, 45, 80, 20]);
  const [effectsMap, setEffectsMap] = useState<Record<string, string[]>>({
    'Master': ['Limiter', 'Soft Clipper'],
    'Music (BGM)': ['HighPassFilter', 'StereoEnhance'],
    'SFX': ['ReverbRoom'],
    'UI / Voices': ['Compressor']
  });

  // Animated VU meters to simulate real engine audio processing
  useEffect(() => {
    const interval = setInterval(() => {
      setMeterLevels(prev => prev.map((level, idx) => {
        const bus = activeBuses[idx];
        if (bus?.mute) return 0;
        const noise = Math.random() * 25 - 12;
        const base = Math.max(0, Math.min(95, 50 + (bus ? bus.volumeDb * 3 : 0) + noise));
        return base;
      }));
    }, 120);

    return () => clearInterval(interval);
  }, [activeBuses]);

  const handleUpdateBus = (index: number, updates: Partial<GodotAudioBus>) => {
    const updated = activeBuses.map((b, i) => i === index ? { ...b, ...updates } : b);
    setActiveBuses(updated);
    if (onUpdateBuses) onUpdateBuses(updated);
  };

  const handleAddEffect = (busName: string) => {
    const effect = prompt('Enter Audio Effect to add (e.g. Reverb, Delay, Chorus, EQ, PitchShift, Distortion):', 'Reverb');
    if (effect) {
      setEffectsMap(prev => ({
        ...prev,
        [busName]: [...(prev[busName] || []), effect]
      }));
    }
  };

  const handleRemoveEffect = (busName: string, effectIndex: number) => {
    setEffectsMap(prev => ({
      ...prev,
      [busName]: prev[busName].filter((_, i) => i !== effectIndex)
    }));
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#1a1e27] text-slate-200 font-mono text-xs select-none">
      {/* Top Godot Audio Header */}
      <div className="h-8 bg-[#151820] border-b border-[#283040] px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#599eff]" />
          <span className="font-bold text-white text-[11px] uppercase tracking-wider font-sans">
            Godot Audio Bus Mixer
          </span>
          <span className="text-[10px] text-slate-400 font-mono">({activeBuses.length} Active Channels)</span>
        </div>

        {/* Quick Test Audio Generators */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400">Preview Synth:</span>
          <button
            onClick={() => soundManager.playLaser()}
            className="px-2 py-0.5 rounded bg-[#202531] hover:bg-[#2c3444] text-[10px] text-sky-400 border border-[#2e3748]"
          >
            SFX Laser
          </button>
          <button
            onClick={() => soundManager.playCoin()}
            className="px-2 py-0.5 rounded bg-[#202531] hover:bg-[#2c3444] text-[10px] text-amber-400 border border-[#2e3748]"
          >
            SFX Coin
          </button>
          <button
            onClick={() => soundManager.playExplosion()}
            className="px-2 py-0.5 rounded bg-[#202531] hover:bg-[#2c3444] text-[10px] text-red-400 border border-[#2e3748]"
          >
            SFX Hit
          </button>
          <button
            onClick={() => {
              const name = prompt('New Audio Bus Name:', `Bus_${activeBuses.length + 1}`);
              if (name) {
                const updated = [...activeBuses, { name, volumeDb: 0, mute: false, solo: false }];
                setActiveBuses(updated);
                if (onUpdateBuses) onUpdateBuses(updated);
              }
            }}
            className="px-2 py-0.5 rounded bg-[#478cbf] hover:bg-[#599eff] text-white text-[10px] font-bold flex items-center gap-1 shadow-sm"
          >
            <Plus className="w-3 h-3" />
            <span>Add Bus</span>
          </button>
        </div>
      </div>

      {/* Audio Buses Faders Strip */}
      <div className="flex-1 p-3 flex gap-3 overflow-x-auto items-stretch bg-[#151922]">
        {activeBuses.map((bus, idx) => {
          const level = meterLevels[idx] || 0;
          const busEffects = effectsMap[bus.name] || [];

          return (
            <div 
              key={bus.name + idx}
              className="w-48 bg-[#1e232e] border border-[#2e3748] rounded-lg p-2.5 flex flex-col justify-between shrink-0 shadow-lg"
            >
              {/* Bus Header */}
              <div className="border-b border-[#2e3748] pb-1.5 flex items-center justify-between">
                <span className="font-bold text-white text-[11px] truncate">{bus.name}</span>
                <span className="text-[10px] font-mono text-[#599eff]">
                  {bus.volumeDb > 0 ? `+${bus.volumeDb}` : bus.volumeDb} dB
                </span>
              </div>

              {/* Fader & Dual VU Meter Channel */}
              <div className="flex-1 py-3 flex items-center justify-center gap-3">
                {/* Vertical Slider Fader */}
                <div className="flex flex-col items-center gap-1 h-36 justify-center">
                  <span className="text-[8px] text-slate-500">+6</span>
                  <input
                    type="range"
                    min="-40"
                    max="6"
                    step="1"
                    value={bus.volumeDb}
                    onChange={e => handleUpdateBus(idx, { volumeDb: parseFloat(e.target.value) })}
                    className="h-28 w-1.5 accent-[#599eff] cursor-pointer"
                    style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
                  />
                  <span className="text-[8px] text-slate-500">-40</span>
                </div>

                {/* Vertical LED Peak Meter */}
                <div className="w-3.5 h-32 bg-black/60 rounded border border-[#2e3748] p-0.5 flex flex-col-reverse overflow-hidden">
                  <div 
                    className="w-full transition-all duration-100 rounded-xs"
                    style={{
                      height: `${bus.mute ? 0 : level}%`,
                      background: level > 85 ? '#ef4444' : level > 70 ? '#f59e0b' : '#10b981'
                    }}
                  />
                </div>
              </div>

              {/* Mute, Solo, Bypass Toggles */}
              <div className="grid grid-cols-3 gap-1 pt-2 border-t border-[#2e3748]">
                <button
                  onClick={() => handleUpdateBus(idx, { solo: !bus.solo })}
                  className={`py-1 rounded text-[10px] font-bold uppercase transition-colors ${
                    bus.solo ? 'bg-amber-500 text-black font-extrabold' : 'bg-[#283040] text-slate-400 hover:text-white'
                  }`}
                  title="Solo Channel"
                >
                  S
                </button>
                <button
                  onClick={() => handleUpdateBus(idx, { mute: !bus.mute })}
                  className={`py-1 rounded text-[10px] font-bold uppercase transition-colors ${
                    bus.mute ? 'bg-red-600 text-white font-extrabold' : 'bg-[#283040] text-slate-400 hover:text-white'
                  }`}
                  title="Mute Channel"
                >
                  M
                </button>
                <button
                  onClick={() => handleUpdateBus(idx, { bypassEffects: !bus.bypassEffects })}
                  className={`py-1 rounded text-[10px] font-bold uppercase transition-colors ${
                    bus.bypassEffects ? 'bg-purple-600 text-white font-extrabold' : 'bg-[#283040] text-slate-400 hover:text-white'
                  }`}
                  title="Bypass Audio Effects"
                >
                  B
                </button>
              </div>

              {/* Effects List */}
              <div className="mt-2 pt-2 border-t border-[#2e3748]/60 space-y-1">
                <div className="flex items-center justify-between text-[9px] text-slate-400 uppercase font-bold">
                  <span>Effects ({busEffects.length})</span>
                  <button 
                    onClick={() => handleAddEffect(bus.name)}
                    className="hover:text-sky-400"
                  >
                    + Add
                  </button>
                </div>
                <div className="space-y-0.5 max-h-16 overflow-y-auto">
                  {busEffects.map((eff, effIdx) => (
                    <div key={effIdx} className="flex items-center justify-between px-1.5 py-0.5 bg-[#151922] rounded text-[10px] text-slate-300">
                      <span className="truncate">{eff}</span>
                      <button 
                        onClick={() => handleRemoveEffect(bus.name, effIdx)}
                        className="text-slate-500 hover:text-red-400 ml-1"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
