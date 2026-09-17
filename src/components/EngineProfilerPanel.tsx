import React, { useState } from 'react';
import { GameProject } from '../types';
import { Activity, Terminal, Play, Pause, FastForward, Cpu, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';

interface EngineProfilerPanelProps {
  project: GameProject;
  onRunCommand?: (cmd: string) => string;
}

export const EngineProfilerPanel: React.FC<EngineProfilerPanelProps> = ({ project, onRunCommand }) => {
  const [consoleInput, setConsoleInput] = useState('');
  const [consoleLogs, setConsoleLogs] = useState<{ id: string; type: 'cmd' | 'output' | 'error'; text: string }[]>([
    { id: '1', type: 'output', text: 'Game Engine Real-Time Profiler & Terminal Initialized v2.4' },
    { id: '2', type: 'output', text: 'Type "help" for a list of real-time commands.' }
  ]);

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consoleInput.trim()) return;

    const cmd = consoleInput.trim();
    setConsoleInput('');

    // Add command log
    const userLog = { id: `cmd_${Date.now()}`, type: 'cmd' as const, text: `> ${cmd}` };

    let reply = '';
    if (onRunCommand) {
      reply = onRunCommand(cmd);
    } else {
      reply = `Engine received: "${cmd}". Start live playtest to execute in runtime simulation.`;
    }

    const outputLog = { id: `out_${Date.now()}`, type: 'output' as const, text: reply };
    setConsoleLogs(prev => [...prev, userLog, outputLog]);
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
      {/* Header */}
      <div className="h-14 px-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-emerald-400" />
          <div>
            <h2 className="text-sm font-bold text-white font-['Space_Grotesk']">Engine Diagnostics & Developer Console</h2>
            <p className="text-[11px] text-slate-400">Monitor FPS budget, collision bottlenecks, and trigger live debug commands</p>
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 overflow-hidden">
        {/* Left 2 Cols: Performance Metrics & Real Engine Architecture */}
        <div className="lg:col-span-1 flex flex-col gap-4 overflow-y-auto">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="text-[11px] font-mono text-slate-400 uppercase">Target Frame Rate</div>
              <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">60.0 FPS</div>
              <div className="text-[10px] text-slate-500 mt-1 font-mono">16.6 ms / frame budget</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="text-[11px] font-mono text-slate-400 uppercase">Active GameObjects</div>
              <div className="text-2xl font-bold text-cyan-400 font-mono mt-1">{project.entities.length}</div>
              <div className="text-[10px] text-slate-500 mt-1 font-mono">Scene Tree Nodes</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="text-[11px] font-mono text-slate-400 uppercase">Tilemap Blocks</div>
              <div className="text-2xl font-bold text-amber-400 font-mono mt-1">{project.tilemap?.tiles.length || 0}</div>
              <div className="text-[10px] text-slate-500 mt-1 font-mono">AABB Static Colliders</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="text-[11px] font-mono text-slate-400 uppercase">Logic Rules</div>
              <div className="text-2xl font-bold text-fuchsia-400 font-mono mt-1">{project.logicRules.length}</div>
              <div className="text-[10px] text-slate-500 mt-1 font-mono">Event Listeners</div>
            </div>
          </div>

          {/* Real Engine Architecture Guide */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs">
            <div className="flex items-center gap-2 font-bold text-slate-200 mb-2">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span>Standard Engine Frame Execution Order:</span>
            </div>
            <ol className="space-y-1.5 text-[11px] text-slate-400 font-mono list-decimal list-inside">
              <li>Poll Hardware Input (Keyboard & Gamepad)</li>
              <li>Execute onUpdate(dt) lifecycle scripts</li>
              <li>Run Physics integration (Euler velocity & gravity)</li>
              <li>AABB Broadphase & Narrowphase Collision Check</li>
              <li>Emit Particle systems & lerp Camera position</li>
              <li>Render Background & Tilemap</li>
              <li>Render Scene Entities & Sprite animation frames</li>
              <li>Execute Post-Processing Shader Passes</li>
              <li>Paint Canvas HUD overlay in screen space</li>
            </ol>
          </div>
        </div>

        {/* Right 2 Cols: Live Terminal Console */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-950 flex flex-col overflow-hidden shadow-2xl">
          <div className="h-10 px-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>Engine CLI Debugger</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setConsoleLogs([{ id: 'init', type: 'output', text: 'Console cleared.' }])}
                className="text-[10px] text-slate-400 hover:text-white font-mono cursor-pointer"
              >
                Clear Log
              </button>
            </div>
          </div>

          {/* Console Log Output */}
          <div className="flex-1 p-4 overflow-y-auto font-mono text-xs space-y-2">
            {consoleLogs.map(log => (
              <div
                key={log.id}
                className={`${
                  log.type === 'cmd'
                    ? 'text-cyan-400 font-semibold'
                    : log.type === 'error'
                    ? 'text-red-400'
                    : 'text-slate-300'
                }`}
              >
                {log.text}
              </div>
            ))}
          </div>

          {/* Command Input */}
          <form onSubmit={handleCommandSubmit} className="p-3 bg-slate-900/60 border-t border-slate-800 flex items-center gap-2">
            <span className="text-emerald-400 font-mono text-xs">&gt;</span>
            <input
              id="input-engine-cli"
              type="text"
              value={consoleInput}
              onChange={(e) => setConsoleInput(e.target.value)}
              placeholder="Try: help, fps, spawn enemy, killenemies, godmode, shake 12, setspeed 6"
              className="flex-1 bg-transparent text-xs font-mono text-white placeholder-slate-500 focus:outline-none"
            />
            <button
              type="submit"
              className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold font-mono transition-colors cursor-pointer"
            >
              Run
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
