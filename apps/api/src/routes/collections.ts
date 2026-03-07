import { Hono } from 'hono';
import { eq, desc, and } from 'drizzle-orm';
import type { AppVariables } from '../types';
import { authRequired } from '../middleware/auth';
import { db } from '../db';
import { userCollections, userWatchlist, cardAssets, battles } from '../db/schema';

const router = new Hono<{ Variables: AppVariables }>();

// GET /api/v1/collections
// Get the authenticated user's saved card collection
router.get('/', authRequired, async (c) => {
  const userId = c.get('userId') as string;

  const saved = await db
    .select({
      savedAt: userCollections.savedAt,
      asset: {
        id: cardAssets.id,
        title: cardAssets.title,
        sport: cardAssets.sport,
        playerName: cardAssets.playerName,
        year: cardAssets.year,
        setName: cardAssets.setName,
        variant: cardAssets.variant,
        imageUrl: cardAssets.imageUrl,
        thumbUrl: cardAssets.thumbUrl,
        source: cardAssets.source,
        createdAt: cardAssets.createdAt,
      },
    })
    .from(userCollections)
    .innerJoin(cardAssets, eq(cardAssets.id, userCollections.assetId))
    .where(eq(userCollections.userId, userId))
    .orderBy(desc(userCollections.savedAt));

  return c.json({ items: saved, total: saved.length, userId });
});

// POST /api/v1/collections/save
// Save a card to the user's collection
router.post('/save', authRequired, async (c) => {
  const userId = c.get('userId') as string;
  const body = await c.req.json().catch(() => ({}));
  const { cardAssetId } = body as { cardAssetId?: string };

  if (!cardAssetId) {
    return c.json({ error: 'cardAssetId required' }, 400);
  }

  // Verify card exists
  const [card] = await db
    .select({ id: cardAssets.id })
    .from(cardAssets)
    .where(eq(cardAssets.id, cardAssetId))
    .limit(1);

  if (!card) return c.json({ error: 'Card not found' }, 404);

  try {
    await db.insert(userCollections).values({ userId, assetId: cardAssetId });
  } catch (e: unknown) {
    if ((e as { code?: string }).code === '23505') {
      return c.json({ error: 'Already saved' }, 409);
    }
    throw e;
  }

  return c.json({ saved: true, cardAssetId }, 201);
});

// DELETE /api/v1/collections/save/:cardAssetId
// Unsave / remove a card from the user's collection
router.delete('/save/:cardAssetId', authRequired, async (c) => {
  const userId = c.get('userId') as string;
  const { cardAssetId } = c.req.param();

  await db
    .delete(userCollections)
    .where(and(eq(userCollections.userId, userId), eq(userCollections.assetId, cardAssetId)));

  return c.json({ saved: false, cardAssetId });
});

// GET /api/v1/collections/watchlist
// Get the authenticated user's battle watchlist
router.get('/watchlist', authRequired, async (c) => {
  const userId = c.get('userId') as string;

  const watchlist = await db
    .select({
      savedAt: userWatchlist.savedAt,
      battle: {
        id: battles.id,
        title: battles.title,
        status: battles.status,
        startsAt: battles.startsAt,
        endsAt: battles.endsAt,
        totalVotesCached: battles.totalVotesCached,
        categories: battles.categories,
        leftAssetId: battles.leftAssetId,
        rightAssetId: battles.rightAssetId,
        createdAt: battles.createdAt,
      },
    })
    .from(userWatchlist)
    .innerJoin(battles, eq(battles.id, userWatchlist.battleId))
    .where(eq(userWatchlist.userId, userId))
    .orderBy(desc(userWatchlist.savedAt));

  return c.json({ items: watchlist, total: watchlist.length, userId });
});

// POST /api/v1/collections/watchlist
// Add a battle to the user's watchlist
router.post('/watchlist', authRequired, async (c) => {
  const userId = c.get('userId') as string;
  const body = await c.req.json().catch(() => ({}));
  const { battleId } = body as { battleId?: string };

  if (!battleId) {
    return c.json({ error: 'battleId required' }, 400);
  }

  // Verify battle exists
  const [battle] = await db
    .select({ id: battles.id })
    .from(battles)
    .where(eq(battles.id, battleId))
    .limit(1);

  if (!battle) return c.json({ error: 'Battle not found' }, 404);

  try {
    await db.insert(userWatchlist).values({ userId, battleId });
  } catch (e: unknown) {
    if ((e as { code?: string }).code === '23505') {
      return c.json({ error: 'Already watching' }, 409);
    }
    throw e;
  }

  return c.json({ watching: true, battleId }, 201);
});

// DELETE /api/v1/collections/watchlist/:battleId
// Remove a battle from the user's watchlist
router.delete('/watchlist/:battleId', authRequired, async (c) => {
  const userId = c.get('userId') as string;
  const { battleId } = c.req.param();

  await db
    .delete(userWatchlist)
    .where(and(eq(userWatchlist.userId, userId), eq(userWatchlist.battleId, battleId)));

  return c.json({ watching: false, battleId });
});

export default router;
