import { Hono } from 'hono';
import type { AppVariables } from '../types';
import { authRequired } from '../middleware/auth';

const router = new Hono<{ Variables: AppVariables }>();

// GET /api/v1/collections
// Get the authenticated user's saved card collection
router.get('/', authRequired, async (c) => {
  const userId = c.get('userId') as string;

  // TODO: implement with real DB
  // const saved = await db
  //   .select({ asset: cardAssets })
  //   .from(savedCards)
  //   .innerJoin(cardAssets, eq(cardAssets.id, savedCards.cardAssetId))
  //   .where(eq(savedCards.userId, userId))
  //   .orderBy(desc(savedCards.createdAt));
  // return c.json({ items: saved, total: saved.length });

  return c.json({ items: [], total: 0, userId });
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

  // TODO: implement with real DB
  // Verify card exists
  // const [card] = await db.select({ id: cardAssets.id }).from(cardAssets).where(eq(cardAssets.id, cardAssetId)).limit(1);
  // if (!card) return c.json({ error: 'Card not found' }, 404);
  // try {
  //   await db.insert(savedCards).values({ userId, cardAssetId });
  // } catch (e: unknown) {
  //   if ((e as { code?: string }).code === '23505') return c.json({ error: 'Already saved' }, 409);
  //   throw e;
  // }
  // return c.json({ saved: true, cardAssetId }, 201);

  return c.json({ saved: true, cardAssetId }, 201);
});

// DELETE /api/v1/collections/save/:cardAssetId
// Unsave / remove a card from the user's collection
router.delete('/save/:cardAssetId', authRequired, async (c) => {
  const userId = c.get('userId') as string;
  const { cardAssetId } = c.req.param();

  // TODO: implement with real DB
  // await db.delete(savedCards).where(and(eq(savedCards.userId, userId), eq(savedCards.cardAssetId, cardAssetId)));

  return c.json({ saved: false, cardAssetId });
});

// GET /api/v1/collections/watchlist
// Get the authenticated user's battle watchlist
router.get('/watchlist', authRequired, async (c) => {
  const userId = c.get('userId') as string;

  // TODO: implement with real DB
  // const watchlist = await db
  //   .select({ battle: battles, leftAsset: cardAssets, rightAsset: cardAssets })
  //   .from(watchedBattles)
  //   .innerJoin(battles, eq(battles.id, watchedBattles.battleId))
  //   .where(eq(watchedBattles.userId, userId))
  //   .orderBy(desc(watchedBattles.createdAt));
  // return c.json({ items: watchlist, total: watchlist.length });

  return c.json({ items: [], total: 0, userId });
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

  // TODO: implement with real DB
  // Verify battle exists
  // const [battle] = await db.select({ id: battles.id }).from(battles).where(eq(battles.id, battleId)).limit(1);
  // if (!battle) return c.json({ error: 'Battle not found' }, 404);
  // try {
  //   await db.insert(watchedBattles).values({ userId, battleId });
  // } catch (e: unknown) {
  //   if ((e as { code?: string }).code === '23505') return c.json({ error: 'Already watching' }, 409);
  //   throw e;
  // }
  // return c.json({ watching: true, battleId }, 201);

  return c.json({ watching: true, battleId }, 201);
});

// DELETE /api/v1/collections/watchlist/:battleId
// Remove a battle from the user's watchlist
router.delete('/watchlist/:battleId', authRequired, async (c) => {
  const userId = c.get('userId') as string;
  const { battleId } = c.req.param();

  // TODO: implement with real DB
  // await db.delete(watchedBattles).where(and(eq(watchedBattles.userId, userId), eq(watchedBattles.battleId, battleId)));

  return c.json({ watching: false, battleId });
});

export default router;
