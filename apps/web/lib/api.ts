import type { Battle, FeedResponse, AuthResponse, User, UserStats, LeaderboardResponse, DailyPick, CardAsset, VoteResponse } from '@card-battles/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

// ─── Token storage ────────────────────────────────────────────────────────────

const TOKEN_KEY = 'cb_access_token';
const REFRESH_KEY = 'cb_refresh_token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem(TOKEN_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

// ─── Core fetch ───────────────────────────────────────────────────────────────

interface RequestOptions extends RequestInit {
  auth?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { auth = false, ...init } = options;
  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string>),
  };

  if (!(init.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (auth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw Object.assign(new Error(err.error || 'Request failed'), { status: res.status, data: err });
  }

  return res.json();
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const auth = {
  register: (data: { username: string; email: string; password: string }) =>
    request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  login: (data: { email: string; password: string }) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),

  logout: () => request<{ message: string }>('/auth/logout', { method: 'POST', auth: true }),

  me: () => request<User>('/auth/me', { auth: true }),

  refresh: (refreshToken: string) =>
    request<{ accessToken: string; refreshToken: string }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),
};

// ─── Battles ──────────────────────────────────────────────────────────────────

export const battles = {
  feed: (params?: { cursor?: string; status?: string; sport?: string }) => {
    const qs = new URLSearchParams();
    if (params?.cursor) qs.set('cursor', params.cursor);
    if (params?.status) qs.set('status', params.status);
    if (params?.sport) qs.set('sport', params.sport);
    const q = qs.toString();
    return request<FeedResponse>(`/battles/feed${q ? `?${q}` : ''}`, { auth: true });
  },

  get: (id: string) => request<Battle>(`/battles/${id}`, { auth: true }),

  create: (data: {
    title: string;
    description?: string;
    leftAssetId: string;
    rightAssetId: string;
    categories: string[];
    durationSeconds: number;
    tags?: Record<string, string>;
  }) => request<Battle>('/battles', { method: 'POST', body: JSON.stringify(data), auth: true }),

  vote: (battleId: string, category: string, choice: 'left' | 'right') =>
    request<VoteResponse>(`/battles/${battleId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ category, choice }),
      auth: true,
    }),

  results: (battleId: string) => request<unknown>(`/battles/${battleId}/results`),

  report: (battleId: string, reason: string, notes?: string) =>
    request<{ message: string }>(`/battles/${battleId}/report`, {
      method: 'POST',
      body: JSON.stringify({ reason, notes }),
      auth: true,
    }),
};

// ─── Assets ───────────────────────────────────────────────────────────────────

export const assets = {
  upload: async (file: File, meta: { title: string; sport?: string; playerName?: string; year?: number; setName?: string }) => {
    const form = new FormData();
    form.append('image', file);
    Object.entries(meta).forEach(([k, v]) => v !== undefined && form.append(k, String(v)));
    return request<CardAsset>('/assets/upload', { method: 'POST', body: form, auth: true });
  },
};

// ─── Users ────────────────────────────────────────────────────────────────────

export const users = {
  profile: (username: string) => request<User>(`/users/${username}`),
  stats: (username: string) => request<UserStats>(`/users/${username}/stats`),
  battles: (username: string) => request<{ items: unknown[]; total: number }>(`/users/${username}/battles`),
  updateMe: (data: { bio?: string }) =>
    request<User>('/auth/me', { method: 'PATCH', body: JSON.stringify(data), auth: true }),
  updateProfile: (data: { bio?: string; favoritePlayer?: string; favoriteSet?: string; location?: string; twitter?: string; instagram?: string }) =>
    request<User>('/auth/me/profile', { method: 'PATCH', body: JSON.stringify(data), auth: true }),
  publicProfile: (username: string) => request<Record<string, unknown>>(`/users/${username}/profile`),
  followStatus: (username: string) =>
    request<{ isFollowing: boolean; followerCount: number; followingCount: number }>(`/users/${username}/follow-status`, { auth: true }),
  follow: (username: string) =>
    request<{ following: boolean; targetId: string }>(`/users/${username}/follow`, { method: 'POST', auth: true }),
  unfollow: (username: string) =>
    request<{ following: boolean }>(`/users/${username}/unfollow`, { method: 'POST', auth: true }),
};

// ─── Fantasy ──────────────────────────────────────────────────────────────────

export interface League {
  id: string;
  name: string;
  createdBy: string;
  members: string[];
  draftStatus: 'open' | 'drafting' | 'active';
  picks: Record<string, string[]>;
  createdAt: string;
}

export interface FantasyLeaguesResponse {
  myLeagues: League[];
  openLeagues: League[];
}

export const fantasy = {
  leagues: () => request<FantasyLeaguesResponse>('/fantasy/leagues', { auth: true }),
  create: (name: string) =>
    request<League>('/fantasy/leagues', { method: 'POST', body: JSON.stringify({ name }), auth: true }),
  join: (id: string) =>
    request<League>(`/fantasy/leagues/${id}/join`, { method: 'POST', auth: true }),
  pick: (id: string, assetId: string) =>
    request<{ league: League; picks: string[] }>(`/fantasy/leagues/${id}/pick`, {
      method: 'POST',
      body: JSON.stringify({ assetId }),
      auth: true,
    }),
};

// ─── Leaderboards ─────────────────────────────────────────────────────────────

export const leaderboards = {
  get: (type: 'creators' | 'voters' = 'creators', period: 'day' | 'week' | 'month' | 'all' = 'week') =>
    request<LeaderboardResponse>(`/leaderboards?type=${type}&period=${period}`),
};

// ─── Trending ─────────────────────────────────────────────────────────────────

export const trending = {
  get: () => request<{ items: Battle[] }>('/battles/trending', { auth: true }),
};

// ─── Comments ─────────────────────────────────────────────────────────────────

export interface CommentType {
  id: string;
  battleId: string;
  userId: string;
  username: string;
  text: string;
  createdAt: string;
  likes: number;
}

export const comments = {
  list: (battleId: string) =>
    request<{ comments: CommentType[]; total: number }>(`/battles/${battleId}/comments`),
  post: (battleId: string, text: string) =>
    request<CommentType>(`/battles/${battleId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ text }),
      auth: true,
    }),
  like: (battleId: string, commentId: string) =>
    request<CommentType>(`/battles/${battleId}/comments/${commentId}/like`, {
      method: 'POST',
      auth: true,
    }),
};

// ─── Daily Picks ──────────────────────────────────────────────────────────────

export const dailyPicks = {
  current: () => request<DailyPick[]>('/daily-picks/current', { auth: true }),
  enter: (pickId: string, choice: 'left' | 'right') =>
    request<{ message: string; choice: string }>(`/daily-picks/${pickId}/enter`, {
      method: 'POST',
      body: JSON.stringify({ choice }),
      auth: true,
    }),
  result: (pickId: string) => request<unknown>(`/daily-picks/${pickId}/result`),
};
