import React, { useState } from 'react';
import { 
  Volume2, 
  Play, 
  VolumeX, 
  Upload, 
  Plus, 
  Trash2, 
  Sliders, 
  ChevronLeft,
  Sparkles,
  Music,
  Check
} from 'lucide-react';
import { soundManager } from '../utils/audioSynth';
import { AudioAsset } from '../types';

interface AudioManagerProps {
  onBack: () => void;
  onSaveSound?: (sound: AudioAsset) => void;
  projectSounds?: AudioAsset[];
}

export const AudioManager: React.FC<AudioManagerProps> = ({
  onBack,
  onSaveSound,
  projectSounds = []
}) => {
  const [isMuted, setIsMuted] = useState<boolean>(soundManager.getMuted());
  const [soundName, setSoundName] = useState<string>('Super Laser');
  const [category, setCategory] = useState<AudioAsset['category']>('laser');
  const [wave, setWave] = useState<AudioAsset['wave']>('sawtooth');
  const [frequency, setFrequency] = useState<number>(880);
  const [duration, setDuration] = useState<number>(0.18);
  const [pitchDrop, setPitchDrop] = useState<number>(-500);
  const [volume, setVolume] = useState<number>(0.3);

  const toggleMute = () => {
    const next = !isMuted;
    soundManager.setMuted(next);
    setIsMuted(next);
  };

  const handleTestCustom = () => {
    soundManager.playCustomSynth(wave, frequency, duration, pitchDrop, volume);
  };

  const handleSaveSoundAsset = () => {
    const asset: AudioAsset = {
      id: `sound-${Date.now()}`,
      name: soundName || 'Custom FX',
      category,
      wave,
      frequency,
      duration,
      pitchDrop,
      volume
    };
    onSaveSound?.(asset);
  };

  const applyPreset = (type: 'jump' | 'coin' | 'laser' | 'explosion' | 'hit' | 'win') => {
    if (type === 'jump') {
      setSoundName('Hero High Jump');
      setCategory('jump');
      setWave('square');
      setFrequency(180);
      setPitchDrop(400);
      setDuration(0.18);
      soundManager.playJump();
    } else if (type === 'coin') {
      setSoundName('Gold Coin Chime');
      setCategory('coin');
      setWave('sine');
      setFrequency(987);
      setPitchDrop(300);
      setDuration(0.3);
      soundManager.playCoin();
    } else if (type === 'laser') {
      setSoundName('Plasma Laser');
      setCategory('laser');
      setWave('sawtooth');
      setFrequency(900);
      setPitchDrop(-600);
      setDuration(0.15);
      soundManager.playLaser();
    } else if (type === 'explosion') {
      setSoundName('Boss Boom');
      setCategory('explosion');
      setWave('square');
      setFrequency(100);
      setPitchDrop(-60);
      setDuration(0.35);
      soundManager.playExplosion();
    } else if (type === 'hit') {
      setSoundName('Damage Crunch');
      setCategory('hit');
      setWave('sawtooth');
      setFrequency(240);
      setPitchDrop(-160);
      setDuration(0.12);
      soundManager.playHit();
    } else if (type === 'win') {
      setSoundName('Victory Chime');
      setCategory('win');
      setWave('triangle');
      setFrequency(523);
      setPitchDrop(523);
      setDuration(0.4);
      soundManager.playWin();
    }
  };

  return (
    <div id="audio-manager-root" className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <button
            id="btn-audio-back"
            onClick={onBack}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-white font-['Space_Grotesk'] flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-cyan-400" />
              <span>8-Bit Sound & Music Studio</span>
            </h2>
            <p className="text-xs text-slate-400">Synthesize retro arcade sound effects or import custom tracks</p>
          </div>
        </div>

        <button
          id="btn-toggle-sound-mute"
          onClick={toggleMute}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 border cursor-pointer ${isMuted ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-slate-800 text-slate-300 border-slate-700'}`}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          <span>{isMuted ? 'Muted' : 'Audio On'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Preset Library */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Arcade Sound Presets</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              {[
                { name: 'Jump', icon: '🏃', type: 'jump' },
                { name: 'Coin Chime', icon: '🪙', type: 'coin' },
                { name: 'Laser Beam', icon: '⚡', type: 'laser' },
                { name: 'Explosion', icon: '💥', type: 'explosion' },
                { name: 'Hit Hurt', icon: '🛡️', type: 'hit' },
                { name: 'Victory Tune', icon: '🏆', type: 'win' },
              ].map((item) => (
                <button
                  key={item.name}
                  id={`btn-preset-${item.type}`}
                  onClick={() => applyPreset(item.type as any)}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/40 text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl">{item.icon}</span>
                    <Play className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 fill-current" />
                  </div>
                  <div className="text-xs font-bold text-white mt-2 group-hover:text-cyan-300">{item.name}</div>
                  <div className="text-[10px] text-slate-400">Click to listen & load</div>
                </button>
              ))}
            </div>

            {/* Project Audio Assets List */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <h4 className="text-xs font-semibold text-slate-400">Project Sound Effects ({projectSounds.length})</h4>
              {projectSounds.length === 0 ? (
                <div className="text-xs text-slate-400 italic py-2">
                  No custom sounds added to this project yet. Use the synthesizer on the right to create one!
                </div>
              ) : (
                <div className="space-y-2">
                  {projectSounds.map((snd) => (
                    <div key={snd.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                      <div className="flex items-center gap-2">
                        <Music className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="text-white font-medium">{snd.name}</span>
                        <span className="text-[10px] text-slate-400 uppercase">({snd.wave})</span>
                      </div>
                      <button
                        onClick={() => soundManager.playCustomSynth(snd.wave, snd.frequency, snd.duration, snd.pitchDrop, snd.volume)}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 cursor-pointer"
                      >
                        <Play className="w-3 h-3 fill-current" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Synthesizer Rack */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>Custom Synth Generator</span>
              </h3>
              <button
                id="btn-test-synth"
                onClick={handleTestCustom}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Test Sound</span>
              </button>
            </div>

            {/* Sound Name input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Sound Name</label>
              <input
                id="input-sound-name"
                type="text"
                value={soundName}
                onChange={(e) => setSoundName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Waveform Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Oscillator Waveform</label>
              <div className="grid grid-cols-4 gap-2">
                {(['square', 'sine', 'sawtooth', 'triangle'] as const).map((w) => (
                  <button
                    key={w}
                    onClick={() => setWave(w)}
                    className={`py-2 px-2 rounded-lg text-xs font-mono capitalize border cursor-pointer ${wave === w ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'}`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>

            {/* Sliders Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Base Frequency</span>
                  <span className="font-mono text-cyan-400">{frequency} Hz</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="1600"
                  step="20"
                  value={frequency}
                  onChange={(e) => setFrequency(Number(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Duration</span>
                  <span className="font-mono text-cyan-400">{duration.toFixed(2)} s</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="1.0"
                  step="0.05"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Pitch Bend (Glide)</span>
                  <span className="font-mono text-cyan-400">{pitchDrop} Hz</span>
                </div>
                <input
                  type="range"
                  min="-800"
                  max="800"
                  step="50"
                  value={pitchDrop}
                  onChange={(e) => setPitchDrop(Number(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Volume</span>
                  <span className="font-mono text-cyan-400">{Math.round(volume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.8"
                  step="0.05"
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                id="btn-save-sound-to-project"
                onClick={handleSaveSoundAsset}
                className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center gap-2 shadow-md shadow-cyan-600/20 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Save Sound to Project</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
