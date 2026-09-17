import React, { useState, useEffect, useMemo } from 'react';
import { 
  GitBranch, 
  GitCommit, 
  FolderGit2, 
  ExternalLink, 
  Check, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Lock, 
  Globe, 
  FileCode, 
  Terminal, 
  Plus, 
  RefreshCw, 
  Copy, 
  Eye, 
  X, 
  ShieldCheck, 
  Key, 
  ArrowRight,
  Code2,
  Layers,
  Sparkles
} from 'lucide-react';
import { GameProject } from '../types';
import { 
  GitHubUser, 
  GitHubRepo, 
  GitHubFileToPush, 
  PushProgress, 
  generateProjectSourceFiles, 
  verifyGitHubToken, 
  fetchUserRepositories, 
  createGitHubRepository, 
  pushProjectToGitHub 
} from '../utils/githubPublisher';

interface GitHubPushModalProps {
  project: GameProject;
  isOpen: boolean;
  onClose: () => void;
}

type ModalTab = 'auth' | 'repo' | 'files' | 'push';
type RepoMode = 'new' | 'existing';

const GITHUB_TOKEN_STORAGE_KEY = 'gamedev_github_pat_token';
const GITHUB_USER_STORAGE_KEY = 'gamedev_github_user_cache';

export const GitHubPushModal: React.FC<GitHubPushModalProps> = ({
  project,
  isOpen,
  onClose
}) => {
  // Authentication State
  const [token, setToken] = useState<string>(() => {
    try {
      return localStorage.getItem(GITHUB_TOKEN_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });
  const [user, setUser] = useState<GitHubUser | null>(() => {
    try {
      const cached = localStorage.getItem(GITHUB_USER_STORAGE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [isVerifyingToken, setIsVerifyingToken] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isOAuthWaiting, setIsOAuthWaiting] = useState<boolean>(false);
  const [oauthServerConfig, setOauthServerConfig] = useState<{ configured: boolean; callbackUrl?: string } | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<ModalTab>(() => user ? 'repo' : 'auth');

  // Repositories State
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [isLoadingRepos, setIsLoadingRepos] = useState<boolean>(false);
  const [repoSearch, setRepoSearch] = useState<string>('');
  const [repoMode, setRepoMode] = useState<RepoMode>('new');

  // New Repo Form
  const defaultRepoName = useMemo(() => {
    return project.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'my-indie-game';
  }, [project.name]);

  const [newRepoName, setNewRepoName] = useState<string>(defaultRepoName);
  const [newRepoDesc, setNewRepoDesc] = useState<string>(
    project.description || `${project.genre.replace('_', ' ')} game project built with Godot Engine Studio`
  );
  const [isPrivate, setIsPrivate] = useState<boolean>(false);
  const [targetBranch, setTargetBranch] = useState<string>('main');

  // Existing Repo Selection
  const [selectedRepoFullName, setSelectedRepoFullName] = useState<string>('');

  // Files to Push
  const [files, setFiles] = useState<GitHubFileToPush[]>(() => generateProjectSourceFiles(project));
  const [previewFile, setPreviewFile] = useState<GitHubFileToPush | null>(null);
  const [commitMessage, setCommitMessage] = useState<string>(
    `feat: release ${project.name} built with Godot Engine Studio`
  );

  // Push State & Progress
  const [isPushing, setIsPushing] = useState<boolean>(false);
  const [pushProgress, setPushProgress] = useState<PushProgress | null>(null);
  const [pushResult, setPushResult] = useState<{ success: boolean; repoUrl: string; totalPushed: number } | null>(null);
  const [copiedClone, setCopiedClone] = useState<boolean>(false);

  // Check OAuth config on mount
  useEffect(() => {
    fetch('/api/github/oauth-config')
      .then(res => res.json())
      .then(data => setOauthServerConfig(data))
      .catch(() => setOauthServerConfig({ configured: false }));
  }, []);

  // Listen for OAuth Popup Callback
  useEffect(() => {
    const handleOAuthMessage = async (event: MessageEvent) => {
      // Validate origin if possible
      const data = event.data;
      if (!data || typeof data !== 'object') return;

      if (data.type === 'OAUTH_AUTH_SUCCESS' && data.provider === 'github') {
        setIsOAuthWaiting(false);
        if (data.token) {
          handleSaveToken(data.token);
        } else if (data.code) {
          // Exchange code via backend
          try {
            setIsVerifyingToken(true);
            const res = await fetch('/api/github/exchange-token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ code: data.code })
            });
            const tokenRes = await res.json();
            if (tokenRes.access_token) {
              handleSaveToken(tokenRes.access_token);
            } else {
              setAuthError(tokenRes.error || 'Failed to exchange GitHub authorization code.');
            }
          } catch (err: any) {
            setAuthError(err.message || 'Token exchange failed');
          } finally {
            setIsVerifyingToken(false);
          }
        }
      } else if (data.type === 'OAUTH_AUTH_ERROR' && data.provider === 'github') {
        setIsOAuthWaiting(false);
        setAuthError(data.error || 'GitHub authorization failed.');
      }
    };

    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, []);

  // Fetch repositories whenever user is authorized and enters 'repo' tab
  useEffect(() => {
    if (token && user && (activeTab === 'repo' || repos.length === 0)) {
      loadRepositories();
    }
  }, [token, user, activeTab]);

  // Regenerate files if project changes
  useEffect(() => {
    setFiles(generateProjectSourceFiles(project));
  }, [project]);

  const loadRepositories = async () => {
    if (!token) return;
    setIsLoadingRepos(true);
    try {
      const list = await fetchUserRepositories(token);
      setRepos(list);
      if (list.length > 0 && !selectedRepoFullName) {
        setSelectedRepoFullName(list[0].full_name);
      }
    } catch (err: any) {
      console.error('Failed to load repos:', err);
    } finally {
      setIsLoadingRepos(false);
    }
  };

  const handleSaveToken = async (tokenToVerify: string) => {
    const cleanToken = tokenToVerify.trim();
    if (!cleanToken) {
      setAuthError('Please enter a GitHub Personal Access Token or sign in.');
      return;
    }

    setIsVerifyingToken(true);
    setAuthError(null);

    try {
      const verifiedUser = await verifyGitHubToken(cleanToken);
      setUser(verifiedUser);
      setToken(cleanToken);
      try {
        localStorage.setItem(GITHUB_TOKEN_STORAGE_KEY, cleanToken);
        localStorage.setItem(GITHUB_USER_STORAGE_KEY, JSON.stringify(verifiedUser));
      } catch {}
      setActiveTab('repo');
    } catch (err: any) {
      setAuthError(err.message || 'Verification failed. Please check token permissions.');
    } finally {
      setIsVerifyingToken(false);
    }
  };

  const handleDisconnect = () => {
    setUser(null);
    setToken('');
    try {
      localStorage.removeItem(GITHUB_TOKEN_STORAGE_KEY);
      localStorage.removeItem(GITHUB_USER_STORAGE_KEY);
    } catch {}
    setActiveTab('auth');
    setPushResult(null);
    setPushProgress(null);
  };

  const handleLaunchOAuth = async () => {
    setAuthError(null);
    setIsOAuthWaiting(true);
    try {
      const res = await fetch('/api/github/auth-url');
      const data = await res.json();

      if (!res.ok || !data.url) {
        throw new Error(data.error || 'GitHub OAuth App not configured. Use Personal Access Token below.');
      }

      const popup = window.open(
        data.url,
        'github_oauth_popup',
        'width=600,height=750,status=no,toolbar=no,menubar=no'
      );

      if (!popup) {
        setIsOAuthWaiting(false);
        setAuthError('Popup was blocked by your browser. Please allow popups or use Personal Access Token.');
      }
    } catch (err: any) {
      setIsOAuthWaiting(false);
      setAuthError(err.message || 'OAuth launch failed.');
    }
  };

  const handleToggleFile = (path: string) => {
    setFiles(prev => prev.map(f => f.path === path ? { ...f, included: !f.included } : f));
  };

  const handleToggleAllFiles = (include: boolean) => {
    setFiles(prev => prev.map(f => ({ ...f, included: include })));
  };

  const handleStartPush = async () => {
    if (!token || !user) {
      setActiveTab('auth');
      return;
    }

    const includedFiles = files.filter(f => f.included);
    if (includedFiles.length === 0) {
      alert('Please select at least one file to push.');
      return;
    }

    setIsPushing(true);
    setActiveTab('push');
    setPushResult(null);
    setAuthError(null);

    try {
      let targetOwner = user.login;
      let targetRepoName = '';
      let branchToUse = targetBranch.trim() || 'main';

      if (repoMode === 'new') {
        // Create new repository first
        setPushProgress({
          currentFileIndex: 0,
          totalFiles: includedFiles.length,
          currentFileName: 'Repository Creation',
          status: 'preparing',
          message: `Creating new repository "${newRepoName}" on GitHub...`,
          percentage: 5
        });

        const createdRepo = await createGitHubRepository(
          token,
          newRepoName,
          newRepoDesc,
          isPrivate
        );
        targetOwner = createdRepo.full_name.split('/')[0] || user.login;
        targetRepoName = createdRepo.name;
        branchToUse = createdRepo.default_branch || 'main';
      } else {
        // Use existing repo
        const parts = selectedRepoFullName.split('/');
        if (parts.length === 2) {
          targetOwner = parts[0];
          targetRepoName = parts[1];
        } else {
          targetRepoName = selectedRepoFullName;
        }
      }

      // Push all files
      const result = await pushProjectToGitHub(
        token,
        targetOwner,
        targetRepoName,
        branchToUse,
        commitMessage,
        files,
        (progress) => setPushProgress(progress)
      );

      setPushResult(result);
    } catch (err: any) {
      console.error('Push failed:', err);
      setPushProgress(prev => ({
        currentFileIndex: prev?.currentFileIndex || 0,
        totalFiles: prev?.totalFiles || includedFiles.length,
        currentFileName: 'Failed',
        status: 'failed',
        message: 'Push encountered an error.',
        percentage: 100,
        error: err.message || 'Failed to push files to GitHub.'
      }));
    } finally {
      setIsPushing(false);
    }
  };

  const filteredRepos = useMemo(() => {
    if (!repoSearch.trim()) return repos;
    const q = repoSearch.toLowerCase();
    return repos.filter(r => r.name.toLowerCase().includes(q) || (r.description && r.description.toLowerCase().includes(q)));
  }, [repos, repoSearch]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div 
        id="github-push-modal"
        className="bg-[#0f131d] border border-[#27354d] rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* ========================================================================= */}
        {/* HEADER BAR                                                                */}
        {/* ========================================================================= */}
        <div className="p-4 bg-[#141a27] border-b border-[#253247] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1e273a] border border-[#30405c] flex items-center justify-center text-white shadow-inner">
              <FolderGit2 className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base font-['Space_Grotesk'] tracking-tight flex items-center gap-2">
                  <span>Push Game to GitHub</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                    Git Source Sync
                  </span>
                </h3>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-2">
                <span>Project: <strong className="text-cyan-300 font-mono">{project.name}</strong></span>
                <span>•</span>
                <span className="capitalize">{project.genre.replace('_', ' ')}</span>
                <span>•</span>
                <span className="text-slate-500">{project.entities.length} nodes</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#1a2233] hover:bg-[#242f46] text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* STEPPER / TABS BAR                                                        */}
        {/* ========================================================================= */}
        <div className="bg-[#111623] border-b border-[#1f2a3d] px-4 py-2 flex items-center justify-between overflow-x-auto shrink-0 text-xs">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setActiveTab('auth')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-2 font-medium transition-colors cursor-pointer ${
                activeTab === 'auth'
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : user 
                    ? 'text-emerald-400 hover:bg-[#1a2336]' 
                    : 'text-slate-400 hover:bg-[#1a2336] hover:text-white'
              }`}
            >
              {user ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <ShieldCheck className="w-3.5 h-3.5" />}
              <span>1. Account</span>
              {user && <span className="text-[10px] opacity-75 font-mono">(@{user.login})</span>}
            </button>

            <span className="text-slate-600">→</span>

            <button
              onClick={() => setActiveTab('repo')}
              disabled={!user}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-2 font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                activeTab === 'repo'
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'text-slate-300 hover:bg-[#1a2336]'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>2. Repository</span>
            </button>

            <span className="text-slate-600">→</span>

            <button
              onClick={() => setActiveTab('files')}
              disabled={!user}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-2 font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                activeTab === 'files'
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'text-slate-300 hover:bg-[#1a2336]'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>3. Files ({files.filter(f => f.included).length})</span>
            </button>

            <span className="text-slate-600">→</span>

            <button
              onClick={() => setActiveTab('push')}
              disabled={!user}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-2 font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                activeTab === 'push'
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'text-slate-300 hover:bg-[#1a2336]'
              }`}
            >
              <GitCommit className="w-3.5 h-3.5" />
              <span>4. Push</span>
            </button>
          </div>

          {user && (
            <div className="flex items-center gap-2">
              <img
                src={user.avatar_url}
                alt={user.login}
                className="w-5 h-5 rounded-full border border-slate-600"
              />
              <span className="text-slate-300 font-mono text-[11px] hidden sm:inline">
                {user.name || user.login}
              </span>
              <button
                onClick={handleDisconnect}
                className="text-[11px] text-rose-400 hover:underline ml-1 cursor-pointer"
              >
                Disconnect
              </button>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* MAIN BODY WORKSPACE                                                       */}
        {/* ========================================================================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 1: AUTHENTICATION */}
          {activeTab === 'auth' && (
            <div className="space-y-6">
              {user ? (
                /* CONNECTED CARD */
                <div className="bg-[#141a27] border border-emerald-500/30 rounded-xl p-5 space-y-4 shadow-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <img 
                        src={user.avatar_url} 
                        alt={user.login} 
                        className="w-14 h-14 rounded-full border-2 border-emerald-400 shadow-md"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-white">{user.name || user.login}</h4>
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold">
                            Connected
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-mono">@{user.login}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {user.public_repos} public repositories • Token authorized with repo access
                        </p>
                      </div>
                    </div>

                    <a
                      href={user.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-[#1e2638] hover:bg-[#28344c] text-slate-300 text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <span>View GitHub Profile</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </a>
                  </div>

                  <div className="pt-3 border-t border-[#222e42] flex items-center justify-between">
                    <button
                      onClick={handleDisconnect}
                      className="text-xs text-rose-400 hover:text-rose-300 hover:underline cursor-pointer"
                    >
                      Sign Out / Use Another Token
                    </button>

                    <button
                      onClick={() => setActiveTab('repo')}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-md"
                    >
                      <span>Proceed to Repository Setup</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                /* NOT CONNECTED STATE */
                <div className="space-y-6">
                  <div className="text-center space-y-2 max-w-lg mx-auto">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 mx-auto flex items-center justify-center">
                      <Key className="w-6 h-6" />
                    </div>
                    <h4 className="text-lg font-bold text-white font-['Space_Grotesk']">
                      Connect your GitHub Account
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Publish your Godot 4 and Java game project source files directly to GitHub. 
                      You can use a <strong>Personal Access Token (Instant)</strong> or <strong>GitHub OAuth</strong>.
                    </p>
                  </div>

                  {authError && (
                    <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <strong>Connection Error:</strong> {authError}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* OPTION 1: PERSONAL ACCESS TOKEN (PAT) */}
                    <div className="bg-[#141a27] border border-[#253247] rounded-xl p-5 space-y-4 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-300 font-bold text-xs flex items-center justify-center">
                            1
                          </span>
                          <h5 className="font-bold text-white text-sm">
                            Personal Access Token (Recommended)
                          </h5>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Works immediately without registering an OAuth App. Just create a token with the <code className="text-indigo-300 bg-black/40 px-1 py-0.5 rounded">repo</code> scope.
                        </p>

                        <a
                          href="https://github.com/settings/tokens/new?scopes=repo,read:user&description=Godot%20Studio%20Publisher"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-[#599eff] hover:underline font-semibold"
                        >
                          <span>Generate Token on GitHub (with repo scope)</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>

                        <div className="space-y-1.5 pt-1">
                          <label className="text-[11px] font-semibold text-slate-300 block">
                            Paste your GitHub Token (ghp_...):
                          </label>
                          <input
                            type="password"
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                            className="w-full px-3 py-2 rounded-lg bg-[#0c1018] border border-[#28374f] text-slate-200 text-xs font-mono focus:border-indigo-500 outline-none"
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => handleSaveToken(token)}
                        disabled={!token.trim() || isVerifyingToken}
                        className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 shadow-md"
                      >
                        {isVerifyingToken ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Verifying with GitHub API...</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-4 h-4" />
                            <span>Verify & Connect Token</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* OPTION 2: GITHUB OAUTH POPUP */}
                    <div className="bg-[#141a27] border border-[#253247] rounded-xl p-5 space-y-4 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold text-xs flex items-center justify-center">
                            2
                          </span>
                          <h5 className="font-bold text-white text-sm">
                            GitHub OAuth Popup Sign-In
                          </h5>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Authorize Godot Engine Studio directly via GitHub OAuth popup dialog.
                        </p>

                        <div className="p-3 rounded-lg bg-[#0c1018] border border-[#212c3f] space-y-2 text-[11px] text-slate-400">
                          <div className="flex items-center justify-between">
                            <span>OAuth Configuration:</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              oauthServerConfig?.configured 
                                ? 'bg-emerald-500/20 text-emerald-300' 
                                : 'bg-amber-500/20 text-amber-300'
                            }`}>
                              {oauthServerConfig?.configured ? 'App Configured' : 'Needs Client ID'}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 leading-normal">
                            Callback URL: <code className="text-slate-300">{oauthServerConfig?.callbackUrl || '/auth/callback'}</code>
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={handleLaunchOAuth}
                        disabled={isOAuthWaiting}
                        className="w-full py-2.5 rounded-xl bg-[#242f44] hover:bg-[#2f3d57] text-white font-bold text-xs flex items-center justify-center gap-2 border border-[#3b4c6b] transition-colors cursor-pointer"
                      >
                        {isOAuthWaiting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                            <span>Waiting for GitHub Popup...</span>
                          </>
                        ) : (
                          <>
                            <FolderGit2 className="w-4 h-4 text-emerald-400" />
                            <span>Sign In with GitHub OAuth</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: REPOSITORY SELECTION */}
          {activeTab === 'repo' && (
            <div className="space-y-5">
              {/* Mode Toggle: Create New vs Choose Existing */}
              <div className="flex items-center bg-[#111623] p-1 rounded-xl border border-[#232e42] max-w-md">
                <button
                  onClick={() => setRepoMode('new')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                    repoMode === 'new'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create New Repository</span>
                </button>

                <button
                  onClick={() => setRepoMode('existing')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                    repoMode === 'existing'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FolderGit2 className="w-3.5 h-3.5" />
                  <span>Select Existing Repo</span>
                </button>
              </div>

              {/* MODE A: CREATE NEW REPOSITORY */}
              {repoMode === 'new' ? (
                <div className="bg-[#141a27] border border-[#253247] rounded-xl p-5 space-y-4">
                  <div className="space-y-1">
                    <h5 className="font-bold text-white text-sm font-['Space_Grotesk']">
                      New Repository Settings
                    </h5>
                    <p className="text-xs text-slate-400">
                      We'll automatically initialize the repository with your Godot and Java source tree.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 block">
                        Repository Name:
                      </label>
                      <div className="flex items-center">
                        <span className="px-3 py-2 rounded-l-lg bg-[#0c1018] border border-r-0 border-[#28374f] text-slate-400 text-xs font-mono">
                          {user?.login} /
                        </span>
                        <input
                          type="text"
                          value={newRepoName}
                          onChange={(e) => setNewRepoName(e.target.value)}
                          placeholder="my-game-repo"
                          className="flex-1 px-3 py-2 rounded-r-lg bg-[#0c1018] border border-[#28374f] text-white text-xs font-mono focus:border-indigo-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 block">
                        Default Branch:
                      </label>
                      <input
                        type="text"
                        value={targetBranch}
                        onChange={(e) => setTargetBranch(e.target.value)}
                        placeholder="main"
                        className="w-full px-3 py-2 rounded-lg bg-[#0c1018] border border-[#28374f] text-white text-xs font-mono focus:border-indigo-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 block">
                      Description:
                    </label>
                    <input
                      type="text"
                      value={newRepoDesc}
                      onChange={(e) => setNewRepoDesc(e.target.value)}
                      placeholder="2D indie game created with Godot Engine Studio"
                      className="w-full px-3 py-2 rounded-lg bg-[#0c1018] border border-[#28374f] text-white text-xs focus:border-indigo-500 outline-none"
                    />
                  </div>

                  <div className="space-y-2 pt-2">
                    <label className="text-xs font-semibold text-slate-300 block">
                      Visibility:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label 
                        onClick={() => setIsPrivate(false)}
                        className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                          !isPrivate 
                            ? 'bg-indigo-600/15 border-indigo-500/50 text-white' 
                            : 'bg-[#0c1018] border-[#253247] text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        <Globe className={`w-4 h-4 mt-0.5 ${!isPrivate ? 'text-indigo-400' : 'text-slate-500'}`} />
                        <div>
                          <div className="font-bold text-xs text-white">Public</div>
                          <div className="text-[11px] text-slate-400">Anyone on the internet can see this repository and play on GitHub Pages.</div>
                        </div>
                      </label>

                      <label 
                        onClick={() => setIsPrivate(true)}
                        className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                          isPrivate 
                            ? 'bg-indigo-600/15 border-indigo-500/50 text-white' 
                            : 'bg-[#0c1018] border-[#253247] text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        <Lock className={`w-4 h-4 mt-0.5 ${isPrivate ? 'text-amber-400' : 'text-slate-500'}`} />
                        <div>
                          <div className="font-bold text-xs text-white">Private</div>
                          <div className="text-[11px] text-slate-400">Only you and collaborators can view and access this code.</div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              ) : (
                /* MODE B: SELECT EXISTING REPOSITORY */
                <div className="bg-[#141a27] border border-[#253247] rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-white text-sm font-['Space_Grotesk']">
                        Select an Existing Repository
                      </h5>
                      <p className="text-xs text-slate-400">
                        Choose a repository from your GitHub account to push files into.
                      </p>
                    </div>
                    <button
                      onClick={loadRepositories}
                      disabled={isLoadingRepos}
                      className="px-2.5 py-1.5 rounded-lg bg-[#1e2638] hover:bg-[#28344c] text-slate-300 text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRepos ? 'animate-spin text-indigo-400' : ''}`} />
                      <span>Refresh</span>
                    </button>
                  </div>

                  <input
                    type="text"
                    value={repoSearch}
                    onChange={(e) => setRepoSearch(e.target.value)}
                    placeholder="Search your repositories..."
                    className="w-full px-3 py-2 rounded-lg bg-[#0c1018] border border-[#28374f] text-white text-xs focus:border-indigo-500 outline-none"
                  />

                  <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                    {isLoadingRepos ? (
                      <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                        <span>Loading repositories from GitHub...</span>
                      </div>
                    ) : filteredRepos.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400">
                        No repositories found matching "{repoSearch}".
                      </div>
                    ) : (
                      filteredRepos.map(r => (
                        <div
                          key={r.id}
                          onClick={() => {
                            setSelectedRepoFullName(r.full_name);
                            setTargetBranch(r.default_branch || 'main');
                          }}
                          className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                            selectedRepoFullName === r.full_name
                              ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm'
                              : 'bg-[#0e131d] border-[#222c3d] text-slate-300 hover:border-slate-600'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-lg bg-[#182133] flex items-center justify-center text-indigo-400">
                              {r.private ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <Globe className="w-3.5 h-3.5 text-slate-400" />}
                            </div>
                            <div>
                              <div className="font-bold text-xs text-white">{r.name}</div>
                              <div className="text-[11px] text-slate-400 line-clamp-1">{r.description || 'No description'}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                            <span className="px-2 py-0.5 rounded bg-black/40 border border-slate-700">
                              {r.default_branch || 'main'}
                            </span>
                            {selectedRepoFullName === r.full_name && (
                              <Check className="w-4 h-4 text-indigo-400 stroke-[3]" />
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <label className="text-xs font-semibold text-slate-300 block">
                      Target Branch:
                    </label>
                    <input
                      type="text"
                      value={targetBranch}
                      onChange={(e) => setTargetBranch(e.target.value)}
                      placeholder="main"
                      className="w-full px-3 py-2 rounded-lg bg-[#0c1018] border border-[#28374f] text-white text-xs font-mono focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setActiveTab('auth')}
                  className="text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  ← Back to Account
                </button>

                <button
                  onClick={() => setActiveTab('files')}
                  disabled={repoMode === 'existing' && !selectedRepoFullName}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-md disabled:opacity-50"
                >
                  <span>Review Files to Push</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: FILE SELECTION & PREVIEW */}
          {activeTab === 'files' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-bold text-white text-sm font-['Space_Grotesk']">
                    Game Project Source Tree ({files.filter(f => f.included).length}/{files.length} selected)
                  </h5>
                  <p className="text-xs text-slate-400">
                    Select which Godot, Java, and configuration files to include in this commit.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleAllFiles(true)}
                    className="text-xs text-indigo-400 hover:underline cursor-pointer"
                  >
                    Select All
                  </button>
                  <span className="text-slate-600">•</span>
                  <button
                    onClick={() => handleToggleAllFiles(false)}
                    className="text-xs text-slate-400 hover:underline cursor-pointer"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              {/* Commit Message Box */}
              <div className="space-y-1.5 bg-[#141a27] border border-[#253247] p-3.5 rounded-xl">
                <label className="text-xs font-semibold text-slate-300 block">
                  Commit Message:
                </label>
                <input
                  type="text"
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  placeholder="feat: release indie game project"
                  className="w-full px-3 py-2 rounded-lg bg-[#0c1018] border border-[#28374f] text-white text-xs focus:border-indigo-500 outline-none"
                />
              </div>

              {/* File List Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {files.map((file) => (
                  <div
                    key={file.path}
                    className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                      file.included 
                        ? 'bg-[#141a27] border-[#29364f]' 
                        : 'bg-[#0d1118]/60 border-[#1d2535] opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <input
                        type="checkbox"
                        checked={file.included}
                        onChange={() => handleToggleFile(file.path)}
                        className="w-4 h-4 rounded text-indigo-600 cursor-pointer accent-indigo-600"
                      />
                      <div className="overflow-hidden">
                        <div className="font-mono text-xs font-bold text-white truncate flex items-center gap-1.5">
                          <span>{file.path}</span>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] uppercase font-semibold ${
                            file.category === 'engine' ? 'bg-sky-500/20 text-sky-300' :
                            file.category === 'source' ? 'bg-amber-500/20 text-amber-300' :
                            file.category === 'web' ? 'bg-emerald-500/20 text-emerald-300' :
                            file.category === 'docs' ? 'bg-purple-500/20 text-purple-300' :
                            'bg-slate-500/20 text-slate-300'
                          }`}>
                            {file.category}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 line-clamp-1">{file.description}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => setPreviewFile(file)}
                      title="Preview source content"
                      className="p-1.5 rounded-lg bg-[#1e2638] hover:bg-[#2a364d] text-slate-300 hover:text-white cursor-pointer ml-2 shrink-0 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Code Preview Drawer if selected */}
              {previewFile && (
                <div className="bg-[#0b0e14] border border-[#27354d] rounded-xl p-4 space-y-2 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <FileCode className="w-4 h-4 text-indigo-400" />
                      <span className="font-mono text-xs font-bold text-white">{previewFile.path}</span>
                      <span className="text-xs text-slate-500">({previewFile.content.length} bytes)</span>
                    </div>
                    <button
                      onClick={() => setPreviewFile(null)}
                      className="text-xs text-slate-400 hover:text-white cursor-pointer"
                    >
                      Close Preview
                    </button>
                  </div>

                  <pre className="max-h-48 overflow-y-auto font-mono text-[11px] text-slate-300 p-3 bg-black/40 rounded-lg whitespace-pre-wrap leading-relaxed">
                    {previewFile.content.substring(0, 2500)}
                    {previewFile.content.length > 2500 && '\n\n... (truncated for preview)'}
                  </pre>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setActiveTab('repo')}
                  className="text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  ← Back to Repository
                </button>

                <button
                  onClick={handleStartPush}
                  disabled={files.filter(f => f.included).length === 0}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-lg shadow-emerald-900/30 disabled:opacity-50"
                >
                  <GitCommit className="w-4 h-4 stroke-[2.5]" />
                  <span>Push to GitHub ({files.filter(f => f.included).length} Files)</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: PUSHING PROGRESS & SUCCESS */}
          {activeTab === 'push' && (
            <div className="space-y-6">
              {isPushing ? (
                /* IN PROGRESS CARD */
                <div className="bg-[#141a27] border border-indigo-500/30 rounded-xl p-6 text-center space-y-5 shadow-2xl">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 mx-auto flex items-center justify-center animate-pulse">
                    <Loader2 className="w-7 h-7 animate-spin" />
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="text-base font-bold text-white font-['Space_Grotesk']">
                      Pushing Source Files to GitHub...
                    </h4>
                    <p className="text-xs text-slate-400 font-mono">
                      {pushProgress?.message || 'Connecting to GitHub API...'}
                    </p>
                  </div>

                  {/* Progress Bar */}
                  <div className="max-w-md mx-auto space-y-1.5">
                    <div className="h-3 w-full bg-[#0d121c] rounded-full overflow-hidden border border-[#232f44]">
                      <div 
                        className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 transition-all duration-300 rounded-full"
                        style={{ width: `${pushProgress?.percentage || 10}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                      <span>{pushProgress?.currentFileName || 'Processing'}</span>
                      <span>{pushProgress?.percentage || 0}%</span>
                    </div>
                  </div>
                </div>
              ) : pushResult ? (
                /* SUCCESS CELEBRATION */
                <div className="bg-[#141a27] border border-emerald-500/40 rounded-xl p-6 space-y-6 shadow-2xl">
                  <div className="text-center space-y-2">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/10">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h4 className="text-xl font-bold text-white font-['Space_Grotesk']">
                      Project Pushed to GitHub Successfully!
                    </h4>
                    <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                      All <strong className="text-white">{pushResult.totalPushed} files</strong> have been committed to your repository. 
                      Your Godot 4 and Java source files are live on GitHub!
                    </p>
                  </div>

                  {/* Action Links */}
                  <div className="p-4 rounded-xl bg-[#0c1018] border border-[#253247] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-300">GitHub Repository URL:</span>
                      <a 
                        href={pushResult.repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#599eff] hover:underline font-mono font-bold flex items-center gap-1"
                      >
                        <span>{pushResult.repoUrl}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#1e2738]">
                      <span className="text-xs text-slate-400">Clone via Terminal:</span>
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono text-slate-300 bg-black/50 px-2 py-1 rounded border border-slate-800">
                          git clone {pushResult.repoUrl}.git
                        </code>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(`git clone ${pushResult.repoUrl}.git`);
                            setCopiedClone(true);
                            setTimeout(() => setCopiedClone(false), 2000);
                          }}
                          className="px-2.5 py-1 rounded bg-[#1e273a] hover:bg-[#28354e] text-slate-200 text-xs flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          {copiedClone ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedClone ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* GitHub Pages Tip */}
                  <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 flex items-start gap-3 text-xs text-purple-200">
                    <Sparkles className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white block mb-0.5">Want to host this game online for free?</strong>
                      Go to your GitHub repository <strong className="text-white">Settings</strong> → <strong className="text-white">Pages</strong>, choose branch <code className="bg-purple-900/50 px-1 py-0.5 rounded text-white">main</code> and root <code className="bg-purple-900/50 px-1 py-0.5 rounded text-white">/</code>, and click Save. GitHub will automatically deploy your playable web build at <code className="text-cyan-300">https://{user?.login}.github.io/{pushResult.repoUrl.split('/').pop()}</code>!
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <button
                      onClick={() => setActiveTab('files')}
                      className="text-xs text-slate-400 hover:text-white cursor-pointer"
                    >
                      ← Push More Updates
                    </button>

                    <div className="flex items-center gap-3">
                      <a
                        href={pushResult.repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <span>Open on GitHub</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>

                      <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl bg-[#232e42] hover:bg-[#2d3a54] text-slate-200 font-semibold text-xs cursor-pointer transition-colors"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                </div>
              ) : pushProgress?.status === 'failed' ? (
                /* ERROR SCREEN */
                <div className="bg-[#141a27] border border-rose-500/40 rounded-xl p-6 text-center space-y-4 shadow-2xl">
                  <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/50 text-rose-400 mx-auto flex items-center justify-center">
                    <AlertCircle className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-base font-bold text-white font-['Space_Grotesk']">
                      Push Failed
                    </h4>
                    <p className="text-xs text-rose-300 max-w-md mx-auto">
                      {pushProgress?.error || 'An unknown error occurred while pushing to GitHub.'}
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      onClick={() => setActiveTab('files')}
                      className="px-4 py-2 rounded-xl bg-[#1e2638] hover:bg-[#28344c] text-slate-300 text-xs cursor-pointer"
                    >
                      Back to Files
                    </button>
                    <button
                      onClick={handleStartPush}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Retry Push</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* READY TO PUSH CONFIRMATION */
                <div className="bg-[#141a27] border border-[#253247] rounded-xl p-6 text-center space-y-5">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 mx-auto flex items-center justify-center">
                    <GitCommit className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-base font-bold text-white font-['Space_Grotesk']">
                      Ready to Push to GitHub
                    </h4>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                      You are about to commit <strong className="text-white">{files.filter(f => f.included).length} files</strong> to repository <strong className="text-indigo-400 font-mono">{repoMode === 'new' ? `${user?.login}/${newRepoName}` : selectedRepoFullName}</strong> on branch <strong className="text-indigo-400 font-mono">{targetBranch}</strong>.
                    </p>
                  </div>

                  <button
                    onClick={handleStartPush}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 mx-auto cursor-pointer shadow-lg shadow-emerald-900/30"
                  >
                    <GitCommit className="w-4 h-4" />
                    <span>Confirm & Push Now</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
