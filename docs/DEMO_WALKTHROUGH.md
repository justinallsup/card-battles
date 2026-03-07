# Card Battles — Demo Walkthrough

## Setup
1. Run `./scripts/dev.sh` (or see README for manual steps)
2. Open http://localhost:3333 in browser
3. Login: cardking@demo.com / password123

## Core Demo Flow (5 minutes)

### 1. The Feed (30s)
- Show the battle feed with live vote counts
- Point out sport filter tabs
- Show trending battles section

### 2. Vote on a Battle (1 min)
- Click any battle
- Show left/right card images
- Vote on all 3 categories (or use Vote All)
- Watch live vote bars update
- Show the stats tab + replay tab

### 3. Create a Battle (1 min)
- Click the + create button
- Use Card Search tab to find Mahomes
- Use Card Search tab to find Brady
- Set title, sport, duration
- Submit → redirected to new battle

### 4. Explore Features (2 min)
- Market Feed — show price movements
- Hall of Fame — show top voted cards
- Card Grader — submit a card, get grade
- Live Auctions — show countdown timers
- Portfolio — show value tracker

### 5. Social Features (30s)
- Community hub — live activity feed
- Leaderboard — top creators/voters
- Profile — badges earned

## Demo Accounts
| Email | Password | Role |
|-------|----------|------|
| cardking@demo.com | password123 | Admin |
| slabmaster@demo.com | password123 | Pro user |
| rookiehunter@demo.com | password123 | Regular user |
| packripper@demo.com | password123 | Regular user |
| gradegod@demo.com | password123 | Regular user |

## Key Stats to Mention
- 50 seeded battles across NFL, NBA, MLB
- 64 card assets in the database
- 35+ features built in one weekend
- 53 passing tests
- Mobile-first, dark theme
- Real-time SSE vote updates

## What's Next
- Real card image recognition (scanner)
- Stripe payment integration
- Push notifications
- Native mobile app
- Live auction bidding with escrow
