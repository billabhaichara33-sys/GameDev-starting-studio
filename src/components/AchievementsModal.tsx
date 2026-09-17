import React from 'react';
import { 
  Trophy, 
  Award, 
  X, 
  Sparkles, 
  Code2, 
  Palette, 
  Volume2, 
  CheckCircle2, 
  Lock,
  Flame
} from 'lucide-react';
import { Badge, UserProgress } from '../types';

interface AchievementsModalProps {
  progress: UserProgress;
  onClose: () => void;
}

const ALL_ACHIEVEMENTS: Badge[] = [
  {
    id: 'badge-first-step',
    title: 'First Steps',
    description: 'Completed your very first game development lesson in the Academy!',
    icon: 'GraduationCap',
    category: 'general'
  },
  {
    id: 'badge-trio',
    title: 'Curious Scholar',
    description: 'Completed 3 curriculum academy lessons.',
    icon: 'Sparkles',
    category: 'code'
  },
  {
    id: 'badge-pixel-artist',
    title: 'Pixel Master',
    description: 'Created or customized your first sprite in the Pixel Art Studio.',
    icon: 'Palette',
    category: 'art'
  },
  {
    id: 'badge-sound-designer',
    title: '8-Bit Maestro',
    description: 'Synthesized sound effects in the Retro Audio Lab.',
    icon: 'Volume2',
    category: 'sound'
  },
  {
    id: 'badge-game-creator',
    title: 'Indie Author',
    description: 'Created and saved a custom game project.',
    icon: 'Trophy',
    category: 'design'
  },
  {
    id: 'badge-playtester',
    title: 'QA Inspector',
    description: 'Ran 5 live playtest simulator sessions.',
    icon: 'Flame',
    category: 'general'
  }
];

export const AchievementsModal: React.FC<AchievementsModalProps> = ({
  progress,
  onClose
}) => {
  return (
    <div id="achievements-modal-overlay" className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-['Space_Grotesk']">
                Developer Badges & Trophies
              </h2>
              <p className="text-xs text-slate-400">
                Unlock achievements as you build games, write logic, and conquer academy lessons
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-1">
            <span className="text-[11px] text-slate-400">Total XP</span>
            <div className="text-base font-bold text-indigo-400 font-mono">{progress.xp}</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-1">
            <span className="text-[11px] text-slate-400">Rank</span>
            <div className="text-base font-bold text-amber-400">Level {progress.level}</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-1">
            <span className="text-[11px] text-slate-400">Lessons</span>
            <div className="text-base font-bold text-emerald-400 font-mono">{progress.completedLessonIds.length}</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-1">
            <span className="text-[11px] text-slate-400">Streak</span>
            <div className="text-base font-bold text-rose-400">{progress.streakDays} Days</div>
          </div>
        </div>

        {/* Badges Grid */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Available Badges</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ALL_ACHIEVEMENTS.map((badge) => {
              const unlocked = progress.unlockedBadgeIds.includes(badge.id) || progress.completedLessonIds.length > 0 && badge.id === 'badge-first-step';

              return (
                <div
                  key={badge.id}
                  className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
                    unlocked
                      ? 'bg-slate-950 border-amber-500/30'
                      : 'bg-slate-950/40 border-slate-800/40 opacity-60'
                  }`}
                >
                  <div className={`p-2.5 rounded-lg border flex-shrink-0 ${
                    unlocked 
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
                      : 'bg-slate-800 border-slate-700 text-slate-600'
                  }`}>
                    {unlocked ? <Award className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                  </div>

                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${unlocked ? 'text-white' : 'text-slate-400'}`}>
                        {badge.title}
                      </span>
                      {unlocked && (
                        <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Unlocked
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{badge.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
