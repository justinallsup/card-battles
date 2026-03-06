// ─── Enums ────────────────────────────────────────────────────────────────────

export type BattleStatus = 'live' | 'ended' | 'cancelled';
export type VoteChoice = 'left' | 'right';
export type ProStatus = 'none' | 'monthly' | 'annual';
export type UserStatus = 'active' | 'suspended' | 'banned';
export type ReportStatus = 'open' | 'resolved' | 'dismissed';
export type BattleVisibility = 'public' | 'unlisted';
export type AssetSource = 'upload' | 'scan' | 'manual';
export type LeaderboardType = 'creators' | 'voters';
export type LeaderboardPeriod = 'day' | 'week' | 'month' | 'all';

// ─── Core Models ──────────────────────────────────────────────────────────────

export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  bio: string | null;
  isAdmin: boolean;
  isMod: boolean;
  proStatus: ProStatus;
  proUntil: string | null;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  lastActiveAt: string | null;
}

export interface CardAsset {
  id: string;
  createdByUserId: string | null;
  imageUrl: string;
  thumbUrl: string | null;
  title: string;
  sport: string | null;
  playerName: string | null;
  year: number | null;
  setName: string | null;
  variant: string | null;
  source: AssetSource;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface BattleSide {
  assetId: string;
  title: string;
  imageUrl: string;
  thumbUrl: string | null;
  playerName: string | null;
}

export interface BattleCategoryResult {
  leftWeightedVotes: number;
  rightWeightedVotes: number;
  leftPercent: number;
  rightPercent: number;
  winner: VoteChoice | 'draw';
}

export interface BattleResult {
  byCategory: Record<string, BattleCategoryResult>;
  overall: {
    winner: VoteChoice | 'draw';
    method: string;
  };
  totalWeightedVotes: number;
}

export interface Battle {
  id: string;
  createdByUserId: string | null;
  createdByUsername: string | null;
  left: BattleSide;
  right: BattleSide;
  title: string;
  description: string | null;
  categories: string[];
  durationSeconds: number;
  startsAt: string;
  endsAt: string;
  status: BattleStatus;
  isSponsored: boolean;
  sponsorId: string | null;
  sponsorCta: SponsorCta | null;
  tags: Record<string, string>;
  totalVotesCached: number;
  result: BattleResult | null;
  visibility: BattleVisibility;
  createdAt: string;
  updatedAt: string;
  // Client-side: user's votes on this battle (keyed by category)
  myVotes?: Record<string, VoteChoice>;
}

export interface Vote {
  id: string;
  battleId: string;
  userId: string;
  category: string;
  choice: VoteChoice;
  weight: number;
  createdAt: string;
}

export interface UserStats {
  userId: string;
  votesCast: number;
  battlesCreated: number;
  battlesWon: number;
  battlesLost: number;
  currentStreak: number;
  bestStreak: number;
  dailyPickWins: number;
  dailyPickLosses: number;
  updatedAt: string;
}

export interface Sponsor {
  id: string;
  name: string;
  contactEmail: string | null;
  logoUrl: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface SponsorCta {
  label: string;
  url: string;
  trackClicks: boolean;
}

export interface Report {
  id: string;
  reporterUserId: string | null;
  targetType: 'battle' | 'user' | 'asset';
  targetId: string;
  reason: string;
  notes: string | null;
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
  provider: string;
  providerCustomerId: string | null;
  providerSubscriptionId: string | null;
  status: string;
  currentPeriodEnd: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DailyPick {
  id: string;
  left: BattleSide;
  right: BattleSide;
  title: string;
  startsAt: string;
  endsAt: string;
  resolutionMethod: string;
  result: { winner: VoteChoice | 'draw' } | null;
  createdAt: string;
  myEntry?: VoteChoice | null;
}

// ─── API Request Types ────────────────────────────────────────────────────────

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreateBattleRequest {
  title: string;
  description?: string;
  leftAssetId: string;
  rightAssetId: string;
  categories: string[];
  durationSeconds: number;
  tags?: Record<string, string>;
}

export interface VoteRequest {
  category: string;
  choice: VoteChoice;
}

export interface ReportRequest {
  reason: string;
  notes?: string;
}

// ─── API Response Types ───────────────────────────────────────────────────────

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface VoteResponse {
  battleId: string;
  category: string;
  userChoice: VoteChoice;
  leftPercent: number;
  rightPercent: number;
  totalVotesInCategory: number;
}

export interface FeedResponse {
  items: Battle[];
  nextCursor: string | null;
  total: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatarUrl: string | null;
  score: number;
  battlesWon: number;
  votesCast: number;
}

export interface LeaderboardResponse {
  type: LeaderboardType;
  period: LeaderboardPeriod;
  items: LeaderboardEntry[];
}

export interface ApiError {
  error: string;
  code?: string;
  details?: unknown;
}
