import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Box, 
  Layers, 
  Cpu, 
  Zap, 
  Check, 
  Terminal, 
  Sparkles, 
  Play, 
  Volume2, 
  ArrowRight,
  Shield,
  Activity
} from 'lucide-react';
import { soundManager } from '../utils/audioSynth';

interface EngineStartupAnimationProps {
  onComplete: () => void;
  projectName: string;
}

interface BootStep {
  label: string;
  detail: string;
  time: number;
}

const BOOT_STEPS: BootStep[] = [
  { label: 'Initializing Vulkan / WebGL Forward+ Renderer', detail: 'Shaders compiled • 60 FPS target', time: 300 },
  { label: 'Mounting 2D & 3D Spatial Physics Worlds', detail: 'Gravity -9.8m/s² • Broadphase active', time: 700 },
  { label: 'Loading Multi-Channel Audio Bus Synthesizer', detail: 'Master / Music / SFX faders bound', time: 1100 },
  { label: 'Bootstrapping JVM & GDScript Scripting Engines', detail: 'JDK 21 LTS • Hot-reloading active', time: 1400 },
  { label: 'Scene Graph & Project Workspace Ready', detail: 'res://scenes mounted successfully', time: 1700 }
];

export const EngineStartupAnimation: React.FC<EngineStartupAnimationProps> = ({
  onComplete,
  projectName
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  useEffect(() => {
    // Progress increment timer
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return Math.min(100, prev + 2.5);
      });
    }, 45);

    // Boot checklist items timer
    BOOT_STEPS.forEach((step, idx) => {
      setTimeout(() => {
        setCurrentStepIndex(idx + 1);
        try {
          soundManager.playBlip();
        } catch {
          // Audio optional
        }
      }, step.time);
    });

    // Auto-complete timer
    const finishTimeout = setTimeout(() => {
      setIsFinished(true);
      try {
        soundManager.playCoin();
      } catch {
        // Audio optional
      }
      setTimeout(() => {
        onComplete();
      }, 500);
    }, 2200);

    // Skip on Escape or Space
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        clearTimeout(finishTimeout);
        clearInterval(progressInterval);
        onComplete();
      }
    };
    window.addEventListener('keydown', handleKey);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(finishTimeout);
      window.removeEventListener('keydown', handleKey);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 1.02 }}
        transition={{ duration: 0.4 }}
        className="fixed inset-0 z-50 bg-[#0d1017] text-slate-100 flex flex-col items-center justify-center select-none overflow-hidden font-sans"
      >
        {/* Subtle Cybernetic Grid Background */}
        <div 
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, #478cbf 1px, transparent 1px), linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)`,
            backgroundSize: '40px 40px, 40px 40px, 40px 40px'
          }}
        />

        {/* Ambient Glow Orb */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#478cbf]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Central Engine Identity Container */}
        <div className="relative z-10 w-full max-w-xl px-6 flex flex-col items-center text-center space-y-7">
          {/* Animated 3D/2D Engine Mascot Emblem */}
          <motion.div
            initial={{ scale: 0.6, rotate: -20, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: 'spring', damping: 14, stiffness: 120 }}
            className="relative"
          >
            {/* Spinning Radiant Outer Ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
              className="absolute -inset-3.5 rounded-2xl border-2 border-dashed border-[#478cbf]/40"
            />

            {/* Glowing Icon Box */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#478cbf] to-[#1e3a5f] p-0.5 shadow-2xl shadow-[#478cbf]/50 flex items-center justify-center">
              <div className="w-full h-full bg-[#151922] rounded-[14px] flex items-center justify-center relative overflow-hidden">
                <motion.div
                  animate={{ y: [0, -3, 0] }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                >
                  <Box className="w-10 h-10 text-[#599eff]" />
                </motion.div>
                {/* 2D & 3D Badges */}
                <div className="absolute bottom-1 right-1 px-1 py-0.2 bg-[#478cbf] rounded text-[8px] font-mono font-bold text-white tracking-widest">
                  2D•3D
                </div>
              </div>
            </div>
          </motion.div>

          {/* Engine Title & Version */}
          <div className="space-y-1.5">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1b2230] border border-[#2e3b52] text-xs text-[#599eff] font-mono"
            >
              <Activity className="w-3 h-3 text-emerald-400" />
              <span>Godot 4.3 Architecture • JVM 21 LTS Core</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl md:text-3xl font-bold tracking-tight text-white font-['Space_Grotesk']"
            >
              GameDev Starter Studio
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-xs text-slate-400 font-mono"
            >
              Opening workspace: <span className="text-white font-semibold">{projectName}</span>
            </motion.p>
          </div>

          {/* Subsystems Loading Checklist */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="w-full bg-[#151a24]/90 border border-[#283245] rounded-xl p-4 text-left font-mono text-xs shadow-xl backdrop-blur-sm space-y-2.5"
          >
            {BOOT_STEPS.map((step, idx) => {
              const isLoaded = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;

              return (
                <div
                  key={step.label}
                  className={`flex items-center justify-between transition-opacity duration-200 ${
                    isLoaded ? 'opacity-100' : isCurrent ? 'opacity-90' : 'opacity-35'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                      isLoaded 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                        : isCurrent 
                        ? 'bg-[#478cbf]/20 text-[#599eff] animate-pulse border border-[#478cbf]/40' 
                        : 'bg-slate-800 text-slate-600'
                    }`}>
                      {isLoaded ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : <span className="text-[8px]">●</span>}
                    </div>
                    <span className={`text-[11px] ${isLoaded ? 'text-slate-200' : isCurrent ? 'text-white font-semibold' : 'text-slate-500'}`}>
                      {step.label}
                    </span>
                  </div>

                  <span className="text-[10px] text-slate-500 hidden sm:inline">
                    {isLoaded ? step.detail : isCurrent ? 'Booting...' : 'Pending'}
                  </span>
                </div>
              );
            })}
          </motion.div>

          {/* Loading Progress Bar */}
          <div className="w-full space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1.5 text-slate-300">
                <Terminal className="w-3 h-3 text-[#599eff]" />
                <span>Loading Engine Core...</span>
              </span>
              <span className="font-bold text-[#599eff]">{Math.round(progress)}%</span>
            </div>

            <div className="w-full h-2 bg-[#1b2230] rounded-full overflow-hidden border border-[#2e3b52]/80 p-0.5">
              <motion.div
                className="h-full bg-gradient-to-r from-[#478cbf] via-[#599eff] to-emerald-400 rounded-full"
                style={{ width: `${progress}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
          </div>

          {/* Skip Button */}
          <div className="flex items-center justify-between w-full pt-1">
            <span className="text-[10px] text-slate-500 font-mono">
              Press <kbd className="px-1.5 py-0.5 bg-[#1b2230] border border-[#2e3b52] rounded text-slate-400">Space</kbd> or <kbd className="px-1.5 py-0.5 bg-[#1b2230] border border-[#2e3b52] rounded text-slate-400">Esc</kbd> to skip
            </span>

            <button
              onClick={onComplete}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 py-1 px-2.5 rounded hover:bg-[#1b2230] transition-colors cursor-pointer"
            >
              <span>Skip Intro</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
