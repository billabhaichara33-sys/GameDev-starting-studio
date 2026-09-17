import React, { useState, useEffect } from 'react';
import { GameProject, UserProgress, User } from './types';
import { STARTER_TEMPLATES } from './data/initialTemplates';
import { Dashboard } from './components/Dashboard';
import { GameEditor } from './components/GameEditor';
import { AcademyView } from './components/AcademyView';
import { PixelArtEditor } from './components/PixelArtEditor';
import { AudioManager } from './components/AudioManager';
import { AudioAssetsLibrary } from './components/AudioAssetsLibrary';
import { LivePlaytestModal } from './components/LivePlaytestModal';
import { AIAssistantModal } from './components/AIAssistantModal';
import { ExportModal } from './components/ExportModal';
import { WindowsSetupWizardModal } from './components/WindowsSetupWizardModal';
import { GitHubPushModal } from './components/GitHubPushModal';
import { AchievementsModal } from './components/AchievementsModal';
import { AuthModal } from './components/AuthModal';
import { UserProfileModal } from './components/UserProfileModal';
import { CommunityShowcase } from './components/CommunityShowcase';
import { PublishGameModal } from './components/PublishGameModal';
import { soundManager } from './utils/audioSynth';
import { 
  apiGetMe, 
  apiLogout, 
  apiSyncProgress 
} from './utils/api';
import { 
  Gamepad2, 
  GraduationCap, 
  Palette, 
  Volume2, 
  Users, 
  Sparkles, 
  LogIn, 
  User as UserIcon, 
  Flame, 
  Trophy,
  Upload,
  ArrowRight
} from 'lucide-react';

const LOCAL_STORAGE_PROJECTS_KEY = 'gamedev_starter_projects_v2';
const LOCAL_STORAGE_PROGRESS_KEY = 'gamedev_starter_progress_v2';

const INITIAL_PROGRESS: UserProgress = {
  xp: 120,
  level: 1,
  streakDays: 3,
  lastActiveDate: new Date().toISOString(),
  completedLessonIds: ['lesson-1-variables'],
  passedQuizIds: ['lesson-1-variables'],
  unlockedBadgeIds: ['badge-first-step'],
  completedChallengeLessonIds: ['lesson-1-variables'],
  exploredConceptLessonIds: ['lesson-1-variables'],
  lessonMastery: {
    'lesson-1-variables': 100
  },
  stats: {
    gamesCreated: 3,
    playTestsRun: 8,
    spritesCreated: 4,
    logicBlocksCreated: 12,
    codeChallengesSolved: 2,
  }
};

type AppView = 'dashboard' | 'editor' | 'academy' | 'sprite_studio' | 'audio_studio' | 'community';

