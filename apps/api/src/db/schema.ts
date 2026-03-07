import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  integer,
  numeric,
  jsonb,
  uniqueIndex,
  index,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ─── Users ────────────────────────────────────────────────────────────────────

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: varchar('username', { length: 32 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash'),
  avatarUrl: text('avatar_url'),
  bio: text('bio'),
  isAdmin: boolean('is_admin').notNull().default(false),
  isMod: boolean('is_mod').notNull().default(false),
  proStatus: varchar('pro_status', { length: 20 }).notNull().default('none'),
  proUntil: timestamp('pro_until', { withTimezone: true }),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  lastActiveAt: timestamp('last_active_at', { withTimezone: true }),
});

// ─── Card Assets ──────────────────────────────────────────────────────────────

export const cardAssets = pgTable(
  'card_assets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    createdByUserId: uuid('created_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    imageUrl: text('image_url').notNull(),
    thumbUrl: text('thumb_url'),
    title: text('title').notNull(),
    sport: varchar('sport', { length: 50 }),
    playerName: varchar('player_name', { length: 120 }),
    year: integer('year'),
    setName: varchar('set_name', { length: 120 }),
    variant: varchar('variant', { length: 120 }),
    source: varchar('source', { length: 30 }).notNull().default('upload'),
    metadata: jsonb('metadata').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    playerNameIdx: index('idx_card_assets_player_name').on(table.playerName),
  })
);

// ─── Sponsors ─────────────────────────────────────────────────────────────────

export const sponsors = pgTable('sponsors', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 150 }).notNull(),
  contactEmail: varchar('contact_email', { length: 255 }),
  logoUrl: text('logo_url'),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─── Battles ──────────────────────────────────────────────────────────────────

export const battles = pgTable(
  'battles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    createdByUserId: uuid('created_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    leftAssetId: uuid('left_asset_id')
      .notNull()
      .references(() => cardAssets.id, { onDelete: 'cascade' }),
    rightAssetId: uuid('right_asset_id')
      .notNull()
      .references(() => cardAssets.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    categories: jsonb('categories').notNull(),
    durationSeconds: integer('duration_seconds').notNull(),
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
    status: varchar('status', { length: 20 }).notNull().default('live'),
    isSponsored: boolean('is_sponsored').notNull().default(false),
    sponsorId: uuid('sponsor_id').references(() => sponsors.id),
    sponsorCta: jsonb('sponsor_cta'),
    tags: jsonb('tags').notNull().default({}),
    totalVotesCached: integer('total_votes_cached').notNull().default(0),
    result: jsonb('result'),
    visibility: varchar('visibility', { length: 20 }).notNull().default('public'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    statusEndsAtIdx: index('idx_battles_status_ends_at').on(table.status, table.endsAt),
  })
);

// ─── Votes ────────────────────────────────────────────────────────────────────

