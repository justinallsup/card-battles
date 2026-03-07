# Card Battles — Feature Catalog

## Core Battle Features
- Head-to-head card battles with 3 voting categories (Investment / Coolest / Rarity)
- Real-time vote updates via Server-Sent Events (SSE)
- Battle replay with timeline scrubber and auto-play
- Vote All (1-click across all 3 categories)
- Live battle chat (SSE-powered)
- Battle statistics: donut charts, bar charts, momentum indicator
- Card flip animation on vote
- Comments with likes
- Category insights (what each category means)
- Share modal: Twitter/X, WhatsApp, copy link, OG card preview, embed widget
- Battle drafts: save, load, publish

## Collection & Market
- Personal card collection (save/unsave cards)
- Collection sharing (public /collectors/[username] pages)
- Watchlist for battles
- Portfolio tracker with 30-day SVG value chart
- Marketplace: list cards for sale, browse by price/condition
- Trade proposals between users
- Price history sparkline charts (30-day simulated)
- Price alerts (API-backed, above/below threshold)
- Card comparison tool (side-by-side metrics, WIN badges)
- Card Sets browser (Prizm, Topps Chrome, Bowman, Fleer, SP Auth, National Treasures)
- Market feed with simulated price movements

## Discovery & Social
- Activity feed (global events stream)
- Community hub (live event feed, stats, rising stars)
- Player profiles (/players directory + per-player pages)
- User discovery (find/follow collectors)
- User following system
- Leaderboards (creators, voters, builders — weekly/monthly/all-time)
- Hall of Fame (top 10 most-voted cards)
- Card news feed (10 curated articles)
- Trending battles
- Card spotlight (most-voted card of the day)
- Personalized battle recommendations

## Gamification
- 16-badge achievement system (Combat, Voting, Streaks, Creator, Daily Picks, Special)
- Achievement unlock animation overlay
- Daily picks with streak rewards (3/7/14/30-day milestones)
- Vote streak counter (session-based)
- Seasonal events with prizes

## Tournaments & Competition
- Tournament system with bracket visualizer
- Battle bracket generator (custom 8-player)
- Fantasy leagues (create, join, draft)
- Bulk battle creator (admin tool)
- Battle templates (6 pre-built matchups)

## Tools & Education
- Card grading simulator (PSA-style grade reveal)
- Card condition checker (5-step checklist)
- Investment calculator (PSA grade × years → ROI projection)
- Card scanner (camera UI with AI stub)
- Card grading guide (PSA scale, glossary, tips)
- OG image generator for social sharing
- Embed widget for external sites

## User Features
- Auth: register/login/JWT, social login stubs
- Enhanced profile: stats, badges, bio editing, recent battles
- Onboarding wizard (5 steps with animations)
- Notifications (category filters, contextual)
- Settings (sport prefs, appearance, bio)
- Vote history
- Analytics dashboard (weekly chart, sport breakdown, streaks)
- Push notification setup (Web Push stub)

## Admin
- Admin dashboard (6 tabs: Overview/Reports/Battles/Users/Bulk Create/Reports)
- User management (suspend/unsuspend/make-admin)
- Report moderation queue
- Bulk battle creation from text matchups

## Technical
- Real-time SSE (battles, chat)
- PWA manifest + service worker
- Dark theme (mobile-first)
- BackButton on 10+ pages
- Toast notification system
- Shimmer loading states
- Card flip and confetti animations
- TypeScript: 0 errors
- 67 tests (10 test files)
- Integration test suite (12 scenarios)
- OpenAPI spec (50+ endpoints)
- Production Drizzle schema (8 new tables)
- Railway + Vercel deployment configs
