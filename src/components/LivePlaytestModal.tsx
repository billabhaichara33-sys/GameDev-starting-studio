import React, { useEffect, useRef, useState } from 'react';
import { 
  Play, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  X, 
  Activity, 
  Terminal, 
  Lightbulb, 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { GameProject } from '../types';
import { GameEngine, DebugLogEntry } from '../utils/gameEngine';
import { soundManager } from '../utils/audioSynth';

interface LivePlaytestModalProps {
  project: GameProject;
  onClose: () => void;
  onRecordPlaytest?: () => void;
}

export const LivePlaytestModal: React.FC<LivePlaytestModalProps> = ({
  project,
  onClose,
  onRecordPlaytest
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [isMuted, setIsMuted] = useState<boolean>(soundManager.getMuted());
  const [logs, setLogs] = useState<DebugLogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'inspector' | 'logs' | 'advisor' | 'cli'>('inspector');
  const [score, setScore] = useState<number>(0);
  const [lives, setLives] = useState<number>(project.settings.lives || 3);
  const [debugSnapshot, setDebugSnapshot] = useState<any>(null);
  const [cliInput, setCliInput] = useState('');
  const [cliOutput, setCliOutput] = useState<{ id: string; text: string; isCmd?: boolean }[]>([
    { id: '1', text: 'Live Engine CLI attached to active simulation.' },
    { id: '2', text: 'Commands: godmode, shake [n], spawn enemy, setspeed [n], killenemies, help' }
  ]);

  const handleRunCli = (cmdToRun: string) => {
    if (!cmdToRun.trim() || !engineRef.current) return;
    const res = engineRef.current.executeConsoleCommand(cmdToRun.trim());
    setCliOutput(prev => [
      ...prev,
      { id: `cmd_${Date.now()}`, text: `> ${cmdToRun}`, isCmd: true },
      { id: `res_${Date.now()}`, text: res }
    ]);
  };

  // Mount game engine
  useEffect(() => {
    if (!canvasRef.current) return;

    onRecordPlaytest?.();

    const engine = new GameEngine(canvasRef.current, project, {
      onScoreChange: (s) => setScore(s),
      onLivesChange: (l) => setLives(l),
      onDebugLog: (log) => {
        setLogs((prev) => [log, ...prev].slice(0, 50));
      }
    });

    engineRef.current = engine;
    engine.start();

    const pollInterval = setInterval(() => {
      if (engineRef.current) {
        setDebugSnapshot(engineRef.current.getDebugSnapshot());
      }
    }, 200);

    return () => {
      clearInterval(pollInterval);
      engine.stop();
      engineRef.current = null;
    };
  }, [project]);

  const handleRestart = () => {
    if (engineRef.current) {
      engineRef.current.restart();
    }
  };

  const handleToggleMute = () => {
    const next = !isMuted;
    soundManager.setMuted(next);
    setIsMuted(next);
  };

  // Virtual Gamepad button handlers
  const handleButtonDown = (key: string) => {
    if (engineRef.current) engineRef.current.triggerKey(key, true);
  };
  const handleButtonUp = (key: string) => {
    if (engineRef.current) engineRef.current.triggerKey(key, false);
  };

  return (
    <div id="playtest-modal-overlay" className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-6xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-bold text-white font-['Space_Grotesk']">
              Live Game Simulator: {project.name}
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 capitalize font-mono">
              {project.genre.replace('_', ' ')}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleMute}
              className={`p-2 rounded-lg border text-xs cursor-pointer ${isMuted ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-slate-800 text-slate-300 border-slate-700'}`}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              onClick={handleRestart}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restart</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body: Game Canvas + Debugger Inspector */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Left / Top: Game Screen */}
          <div className="lg:col-span-8 bg-slate-950 p-4 flex flex-col items-center justify-between border-b lg:border-b-0 lg:border-r border-slate-800">
            {/* Canvas Container */}
            <div className="relative w-full flex items-center justify-center max-h-[440px]">
              <canvas
                id="game-simulator-canvas"
                ref={canvasRef}
                width={project.settings.canvasWidth || 640}
                height={project.settings.canvasHeight || 360}
                className="w-full max-w-[640px] aspect-[16/9] bg-slate-900 border border-slate-800 rounded-xl shadow-2xl block select-none object-contain"
                tabIndex={0}
              />
            </div>

            {/* Controls Bar & Touch Gamepad */}
            <div className="w-full pt-3 flex flex-wrap items-center justify-between gap-4 border-t border-slate-800/80 mt-3 text-xs text-slate-400">
              <div className="hidden sm:flex items-center gap-2">
                <span className="font-semibold text-slate-300">Keyboard Controls:</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">WASD</span>
                <span>or</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">Arrows</span>
                <span>to move,</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">Space</span>
                <span>to jump/fire</span>
              </div>

              {/* Mobile / Touch Gamepad (D-Pad + Action Buttons) */}
              <div className="flex items-center justify-between w-full sm:w-auto gap-4 select-none">
                {/* D-Pad */}
                <div className="flex items-center gap-1">
                  <button
                    onMouseDown={() => handleButtonDown('arrowleft')}
                    onMouseUp={() => handleButtonUp('arrowleft')}
                    onTouchStart={() => handleButtonDown('arrowleft')}
                    onTouchEnd={() => handleButtonUp('arrowleft')}
                    className="w-9 h-9 rounded bg-slate-800 active:bg-indigo-600 text-slate-200 flex items-center justify-center border border-slate-700"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div className="flex flex-col gap-1">
                    <button
                      onMouseDown={() => handleButtonDown('arrowup')}
                      onMouseUp={() => handleButtonUp('arrowup')}
                      onTouchStart={() => handleButtonDown('arrowup')}
                      onTouchEnd={() => handleButtonUp('arrowup')}
                      className="w-9 h-9 rounded bg-slate-800 active:bg-indigo-600 text-slate-200 flex items-center justify-center border border-slate-700"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onMouseDown={() => handleButtonDown('arrowdown')}
                      onMouseUp={() => handleButtonUp('arrowdown')}
                      onTouchStart={() => handleButtonDown('arrowdown')}
                      onTouchEnd={() => handleButtonUp('arrowdown')}
                      className="w-9 h-9 rounded bg-slate-800 active:bg-indigo-600 text-slate-200 flex items-center justify-center border border-slate-700"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onMouseDown={() => handleButtonDown('arrowright')}
                    onMouseUp={() => handleButtonUp('arrowright')}
                    onTouchStart={() => handleButtonDown('arrowright')}
                    onTouchEnd={() => handleButtonUp('arrowright')}
                    className="w-9 h-9 rounded bg-slate-800 active:bg-indigo-600 text-slate-200 flex items-center justify-center border border-slate-700"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Action Jump/Fire */}
                <div className="flex items-center gap-2">
                  <button
                    onMouseDown={() => handleButtonDown('space')}
                    onMouseUp={() => handleButtonUp('space')}
                    onTouchStart={() => handleButtonDown('space')}
                    onTouchEnd={() => handleButtonUp('space')}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 active:bg-indigo-500 text-white font-bold text-xs shadow-md border border-indigo-400/30"
                  >
                    {project.genre === 'space_shooter' ? 'FIRE' : 'JUMP'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right / Bottom: Beginner-Friendly Debugger */}
          <div className="lg:col-span-4 bg-slate-900 flex flex-col h-[460px] lg:h-auto">
            {/* Debugger Tabs */}
            <div className="flex items-center border-b border-slate-800 bg-slate-950/50 p-1">
              <button
                onClick={() => setActiveTab('inspector')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer ${activeTab === 'inspector' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
              >
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span>Watcher</span>
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer ${activeTab === 'logs' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
              >
                <Terminal className="w-3.5 h-3.5 text-amber-400" />
                <span>Events</span>
              </button>
              <button
                onClick={() => setActiveTab('cli')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer ${activeTab === 'cli' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
              >
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span>CLI Terminal</span>
              </button>
              <button
                onClick={() => setActiveTab('advisor')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer ${activeTab === 'advisor' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
              >
                <Lightbulb className="w-3.5 h-3.5 text-indigo-400" />
                <span>Tips</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {activeTab === 'inspector' && (
                <div className="space-y-3">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Real-Time Game State
                  </div>

                  {debugSnapshot?.player ? (
                    <div className="space-y-2 text-xs font-mono">
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex justify-between">
                        <span className="text-slate-400">Player Coordinates</span>
                        <span className="text-cyan-300 font-bold">
                          X: {debugSnapshot.player.x} • Y: {debugSnapshot.player.y}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex justify-between">
                        <span className="text-slate-400">Vertical Velocity (vy)</span>
                        <span className={`${debugSnapshot.player.vy !== 0 ? 'text-amber-400' : 'text-slate-300'}`}>
                          {debugSnapshot.player.vy} px/frame
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex justify-between">
                        <span className="text-slate-400">Grounded (On Platform)</span>
                        <span className={debugSnapshot.player.isGrounded ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                          {debugSnapshot.player.isGrounded ? 'YES (Can Jump)' : 'NO (In Air)'}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex justify-between">
                        <span className="text-slate-400">Active Game Entities</span>
                        <span className="text-indigo-300 font-bold">{debugSnapshot.entitiesCount}</span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex justify-between">
                        <span className="text-slate-400">Score / Lives</span>
                        <span className="text-white font-bold">{score} pts / {lives} ❤️</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                      No player active on screen! Add a player entity in the Scene View.
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'logs' && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Recent Physics & Logic Events
                  </div>
                  {logs.length === 0 ? (
                    <div className="text-xs text-slate-500 italic py-4">No events logged yet. Move your hero!</div>
                  ) : (
                    <div className="space-y-1.5 font-mono text-[11px]">
                      {logs.map((item, idx) => (
                        <div key={idx} className="p-2 rounded bg-slate-950 border border-slate-800 flex items-start gap-2">
                          <span className="text-slate-500 select-none text-[10px]">{item.time}</span>
                          <span className={`${
                            item.type === 'score' ? 'text-emerald-400' :
                            item.type === 'damage' ? 'text-rose-400' :
                            item.type === 'collision' ? 'text-amber-300' :
                            'text-slate-300'
                          }`}>
                            {item.message}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'advisor' && (
                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                      <span>Sparky's Engine Diagnostics</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Everything looks healthy! Your project runs at 60 FPS. If jumping feels too floaty or heavy, tweak <strong>Gravity</strong> and <strong>Jump Power</strong> in the Project Settings.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="font-semibold text-white flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Beginner Game Checklist</span>
                    </div>
                    <ul className="space-y-1 text-slate-400 text-[11px]">
                      <li>• Does player have solid ground beneath them?</li>
                      <li>• Is there a clear goal to win (Flag / Chest)?</li>
                      <li>• Are audio sounds playing when actions occur?</li>
                      <li>• Can player recover if they take damage?</li>
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === 'cli' && (
                <div className="flex flex-col h-full space-y-3 font-mono text-xs">
                  {/* Quick Preset Buttons */}
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: 'Godmode', cmd: 'godmode' },
                      { label: 'Screen Shake', cmd: 'shake 15' },
                      { label: 'Spawn Slime', cmd: 'spawn enemy' },
                      { label: 'Kill Enemies', cmd: 'killenemies' },
                      { label: 'Turbo Speed', cmd: 'setspeed 8' },
                      { label: 'CRT TV', cmd: 'shader scanlines' },
                      { label: 'Bloom Glow', cmd: 'shader bloom' },
                      { label: 'Clear Shaders', cmd: 'shader none' }
                    ].map(btn => (
                      <button
                        key={btn.label}
                        onClick={() => handleRunCli(btn.cmd)}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] border border-slate-700 transition-colors cursor-pointer"
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>

                  {/* Output Terminal */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex-1 max-h-56 overflow-y-auto space-y-1 text-[11px]">
                    {cliOutput.map(entry => (
                      <div
                        key={entry.id}
                        className={entry.isCmd ? 'text-emerald-400 font-bold' : 'text-slate-300'}
                      >
                        {entry.text}
                      </div>
                    ))}
                  </div>

                  {/* Input Form */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleRunCli(cliInput);
                      setCliInput('');
                    }}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      value={cliInput}
                      onChange={(e) => setCliInput(e.target.value)}
                      placeholder="e.g. shake 20, godmode, fps..."
                      className="flex-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs cursor-pointer"
                    >
                      Exec
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
