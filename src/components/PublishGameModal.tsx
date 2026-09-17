import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  Sparkles, 
  Gamepad2, 
  Tag, 
  Palette, 
  Check, 
  AlertCircle,
  Trophy,
  ArrowRight
} from 'lucide-react';
import { GameProject, GameGenre, User } from '../types';
import { apiPublishGame } from '../utils/api';
import { soundManager } from '../utils/audioSynth';

interface PublishGameModalProps {
  user: User | null;
  projects: GameProject[];
  activeProject?: GameProject | null;
  isOpen: boolean;
  onClose: () => void;
  onPublished: (message: string) => void;
  onRequireAuth: () => void;
}

const COLOR_THEMES = [
  '#6366f1', // Indigo
  '#0284c7', // Sky
  '#059669', // Emerald
  '#d97706', // Amber
  '#e11d48', // Rose
  '#7c3aed', // Purple
  '#0d9488', // Teal
  '#ea580c'  // Orange
];

export const PublishGameModal: React.FC<PublishGameModalProps> = ({
  user,
  projects,
  activeProject,
  isOpen,
  onClose,
  onPublished,
  onRequireAuth
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    activeProject?.id || projects[0]?.id || ''
  );
  
  const chosenProject = projects.find(p => p.id === selectedProjectId) || activeProject || projects[0];

  const [title, setTitle] = useState(chosenProject ? chosenProject.name : 'My Custom 2D Game');
  const [description, setDescription] = useState(chosenProject?.description || 'A playable indie game created in GameDev Starter Studio.');
  const [genre, setGenre] = useState<GameGenre>(chosenProject?.genre || 'platformer');
  const [tagInput, setTagInput] = useState('2D, Indie, Beginner');
  const [thumbnailColor, setThumbnailColor] = useState(COLOR_THEMES[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // If user is not logged in, prompt them to sign in
  if (!user) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <Upload className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">Sign In to Publish Games</h3>
            <p className="text-xs text-slate-400">
              You need a free developer account to upload games, receive community likes, and earn creator XP!
            </p>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onClose();
                onRequireAuth();
              }}
              className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer"
            >
              Sign In Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleProjectSelect = (id: string) => {
    setSelectedProjectId(id);
    const proj = projects.find(p => p.id === id);
    if (proj) {
      setTitle(proj.name);
      setDescription(proj.description || 'A custom 2D game project built with visual logic blocks.');
      setGenre(proj.genre);
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chosenProject) {
      setErrorMessage('Please select a project to publish.');
      return;
    }
    if (!title.trim()) {
      setErrorMessage('Please provide a title for your game.');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const tags = tagInput
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      const res = await apiPublishGame({
        title: title.trim(),
        description: description.trim(),
        genre,
        tags: tags.length > 0 ? tags : ['2D', genre],
        thumbnailColor,
        projectData: {
          ...chosenProject,
          name: title.trim(),
          description: description.trim(),
          genre
        }
      });

      soundManager.playWin();
      onPublished(res.message || 'Game published successfully!');
      onClose();
    } catch (err: any) {
      soundManager.playHit();
      setErrorMessage(err.message || 'Failed to publish game to community.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      id="publish-modal-overlay" 
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        id="publish-modal-container"
        className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900/60 via-slate-900 to-indigo-950/60 p-6 border-b border-slate-800 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white font-['Space_Grotesk']">
                Publish to Community Showcase
              </h2>
              <p className="text-xs text-slate-400">
                Share your finished game so other creators can play, like, comment, and learn from it
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handlePublish} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Project Picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Select Game Project to Share
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => handleProjectSelect(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-indigo-500 outline-none"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.genre.replace('_', ' ')}) • {p.entities.length} entities
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Public Showcase Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Neon Runner 2088"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-indigo-500 outline-none"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Description & How to Play
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Tell players about your level, objective, and gameplay tips..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-indigo-500 outline-none"
            />
          </div>

          {/* Genre & Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Genre Category</label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value as GameGenre)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-indigo-500 outline-none capitalize"
              >
                <option value="platformer">Platformer</option>
                <option value="space_shooter">Space Shooter</option>
                <option value="top_down">Top-Down RPG</option>
                <option value="puzzle">Puzzle</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-indigo-400" />
                <span>Tags (comma-separated)</span>
              </label>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Speedrun, Boss, Retro, Hard"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          {/* Card Accent Color */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-amber-400" />
              <span>Card Banner Accent</span>
            </label>
            <div className="flex items-center gap-2">
              {COLOR_THEMES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setThumbnailColor(c)}
                  className={`w-7 h-7 rounded-lg transition-transform cursor-pointer flex items-center justify-center ${
                    thumbnailColor === c ? 'scale-110 ring-2 ring-white' : 'opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c }}
                >
                  {thumbnailColor === c && <Check className="w-4 h-4 text-white drop-shadow" />}
                </button>
              ))}
            </div>
          </div>

          {/* Creator Bonus Badge */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2.5 text-xs text-amber-300">
            <Trophy className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>Publishing earns you <strong>+75 XP</strong> toward your next Developer Rank!</span>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <span>Publishing Game...</span>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Upload & Publish Now</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
