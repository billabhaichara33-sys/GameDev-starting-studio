import React, { useState, useRef } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Play, 
  Square, 
  Plus, 
  Upload, 
  Sparkles, 
  Sliders, 
  Search, 
  Music, 
  Zap, 
  Download, 
  Tag, 
  Activity, 
  Check, 
  RefreshCw,
  FileMusic,
  ArrowRight
} from 'lucide-react';
import { AudioAsset, GameProject } from '../types';
import { DEFAULT_AUDIO_ASSETS } from '../data/defaultAudioAssets';
import { soundManager } from '../utils/audioSynth';

interface AudioAssetsLibraryProps {
  activeProject?: GameProject | null;
  onSaveSoundToProject?: (sound: AudioAsset) => void;
  onBack?: () => void;
  isEmbedded?: boolean; // When rendered directly inside the dashboard
}

type AudioFilterTab = 'all' | 'sfx' | 'bgm' | 'combat' | 'movement' | 'ui';

export const AudioAssetsLibrary: React.FC<AudioAssetsLibraryProps> = ({
  activeProject,
  onSaveSoundToProject,
  onBack,
  isEmbedded = false
}) => {
  // Combine default library with active project custom sounds
  const [customAssets, setCustomAssets] = useState<AudioAsset[]>(() => {
    return activeProject?.sounds || [];
  });

  const allAssets: AudioAsset[] = [
    ...customAssets,
    ...DEFAULT_AUDIO_ASSETS.filter(def => !customAssets.some(c => c.id === def.id))
  ];

  const [activeFilter, setActiveFilter] = useState<AudioFilterTab>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(soundManager.getMuted());
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  // Procedural Sound Generator States
  const [showGenerator, setShowGenerator] = useState<boolean>(false);
  const [genName, setGenName] = useState<string>('Custom 8-Bit Synth');
  const [genCategory, setGenCategory] = useState<AudioAsset['category']>('laser');
  const [genWave, setGenWave] = useState<AudioAsset['wave']>('sawtooth');
  const [genFreq, setGenFreq] = useState<number>(660);
  const [genDuration, setGenDuration] = useState<number>(0.2);
  const [genPitchDrop, setGenPitchDrop] = useState<number>(-400);
  const [genVolume, setGenVolume] = useState<number>(0.3);
  const [genBus, setGenBus] = useState<'Master' | 'Music' | 'SFX'>('SFX');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Play an asset
  const handlePlayAsset = (asset: AudioAsset) => {
    setPlayingId(asset.id);
    soundManager.playAsset(asset);
    setTimeout(() => {
      setPlayingId(null);
    }, Math.max(250, asset.duration * 1000));
  };

  // Toggle Global Mute
  const handleToggleMute = () => {
    const next = !isMuted;
    soundManager.setMuted(next);
    setIsMuted(next);
  };

  // Add asset to active project
  const handleAddToProject = (asset: AudioAsset) => {
    onSaveSoundToProject?.(asset);
    setAddedIds(prev => new Set(prev).add(asset.id));
    soundManager.playCoin();
    setTimeout(() => {
      setAddedIds(prev => {
        const next = new Set(prev);
        next.delete(asset.id);
        return next;
      });
    }, 2000);
  };

  // Generate random preset
  const handleRandomizeSynth = () => {
    const waves: AudioAsset['wave'][] = ['square', 'sawtooth', 'triangle', 'sine'];
    const cats: AudioAsset['category'][] = ['jump', 'laser', 'explosion', 'coin', 'hit', 'powerup', 'ui'];
    const randomWave = waves[Math.floor(Math.random() * waves.length)];
    const randomCat = cats[Math.floor(Math.random() * cats.length)];
    const randomFreq = Math.round(100 + Math.random() * 1200);
    const randomDuration = Number((0.08 + Math.random() * 0.4).toFixed(2));
    const randomPitchDrop = Math.round((Math.random() - 0.6) * 1200);

    setGenWave(randomWave);
    setGenCategory(randomCat);
    setGenFreq(randomFreq);
    setGenDuration(randomDuration);
    setGenPitchDrop(randomPitchDrop);
    setGenName(`Arcade ${randomCat.toUpperCase()} ${randomFreq}Hz`);

    // Preview instantly
    soundManager.playCustomSynth(randomWave, randomFreq, randomDuration, randomPitchDrop, genVolume);
  };

  // Save generated sound
  const handleSaveGeneratedSound = () => {
    const newSound: AudioAsset = {
      id: `snd_custom_${Date.now()}`,
      name: genName.trim() || 'Custom Sound Effect',
      category: genCategory,
      wave: genWave,
      frequency: genFreq,
      duration: genDuration,
      pitchDrop: genPitchDrop,
      volume: genVolume,
      bus: genBus,
      tags: ['custom', genCategory, genWave]
    };

    setCustomAssets(prev => [newSound, ...prev]);
    onSaveSoundToProject?.(newSound);
    setShowGenerator(false);
    soundManager.playCoin();
  };

  // Upload custom audio file (.wav, .mp3, .ogg)
  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (!dataUrl) return;

      const uploadedSound: AudioAsset = {
        id: `snd_upload_${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, ''),
        category: 'sfx' as any,
        wave: 'sine',
        frequency: 440,
        duration: 1.0,
        pitchDrop: 0,
        volume: 0.5,
        bus: file.name.toLowerCase().includes('bgm') || file.name.toLowerCase().includes('music') ? 'Music' : 'SFX',
        audioUrl: dataUrl,
        tags: ['uploaded', file.type]
      };

      setCustomAssets(prev => [uploadedSound, ...prev]);
      onSaveSoundToProject?.(uploadedSound);
      soundManager.playCoin();
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Filter & Search
  const filteredAssets = allAssets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (asset.tags && asset.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));

    if (!matchesSearch) return false;

    if (activeFilter === 'all') return true;
    if (activeFilter === 'sfx') return asset.category !== 'bgm' && asset.category !== 'ambient';
    if (activeFilter === 'bgm') return asset.category === 'bgm' || asset.category === 'ambient';
    if (activeFilter === 'combat') return ['laser', 'hit', 'explosion'].includes(asset.category);
    if (activeFilter === 'movement') return ['jump', 'step'].includes(asset.category);
    if (activeFilter === 'ui') return ['ui', 'coin', 'win', 'powerup'].includes(asset.category);
    return true;
  });

  return (
    <div className={`w-full ${isEmbedded ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'} space-y-6 text-slate-100 font-sans`}>
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-[#161b26] border border-[#273247] rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#478cbf]/15 border border-[#478cbf]/30 text-[#599eff] text-xs font-mono">
            <Volume2 className="w-3.5 h-3.5" />
            <span>Audio Bus Synthesizer & Sound Asset Library</span>
          </div>
          <h2 className="text-2xl font-bold text-white font-['Space_Grotesk'] tracking-tight flex items-center gap-3">
            <span>Audio Assets & Sound Effects</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#202838] border border-[#2f3c55] font-mono text-slate-300 font-normal">
              {allAssets.length} Assets Available
            </span>
          </h2>
          <p className="text-xs text-slate-400 max-w-2xl">
            Real-time Web Audio API synthesizer, retro chiptune SFX, background music themes, and custom audio clip importer ready for Godot 2D & 3D projects.
          </p>
        </div>

        {/* Global Controls & Actions */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {/* Mute Toggle */}
          <button
            onClick={handleToggleMute}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              isMuted 
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-300' 
                : 'bg-[#202736] border-[#2e3b52] text-slate-300 hover:text-white'
            }`}
            title="Toggle Engine Audio Output"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
            <span>{isMuted ? 'Muted' : 'Sound On'}</span>
          </button>

          {/* New Custom Synth Button */}
          <button
            onClick={() => setShowGenerator(!showGenerator)}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-600/20 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{showGenerator ? 'Close Synth' : 'Create Custom SFX'}</span>
          </button>

          {/* File Upload Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-1.5 rounded-xl bg-[#202736] hover:bg-[#2b3548] border border-[#2f3c55] text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-400" />
            <span>Import Audio</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".wav,.mp3,.ogg"
            onChange={handleAudioUpload}
            className="hidden"
          />

          {/* Back Button if not embedded */}
          {!isEmbedded && onBack && (
            <button
              onClick={onBack}
              className="px-3.5 py-1.5 rounded-xl bg-[#202736] hover:bg-[#2b3548] text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Back to Engine
            </button>
          )}
        </div>
      </div>

      {/* Procedural Sound Synthesizer Drawer (Collapsible) */}
      {showGenerator && (
        <div className="p-5 bg-[#171d29] border border-[#2b374c] rounded-2xl shadow-xl space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-[#283245] pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                <Sliders className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white font-['Space_Grotesk']">
                Procedural Sound Synthesizer
              </h3>
            </div>

            <button
              onClick={handleRandomizeSynth}
              className="px-2.5 py-1 rounded-lg bg-[#202736] hover:bg-[#2b3447] text-[#599eff] text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Randomize Preset</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Sound Name */}
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 font-mono">Sound Name</label>
              <input
                type="text"
                value={genName}
                onChange={e => setGenName(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-[#12151e] border border-[#263143] text-white text-xs outline-none focus:border-[#478cbf]"
              />
            </div>

            {/* Waveform */}
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 font-mono">Oscillator Waveform</label>
              <select
                value={genWave}
                onChange={e => setGenWave(e.target.value as any)}
                className="w-full px-3 py-1.5 rounded-lg bg-[#12151e] border border-[#263143] text-white text-xs outline-none focus:border-[#478cbf] cursor-pointer"
              >
                <option value="square">Square (8-Bit Classic Arcade)</option>
                <option value="sawtooth">Sawtooth (Crisp / Lasers)</option>
                <option value="triangle">Triangle (Deep Melodic / Bass)</option>
                <option value="sine">Sine (Pure / Bells & Coins)</option>
              </select>
            </div>

            {/* Base Frequency */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>Base Frequency</span>
                <span className="text-[#599eff] font-bold">{genFreq} Hz</span>
              </div>
              <input
                type="range"
                min="60"
                max="1800"
                step="10"
                value={genFreq}
                onChange={e => setGenFreq(Number(e.target.value))}
                className="w-full accent-[#478cbf] cursor-pointer"
              />
            </div>

            {/* Duration */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>Duration</span>
                <span className="text-[#599eff] font-bold">{genDuration}s</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="1.5"
                step="0.05"
                value={genDuration}
                onChange={e => setGenDuration(Number(e.target.value))}
                className="w-full accent-[#478cbf] cursor-pointer"
              />
            </div>

            {/* Pitch Sweep Drop */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>Pitch Drop / Sweep</span>
                <span className="text-amber-400 font-bold">{genPitchDrop > 0 ? `+${genPitchDrop}` : genPitchDrop} Hz</span>
              </div>
              <input
                type="range"
                min="-1000"
                max="1000"
                step="20"
                value={genPitchDrop}
                onChange={e => setGenPitchDrop(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Volume */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>Volume Gain</span>
                <span className="text-emerald-400 font-bold">{Math.round(genVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.8"
                step="0.05"
                value={genVolume}
                onChange={e => setGenVolume(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* Bus Channel */}
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 font-mono">Audio Bus Channel</label>
              <select
                value={genBus}
                onChange={e => setGenBus(e.target.value as any)}
                className="w-full px-3 py-1.5 rounded-lg bg-[#12151e] border border-[#263143] text-white text-xs outline-none cursor-pointer"
              >
                <option value="SFX">SFX Bus</option>
                <option value="Music">Music Bus</option>
                <option value="Master">Master Bus</option>
              </select>
            </div>

            {/* Category */}
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 font-mono">Category</label>
              <select
                value={genCategory}
                onChange={e => setGenCategory(e.target.value as any)}
                className="w-full px-3 py-1.5 rounded-lg bg-[#12151e] border border-[#263143] text-white text-xs outline-none cursor-pointer"
              >
                <option value="laser">Laser / Weapon</option>
                <option value="jump">Jump / Movement</option>
                <option value="coin">Coin / Item</option>
                <option value="explosion">Explosion / Blast</option>
                <option value="hit">Hit / Combat</option>
                <option value="powerup">Powerup</option>
                <option value="ui">UI Blip</option>
              </select>
            </div>
          </div>

          {/* Test & Save Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#283245]">
            <button
              onClick={() => soundManager.playCustomSynth(genWave, genFreq, genDuration, genPitchDrop, genVolume)}
              className="px-4 py-1.5 rounded-lg bg-[#202736] hover:bg-[#2b3548] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current text-emerald-400" />
              <span>Test Sound</span>
            </button>

            <button
              onClick={handleSaveGeneratedSound}
              className="px-4 py-1.5 rounded-lg bg-[#478cbf] hover:bg-[#599eff] text-white text-xs font-bold flex items-center gap-1.5 shadow transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Save to Audio Library</span>
            </button>
          </div>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Category Filters */}
        <div className="flex items-center gap-1 bg-[#161b26] p-1 rounded-xl border border-[#273247] overflow-x-auto">
          {[
            { id: 'all', label: 'All Audio', icon: Activity },
            { id: 'sfx', label: 'Sound FX', icon: Zap },
            { id: 'bgm', label: 'Music & Ambience', icon: Music },
            { id: 'combat', label: 'Combat & Lasers', icon: Sparkles },
            { id: 'movement', label: 'Movement', icon: Tag },
            { id: 'ui', label: 'UI & Pickups', icon: FileMusic }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#478cbf] text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-[#202838]'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search audio by name or #tag..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#161b26] border border-[#273247] text-white text-xs outline-none focus:border-[#478cbf] placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Audio Assets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredAssets.map(asset => {
          const isPlaying = playingId === asset.id;
          const isAdded = addedIds.has(asset.id);

          return (
            <div
              key={asset.id}
              className={`p-4 rounded-xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                isPlaying 
                  ? 'bg-[#1b2538] border-[#599eff] shadow-lg shadow-[#478cbf]/20' 
                  : 'bg-[#161b26] border-[#252f44] hover:border-[#354360] hover:bg-[#191f2c]'
              }`}
            >
              {/* Animated Waveform Accent during playback */}
              {isPlaying && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#478cbf] via-emerald-400 to-[#599eff] animate-pulse" />
              )}

              <div>
                {/* Header row: Play Button + Sound Name */}
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => handlePlayAsset(asset)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-md transition-transform active:scale-95 cursor-pointer ${
                      isPlaying
                        ? 'bg-emerald-500 text-white animate-pulse'
                        : 'bg-[#222b3d] hover:bg-[#2c374d] text-[#599eff] border border-[#33415c]'
                    }`}
                    title="Preview Sound"
                  >
                    {isPlaying ? (
                      <Square className="w-4 h-4 fill-current" />
                    ) : (
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-white truncate font-['Space_Grotesk']">
                        {asset.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="px-1.5 py-0.2 rounded bg-[#202838] border border-[#2b374c] text-[10px] font-mono text-[#599eff] uppercase">
                        {asset.category}
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-[#202838] border border-[#2b374c] text-[10px] font-mono text-slate-400">
                        {asset.bus || 'SFX'}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {asset.duration}s
                      </span>
                    </div>
                  </div>
                </div>

                {/* Wave & Freq Specs */}
                <div className="mt-3 py-1.5 px-2.5 rounded-lg bg-[#11151e] border border-[#1f2637] flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span className="capitalize">{asset.wave} Wave</span>
                  <span className="text-slate-500">{asset.frequency} Hz</span>
                  <span className="text-slate-500">Vol {Math.round(asset.volume * 100)}%</span>
                </div>

                {/* Tags */}
                {asset.tags && asset.tags.length > 0 && (
                  <div className="flex items-center gap-1 mt-2 flex-wrap">
                    {asset.tags.map(tag => (
                      <span key={tag} className="text-[10px] text-slate-500 font-mono">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-[#232b3d] flex items-center justify-between">
                <button
                  onClick={() => handlePlayAsset(asset)}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Play className="w-3 h-3 text-[#599eff]" />
                  <span>Play</span>
                </button>

                <button
                  onClick={() => handleAddToProject(asset)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                    isAdded
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#202838] hover:bg-[#2c374d] text-slate-200 border border-[#2f3b52]'
                  }`}
                  title="Assign to Active Game Project"
                >
                  {isAdded ? (
                    <>
                      <Check className="w-3 h-3 stroke-[3]" />
                      <span>Added!</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3 h-3 text-[#599eff]" />
                      <span>Use in Project</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
