import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  bigint,
  numeric,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ─── USERS ────────────────────────────────────────────────────────────────────

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: varchar('username', { length: 32 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash'),
  avatarUrl: text('avatar_url'),
  bio: text('bio'),
  role: varchar('role', { length: 30 }).notNull().default('user'),
  proStatus: varchar('pro_status', { length: 20 }).notNull().default('none'),
  proUntil: timestamp('pro_until', { withTimezone: true }),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  lastActiveAt: timestamp('last_active_at', { withTimezone: true }),
});

// ─── GUEST SESSIONS ───────────────────────────────────────────────────────────

export const guestSessions = pgTable('guest_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  guestToken: varchar('guest_token', { length: 255 }).notNull().unique(),
  entrySource: varchar('entry_source', { length: 100 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
  migratedToUserId: uuid('migrated_to_user_id').references(() => users.id, { onDelete: 'set null' }),
});

// ─── COLLECTIBLE ITEMS ────────────────────────────────────────────────────────

export const collectibleItems = pgTable('collectible_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  category: varchar('category', { length: 50 }).notNull().default('sports_card'),
  title: text('title').notNull(),
  playerName: varchar('player_name', { length: 120 }),
  brand: varchar('brand', { length: 120 }),
  franchise: varchar('franchise', { length: 120 }),
  year: integer('year'),
  releaseName: varchar('release_name', { length: 120 }),
  cardNumber: varchar('card_number', { length: 50 }),
  variant: varchar('variant', { length: 120 }),
  grade: varchar('grade', { length: 30 }),
  certNumber: varchar('cert_number', { length: 100 }),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─── ITEM ASSETS ──────────────────────────────────────────────────────────────

export const itemAssets = pgTable('item_assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  collectibleItemId: uuid('collectible_item_id').references(() => collectibleItems.id, { onDelete: 'set null' }),
  createdByUserId: uuid('created_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  imageUrl: text('image_url').notNull(),
  thumbUrl: text('thumb_url'),
  title: text('title').notNull(),
  source: varchar('source', { length: 30 }).notNull().default('upload'),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─── SPONSORS ─────────────────────────────────────────────────────────────────

export const sponsors = pgTable('sponsors', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 150 }).notNull(),
  contactEmail: varchar('contact_email', { length: 255 }),
  logoUrl: text('logo_url'),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─── BATTLES ──────────────────────────────────────────────────────────────────

export const battles = pgTable(
  'battles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    createdByUserId: uuid('created_by_user_id').references(() => users.id, { onDelete: 'set null' }),
    leftAssetId: uuid('left_asset_id').notNull().references(() => itemAssets.id, { onDelete: 'cascade' }),
    rightAssetId: uuid('right_asset_id').notNull().references(() => itemAssets.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    battleMode: varchar('battle_mode', { length: 20 }).notNull().default('debate'),
    ownershipClaimed: boolean('ownership_claimed').notNull().default(false),
    ownershipVerified: boolean('ownership_verified').notNull().default(false),
    verificationMethod: varchar('verification_method', { length: 30 }).notNull().default('none'),
    verificationBadges: jsonb('verification_badges').notNull().default([]),
    categories: jsonb('categories').notNull(),
    questionText: text('question_text'),
    durationSeconds: integer('duration_seconds').notNull(),
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
    status: varchar('status', { length: 20 }).notNull().default('live'),
    isSponsored: boolean('is_sponsored').notNull().default(false),
    sponsorId: uuid('sponsor_id'),
    sponsorCta: jsonb('sponsor_cta'),
    showValuePreVote: boolean('show_value_pre_vote').notNull().default(false),
    valueSource: varchar('value_source', { length: 30 }).notNull().default('hidden'),
    estimatedValueLow: bigint('estimated_value_low', { mode: 'number' }),
    estimatedValueHigh: bigint('estimated_value_high', { mode: 'number' }),
    valueLastUpdatedAt: timestamp('value_last_updated_at', { withTimezone: true }),
    totalVotesCached: integer('total_votes_cached').notNull().default(0),
    result: jsonb('result'),
    visibility: varchar('visibility', { length: 20 }).notNull().default('public'),
    tags: jsonb('tags').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    statusEndsAtIdx: index('idx_battles_status_ends_at').on(table.status, table.endsAt),
  })
);

// ─── BATTLE VOTES ─────────────────────────────────────────────────────────────

export const battleVotes = pgTable(
  'battle_votes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    battleId: uuid('battle_id').notNull().references(() => battles.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    guestSessionId: uuid('guest_session_id').references(() => guestSessions.id, { onDelete: 'cascade' }),
    category: varchar('category', { length: 50 }).notNull(),
    choice: varchar('choice', { length: 10 }).notNull(),
    weight: numeric('weight', { precision: 6, scale: 3 }).notNull().default('1.0'),
    trustScoreSnapshot: numeric('trust_score_snapshot', { precision: 6, scale: 3 }).notNull().default('1.0'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    battleIdIdx: index('idx_battle_votes_battle_id').on(table.battleId),
    userIdIdx: index('idx_battle_votes_user_id').on(table.userId),
  })
);

// ─── BATTLE REPORTS ───────────────────────────────────────────────────────────

export const battleReports = pgTable(
  'battle_reports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    reporterUserId: uuid('reporter_user_id').references(() => users.id, { onDelete: 'set null' }),
    battleId: uuid('battle_id').notNull().references(() => battles.id, { onDelete: 'cascade' }),
    reason: varchar('reason', { length: 100 }).notNull(),
    notes: text('notes'),
    status: varchar('status', { length: 20 }).notNull().default('open'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    statusIdx: index('idx_battle_reports_status').on(table.status),
  })
);

