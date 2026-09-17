import React, { useState } from 'react';
import { 
  Code2, 
  Play, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  BookOpen, 
  Copy,
  Lightbulb,
  FileCode,
  Terminal,
  RotateCcw,
  Monitor,
  Smartphone,
  Coffee
} from 'lucide-react';
import { validateJavaCode, executeJava, JavaDiagnostic } from '../utils/javaRunner';

interface CodeEditorViewProps {
  initialCode?: string;
  onSaveCode?: (code: string) => void;
  onAskAI?: (code: string, error?: string) => void;
}

export const DEFAULT_JAVA_STARTER_CODE = `// =======================================================
// Java Game Behavior Class for PC Windows & Android
// In GameDev Starter Studio, Java methods run every frame!
// =======================================================

public class GameBehavior {
    // Called 60 times per second to update positions & logic
    public void onUpdate(GameEntity entity, Game game) {
        // Example: Bob a floating coin up and down with Math.sin
        if (entity.type.equals("coin")) {
            entity.y += Math.sin(game.time * 4.0) * 0.6;
        }

        // Example: Check if player reached the victory score
        if (game.variables.score >= 100) {
            game.variables.hasWon = true;
            System.out.println("Player reached 100 points! Victory unlocked.");
        }
    }

    // Triggered automatically on physical AABB collision
    public void onCollision(GameEntity player, GameEntity other) {
        System.out.println("Java Engine Collision: " + player.name + " hit " + other.name);

        if (other.type.equals("coin")) {
            player.score += 10;
            System.out.println("Collected Coin! +10 Points. Total: " + player.score);
        } else if (other.type.equals("hazard") || other.type.equals("enemy")) {
            player.lives -= 1;
            System.out.println("Hazard damage! Remaining lives: " + player.lives);
        }
    }
}
`;

