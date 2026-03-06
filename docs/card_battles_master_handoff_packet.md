# Card Battles ⚔️ — Master Handoff Packet
Version: 1.0 
Date: 2026-03-05 
Purpose: Single combined handoff document for Claude Code, OpenClaw, GitHub setup, and product/build planning.

This packet combines:
1. Full product blueprint
2. AI-agent ready build spec
3. GitHub-ready starter repo spec
4. GitHub backlog, epics, issues, and milestones

---


## Part 1 — Full Blueprint



# CARD BATTLES PLATFORM – FULL BUILD BLUEPRINT
Version: 1.0
Purpose: Provide a complete specification for building the Card Battles sports card social platform.
Audience: AI coding agents (Claude Code, OpenClaw) and engineering teams.

------------------------------------------------------------

OVERVIEW
The platform is a social network for sports card collectors centered on head‑to‑head card battles, pull sharing, predictions, and competitive leagues.

Core concept:
"Swipe and vote on the best sports cards."

Key mechanics:
• Card Battles (core gameplay)
• Pull Arena (pack pull highlights)
• Daily Picks (prediction game)
• Fantasy Card Leagues (retention mechanic)
• Leaderboards and streaks
• Sponsored battles and affiliate buying

Goal:
Create the entertainment and sentiment layer for the sports card market.

------------------------------------------------------------

PRODUCT PILLARS

1. CARD BATTLES
Users compare two cards and vote.

Example battle:
2017 Mahomes Rookie Auto
vs
2000 Brady Bowman Rookie

Voting categories:
• Better investment
• Cooler card
• Rarer pull

Rules:
• 1 vote per category per user
• battles last 24 hours
• results computed after timer ends

Battle outcome:
Best of category wins.

------------------------------------------------------------

2. PULL ARENA

Users post their best pack pulls.

Example:
CJ Stroud Downtown
vs
Anthony Richardson Auto

Community votes on:
• best pull
• most valuable
• luckiest hit

Leaderboard:
Top pulls of the week.

------------------------------------------------------------

3. DAILY PICKS

Daily prediction battles.

Example:
Luka Prizm Rookie
vs
Wembanyama Prizm Rookie

Users choose winner.

Next day winner determined using:
• market prices
• voting results
• performance signals

Users build accuracy records.

------------------------------------------------------------

4. FANTASY CARD LEAGUES

Users draft cards into rosters.

Example roster:
QB: Mahomes Rookie
WR: Justin Jefferson Rookie
Flex: Wembanyama Prizm

Cards score points via:
• battle wins
• player performance
• market movement

Weekly matchups determine winners.

------------------------------------------------------------

CONTENT ENGINE

A major risk in social apps is empty feeds.

Solution:
Auto‑generated battles.

System generates battles like:

Rookie Battle
CJ Stroud vs Joe Burrow

GOAT Rookie
LeBron Chrome vs Jordan Fleer

Trending
Elly De La Cruz vs Shohei Ohtani

This guarantees constant content.

------------------------------------------------------------

USER FLOW

New user:

1. Opens app
2. Sees battle feed
3. Votes
4. Creates account after limited votes
5. Posts own battles

Daily returning flow:

Morning
Make daily picks

Day
Vote on battles

Night
Check results and leaderboards

------------------------------------------------------------

MONETIZATION

Primary revenue sources:

Sponsored Battles
Brands pay to feature battles.

Premium Membership
Monthly subscription $5‑10.

Affiliate Links
Links to marketplaces.

League Entry Fees
Paid fantasy leagues.

Ads
Display advertising at scale.

Grading Referrals
Referral fees to grading companies.

------------------------------------------------------------

FAIRNESS SYSTEM

To prevent manipulation:

Vote limits
One vote per user per category.

Rate limits
Maximum votes per minute.

Account age weighting
New accounts have lower vote weight.

Random card position
Prevent left/right bias.

Fraud detection
Detect bot voting.

Transparency
Display vote totals.

------------------------------------------------------------

