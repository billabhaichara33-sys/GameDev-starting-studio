import React, { useState } from 'react';
import { 
  X, 
  Trophy, 
  Award, 
  Flame, 
  GraduationCap, 
  Gamepad2, 
  LogOut, 
  Sparkles, 
  Edit3, 
  Check, 
  Code2, 
  Palette, 
  Volume2, 
  Calendar,
  Mail,
  User as UserIcon,
  ShieldCheck
} from 'lucide-react';
import { User } from '../types';
import { apiUpdateProfile } from '../utils/api';
import { soundManager } from '../utils/audioSynth';

interface UserProfileModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  onUpdateUser: (updated: User) => void;
  onOpenAchievements: () => void;
}

const AVATAR_OPTIONS = ['🎮', '👾', '🕹️', '🚀', '🐱', '🧙‍♂️', '⚡', '🤖', '🦊', '⭐'];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  user,
  isOpen,
  onClose,
  onLogout,
  onUpdateUser,
  onOpenAchievements
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user.displayName);
  const [bio, setBio] = useState(user.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '🎮');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const updated = await apiUpdateProfile({
        displayName: displayName.trim() || user.username,
        bio: bio.trim(),
        avatarUrl
      });
      onUpdateUser(updated);
      setIsEditing(false);
      soundManager.playCoin();
    } catch (e) {
      console.error('Failed to update profile', e);
    } finally {
      setIsSaving(false);
    }
  };

  const xpForNextLevel = user.progress.level * 500;
  const currentLevelXp = user.progress.xp % 500;
  const progressPercent = Math.min(100, Math.round((currentLevelXp / 500) * 100));

  return (
    <div 
      id="user-profile-modal-overlay" 
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        id="user-profile-modal-container"
        className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Banner with Avatar */}
        <div className="bg-gradient-to-r from-indigo-900/70 via-slate-900 to-indigo-950/70 p-6 border-b border-slate-800 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-start gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600/30 border-2 border-indigo-500/50 flex items-center justify-center text-3xl shadow-lg">
                {isEditing ? avatarUrl : (user.avatarUrl || '🎮')}
              </div>
              <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-amber-500 text-[10px] font-bold text-slate-950">
                Lvl {user.progress.level}
              </span>
            </div>

            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white font-['Space_Grotesk']">
                  {user.displayName || user.username}
                </h2>
                <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-[11px] font-medium">
                  @{user.username}
                </span>
              </div>
              <p className="text-xs text-slate-300 line-clamp-2">
                {user.bio || 'Aspiring Indie Game Developer exploring 2D physics & logic'}
              </p>
              <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3 text-slate-500" /> {user.email}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-500" /> Joined {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Edit Profile Form Toggle */}
          {isEditing ? (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Edit3 className="w-3.5 h-3.5 text-indigo-400" /> Edit Profile Details
              </h3>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-400">Choose Avatar</label>
                <div className="grid grid-cols-10 gap-1.5 p-2 bg-slate-900 rounded-lg border border-slate-800">
                  {AVATAR_OPTIONS.map((av) => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => setAvatarUrl(av)}
                      className={`h-8 text-lg rounded flex items-center justify-center transition-all cursor-pointer ${
                        avatarUrl === av ? 'bg-indigo-600/40 border border-indigo-400' : 'hover:bg-slate-800'
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-400">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm text-white focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-400">Developer Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm text-white focus:border-indigo-500 outline-none"
                  placeholder="Share what types of games you love building..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving...' : 'Save Profile'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Developer Progression
              </span>
              <button
                id="btn-edit-profile"
                onClick={() => setIsEditing(true)}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            </div>
          )}

          {/* Level & XP Strip */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <div>
                  <div className="text-xs text-slate-400">Current Rank</div>
                  <div className="text-sm font-bold text-white">Level {user.progress.level} Indie Creator</div>
                </div>
              </div>

              <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold">
                <Flame className="w-3.5 h-3.5" />
                <span>{user.progress.streakDays} Day Streak</span>
              </div>
            </div>

            {/* XP progress bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Total Experience: <strong className="text-indigo-400">{user.progress.xp} XP</strong></span>
                <span className="text-slate-500">{currentLevelXp} / 500 XP to Level {user.progress.level + 1}</span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-400 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Activity & Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-1">
              <span className="text-[11px] text-slate-400">Games Built</span>
              <div className="text-base font-bold text-indigo-400 font-mono">
                {user.progress.stats.gamesCreated}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-1">
              <span className="text-[11px] text-slate-400">Playtests Run</span>
              <div className="text-base font-bold text-emerald-400 font-mono">
                {user.progress.stats.playTestsRun}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-1">
              <span className="text-[11px] text-slate-400">Lessons Passed</span>
              <div className="text-base font-bold text-cyan-400 font-mono">
                {user.progress.completedLessonIds.length}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-1">
              <span className="text-[11px] text-slate-400">Badges Won</span>
              <div className="text-base font-bold text-amber-400 font-mono">
                {user.progress.unlockedBadgeIds.length}
              </div>
            </div>
          </div>

          {/* Quick link to Badges */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/20">
            <div className="flex items-center gap-2.5">
              <Award className="w-5 h-5 text-amber-400" />
              <div>
                <div className="text-xs font-bold text-white">Achievements & Trophies</div>
                <div className="text-[11px] text-slate-400">
                  {user.progress.unlockedBadgeIds.length} unlocked developer badges
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenAchievements();
              }}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer"
            >
              View Trophies
            </button>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Data securely synced to cloud</span>
            </div>

            <button
              id="btn-profile-logout"
              onClick={onLogout}
              className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
