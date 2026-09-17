import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { 
  db, 
  hashPassword, 
  generateSalt, 
  sanitizeUser, 
  StoredUser 
} from "./server/db";
import { UserProgress, CommunityGame, CommunityComment } from "./src/types";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "15mb" }));

// Helper to authenticate request via Bearer token
function getAuthUser(req: express.Request): StoredUser | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.substring(7).trim();
  return db.getUserByToken(token);
}

// ==========================================
// 1. AUTHENTICATION & USER PROFILE ENDPOINTS
// ==========================================

// Register / Sign Up
app.post("/api/auth/signup", (req, res) => {
  try {
    const { username, email, password, displayName, avatarUrl } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: "Username, email, and password are required." });
    }

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanUsername.length < 3 || cleanUsername.length > 24) {
      return res.status(400).json({ error: "Username must be between 3 and 24 characters." });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      return res.status(400).json({ error: "Username can only contain letters, numbers, and underscores." });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({ error: "Please enter a valid email address." });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long." });
    }

    // Check for existing user
    if (db.findUserByUsernameOrEmail(cleanUsername) || db.findUserByUsernameOrEmail(cleanEmail)) {
      return res.status(409).json({ error: "Username or email is already registered." });
    }

    const salt = generateSalt();
    const passwordHash = hashPassword(password, salt);

    const initialProgress: UserProgress = {
      xp: 150,
      level: 1,
      streakDays: 1,
      lastActiveDate: new Date().toISOString(),
      completedLessonIds: ["lesson-vars-1"],
      passedQuizIds: ["lesson-vars-1"],
      unlockedBadgeIds: ["badge-first-step"],
      stats: {
        gamesCreated: 0,
        playTestsRun: 0,
        spritesCreated: 0,
        logicBlocksCreated: 0,
        codeChallengesSolved: 0
      }
    };

    const newUser: StoredUser = {
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      username: cleanUsername,
      email: cleanEmail,
      displayName: displayName?.trim() || cleanUsername,
      avatarUrl: avatarUrl || "🎮",
      bio: "Aspiring Indie Game Developer exploring 2D worlds!",
      role: "creator",
      createdAt: Date.now(),
      passwordHash,
      salt,
      progress: initialProgress
    };

    db.createUser(newUser);
    const token = db.createSession(newUser.id);

    return res.status(201).json({
      user: sanitizeUser(newUser),
      token
    });
  } catch (error: any) {
    console.error("Signup error:", error);
    return res.status(500).json({ error: "Internal server error during registration." });
  }
});

// Login
app.post("/api/auth/login", (req, res) => {
  try {
    const { login, password } = req.body;

    if (!login || !password) {
      return res.status(400).json({ error: "Username/email and password are required." });
    }

    const user = db.findUserByUsernameOrEmail(login);
    if (!user) {
      return res.status(401).json({ error: "Invalid username/email or password." });
    }

    const computedHash = hashPassword(password, user.salt);
    if (computedHash !== user.passwordHash) {
      return res.status(401).json({ error: "Invalid username/email or password." });
    }

    // Update streak / last active
    user.progress.lastActiveDate = new Date().toISOString();
    const token = db.createSession(user.id);

    return res.json({
      user: sanitizeUser(user),
      token
    });
  } catch (error: any) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Internal server error during login." });
  }
});

// Logout
app.post("/api/auth/logout", (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();
    db.deleteSession(token);
  }
  return res.json({ success: true, message: "Logged out successfully." });
});

// Get Current User (Session check)
app.get("/api/auth/me", (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  return res.json({ user: sanitizeUser(user) });
});

// Demo student login (Convenience for testing)
app.post("/api/auth/demo", (_req, res) => {
  const demoUsername = "AlexDev";
  let user = db.findUserByUsernameOrEmail(demoUsername);

  if (!user) {
    const salt = generateSalt();
    user = {
      id: "user-demo-alex",
      username: demoUsername,
      email: "alex@gamedev-studio.dev",
      displayName: "Alex the Creator",
      avatarUrl: "🕹️",
      bio: "Learning 2D physics, logic blocks, and pixel art!",
      role: "creator",
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
      passwordHash: hashPassword("demo123", salt),
      salt,
      progress: {
        xp: 420,
        level: 1,
        streakDays: 4,
        lastActiveDate: new Date().toISOString(),
        completedLessonIds: ["lesson-vars-1", "lesson-loop-2"],
        passedQuizIds: ["lesson-vars-1", "lesson-loop-2"],
        unlockedBadgeIds: ["badge-first-step"],
        stats: {
          gamesCreated: 2,
          playTestsRun: 12,
          spritesCreated: 5,
          logicBlocksCreated: 18,
          codeChallengesSolved: 3
        }
      }
    };
    db.createUser(user);
  }

  const token = db.createSession(user.id);
  return res.json({
    user: sanitizeUser(user),
    token
  });
});

