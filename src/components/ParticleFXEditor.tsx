import React, { useState, useRef, useEffect } from 'react';
import { GameProject, ParticleEmitterConfig } from '../types';
import { Sparkles, Flame, Zap, Play, Check, RefreshCw, Wand2 } from 'lucide-react';

interface ParticleFXEditorProps {
  project: GameProject;
  onUpdateProject: (project: GameProject) => void;
}

const PRESETS: { name: string; icon: string; config: ParticleEmitterConfig }[] = [
  {
    name: 'Campfire Torch',
    icon: '🔥',
    config: {
      enabled: true,
      type: 'fountain',
      count: 25,
      rate: 35,
      speed: 2.5,
      spreadAngle: 40,
      color: '#f97316',
      endColor: '#ef4444',
      lifetime: 35,
      gravityY: -0.05,
      size: 4
    }
  },
  {
    name: 'Magic Gold Sparkles',
    icon: '✨',
    config: {
      enabled: true,
      type: 'burst',
      count: 40,
      rate: 20,
      speed: 3,
      spreadAngle: 360,
      color: '#facc15',
      endColor: '#fbbf24',
      lifetime: 45,
      gravityY: 0.04,
      size: 3
    }
  },
  {
    name: 'Rocket Jet Exhaust',
    icon: '🚀',
    config: {
      enabled: true,
      type: 'stream',
      count: 30,
      rate: 50,
      speed: 4.5,
      spreadAngle: 25,
      color: '#38bdf8',
      endColor: '#818cf8',
      lifetime: 25,
      gravityY: 0,
      size: 3
    }
  },
  {
    name: 'Explosion Blast',
    icon: '💥',
    config: {
      enabled: true,
      type: 'explosion',
      count: 60,
      rate: 60,
      speed: 6,
      spreadAngle: 360,
      color: '#ef4444',
      endColor: '#f59e0b',
      lifetime: 40,
      gravityY: 0.1,
      size: 5
    }
  }
];