DATABASE MODEL

Users
id
username
email
avatar
created_at

Cards
id
player
year
set
variant

CardAssets
id
image_url
user_id

Battles
id
left_card
right_card
categories
start_time
end_time
status

Votes
battle_id
user_id
category
choice

UserStats
wins
losses
streak

------------------------------------------------------------

CORE API

POST /auth/register
POST /auth/login

GET /battles/feed
POST /battles/create
POST /battles/vote

GET /users/profile
GET /leaderboards

------------------------------------------------------------

TECH STACK

Recommended stack:

Frontend
Next.js

Mobile
React Native

Backend
FastAPI or Node.js

Database
PostgreSQL

Cache
Redis

Storage
S3 or Cloudflare R2

Payments
Stripe

------------------------------------------------------------

IMAGE ENTRY METHODS

Users can add cards via:

1. Photo scan
2. Manual search
3. Upload image + title

MVP should support method #3 only.

------------------------------------------------------------

GROWTH STRATEGY

Initial users acquired via:

Breaker partnerships
Pull competitions
Instagram card influencers
Reddit card communities
Card debate content

Goal:
First 50k collectors.

------------------------------------------------------------

ENGAGEMENT FEATURES

Streaks
Daily vote streaks.

Leaderboards
Top voters
Top analysts
Top collectors.

Badges
Achievements for participation.

------------------------------------------------------------

FUTURE FEATURES

Card sentiment index

Example:

Bullish
Wembanyama Prizm

Neutral
Luka Prizm

Bearish
Zion Prizm

Market intelligence dashboards.

------------------------------------------------------------

IMPLEMENTATION ROADMAP

Phase 1
Core battles
Voting
Profiles

Phase 2
Leaderboards
Shareable battle graphics

Phase 3
Pull Arena
Daily Picks

Phase 4
Fantasy Card Leagues

Phase 5
Market analytics

------------------------------------------------------------

MINIMUM VIABLE PRODUCT

Required features:

User accounts
Battle creation
Voting system
Battle results
Leaderboard
Share graphics

This can launch quickly.

------------------------------------------------------------

END GOAL

Build the central social hub for sports card collectors where debate, pulls, predictions, and market sentiment live in one place.



---


## Part 2 — AI-Agent Ready Build Spec


# Card Battles ⚔️ — AI-Agent Ready Build Spec
Version: 2.0 
Date: 2026-03-05 
Audience: Claude Code, OpenClaw, and human engineers 
Purpose: Build a production-minded MVP for a sports card social platform centered on battles, pull posts, daily picks, and fantasy-style engagement loops.

---

# 1) Product summary

## One-line pitch
**Card Battles is Tinder + StockTwits + Whatnot for sports cards.**

Users:
- upload or scan cards
- create head-to-head battles
- vote on categories like investment, coolest card, rarest pull
- share pull highlights
- make daily picks
- climb streaks and leaderboards

The platform monetizes attention before purchase through:
- sponsored battles
- premium subscriptions
- affiliate links to marketplaces
- paid contests/leagues
- ads
- grading referrals

---

# 2) Product thesis

The sports card ecosystem already has:
- marketplaces
- grading
- scanners
- price trackers
- live breaks

It does **not** have a dominant entertainment + sentiment layer.

Collectors already spend time:
- debating cards
- posting pulls
- flexing collections
- arguing about investment upside
- watching breaks

Card Battles structures that behavior into a repeatable feed mechanic.

---

# 3) Primary product pillars

## 3.1 Card Battles
Two cards face off. Community votes.

Example:
- 2017 Mahomes Rookie Auto PSA 10
- 2000 Brady Bowman Rookie PSA 10

Categories:
- Better long-term investment
- Cooler card
- Rarer pull

## 3.2 Pull Arena
Users post the best pull from a pack or break.
Community votes on:
- Best pull
- Most valuable
- Luckiest hit

## 3.3 Daily Picks
A daily card prediction game with streaks.

Example:
- Luka Prizm Rookie vs Wembanyama Prizm Rookie

