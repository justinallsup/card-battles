# Card Battles ⚔️

> The ultimate sports card battle platform. Upload cards, create head-to-head battles, vote, and compete for the top of the leaderboard.

**Tinder + StockTwits + Whatnot — for sports cards.**

---

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, React Query |
| Backend | Hono (Node.js), TypeScript, Drizzle ORM |
| Database | PostgreSQL (production) / PGlite in-memory (demo) |
| Cache / Queue | Redis + BullMQ |
| Storage | S3 / MinIO (local) |
| Auth | JWT (access + refresh tokens) |
| Payments | Stripe (scaffolded) |
| Package manager | pnpm |
| Testing | Vitest (86 tests, combo-server in-memory) |

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker + Docker Compose)
- [Node.js 20+](https://nodejs.org/)
- [pnpm](https://pnpm.io/) — `npm install -g pnpm`

---

## Quick Demo (No Docker Required!)

```bash
# 1. Install dependencies
pnpm install

# 2. Start the demo server (PGlite in-memory, no external services needed)
pnpm demo

# 3. Open http://localhost:3333
```

The demo server seeds 64 cards, 50 battles, and 5 demo users automatically.

To expose publicly (useful for sharing):
```bash
pnpm demo:tunnel
```

---

## Full Local Setup

```bash
# 1. Clone the repo
git clone https://github.com/your-org/card-battles.git
cd card-battles

# 2. Copy env file
cp .env.example .env

# 3. Start all services (postgres, redis, minio, api, worker, web)
docker compose up --build

# 4. In a new terminal — install dependencies
pnpm install

# 5. Run database migrations
pnpm db:migrate

# 6. Seed demo data (64 cards, 50 battles, 5 users)
pnpm db:seed
```

---

## URLs

| Service | URL |
|---------|-----|
| Web app | http://localhost:3000 |
| API | http://localhost:8000 |
| Demo server | http://localhost:3333 |
| API health | http://localhost:8000/health |
| MinIO console | http://localhost:9001 (admin / minioadmin) |
| API docs | [docs/api/openapi.yaml](./docs/api/openapi.yaml) |

---

## Demo Accounts

After seeding (or in demo mode), log in with any of these:

| Username | Email | Password | Role |
|----------|-------|----------|------|
| cardking | cardking@demo.com | password123 | Admin |
| slabmaster | slabmaster@demo.com | password123 | User |
| rookiehunter | rookiehunter@demo.com | password123 | User |
| packripper | packripper@demo.com | password123 | User |
| gradegod | gradegod@demo.com | password123 | User |

---

## Commands

```bash
# Development
pnpm dev:api         # Start API server only
pnpm dev:web         # Start web app only
pnpm dev             # Start web + api in parallel

# Demo
pnpm demo            # Start in-memory demo server (port 3333)
pnpm demo:tunnel     # Expose demo via localtunnel

# Database
pnpm db:migrate      # Run migrations
pnpm db:seed         # Seed demo data
pnpm db:generate     # Generate new migration from schema changes
pnpm db:studio       # Open Drizzle Studio (DB browser)

# Testing
pnpm test            # Run all tests (86 tests, combo-server)

# Type checking
pnpm typecheck       # Check types across all packages

# Linting
pnpm lint            # Lint web app
```

---

## Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌──────────────┐
│  Next.js    │────▶│   Hono API       │────▶│  PostgreSQL  │
│  :3000      │     │   :8000          │     │  :5432       │
└─────────────┘     │  (production)    │     └──────────────┘
       │            └──────────────────┘            ▲
       │                    │                       │
       │                    ▼                       │
       │            ┌──────────────────┐     ┌──────────────┐
       │            │   Redis          │────▶│   BullMQ     │
       │            │   :6379          │     │   Worker     │
       │            └──────────────────┘     └──────────────┘
       │                    │
       │                    ▼
       │            ┌──────────────────┐
       │            │   MinIO / S3     │
       │            │   :9000          │
       │            └──────────────────┘
       │
       ▼ (demo mode — no external services)
┌─────────────────────────────────────┐
│  Combo Server :3333                 │
│  ┌──────────┐  ┌───────────────┐   │
│  │ Hono API │  │ PGlite (mem)  │   │
│  └──────────┘  └───────────────┘   │
│  Proxies /* → Next.js :3000         │
└─────────────────────────────────────┘
```

- **Web** — Next.js App Router, mobile-first dark UI
- **API** — Hono REST API, JWT auth, rate limiting, Drizzle ORM
- **Combo Server** — Single-port demo: Hono + PGlite in-memory, no Docker needed
- **Worker** — Resolves ended battles, auto-generates content (BullMQ)
- **PostgreSQL** — Primary data store (20+ tables)
- **Redis** — Rate limiting + job queue broker
- **MinIO** — S3-compatible local object storage for card images

---

## Features

### ⚔️ Card Battles
Head-to-head card matchups with multi-category voting (investment value, coolness, rarity). Sponsored battles with CTA overlays. Live vote results via SSE. Battle feed with pagination and sport filters. Vote All button for 3 categories at once. Battle Replay with scrubber and auto-play.

### 📊 Leaderboards
Creator leaderboard (ranked by battles won) and voter leaderboard (ranked by votes cast). Weekly/monthly/all-time periods.

### 🎯 Daily Picks
Predict daily card winners, track accuracy. Streak rewards at 3/7/14/30 day milestones. Community-wide entry stats.

### 💬 Comments
Battle comment threads with likes. Up to 280 characters.

### 🏆 Tournaments
Bracket-style tournaments (NFL GOAT Card Tournament, NBA Greatest of All Time, etc.)

### 🃏 Fantasy Card Leagues
Draft rosters of up to 5 cards. League standings based on battle performance.

### 👤 User Profiles
Stats, battle history, follow/unfollow system, card collection, watchlist. Player profile pages with per-player stats.

### 💎 Card Valuations
Real-time market value estimates for PSA 10 graded cards. 30-day price history sparkline charts. Price alerts (localStorage). Market Feed with simulated price movements.

### 🔍 Search & Discovery
Advanced full-text battle search with filters, grid/list toggle, trending suggestions. Sport filters. Hall of Fame for most-voted cards.

### 🛡️ Admin Panel
User management (suspend/unsuspend/promote), battle moderation, Bulk Battle Creator (5-tab dashboard), platform stats.

### 💳 Pro Subscriptions
Stripe-powered Pro tier (scaffolded): unlimited battles, advanced analytics, Pro badge.

### 📱 Social & Sharing
Rich 3-tab share modal: Share (Twitter/X, WhatsApp, copy link), OG Card (SVG preview + download), Embed (iframe code). Real Twitter/X share URLs with hashtags. Embeddable battle widget (`/api/v1/battles/:id/widget`). Dynamic page titles on all key routes.

### 🎓 Card Grading
Card Grading Simulator with animated grade reveal. Grading Guide with full PSA scale, glossary, and tips. Card Comparison tool with side-by-side metrics.

### 🏪 Marketplace & Trading
Card Marketplace (list, browse, contact seller). Trade Proposals system. Portfolio Tracker with SVG value chart.

### 📈 Analytics
Personal Analytics dashboard with battle stats, voting trends, and performance metrics.

### 🎴 Card Sets
Browser for major card sets: Prizm, Topps Chrome, Bowman, Fleer, SP Auth, National Treasures.

### 🔔 Notifications & Alerts
Notification center with category filters. Price alerts. Referral system with code generation and redemption.

### 📸 Card Scanner
Animated card recognition scanner UI with camera/upload support.

### 🏟️ Live Auctions
Countdown timers, bid simulation, real-time auction feed.

### 🌐 Community Hub
Live event feed, rising stars, community stats, and discussion boards.

---

## App Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/feed` | Battle feed |
| `/battles/[id]` | Single battle view + voting |
| `/create` | Create battle wizard |
| `/leaderboards` | Creator + voter rankings |
| `/daily-picks` | Daily prediction contest |
| `/search` | Advanced search with filters |
| `/market` | Market Feed — price movements |
| `/marketplace` | Buy/sell card marketplace |
| `/hall-of-fame` | Most-voted cards of all time |
| `/community` | Community hub + live events |
| `/portfolio` | Personal portfolio tracker |
| `/trades` | Trade proposals |
| `/analytics` | Personal analytics dashboard |
| `/scanner` | Card scanner |
| `/learn` | Grading guide (PSA scale) |
| `/get-app` | PWA download + waitlist |
| `/auctions` | Live auctions |
| `/grader` | Card grading simulator |
| `/compare` | Card comparison tool |
| `/sets` | Card sets browser |
| `/players` | Player directory |
| `/players/[name]` | Per-player stats + battles |
| `/collection` | Saved card collection |
| `/watchlist` | Watched battles |
| `/history` | Vote history |
| `/tournaments` | Tournament brackets |
| `/fantasy` | Fantasy leagues |
| `/pull-arena` | Share pack pulls |
| `/notifications` | Notification center |
| `/alerts` | Price alerts |
| `/activity` | Activity feed |
| `/profile` | My profile |
| `/profile/[username]` | Public user profile |
| `/admin` | Admin dashboard (admin only) |
| `/pro` | Pro subscription page |

---

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | Login |
| GET | `/api/v1/auth/me` | Current user |
| PATCH | `/api/v1/auth/me` | Update profile |
| GET | `/api/v1/battles/feed` | Battle feed (paginated) |
| GET | `/api/v1/battles/trending` | Trending battles |
| GET | `/api/v1/battles/search` | Search battles |
| GET | `/api/v1/battles/:id` | Single battle |
| POST | `/api/v1/battles` | Create battle |
| POST | `/api/v1/battles/:id/vote` | Cast vote |
| POST | `/api/v1/battles/:id/vote-all` | Vote all categories |
| GET | `/api/v1/battles/:id/results` | Vote results |
| GET | `/api/v1/battles/:id/stats` | Detailed stats |
| GET | `/api/v1/battles/:id/live` | SSE live votes |
| GET | `/api/v1/battles/:id/widget` | Embeddable iframe widget |
| GET | `/api/v1/share/:id/og` | OG share image (SVG) |
| GET | `/api/v1/leaderboards` | Leaderboards |
| GET | `/api/v1/daily-picks/current` | Today's picks |
| POST | `/api/v1/daily-picks/:id/enter` | Enter daily pick |
| GET | `/api/v1/users/:username` | User profile |
| GET | `/api/v1/users/:username/stats` | User stats |
| GET | `/api/v1/users/:username/battles` | User battles |
| POST | `/api/v1/assets/upload` | Upload card image |
| GET | `/api/v1/tournaments` | Tournament list |
| GET | `/api/v1/fantasy/leagues` | Fantasy leagues |
| POST | `/api/v1/fantasy/leagues` | Create league |
| GET | `/api/v1/auctions` | Live auctions |
| GET | `/api/v1/hall-of-fame` | Hall of fame |
| GET | `/api/v1/market/feed` | Market price feed |
| GET | `/api/v1/marketplace/listings` | Marketplace listings |
| GET | `/api/v1/trades` | Trade proposals |
| POST | `/api/v1/trades` | Create trade proposal |
| GET | `/api/v1/me/portfolio` | Portfolio data |
| GET | `/api/v1/me/analytics` | Personal analytics |
| GET | `/api/v1/referrals/me` | My referral code |
| POST | `/api/v1/referrals/redeem` | Redeem referral |
| GET | `/api/v1/card-sets` | Card sets |
| GET | `/api/v1/players` | Player directory |
| GET | `/api/v1/players/:name/stats` | Player stats |
| GET | `/api/v1/community/stats` | Community stats |

---

## MVP Acceptance Criteria

- [x] User can register and log in
- [x] User can upload two card images and create a battle
- [x] Other users can vote on battle categories
- [x] Vote All button (3 categories at once)
- [x] Battle resolves automatically after timer ends
- [x] Battle Replay with scrubber and auto-play
- [x] Leaderboards update (creators + voters)
- [x] Sponsored CTA can be displayed and clicked
- [x] Admin can remove a battle
- [x] Feed populated by user-created + auto-generated battles
- [x] Daily pick contests with streak rewards
- [x] Battle comments with likes
- [x] User follow/unfollow system
- [x] Card collection and watchlist
- [x] Fantasy leagues with roster picks
- [x] Tournament brackets (stub)
- [x] Card market valuations + 30-day sparklines
- [x] Live vote updates (SSE)
- [x] OG share images (SVG with player images)
- [x] Rich share modal (3 tabs: Share / OG Card / Embed)
- [x] Embeddable battle widget (iframe)
- [x] Dynamic page titles (SEO/deep-link)
- [x] Battle search + trending + Hall of Fame
- [x] Admin user management + Bulk Battle Creator
- [x] Pro subscription checkout (Stripe scaffolded)
- [x] Card Grading Simulator + Guide
- [x] Card Comparison tool
- [x] Card Sets browser
- [x] Marketplace (list/browse/contact)
- [x] Trade Proposals
- [x] Portfolio Tracker
- [x] Personal Analytics
- [x] Card Scanner UI
- [x] Live Auctions
- [x] Community Hub
- [x] Player profiles + directory
- [x] Referral system
- [x] Market Feed (simulated price movements)
- [x] 86 automated tests passing
- [x] 50 seed battles (NFL, NBA, MLB, WNBA, legends)

---

## 🏗️ Built This Weekend

| Metric | Count |
|--------|-------|
| Git commits | 60 |
| App pages / routes | 60+ |
| API endpoints | 80+ |
| Tests passing | 86 |
| Seed battles | 50 |
| Card assets | 64 |
| Features shipped | 80+ |
| Build time | ~36 hours |

---

## Roadmap

| Phase | Focus | Status |
|-------|-------|--------|
| MVP | Auth · Battles · Voting · Leaderboards | ✅ Done |
| v1 | Sharing · Daily Picks · Comments · Following | ✅ Done |
| v1.5 | Collections · Watchlist · Search · Trending | ✅ Done |
| v2 | Fantasy Leagues · Tournaments · Card Valuations | ✅ Done |
| v2.5 | Grading · Comparison · Sets · Analytics · Replay | ✅ Done |
| v2.8 | Marketplace · Trading · Portfolio · Auctions | ✅ Done |
| v3.0 | Rich Sharing · Deep-links · 50 Battles · Polish | ✅ Done |
| v3.5 | Real-time Multiplayer · Mobile App | 📋 Planned |
| v4 | Live Card Prices · Trading Engine · Escrow | 📋 Planned |

---

## Contributing

See [`docs/`](./docs/) for product spec, epics, and architecture decisions.

Tests: `pnpm test` — all 86 tests must pass.
Types: `pnpm typecheck` — must be error-free.
