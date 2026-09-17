import React, { useState } from 'react';
import { X, BookOpen, ChevronRight, ChevronLeft, Play, Sparkles, Layers, Cpu, Eye, CheckCircle2 } from 'lucide-react';

interface DayOneGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJumpToAcademy?: () => void;
}

const GUIDE_STEPS = [
  {
    day: 'Day 1',
    title: 'The Game Loop: How Games Breathe',
    icon: '⚡',
    summary: 'Every game engine on Earth is driven by a heartbeat called the Game Loop.',
    points: [
      'Your display refreshes 60 times every second (16.6 milliseconds per frame).',
      'Each tick follows a strict order: 1) Read keyboard/gamepad, 2) Calculate movements, 3) Check collisions, 4) Render pixels to the screen.',
      'Delta Time (dt) measures the fractional second between frames so a hero moves at the same physical speed on a 60Hz laptop as on a 240Hz monitor.'
    ],
    code: `function gameLoop(currentTime) {
  let dt = (currentTime - lastTime) / 1000;
  player.x += speed * dt; // Frame-rate independent!
  checkCollisions();
  renderCanvas();
  requestAnimationFrame(gameLoop);
}`
  },
  {
    day: 'Day 2',
    title: 'Entities & The Scene Tree Hierarchy',
    icon: '🌳',
    summary: 'Game worlds are organized as Trees of Nodes with parent-child transforms.',
    points: [
      'In Godot, Unity, and modern engines, every object in the world is a Node.',
      'When a child entity is attached to a parent node, moving the parent moves the child automatically!',
      'For example: A Player character holds a Sword or wears a Hat. When the player jumps, the sword and hat stay locked in place relative to the character.'
    ],
    code: `// Child world position calculation:
let childWorldX = parent.x + child.localOffsetX;
let childWorldY = parent.y + child.localOffsetY;`
  },
  {
    day: 'Day 3',
    title: '2D Physics & AABB Collision Detection',
    icon: '🧱',
    summary: 'Simulate gravity, momentum, and solid physical obstacles.',
    points: [
      'Gravity continuously adds downward velocity (vy += gravity) until landing.',
      'AABB (Axis-Aligned Bounding Box) is the fastest collision algorithm in 2D engines.',
      'Two boxes collide if their X and Y spans overlap simultaneously.'
    ],
    code: `function isColliding(a, b) {
  return a.x < b.x + b.width &&
         a.x + a.width > b.x &&
         a.y < b.y + b.height &&
         a.y + a.height > b.y;
}`
  },
  {
    day: 'Day 7',
    title: 'Tilemaps, Level Design & Grids',
    icon: '🗺️',
    summary: 'Build vast sprawling game worlds using efficient modular square tiles.',
    points: [
      'Drawing thousands of individual objects is slow. A Tilemap chops the screen into a lightweight coordinate grid (e.g. 32x32 pixels).',
      'Solid tiles automatically resolve horizontal and vertical physics collisions with the player.',
      'You can paint grass, stone dungeons, hazards, and coin treasures in seconds using the Tilemap Painter tab.'
    ],
    code: `// World coordinate to Grid index:
let tileCol = Math.floor(player.x / 32);
let tileRow = Math.floor(player.y / 32);`
  },
  {
    day: 'Day 14',
    title: 'Cameras, Smooth Lerp & Shaders',
    icon: '🎥',
    summary: 'Transform flat pixels into cinematic worlds with dynamic tracking.',
    points: [
      'Linear Interpolation (Lerp) smoothly glides the camera behind the player instead of rigid snapping.',
      'Screen shake adds visceral weight and impact when landing or taking damage.',
      'Post-processing shaders simulate retro CRT scanlines, 8-bit bloom halos, and nostalgic Game Boy phosphor palettes.'
    ],
    code: `// Camera Lerp Formula:
camera.x += (player.x - camera.x) * smoothFactor;`
  },
  {
    day: 'Day 21',
    title: 'PC Windows Engine: Java Desktop & Swing 60FPS',
    icon: '💻',
    summary: 'Compile your game into a real native Windows Desktop application with Java.',
    points: [
      'Java Swing and AWT provide native window frames (JFrame) and hardware double-buffering.',
      'A dedicated Thread implements Runnable, executing at a rock-solid 60 ticks per second (16.6 ms optimal frame time).',
      'You can compile and run directly from the Windows Command Prompt (cmd) using `javac` and `java` without heavy engine bloat.'
    ],
    code: `public class Game extends JPanel implements Runnable {
    public void run() {
        while (running) {
            updatePhysics();
            repaint(); // Draws 60 FPS on Windows
            Thread.sleep(16);
        }
    }
}`
  },
  {
    day: 'Day 30',
    title: 'Android Mobile Engine: SurfaceView & Touch Controls',
    icon: '📱',
    summary: 'Deploy your game to Android phones and tablets using the native Android SDK.',
    points: [
      'High-performance Android games use SurfaceView to draw directly to the mobile GPU buffer without UI thread lag.',
      'Multi-touch MotionEvents translate finger taps into virtual D-Pads and responsive jump buttons.',
      'Package into a standalone APK file ready to distribute to Android devices and publish to the Google Play Store.'
    ],
    code: `public class GameSurfaceView extends SurfaceView implements Runnable {
    @Override
    public boolean onTouchEvent(MotionEvent event) {
        if (event.getX() < getWidth() / 2) movePlayerLeft();
        else playerJump();
        return true;
    }
}`
  }
];

export const DayOneGuideModal: React.FC<DayOneGuideModalProps> = ({ isOpen, onClose, onJumpToAcademy }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  if (!isOpen) return null;

  const currentStep = GUIDE_STEPS[currentStepIndex];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="h-16 px-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-lg">
              {currentStep.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold">
                  {currentStep.day}
                </span>
                <h2 className="text-base font-bold text-white font-['Space_Grotesk']">{currentStep.title}</h2>
              </div>
              <p className="text-[11px] text-slate-400">From Day 1 Beginner to Real Game Engine Developer</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
          <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 text-indigo-200 text-xs leading-relaxed font-medium">
            {currentStep.summary}
          </div>

          {/* Key Insights */}
          <div className="space-y-2.5">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">Core Engine Concepts:</div>
            {currentStep.points.map((pt, idx) => (
              <div key={idx} className="flex items-start gap-3 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{pt}</span>
              </div>
            ))}
          </div>

          {/* Code Snippet Box */}
          <div>
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">How the Engine Runs This:</div>
            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300 overflow-x-auto">
              <code>{currentStep.code}</code>
            </pre>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="h-16 px-6 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-1">
            {GUIDE_STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStepIndex(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                  i === currentStepIndex ? 'bg-indigo-500 w-6' : 'bg-slate-700 hover:bg-slate-600'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {currentStepIndex > 0 && (
              <button
                onClick={() => setCurrentStepIndex(prev => prev - 1)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>
            )}

            {currentStepIndex < GUIDE_STEPS.length - 1 ? (
              <button
                onClick={() => setCurrentStepIndex(prev => prev + 1)}
                className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-md"
              >
                <span>Next Concept</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => {
                  onClose();
                  onJumpToAcademy?.();
                }}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
              >
                <BookOpen className="w-4 h-4" />
                <span>Jump into Academy Lessons</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
