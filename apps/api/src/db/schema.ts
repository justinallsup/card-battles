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
  check,
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
