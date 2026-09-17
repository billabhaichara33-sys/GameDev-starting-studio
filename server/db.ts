import crypto from "crypto";
import fs from "fs";
import path from "path";
import { User, UserProgress, CommunityGame, CommunityComment, GameGenre } from "../src/types";

export interface StoredUser extends User {
  passwordHash: string;
  salt: string;
}

export interface StoredSession {
  token: string;
  userId: string;
  createdAt: number;
  expiresAt: number;
}

interface DatabaseSchema {
  users: StoredUser[];
  sessions: StoredSession[];
  communityGames: CommunityGame[];
  communityComments: CommunityComment[];
}

const DB_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "db.json");

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Password hashing utilities
export function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
}

export function generateSalt(): string {
  return crypto.randomBytes(16).toString("hex");
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function sanitizeUser(user: StoredUser): User {
  const { passwordHash, salt, ...safeUser } = user;
  return safeUser;
}

// Initial seeded games for community showcase
const SEED_GAMES: CommunityGame[] = [
  {
    id: "showcase-1",
    title: "Neon Cyber Dash 2088",
    description: "An adrenaline-pumping neon platformer with bounce pads, lasers, and fast-paced coin collection!",
    genre: "platformer",
    authorId: "user-seed-1",
    authorName: "PixelNinja",
    authorAvatar: "🐱",
    authorLevel: 4,
    createdAt: Date.now() - 1000 * 60 * 60 * 36,
    updatedAt: Date.now() - 1000 * 60 * 60 * 36,
    likesCount: 28,
    likedBy: ["user-seed-2", "user-seed-3"],
    playCount: 142,
    tags: ["Cyberpunk", "Platformer", "Fast", "Coins"],
    thumbnailColor: "#0284c7",
    commentsCount: 3,
    projectData: {
      id: "game-neon-dash",
      name: "Neon Cyber Dash 2088",
      description: "Neon platformer with jumping mechanics and coins.",
      genre: "platformer",
      createdAt: Date.now() - 1000 * 60 * 60 * 36,
      lastModified: Date.now() - 1000 * 60 * 60 * 36,
      settings: {
        canvasWidth: 640,
        canvasHeight: 360,
        gravity: 0.55,
        backgroundColor: "#030712",
        targetScore: 50,
        lives: 3
      },
      variables: { score: 0, lives: 3, coins: 0, speedBoost: 1 },
      entities: [
        {
          id: "p1",
          name: "Cyber Runner",
          type: "player",
          x: 40,
          y: 240,
          width: 24,
          height: 32,
          color: "#06b6d4",
          speed: 4.8,
          jumpPower: 11.5,
          health: 3,
          maxHealth: 3,
          gravity: true,
          solid: true,
          tag: "player"
        },
        {
          id: "g1",
          name: "Neon Floor",
          type: "platform",
          x: 0,
          y: 320,
          width: 640,
          height: 40,
          color: "#1e1b4b",
          speed: 0,
          jumpPower: 0,
          health: 1,
          maxHealth: 1,
          gravity: false,
          solid: true
        },
        {
          id: "plat-1",
          name: "Cyan Rail",
          type: "platform",
          x: 140,
          y: 250,
          width: 100,
          height: 14,
          color: "#0284c7",
          speed: 0,
          jumpPower: 0,
          health: 1,
          maxHealth: 1,
          gravity: false,
          solid: true
        },
        {
          id: "plat-2",
          name: "Cyan High Rail",
          type: "platform",
          x: 310,
          y: 190,
          width: 120,
          height: 14,
          color: "#0284c7",
          speed: 0,
          jumpPower: 0,
          health: 1,
          maxHealth: 1,
          gravity: false,
          solid: true
        },
        {
          id: "c1",
          name: "Cyber Token",
          type: "coin",
          x: 180,
          y: 215,
          width: 18,
          height: 18,
          color: "#f59e0b",
          speed: 0,
          jumpPower: 0,
          health: 1,
          maxHealth: 1,
          gravity: false,
          solid: false,
          tag: "coin"
        },
        {
          id: "c2",
          name: "Cyber Token High",
          type: "coin",
          x: 360,
          y: 155,
          width: 18,
          height: 18,
          color: "#f59e0b",
          speed: 0,
          jumpPower: 0,
          health: 1,
          maxHealth: 1,
          gravity: false,
          solid: false,
          tag: "coin"
        },
        {
          id: "goal-1",
          name: "Portal Exit",
          type: "goal",
          x: 570,
          y: 250,
          width: 32,
          height: 70,
          color: "#a855f7",
          speed: 0,
          jumpPower: 0,
          health: 1,
          maxHealth: 1,
          gravity: false,
          solid: false,
          tag: "goal"
        }
      ],
      logicRules: [
        {
          id: "r1",
          name: "Collect Token",
          enabled: true,
          event: { type: "on_collision", param: "coin" },
          conditions: [],
          actions: [
            { type: "change_var", target: "score", param: 25 },
            { type: "play_sound", target: "coin" },
            { type: "destroy" }
          ]
        },
        {
          id: "r2",
          name: "Reach Goal",
          enabled: true,
          event: { type: "on_collision", param: "goal" },
          conditions: [],
          actions: [
            { type: "play_sound", target: "win" },
            { type: "win", param: "Cyber Portal Cleared!" }
          ]
        }
      ],
      sprites: [],
      sounds: []
    }
  },
  {
    id: "showcase-2",
    title: "Astro Blaster Zero",
    description: "Defend sector 7 against incoming asteroid fleets and rogue alien drones. Retro space dogfight action!",
    genre: "space_shooter",
    authorId: "user-seed-2",
    authorName: "CosmoPilot",
    authorAvatar: "🚀",
    authorLevel: 5,
    createdAt: Date.now() - 1000 * 60 * 60 * 20,
    updatedAt: Date.now() - 1000 * 60 * 60 * 20,
    likesCount: 35,
    likedBy: ["user-seed-1"],
    playCount: 219,
    tags: ["Arcade", "Retro", "Space", "Shooter"],
    thumbnailColor: "#4f46e5",
    commentsCount: 2,
    projectData: {
      id: "game-astro-blaster",
      name: "Astro Blaster Zero",
      description: "Retro arcade space shooter.",
      genre: "space_shooter",
      createdAt: Date.now() - 1000 * 60 * 60 * 20,
      lastModified: Date.now() - 1000 * 60 * 60 * 20,
      settings: {
        canvasWidth: 640,
        canvasHeight: 360,
        gravity: 0,
        backgroundColor: "#09090b",
        targetScore: 100,
        lives: 3
      },
      variables: { score: 0, lives: 3, energy: 100 },
      entities: [
        {
          id: "ship",
          name: "Viper Interceptor",
          type: "player",
          x: 60,
          y: 160,
          width: 32,
          height: 24,
          color: "#38bdf8",
          speed: 5,
          jumpPower: 0,
          health: 3,
          maxHealth: 3,
          gravity: false,
          solid: true,
          tag: "player"
        },
        {
          id: "drone-1",
          name: "Drone Alpha",
          type: "enemy",
          x: 420,
          y: 90,
          width: 24,
          height: 24,
          color: "#f43f5e",
          speed: 1.5,
          jumpPower: 0,
          health: 2,
          maxHealth: 2,
          gravity: false,
          solid: true,
          patrolDistance: 70,
          tag: "enemy"
        },
        {
          id: "drone-2",
          name: "Drone Beta",
          type: "enemy",
          x: 520,
          y: 220,
          width: 24,
          height: 24,
          color: "#f43f5e",
          speed: 1.8,
          jumpPower: 0,
          health: 2,
          maxHealth: 2,
          gravity: false,
          solid: true,
          patrolDistance: 90,
          tag: "enemy"
        },
        {
          id: "crystal-1",
          name: "Plasma Core",
          type: "coin",
          x: 320,
          y: 160,
          width: 16,
          height: 16,
          color: "#a855f7",
          speed: 0,
          jumpPower: 0,
          health: 1,
          maxHealth: 1,
          gravity: false,
          solid: false,
          tag: "coin"
        },
        {
          id: "beacon",
          name: "Warp Gate",
          type: "goal",
          x: 580,
          y: 140,
          width: 30,
          height: 80,
          color: "#10b981",
          speed: 0,
          jumpPower: 0,
          health: 1,
          maxHealth: 1,
          gravity: false,
          solid: false,
          tag: "goal"
        }
      ],
      logicRules: [
        {
          id: "rule-plasma",
          name: "Collect Energy",
          enabled: true,
          event: { type: "on_collision", param: "coin" },
          conditions: [],
          actions: [
            { type: "change_var", target: "score", param: 50 },
            { type: "play_sound", target: "coin" },
            { type: "destroy" }
          ]
        },
        {
          id: "rule-warp",
          name: "Enter Warp Gate",
          enabled: true,
          event: { type: "on_collision", param: "goal" },
          conditions: [],
          actions: [
            { type: "play_sound", target: "win" },
            { type: "win", param: "Sector Secured!" }
          ]
        }
      ],
      sprites: [],
      sounds: []
    }
  },
  {
    id: "showcase-3",
    title: "Dungeon of the Slime King",
    description: "Explore a top-down crypt, solve key puzzle gates, dodge traps, and claim the legendary crown!",
    genre: "top_down",
    authorId: "user-seed-3",
    authorName: "QuestWeaver",
    authorAvatar: "🧙‍♂️",
    authorLevel: 6,
    createdAt: Date.now() - 1000 * 60 * 60 * 12,
    updatedAt: Date.now() - 1000 * 60 * 60 * 12,
    likesCount: 42,
    likedBy: ["user-seed-1", "user-seed-2"],
    playCount: 310,
    tags: ["RPG", "Dungeon", "Puzzle", "Adventure"],
    thumbnailColor: "#15803d",
    commentsCount: 2,
    projectData: {
      id: "game-slime-dungeon",
      name: "Dungeon of the Slime King",
      description: "Top-down dungeon explorer.",
      genre: "top_down",
      createdAt: Date.now() - 1000 * 60 * 60 * 12,
      lastModified: Date.now() - 1000 * 60 * 60 * 12,
      settings: {
        canvasWidth: 640,
        canvasHeight: 360,
        gravity: 0,
        backgroundColor: "#18181b",
        targetScore: 100,
        lives: 3
      },
      variables: { score: 0, lives: 3, hasKey: false },
      entities: [
        {
          id: "hero",
          name: "Knight Adventurer",
          type: "player",
          x: 60,
          y: 180,
          width: 24,
          height: 28,
          color: "#38bdf8",
          speed: 3.5,
          jumpPower: 0,
          health: 3,
          maxHealth: 3,
          gravity: false,
          solid: true,
          tag: "player"
        },
        {
          id: "w1",
          name: "Stone Wall",
          type: "platform",
          x: 200,
          y: 60,
          width: 24,
          height: 160,
          color: "#3f3f46",
          speed: 0,
          jumpPower: 0,
          health: 1,
          maxHealth: 1,
          gravity: false,
          solid: true
        },
        {
          id: "key-1",
          name: "Crypt Key",
          type: "key",
          x: 110,
          y: 90,
          width: 18,
          height: 18,
          color: "#eab308",
          speed: 0,
          jumpPower: 0,
          health: 1,
          maxHealth: 1,
          gravity: false,
          solid: false,
          tag: "key"
        },
        {
          id: "door-1",
          name: "Iron Gate",
          type: "door",
          x: 200,
          y: 220,
          width: 24,
          height: 80,
          color: "#78716c",
          speed: 0,
          jumpPower: 0,
          health: 1,
          maxHealth: 1,
          gravity: false,
          solid: true,
          tag: "door"
        },
        {
          id: "chest",
          name: "Treasure Chest",
          type: "goal",
          x: 520,
          y: 170,
          width: 32,
          height: 32,
          color: "#f59e0b",
          speed: 0,
          jumpPower: 0,
          health: 1,
          maxHealth: 1,
          gravity: false,
          solid: false,
          tag: "goal"
        }
      ],
      logicRules: [
        {
          id: "rule-key",
          name: "Pickup Key",
          enabled: true,
          event: { type: "on_collision", param: "key" },
          conditions: [],
          actions: [
            { type: "change_var", target: "hasKey", param: true },
            { type: "play_sound", target: "coin" },
            { type: "destroy" }
          ]
        },
        {
          id: "rule-door",
          name: "Unlock Door",
          enabled: true,
          event: { type: "on_collision", param: "door" },
          conditions: [{ target: "hasKey", operator: "==", value: true }],
          actions: [
            { type: "play_sound", target: "win" },
            { type: "destroy" }
          ]
        },
        {
          id: "rule-chest",
          name: "Claim Treasure",
          enabled: true,
          event: { type: "on_collision", param: "goal" },
          conditions: [],
          actions: [
            { type: "play_sound", target: "win" },
            { type: "win", param: "You found the King's Treasure!" }
          ]
        }
      ],
      sprites: [],
      sounds: []
    }
  }
];

const SEED_COMMENTS: CommunityComment[] = [
  {
    id: "comm-1",
    gameId: "showcase-1",
    userId: "user-seed-2",
    userName: "CosmoPilot",
    userAvatar: "🚀",
    userLevel: 5,
    content: "The jump physics and neon aesthetic feel super crisp! Loved the high rail shortcut.",
    createdAt: Date.now() - 1000 * 60 * 60 * 24,
    rating: 5
  },
  {
    id: "comm-2",
    gameId: "showcase-1",
    userId: "user-seed-3",
    userName: "QuestWeaver",
    userAvatar: "🧙‍♂️",
    userLevel: 6,
    content: "Awesome design. Try adding a bouncing pad logic block on the middle platform next!",
    createdAt: Date.now() - 1000 * 60 * 60 * 18,
    rating: 5
  },
  {
    id: "comm-3",
    gameId: "showcase-1",
    userId: "user-seed-1",
    userName: "PixelNinja",
    userAvatar: "🐱",
    userLevel: 4,
    content: "Thanks for the feedback! Working on world 2 right now.",
    createdAt: Date.now() - 1000 * 60 * 60 * 8,
    rating: 5
  },
  {
    id: "comm-4",
    gameId: "showcase-2",
    userId: "user-seed-1",
    userName: "PixelNinja",
    userAvatar: "🐱",
    userLevel: 4,
    content: "Great arcade vibe! The sound effects match the laser blasts perfectly.",
    createdAt: Date.now() - 1000 * 60 * 60 * 14,
    rating: 5
  },
  {
    id: "comm-5",
    gameId: "showcase-2",
    userId: "user-seed-3",
    userName: "QuestWeaver",
    userAvatar: "🧙‍♂️",
    userLevel: 6,
    content: "Super fun dogfighting. Reminds me of classic 80s arcade cabinets!",
    createdAt: Date.now() - 1000 * 60 * 60 * 6,
    rating: 5
  },
  {
    id: "comm-6",
    gameId: "showcase-3",
    userId: "user-seed-2",
    userName: "CosmoPilot",
    userAvatar: "🚀",
    userLevel: 5,
    content: "The door & key logic puzzle is a great demonstration of conditional logic blocks.",
    createdAt: Date.now() - 1000 * 60 * 60 * 5,
    rating: 5
  },
  {
    id: "comm-7",
    gameId: "showcase-3",
    userId: "user-seed-1",
    userName: "PixelNinja",
    userAvatar: "🐱",
    userLevel: 4,
    content: "Very neat! I remixed this to add a secret treasure room behind a hidden wall.",
    createdAt: Date.now() - 1000 * 60 * 60 * 2,
    rating: 5
  }
];

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        return {
          users: parsed.users || [],
          sessions: parsed.sessions || [],
          communityGames: parsed.communityGames || SEED_GAMES,
          communityComments: parsed.communityComments || SEED_COMMENTS
        };
      }
    } catch (err) {
      console.warn("Could not load database file, creating fresh initial data:", err);
    }

    const initial: DatabaseSchema = {
      users: [],
      sessions: [],
      communityGames: SEED_GAMES,
      communityComments: SEED_COMMENTS
    };
    this.save(initial);
    return initial;
  }

  private save(dataToSave?: DatabaseSchema) {
    try {
      const data = dataToSave || this.data;
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
    } catch (err) {
      console.error("Failed to save database file:", err);
    }
  }

  // --- User Operations ---
  public findUserByUsernameOrEmail(identifier: string): StoredUser | undefined {
    const clean = identifier.trim().toLowerCase();
    return this.data.users.find(
      u => u.username.toLowerCase() === clean || u.email.toLowerCase() === clean
    );
  }

  public findUserById(id: string): StoredUser | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public createUser(user: StoredUser): StoredUser {
    this.data.users.push(user);
    this.save();
    return user;
  }

  public updateUserProgress(userId: string, progress: UserProgress): UserProgress | null {
    const user = this.findUserById(userId);
    if (!user) return null;
    user.progress = progress;
    this.save();
    return user.progress;
  }

  public updateUserProfile(userId: string, updates: Partial<User>): User | null {
    const user = this.findUserById(userId);
    if (!user) return null;
    if (updates.displayName) user.displayName = updates.displayName;
    if (updates.bio !== undefined) user.bio = updates.bio;
    if (updates.avatarUrl) user.avatarUrl = updates.avatarUrl;
    this.save();
    return sanitizeUser(user);
  }

  // --- Session Operations ---
  public createSession(userId: string): string {
    const token = generateToken();
    const session: StoredSession = {
      token,
      userId,
      createdAt: Date.now(),
      expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 30 // 30 days
    };
    this.data.sessions.push(session);
    this.save();
    return token;
  }

  public getUserByToken(token: string): StoredUser | null {
    if (!token) return null;
    const session = this.data.sessions.find(s => s.token === token);
    if (!session) return null;
    if (Date.now() > session.expiresAt) {
      this.deleteSession(token);
      return null;
    }
    return this.findUserById(session.userId) || null;
  }

  public deleteSession(token: string): boolean {
    const prevLen = this.data.sessions.length;
    this.data.sessions = this.data.sessions.filter(s => s.token !== token);
    if (this.data.sessions.length !== prevLen) {
      this.save();
      return true;
    }
    return false;
  }

  // --- Community Games Operations ---
  public getCommunityGames(options?: {
    genre?: string;
    search?: string;
    sort?: "popular" | "newest" | "played";
    userId?: string;
    currentUserId?: string;
  }): CommunityGame[] {
    let games = [...this.data.communityGames];

    // Filter genre
    if (options?.genre && options.genre !== "all") {
      games = games.filter(g => g.genre === options.genre);
    }

    // Filter author
    if (options?.userId) {
      games = games.filter(g => g.authorId === options.userId);
    }

    // Search query
    if (options?.search) {
      const q = options.search.toLowerCase().trim();
      games = games.filter(
        g =>
          g.title.toLowerCase().includes(q) ||
          g.description.toLowerCase().includes(q) ||
          g.authorName.toLowerCase().includes(q) ||
          g.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    // Sort
    const sort = options?.sort || "popular";
    if (sort === "newest") {
      games.sort((a, b) => b.createdAt - a.createdAt);
    } else if (sort === "played") {
      games.sort((a, b) => b.playCount - a.playCount);
    } else {
      // popular by likes
      games.sort((a, b) => b.likesCount - a.likesCount);
    }

    // Attach isLiked for current user
    const currentUserId = options?.currentUserId;
    return games.map(g => ({
      ...g,
      isLiked: currentUserId ? g.likedBy.includes(currentUserId) : false,
      likesCount: g.likedBy.length
    }));
  }

  public getCommunityGameById(gameId: string, currentUserId?: string): CommunityGame | null {
    const game = this.data.communityGames.find(g => g.id === gameId);
    if (!game) return null;
    return {
      ...game,
      isLiked: currentUserId ? game.likedBy.includes(currentUserId) : false,
      likesCount: game.likedBy.length
    };
  }

  public addCommunityGame(game: CommunityGame): CommunityGame {
    this.data.communityGames.unshift(game);
    // Increment author stat
    const author = this.findUserById(game.authorId);
    if (author) {
      author.progress.stats.gamesCreated += 1;
      author.progress.xp += 75; // XP reward for publishing
    }
    this.save();
    return game;
  }

  public toggleLikeGame(gameId: string, userId: string): { liked: boolean; likesCount: number } | null {
    const game = this.data.communityGames.find(g => g.id === gameId);
    if (!game) return null;

    const alreadyLiked = game.likedBy.includes(userId);
    if (alreadyLiked) {
      game.likedBy = game.likedBy.filter(id => id !== userId);
    } else {
      game.likedBy.push(userId);
    }
    game.likesCount = game.likedBy.length;
    this.save();

    return {
      liked: !alreadyLiked,
      likesCount: game.likesCount
    };
  }

  public incrementPlayCount(gameId: string): number | null {
    const game = this.data.communityGames.find(g => g.id === gameId);
    if (!game) return null;
    game.playCount += 1;
    this.save();
    return game.playCount;
  }

  // --- Comments Operations ---
  public getCommentsForGame(gameId: string): CommunityComment[] {
    return this.data.communityComments
      .filter(c => c.gameId === gameId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  public addComment(comment: CommunityComment): CommunityComment {
    this.data.communityComments.push(comment);
    // Update game comment count
    const game = this.data.communityGames.find(g => g.id === comment.gameId);
    if (game) {
      game.commentsCount = (game.commentsCount || 0) + 1;
    }
    this.save();
    return comment;
  }

  public deleteComment(commentId: string, userId: string): boolean {
    const comment = this.data.communityComments.find(c => c.id === commentId);
    if (!comment || comment.userId !== userId) return false;

    this.data.communityComments = this.data.communityComments.filter(c => c.id !== commentId);
    const game = this.data.communityGames.find(g => g.id === comment.gameId);
    if (game && game.commentsCount > 0) {
      game.commentsCount -= 1;
    }
    this.save();
    return true;
  }
}

export const db = new Database();