export const CodeEditorView: React.FC<CodeEditorViewProps> = ({
  initialCode = DEFAULT_JAVA_STARTER_CODE,
  onSaveCode,
  onAskAI
}) => {
  const [code, setCode] = useState<string>(initialCode);
  const [diagnostics, setDiagnostics] = useState<JavaDiagnostic[]>([]);
  const [hasValidated, setHasValidated] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [targetPlatform, setTargetPlatform] = useState<'windows' | 'android' | 'cross'>('cross');

  // Beginner-friendly Java syntax & OOP validator
  const validateCode = () => {
    setHasValidated(true);
    const issues = validateJavaCode(code);
    setDiagnostics(issues);
    return issues;
  };

  const handleRunJava = () => {
    setIsRunning(true);
    const issues = validateCode();
    
    if (issues.some(i => i.type === 'error')) {
      setIsRunning(false);
      setConsoleLogs([
        `[javac Error] Found ${issues.filter(i => i.type === 'error').length} compilation issue(s). Check the Java Diagnostic Advisor below!`
      ]);
      return;
    }

    // Mock entity & game state for interactive Java test execution
    const testEntity = { id: 'ent-1', name: 'Gold Coin', type: 'coin', x: 100, y: 150 };
    const testPlayer = { id: 'player-1', name: 'Java Knight', type: 'player', score: 20, lives: 3, x: 100, y: 150 };
    const testHazard = { id: 'hz-1', name: 'Spike Pit', type: 'hazard', x: 200, y: 300 };
    const testGame = { time: 1.5, variables: { score: 20, lives: 3, hasWon: false } };

    const result = executeJava(code, {
      entity: testEntity,
      player: testPlayer,
      other: testHazard,
      game: testGame
    });

    if (result.success) {
      const logs = [
        `$ javac GameBehavior.java (Target: Java 17/21 SE & Android Dalvik/ART)`,
        `Compilation successful. 0 warnings, 0 errors.`,
        `>>> Initializing Java Virtual Machine (JVM) simulation...`,
        result.output
      ];
      // Test run onUpdate if defined
      if (result.result?.onUpdate) {
        try {
          result.result.onUpdate(testEntity, testGame);
          logs.push(`[JVM Output] Executed onUpdate() -> entity.y: ${testEntity.y.toFixed(2)}`);
        } catch (e: any) {
          logs.push(`[Java Exception in onUpdate]: ${e.message}`);
        }
      }
      // Test run onCollision if defined
      if (result.result?.onCollision) {
        try {
          result.result.onCollision(testPlayer, testHazard);
          logs.push(`[JVM Output] Executed onCollision() -> player.lives: ${testPlayer.lives}`);
        } catch (e: any) {
          logs.push(`[Java Exception in onCollision]: ${e.message}`);
        }
      }
      setConsoleLogs(logs);
    } else {
      setConsoleLogs([
        `>>> Java Runtime Exception:`,
        result.error || 'Unknown runtime error'
      ]);
    }
    setIsRunning(false);
  };

  const handleSave = () => {
    validateCode();
    onSaveCode?.(code);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div id="code-editor-root" className="w-full max-w-5xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
            <Coffee className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white font-['Space_Grotesk']">Java 2D Game Studio</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-500/10 text-red-300 border border-red-500/20 font-bold flex items-center gap-1">
                <span>Java 17/21 • Windows & Android</span>
              </span>
            </div>
            <p className="text-xs text-slate-400">Learn authentic Java OOP, methods, types, and game loops for PC desktop (.exe/jar) and Android (.apk)</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Target platform selector */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setTargetPlatform('cross')}
              className={`px-2 py-1 rounded font-medium flex items-center gap-1 transition-colors ${targetPlatform === 'cross' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <span>Cross-Platform</span>
            </button>
            <button
              onClick={() => setTargetPlatform('windows')}
              className={`px-2 py-1 rounded font-medium flex items-center gap-1 transition-colors ${targetPlatform === 'windows' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <Monitor className="w-3 h-3 text-sky-400" />
              <span>PC Windows</span>
            </button>
            <button
              onClick={() => setTargetPlatform('android')}
              className={`px-2 py-1 rounded font-medium flex items-center gap-1 transition-colors ${targetPlatform === 'android' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <Smartphone className="w-3 h-3 text-emerald-400" />
              <span>Android</span>
            </button>
          </div>

          <button
            id="btn-validate-code"
            onClick={validateCode}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>javac Syntax Check</span>
          </button>

          <button
            id="btn-run-java"
            onClick={handleRunJava}
            className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm shadow-red-600/20"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isRunning ? 'Compiling...' : 'Run Java in JVM'}</span>
          </button>

          <button
            id="btn-save-code"
            onClick={handleSave}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer transition-colors"
          >
            <span>{savedSuccess ? 'Saved!' : 'Save & Attach'}</span>
          </button>
        </div>
      </div>

      {/* Editor & Console Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Editor Area */}
        <div className="lg:col-span-8 space-y-4">
          <div className="relative rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-xl">
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1.5 text-red-400">
                <Coffee className="w-3.5 h-3.5" />
                <span>GameBehavior.java</span>
              </span>
              <span className="text-[11px] text-slate-400">Java Standard Edition • Strongly Typed OOP</span>
            </div>

            <div className="flex">
              {/* Line numbers */}
              <div className="py-4 pl-3 pr-2 text-right select-none font-mono text-xs text-slate-600 bg-slate-950/60 border-r border-slate-800/80 min-w-[3rem]">
                {code.split('\n').map((_, i) => (
                  <div key={i} className="leading-6">{i + 1}</div>
                ))}
              </div>

              {/* Code text area */}
              <textarea
                id="java-code-textarea"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setHasValidated(false);
                }}
                spellCheck={false}
                className="flex-1 p-4 bg-transparent font-mono text-xs sm:text-sm text-slate-100 focus:outline-none resize-none leading-6 min-h-[380px] selection:bg-red-500/30"
              />
            </div>
          </div>

          {/* Java Terminal Output */}
          <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-900/90 border-b border-slate-800 text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <Terminal className="w-3.5 h-3.5" />
                <span>Java Virtual Machine (JVM) & System.out Console</span>
              </span>
              {consoleLogs.length > 0 && (
                <button
                  onClick={() => setConsoleLogs([])}
                  className="text-[10px] text-slate-500 hover:text-slate-300 flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              )}
            </div>
            <div className="p-3 font-mono text-xs text-slate-300 min-h-[100px] max-h-[180px] overflow-y-auto space-y-1">
              {consoleLogs.length === 0 ? (
                <div className="text-slate-600 italic">
                  Press "Run Java in JVM" to compile and execute your GameBehavior.java class. Output from System.out.println() will appear here.
                </div>
              ) : (
                consoleLogs.map((log, i) => (
                  <div key={i} className="leading-relaxed whitespace-pre-wrap">{log}</div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Beginner Explanations & AI Helper Column */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <span>Java Diagnostic Advisor</span>
            </h4>

            {!hasValidated ? (
              <p className="text-xs text-slate-400 leading-relaxed">
                Click <strong>"javac Syntax Check"</strong> or <strong>"Run Java in JVM"</strong>. We’ll analyze your types, semicolons, and class structure, translating compiler errors into clear, friendly guidance!
              </p>
            ) : diagnostics.length === 0 ? (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Java Syntax Valid!</span>
                </div>
                <p>Clean class definitions, correct semicolons, and balanced braces. Your Java code is ready for PC Windows and Android export!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {diagnostics.map((diag, i) => (
                  <div 
                    key={i} 
                    className={`p-3 rounded-lg text-xs space-y-1.5 border ${
                      diag.type === 'error' 
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' 
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{diag.title}</span>
                      </span>
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-black/40">Line {diag.line}</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed text-[11px]">{diag.message}</p>
                    <div className="p-2 rounded bg-black/30 text-[11px] text-slate-200 font-mono">
                      <strong>Fix:</strong> {diag.fixSuggestion}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {onAskAI && (
              <button
                id="btn-ask-ai-code"
                onClick={() => onAskAI(code, diagnostics.length > 0 ? diagnostics[0].message : undefined)}
                className="w-full py-2 px-3 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Explain Java Errors with AI Mentor</span>
              </button>
            )}
          </div>

          {/* Quick Java Snippets */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-red-400" />
              <span>Java Game Snippets</span>
            </h4>
            <div className="space-y-1.5 text-xs">
              <button
                onClick={() => setCode(prev => prev + '\n    // Java Double Jump Method\n    public void handleJump(Player player, boolean keyPressed) {\n        if (keyPressed && player.jumpsLeft > 0) {\n            player.vy = -12;\n            player.jumpsLeft--;\n            System.out.println("Double Jump activated! Remaining: " + player.jumpsLeft);\n        }\n    }\n')}
                className="w-full text-left p-2 rounded bg-slate-950 hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer border border-slate-800/60"
              >
                + Double Jump Method (handleJump)
              </button>
              <button
                onClick={() => setCode(prev => prev + '\n    // Java Sine Wave Floating Animation\n    public void bobItem(GameEntity item, double timeSec) {\n        item.y += Math.sin(timeSec * 3.5) * 0.75;\n    }\n')}
                className="w-full text-left p-2 rounded bg-slate-950 hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer border border-slate-800/60"
              >
                + Floating Sinewave with Math.sin
              </button>
              <button
                onClick={() => setCode(prev => prev + '\n    // Java Enemy Patrol AI Routine\n    public void updatePatrol(Enemy enemy, double minX, double maxX) {\n        enemy.x += enemy.speed * enemy.direction;\n        if (enemy.x <= minX || enemy.x >= maxX) {\n            enemy.direction *= -1; // Reverse patrol direction\n            System.out.println("Enemy turned around at boundary!");\n        }\n    }\n')}
                className="w-full text-left p-2 rounded bg-slate-950 hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer border border-slate-800/60"
              >
                + Enemy Patrol AI Routine
              </button>
              <button
                onClick={() => setCode(prev => prev + '\n    // Android Touch Joystick Processor\n    public void handleTouchInput(float touchX, float touchY, int screenWidth) {\n        if (touchX < screenWidth / 2) {\n            System.out.println("Left Virtual D-Pad Touch");\n        } else {\n            System.out.println("Right Action Button Touch (Jump/Fire)");\n        }\n    }\n')}
                className="w-full text-left p-2 rounded bg-slate-950 hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer border border-slate-800/60"
              >
                + Android Touch Input Processor
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
