import React, { useState, useEffect } from 'react';
import { 
  Monitor, 
  Download, 
  X, 
  Check, 
  Folder, 
  HardDrive, 
  ShieldCheck, 
  Sparkles, 
  Play, 
  FileCode, 
  Cpu, 
  Layers, 
  Package, 
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  FileArchive
} from 'lucide-react';
import { GameProject } from '../types';
import { createWindowsZipBundle } from '../utils/windowsPackager';
import { soundManager } from '../utils/audioSynth';

interface WindowsSetupWizardModalProps {
  project: GameProject;
  onClose: () => void;
  onPlayTest?: () => void;
}

type WizardStep = 'welcome' | 'license' | 'directory' | 'tasks' | 'ready' | 'installing' | 'completed';

export const WindowsSetupWizardModal: React.FC<WindowsSetupWizardModalProps> = ({
  project,
  onClose,
  onPlayTest
}) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>('welcome');
  const [acceptedLicense, setAcceptedLicense] = useState<boolean>(true);
  const [installPath, setInstallPath] = useState<string>(`C:\\Games\\${project.name.replace(/[^a-zA-Z0-9]/g, '') || 'MyGame'}`);
  
  // Tasks options
  const [createDesktopShortcut, setCreateDesktopShortcut] = useState<boolean>(true);
  const [createStartMenuEntry, setCreateStartMenuEntry] = useState<boolean>(true);
  const [includeJavaEngine, setIncludeJavaEngine] = useState<boolean>(true);
  const [includeOfflineWeb, setIncludeOfflineWeb] = useState<boolean>(true);
  const [includeInnoSetupScript, setIncludeInnoSetupScript] = useState<boolean>(true);

  // Installation simulation
  const [installProgress, setInstallProgress] = useState<number>(0);
  const [currentExtractFile, setCurrentExtractFile] = useState<string>('Initializing packaging...');
  const [isGeneratingZip, setIsGeneratingZip] = useState<boolean>(false);
  const [downloadReady, setDownloadReady] = useState<boolean>(false);
  const [zipBlob, setZipBlob] = useState<Blob | null>(null);

  const className = project.name.replace(/[^a-zA-Z0-9]/g, '') || 'JavaGame';
  const zipFileName = `${project.name.replace(/[^a-zA-Z0-9_-]/g, '_')}-Windows-Setup.zip`;

  // Handle direct download of the generated zip
  const handleDownloadZip = async () => {
    setIsGeneratingZip(true);
    soundManager.playCoin();
    try {
      const blob = zipBlob || await createWindowsZipBundle(project);
      setZipBlob(blob);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = zipFileName;
      a.click();
      URL.revokeObjectURL(url);
      setDownloadReady(true);
    } catch (err) {
      console.error('Failed to create zip bundle:', err);
    } finally {
      setIsGeneratingZip(false);
    }
  };

  // Run the installation animation when entering 'installing'
  useEffect(() => {
    if (currentStep !== 'installing') return;

    let progress = 0;
    const filesToExtract = [
      'Preparing target directory...',
      `Generating ${className}.java (Swing 60FPS engine)...`,
      'Configuring Run_Game.bat multi-runtime launcher...',
      'Bundling offline Edge / Chrome HTML5 WebView...',
      'Compiling Setup_Windows.cmd automated installer...',
      'Generating Inno Setup 6 compiler script (InnoSetup_Script.iss)...',
      'Injecting audio synth presets and physics parameters...',
      'Writing desktop shortcuts and start menu entries...',
      'Finalizing ZIP compression (lzma/deflate)...'
    ];

    const interval = setInterval(async () => {
      progress += Math.floor(Math.random() * 14) + 8;
      const fileIndex = Math.min(
        Math.floor((progress / 100) * filesToExtract.length),
        filesToExtract.length - 1
      );
      setCurrentExtractFile(filesToExtract[fileIndex]);

      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        try {
          const blob = await createWindowsZipBundle(project);
          setZipBlob(blob);
          setDownloadReady(true);
        } catch (e) {
          console.error(e);
        }
        soundManager.playCoin();
        setTimeout(() => {
          setCurrentStep('completed');
        }, 600);
      }
      setInstallProgress(progress);
    }, 180);

    return () => clearInterval(interval);
  }, [currentStep, className, project]);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      {/* Authentic Windows Setup Window Frame */}
      <div className="w-full max-w-2xl bg-[#1e2330] border-2 border-[#3b475f] rounded-xl shadow-2xl overflow-hidden flex flex-col font-sans select-none text-slate-200">
        
        {/* Windows Titlebar */}
        <div className="h-9 bg-[#141824] border-b border-[#2d374a] px-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Monitor className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-semibold text-slate-200">
              Setup — {project.name} (Windows 64-bit / 32-bit)
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onClose}
              className="w-6 h-6 rounded hover:bg-red-600/80 text-slate-400 hover:text-white flex items-center justify-center text-xs transition-colors cursor-pointer"
              title="Cancel Setup"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Wizard Main Area */}
        <div className="flex-1 min-h-[380px] flex flex-col">
          {/* Top Banner (except on Welcome/Completed) */}
          {currentStep !== 'welcome' && currentStep !== 'completed' && (
            <div className="bg-[#181d2a] border-b border-[#2a3447] p-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-sm">
                  {currentStep === 'license' && 'License Agreement'}
                  {currentStep === 'directory' && 'Select Destination Location'}
                  {currentStep === 'tasks' && 'Select Additional Tasks'}
                  {currentStep === 'ready' && 'Ready to Package & Install'}
                  {currentStep === 'installing' && 'Installing...'}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {currentStep === 'license' && 'Please read the following important information before continuing.'}
                  {currentStep === 'directory' && 'Where should the game files be installed on your Windows PC?'}
                  {currentStep === 'tasks' && 'Which additional shortcuts and launch runtimes should be created?'}
                  {currentStep === 'ready' && 'Setup is now ready to begin installing files onto your computer.'}
                  {currentStep === 'installing' && 'Please wait while Setup installs files and builds the Windows package.'}
                </p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-[#273247] border border-[#3d4c69] flex items-center justify-center text-cyan-400 shrink-0">
                <Package className="w-5 h-5" />
              </div>
            </div>
          )}

          {/* STEP 1: WELCOME SCREEN */}
          {currentStep === 'welcome' && (
            <div className="flex-1 flex flex-col md:flex-row bg-[#181e2b]">
              {/* Left Classic Wizard Sidebar */}
              <div className="w-48 bg-gradient-to-b from-[#1a365d] via-[#1e293b] to-[#0f172a] p-5 flex flex-col justify-between border-r border-[#2a374e]">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-400 shadow-lg">
                    <Monitor className="w-6 h-6" />
                  </div>
                  <div className="text-white font-bold text-sm tracking-tight font-['Space_Grotesk']">
                    Windows Installer
                  </div>
                  <div className="text-[10px] text-cyan-300 font-mono">
                    v1.0.0 Release
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 space-y-1">
                  <div>Publisher:</div>
                  <div className="text-slate-200 font-semibold truncate">{project.name} Studio</div>
                </div>
              </div>

              {/* Right Content */}
              <div className="flex-1 p-6 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <h2 className="text-lg font-bold text-white leading-snug">
                    Welcome to the {project.name} Setup Wizard
                  </h2>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    This wizard will package and prepare <strong>{project.name}</strong> for installation on your Windows PC.
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    The package includes:
                  </p>
                  <ul className="text-xs text-slate-300 space-y-2 pl-2">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Ready-to-run Windows launcher (<strong>Run_Game.bat</strong>)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Java 60FPS Desktop Source (<strong>{className}.java</strong>)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Inno Setup compiler script for single <strong>Setup.exe</strong></span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Self-contained offline Edge / WebView2 runner</span>
                    </li>
                  </ul>
                </div>

                <div className="p-3 bg-[#131722] rounded-lg border border-[#273247] text-[11px] text-slate-400">
                  Click <strong>Next</strong> to continue, or download the <strong>.ZIP</strong> package directly.
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: LICENSE */}
          {currentStep === 'license' && (
            <div className="flex-1 p-5 space-y-4">
              <div className="text-xs text-slate-300">
                Please read the following Indie Game & Open Source License terms:
              </div>
              <div className="h-44 bg-[#121622] border border-[#2c374d] rounded-lg p-3 overflow-y-auto text-[11px] font-mono text-slate-300 leading-relaxed space-y-2">
                <p className="font-bold text-white">MIT LICENSE / INDIE GAME END USER LICENSE</p>
                <p>Copyright (c) {new Date().getFullYear()} {project.name} Developers.</p>
                <p>Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files, to run, play, distribute, and modify the software without restriction.</p>
                <p>THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.</p>
                <p>In no event shall the authors or copyright holders be liable for any claim, damages or other liability.</p>
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                  <input
                    type="radio"
                    name="license"
                    checked={acceptedLicense}
                    onChange={() => setAcceptedLicense(true)}
                    className="accent-cyan-500"
                  />
                  <span>I accept the agreement</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                  <input
                    type="radio"
                    name="license"
                    checked={!acceptedLicense}
                    onChange={() => setAcceptedLicense(false)}
                    className="accent-cyan-500"
                  />
                  <span>I do not accept the agreement</span>
                </label>
              </div>
            </div>
          )}

          {/* STEP 3: DESTINATION DIRECTORY */}
          {currentStep === 'directory' && (
            <div className="flex-1 p-5 space-y-4">
              <div className="text-xs text-slate-300">
                Setup will install <strong>{project.name}</strong> into the following folder:
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <HardDrive className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={installPath}
                      onChange={(e) => setInstallPath(e.target.value)}
                      className="w-full bg-[#121622] border border-[#2c374d] rounded-lg pl-9 pr-3 py-2 text-xs text-white font-mono outline-none focus:border-cyan-500"
                    />
                  </div>
                  <button
                    onClick={() => setInstallPath(`C:\\Users\\User\\Games\\${className}`)}
                    className="px-3 py-2 bg-[#263147] hover:bg-[#33425e] text-slate-200 text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    Reset
                  </button>
                </div>

                <div className="text-[11px] text-slate-400 flex items-center justify-between pt-2">
                  <span>At least <strong>1.5 MB</strong> of free disk space is required.</span>
                  <span className="text-emerald-400">Disk Space Available: <strong>480.2 GB</strong></span>
                </div>
              </div>

              <div className="p-3 bg-[#131722] rounded-lg border border-[#273247] space-y-1">
                <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Folder className="w-3.5 h-3.5 text-amber-400" />
                  <span>Portable Package Support:</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  The downloaded <strong>.ZIP</strong> can be unpacked into this folder or extracted to a USB drive for 100% portable plug-and-play gaming on any PC.
                </p>
              </div>
            </div>
          )}

          {/* STEP 4: ADDITIONAL TASKS */}
          {currentStep === 'tasks' && (
            <div className="flex-1 p-5 space-y-4">
              <div className="text-xs text-slate-300">
                Select the additional tasks you would like Setup to perform while installing:
              </div>

              <div className="space-y-3 bg-[#141926] p-4 rounded-xl border border-[#2b364c]">
                <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                  Windows Shortcuts & Integration
                </div>

                <label className="flex items-center gap-2.5 text-xs text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createDesktopShortcut}
                    onChange={(e) => setCreateDesktopShortcut(e.target.checked)}
                    className="accent-cyan-500 rounded"
                  />
                  <span>Create a <strong>Desktop shortcut</strong></span>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createStartMenuEntry}
                    onChange={(e) => setCreateStartMenuEntry(e.target.checked)}
                    className="accent-cyan-500 rounded"
                  />
                  <span>Create a <strong>Start Menu folder & program icon</strong></span>
                </label>

                <div className="h-px bg-[#263147] my-2" />

                <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                  Bundled Runtimes & Tooling
                </div>

                <label className="flex items-center gap-2.5 text-xs text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeJavaEngine}
                    onChange={(e) => setIncludeJavaEngine(e.target.checked)}
                    className="accent-cyan-500 rounded"
                  />
                  <span>Include <strong>Java 60FPS Swing Desktop Engine</strong> ({className}.java)</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeOfflineWeb}
                    onChange={(e) => setIncludeOfflineWeb(e.target.checked)}
                    className="accent-cyan-500 rounded"
                  />
                  <span>Include <strong>Offline Standalone Edge/Chrome HTML5 Runner</strong> (index.html)</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeInnoSetupScript}
                    onChange={(e) => setIncludeInnoSetupScript(e.target.checked)}
                    className="accent-cyan-500 rounded"
                  />
                  <span>Include <strong>Inno Setup 6 Script</strong> to build single <strong>Setup.exe</strong></span>
                </label>
              </div>
            </div>
          )}

          {/* STEP 5: READY TO INSTALL */}
          {currentStep === 'ready' && (
            <div className="flex-1 p-5 space-y-4">
              <div className="text-xs text-slate-300">
                Click <strong>Install</strong> to begin packaging. If you want to review or change any settings, click <strong>Back</strong>.
              </div>

              <div className="bg-[#121622] border border-[#2c374d] rounded-lg p-3 space-y-3 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Destination directory:</span>
                  <span className="text-white font-semibold">{installPath}</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Target Package:</span>
                  <span className="text-cyan-400 font-semibold">{zipFileName}</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Selected Components:</span>
                  <ul className="text-slate-300 text-[11px] space-y-0.5 mt-1 list-disc pl-4 font-sans">
                    {createDesktopShortcut && <li>Desktop shortcut creation</li>}
                    {createStartMenuEntry && <li>Windows Start Menu integration</li>}
                    {includeJavaEngine && <li>Native Java 60FPS source & compile launcher</li>}
                    {includeOfflineWeb && <li>Offline HTML5 standalone runner</li>}
                    {includeInnoSetupScript && <li>Inno Setup 6 compiler script (.iss)</li>}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: INSTALLING / PACKAGING */}
          {currentStep === 'installing' && (
            <div className="flex-1 p-6 flex flex-col justify-center space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-semibold">Packaging game release for Windows...</span>
                  <span className="text-cyan-400 font-mono font-bold">{installProgress}%</span>
                </div>

                {/* Progress Bar */}
                <div className="h-5 w-full bg-[#131722] rounded-md border border-[#2c374d] overflow-hidden p-0.5">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-500 via-sky-400 to-emerald-400 rounded transition-all duration-150 relative overflow-hidden"
                    style={{ width: `${installProgress}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse" />
                  </div>
                </div>

                <div className="text-[11px] font-mono text-slate-400 truncate pt-1">
                  {currentExtractFile}
                </div>
              </div>

              <div className="p-4 bg-[#141926] rounded-xl border border-[#273247] flex items-center gap-3">
                <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin" />
                <div className="text-xs text-slate-300">
                  Compiling assets, generating batch installers, and compressing into a production <strong>.ZIP</strong> package.
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: COMPLETED */}
          {currentStep === 'completed' && (
            <div className="flex-1 flex flex-col md:flex-row bg-[#181e2b]">
              {/* Left Sidebar */}
              <div className="w-48 bg-gradient-to-b from-[#065f46] via-[#1e293b] to-[#0f172a] p-5 flex flex-col justify-between border-r border-[#2a374e]">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shadow-lg">
                    <Check className="w-7 h-7" />
                  </div>
                  <div className="text-white font-bold text-sm tracking-tight font-['Space_Grotesk']">
                    Setup Complete!
                  </div>
                </div>

                <div className="text-[10px] text-emerald-300 font-mono">
                  Package Ready
                </div>
              </div>

              {/* Right Content */}
              <div className="flex-1 p-6 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <h2 className="text-lg font-bold text-white">
                    Completing the {project.name} Setup Wizard
                  </h2>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Setup has finished packaging <strong>{project.name}</strong> for Windows. The application can be launched using the bundled <strong>Run_Game.bat</strong> or installed to your PC with <strong>Setup_Windows.cmd</strong>.
                  </p>

                  <div className="p-4 bg-[#121622] rounded-xl border border-[#2c374d] space-y-3">
                    <div className="text-xs font-semibold text-white flex items-center gap-2">
                      <FileArchive className="w-4 h-4 text-cyan-400" />
                      <span>{zipFileName}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        onClick={handleDownloadZip}
                        disabled={isGeneratingZip}
                        className="w-full py-2.5 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/30 transition-all cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        <span>{isGeneratingZip ? 'Building...' : 'Download .ZIP Package'}</span>
                      </button>

                      {onPlayTest && (
                        <button
                          onClick={() => {
                            onClose();
                            onPlayTest();
                          }}
                          className="w-full py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                        >
                          <Play className="w-4 h-4" />
                          <span>Test Play Now</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400">
                  Click <strong>Finish</strong> to exit Setup.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Bottom Navigation Buttons */}
        <div className="h-14 bg-[#141824] border-t border-[#2a3447] px-4 flex items-center justify-between">
          <div>
            {currentStep !== 'completed' && (
              <button
                onClick={handleDownloadZip}
                disabled={isGeneratingZip}
                className="px-3 py-1.5 rounded-lg bg-[#20293d] hover:bg-[#2b3752] text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Directly download .ZIP without wizard steps"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Quick .ZIP Download</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Back Button */}
            {currentStep !== 'welcome' && currentStep !== 'installing' && currentStep !== 'completed' && (
              <button
                onClick={() => {
                  if (currentStep === 'license') setCurrentStep('welcome');
                  if (currentStep === 'directory') setCurrentStep('license');
                  if (currentStep === 'tasks') setCurrentStep('directory');
                  if (currentStep === 'ready') setCurrentStep('tasks');
                }}
                className="px-4 py-1.5 rounded-lg bg-[#242d40] hover:bg-[#303c54] text-slate-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Back</span>
              </button>
            )}

            {/* Next / Install / Finish Buttons */}
            {currentStep === 'welcome' && (
              <button
                onClick={() => setCurrentStep('license')}
                className="px-5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1 shadow-md shadow-cyan-600/30 transition-colors cursor-pointer"
              >
                <span>Next</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}

            {currentStep === 'license' && (
              <button
                onClick={() => setCurrentStep('directory')}
                disabled={!acceptedLicense}
                className={`px-5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
                  acceptedLicense 
                    ? 'bg-cyan-600 hover:bg-cyan-500 text-white cursor-pointer' 
                    : 'bg-[#242d40] text-slate-500 cursor-not-allowed'
                }`}
              >
                <span>Next</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}

            {currentStep === 'directory' && (
              <button
                onClick={() => setCurrentStep('tasks')}
                className="px-5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Next</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}

            {currentStep === 'tasks' && (
              <button
                onClick={() => setCurrentStep('ready')}
                className="px-5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Next</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}

            {currentStep === 'ready' && (
              <button
                onClick={() => setCurrentStep('installing')}
                className="px-5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 shadow-md shadow-emerald-600/30 transition-colors cursor-pointer"
              >
                <span>Install</span>
                <Download className="w-3 h-3" />
              </button>
            )}

            {currentStep === 'completed' && (
              <button
                onClick={onClose}
                className="px-6 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Finish
              </button>
            )}

            {/* Cancel Button */}
            {currentStep !== 'completed' && (
              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-lg bg-[#202738] hover:bg-[#2b354c] text-slate-400 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