// Sync User Learning Progress & Achievements
app.put("/api/auth/progress", (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized. Please log in to save learning progress." });
  }

  const { progress } = req.body;
  if (!progress || typeof progress.xp !== "number") {
    return res.status(400).json({ error: "Invalid progress payload." });
  }

  const updatedProgress = db.updateUserProgress(user.id, progress);
  return res.json({ success: true, progress: updatedProgress });
});

// Update Profile
app.put("/api/auth/profile", (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  const { displayName, bio, avatarUrl } = req.body;
  const updated = db.updateUserProfile(user.id, { displayName, bio, avatarUrl });
  return res.json({ user: updated });
});

// ==========================================
// 2. COMMUNITY SHOWCASE ENDPOINTS
// ==========================================

// Browse Community Games
app.get("/api/community/games", (req, res) => {
  try {
    const user = getAuthUser(req);
    const genre = req.query.genre as string | undefined;
    const search = req.query.search as string | undefined;
    const sort = req.query.sort as "popular" | "newest" | "played" | undefined;
    const authorId = req.query.authorId as string | undefined;

    const games = db.getCommunityGames({
      genre,
      search,
      sort,
      userId: authorId,
      currentUserId: user?.id
    });

    return res.json({ games });
  } catch (error: any) {
    console.error("Get community games error:", error);
    return res.status(500).json({ error: "Failed to fetch community games." });
  }
});

// Get Single Community Game
app.get("/api/community/games/:id", (req, res) => {
  try {
    const user = getAuthUser(req);
    const game = db.getCommunityGameById(req.params.id, user?.id);
    if (!game) {
      return res.status(404).json({ error: "Community game not found." });
    }
    const comments = db.getCommentsForGame(game.id);
    return res.json({ game, comments });
  } catch (error: any) {
    return res.status(500).json({ error: "Failed to fetch game details." });
  }
});

// Publish / Upload Game to Community
app.post("/api/community/games", (req, res) => {
  try {
    const user = getAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: "Please log in to share your game with the community." });
    }

    const { title, description, genre, tags, projectData, thumbnailColor } = req.body;

    if (!title || !projectData) {
      return res.status(400).json({ error: "Game title and project data are required." });
    }

    const newGame: CommunityGame = {
      id: `comm-game-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: title.trim(),
      description: description?.trim() || "A custom community game built in GameDev Starter Studio!",
      genre: genre || projectData.genre || "platformer",
      authorId: user.id,
      authorName: user.displayName || user.username,
      authorAvatar: user.avatarUrl || "🎮",
      authorLevel: user.progress.level || 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      likesCount: 0,
      likedBy: [],
      playCount: 0,
      tags: Array.isArray(tags) ? tags : ["Custom", genre || "2D"],
      thumbnailColor: thumbnailColor || "#6366f1",
      commentsCount: 0,
      projectData: {
        ...projectData,
        name: title.trim()
      }
    };

    const saved = db.addCommunityGame(newGame);
    return res.status(201).json({
      game: saved,
      message: "Congratulations! Your game has been published to the Community Showcase. (+75 XP earned!)"
    });
  } catch (error: any) {
    console.error("Upload community game error:", error);
    return res.status(500).json({ error: "Failed to upload game to community." });
  }
});

// Toggle Like Game
app.post("/api/community/games/:id/like", (req, res) => {
  try {
    const user = getAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: "Please log in to like community games." });
    }

    const result = db.toggleLikeGame(req.params.id, user.id);
    if (!result) {
      return res.status(404).json({ error: "Game not found." });
    }

    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ error: "Failed to toggle like." });
  }
});

// Record Game Play
app.post("/api/community/games/:id/play", (req, res) => {
  try {
    const playCount = db.incrementPlayCount(req.params.id);
    return res.json({ success: true, playCount });
  } catch (error: any) {
    return res.status(500).json({ error: "Failed to record play." });
  }
});

// Get Comments for Game
app.get("/api/community/games/:id/comments", (req, res) => {
  try {
    const comments = db.getCommentsForGame(req.params.id);
    return res.json({ comments });
  } catch (error: any) {
    return res.status(500).json({ error: "Failed to fetch comments." });
  }
});

// Post Comment on Game
app.post("/api/community/games/:id/comments", (req, res) => {
  try {
    const user = getAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: "Please log in to comment on community games." });
    }

    const { content, rating } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Comment text cannot be empty." });
    }

    const newComment: CommunityComment = {
      id: `comm-c-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      gameId: req.params.id,
      userId: user.id,
      userName: user.displayName || user.username,
      userAvatar: user.avatarUrl || "🎮",
      userLevel: user.progress.level || 1,
      content: content.trim(),
      createdAt: Date.now(),
      rating: rating ? Math.min(5, Math.max(1, Number(rating))) : undefined
    };

    const saved = db.addComment(newComment);
    return res.status(201).json({ comment: saved });
  } catch (error: any) {
    return res.status(500).json({ error: "Failed to post comment." });
  }
});

