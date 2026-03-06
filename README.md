# Card Battles ⚔️

> The ultimate sports card battle platform. Upload cards, create head-to-head battles, vote, and compete for the top of the leaderboard.

**Tinder + StockTwits + Whatnot — for sports cards.**

---

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, React Query |
| Backend | Hono (Node.js), TypeScript, Drizzle ORM |
| Database | PostgreSQL |
| Cache / Queue | Redis + BullMQ |
| Storage | S3 / MinIO (local) |
| Auth | JWT (access + refresh tokens) |
| Payments | Stripe (scaffolded) |
| Package manager | pnpm |

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker + Docker Compose)
- [Node.js 20+](https://nodejs.org/)
- [pnpm](https://pnpm.io/) — `npm install -g pnpm`

---

## Local Setup

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

# 6. Seed demo data (100 cards, 20+ battles, 10 users)
pnpm db:seed
```

---

## URLs

| Service | URL |
|---------|-----|
| Web app | http://localhost:3000 |
| API | http://localhost:8000 |
| API health | http://localhost:8000/health |
| MinIO console | http://localhost:9001 (admin / minioadmin) |

---

## Demo Credentials

After seeding, log in with any demo account:

```
Email:    cardking@demo.com
Password: password123
```

Other accounts: `slabmaster`, `rookiehunter`, `packripper`, `gradegod` — all `@demo.com` / `password123`

---

## Commands

```bash
# Development (run everything locally without Docker)
pnpm dev              # starts web + api in parallel

# Database
pnpm db:migrate       # run migrations
pnpm db:seed          # seed demo data
pnpm db:generate      # generate new migration from schema changes
pnpm db:studio        # open Drizzle Studio (DB browser)

# Testing
pnpm test             # run all tests

# Type checking
pnpm typecheck        # check types across all packages
```

---

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│  Next.js    │────▶│  Hono API   │────▶│  PostgreSQL  │
│  :3000      │     │  :8000      │     │  :5432       │
└─────────────┘     └─────────────┘     └──────────────┘
                           │                    ▲
                           ▼                    │
                    ┌─────────────┐     ┌──────────────┐
                    │   Redis     │────▶│   Worker     │
                    │   :6379     │     │  (BullMQ)    │
                    └─────────────┘     └──────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   MinIO     │
                    │   :9000     │
                    └─────────────┘
```

- **Web** — Next.js App Router, mobile-first dark UI
- **API** — Hono REST API, JWT auth, rate limiting
- **Worker** — Resolves ended battles, auto-generates content
- **PostgreSQL** — Primary data store (11 tables)
- **Redis** — Rate limiting + job queue broker
- **MinIO** — S3-compatible local object storage for card images

---

## Product Pillars

1. **Card Battles** — Two cards face off, community votes on categories
2. **Daily Picks** — Predict winners, build accuracy streaks
3. **Pull Arena** — Share your best pack pulls *(coming soon)*
4. **Fantasy Card Leagues** — Draft rosters *(future)*

---

## MVP Acceptance Criteria

- [x] User can register and log in
- [x] User can upload two card images and create a battle
- [x] Other users can vote on battle categories
- [x] Battle resolves automatically after timer ends
- [x] Leaderboards update
- [x] Sponsored CTA can be displayed and clicked
- [x] Admin can remove a battle
- [x] Feed populated by user-created + auto-generated battles

---

## Roadmap

See [`docs/`](./docs/) for full product spec, epics, and GitHub backlog.

| Phase | Focus |
|-------|-------|
| MVP | Auth · Battles · Voting · Leaderboards |
| v1 | Sharing · Pull Arena · Daily Picks |
| v2 | Subscriptions · Sponsored tools |
| v3 | Fantasy Leagues · Market analytics |