export default function App() {
  // User Authentication State
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState<boolean>(false);

  // Load saved projects or fallback to initial starter templates
  const [projects, setProjects] = useState<GameProject[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_PROJECTS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not read saved projects, using starter templates', e);
    }
    return STARTER_TEMPLATES;
  });

  // Load user progress or fallback
  const [progress, setProgress] = useState<UserProgress>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_PROGRESS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not read user progress, using defaults', e);
    }
    return INITIAL_PROGRESS;
  });

  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<AppView>('dashboard');

  // Modals & Playtest Target
  const [isPlaytesting, setIsPlaytesting] = useState<boolean>(false);
  const [customPlayProject, setCustomPlayProject] = useState<GameProject | null>(null);
  const [isAIModalOpen, setIsAIModalOpen] = useState<boolean>(false);
  const [aiContext, setAiContext] = useState<string | undefined>(undefined);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isWindowsSetupWizardOpen, setIsWindowsSetupWizardOpen] = useState<boolean>(false);
  const [isGitHubPushModalOpen, setIsGitHubPushModalOpen] = useState<boolean>(false);
  const [isAchievementsOpen, setIsAchievementsOpen] = useState<boolean>(false);

  // Check existing auth session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const loggedUser = await apiGetMe();
        if (loggedUser) {
          setUser(loggedUser);
          if (loggedUser.progress) {
            setProgress(loggedUser.progress);
          }
        }
      } catch (e) {
        console.warn('Session verification check failed', e);
      }
    };
    checkAuth();
  }, []);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_PROJECTS_KEY, JSON.stringify(projects));
    } catch (e) {
      console.error('Failed to save projects to localStorage', e);
    }
  }, [projects]);

  // Sync progress locally and to backend if authenticated
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_PROGRESS_KEY, JSON.stringify(progress));
    } catch (e) {
      console.error('Failed to save progress to localStorage', e);
    }

    if (user) {
      apiSyncProgress(progress)
        .then(synced => {
          setUser(prev => prev ? { ...prev, progress: synced } : null);
        })
        .catch(err => console.warn('Background progress sync notice:', err));
    }
  }, [progress, user?.id]);

  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0] || null;

  // Project Actions
  const handleOpenProject = (id: string) => {
    setActiveProjectId(id);
    setCurrentView('editor');
  };

  const handlePlayProject = (project: GameProject) => {
    setCustomPlayProject(project);
    setIsPlaytesting(true);
  };

  const handleUpdateActiveProject = (updated: GameProject) => {
    setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  const handleDuplicateProject = (sourceProject: GameProject) => {
    const duplicated: GameProject = {
      ...JSON.parse(JSON.stringify(sourceProject)),
      id: `proj-${Date.now()}`,
      name: `${sourceProject.name} (Copy)`,
      createdAt: Date.now(),
      lastModified: Date.now(),
    };
    setProjects(prev => [duplicated, ...prev]);
    setActiveProjectId(duplicated.id);
    setCurrentView('editor');
    soundManager.playCoin();
  };

  // Remix a community game
  const handleRemixGame = (communityProject: GameProject) => {
    const remixed: GameProject = {
      ...JSON.parse(JSON.stringify(communityProject)),
      id: `proj-remix-${Date.now()}`,
      name: `${communityProject.name} (Remixed)`,
      createdAt: Date.now(),
      lastModified: Date.now(),
    };
    setProjects(prev => [remixed, ...prev]);
    setActiveProjectId(remixed.id);
    setCurrentView('editor');
    soundManager.playWin();
  };

  const handleCreateNewGame = () => {
    const newProject: GameProject = {
      id: `proj-${Date.now()}`,
      name: 'My New 2D Adventure',
      genre: 'platformer',
      description: 'A custom beginner platformer built from scratch.',
      createdAt: Date.now(),
      lastModified: Date.now(),
      settings: {
        canvasWidth: 640,
        canvasHeight: 360,
        gravity: 0.5,
        backgroundColor: '#0f172a',
        targetScore: 50,
        lives: 3
      },
      variables: {
        score: 0,
        lives: 3,
        coins: 0,
        hasKey: false
      },
      entities: [
        {
          id: `player-${Date.now()}`,
          name: 'Hero Player',
          type: 'player',
          x: 60,
          y: 200,
          width: 24,
          height: 32,
          color: '#38bdf8',
          speed: 4,
          jumpPower: 11,
          health: 3,
          maxHealth: 3,
          gravity: true,
          solid: true,
          tag: 'player'
        },
        {
          id: `ground-${Date.now()}`,
          name: 'Ground Platform',
          type: 'platform',
          x: 0,
          y: 320,
          width: 640,
          height: 40,
          color: '#334155',
          speed: 0,
          jumpPower: 0,
          health: 1,
          maxHealth: 1,
          gravity: false,
          solid: true
        },
        {
          id: `coin-${Date.now()}`,
          name: 'Starter Coin',
          type: 'coin',
          x: 220,
          y: 260,
          width: 16,
          height: 16,
          color: '#facc15',
          speed: 0,
          jumpPower: 0,
          health: 1,
          maxHealth: 1,
          gravity: false,
          solid: false,
          tag: 'coin'
        },
        {
          id: `flag-${Date.now()}`,
          name: 'Goal Flag',
          type: 'goal',
          x: 560,
          y: 256,
          width: 32,
          height: 64,
          color: '#f59e0b',
          speed: 0,
          jumpPower: 0,
          health: 1,
          maxHealth: 1,
          gravity: false,
          solid: false,
          tag: 'goal'
        }
      ],
      logicRules: [
        {
          id: `rule-${Date.now()}`,
          name: 'Collect Coin',
          enabled: true,
          event: { type: 'on_collision', param: 'coin' },
          conditions: [],
          actions: [
            { type: 'change_var', target: 'score', param: 10 },
            { type: 'play_sound', target: 'coin' },
            { type: 'destroy' }
          ]
        },
        {
          id: `rule-win-${Date.now()}`,
          name: 'Victory Reach',
          enabled: true,
          event: { type: 'on_collision', param: 'goal' },
          conditions: [],
          actions: [
            { type: 'play_sound', target: 'win' },
            { type: 'win', param: 'Stage Cleared!' }
          ]
        }
      ],
      sprites: [],
      sounds: [],
      customCode: `// Custom Behavior Script\nfunction onUpdate(player, game) {\n  // Every frame execution logic\n}\n`
    };

    setProjects(prev => [newProject, ...prev]);
    setActiveProjectId(newProject.id);
    setCurrentView('editor');

    // Update progress stats
    setProgress(prev => ({
      ...prev,
      stats: {
        ...prev.stats,
        gamesCreated: prev.stats.gamesCreated + 1
      }
    }));
  };

  const handleImportProject = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (imported.name && imported.entities) {
          imported.id = `imported-${Date.now()}`;
          imported.name = `${imported.name} (Imported)`;
          setProjects(prev => [imported, ...prev]);
          setActiveProjectId(imported.id);
          setCurrentView('editor');
          soundManager.playCoin();
        } else {
          alert('Invalid game project file format.');
        }
      } catch (err) {
        alert('Could not parse project JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const handleCompleteLesson = (lessonId: string, xpEarned: number) => {
    const nextXp = progress.xp + xpEarned;
    const nextLevel = Math.floor(nextXp / 500) + 1;
    const nextCompleted = Array.from(new Set([...progress.completedLessonIds, lessonId]));

    if (nextLevel > progress.level) {
      soundManager.playWin();
    }

    const newBadges = [...progress.unlockedBadgeIds];
    if (!newBadges.includes('badge-first-step')) {
      newBadges.push('badge-first-step');
    }
    if (nextCompleted.length >= 3 && !newBadges.includes('badge-trio')) {
      newBadges.push('badge-trio');
    }

    setProgress(prev => ({
      ...prev,
      xp: nextXp,
      level: nextLevel,
      completedLessonIds: nextCompleted,
      unlockedBadgeIds: newBadges,
      lessonMastery: {
        ...(prev.lessonMastery || {}),
        [lessonId]: 100
      }
    }));
  };

  const handleChallengeSolved = (lessonId: string, masteryPercentage: number) => {
    setProgress(prev => {
      const alreadySolved = prev.completedChallengeLessonIds?.includes(lessonId);
      const nextChallenges = Array.from(new Set([...(prev.completedChallengeLessonIds || []), lessonId]));
      const nextMastery = {
        ...(prev.lessonMastery || {}),
        [lessonId]: Math.max(prev.lessonMastery?.[lessonId] || 0, masteryPercentage)
      };

      const newBadges = [...prev.unlockedBadgeIds];
      if (!newBadges.includes('badge-logic-architect') && nextChallenges.length >= 2) {
        newBadges.push('badge-logic-architect');
      }

      return {
        ...prev,
        xp: alreadySolved ? prev.xp : prev.xp + 45,
        completedChallengeLessonIds: nextChallenges,
        lessonMastery: nextMastery,
        unlockedBadgeIds: newBadges,
        stats: {
          ...prev.stats,
          codeChallengesSolved: alreadySolved ? prev.stats.codeChallengesSolved : prev.stats.codeChallengesSolved + 1
        }
      };
    });
  };

  const handleQuizPassed = (lessonId: string, masteryPercentage: number) => {
    setProgress(prev => ({
      ...prev,
      passedQuizIds: Array.from(new Set([...prev.passedQuizIds, lessonId])),
      lessonMastery: {
        ...(prev.lessonMastery || {}),
        [lessonId]: Math.max(prev.lessonMastery?.[lessonId] || 0, masteryPercentage)
      }
    }));
  };

  const handleExploreConcept = (lessonId: string, masteryPercentage: number) => {
    setProgress(prev => ({
      ...prev,
      exploredConceptLessonIds: Array.from(new Set([...(prev.exploredConceptLessonIds || []), lessonId])),
      lessonMastery: {
        ...(prev.lessonMastery || {}),
        [lessonId]: Math.max(prev.lessonMastery?.[lessonId] || 0, masteryPercentage)
      }
    }));
  };

  const handleOpenAI = (ctx?: string) => {
    setAiContext(ctx);
    setIsAIModalOpen(true);
  };

  const handleLogout = async () => {
    await apiLogout();
    setUser(null);
    setIsProfileModalOpen(false);
    soundManager.playHit();
  };

  const openAuth = (mode: 'login' | 'signup') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Inter',sans-serif]">
      {/* Sleek Global Navigation Bar */}
      <header id="global-navbar" className="w-full bg-slate-900/90 backdrop-blur border-b border-slate-800 sticky top-0 z-40 px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div 
            onClick={() => setCurrentView('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-white text-sm sm:text-base font-['Space_Grotesk'] tracking-tight block">
                GameDev Starter
              </span>
              <span className="text-[10px] text-indigo-400 uppercase tracking-widest font-mono block -mt-1">
                Studio
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800/80 text-xs">
            <button
              id="nav-link-dashboard"
              onClick={() => setCurrentView('dashboard')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                currentView === 'dashboard' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Dashboard
            </button>

            <button
              id="nav-link-academy"
              onClick={() => setCurrentView('academy')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                currentView === 'academy' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Academy</span>
            </button>

            <button
              id="nav-link-community"
              onClick={() => setCurrentView('community')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer relative ${
                currentView === 'community' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-purple-400" />
              <span>Community Showcase</span>
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            </button>

            <button
              id="nav-link-sprite"
              onClick={() => setCurrentView('sprite_studio')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                currentView === 'sprite_studio' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Palette className="w-3.5 h-3.5 text-pink-400" />
              <span>Sprite Studio</span>
            </button>

            <button
              id="nav-link-audio"
              onClick={() => setCurrentView('audio_studio')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                currentView === 'audio_studio' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Audio Assets</span>
            </button>
          </nav>

          {/* Right Header Controls: AI Mentor, User Profile / Auth */}
          <div className="flex items-center gap-2">
            <button
              id="btn-nav-ask-ai"
              onClick={() => handleOpenAI()}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-indigo-300 text-xs font-semibold flex items-center gap-1.5 border border-indigo-500/30 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Ask AI Mentor</span>
            </button>

            {/* User Auth Controls */}
            {user ? (
              <div className="flex items-center gap-2">
                <button
                  id="btn-nav-upload-game"
                  onClick={() => setIsPublishModalOpen(true)}
                  className="hidden sm:flex px-2.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-semibold items-center gap-1 cursor-pointer transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Share Game</span>
                </button>

                <button
                  id="btn-nav-user-profile"
                  onClick={() => setIsProfileModalOpen(true)}
                  className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 transition-colors cursor-pointer"
                >
                  <span className="text-base">{user.avatarUrl || '🎮'}</span>
                  <div className="hidden sm:block text-left">
                    <div className="text-xs font-bold text-white leading-tight">
                      {user.displayName || user.username}
                    </div>
                    <div className="text-[10px] text-amber-400 font-mono leading-tight">
                      Lvl {user.progress.level} • {user.progress.xp} XP
                    </div>
                  </div>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  id="btn-nav-signin"
                  onClick={() => openAuth('login')}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  id="btn-nav-join"
                  onClick={() => openAuth('signup')}
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
                >
                  Join Free
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Dynamic Main Views */}
      <main className="flex-1 w-full flex flex-col">
        {currentView === 'dashboard' && (
          <Dashboard
            projects={projects}
            progress={progress}
            user={user}
            activeProject={activeProject}
            onOpenProject={handleOpenProject}
            onPlayProject={handlePlayProject}
            onCreateNewGame={handleCreateNewGame}
            onOpenAcademy={() => setCurrentView('academy')}
            onOpenAchievements={() => setIsAchievementsOpen(true)}
            onOpenSpriteStudio={() => setCurrentView('sprite_studio')}
            onOpenAudioManager={() => setCurrentView('audio_studio')}
            onDuplicateProject={handleDuplicateProject}
            onImportProject={handleImportProject}
            onOpenCommunity={() => setCurrentView('community')}
            onOpenPublishModal={() => setIsPublishModalOpen(true)}
            onOpenAuth={openAuth}
            onOpenProfile={() => setIsProfileModalOpen(true)}
            onOpenWindowsWizard={(proj) => {
              setActiveProjectId(proj.id);
              setIsWindowsSetupWizardOpen(true);
            }}
            onOpenGitHubPush={(proj) => {
              setActiveProjectId(proj.id);
              setIsGitHubPushModalOpen(true);
            }}
            onSaveSoundToProject={(sound) => {
              if (activeProject) {
                handleUpdateActiveProject({
                  ...activeProject,
                  sounds: [sound, ...activeProject.sounds.filter(s => s.id !== sound.id)]
                });
              } else if (projects.length > 0) {
                const target = projects[0];
                setProjects(prev => prev.map(p => p.id === target.id ? {
                  ...p,
                  sounds: [sound, ...(p.sounds || []).filter(s => s.id !== sound.id)]
                } : p));
              }
            }}
          />
        )}

        {currentView === 'community' && (
          <CommunityShowcase
            user={user}
            onPlayGame={(proj) => {
              setCustomPlayProject(proj);
              setIsPlaytesting(true);
            }}
            onRemixGame={handleRemixGame}
            onOpenPublishModal={() => setIsPublishModalOpen(true)}
            onRequireAuth={() => openAuth('login')}
            onBackToDashboard={() => setCurrentView('dashboard')}
          />
        )}

        {currentView === 'editor' && activeProject && (
          <GameEditor
            project={activeProject}
            onUpdateProject={handleUpdateActiveProject}
            onPlayTest={() => {
              setCustomPlayProject(null);
              setIsPlaytesting(true);
            }}
            onBack={() => setCurrentView('dashboard')}
            onOpenAI={handleOpenAI}
            onOpenExport={() => setIsExportModalOpen(true)}
            onOpenPublish={() => setIsPublishModalOpen(true)}
          />
        )}

        {currentView === 'academy' && (
          <AcademyView
            progress={progress}
            onBack={() => setCurrentView('dashboard')}
            onCompleteLesson={handleCompleteLesson}
            onChallengeSolved={handleChallengeSolved}
            onQuizPassed={handleQuizPassed}
            onExploreConcept={handleExploreConcept}
            onAskAI={(topic) => handleOpenAI(`Explaining lesson: ${topic}`)}
          />
        )}

        {currentView === 'sprite_studio' && (
          <div className="p-6">
            <PixelArtEditor
              onBack={() => setCurrentView('dashboard')}
              onSaveToProject={(sprite) => {
                if (activeProject) {
                  handleUpdateActiveProject({
                    ...activeProject,
                    sprites: [sprite, ...activeProject.sprites.filter(s => s.id !== sprite.id)]
                  });
                }
                soundManager.playCoin();
                alert(`Saved sprite "${sprite.name}"!`);
              }}
            />
          </div>
        )}

        {currentView === 'audio_studio' && (
          <div className="p-4 sm:p-6">
            <AudioAssetsLibrary
              activeProject={activeProject || projects[0] || null}
              onBack={() => setCurrentView('dashboard')}
              onSaveSoundToProject={(sound) => {
                if (activeProject) {
                  handleUpdateActiveProject({
                    ...activeProject,
                    sounds: [sound, ...activeProject.sounds.filter(s => s.id !== sound.id)]
                  });
                } else if (projects.length > 0) {
                  const target = projects[0];
                  setProjects(prev => prev.map(p => p.id === target.id ? {
                    ...p,
                    sounds: [sound, ...(p.sounds || []).filter(s => s.id !== sound.id)]
                  } : p));
                }
              }}
            />
          </div>
        )}
      </main>

      {/* Global Modals */}
      {isPlaytesting && (
        <LivePlaytestModal
          project={customPlayProject || activeProject || projects[0]}
          onClose={() => {
            setIsPlaytesting(false);
            setCustomPlayProject(null);
          }}
          onRecordPlaytest={() => {
            setProgress(prev => ({
              ...prev,
              stats: {
                ...prev.stats,
                playTestsRun: prev.stats.playTestsRun + 1
              }
            }));
          }}
        />
      )}

      {isAIModalOpen && (
        <AIAssistantModal
          initialContext={aiContext}
          onClose={() => setIsAIModalOpen(false)}
        />
      )}

      {isExportModalOpen && activeProject && (
        <ExportModal
          project={activeProject}
          onClose={() => setIsExportModalOpen(false)}
          onOpenSetupWizard={() => setIsWindowsSetupWizardOpen(true)}
          onOpenGitHubPush={() => setIsGitHubPushModalOpen(true)}
          onPlayTest={() => {
            setIsPlaytesting(true);
            setCustomPlayProject(activeProject);
          }}
        />
      )}

      {isWindowsSetupWizardOpen && (activeProject || projects[0]) && (
        <WindowsSetupWizardModal
          project={activeProject || projects[0]}
          onClose={() => setIsWindowsSetupWizardOpen(false)}
          onPlayTest={() => {
            setIsPlaytesting(true);
            setCustomPlayProject(activeProject || projects[0]);
          }}
        />
      )}

      {isGitHubPushModalOpen && (activeProject || projects[0]) && (
        <GitHubPushModal
          project={activeProject || projects[0]}
          isOpen={isGitHubPushModalOpen}
          onClose={() => setIsGitHubPushModalOpen(false)}
        />
      )}

      {isAchievementsOpen && (
        <AchievementsModal
          progress={progress}
          onClose={() => setIsAchievementsOpen(false)}
        />
      )}

      {/* User Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authModalMode}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(authedUser) => {
          setUser(authedUser);
          if (authedUser.progress) {
            setProgress(authedUser.progress);
          }
        }}
      />

      {/* User Profile & Progression Modal */}
      {user && (
        <UserProfileModal
          user={user}
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          onLogout={handleLogout}
          onUpdateUser={(updated) => setUser(updated)}
          onOpenAchievements={() => setIsAchievementsOpen(true)}
        />
      )}

      {/* Publish Game Modal */}
      <PublishGameModal
        user={user}
        projects={projects}
        activeProject={activeProject}
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        onRequireAuth={() => openAuth('login')}
        onPublished={(msg) => {
          // Increment games created or award XP
          setProgress(prev => ({
            ...prev,
            xp: prev.xp + 75,
            stats: {
              ...prev.stats,
              gamesCreated: prev.stats.gamesCreated + 1
            }
          }));
          alert(msg);
          setCurrentView('community');
        }}
      />
    </div>
  );
}
