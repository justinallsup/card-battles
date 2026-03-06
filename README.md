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
| Testing | Vitest (42 tests, combo-server in-memory) |

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

The demo server seeds 40+ cards, 30+ battles, and 5 demo users automatically.

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

# 6. Seed demo data (100 cards, 30+ battles, 5 users)
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
pnpm test            # Run all tests (42 tests, combo-server)

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
- **PostgreSQL** — Primary data store (12+ tables)
- **Redis** — Rate limiting + job queue broker
- **MinIO** — S3-compatible local object storage for card images

---

## Features

### ⚔️ Card Battles
Head-to-head card matchups with multi-category voting (investment value, coolness, rarity). Sponsored battles with CTA overlays. Live vote results via SSE. Battle feed with pagination and sport filters.

### 📊 Leaderboards
Creator leaderboard (ranked by battles won) and voter leaderboard (ranked by votes cast). Weekly/monthly/all-time periods.

### 🎯 Daily Picks
Predict daily card winners, track accuracy. Community-wide entry stats.

### 💬 Comments
Battle comment threads with likes. Up to 280 characters.

### 🏆 Tournaments
Bracket-style tournaments (NFL GOAT Card Tournament, NBA Greatest of All Time, etc.)

### 🃏 Fantasy Card Leagues
Draft rosters of up to 5 cards. League standings based on battle performance.

### 👤 User Profiles
Stats, battle history, follow/unfollow system, card collection, watchlist.

### 💎 Card Valuations
Real-time market value estimates for PSA 10 graded cards.

### 🔍 Search & Discovery
Full-text battle search, card search, trending battles, sport filters.

### 🛡️ Admin Panel
User management (suspend/unsuspend/promote), battle moderation, platform stats.

### 💳 Pro Subscriptions
Stripe-powered Pro tier (scaffolded): unlimited battles, advanced analytics, Pro badge.

---

## App Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/battles` | Battle feed |
| `/battles/[id]` | Single battle view + voting |
| `/battles/create` | Create battle wizard |
| `/leaderboard` | Creator + voter rankings |
| `/daily-picks` | Daily prediction contest |
| `/profile/[username]` | User profile + stats |
| `/collection` | Saved card collection |
| `/watchlist` | Watched battles |
| `/search` | Search battles |
| `/trending` | Trending battles |
| `/tournaments` | Tournament brackets |
| `/fantasy` | Fantasy leagues |
| `/admin` | Admin dashboard (admin only) |
| `/billing` | Subscription management |

---

## API Documentation

Full OpenAPI 3.0 spec: [`docs/api/openapi.yaml`](./docs/api/openapi.yaml)

Key endpoints:
- `POST /api/v1/auth/register` — Register
- `POST /api/v1/auth/login` — Login
- `GET /api/v1/battles/feed` — Battle feed (paginated)
- `POST /api/v1/battles/:id/vote` — Cast a vote
- `GET /api/v1/battles/:id/results` — Vote percentages by category
- `GET /api/v1/leaderboards?type=creators` — Leaderboards
- `GET /api/v1/tournaments` — Tournaments
- `GET /api/v1/fantasy/leagues` — Fantasy leagues
- `GET /api/v1/users/:username/follow-status` — Follow status

---

## Product Pillars

1. **Card Battles** — Two cards face off, community votes on categories
2. **Daily Picks** — Predict winners, build accuracy streaks
3. **Fantasy Card Leagues** — Draft rosters, compete on battle performance
4. **Tournaments** — Bracket-style card championships
5. **Pull Arena** — Share your best pack pulls *(coming soon)*

---

## MVP Acceptance Criteria

- [x] User can register and log in
- [x] User can upload two card images and create a battle
- [x] Other users can vote on battle categories
- [x] Battle resolves automatically after timer ends
- [x] Leaderboards update (creators + voters)
- [x] Sponsored CTA can be displayed and clicked
- [x] Admin can remove a battle
- [x] Feed populated by user-created + auto-generated battles
- [x] Daily pick contests with results
- [x] Battle comments with likes
- [x] User follow/unfollow system
- [x] Card collection and watchlist
- [x] Fantasy leagues with roster picks
- [x] Tournament brackets (stub)
- [x] Card market valuations
- [x] Live vote updates (SSE)
- [x] OG share images (SVG)
- [x] Battle search + trending
- [x] Admin user management
- [x] Pro subscription checkout (Stripe scaffolded)
- [x] 42 automated tests passing

---

## Roadmap

| Phase | Focus | Status |
|-------|-------|--------|
| MVP | Auth · Battles · Voting · Leaderboards | ✅ Done |
| v1 | Sharing · Daily Picks · Comments · Following | ✅ Done |
| v1.5 | Collections · Watchlist · Search · Trending | ✅ Done |
| v2 | Fantasy Leagues · Tournaments · Card Valuations | ✅ Done (stubs) |
| v2.5 | Subscriptions · Sponsored Tools · Analytics | 🚧 In Progress |
| v3 | Pull Arena · Real-time · Mobile App | 📋 Planned |
| v4 | Marketplace · Card Trading · Price History | 📋 Planned |

---

## Contributing

See [`docs/`](./docs/) for product spec, epics, and architecture decisions.

Tests: `pnpm test` — all 42 tests must pass.
Types: `pnpm typecheck` — must be error-free.