// Delete Comment
app.delete("/api/community/comments/:commentId", (req, res) => {
  try {
    const user = getAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized." });
    }

    const success = db.deleteComment(req.params.commentId, user.id);
    if (!success) {
      return res.status(403).json({ error: "Could not delete comment or permission denied." });
    }

    return res.json({ success: true, message: "Comment deleted." });
  } catch (error: any) {
    return res.status(500).json({ error: "Failed to delete comment." });
  }
});

let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

// Beginner AI Learning Assistant Endpoint
app.post("/api/assistant", async (req, res) => {
  try {
    const { prompt, code, errorInfo, context, mode = "general" } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const ai = getAI();
    if (!ai) {
      // Friendly local fallback if no API key is configured
      const fallbackReplies: Record<string, string> = {
        explain: "💡 **Beginner Tip:** In game development, everything runs in a loop 60 times a second! Variables store information like your score or lives, while events listen for player actions like pressing the spacebar to jump.",
        debug: "🔍 **Debugging Hint:** When an object doesn't move or falls through the floor, check two things: 1) Does it have gravity turned on? 2) Is collision detection enabled between the player and the platform?",
        logic: "🧩 **Visual Logic:** Remember the golden rule of game mechanics: **WHEN** [Event Happens] + **IF** [Condition is True] -> **THEN** [Do Action]. For example: When [Collision with Coin] -> If [Coin is Active] -> Then [Add 10 to Score, Play Chime, Destroy Coin].",
      };

      const reply = fallbackReplies[mode] || 
        `👋 **Sparky the GameDev Mentor:** Great question! In game development, breaking big problems into tiny steps is the secret. You asked about: "${prompt}".\n\n` +
        `• **Key Concept:** Games update continuously in frames (60 FPS).\n` +
        `• **State:** Keep track of things using variables (e.g. \`player_health\`, \`coins\`).\n` +
        `• **Action:** Trigger movement by changing positions (\`x = x + speed\`).\n\n` +
        `*Tip: Connect your Gemini API Key in the settings for real-time live interactive AI guidance!*`;

      return res.json({ response: reply, isFallback: true });
    }

    const systemPrompt = `You are "Sparky", a supportive, enthusiastic, beginner-friendly AI Game Development Mentor built directly inside GameDev Starter Studio.
Your audience: Complete beginners, students, and aspiring indie creators who may know zero programming.
Your rules:
1. Explain concepts using intuitive, vivid real-world metaphors (e.g., comparing variables to labeled cardboard boxes, gravity to an invisible elevator pulling down, the game loop to a flipbook).
2. Never patronize or overwhelm with heavy jargon. Keep explanations concise, clear, and actionable.
3. If the user asks for help with an error or bug: Explain WHY the error happened in plain English, and guide them with a hint or step-by-step fix rather than doing everything for them.
4. Format using clean Markdown with bold keywords, bullet points, and short code/logic snippets when appropriate.
5. End with an encouraging 1-sentence booster cheering on their game dev journey.`;

    let userMessage = `User Query: ${prompt}\n`;
    if (context) userMessage += `Context / Task: ${context}\n`;
    if (code) userMessage += `Current Code / Logic:\n\`\`\`javascript\n${code}\n\`\`\`\n`;
    if (errorInfo) userMessage += `Error Message / Behavior:\n${errorInfo}\n`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: [
        { role: "user", parts: [{ text: `${systemPrompt}\n\n${userMessage}` }] }
      ]
    });

    const replyText = response.text || "I'm thinking about that game mechanic! Try rephrasing your question or checking the visual logic inspector.";
    return res.json({ response: replyText, isFallback: false });
  } catch (error: any) {
    console.error("Assistant API error:", error);
    return res.json({
      response: `💡 **Sparky's Quick Tip:** Don't worry, every developer faces hiccups! Let's think through your question: "${req.body.prompt || ''}". In 2D games, check your events, conditions, and variable values in the Live Debugger!`,
      isFallback: true
    });
  }
});

// Sound Generator Presets helper endpoint (returns audio synthesis parameters)
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", app: "GameDev Starter Studio" });
});

