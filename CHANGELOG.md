# Changelog

## [1.0.0-beta] - 2026-03-07

### Added (Waves 30-34)
- Sold comparable sales panel (4th tab on battle detail)
- Community milestones feed
- Battle scoring formula explainer with interactive calculator
- Gift cards for Pro gifting ($5/$10/$25/$50)
- 5-tier card rarity system (Common/Uncommon/Rare/Epic/Legendary)
- RarityBadge component on Hall of Fame, Collection, Marketplace
- 8 selectable battle categories (up from 3 fixed)
- Settings: privacy, display, notification preferences, export/delete account
- Card vintage calculator (era, age premium, anniversary milestones)
- Voting insights panel (per-category summary, majority alignment)
- Friend challenges with trash talk
- Social proof on landing page (real stats, count-up animation)
- Card set completion tracker with progress bar
- Battle reminders (15/30/60/120 min before end)
- Richer user profiles (location, favorite player, trophy case, battle history)
- Card price comparison floating widget
- Blitz Battles (5-minute speed battles with live countdown)
- Collector persona quiz (4 archetypes)
- 86 tests passing (12 test files)
- Production build: 60+ routes, clean TypeScript

## [0.9.0] - 2026-03-07

### Added (Waves 19-29)
- Rich 3-tab share modal (Share/OG Card/Embed widget)
- Battle embed widget endpoint for external sites
- 50 seed battles with 64 card assets (Caitlin Clark, Bo Jackson, Kobe Bryant, Sandy Koufax + more)
- Community Hub with live event feed
- Daily picks streak reward milestones
- Card Grading Guide with PSA scale and glossary
- Toast notification system
- Card Marketplace (list, browse, contact seller)
- Player profile pages
- Vote All button (3 categories in 1 click)
- BackButton on 10+ pages
- 30-day Price History sparkline charts
- Card Scanner UI with animated recognition
- Hall of Fame for most-voted cards
- PWA App download page with waitlist
- Trade Proposals system
- Portfolio Tracker with SVG value chart
- Battle Replay with scrubber and auto-play
- User Discovery (find/follow collectors)
- Investment Calculator with ROI projection
- Battle Bracket Generator
- Live Battle Chat (SSE-powered)
- Push notification stub with service worker
- Card News Feed (10 curated articles)
- Card Flip animation on vote + vote streak counter
- Collection sharing (public /collectors/[username] pages)
- Battle Drafts (save/load/publish)
- Improved mobile bottom nav (long-press, swipe, haptic)
- 5-step onboarding with confetti
- Card Spotlight (most voted card of the day)
- Personalized battle recommendations
- Reporting system (battles/comments/users)
- Price Alerts API (real CRUD, trigger detection)
- Achievement Unlock animation overlay
- Seasonal Events (GOAT Showdown, Rookie Rumble, Vintage Vault)
- Card Condition Checker (5-step PSA wizard)
- Battle Templates (6 pre-built matchups)
- Card Pack Opening experience
- Multi-Round Battles (Best of 3)
- Collector Rank Tiers (Rookie → Legend)
- Card Wishlist
- Battle Predictions with community split
- Creator Earnings dashboard
- Collector Trading Card SVG generator
- Battle Series (recurring weekly/daily battles)
- Weekly Digest email preview
- Production build fixed (57 routes, 87kB shared JS)
- 76 tests passing (11 test files)

## [0.8.0] - 2026-03-07

### Added
- Card Grading Simulator with animated grade reveal
- Battle Stats charts (SVG donut + bar charts)
- Referral system with code generation and redemption
- Market Feed with simulated price movements
- Card Comparison tool with side-by-side metrics
- Advanced Search with filters, grid/list toggle, trending suggestions
- Bulk Battle Creator for admin users
- Live Auctions with countdown timers and bid simulation
- Card Sets browser (Prizm, Topps Chrome, Bowman, Fleer, SP Auth, National Treasures)
- Personal Analytics dashboard
- Improved OG share images with card photos and glow effects
- Community Hub with live event feed and rising stars
- Daily Picks streak reward milestones (3/7/14/30 days)
- Card Grading Guide with PSA scale, glossary, tips
- Toast notification system
- 8 new production DB tables (comments, collections, watchlist, follows, tournaments, fantasy)
- Integration test suite (12 E2E scenarios)
- CI: TypeScript + build + integration test jobs
- Card Marketplace (list, browse, contact seller)
- Player profile pages (directory + per-player stats)
- Vote All button (3 categories in 1 click)
- BackButton component on 10+ pages
- Category Insights expandable section on battle detail
- 30-day Price History sparkline charts
- Card Scanner UI with animated recognition
- Hall of Fame for most-voted cards
- PWA App download page with waitlist
- Trade Proposals system
- Portfolio Tracker with SVG value chart
- Battle Replay with scrubber and auto-play
- Rich Social Sharing modal with 3 tabs (Share / OG Card / Embed)
- BattleWidget embeddable iframe endpoint (`/api/v1/battles/:id/widget`)
- WhatsApp share button with pre-filled battle text
- Real Twitter/X share URLs with hashtags and player names
- Dynamic document.title on 15+ pages for SEO/deep-links
- 10 new API tests (53 total passing)
- 50 seed battles across NFL, NBA, MLB, WNBA

### Changed
- Daily Picks enhanced with streak rewards
- Search page revamped with filters and suggestions
- Notifications page with category filters
- Admin dashboard with Bulk Create tab (5th tab)
- Battle detail page: 3 tabs (Overview / Stats / Replay)
- Share modal upgraded to 3-tab layout (Share / OG Card / Embed)
- Seed data expanded: 64 card assets, 50 battles, new players (WNBA, legends, 2023 rookies)

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