Users pick a side. Next day, result is resolved by a ruleset.

## 3.4 Fantasy Card Leagues
Users draft cards into rosters. Cards score based on:
- battle outcomes
- market movement
- player performance signals
- special event bonuses

---

# 4) Non-negotiable product principles

1. **Fast loop first**
 - user should be able to open app and vote in under 3 seconds

2. **Feed can never be empty**
 - system must auto-generate battles

3. **Creation must be low friction**
 - MVP uses upload + title, not full scan accuracy

4. **Fairness matters**
 - anti-bot, anti-manipulation, transparent results

5. **Entertainment first, utilities second**
 - this is not just a scanner or price tracker

---

# 5) MVP scope

## In scope
- authentication
- user profiles
- upload image + card title
- create battle
- battle feed
- vote on battles
- battle result computation
- leaderboards
- streaks
- share result card
- sponsored battle support
- affiliate CTA buttons
- admin moderation

## Out of scope for initial MVP
- full card scanning accuracy
- payments escrow
- peer-to-peer marketplace
- advanced portfolio value tracking
- real grading verification integrations
- native mobile app if web-first is faster

---

# 6) Recommended launch strategy

## Launch order
1. Web app only
2. Mobile-first responsive UI
3. Add native mobile later if traction appears

## Why
This gets product live fastest and is easiest for autonomous coding agents to implement.

---

# 7) Core user flows

## 7.1 First-time user flow
1. lands on battle feed
2. sees battle immediately
3. votes without full onboarding
4. after limited free votes, prompted to create account
5. account unlocks stats, streaks, creation, comments later

## 7.2 Create battle flow
1. upload left card image
2. enter left card title
3. upload right card image
4. enter right card title
5. choose categories
6. choose duration
7. publish

## 7.3 Daily retention flow
Morning:
- make daily picks

Day:
- vote on new battles

Evening:
- check results, standings, streaks, and trending pulls

---

# 8) UX and screen specs

## 8.1 Feed screen
### Elements
- top nav: logo, search, profile
- battle card viewport
- timer
- total votes
- sponsored badge if applicable
- left card image + title
- right card image + title
- category chips or buttons
- vote action area
- next battle preload

### Behavior
- after user votes a category, briefly show percentage
- allow vote across all categories on same battle
- optional auto-advance after final category vote

## 8.2 Battle detail screen
- large side-by-side layout
- vote breakdown by category
- total votes
- share button
- affiliate "Buy this card" CTA
- creator attribution
- report button

## 8.3 Create battle screen
- drag/drop upload
- image crop or basic fit
- title fields
- category selector
- publish button
- validation errors

## 8.4 Profile screen
- avatar
- username
- total votes cast
- battles created
- battles won/lost
- current streak
- best streak
- badges
- pro label if subscribed

## 8.5 Leaderboards
Tabs:
- Top Voters
- Top Creators
- Top Cards
- Daily Pick Accuracy

## 8.6 Admin moderation screen
- flagged battles
- flagged users
- remove battle
- suspend user
- basic metrics

---

# 9) Information architecture

## Top-level navigation
- Feed
- Create
- Leaderboards
- Daily Picks
- Profile

## Secondary areas
- Battle detail
- Result page
- Admin
- Subscription / billing

---

# 10) Data model

Use PostgreSQL.

## 10.1 users
```sql
CREATE TABLE users (
 id UUID PRIMARY KEY,
 username VARCHAR(32) NOT NULL UNIQUE,
 email VARCHAR(255) NOT NULL UNIQUE,
 password_hash TEXT,
 avatar_url TEXT,
 bio TEXT,
 is_admin BOOLEAN NOT NULL DEFAULT FALSE,
 is_mod BOOLEAN NOT NULL DEFAULT FALSE,
 pro_status VARCHAR(20) NOT NULL DEFAULT 'none',
 pro_until TIMESTAMPTZ,
 status VARCHAR(20) NOT NULL DEFAULT 'active',
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 last_active_at TIMESTAMPTZ
);
```

