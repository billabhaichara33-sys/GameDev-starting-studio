import React, { useState } from 'react';
import { 
  Download, 
  X, 
  Globe, 
  Monitor, 
  Smartphone, 
  FileCode, 
  Check, 
  Copy,
  Coffee,
  Terminal,
  Cpu,
  Layers,
  ChevronRight,
  FolderArchive,
  Settings,
  Package,
  Wrench,
  Sparkles,
  HardDrive,
  FileArchive,
  RefreshCw,
  Play,
  FolderGit2
} from 'lucide-react';
import { GameProject } from '../types';
import { 
  generateWindowsJavaGame, 
  generateAndroidJavaGame,
  generateWindowsBatchScript,
  generateGradleBuild,
  generateMavenPom,
  generateExePackagingGuide
} from '../utils/javaRunner';
import { createWindowsZipBundle } from '../utils/windowsPackager';
import { soundManager } from '../utils/audioSynth';

interface ExportModalProps {
  project: GameProject;
  onClose: () => void;
  onOpenSetupWizard?: () => void;
  onOpenGitHubPush?: () => void;
  onPlayTest?: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ 
  project, 
  onClose,
  onOpenSetupWizard,
  onOpenGitHubPush,
  onPlayTest
}) => {
  const [copied, setCopied] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'windows_zip' | 'windows_wizard' | 'java_windows' | 'desktop_bundle' | 'java_android' | 'web_html' | 'blueprint'>('windows_zip');
  const [isZipping, setIsZipping] = useState<boolean>(false);
  const [zipDownloaded, setZipDownloaded] = useState<boolean>(false);

  const className = project.name.replace(/[^a-zA-Z0-9]/g, '') || 'JavaGame';
  const zipFileName = `${project.name.replace(/[^a-zA-Z0-9_-]/g, '_')}-Windows-Release.zip`;
  const windowsJavaSource = generateWindowsJavaGame(project);
  const androidJavaSource = generateAndroidJavaGame(project);
  const windowsBatchScript = generateWindowsBatchScript(project);
  const gradleBuildSource = generateGradleBuild(project);
  const mavenPomSource = generateMavenPom(project);
  const exePackagingGuide = generateExePackagingGuide(project);

  // 1-Click Windows .ZIP Generator
  const handleDownloadWindowsZip = async () => {
    setIsZipping(true);
    soundManager.playCoin();
    try {
      const blob = await createWindowsZipBundle(project);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = zipFileName;
      a.click();
      URL.revokeObjectURL(url);
      setZipDownloaded(true);
    } catch (err) {
      console.error('Failed to create zip bundle:', err);
    } finally {
      setIsZipping(false);
    }
  };

  // Download Windows .java file
  const handleDownloadWindowsJava = () => {
    const blob = new Blob([windowsJavaSource], { type: 'text/x-java-source' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${className}.java`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Download run_windows.bat launcher
  const handleDownloadWindowsBatch = () => {
    const blob = new Blob([windowsBatchScript], { type: 'application/x-bat' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `run_windows.bat`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Download build.gradle
  const handleDownloadGradle = () => {
    const blob = new Blob([gradleBuildSource], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `build.gradle`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Download Android MainActivity.java
  const handleDownloadAndroidJava = () => {
    const blob = new Blob([androidJavaSource], { type: 'text/x-java-source' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MainActivity.java`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Generate self-contained standalone HTML game file
  const handleExportHTML = () => {
    const serializedProject = JSON.stringify(project).replace(/</g, '\\u003c');
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${project.name}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #020617;
      color: #f8fafc;
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      overflow: hidden;
    }
    #game-container {
      position: relative;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
      border-radius: 12px;
      overflow: hidden;
      border: 2px solid #334155;
    }
    canvas {
      display: block;
      background: ${project.settings.backgroundColor || '#0f172a'};
    }
    .hud {
      margin-top: 12px;
      font-size: 14px;
      color: #94a3b8;
      display: flex;
      gap: 16px;
    }
  </style>
</head>
<body>
  <div id="game-container">
    <canvas id="gameCanvas" width="${project.settings.canvasWidth || 640}" height="${project.settings.canvasHeight || 360}"></canvas>
  </div>
  <div class="hud">
    <span>Game: <strong>${project.name}</strong></span>
    <span>Controls: WASD / Arrows to move, Space to Jump</span>
  </div>

  <script>
    const PROJECT = ${serializedProject};
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    let keys = {};
    window.addEventListener('keydown', e => { keys[e.key.toLowerCase()] = true; if (e.code === 'Space') keys['space'] = true; });
    window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; if (e.code === 'Space') keys['space'] = false; });

    let entities = JSON.parse(JSON.stringify(PROJECT.entities));
    let player = entities.find(e => e.type === 'player') || { x: 40, y: 200, width: 24, height: 32, color: '#38bdf8', speed: 4, jumpPower: 10 };
    let playerVy = 0;
    let isGrounded = false;
    let score = 0;
    let lives = PROJECT.settings.lives || 3;
    let won = false;
    let over = false;

    function checkCollision(a, b) {
      return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
    }

    function loop() {
      if (!won && !over) {
        let moveX = 0;
        if (keys['arrowleft'] || keys['a']) moveX -= (player.speed || 4);
        if (keys['arrowright'] || keys['d']) moveX += (player.speed || 4);
        player.x += moveX;
        if (player.x < 0) player.x = 0;
        if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

        if ((keys['arrowup'] || keys['w'] || keys['space']) && isGrounded) {
          playerVy = -(player.jumpPower || 11);
          isGrounded = false;
        }

        playerVy += 0.5;
        player.y += playerVy;

        isGrounded = false;
        for (let i = entities.length - 1; i >= 0; i--) {
          const ent = entities[i];
          if (ent.type === 'platform') {
            if (player.x + player.width > ent.x && player.x < ent.x + ent.width) {
              if (player.y + player.height >= ent.y && player.y + player.height <= ent.y + 16 && playerVy >= 0) {
                player.y = ent.y - player.height;
                playerVy = 0;
                isGrounded = true;
              }
            }
          }
          if (ent !== player && checkCollision(player, ent)) {
            if (ent.type === 'coin') {
              score += 10;
              entities.splice(i, 1);
            } else if (ent.type === 'goal') {
              won = true;
            } else if (ent.type === 'enemy' || ent.type === 'hazard') {
              lives--;
              if (lives <= 0) over = true;
            }
          }
        }
      }

      ctx.fillStyle = PROJECT.settings.backgroundColor || '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      entities.forEach(ent => {
        ctx.fillStyle = ent.color || '#38bdf8';
        if (ent.type === 'coin') {
          ctx.beginPath();
          ctx.arc(ent.x + ent.width/2, ent.y + ent.height/2, ent.width/2, 0, Math.PI*2);
          ctx.fill();
        } else {
          ctx.fillRect(ent.x, ent.y, ent.width, ent.height);
        }
      });

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px monospace';
      ctx.fillText('SCORE: ' + score + '  LIVES: ' + lives, 12, 20);

      if (won) {
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(0,0,canvas.width,canvas.height);
        ctx.fillStyle = '#22c55e';
        ctx.font = 'bold 32px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('VICTORY!', canvas.width/2, canvas.height/2);
      } else if (over) {
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(0,0,canvas.width,canvas.height);
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 32px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2);
      }

      requestAnimationFrame(loop);
    }
    loop();
  </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_game.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export JSON Blueprint
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(project, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `${project.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_project.json`;
    a.click();
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div id="export-modal-overlay" className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden space-y-5 p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white font-['Space_Grotesk'] flex items-center gap-2">
                <Coffee className="w-5 h-5 text-cyan-400" />
                <span>Export & Publish: {project.name}</span>
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-bold">
                Windows .ZIP • Setup Wizard • Java
              </span>
            </div>
            <p className="text-xs text-slate-400">Export standalone ready-to-run Windows packages, setup installers, and multi-platform runtimes</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadWindowsZip}
              disabled={isZipping}
              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-600/25 transition-all cursor-pointer"
              title="1-Click Download Windows .ZIP Release Bundle"
            >
              {isZipping ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              <span>{isZipping ? 'Packaging .ZIP...' : 'Download Windows .ZIP'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Platform Selection Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('windows_zip')}
            className={`py-2 px-3 rounded-lg font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'windows_zip'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <FileArchive className="w-4 h-4 text-cyan-300" />
            <span>Windows .ZIP Release</span>
          </button>

          <button
            onClick={() => {
              if (onOpenSetupWizard) {
                onClose();
                onOpenSetupWizard();
              } else {
                setActiveTab('windows_wizard');
              }
            }}
            className={`py-2 px-3 rounded-lg font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'windows_wizard'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Package className="w-4 h-4 text-emerald-400" />
            <span>Windows Setup Wizard</span>
          </button>

          {onOpenGitHubPush && (
            <button
              onClick={() => {
                onClose();
                onOpenGitHubPush();
              }}
              className="py-2 px-3 rounded-lg font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 transition-all cursor-pointer shadow-sm"
              title="Push project directly to GitHub repository"
            >
              <FolderGit2 className="w-4 h-4 text-indigo-400" />
              <span>Push to GitHub</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('java_windows')}
            className={`py-2 px-3 rounded-lg font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'java_windows'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Monitor className="w-4 h-4 text-sky-400" />
            <span>.java Source</span>
          </button>

          <button
            onClick={() => setActiveTab('desktop_bundle')}
            className={`py-2 px-3 rounded-lg font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'desktop_bundle'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <FolderArchive className="w-4 h-4 text-amber-400" />
            <span>Build Bundle (.bat)</span>
          </button>

          <button
            onClick={() => setActiveTab('java_android')}
            className={`py-2 px-3 rounded-lg font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'java_android'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span>Android</span>
          </button>

          <button
            onClick={() => setActiveTab('web_html')}
            className={`py-2 px-3 rounded-lg font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'web_html'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Globe className="w-4 h-4 text-indigo-400" />
            <span>Web HTML</span>
          </button>

          <button
            onClick={() => setActiveTab('blueprint')}
            className={`py-2 px-3 rounded-lg font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'blueprint'
                ? 'bg-slate-700 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <FileCode className="w-4 h-4 text-amber-400" />
            <span>JSON</span>
          </button>
        </div>

        {/* Tab: Windows .ZIP Release Bundle */}
        {activeTab === 'windows_zip' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                  <FileArchive className="w-5 h-5 text-cyan-400" />
                  <span>Standalone Windows Release Package ({zipFileName})</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadWindowsZip}
                    disabled={isZipping}
                    className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-600/25 transition-all cursor-pointer"
                  >
                    {isZipping ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    <span>{isZipping ? 'Generating ZIP...' : 'Download .ZIP Package'}</span>
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Everything required to run, distribute, and install <strong>{project.name}</strong> on any Windows 10 or 11 computer is bundled into a single ZIP archive.
              </p>

              {/* What's inside the ZIP */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1.5">
                  <div className="font-semibold text-cyan-300 flex items-center gap-1.5">
                    <Monitor className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Run_Game.bat (1-Click Launcher)</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Double-click to play instantly. Automatically detects Java SDK / JRE, and falls back to standalone Edge/Chrome runner if Java is not installed.
                  </p>
                </div>

                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1.5">
                  <div className="font-semibold text-emerald-300 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Setup_Windows.cmd (Installer Wizard)</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Interactive Windows batch installer that places files in LocalAppData, creates a Desktop shortcut, and registers a Start Menu entry.
                  </p>
                </div>

                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1.5">
                  <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-amber-400" />
                    <span>InnoSetup_Script.iss (Compiler Script)</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Inno Setup 6 script to compile a professional, single-file <code className="text-amber-200">Setup.exe</code> installer with custom icon and uninstaller.
                  </p>
                </div>

                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1.5">
                  <div className="font-semibold text-indigo-300 flex items-center gap-1.5">
                    <Coffee className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{className}.java (60FPS Desktop Source)</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Full authentic Java Swing/AWT game loop with AABB collision, keyboard polling, audio synthesis, and graphics rendering.
                  </p>
                </div>
              </div>

              {/* Action Banner */}
              <div className="p-3 bg-cyan-950/40 rounded-lg border border-cyan-800/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="text-cyan-200">
                    Ready to distribute on <strong>itch.io</strong>, <strong>GameJolt</strong>, or share directly with friends on Windows.
                  </span>
                </div>

                {onOpenSetupWizard && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenSetupWizard();
                    }}
                    className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <Package className="w-3.5 h-3.5" />
                    <span>Launch Setup Wizard</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab: Windows Setup Wizard Preview */}
        {activeTab === 'windows_wizard' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <Package className="w-5 h-5 text-emerald-400" />
                  <span>Windows Setup Wizard & Installer Generator</span>
                </div>
                {onOpenSetupWizard && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenSetupWizard();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Package className="w-3.5 h-3.5" />
                    <span>Open Interactive Wizard</span>
                  </button>
                )}
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Experience the authentic step-by-step Windows Setup Wizard to configure destination directories, desktop shortcuts, start menu entries, and download the finished release.
              </p>

              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-xs space-y-3">
                <div className="font-semibold text-slate-200">Setup Wizard Features:</div>
                <ul className="space-y-2 text-slate-400">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Configures destination path (e.g. <code className="text-slate-200">C:\Games\{project.name}</code>)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Desktop and Start Menu shortcut generation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Bundled Java Swing 60FPS engine and offline WebView2 runner</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Real-time packaging progress and 1-click ZIP export</span>
                  </li>
                </ul>

                <button
                  onClick={handleDownloadWindowsZip}
                  disabled={isZipping}
                  className="w-full py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-cyan-600/25 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>{isZipping ? 'Building...' : `Download ${zipFileName}`}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 1: Windows PC Java Engine */}
        {activeTab === 'java_windows' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                  <Coffee className="w-4 h-4" />
                  <span>Real Windows Java Source: {className}.java</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyToClipboard(windowsJavaSource, 'win_code')}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 cursor-pointer"
                  >
                    {copied === 'win_code' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied === 'win_code' ? 'Copied' : 'Copy Java Code'}</span>
                  </button>
                  <button
                    id="btn-download-windows-java"
                    onClick={handleDownloadWindowsJava}
                    className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download {className}.java</span>
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Compiles directly on any Windows PC running Java (JDK 8, 11, 17, or 21). Features a 60 FPS multithreaded Game Loop, Swing windowing, Double-Buffered Graphics2D rendering, Keyboard input, and AABB physics.
              </p>

              {/* Windows CMD Command Instructions */}
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-300 font-bold">
                  <span className="flex items-center gap-1.5 text-sky-400">
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Windows Command Prompt (cmd.exe) Steps</span>
                  </span>
                  <button
                    onClick={() => copyToClipboard(`javac ${className}.java\njava ${className}`, 'win_cmd')}
                    className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px] cursor-pointer"
                  >
                    {copied === 'win_cmd' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>Copy Commands</span>
                  </button>
                </div>
                <div className="font-mono text-xs text-slate-200 bg-slate-950 p-2.5 rounded border border-slate-800 space-y-1">
                  <div className="text-slate-500"># 1. Compile the Java game file on Windows:</div>
                  <div>javac {className}.java</div>
                  <div className="text-slate-500 pt-1"># 2. Launch the 60FPS Windows PC Game:</div>
                  <div>java {className}</div>
                </div>
              </div>

              {/* Source code preview snippet */}
              <div className="relative rounded-lg bg-slate-950 border border-slate-800 p-3 max-h-[160px] overflow-y-auto font-mono text-[11px] text-slate-300">
                <pre>{windowsJavaSource.slice(0, 800)} ...</pre>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Desktop Build Bundle (run_windows.bat, Gradle, Maven, Standalone .EXE) */}
        {activeTab === 'desktop_bundle' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <FolderArchive className="w-4 h-4" />
                  <span>Windows Desktop Project Bundle</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadWindowsBatch}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download run_windows.bat</span>
                  </button>
                  <button
                    onClick={handleDownloadGradle}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer border border-slate-700"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download build.gradle</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {/* 1-Click Batch Launcher Card */}
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between font-bold text-white">
                    <span className="flex items-center gap-1.5 text-sky-400">
                      <Monitor className="w-4 h-4" />
                      <span>1-Click Windows Launcher</span>
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">run_windows.bat</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Double-click on any Windows PC. Automatically verifies JDK presence, compiles the Java engine, and runs it with 60FPS double-buffering.
                  </p>
                  <button
                    onClick={handleDownloadWindowsBatch}
                    className="w-full py-1.5 rounded bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 font-semibold text-xs transition-colors"
                  >
                    Download run_windows.bat
                  </button>
                </div>

                {/* Gradle / Maven Project Card */}
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between font-bold text-white">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <Settings className="w-4 h-4" />
                      <span>IntelliJ & Eclipse Project</span>
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">build.gradle</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Open this folder in IntelliJ IDEA, Eclipse, or VS Code. Supports <code className="font-mono text-emerald-300">gradle run</code> and building fat executable JARs.
                  </p>
                  <button
                    onClick={handleDownloadGradle}
                    className="w-full py-1.5 rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 font-semibold text-xs transition-colors"
                  >
                    Download build.gradle
                  </button>
                </div>
              </div>

              {/* Standalone .EXE Packaging Guide */}
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-purple-400">
                  <span className="flex items-center gap-1.5">
                    <Coffee className="w-4 h-4" />
                    <span>How to Package as Standalone Windows .EXE (No Java needed on user's PC)</span>
                  </span>
                  <button
                    onClick={() => copyToClipboard(exePackagingGuide, 'exe_guide')}
                    className="text-[11px] text-slate-400 hover:text-white cursor-pointer"
                  >
                    {copied === 'exe_guide' ? 'Copied Guide!' : 'Copy Guide'}
                  </button>
                </div>
                <div className="bg-slate-950 p-3 rounded font-mono text-[11px] text-slate-300 space-y-1 border border-slate-800 select-all">
                  <div className="text-slate-500">rem Step 1: Create runnable JAR with JDK:</div>
                  <div className="text-emerald-400">javac {className}.java &amp;&amp; jar cfe {className}.jar {className} *.class</div>
                  <div className="text-slate-500 pt-1">rem Step 2: Use native JDK jpackage to generate standalone Windows EXE:</div>
                  <div className="text-amber-300 font-bold">jpackage --type app-image --name "{project.name}" --input . --main-jar {className}.jar --main-class {className} --win-shortcut</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Android Java Mobile Engine */}
        {activeTab === 'java_android' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <Smartphone className="w-4 h-4" />
                  <span>Android Java Game Engine: MainActivity.java</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyToClipboard(androidJavaSource, 'android_code')}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 cursor-pointer"
                  >
                    {copied === 'android_code' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied === 'android_code' ? 'Copied' : 'Copy Android Code'}</span>
                  </button>
                  <button
                    id="btn-download-android-java"
                    onClick={handleDownloadAndroidJava}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download MainActivity.java</span>
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Native Android SDK game architecture utilizing <code className="text-emerald-300">SurfaceView</code>, dedicated background render thread, touchscreen motion events, and mobile hardware acceleration. Runs on phones and tablets from Android 5.0 through Android 15.
              </p>

              {/* Android Studio Instructions */}
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800/80 space-y-2">
                <div className="text-xs text-slate-300 font-bold flex items-center gap-1.5 text-emerald-400">
                  <Cpu className="w-3.5 h-3.5" />
                  <span>How to Run in Android Studio / Build APK</span>
                </div>
                <div className="space-y-1 text-xs text-slate-300">
                  <div className="flex items-start gap-1.5">
                    <span className="font-mono text-emerald-400">1.</span>
                    <span>Create a new project in Android Studio (Template: "No Activity" or "Empty Views Activity").</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="font-mono text-emerald-400">2.</span>
                    <span>Place <strong className="text-white">MainActivity.java</strong> into your <code className="font-mono text-slate-400">app/src/main/java/com/gamedev/starter/</code> directory.</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="font-mono text-emerald-400">3.</span>
                    <span>Click <strong>Run &gt; Run 'app'</strong> or <strong>Build &gt; Build APK(s)</strong> to test on an Android device or emulator!</span>
                  </div>
                </div>
              </div>

              {/* Source code preview snippet */}
              <div className="relative rounded-lg bg-slate-950 border border-slate-800 p-3 max-h-[160px] overflow-y-auto font-mono text-[11px] text-slate-300">
                <pre>{androidJavaSource.slice(0, 800)} ...</pre>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Web HTML */}
        {activeTab === 'web_html' && (
          <div className="p-4 rounded-xl bg-slate-950 border border-indigo-500/30 space-y-3">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
              <Globe className="w-4 h-4" />
              <span>Standalone Web Game (.html)</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Downloads a single, self-contained HTML file with embedded sound, engine, and physics. Open it in any browser or upload directly to Itch.io!
            </p>
            <button
              id="btn-download-html"
              onClick={handleExportHTML}
              className="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Playable HTML</span>
            </button>
          </div>
        )}

        {/* Tab 4: Blueprint JSON */}
        {activeTab === 'blueprint' && (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <FileCode className="w-4 h-4" />
              <span>Project Source Blueprint (.json)</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Back up all your entities, logic blocks, and synth sounds. You can import this JSON file into GameDev Starter Studio on any device!
            </p>
            <button
              id="btn-download-json"
              onClick={handleExportJSON}
              className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Project JSON</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