// ─── PULL POSTS ───────────────────────────────────────────────────────────────

export const pullPosts = pgTable('pull_posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  createdByUserId: uuid('created_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  itemAssetId: uuid('item_asset_id').notNull().references(() => itemAssets.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  pullType: varchar('pull_type', { length: 30 }).notNull().default('single_hit'),
  breakSessionId: uuid('break_session_id'),
  ownershipVerified: boolean('ownership_verified').notNull().default(false),
  verificationBadges: jsonb('verification_badges').notNull().default([]),
  isFeatured: boolean('is_featured').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─── DAILY PICKS ──────────────────────────────────────────────────────────────

export const dailyPicks = pgTable(
  'daily_picks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    leftAssetId: uuid('left_asset_id').notNull().references(() => itemAssets.id, { onDelete: 'cascade' }),
    rightAssetId: uuid('right_asset_id').notNull().references(() => itemAssets.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    questionText: text('question_text'),
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
    resolutionMethod: varchar('resolution_method', { length: 50 }).notNull().default('manual'),
    result: jsonb('result'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    endsAtIdx: index('idx_daily_picks_ends_at').on(table.endsAt),
  })
);

// ─── DAILY PICK ENTRIES ───────────────────────────────────────────────────────

export const dailyPickEntries = pgTable('daily_pick_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  dailyPickId: uuid('daily_pick_id').notNull().references(() => dailyPicks.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  guestSessionId: uuid('guest_session_id').references(() => guestSessions.id, { onDelete: 'cascade' }),
  choice: varchar('choice', { length: 10 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─── USER STATS ───────────────────────────────────────────────────────────────

export const userStats = pgTable('user_stats', {
  userId: uuid('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  votesCast: integer('votes_cast').notNull().default(0),
  battlesCreated: integer('battles_created').notNull().default(0),
  battlesWon: integer('battles_won').notNull().default(0),
  battlesLost: integer('battles_lost').notNull().default(0),
  currentStreak: integer('current_streak').notNull().default(0),
  bestStreak: integer('best_streak').notNull().default(0),
  dailyPickWins: integer('daily_pick_wins').notNull().default(0),
  dailyPickLosses: integer('daily_pick_losses').notNull().default(0),
  giveawayEntriesCurrentWeek: integer('giveaway_entries_current_week').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─── CARD PULSE SNAPSHOTS ─────────────────────────────────────────────────────

export const cardPulseSnapshots = pgTable('card_pulse_snapshots', {
  id: uuid('id').primaryKey().defaultRandom(),
  collectibleItemId: uuid('collectible_item_id').references(() => collectibleItems.id, { onDelete: 'cascade' }),
  itemAssetId: uuid('item_asset_id').references(() => itemAssets.id, { onDelete: 'cascade' }),
  pulseScore: numeric('pulse_score', { precision: 6, scale: 2 }).notNull(),
  sentimentLabel: varchar('sentiment_label', { length: 20 }).notNull(),
  inputs: jsonb('inputs').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─── CARD RECORDS ─────────────────────────────────────────────────────────────

export const cardRecords = pgTable('card_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  collectibleItemId: uuid('collectible_item_id').references(() => collectibleItems.id, { onDelete: 'cascade' }),
  wins: integer('wins').notNull().default(0),
  losses: integer('losses').notNull().default(0),
  ties: integer('ties').notNull().default(0),
  winRate: numeric('win_rate', { precision: 6, scale: 2 }).notNull().default('0'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─── SPONSOR CLICKS ───────────────────────────────────────────────────────────

export const sponsorClicks = pgTable('sponsor_clicks', {
  id: uuid('id').primaryKey().defaultRandom(),
  battleId: uuid('battle_id').references(() => battles.id, { onDelete: 'set null' }),
  sponsorId: uuid('sponsor_id').references(() => sponsors.id, { onDelete: 'set null' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  guestSessionId: uuid('guest_session_id').references(() => guestSessions.id, { onDelete: 'set null' }),
  destinationUrl: text('destination_url').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─── AFFILIATE LINKS ──────────────────────────────────────────────────────────

export const affiliateLinks = pgTable('affiliate_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  collectibleItemId: uuid('collectible_item_id').references(() => collectibleItems.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  destinationUrl: text('destination_url').notNull(),
  provider: varchar('provider', { length: 50 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─── WEEKLY DRAWINGS ──────────────────────────────────────────────────────────

export const weeklyDrawings = pgTable('weekly_drawings', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  rulesJson: jsonb('rules_json').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─── DRAWING PRIZES ───────────────────────────────────────────────────────────

export const drawingPrizes = pgTable('drawing_prizes', {
  id: uuid('id').primaryKey().defaultRandom(),
  drawingId: uuid('drawing_id').notNull().references(() => weeklyDrawings.id, { onDelete: 'cascade' }),
  prizeTitle: text('prize_title').notNull(),
  prizeDescription: text('prize_description'),
  prizeType: varchar('prize_type', { length: 30 }).notNull(),
  retailValueCents: integer('retail_value_cents'),
  sponsorId: uuid('sponsor_id').references(() => sponsors.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─── DRAWING ENTRIES ──────────────────────────────────────────────────────────

export const drawingEntries = pgTable('drawing_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  drawingId: uuid('drawing_id').notNull().references(() => weeklyDrawings.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  guestSessionId: uuid('guest_session_id').references(() => guestSessions.id, { onDelete: 'cascade' }),
  sourceType: varchar('source_type', { length: 50 }).notNull(),
  sourceId: uuid('source_id'),
  entryCount: integer('entry_count').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─── DRAWING WINNERS ──────────────────────────────────────────────────────────

export const drawingWinners = pgTable('drawing_winners', {
  id: uuid('id').primaryKey().defaultRandom(),
  drawingId: uuid('drawing_id').notNull().references(() => weeklyDrawings.id, { onDelete: 'cascade' }),
  drawingPrizeId: uuid('drawing_prize_id').notNull().references(() => drawingPrizes.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  selectedAt: timestamp('selected_at', { withTimezone: true }).notNull().defaultNow(),
  status: varchar('status', { length: 20 }).notNull().default('pending_confirmation'),
});

// ─── BREAKER PROFILES ─────────────────────────────────────────────────────────

export const breakerProfiles = pgTable('breaker_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  displayName: text('display_name').notNull(),
  bio: text('bio'),
  streamUrl: text('stream_url'),
  isVerified: boolean('is_verified').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─── BREAK SESSIONS ───────────────────────────────────────────────────────────

export const breakSessions = pgTable('break_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  breakerProfileId: uuid('breaker_profile_id').notNull().references(() => breakerProfiles.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  startsAt: timestamp('starts_at', { withTimezone: true }),
  endsAt: timestamp('ends_at', { withTimezone: true }),
  status: varchar('status', { length: 20 }).notNull().default('live'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    type: varchar('type', { length: 50 }).notNull(),
    title: text('title').notNull(),
    body: text('body'),
    referenceId: uuid('reference_id'),
    referenceType: varchar('reference_type', { length: 30 }),
    isRead: boolean('is_read').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('idx_notifications_user_id').on(table.userId),
    isReadIdx: index('idx_notifications_is_read').on(table.isRead),
  })
);

// ─── FOLLOWS ──────────────────────────────────────────────────────────────────

export const follows = pgTable('follows', {
  id: uuid('id').primaryKey().defaultRandom(),
  followerId: uuid('follower_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  followingId: uuid('following_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─── COMMENTS ─────────────────────────────────────────────────────────────────

export const comments = pgTable(
  'comments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    battleId: uuid('battle_id').notNull().references(() => battles.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    body: text('body').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    battleIdIdx: index('idx_comments_battle_id').on(table.battleId),
  })
);

// ─── PRICE SNAPSHOTS ──────────────────────────────────────────────────────────

export const priceSnapshots = pgTable('price_snapshots', {
  id: uuid('id').primaryKey().defaultRandom(),
  collectibleItemId: uuid('collectible_item_id').references(() => collectibleItems.id, { onDelete: 'cascade' }),
  itemAssetId: uuid('item_asset_id').references(() => itemAssets.id, { onDelete: 'cascade' }),
  grade: varchar('grade', { length: 30 }),
  priceCents: integer('price_cents').notNull(),
  source: varchar('source', { length: 50 }).notNull().default('manual'),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─── LEGACY TABLES (kept for backward compat with existing routes) ─────────────

/**
 * card_assets — legacy table mirrored by itemAssets.
 * Kept so existing routes compile without change.
 * In production both resolve to item_assets table.
 */
export const cardAssets = pgTable(
  'card_assets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    createdByUserId: uuid('created_by_user_id').references(() => users.id, { onDelete: 'set null' }),
    imageUrl: text('image_url').notNull(),
    thumbUrl: text('thumb_url'),
    title: text('title').notNull(),
    sport: varchar('sport', { length: 50 }),
    playerName: varchar('player_name', { length: 120 }),
    year: integer('year'),
    setName: varchar('set_name', { length: 120 }),
    variant: varchar('variant', { length: 120 }),
    grade: varchar('grade', { length: 30 }),
    certNumber: varchar('cert_number', { length: 100 }),
    source: varchar('source', { length: 30 }).notNull().default('upload'),
    metadata: jsonb('metadata').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    playerNameIdx: index('idx_card_assets_player_name').on(table.playerName),
    yearIdx: index('idx_card_assets_year').on(table.year),
    sourceIdx: index('idx_card_assets_source').on(table.source),
  })
);

/** votes — legacy alias for battle_votes (generic reporting table) */
export const votes = pgTable(
  'votes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    battleId: uuid('battle_id').notNull().references(() => battles.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    category: varchar('category', { length: 50 }).notNull(),
    choice: varchar('choice', { length: 10 }).notNull(),
    weight: numeric('weight', { precision: 6, scale: 3 }).notNull().default('1.0'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    uniqueVote: uniqueIndex('idx_votes_unique').on(table.battleId, table.userId, table.category),
    battleIdIdx: index('idx_votes_battle_id').on(table.battleId),
    userIdIdx: index('idx_votes_user_id').on(table.userId),
  })
);

/** reports — legacy generic reports table */
export const reports = pgTable(
  'reports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    reporterUserId: uuid('reporter_user_id').references(() => users.id, { onDelete: 'set null' }),
    targetType: varchar('target_type', { length: 20 }).notNull(),
    targetId: uuid('target_id').notNull(),
    reason: varchar('reason', { length: 100 }).notNull(),
    notes: text('notes'),
    status: varchar('status', { length: 20 }).notNull().default('open'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    statusIdx: index('idx_reports_status').on(table.status),
  })
);

/** battleComments — legacy comments table with text + likes fields */
export const battleComments = pgTable(
  'battle_comments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    battleId: uuid('battle_id').notNull().references(() => battles.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    text: text('text').notNull(),
    likes: integer('likes').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    battleIdIdx: index('idx_battle_comments_battle_id').on(table.battleId),
  })
);

/** userFollows — legacy follows table with composite PK */
export const userFollows = pgTable(
  'user_follows',
  {
    followerId: uuid('follower_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    followingId: uuid('following_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.followerId, t.followingId] }),
    followerIdx: index('idx_user_follows_follower').on(t.followerId),
    followingIdx: index('idx_user_follows_following').on(t.followingId),
  })
);

/** userCollections — legacy saved card collection */
export const userCollections = pgTable(
  'user_collections',
  {
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    assetId: uuid('asset_id').notNull().references(() => cardAssets.id, { onDelete: 'cascade' }),
    savedAt: timestamp('saved_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.assetId] }),
    userIdIdx: index('idx_user_collections_user_id').on(t.userId),
  })
);

/** userWatchlist — legacy battle watchlist */
export const userWatchlist = pgTable(
  'user_watchlist',
  {
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    battleId: uuid('battle_id').notNull().references(() => battles.id, { onDelete: 'cascade' }),
    savedAt: timestamp('saved_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.battleId] }),
    userIdIdx: index('idx_user_watchlist_user_id').on(t.userId),
  })
);

/** subscriptions — billing subscriptions */
export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  provider: varchar('provider', { length: 30 }).notNull().default('stripe'),
  providerCustomerId: text('provider_customer_id'),
  providerSubscriptionId: text('provider_subscription_id'),
  status: varchar('status', { length: 30 }).notNull(),
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/** tournaments — tournament bracket system */
export const tournaments = pgTable(
  'tournaments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 150 }).notNull(),
    sport: varchar('sport', { length: 50 }).notNull().default('mixed'),
    createdByUserId: uuid('created_by_user_id').references(() => users.id, { onDelete: 'set null' }),
    maxParticipants: integer('max_participants').notNull().default(8),
    status: varchar('status', { length: 20 }).notNull().default('open'),
    startDate: timestamp('start_date', { withTimezone: true }),
    endDate: timestamp('end_date', { withTimezone: true }),
    bracket: jsonb('bracket').notNull().default({}),
    metadata: jsonb('metadata').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    statusIdx: index('idx_tournaments_status').on(table.status),
  })
);

export const tournamentParticipants = pgTable(
  'tournament_participants',
  {
    tournamentId: uuid('tournament_id').notNull().references(() => tournaments.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
    seed: integer('seed'),
    eliminated: boolean('eliminated').notNull().default(false),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.tournamentId, t.userId] }),
    tournamentIdx: index('idx_tournament_participants_tournament').on(t.tournamentId),
  })
);

/** fantasyLeagues — fantasy league system */
export const fantasyLeagues = pgTable(
  'fantasy_leagues',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 150 }).notNull(),
    createdByUserId: uuid('created_by_user_id').references(() => users.id, { onDelete: 'set null' }),
    maxTeams: integer('max_teams').notNull().default(8),
    draftStatus: varchar('draft_status', { length: 20 }).notNull().default('open'),
    pickDeadline: timestamp('pick_deadline', { withTimezone: true }),
    settings: jsonb('settings').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    statusIdx: index('idx_fantasy_leagues_status').on(table.draftStatus),
  })
);

export const fantasyMembers = pgTable(
  'fantasy_members',
  {
    leagueId: uuid('league_id').notNull().references(() => fantasyLeagues.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    picks: jsonb('picks').notNull().default([]),
    score: integer('score').notNull().default(0),
    joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.leagueId, t.userId] }),
    leagueIdx: index('idx_fantasy_members_league').on(t.leagueId),
    userIdx: index('idx_fantasy_members_user').on(t.userId),
  })
);

// ─── TYPE EXPORTS ─────────────────────────────────────────────────────────────

export type UserRow = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type GuestSessionRow = typeof guestSessions.$inferSelect;
export type CollectibleItemRow = typeof collectibleItems.$inferSelect;
export type ItemAssetRow = typeof itemAssets.$inferSelect;
export type NewItemAsset = typeof itemAssets.$inferInsert;
// Legacy alias
export type CardAssetRow = typeof cardAssets.$inferSelect;
export type NewCardAsset = typeof cardAssets.$inferInsert;
export type BattleRow = typeof battles.$inferSelect;
export type NewBattle = typeof battles.$inferInsert;
export type BattleVoteRow = typeof battleVotes.$inferSelect;
export type NewBattleVote = typeof battleVotes.$inferInsert;
// Legacy alias
export type VoteRow = typeof votes.$inferSelect;
export type NewVote = typeof votes.$inferInsert;
export type UserStatsRow = typeof userStats.$inferSelect;
export type SponsorRow = typeof sponsors.$inferSelect;
export type DailyPickRow = typeof dailyPicks.$inferSelect;
export type DailyPickEntryRow = typeof dailyPickEntries.$inferSelect;
export type CommentRow = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;
// Legacy alias
export type BattleCommentRow = typeof battleComments.$inferSelect;
export type NewBattleComment = typeof battleComments.$inferInsert;
export type FollowRow = typeof follows.$inferSelect;
// Legacy alias
export type UserFollowRow = typeof userFollows.$inferSelect;
export type NotificationRow = typeof notifications.$inferSelect;
export type PriceSnapshotRow = typeof priceSnapshots.$inferSelect;
export type CardRecordRow = typeof cardRecords.$inferSelect;
export type BreakerProfileRow = typeof breakerProfiles.$inferSelect;
export type BreakSessionRow = typeof breakSessions.$inferSelect;
export type WeeklyDrawingRow = typeof weeklyDrawings.$inferSelect;
export type ReportRow = typeof reports.$inferSelect;
export type SubscriptionRow = typeof subscriptions.$inferSelect;
export type TournamentRow = typeof tournaments.$inferSelect;
export type NewTournament = typeof tournaments.$inferInsert;
export type FantasyLeagueRow = typeof fantasyLeagues.$inferSelect;
export type NewFantasyLeague = typeof fantasyLeagues.$inferInsert;
export type UserCollectionRow = typeof userCollections.$inferSelect;
export type UserWatchlistRow = typeof userWatchlist.$inferSelect;
