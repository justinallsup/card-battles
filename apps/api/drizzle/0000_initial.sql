-- Card Battles — Initial Schema Migration
-- Generated from Drizzle schema

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users
CREATE TABLE IF NOT EXISTS "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "username" varchar(32) NOT NULL UNIQUE,
  "email" varchar(255) NOT NULL UNIQUE,
  "password_hash" text,
  "avatar_url" text,
  "bio" text,
  "is_admin" boolean NOT NULL DEFAULT false,
  "is_mod" boolean NOT NULL DEFAULT false,
  "pro_status" varchar(20) NOT NULL DEFAULT 'none',
  "pro_until" timestamptz,
  "status" varchar(20) NOT NULL DEFAULT 'active',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "last_active_at" timestamptz
);

-- Sponsors
CREATE TABLE IF NOT EXISTS "sponsors" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar(150) NOT NULL,
  "contact_email" varchar(255),
  "logo_url" text,
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

-- Card Assets
CREATE TABLE IF NOT EXISTS "card_assets" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "created_by_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "image_url" text NOT NULL,
  "thumb_url" text,
  "title" text NOT NULL,
  "sport" varchar(50),
  "player_name" varchar(120),
  "year" integer,
  "set_name" varchar(120),
  "variant" varchar(120),
  "source" varchar(30) NOT NULL DEFAULT 'upload',
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

-- Battles
CREATE TABLE IF NOT EXISTS "battles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "created_by_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "left_asset_id" uuid NOT NULL REFERENCES "card_assets"("id") ON DELETE CASCADE,
  "right_asset_id" uuid NOT NULL REFERENCES "card_assets"("id") ON DELETE CASCADE,
  "title" text NOT NULL,
  "description" text,
  "categories" jsonb NOT NULL,
  "duration_seconds" integer NOT NULL,
  "starts_at" timestamptz NOT NULL,
  "ends_at" timestamptz NOT NULL,
  "status" varchar(20) NOT NULL DEFAULT 'live',
  "is_sponsored" boolean NOT NULL DEFAULT false,
  "sponsor_id" uuid REFERENCES "sponsors"("id"),
  "sponsor_cta" jsonb,
  "tags" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "total_votes_cached" integer NOT NULL DEFAULT 0,
  "result" jsonb,
  "visibility" varchar(20) NOT NULL DEFAULT 'public',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

-- Votes
CREATE TABLE IF NOT EXISTS "votes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "battle_id" uuid NOT NULL REFERENCES "battles"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "category" varchar(50) NOT NULL,
  "choice" varchar(10) NOT NULL CHECK ("choice" IN ('left', 'right')),
  "weight" numeric(6,3) NOT NULL DEFAULT 1.0,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  UNIQUE ("battle_id", "user_id", "category")
);

-- User Stats
CREATE TABLE IF NOT EXISTS "user_stats" (
  "user_id" uuid PRIMARY KEY REFERENCES "users"("id") ON DELETE CASCADE,
  "votes_cast" integer NOT NULL DEFAULT 0,
  "battles_created" integer NOT NULL DEFAULT 0,
  "battles_won" integer NOT NULL DEFAULT 0,
  "battles_lost" integer NOT NULL DEFAULT 0,
  "current_streak" integer NOT NULL DEFAULT 0,
  "best_streak" integer NOT NULL DEFAULT 0,
  "daily_pick_wins" integer NOT NULL DEFAULT 0,
  "daily_pick_losses" integer NOT NULL DEFAULT 0,
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

-- Reports
CREATE TABLE IF NOT EXISTS "reports" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "reporter_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "target_type" varchar(20) NOT NULL,
  "target_id" uuid NOT NULL,
  "reason" varchar(100) NOT NULL,
  "notes" text,
  "status" varchar(20) NOT NULL DEFAULT 'open',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

-- Subscriptions
CREATE TABLE IF NOT EXISTS "subscriptions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "provider" varchar(30) NOT NULL DEFAULT 'stripe',
  "provider_customer_id" text,
  "provider_subscription_id" text,
  "status" varchar(30) NOT NULL,
  "current_period_end" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

-- Sponsor Clicks
CREATE TABLE IF NOT EXISTS "sponsor_clicks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "battle_id" uuid REFERENCES "battles"("id") ON DELETE SET NULL,
  "sponsor_id" uuid REFERENCES "sponsors"("id") ON DELETE SET NULL,
  "user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "destination_url" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

-- Daily Picks
CREATE TABLE IF NOT EXISTS "daily_picks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "left_asset_id" uuid NOT NULL REFERENCES "card_assets"("id") ON DELETE CASCADE,
  "right_asset_id" uuid NOT NULL REFERENCES "card_assets"("id") ON DELETE CASCADE,
  "title" text NOT NULL,
  "starts_at" timestamptz NOT NULL,
  "ends_at" timestamptz NOT NULL,
  "resolution_method" varchar(50) NOT NULL DEFAULT 'manual',
  "result" jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

-- Daily Pick Entries
CREATE TABLE IF NOT EXISTS "daily_pick_entries" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "daily_pick_id" uuid NOT NULL REFERENCES "daily_picks"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "choice" varchar(10) NOT NULL CHECK ("choice" IN ('left', 'right')),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  UNIQUE ("daily_pick_id", "user_id")
);

-- Indexes
CREATE INDEX IF NOT EXISTS "idx_battles_status_ends_at" ON "battles"("status", "ends_at");
CREATE INDEX IF NOT EXISTS "idx_votes_battle_id" ON "votes"("battle_id");
CREATE INDEX IF NOT EXISTS "idx_votes_user_id" ON "votes"("user_id");
CREATE INDEX IF NOT EXISTS "idx_card_assets_player_name" ON "card_assets"("player_name");
CREATE INDEX IF NOT EXISTS "idx_reports_status" ON "reports"("status");
CREATE INDEX IF NOT EXISTS "idx_daily_picks_ends_at" ON "daily_picks"("ends_at");
