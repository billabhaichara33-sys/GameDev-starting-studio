import React, { useState, useEffect } from 'react';
import { 
  Gamepad2, 
  Search, 
  Heart, 
  MessageSquare, 
  Play, 
  Share2, 
  Plus, 
  Upload, 
  Flame, 
  Trophy, 
  Clock, 
  Filter, 
  Sparkles, 
  GitFork, 
  Star, 
  Trash2, 
  Send, 
  X, 
  ArrowLeft,
  Tag,
  CheckCircle2,
  ThumbsUp,
  User as UserIcon
} from 'lucide-react';
import { CommunityGame, CommunityComment, GameGenre, GameProject, User } from '../types';
import { 
  apiGetCommunityGames, 
  apiToggleLikeGame, 
  apiRecordPlayGame, 
  apiGetGameComments, 
  apiAddComment, 
  apiDeleteComment 
} from '../utils/api';
import { soundManager } from '../utils/audioSynth';

interface CommunityShowcaseProps {
  user: User | null;
  onPlayGame: (project: GameProject, gameId?: string) => void;
  onRemixGame: (project: GameProject) => void;
  onOpenPublishModal: () => void;
  onRequireAuth: () => void;
  onBackToDashboard: () => void;
}

export const CommunityShowcase: React.FC<CommunityShowcaseProps> = ({
  user,
  onPlayGame,
  onRemixGame,
  onOpenPublishModal,
  onRequireAuth,
  onBackToDashboard
}) => {
  const [games, setGames] = useState<CommunityGame[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'played'>('popular');
  const [onlyMyGames, setOnlyMyGames] = useState<boolean>(false);

  // Active game modal for discussion & comments
  const [selectedGame, setSelectedGame] = useState<CommunityGame | null>(null);
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [newCommentText, setNewCommentText] = useState<string>('');
  const [newCommentRating, setNewCommentRating] = useState<number>(5);
  const [isPostingComment, setIsPostingComment] = useState<boolean>(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  // Fetch games
  const fetchGames = async () => {
    setIsLoading(true);
    try {
      const data = await apiGetCommunityGames({
        genre: selectedGenre,
        search: searchQuery,
        sort: sortBy,
        authorId: onlyMyGames && user ? user.id : undefined
      });
      setGames(data);
    } catch (e) {
      console.error('Failed to load community games', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
  }, [selectedGenre, sortBy, onlyMyGames, user?.id]);

  // Handle Search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchGames();
  };

  // Like game
  const handleToggleLike = async (gameId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      onRequireAuth();
      return;
    }

    // Optimistic UI update
    setGames(prev => prev.map(g => {
      if (g.id === gameId) {
        const nextLiked = !g.isLiked;
        return {
          ...g,
          isLiked: nextLiked,
          likesCount: nextLiked ? g.likesCount + 1 : Math.max(0, g.likesCount - 1)
        };
      }
      return g;
    }));

    if (selectedGame && selectedGame.id === gameId) {
      const nextLiked = !selectedGame.isLiked;
      setSelectedGame({
        ...selectedGame,
        isLiked: nextLiked,
        likesCount: nextLiked ? selectedGame.likesCount + 1 : Math.max(0, selectedGame.likesCount - 1)
      });
    }

    try {
      soundManager.playCoin();
      const res = await apiToggleLikeGame(gameId);
      // Sync confirmed response
      setGames(prev => prev.map(g => g.id === gameId ? { ...g, likesCount: res.likesCount, isLiked: res.liked } : g));
      if (selectedGame && selectedGame.id === gameId) {
        setSelectedGame(prev => prev ? { ...prev, likesCount: res.likesCount, isLiked: res.liked } : null);
      }
    } catch (err) {
      console.error('Like toggle failed', err);
      // Revert if error
      fetchGames();
    }
  };

  // Open Game Detail & Comments
  const handleOpenGameDetails = async (game: CommunityGame) => {
    setSelectedGame(game);
    setNewCommentText('');
    setCommentError(null);
    try {
      const comms = await apiGetGameComments(game.id);
      setComments(comms);
    } catch (e) {
      console.error('Failed to load comments', e);
    }
  };

  // Play Game
  const handlePlay = (game: CommunityGame, e?: React.MouseEvent) => {
    e?.stopPropagation();
    apiRecordPlayGame(game.id);
    onPlayGame(game.projectData, game.id);
  };

  // Remix Game
  const handleRemix = (game: CommunityGame, e?: React.MouseEvent) => {
    e?.stopPropagation();
    soundManager.playWin();
    onRemixGame(game.projectData);
  };

  // Add Comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onRequireAuth();
      return;
    }
    if (!selectedGame) return;
    if (!newCommentText.trim()) {
      setCommentError('Comment cannot be empty.');
      return;
    }

    setIsPostingComment(true);
    setCommentError(null);

    try {
      const comment = await apiAddComment(selectedGame.id, {
        content: newCommentText.trim(),
        rating: newCommentRating
      });

      setComments(prev => [comment, ...prev]);
      setNewCommentText('');
      soundManager.playCoin();

      // Update comment count in game list
      setGames(prev => prev.map(g => g.id === selectedGame.id ? { ...g, commentsCount: g.commentsCount + 1 } : g));
      setSelectedGame(prev => prev ? { ...prev, commentsCount: prev.commentsCount + 1 } : null);
    } catch (err: any) {
      setCommentError(err.message || 'Failed to post comment.');
    } finally {
      setIsPostingComment(false);
    }
  };

  // Delete Comment
  const handleDeleteComment = async (commentId: string) => {
    try {
      await apiDeleteComment(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
      if (selectedGame) {
        setGames(prev => prev.map(g => g.id === selectedGame.id ? { ...g, commentsCount: Math.max(0, g.commentsCount - 1) } : g));
        setSelectedGame(prev => prev ? { ...prev, commentsCount: Math.max(0, prev.commentsCount - 1) } : null);
      }
    } catch (e) {
      console.error('Failed to delete comment', e);
    }
  };

  return (
    <div id="community-showcase-root" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border border-slate-800 p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2">
              <button
                onClick={onBackToDashboard}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Studio
              </button>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-medium">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Indie Creator Hub</span>
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-['Space_Grotesk']">
              Community Game Showcase
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Explore playable 2D games created by other developers. Test-play them in browser, drop comments, leave likes, and fork project logic to learn new mechanics!
            </p>
          </div>

          {/* Action button: Upload / Publish */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              id="btn-showcase-upload-game"
              onClick={onOpenPublishModal}
              className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Share Your Game</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="input-showcase-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by game title, author, or tags..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:border-indigo-500 outline-none"
            />
          </form>

          {/* Sort Dropdown & My Games Toggle */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Sort:</span>
              <select
                id="select-showcase-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:border-indigo-500 outline-none"
              >
                <option value="popular">Most Liked (Popular)</option>
                <option value="newest">Newest First</option>
                <option value="played">Most Played</option>
              </select>
            </div>

            {user && (
              <button
                id="btn-toggle-my-games"
                onClick={() => setOnlyMyGames(!onlyMyGames)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  onlyMyGames 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>My Uploads</span>
              </button>
            )}
          </div>
        </div>

        {/* Genre Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-800/80">
          {[
            { id: 'all', label: 'All Genres' },
            { id: 'platformer', label: 'Platformers' },
            { id: 'space_shooter', label: 'Space Shooters' },
            { id: 'top_down', label: 'Top-Down RPG' },
            { id: 'puzzle', label: 'Puzzle' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedGenre(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                selectedGenre === cat.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Games List Grid */}
      {isLoading ? (
        <div className="p-16 text-center text-slate-400 space-y-3">
          <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto" />
          <p className="text-xs">Loading community games...</p>
        </div>
      ) : games.length === 0 ? (
        <div className="p-16 text-center rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
          <div className="w-12 h-12 mx-auto rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <Gamepad2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">No games match your search</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Try adjusting your genre filters or search query, or be the first to publish a game in this category!
            </p>
          </div>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedGenre('all');
              setOnlyMyGames(false);
            }}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => (
            <div
              key={game.id}
              id={`community-card-${game.id}`}
              onClick={() => handleOpenGameDetails(game)}
              className="group bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                {/* Visual Banner Preview */}
                <div 
                  className="h-36 relative flex items-center justify-center overflow-hidden p-4"
                  style={{
                    background: `linear-gradient(135deg, ${game.thumbnailColor || '#4f46e5'}22 0%, #0f172a 100%)`
                  }}
                >
                  <div 
                    className="absolute inset-0 opacity-20"
                    style={{
                      backgroundImage: `radial-gradient(circle at 2px 2px, ${game.thumbnailColor || '#4f46e5'} 1px, transparent 0)`,
                      backgroundSize: '16px 16px'
                    }}
                  />

                  {/* Genre pill & play count */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full bg-slate-950/80 backdrop-blur text-[11px] font-bold text-white border border-slate-800 uppercase tracking-wider">
                      {game.genre.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3 flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-950/80 text-slate-300 border border-slate-800">
                    <Play className="w-3 h-3 fill-current text-emerald-400" />
                    <span>{game.playCount}</span>
                  </div>

                  {/* Play Hover Button */}
                  <button
                    onClick={(e) => handlePlay(game, e)}
                    className="w-12 h-12 rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-600/40 flex items-center justify-center group-hover:scale-110 transition-transform cursor-pointer"
                  >
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-5 space-y-3">
                  {/* Title & Description */}
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                      {game.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                      {game.description}
                    </p>
                  </div>

                  {/* Author line */}
                  <div className="flex items-center gap-2 pt-1 text-xs text-slate-400">
                    <span className="text-base">{game.authorAvatar || '🎮'}</span>
                    <span className="font-semibold text-slate-300">{game.authorName}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
                      Lvl {game.authorLevel}
                    </span>
                    <span className="text-[11px] text-slate-500 ml-auto">
                      {new Date(game.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Tags */}
                  {game.tags && game.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {game.tags.slice(0, 3).map((tag, idx) => (
                        <span key={idx} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-950 text-slate-400 border border-slate-800">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Card Footer Actions */}
              <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-3">
                  {/* Like Button */}
                  <button
                    onClick={(e) => handleToggleLike(game.id, e)}
                    className={`flex items-center gap-1.5 py-1 px-2 rounded-lg transition-colors cursor-pointer ${
                      game.isLiked 
                        ? 'text-rose-400 bg-rose-500/10 font-bold' 
                        : 'hover:text-rose-400 hover:bg-slate-800'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${game.isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                    <span>{game.likesCount}</span>
                  </button>

                  {/* Comments Count */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenGameDetails(game);
                    }}
                    className="flex items-center gap-1.5 py-1 px-2 rounded-lg hover:text-indigo-300 hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>{game.commentsCount || 0}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleRemix(game, e)}
                    title="Fork & edit this game in your studio"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
                  >
                    <GitFork className="w-3.5 h-3.5" />
                    <span>Remix</span>
                  </button>

                  <button
                    onClick={(e) => handlePlay(game, e)}
                    className="py-1 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Play</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Game Details & Discussion Modal */}
      {selectedGame && (
        <div 
          id="game-discussion-modal" 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedGame(null);
          }}
        >
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div 
              className="p-6 border-b border-slate-800 relative"
              style={{
                background: `linear-gradient(135deg, ${selectedGame.thumbnailColor || '#4f46e5'}25 0%, #0f172a 100%)`
              }}
            >
              <button
                onClick={() => setSelectedGame(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-slate-950/80 text-[11px] font-bold text-white border border-slate-800 uppercase tracking-wider">
                    {selectedGame.genre.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-slate-400">
                    Published {new Date(selectedGame.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <h2 className="text-2xl font-bold text-white font-['Space_Grotesk']">
                  {selectedGame.title}
                </h2>

                {/* Author badge */}
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <span className="text-lg">{selectedGame.authorAvatar || '🎮'}</span>
                  <span className="font-semibold text-white">{selectedGame.authorName}</span>
                  <span className="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-mono">
                    Rank: Level {selectedGame.authorLevel}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed pt-1">
                  {selectedGame.description}
                </p>

                {/* Primary Game Actions */}
                <div className="flex items-center gap-3 pt-3">
                  <button
                    onClick={() => handlePlay(selectedGame)}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Play Game Now</span>
                  </button>

                  <button
                    onClick={() => handleRemix(selectedGame)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
                  >
                    <GitFork className="w-4 h-4 text-cyan-400" />
                    <span>Remix & Customize</span>
                  </button>

                  <button
                    onClick={(e) => handleToggleLike(selectedGame.id, e)}
                    className={`ml-auto px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                      selectedGame.isLiked
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                        : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-rose-400'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${selectedGame.isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                    <span>{selectedGame.likesCount} Likes</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Comments & Discussion Section */}
            <div className="p-6 space-y-6 max-h-[460px] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-indigo-400" />
                  <span>Developer Feedback & Discussion ({comments.length})</span>
                </h3>
              </div>

              {/* Comment submission form */}
              {user ? (
                <form onSubmit={handleAddComment} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Leave feedback or gameplay tips:</span>
                    {/* Star rating */}
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewCommentRating(star)}
                          className="cursor-pointer"
                        >
                          <Star className={`w-4 h-4 ${star <= newCommentRating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  {commentError && (
                    <div className="text-xs text-rose-400">{commentError}</div>
                  )}

                  <textarea
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    rows={2}
                    placeholder="Share what you liked, suggested logic tweaks, or level design thoughts..."
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-indigo-500 outline-none"
                  />

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isPostingComment}
                      className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isPostingComment ? 'Posting...' : 'Post Comment'}</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-2">
                  <p className="text-xs text-slate-400">Sign in to join the conversation and leave feedback for the author.</p>
                  <button
                    onClick={() => {
                      setSelectedGame(null);
                      onRequireAuth();
                    }}
                    className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer"
                  >
                    Sign In
                  </button>
                </div>
              )}

              {/* Comments Stream */}
              <div className="space-y-3">
                {comments.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4">
                    No comments yet. Be the first to play and review this game!
                  </p>
                ) : (
                  comments.map((comm) => (
                    <div key={comm.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{comm.userAvatar || '🎮'}</span>
                          <span className="text-xs font-bold text-white">{comm.userName}</span>
                          <span className="text-[10px] px-1 rounded bg-slate-800 text-slate-400">
                            Lvl {comm.userLevel}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {comm.rating && (
                            <div className="flex items-center gap-0.5">
                              {Array.from({ length: comm.rating }).map((_, i) => (
                                <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                              ))}
                            </div>
                          )}
                          <span className="text-[10px] text-slate-500">
                            {new Date(comm.createdAt).toLocaleDateString()}
                          </span>
                          {user && user.id === comm.userId && (
                            <button
                              onClick={() => handleDeleteComment(comm.id)}
                              className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                              title="Delete comment"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed pl-6">
                        {comm.content}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