// ==========================================
// 4. GITHUB OAUTH & INTEGRATION ENDPOINTS
// ==========================================

// Check if GitHub OAuth App credentials are configured
app.get("/api/github/oauth-config", (req, res) => {
  const isConfigured = Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);
  const appUrl = process.env.APP_URL || `${req.protocol}://${req.get("host")}`;
  const callbackUrl = `${appUrl.replace(/\/+$/, "")}/auth/callback`;
  
  res.json({
    configured: isConfigured,
    clientId: process.env.GITHUB_CLIENT_ID ? `${process.env.GITHUB_CLIENT_ID.substring(0, 4)}...` : null,
    callbackUrl
  });
});

// Generate GitHub OAuth Authorization URL for direct popup launch
app.get("/api/github/auth-url", (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const appUrl = process.env.APP_URL || `${req.protocol}://${req.get("host")}`;
  const redirectUri = `${appUrl.replace(/\/+$/, "")}/auth/callback`;

  if (!clientId) {
    return res.status(400).json({ 
      error: "GITHUB_CLIENT_ID is not configured in environment variables.",
      needsConfig: true,
      callbackUrl: redirectUri
    });
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "repo,read:user",
    state: Math.random().toString(36).substring(2, 15)
  });

  const authUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;
  return res.json({ url: authUrl, callbackUrl: redirectUri });
});

// Exchange OAuth code for token
app.post("/api/github/exchange-token", async (req, res) => {
  const { code } = req.body;
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!code) {
    return res.status(400).json({ error: "Missing authorization code." });
  }

  if (!clientId || !clientSecret) {
    return res.status(400).json({ error: "GitHub OAuth credentials are not configured on the server." });
  }

  try {
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: String(code)
      })
    });

    const tokenData = await tokenResponse.json();
    if (tokenData.error) {
      return res.status(400).json({ error: tokenData.error_description || tokenData.error });
    }

    return res.json({ 
      access_token: tokenData.access_token,
      scope: tokenData.scope,
      token_type: tokenData.token_type
    });
  } catch (err: any) {
    console.error("GitHub token exchange failed:", err);
    return res.status(500).json({ error: err.message || "Token exchange failed" });
  }
});

// OAuth Callback Handler (renders postMessage script to talk across popup window)
app.get(["/auth/callback", "/auth/callback/"], async (req, res) => {
  const { code, error, error_description } = req.query;

  if (error || !code) {
    const errMsg = (error_description as string) || (error as string) || "Authorization was cancelled or failed.";
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>GitHub Authentication Failed</title></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0d1117; color: #f85149; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center;">
          <div style="background: #161b22; border: 1px solid #30363d; padding: 24px; border-radius: 12px; max-width: 400px;">
            <h3 style="margin-top: 0;">Connection Failed</h3>
            <p style="color: #8b949e; font-size: 14px;">${escapeHtml(errMsg)}</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ 
                  type: 'OAUTH_AUTH_ERROR', 
                  provider: 'github', 
                  error: ${JSON.stringify(errMsg)} 
                }, '*');
                setTimeout(() => window.close(), 1500);
              }
            </script>
          </div>
        </body>
      </html>
    `);
  }

  // Attempt automatic server exchange if secret is present
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  let accessToken = "";

  if (clientId && clientSecret) {
    try {
      const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code: String(code)
        })
      });
      const tokenData = await tokenResponse.json();
      accessToken = tokenData.access_token || "";
    } catch (e) {
      console.warn("Server-side token exchange warning:", e);
    }
  }

  res.send(`
    <!DOCTYPE html>
    <html>
      <head><title>GitHub Authentication</title></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0d1117; color: #58a6ff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center;">
        <div style="background: #161b22; border: 1px solid #30363d; padding: 28px; border-radius: 14px; max-width: 420px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          <div style="font-size: 36px; margin-bottom: 12px;">✅</div>
          <h2 style="margin-top: 0; color: #3fb950; font-size: 20px;">GitHub Connected!</h2>
          <p style="color: #8b949e; font-size: 13px; line-height: 1.5;">
            Successfully authorized with GitHub.<br/>This window will close automatically...
          </p>
          <script>
            if (window.opener) {
              window.opener.postMessage({ 
                type: 'OAUTH_AUTH_SUCCESS',
                provider: 'github',
                token: ${JSON.stringify(accessToken)},
                code: ${JSON.stringify(String(code))}
              }, '*');
              setTimeout(() => {
                try { window.close(); } catch(e) {}
              }, 400);
            } else {
              window.location.href = '/';
            }
          </script>
        </div>
      </body>
    </html>
  `);
});

// Helper for escaping HTML inside server responses
function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

