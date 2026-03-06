# Changelog

## [0.1.0] - 2026-03-07 (Weekend Sprint)

### Added
- Full Next.js 14 frontend with App Router
- Hono API with PGlite in-memory demo mode
- Head-to-head card battle system with weighted voting
- Real-time vote updates via Server-Sent Events
- Marketing landing page with hero, features, social proof
- 3-step onboarding wizard
- 30+ battles across NFL, NBA, MLB with real player names
- Feed with sport filters, trending section, category filters
- Pull Arena with rarity tiers and reactions
- Fantasy Card Leagues (create/join/draft)
- Tournament bracket system (single elimination)
- Card valuations (PSA 10 estimates with trend indicators)
- User following system
- Comments on battles with likes
- Activity feed
- Daily picks carousel with streak tracking
- Leaderboards (creators + voters, week/month/all)
- Profile pages with 16-badge achievement system
- Card collections and watchlist
- Vote history page
- Price alerts (localStorage)
- Admin dashboard with full moderation tools
- Search with sport and category filters
- Notifications center
- Settings page with sport preferences
- Pro/subscription upgrade page (Stripe-ready)
- PWA manifest for mobile install
- Social sharing with OG cards
- 42 API tests passing
- OpenAPI 3.0 spec for all endpoints
- Railway + Vercel deployment configs

### Technical
- pnpm monorepo (apps/api + apps/web + packages/types)
- Drizzle ORM schema for production PostgreSQL
- Demo mode: PGlite (in-memory) + no Redis/S3 required
- JWT auth with refresh tokens
- BullMQ worker for battle resolution
- MinIO/S3 asset storage
- GitHub Actions CI
