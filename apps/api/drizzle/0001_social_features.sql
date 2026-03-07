-- Migration: 0001_social_features
-- Adds: battle_comments, user_collections, user_watchlist, user_follows,
--        tournaments, tournament_participants, fantasy_leagues, fantasy_members

-- ─── Battle Comments ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS battle_comments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  battle_id UUID NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  likes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_comments_battle ON battle_comments(battle_id);

-- ─── User Collections ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_collections (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES card_assets(id) ON DELETE CASCADE,
  saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, asset_id)
);
CREATE INDEX IF NOT EXISTS idx_user_collections_user_id ON user_collections(user_id);

-- ─── User Watchlist ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_watchlist (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  battle_id UUID NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
  saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, battle_id)
);
CREATE INDEX IF NOT EXISTS idx_user_watchlist_user_id ON user_watchlist(user_id);

-- ─── User Follows ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_follows (
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows(following_id);

-- ─── Tournaments ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL,
  sport VARCHAR(50) NOT NULL DEFAULT 'mixed',
  created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  max_participants INTEGER NOT NULL DEFAULT 8,
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  bracket JSONB NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);

CREATE TABLE IF NOT EXISTS tournament_participants (
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  seed INTEGER,
  eliminated BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (tournament_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_tournament ON tournament_participants(tournament_id);

-- ─── Fantasy Leagues ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fantasy_leagues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL,
  created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  max_teams INTEGER NOT NULL DEFAULT 8,
  draft_status VARCHAR(20) NOT NULL DEFAULT 'open',
  pick_deadline TIMESTAMPTZ,
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fantasy_leagues_status ON fantasy_leagues(draft_status);

CREATE TABLE IF NOT EXISTS fantasy_members (
  league_id UUID NOT NULL REFERENCES fantasy_leagues(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  picks JSONB NOT NULL DEFAULT '[]',
  score INTEGER NOT NULL DEFAULT 0,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (league_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_fantasy_members_league ON fantasy_members(league_id);
CREATE INDEX IF NOT EXISTS idx_fantasy_members_user ON fantasy_members(user_id);
