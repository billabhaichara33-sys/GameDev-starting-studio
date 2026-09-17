import React, { useState, useRef } from 'react';
import { 
  Gamepad2, 
  Plus, 
  GraduationCap, 
  Palette, 
  Volume2, 
  Play, 
  Sparkles, 
  Flame, 
  Trophy, 
  Copy, 
  FolderPlus, 
  Upload, 
  ArrowRight,
  Clock,
  Layers,
  Users,
  UserCheck,
  Music,
  Zap,
  Radio,
  Sliders,
  Check,
  Compass,
  Box,
  Package,
  FileArchive
} from 'lucide-react';
import { GameProject, UserProgress, User, AudioAsset } from '../types';
import { STARTER_TEMPLATES } from '../data/initialTemplates';
import { DEFAULT_AUDIO_ASSETS } from '../data/defaultAudioAssets';
import { soundManager } from '../utils/audioSynth';
import { AudioAssetsLibrary } from './AudioAssetsLibrary';

interface DashboardProps {
  projects: GameProject[];
  progress: UserProgress;
  user: User | null;
  activeProject?: GameProject | null;
  onOpenProject: (projectId: string) => void;
  onPlayProject: (project: GameProject) => void;
  onCreateNewGame: () => void;
  onOpenAcademy: () => void;
  onOpenAchievements: () => void;
  onOpenSpriteStudio: () => void;
  onOpenAudioManager: () => void;
  onDuplicateProject: (project: GameProject) => void;
  onImportProject: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenCommunity: () => void;
  onOpenPublishModal: () => void;
  onOpenAuth: (mode: 'login' | 'signup') => void;
  onOpenProfile: () => void;
  onSaveSoundToProject?: (sound: AudioAsset) => void;
  onOpenWindowsWizard?: (project: GameProject) => void;
}

type MainScreenTab = 'projects' | 'audio_assets' | 'graphics' | 'community';