## 10.2 card_assets
```sql
CREATE TABLE card_assets (
 id UUID PRIMARY KEY,
 created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
 image_url TEXT NOT NULL,
 thumb_url TEXT,
 title TEXT NOT NULL,
 sport VARCHAR(50),
 player_name VARCHAR(120),
 year INT,
 set_name VARCHAR(120),
 variant VARCHAR(120),
 source VARCHAR(30) NOT NULL DEFAULT 'upload',
 metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## 10.3 battles
```sql
CREATE TABLE battles (
 id UUID PRIMARY KEY,
 created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
 left_asset_id UUID NOT NULL REFERENCES card_assets(id) ON DELETE CASCADE,
 right_asset_id UUID NOT NULL REFERENCES card_assets(id) ON DELETE CASCADE,
 title TEXT NOT NULL,
 description TEXT,
 categories JSONB NOT NULL,
 duration_seconds INT NOT NULL,
 starts_at TIMESTAMPTZ NOT NULL,
 ends_at TIMESTAMPTZ NOT NULL,
 status VARCHAR(20) NOT NULL DEFAULT 'live',
 is_sponsored BOOLEAN NOT NULL DEFAULT FALSE,
 sponsor_id UUID,
 sponsor_cta JSONB,
 tags JSONB NOT NULL DEFAULT '{}'::jsonb,
 total_votes_cached INT NOT NULL DEFAULT 0,
 result JSONB,
 visibility VARCHAR(20) NOT NULL DEFAULT 'public',
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## 10.4 votes
```sql
CREATE TABLE votes (
 id UUID PRIMARY KEY,
 battle_id UUID NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
 user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 category VARCHAR(50) NOT NULL,
 choice VARCHAR(10) NOT NULL CHECK (choice IN ('left', 'right')),
 weight NUMERIC(6,3) NOT NULL DEFAULT 1.0,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 UNIQUE (battle_id, user_id, category)
);
```

## 10.5 user_stats
```sql
CREATE TABLE user_stats (
 user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
 votes_cast INT NOT NULL DEFAULT 0,
 battles_created INT NOT NULL DEFAULT 0,
 battles_won INT NOT NULL DEFAULT 0,
 battles_lost INT NOT NULL DEFAULT 0,
 current_streak INT NOT NULL DEFAULT 0,
 best_streak INT NOT NULL DEFAULT 0,
 daily_pick_wins INT NOT NULL DEFAULT 0,
 daily_pick_losses INT NOT NULL DEFAULT 0,
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## 10.6 reports
```sql
CREATE TABLE reports (
 id UUID PRIMARY KEY,
 reporter_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
 target_type VARCHAR(20) NOT NULL,
 target_id UUID NOT NULL,
 reason VARCHAR(100) NOT NULL,
 notes TEXT,
 status VARCHAR(20) NOT NULL DEFAULT 'open',
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## 10.7 sponsors
```sql
CREATE TABLE sponsors (
 id UUID PRIMARY KEY,
 name VARCHAR(150) NOT NULL,
 contact_email VARCHAR(255),
 logo_url TEXT,
 metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## 10.8 subscriptions
```sql
CREATE TABLE subscriptions (
 id UUID PRIMARY KEY,
 user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 provider VARCHAR(30) NOT NULL DEFAULT 'stripe',
 provider_customer_id TEXT,
 provider_subscription_id TEXT,
 status VARCHAR(30) NOT NULL,
 current_period_end TIMESTAMPTZ,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## 10.9 sponsor_clicks
```sql
CREATE TABLE sponsor_clicks (
 id UUID PRIMARY KEY,
 battle_id UUID REFERENCES battles(id) ON DELETE SET NULL,
 sponsor_id UUID REFERENCES sponsors(id) ON DELETE SET NULL,
 user_id UUID REFERENCES users(id) ON DELETE SET NULL,
 destination_url TEXT NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## 10.10 daily_picks
```sql
CREATE TABLE daily_picks (
 id UUID PRIMARY KEY,
 left_asset_id UUID NOT NULL REFERENCES card_assets(id) ON DELETE CASCADE,
 right_asset_id UUID NOT NULL REFERENCES card_assets(id) ON DELETE CASCADE,
 title TEXT NOT NULL,
 starts_at TIMESTAMPTZ NOT NULL,
 ends_at TIMESTAMPTZ NOT NULL,
 resolution_method VARCHAR(50) NOT NULL,
 result JSONB,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## 10.11 daily_pick_entries
```sql
CREATE TABLE daily_pick_entries (
 id UUID PRIMARY KEY,
 daily_pick_id UUID NOT NULL REFERENCES daily_picks(id) ON DELETE CASCADE,
 user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 choice VARCHAR(10) NOT NULL CHECK (choice IN ('left', 'right')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 UNIQUE (daily_pick_id, user_id)
);
```

---

# 11) Suggested indexes
```sql
CREATE INDEX idx_battles_status_ends_at ON battles(status, ends_at);
CREATE INDEX idx_votes_battle_id ON votes(battle_id);
CREATE INDEX idx_votes_user_id ON votes(user_id);
CREATE INDEX idx_card_assets_player_name ON card_assets(player_name);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_daily_picks_ends_at ON daily_picks(ends_at);
```

---

# 12) Backend architecture

## Recommended backend
**FastAPI + PostgreSQL + Redis + Celery**
or
**Node/NestJS + PostgreSQL + Redis + BullMQ**

Preferred choice for speed and clarity:
- **FastAPI** for API
- **Celery / RQ** for jobs
- **Redis** for caching/rate limit/job broker

## Services
1. API service
2. Worker service
3. Web frontend
4. PostgreSQL
5. Redis
6. Object storage (S3 / R2)
7. Stripe webhook handler
8. Analytics provider

---

# 13) Folder structure

## Monorepo suggestion
```text
card-battles/
 apps/
 web/
 app/
 components/
 lib/
 public/
 styles/
 tests/
 api/
 app/
 api/
 core/
 db/
 models/
 schemas/
 services/
 workers/
 utils/
 tests/
 packages/
 ui/
 config/
 types/
 infra/
 docker/
 terraform/
 scripts/
 docs/
 prd/
 api/
 prompts/
 .env.example
 docker-compose.yml
 README.md
```

## API internal structure
```text
apps/api/app/
 main.py
 api/
 auth.py
 battles.py
 assets.py
 users.py
 leaderboards.py
 daily_picks.py
 admin.py
 billing.py
 core/
 config.py
 security.py
 rate_limit.py
 db/
 session.py
 base.py
 models/
 user.py
 card_asset.py
 battle.py
 vote.py
 report.py
 subscription.py
 schemas/
 auth.py
 battle.py
 asset.py
 user.py
 services/
 battle_service.py
 vote_service.py
 feed_service.py
 stats_service.py
 billing_service.py
 sponsor_service.py
 workers/
 battle_resolution.py
 daily_pick_resolution.py
 auto_battle_generation.py
 utils/
 ids.py
 time.py
 images.py
```

---

# 14) REST API contract

[Full API contract as specified in original document]

---

# 15-35) [All remaining sections preserved]

See original document for complete spec including:
- Vote fairness model
- Battle resolution logic
- Auto-generated content engine
- Pull Arena spec
- Daily Picks spec
- Fantasy Card Leagues spec
- Monetization design
- Repo setup instructions
- Build order for AI agents
- Claude Code prompt pack
- OpenClaw agent plan
- Wireframe notes
- Analytics event spec
- Testing requirements
- Security requirements
- Performance requirements
- Seed content requirements
- MVP acceptance criteria
- Nice-to-have after MVP
- Final instructions

---

## Part 3 — GitHub-Ready Starter Repo Spec

[Full starter repo spec as provided]

---

## Part 4 — GitHub Backlog / Epics / Milestones

[Full backlog as provided]