export const votes = pgTable(
  'votes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    battleId: uuid('battle_id')
      .notNull()
      .references(() => battles.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
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

// ─── User Stats ───────────────────────────────────────────────────────────────

export const userStats = pgTable('user_stats', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  votesCast: integer('votes_cast').notNull().default(0),
  battlesCreated: integer('battles_created').notNull().default(0),
  battlesWon: integer('battles_won').notNull().default(0),
  battlesLost: integer('battles_lost').notNull().default(0),
  currentStreak: integer('current_streak').notNull().default(0),
  bestStreak: integer('best_streak').notNull().default(0),
  dailyPickWins: integer('daily_pick_wins').notNull().default(0),
  dailyPickLosses: integer('daily_pick_losses').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─── Reports ──────────────────────────────────────────────────────────────────

export const reports = pgTable(
  'reports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    reporterUserId: uuid('reporter_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
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

// ─── Subscriptions ────────────────────────────────────────────────────────────

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  provider: varchar('provider', { length: 30 }).notNull().default('stripe'),
  providerCustomerId: text('provider_customer_id'),
  providerSubscriptionId: text('provider_subscription_id'),
  status: varchar('status', { length: 30 }).notNull(),
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─── Sponsor Clicks ───────────────────────────────────────────────────────────

export const sponsorClicks = pgTable('sponsor_clicks', {
  id: uuid('id').primaryKey().defaultRandom(),
  battleId: uuid('battle_id').references(() => battles.id, { onDelete: 'set null' }),
  sponsorId: uuid('sponsor_id').references(() => sponsors.id, { onDelete: 'set null' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  destinationUrl: text('destination_url').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─── Daily Picks ──────────────────────────────────────────────────────────────

export const dailyPicks = pgTable(
  'daily_picks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    leftAssetId: uuid('left_asset_id')
      .notNull()
      .references(() => cardAssets.id, { onDelete: 'cascade' }),
    rightAssetId: uuid('right_asset_id')
      .notNull()
      .references(() => cardAssets.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
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

// ─── Daily Pick Entries ───────────────────────────────────────────────────────

export const dailyPickEntries = pgTable(
  'daily_pick_entries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    dailyPickId: uuid('daily_pick_id')
      .notNull()
      .references(() => dailyPicks.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    choice: varchar('choice', { length: 10 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    uniqueEntry: uniqueIndex('idx_daily_pick_entries_unique').on(table.dailyPickId, table.userId),
  })
);

// ─── Battle Comments ──────────────────────────────────────────────────────────

export const battleComments = pgTable(
  'battle_comments',
  {
    id: text('id').primaryKey().default(sql`gen_random_uuid()::text`),
    battleId: uuid('battle_id')
      .notNull()
      .references(() => battles.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    text: text('text').notNull(),
    likes: integer('likes').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    battleIdIdx: index('idx_comments_battle').on(table.battleId),
  })
);

// ─── User Collections ─────────────────────────────────────────────────────────

export const userCollections = pgTable(
  'user_collections',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    assetId: uuid('asset_id')
      .notNull()
      .references(() => cardAssets.id, { onDelete: 'cascade' }),
    savedAt: timestamp('saved_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.assetId] }),
    userIdIdx: index('idx_user_collections_user_id').on(t.userId),
  })
);

// ─── User Watchlist ───────────────────────────────────────────────────────────

export const userWatchlist = pgTable(
  'user_watchlist',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    battleId: uuid('battle_id')
      .notNull()
      .references(() => battles.id, { onDelete: 'cascade' }),
    savedAt: timestamp('saved_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.battleId] }),
    userIdIdx: index('idx_user_watchlist_user_id').on(t.userId),
  })
);

// ─── User Follows ─────────────────────────────────────────────────────────────

export const userFollows = pgTable(
  'user_follows',
  {
    followerId: uuid('follower_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    followingId: uuid('following_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.followerId, t.followingId] }),
    followerIdx: index('idx_user_follows_follower').on(t.followerId),
    followingIdx: index('idx_user_follows_following').on(t.followingId),
  })
);

// ─── Tournaments ──────────────────────────────────────────────────────────────

export const tournaments = pgTable(
  'tournaments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 150 }).notNull(),
    sport: varchar('sport', { length: 50 }).notNull().default('mixed'),
    createdByUserId: uuid('created_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
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
    tournamentId: uuid('tournament_id')
      .notNull()
      .references(() => tournaments.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
    seed: integer('seed'),
    eliminated: boolean('eliminated').notNull().default(false),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.tournamentId, t.userId] }),
    tournamentIdx: index('idx_tournament_participants_tournament').on(t.tournamentId),
  })
);

// ─── Fantasy Leagues ──────────────────────────────────────────────────────────

export const fantasyLeagues = pgTable(
  'fantasy_leagues',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 150 }).notNull(),
    createdByUserId: uuid('created_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
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
    leagueId: uuid('league_id')
      .notNull()
      .references(() => fantasyLeagues.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
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

// ─── Type exports ─────────────────────────────────────────────────────────────

export type UserRow = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type CardAssetRow = typeof cardAssets.$inferSelect;
export type NewCardAsset = typeof cardAssets.$inferInsert;
export type BattleRow = typeof battles.$inferSelect;
export type NewBattle = typeof battles.$inferInsert;
export type VoteRow = typeof votes.$inferSelect;
export type NewVote = typeof votes.$inferInsert;
export type UserStatsRow = typeof userStats.$inferSelect;
export type ReportRow = typeof reports.$inferSelect;
export type SponsorRow = typeof sponsors.$inferSelect;
export type DailyPickRow = typeof dailyPicks.$inferSelect;
export type DailyPickEntryRow = typeof dailyPickEntries.$inferSelect;
export type BattleCommentRow = typeof battleComments.$inferSelect;
export type NewBattleComment = typeof battleComments.$inferInsert;
export type UserCollectionRow = typeof userCollections.$inferSelect;
export type UserWatchlistRow = typeof userWatchlist.$inferSelect;
export type UserFollowRow = typeof userFollows.$inferSelect;
export type TournamentRow = typeof tournaments.$inferSelect;
export type NewTournament = typeof tournaments.$inferInsert;
export type FantasyLeagueRow = typeof fantasyLeagues.$inferSelect;
export type NewFantasyLeague = typeof fantasyLeagues.$inferInsert;