export const Dashboard: React.FC<DashboardProps> = ({
  projects,
  progress,
  user,
  activeProject,
  onOpenProject,
  onPlayProject,
  onCreateNewGame,
  onOpenAcademy,
  onOpenAchievements,
  onOpenSpriteStudio,
  onOpenAudioManager,
  onDuplicateProject,
  onImportProject,
  onOpenCommunity,
  onOpenPublishModal,
  onOpenAuth,
  onOpenProfile,
  onSaveSoundToProject,
  onOpenWindowsWizard
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [activeMainTab, setActiveMainTab] = useState<MainScreenTab>('projects');
  const [playingPreviewId, setPlayingPreviewId] = useState<string | null>(null);

  // Quick sound preview helper
  const handleQuickPlay = (asset: AudioAsset) => {
    setPlayingPreviewId(asset.id);
    soundManager.playAsset(asset);
    setTimeout(() => {
      setPlayingPreviewId(null);
    }, Math.max(250, asset.duration * 1000));
  };

  // Level progress math
  const xpForNextLevel = progress.level * 500;
  const currentLevelXp = progress.xp % 500;
  const progressPercent = Math.min(100, Math.round((currentLevelXp / 500) * 100));

  // Curated spotlight audio assets for quick-bar preview
  const spotlightSounds = DEFAULT_AUDIO_ASSETS.slice(0, 6);

  return (
    <div id="dashboard-root" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-slate-100 font-sans">
      {/* Hero Engine Control Center */}
      <div id="dashboard-hero-card" className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#141923] via-[#1a2233] to-[#141923] border border-[#26334a] p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#478cbf]/15 border border-[#478cbf]/30 text-[#599eff] text-xs font-mono">
              <Sparkles className="w-3.5 h-3.5 text-[#599eff]" />
              <span>Real 2D & 3D Game Engine • Godot Architecture • Java & Web Audio</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white font-['Space_Grotesk'] leading-tight">
              Create 2D & 3D Games, Sound FX & Shaders
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Design multi-dimensional games with native scene hierarchies, PBR 3D meshes, Web Audio synthesizers, and procedural logic. Export production builds for PC Windows (<span className="font-mono text-indigo-300">.exe/.jar</span>) and Android (<span className="font-mono text-emerald-300">.apk</span>).
            </p>

            {/* Quick Audio Asset Preview Bar directly in the Hero */}
            <div className="pt-2 flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Instant Audio Preview:</span>
              </span>
              {spotlightSounds.map((snd) => {
                const isPlaying = playingPreviewId === snd.id;
                return (
                  <button
                    key={snd.id}
                    onClick={() => handleQuickPlay(snd)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
                      isPlaying
                        ? 'bg-cyan-500 text-black font-bold animate-pulse'
                        : 'bg-[#1e2638] hover:bg-[#28344c] text-slate-300 border border-[#2d3a54]'
                    }`}
                    title={`Play ${snd.name} (${snd.wave} wave, ${snd.frequency}Hz)`}
                  >
                    <Play className="w-2.5 h-2.5 fill-current" />
                    <span>{snd.name.replace(/(Classic|Gold|Mega|Melee|Super|Stage)\s*/, '')}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* User Progress Stats Card */}
          <div id="user-stats-strip" className="bg-[#121622]/90 backdrop-blur border border-[#243046] rounded-xl p-5 min-w-[280px] sm:min-w-[320px] shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-mono">Engine Rank</div>
                  <div className="text-base font-bold text-white">Level {progress.level} Creator</div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
                <Flame className="w-3.5 h-3.5" />
                <span>{progress.streakDays} Day Streak</span>
              </div>
            </div>

            {/* XP Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium font-mono">
                <span className="text-slate-400">Total XP: <strong className="text-indigo-300">{progress.xp}</strong></span>
                <span className="text-slate-500">{currentLevelXp} / 500 XP</span>
              </div>
              <div className="w-full h-2 bg-[#1b2233] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 via-[#478cbf] to-amber-400 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <div className="pt-1 flex items-center justify-between text-xs text-slate-400">
              <span>{progress.completedLessonIds.length} Lessons Finished</span>
              <button 
                id="btn-view-achievements"
                onClick={onOpenAchievements}
                className="text-[#599eff] hover:text-[#7bb3ff] font-medium hover:underline flex items-center gap-1 cursor-pointer"
              >
                View Badges <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Account Status */}
            <div className="pt-2 border-t border-[#232c40] flex items-center justify-between text-xs">
              {user ? (
                <>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-base">{user.avatarUrl || '🎮'}</span>
                    <span className="font-semibold text-white truncate max-w-[130px]">
                      {user.displayName || user.username}
                    </span>
                  </div>
                  <button 
                    id="btn-open-user-profile-strip"
                    onClick={onOpenProfile}
                    className="text-[#599eff] hover:text-[#7bb3ff] font-medium cursor-pointer"
                  >
                    My Profile
                  </button>
                </>
              ) : (
                <>
                  <span className="text-slate-400 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-slate-500" /> Guest Mode
                  </span>
                  <div className="flex items-center gap-2">
                    <button 
                      id="btn-hero-sign-in"
                      onClick={() => onOpenAuth('login')}
                      className="text-[#599eff] hover:text-[#7bb3ff] font-semibold cursor-pointer"
                    >
                      Sign In
                    </button>
                    <span className="text-slate-600">•</span>
                    <button 
                      id="btn-hero-join-free"
                      onClick={() => onOpenAuth('signup')}
                      className="text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
                    >
                      Join Free
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="mt-8 pt-6 border-t border-[#243046] flex flex-wrap items-center gap-3">
          <button
            id="btn-new-game-primary"
            onClick={onCreateNewGame}
            className="px-5 py-2.5 rounded-xl bg-[#478cbf] hover:bg-[#599eff] text-white font-bold text-sm shadow-md shadow-[#478cbf]/30 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>New Game</span>
          </button>

          {/* AUDIO ASSETS BUTTON (Primary focus) */}
          <button
            id="btn-main-audio-assets"
            onClick={() => setActiveMainTab('audio_assets')}
            className={`px-4 py-2.5 rounded-xl border text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeMainTab === 'audio_assets'
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-500/20'
                : 'bg-[#1b2333] hover:bg-[#242f44] border-[#2b3952] text-cyan-400'
            }`}
          >
            <Volume2 className="w-4 h-4 text-cyan-400" />
            <span>Audio Assets & Sound Library</span>
          </button>

          <button
            id="btn-open-community-showcase"
            onClick={onOpenCommunity}
            className="px-4 py-2.5 rounded-xl bg-[#1b2333] hover:bg-[#242f44] border border-[#2b3952] text-purple-300 font-semibold text-sm flex items-center gap-2 transition-all cursor-pointer"
          >
            <Users className="w-4 h-4 text-purple-400" />
            <span>Community</span>
          </button>

          <button
            id="btn-open-academy"
            onClick={onOpenAcademy}
            className="px-4 py-2.5 rounded-xl bg-[#1b2333] hover:bg-[#242f44] border border-[#2b3952] text-slate-200 font-medium text-sm flex items-center gap-2 transition-all cursor-pointer"
          >
            <GraduationCap className="w-4 h-4 text-emerald-400" />
            <span>Coding Academy</span>
          </button>

          <button
            id="btn-open-sprite-editor"
            onClick={onOpenSpriteStudio}
            className="px-4 py-2.5 rounded-xl bg-[#1b2333] hover:bg-[#242f44] border border-[#2b3952] text-slate-200 font-medium text-sm flex items-center gap-2 transition-all cursor-pointer"
          >
            <Palette className="w-4 h-4 text-amber-400" />
            <span>Sprite Studio</span>
          </button>

          <label 
            id="btn-import-project"
            className="px-4 py-2.5 rounded-xl bg-[#1b2333]/80 hover:bg-[#242f44] border border-[#2b3952] text-slate-300 font-medium text-sm flex items-center gap-2 transition-all cursor-pointer ml-auto"
          >
            <Upload className="w-4 h-4 text-slate-400" />
            <span>Import Project</span>
            <input 
              ref={fileInputRef} 
              type="file" 
              accept=".json" 
              className="hidden" 
              onChange={onImportProject}
            />
          </label>
        </div>
      </div>

      {/* Main Screen Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#253147] pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveMainTab('projects')}
          className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeMainTab === 'projects'
              ? 'bg-[#478cbf] text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-[#1c2333]'
          }`}
        >
          <Gamepad2 className="w-4 h-4" />
          <span>Projects & Templates</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-black/30 font-mono">
            {projects.length}
          </span>
        </button>

        {/* AUDIO ASSETS TAB */}
        <button
          onClick={() => setActiveMainTab('audio_assets')}
          className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeMainTab === 'audio_assets'
              ? 'bg-cyan-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-[#1c2333]'
          }`}
        >
          <Volume2 className="w-4 h-4 text-cyan-300" />
          <span>Audio Assets & Sound Library</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-black/30 font-mono text-cyan-200">
            {DEFAULT_AUDIO_ASSETS.length}+
          </span>
        </button>

        <button
          onClick={onOpenSpriteStudio}
          className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-400 hover:text-white hover:bg-[#1c2333] flex items-center gap-2 transition-all cursor-pointer"
        >
          <Palette className="w-4 h-4 text-amber-400" />
          <span>Pixel Art Studio</span>
        </button>

        <button
          onClick={onOpenAcademy}
          className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-400 hover:text-white hover:bg-[#1c2333] flex items-center gap-2 transition-all cursor-pointer"
        >
          <GraduationCap className="w-4 h-4 text-emerald-400" />
          <span>Engine Academy</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: AUDIO ASSETS & SOUND LIBRARY VIEW                                 */}
      {/* ========================================================================= */}
      {activeMainTab === 'audio_assets' && (
        <div className="space-y-6">
          <AudioAssetsLibrary
            activeProject={activeProject || projects[0] || null}
            onSaveSoundToProject={(sound) => {
              onSaveSoundToProject?.(sound);
            }}
            isEmbedded={true}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PROJECTS & TEMPLATES VIEW                                         */}
      {/* ========================================================================= */}
      {activeMainTab === 'projects' && (
        <div className="space-y-10">
          {/* Audio Assets Quick Shelf in Projects view */}
          <div className="p-5 bg-[#141a26] border border-[#232f45] rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                <Music className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white font-['Space_Grotesk'] flex items-center gap-2">
                  <span>Audio Assets & Procedural Synthesizer</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 font-mono border border-cyan-500/20">NEW</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Browse retro jump, laser, coin, and melody tracks, or synthesize custom procedural audio for your games.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setActiveMainTab('audio_assets')}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-cyan-600/20 transition-all cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Open Audio Assets Library</span>
              </button>
            </div>
          </div>

          {/* Ready-made Beginner Templates */}
          <div id="starter-templates-section" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white font-['Space_Grotesk'] flex items-center gap-2">
                  <Gamepad2 className="w-5 h-5 text-[#599eff]" />
                  <span>Ready-Made Starter Templates</span>
                </h2>
                <p className="text-slate-400 text-sm">Choose a genre to learn mechanics or customize as your own game</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {STARTER_TEMPLATES.map((tmpl) => (
                <div
                  key={tmpl.id}
                  id={`card-template-${tmpl.genre}`}
                  className="group bg-[#141924] border border-[#242f44] hover:border-[#478cbf]/50 rounded-xl p-5 flex flex-col justify-between transition-all hover:shadow-lg hover:shadow-[#478cbf]/5"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        tmpl.genre === 'platformer' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' :
                        tmpl.genre === 'space_shooter' ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20' :
                        tmpl.genre === 'top_down' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {tmpl.genre.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">{tmpl.entities.length} elements</span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-[#599eff] transition-colors">
                        {tmpl.name}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                        {tmpl.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-[#222b3e] flex items-center gap-2">
                    <button
                      id={`btn-play-template-${tmpl.genre}`}
                      onClick={() => onPlayProject(tmpl)}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Test Run</span>
                    </button>
                    <button
                      id={`btn-edit-template-${tmpl.genre}`}
                      onClick={() => onDuplicateProject(tmpl)}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-[#1f283a] hover:bg-[#29354d] text-slate-200 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <FolderPlus className="w-3.5 h-3.5" />
                      <span>Use Template</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Projects Section */}
          <div id="recent-projects-section" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white font-['Space_Grotesk'] flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#599eff]" />
                  <span>Your Game Projects ({projects.length})</span>
                </h2>
                <p className="text-slate-400 text-sm">Pick up where you left off or edit levels and code</p>
              </div>
              <button
                id="btn-create-project-card"
                onClick={onCreateNewGame}
                className="text-xs font-semibold text-[#599eff] hover:text-[#7bb3ff] flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Blank Game</span>
              </button>
            </div>

            {projects.length === 0 ? (
              <div id="empty-projects-state" className="p-12 text-center rounded-2xl bg-[#141924]/60 border border-[#242f44] space-y-4">
                <div className="w-12 h-12 mx-auto rounded-xl bg-[#478cbf]/15 text-[#599eff] flex items-center justify-center">
                  <Gamepad2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-white">No projects yet!</h4>
                  <p className="text-sm text-slate-400 max-w-md mx-auto">
                    Get started by choosing a ready-made template above or clicking "New Game" to start with a clean slate.
                  </p>
                </div>
                <button
                  onClick={onCreateNewGame}
                  className="px-4 py-2 rounded-xl bg-[#478cbf] text-white text-xs font-semibold cursor-pointer"
                >
                  Start Your First Project
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((proj) => (
                  <div
                    key={proj.id}
                    id={`project-card-${proj.id}`}
                    className="bg-[#141924] border border-[#242f44] hover:border-[#354360] rounded-xl p-5 flex flex-col justify-between transition-all space-y-4 shadow-sm hover:shadow-md"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#1e2738] text-slate-300 capitalize border border-[#2b374e]">
                          {proj.genre.replace('_', ' ')}
                        </span>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(proj.lastModified).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <h3 
                        className="text-base font-bold text-white hover:text-[#599eff] transition-colors cursor-pointer" 
                        onClick={() => onOpenProject(proj.id)}
                      >
                        {proj.name}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-2">
                        {proj.description || 'Custom 2D indie project'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-[#222b3e] text-xs text-slate-400">
                      <span>{proj.entities.length} entities • {proj.logicRules.length} rules</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          id={`btn-dup-${proj.id}`}
                          title="Duplicate project"
                          onClick={() => onDuplicateProject(proj)}
                          className="p-1.5 rounded-lg hover:bg-[#20293d] text-slate-400 hover:text-white cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        {onOpenWindowsWizard && (
                          <button
                            id={`btn-win-zip-${proj.id}`}
                            title="Package as Windows .ZIP / Setup Wizard"
                            onClick={() => onOpenWindowsWizard(proj)}
                            className="px-2 py-1 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 font-semibold border border-cyan-500/30 flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Package className="w-3 h-3 text-cyan-400" />
                            <span>.ZIP</span>
                          </button>
                        )}
                        <button
                          id={`btn-play-${proj.id}`}
                          onClick={() => onPlayProject(proj)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center gap-1 cursor-pointer"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Play</span>
                        </button>
                        <button
                          id={`btn-edit-${proj.id}`}
                          onClick={() => onOpenProject(proj.id)}
                          className="px-2.5 py-1 rounded-lg bg-[#478cbf] hover:bg-[#599eff] text-white font-medium cursor-pointer"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Community Showcase Spotlight Banner */}
          <div 
            id="community-spotlight-banner"
            className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-purple-950/40 via-[#141924] to-indigo-950/40 border border-purple-500/30 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl"
          >
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold">
                <Users className="w-3.5 h-3.5" />
                <span>Community Creator Hub</span>
              </div>
              <h3 className="text-xl font-bold text-white font-['Space_Grotesk']">
                Discover & Share Games with Other Creators
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Browse custom platformers, space shooters, and puzzle games built in the starter studio. Like, review, and fork projects to study other developers' visual logic blocks!
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                id="btn-banner-share-game"
                onClick={onOpenPublishModal}
                className="px-4 py-2.5 rounded-xl bg-[#1b2333] hover:bg-[#252f44] text-slate-200 text-xs font-bold border border-[#2b3952] flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Upload className="w-3.5 h-3.5 text-purple-400" />
                <span>Upload Game</span>
              </button>
              <button
                id="btn-banner-browse-showcase"
                onClick={onOpenCommunity}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 flex items-center gap-2 cursor-pointer transition-all"
              >
                <Users className="w-4 h-4" />
                <span>Explore Showcase</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