export const ParticleFXEditor: React.FC<ParticleFXEditorProps> = ({ project, onUpdateProject }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [config, setConfig] = useState<ParticleEmitterConfig>(PRESETS[0].config);
  const [selectedEntityId, setSelectedEntityId] = useState<string>(
    project.entities[0]?.id || ''
  );
  const [attachedSuccess, setAttachedSuccess] = useState(false);

  // Live particle simulation state
  const particlesRef = useRef<{ x: number; y: number; vx: number; vy: number; life: number; maxLife: number; color: string; size: number }[]>([]);

  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    const loop = () => {
      // Spawn new particles according to rate
      if (config.enabled && Math.random() < config.rate / 60) {
        const angleRad = (Math.random() - 0.5) * (config.spreadAngle * Math.PI / 180);
        const spd = config.speed * (0.8 + Math.random() * 0.4);
        particlesRef.current.push({
          x: centerX,
          y: centerY,
          vx: Math.sin(angleRad) * spd,
          vy: -Math.cos(angleRad) * spd,
          life: config.lifetime,
          maxLife: config.lifetime,
          color: config.color,
          size: config.size
        });
      }

      // Clear
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid crosshair
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(centerX, 0); ctx.lineTo(centerX, canvas.height);
      ctx.moveTo(0, centerY); ctx.lineTo(canvas.width, centerY);
      ctx.stroke();

      // Draw Emitter Source Point
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = config.color;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Update & Draw Particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += config.gravityY;
        p.life--;

        const alpha = Math.max(0, p.life / p.maxLife);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (p.life <= 0) {
          particlesRef.current.splice(i, 1);
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [config]);

  const handleApplyToEntity = () => {
    if (!selectedEntityId) return;
    onUpdateProject({
      ...project,
      entities: project.entities.map(e =>
        e.id === selectedEntityId
          ? { ...e, particleEmitter: { ...config } }
          : e
      )
    });
    setAttachedSuccess(true);
    setTimeout(() => setAttachedSuccess(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
      {/* Top Header */}
      <div className="h-14 px-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <div>
            <h2 className="text-sm font-bold text-white font-['Space_Grotesk']">Particle FX & Juice Synthesizer</h2>
            <p className="text-[11px] text-slate-400">Simulate real-time particle physics and attach them to game characters</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            id="select-particle-target-entity"
            value={selectedEntityId}
            onChange={(e) => setSelectedEntityId(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
          >
            {project.entities.map(ent => (
              <option key={ent.id} value={ent.id}>
                Attach to: {ent.name} ({ent.type})
              </option>
            ))}
          </select>

          <button
            id="btn-apply-particles-entity"
            onClick={handleApplyToEntity}
            className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
          >
            {attachedSuccess ? <Check className="w-4 h-4 text-emerald-950" /> : <Wand2 className="w-4 h-4" />}
            <span>{attachedSuccess ? 'Attached Successfully!' : 'Attach Emitter to Entity'}</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Controls */}
        <div className="w-80 border-r border-slate-800 bg-slate-900/40 p-5 overflow-y-auto flex flex-col gap-5">
          {/* Presets */}
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">Emitter Presets</div>
            <div className="grid grid-cols-2 gap-2">
              {PRESETS.map(p => (
                <button
                  key={p.name}
                  id={`preset-${p.name.replace(/\s+/g, '-').toLowerCase()}`}
                  onClick={() => setConfig({ ...p.config })}
                  className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800 hover:border-amber-500/50 text-left transition-all cursor-pointer"
                >
                  <div className="text-lg mb-1">{p.icon}</div>
                  <div className="text-xs font-bold text-slate-200">{p.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono capitalize">{p.config.type}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Parameters */}
          <div className="space-y-4">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Emitter Parameters</div>

            {/* Emission Rate */}
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Emission Rate</span>
                <span className="font-mono text-amber-400">{config.rate} /s</span>
              </div>
              <input
                id="slider-particle-rate"
                type="range"
                min="5"
                max="80"
                value={config.rate}
                onChange={(e) => setConfig({ ...config, rate: Number(e.target.value) })}
                className="w-full accent-amber-500"
              />
            </div>

            {/* Initial Speed */}
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Velocity Speed</span>
                <span className="font-mono text-amber-400">{config.speed} px/frame</span>
              </div>
              <input
                id="slider-particle-speed"
                type="range"
                min="1"
                max="10"
                step="0.5"
                value={config.speed}
                onChange={(e) => setConfig({ ...config, speed: Number(e.target.value) })}
                className="w-full accent-amber-500"
              />
            </div>

            {/* Spread Angle */}
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Spread Angle</span>
                <span className="font-mono text-amber-400">{config.spreadAngle}°</span>
              </div>
              <input
                id="slider-particle-spread"
                type="range"
                min="10"
                max="360"
                value={config.spreadAngle}
                onChange={(e) => setConfig({ ...config, spreadAngle: Number(e.target.value) })}
                className="w-full accent-amber-500"
              />
            </div>

            {/* Gravity Y */}
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Gravity Simulation</span>
                <span className="font-mono text-amber-400">{config.gravityY > 0 ? `+${config.gravityY} (Falling)` : `${config.gravityY} (Rising)`}</span>
              </div>
              <input
                id="slider-particle-gravity"
                type="range"
                min="-0.2"
                max="0.3"
                step="0.02"
                value={config.gravityY}
                onChange={(e) => setConfig({ ...config, gravityY: Number(e.target.value) })}
                className="w-full accent-amber-500"
              />
            </div>

            {/* Particle Color */}
            <div>
              <div className="text-xs text-slate-300 mb-1.5">Particle Color</div>
              <div className="flex items-center gap-3">
                <input
                  id="color-particle-primary"
                  type="color"
                  value={config.color}
                  onChange={(e) => setConfig({ ...config, color: e.target.value })}
                  className="w-8 h-8 rounded border border-slate-700 cursor-pointer bg-transparent"
                />
                <span className="text-xs font-mono text-slate-400">{config.color}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center Live Simulation */}
        <div className="flex-1 p-6 flex flex-col items-center justify-center bg-slate-950/90 relative">
          <div className="w-[500px] h-[360px] rounded-2xl border border-slate-800 shadow-2xl overflow-hidden bg-[#090d16] relative flex items-center justify-center">
            <canvas
              ref={canvasRef}
              width={500}
              height={360}
              className="block"
            />
            <div className="absolute top-3 left-4 text-[11px] font-mono text-slate-500">
              Live Particle Simulator (60 FPS)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
