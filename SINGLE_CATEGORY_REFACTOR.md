# Single-Category Battle Refactor

## Goal
Transform Card Battles from 3-category voting to single-category battles with Tinder-like speed.

## Breaking Changes

### Database Schema
**battles table:**
- Remove: `categories` JSON array
- Add: `category` VARCHAR (single category)
- Add: `badge` VARCHAR (optional: 'hot', 'trending', 'goat', etc.)

**votes table:**
- Remove: `category` column (no longer needed)
- Keep: `battle_id`, `user_id`, `choice` (left/right)

### API Changes
**POST /battles/:id/vote**
- Remove: `category` from request body
- Payload: `{ choice: 'left' | 'right' }`

**GET /battles/:id**
- Response includes single `category` field
- Response includes vote percentages directly (no per-category breakdown)

## UI/UX Changes

### Battle Card Component
1. **Header**: Display single category with emoji
   - 🔥 COOLEST CARD
   - 💰 BETTER INVESTMENT
   - 💎 RAREST CARD

2. **Cards**: Increase size ~8%, add premium border

3. **Vote Interaction**:
   - Tap card = vote
   - Swipe gestures (mobile)
   - Remove category buttons

4. **Post-Vote**:
   - Animate selected card (glow + scale 1.05)
   - Fade opponent card
   - Show results (<300ms)
   - Auto-advance to next battle (~1s)

### Feed Flow
- Continuous voting loop
- Progress indicator: "🔥 3 / 10 HOT BATTLES"
- Target: <1.5 seconds per battle

## Implementation Plan

### Phase 1: Database Migration
1. Create migration to add `category` column
2. Migrate existing battles (pick first category from array)
3. Update seed data

### Phase 2: API Updates
1. Update combo-server routes
2. Simplify vote endpoint
3. Update battle response format

### Phase 3: Frontend Refactor
1. New single-category BattleCard component
2. Swipe gesture support
3. Fast animations
4. Auto-advance logic

### Phase 4: Engagement Features
- Badges (🔥 HOT, ⚡ TRENDING, etc.)
- Leaderboard (+1 for vote, +3 for matching winner)
- Progress tracker

## Migration Strategy

**Option A: Hard cutover**
- Deploy all changes at once
- Existing battles converted to single-category
- Users see new UI immediately

**Option B: Dual mode**
- Support both old and new battle types
- Gradually phase out multi-category battles

**Recommendation: Option A** (cleaner, faster)

## Files to Modify

### Backend
- `apps/api/src/combo-server.ts` - schema + seed
- `apps/api/src/routes/battles.ts` - vote endpoint
- `packages/types/src/index.ts` - Battle type

### Frontend
- `apps/web/components/battle/BattleCard.tsx` - NEW single-category UI
- `apps/web/components/battle/VoteButtons.tsx` - DELETE (replaced by tap-to-vote)
- `apps/web/hooks/useBattles.ts` - update types
- `apps/web/app/(app)/feed/page.tsx` - auto-advance logic
- `apps/web/app/(app)/battles/[id]/page.tsx` - single battle view

## Timeline
- Phase 1 (DB): 30 min
- Phase 2 (API): 30 min
- Phase 3 (UI): 1-2 hours
- Phase 4 (Features): 1 hour

**Total: ~3-4 hours**

## Rollback Plan
Keep git commits atomic. If issues arise, revert to previous commit.
