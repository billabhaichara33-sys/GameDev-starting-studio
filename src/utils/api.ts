import { User, UserProgress, AuthResponse, CommunityGame, CommunityComment, GameGenre, GameProject } from '../types';

const TOKEN_KEY = 'gamedev_auth_token_v1';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (e) {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch (e) {
    console.error('Failed to set token in localStorage', e);
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Request failed');
  }

  return data;
}

// Auth API
export async function apiSignup(payload: {
  username: string;
  email: string;
  password: string;
  displayName?: string;
  avatarUrl?: string;
}): Promise<AuthResponse> {
  const res = await request<AuthResponse>('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  setStoredToken(res.token);
  return res;
}

export async function apiLogin(payload: {
  login: string;
  password: string;
}): Promise<AuthResponse> {
  const res = await request<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  setStoredToken(res.token);
  return res;
}

export async function apiDemoLogin(): Promise<AuthResponse> {
  const res = await request<AuthResponse>('/api/auth/demo', {
    method: 'POST'
  });
  setStoredToken(res.token);
  return res;
}

export async function apiLogout(): Promise<void> {
  try {
    await request('/api/auth/logout', { method: 'POST' });
  } catch (e) {
    console.warn('Logout API error:', e);
  } finally {
    setStoredToken(null);
  }
}

export async function apiGetMe(): Promise<User | null> {
  const token = getStoredToken();
  if (!token) return null;
  try {
    const res = await request<{ user: User }>('/api/auth/me');
    return res.user;
  } catch (e) {
    // If token expired or invalid, clear it
    setStoredToken(null);
    return null;
  }
}

export async function apiSyncProgress(progress: UserProgress): Promise<UserProgress> {
  const res = await request<{ success: boolean; progress: UserProgress }>('/api/auth/progress', {
    method: 'PUT',
    body: JSON.stringify({ progress })
  });
  return res.progress;
}

export async function apiUpdateProfile(payload: {
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
}): Promise<User> {
  const res = await request<{ user: User }>('/api/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
  return res.user;
}

// Community Showcase API
export async function apiGetCommunityGames(options?: {
  genre?: string;
  search?: string;
  sort?: 'popular' | 'newest' | 'played';
  authorId?: string;
}): Promise<CommunityGame[]> {
  const params = new URLSearchParams();
  if (options?.genre && options.genre !== 'all') params.append('genre', options.genre);
  if (options?.search) params.append('search', options.search);
  if (options?.sort) params.append('sort', options.sort);
  if (options?.authorId) params.append('authorId', options.authorId);

  const queryStr = params.toString() ? `?${params.toString()}` : '';
  const res = await request<{ games: CommunityGame[] }>(`/api/community/games${queryStr}`);
  return res.games;
}

export async function apiGetCommunityGame(gameId: string): Promise<{ game: CommunityGame; comments: CommunityComment[] }> {
  return await request<{ game: CommunityGame; comments: CommunityComment[] }>(`/api/community/games/${gameId}`);
}

export async function apiPublishGame(payload: {
  title: string;
  description: string;
  genre: GameGenre;
  tags: string[];
  thumbnailColor?: string;
  projectData: GameProject;
}): Promise<{ game: CommunityGame; message: string }> {
  return await request<{ game: CommunityGame; message: string }>('/api/community/games', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function apiToggleLikeGame(gameId: string): Promise<{ liked: boolean; likesCount: number }> {
  return await request<{ liked: boolean; likesCount: number }>(`/api/community/games/${gameId}/like`, {
    method: 'POST'
  });
}

export async function apiRecordPlayGame(gameId: string): Promise<void> {
  try {
    await request(`/api/community/games/${gameId}/play`, { method: 'POST' });
  } catch (e) {
    // Non-blocking
  }
}

export async function apiGetGameComments(gameId: string): Promise<CommunityComment[]> {
  const res = await request<{ comments: CommunityComment[] }>(`/api/community/games/${gameId}/comments`);
  return res.comments;
}

export async function apiAddComment(gameId: string, payload: {
  content: string;
  rating?: number;
}): Promise<CommunityComment> {
  const res = await request<{ comment: CommunityComment }>(`/api/community/games/${gameId}/comments`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  return res.comment;
}

export async function apiDeleteComment(commentId: string): Promise<void> {
  await request(`/api/community/comments/${commentId}`, {
    method: 'DELETE'
  });
}
